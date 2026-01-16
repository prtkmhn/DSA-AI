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

  try {
    // pyodide.runPython returns a proxy to the result (list of dicts)
    const resultProxy = await pyodide.runPythonAsync(fullCode);
    const results = resultProxy.toJs();
    resultProxy.destroy();

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
