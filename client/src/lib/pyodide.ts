import { TestResult } from './types';

// Global type augmentation
declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<any>;
    pyodideInstance: any;
  }
}

let pyodideReadyPromise: Promise<any> | null = null;

export async function getPyodide() {
  if (window.pyodideInstance) return window.pyodideInstance;
  
  if (!pyodideReadyPromise) {
    pyodideReadyPromise = (async () => {
      // @ts-ignore
      const pyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/"
      });
      window.pyodideInstance = pyodide;
      return pyodide;
    })();
  }
  
  return pyodideReadyPromise;
}

export async function runPythonTests(userCode: string, testHarness: string): Promise<TestResult> {
  const pyodide = await getPyodide();

  // Combine user code and test harness
  const fullCode = `${userCode}

${testHarness}

run_tests()
`;

  console.log('[Pyodide] Full code to execute:\n', fullCode);

  try {
    // pyodide.runPython returns a proxy to the result (list of dicts)
    const resultProxy = await pyodide.runPythonAsync(fullCode);

    // IMPORTANT: Convert Python dicts to plain JS objects
    // Pyodide 0.25+ converts dicts to Map by default, we need plain objects
    const rawResults = resultProxy.toJs({ dict_converter: Object.fromEntries });
    resultProxy.destroy();

    console.log('[Pyodide] Raw results:', rawResults);

    // Ensure results is an array of plain objects with correct property names
    const results = Array.isArray(rawResults) ? rawResults.map((r: any) => ({
      input: r.input || r.get?.('input') || '',
      expected: r.expected || r.get?.('expected') || '',
      actual: r.actual || r.get?.('actual') || '',
      passed: r.passed ?? r.get?.('passed') ?? false,
      error: r.error || r.get?.('error')
    })) : [];

    console.log('[Pyodide] Processed results:', results);

    const passed = results.every((r: any) => r.passed);

    // Check if there was an internal exception caught by harness
    const errorResult = results.find((r: any) => r.actual === "Error");

    return {
      passed: passed && !errorResult,
      results: results,
      error: errorResult ? errorResult.error : undefined
    };

  } catch (err: any) {
    return {
      passed: false,
      results: [],
      error: err.toString()
    };
  }
}
