import { useState } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-python";
import { Play, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { runPythonTests } from "@/lib/pyodide";
import { TestResult } from "@/lib/types";
import { clsx } from "clsx";

interface CodeVerifierProps {
  starterCode: string;
  testHarness: string;
  onSuccess?: () => void;
}

export function CodeVerifier({ starterCode, testHarness, onSuccess }: CodeVerifierProps) {
  const [code, setCode] = useState(starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await runPythonTests(code, testHarness);
      setResult(res);
      if (res.passed && onSuccess) {
        onSuccess();
      }
    } catch (e) {
      setResult({ passed: false, results: [], error: "Runtime Error" });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-950 border-b border-gray-800">
        <span className="text-xs font-mono text-gray-400">main.py</span>
        <button
          onClick={handleRun}
          disabled={isRunning}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
            isRunning ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-brand-primary text-white hover:bg-brand-primary-dark"
          )}
        >
          {isRunning ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
          {isRunning ? "Running..." : "Run"}
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-[#1d1f21] font-mono text-sm">
        <Editor
          value={code}
          onValueChange={setCode}
          highlight={(code) => highlight(code, languages.python, "python")}
          padding={16}
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 14,
            minHeight: "100%",
          }}
          className="min-h-full text-gray-100"
        />
      </div>

      {result && (
        <div className={clsx(
          "max-h-[40%] overflow-y-auto border-t p-4 space-y-3",
          result.passed ? "bg-green-900/20 border-green-900/50" : "bg-red-900/20 border-red-900/50"
        )}>
          <div className="flex items-center gap-2 font-bold mb-2">
            {result.passed ? (
              <span className="text-green-400 flex items-center gap-2"><CheckCircle size={16} /> All Tests Passed!</span>
            ) : (
              <span className="text-red-400 flex items-center gap-2"><XCircle size={16} /> Tests Failed</span>
            )}
          </div>

          {result.error && (
            <div className="p-3 bg-red-950/50 rounded border border-red-900/50 text-red-200 font-mono text-xs whitespace-pre-wrap">
              {result.error}
            </div>
          )}

          <div className="space-y-2">
            {result.results.map((r, i) => (
              <div key={i} className={clsx(
                "p-2 rounded text-xs font-mono border",
                r.passed ? "bg-green-950/30 border-green-900/30 text-green-100" : "bg-red-950/30 border-red-900/30 text-red-100"
              )}>
                <div className="opacity-70 mb-1">Input: {r.input}</div>
                <div className="flex justify-between">
                  <span>Exp: {r.expected}</span>
                  <span className={r.passed ? "text-green-400" : "text-red-400"}>Got: {r.actual}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
