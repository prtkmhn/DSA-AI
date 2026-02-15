import { Reorder } from "framer-motion";
import { useState } from "react";
import { ParsonsProblem as ParsonsType, FadedParsonsSpec, TestResult, MainProblemMetadata } from "@/lib/types";
import { clsx } from "clsx";
import { GripVertical, Play, Loader2, CheckCircle, XCircle, ExternalLink, Eye } from "lucide-react";
import confetti from "canvas-confetti";
import { runPythonTests } from "@/lib/pyodide";
import { ChatbotButton, ChatbotPanel, ChatbotContext } from "@/components/chatbot";
import { Badge } from "@/components/ui/badge";

// Unified item type for both legacy segments and new blocks
interface ParsedItem {
  id: string;
  code: string;        // Display text (or empty for blanks)
  indent: number;
  isDistractor?: boolean;
  isBlank?: boolean;
  placeholder?: string;
  answer?: string;     // Correct code for blank lines
}

interface ParsonsProblemProps {
  problem: ParsonsType | FadedParsonsSpec;
  unitTitle?: string;
  mainProblem?: MainProblemMetadata;
  testHarness?: string; // Python test harness code
  testCases?: Array<{ input: any; expected: any }>; // For chatbot context
  solution?: string; // toyExample.solution — fallback for blank answers
  onComplete: () => void;
  stage?: number;
  unitId?: string;
  onProblemFixed?: (fixedParsons: any) => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Hard: "bg-red-100 text-red-700 border-red-200",
};

export function ParsonsProblem({ problem, unitTitle, mainProblem, testHarness, testCases = [], solution, onComplete, stage = 0, unitId, onProblemFixed }: ParsonsProblemProps) {
  const useDistractors = stage > 0;
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // State for current problem (can be updated by AI regeneration)
  const [currentProblem, setCurrentProblem] = useState({
    title: problem.title,
    description: problem.description,
    testHarness: testHarness || "",
    testCases: testCases,
  });

  // Convert problem to unified ParsedItem format
  const parseItems = (blocks?: any[]): ParsedItem[] => {
    const sourceBlocks = blocks || ('blocks' in problem && problem.blocks ? problem.blocks : null);
    if (sourceBlocks) {
      return sourceBlocks.map((block: any) => ({
        id: block.id,
        code: block.text || block.code || "",
        indent: block.indent,
        isDistractor: block.isDistractor,
        isBlank: block.isBlank,
        placeholder: block.placeholder,
        answer: block.answer,
      }));
    }
    if ('segments' in problem && problem.segments) {
      return problem.segments.map(seg => ({
        id: seg.id,
        code: seg.code,
        indent: seg.indent,
        isDistractor: seg.isDistractor,
        isBlank: false,
      }));
    }
    return [];
  };

  const [items, setItems] = useState<ParsedItem[]>(() => {
    let parsed = parseItems();
    if (!useDistractors) {
      parsed = parsed.filter(s => !s.isDistractor);
    }
    return parsed.sort(() => Math.random() - 0.5);
  });

  const [isCorrect, setIsCorrect] = useState(false);
  const [blankValues, setBlankValues] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Handle AI-generated new problem
  const handleRegenerate = (newProblem: any) => {
    console.log("[ParsonsProblem] Regenerating with new problem:", newProblem);

    // Update problem metadata
    setCurrentProblem({
      title: newProblem.title || "New Problem",
      description: newProblem.description || "",
      testHarness: newProblem.testHarness || currentProblem.testHarness,
      testCases: newProblem.testCases || currentProblem.testCases,
    });

    // Parse and shuffle new blocks
    const newItems = parseItems(newProblem.blocks);
    setItems(newItems.sort(() => Math.random() - 0.5));

    // Reset state
    setBlankValues({});
    setIsCorrect(false);
    setTestResult(null);
  };

  // Assemble code from blocks
  const assembleCode = (): string => {
    return items.map(item => {
      const indent = '    '.repeat(item.indent);
      const code = item.isBlank ? (blankValues[item.id] || '') : item.code;
      return indent + code;
    }).join('\n');
  };

  // Show Solution: reorder blocks and fill in blanks
  const handleSolve = () => {
    // 1. Determine correct block order
    const getCorrectOrder = (): ParsedItem[] => {
      if ('blocks' in problem && problem.blocks) {
        const ordered = problem.blocks.filter(b => !b.isDistractor).map(b => b.id);
        return ordered.map(id => items.find(i => i.id === id)!).filter(Boolean);
      }
      if ('solution_order' in problem && problem.solution_order) {
        return problem.solution_order.map(id => items.find(i => i.id === id)!).filter(Boolean);
      }
      if ('segments' in problem && problem.segments) {
        const ordered = problem.segments.filter(s => !s.isDistractor).map(s => s.id);
        return ordered.map(id => items.find(i => i.id === id)!).filter(Boolean);
      }
      return items;
    };

    const correctOrder = getCorrectOrder();
    setItems(correctOrder);

    // 2. Fill in blank values with three-level fallback
    const newBlankValues: Record<string, string> = {};

    // Build solution line lookup for fallback 3
    const solutionLines = solution
      ? solution.split('\n').filter(l => l.trim().length > 0)
      : [];

    for (const item of correctOrder) {
      if (!item.isBlank) continue;

      // Fallback 1: block.answer (AI-generated units with embedded answers)
      if (item.answer) {
        newBlankValues[item.id] = item.answer;
        continue;
      }

      // Fallback 2: segments[id].code (seed data units)
      if ('segments' in problem && problem.segments) {
        const seg = problem.segments.find(s => s.id === item.id);
        if (seg?.code) {
          newBlankValues[item.id] = seg.code;
          continue;
        }
      }

      // Fallback 3: toyExample.solution line matching (older AI units)
      if (solutionLines.length > 0) {
        const blockIndex = correctOrder.indexOf(item);
        if (blockIndex >= 0 && blockIndex < solutionLines.length) {
          // Strip leading whitespace to get just the code (indent is handled by the component)
          newBlankValues[item.id] = solutionLines[blockIndex].trim();
        }
      }
    }

    setBlankValues(newBlankValues);
  };

  // Run tests with Pyodide
  const handleRunTests = async () => {
    if (!currentProblem.testHarness) {
      // Fallback to order-only check if no test harness
      checkOrderOnly();
      return;
    }

    setIsRunning(true);
    setTestResult(null);

    try {
      const code = assembleCode();
      console.log('[Parsons] Assembled code:\n', code);

      const result = await runPythonTests(code, currentProblem.testHarness);
      setTestResult(result);

      if (result.passed) {
        setIsCorrect(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(onComplete, 1500);
      }
    } catch (e) {
      console.error('[Parsons] Test execution failed:', e);
      setTestResult({
        passed: false,
        results: [],
        error: `Execution error: ${String(e)}`
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Fallback: Check order only (no Python execution)
  const checkOrderOnly = () => {
    const getCorrectSequence = (): string[] => {
      if ('blocks' in problem && problem.blocks) {
        return problem.blocks.filter(b => !b.isDistractor).map(b => b.id);
      }
      if ('segments' in problem && problem.segments) {
        return problem.segments.filter(s => !s.isDistractor).map(s => s.id);
      }
      return [];
    };

    const correctSequence = getCorrectSequence();
    const currentSequence = items.map(s => s.id);
    const orderCorrect = JSON.stringify(correctSequence) === JSON.stringify(currentSequence);

    const blanksToFill = items.filter(i => i.isBlank);
    const allBlanksFilled = blanksToFill.every(i => blankValues[i.id]?.trim().length > 0);
    const blanksValid = blanksToFill.length === 0 || allBlanksFilled;

    if (orderCorrect && blanksValid) {
      setIsCorrect(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setTimeout(onComplete, 1500);
    } else {
      const btn = document.getElementById("check-btn");
      btn?.classList.add("animate-shake");
      setTimeout(() => btn?.classList.remove("animate-shake"), 500);
    }
  };

  // Handle fix from AI chatbot (reuses handleRegenerate logic)
  const handleFixProblem = (fixedData: any) => {
    console.log("[ParsonsProblem] Fixing with new blocks:", fixedData);
    handleRegenerate(fixedData);
    // Persist the fix to the store so it survives page reloads
    if (onProblemFixed) {
      onProblemFixed(fixedData);
    }
  };

  // Build chatbot context (includes current test errors for AI help)
  const chatbotContext: ChatbotContext = {
    problemTitle: currentProblem.title,
    problemDescription: currentProblem.description,
    blocks: items.map(item => ({
      id: item.id,
      text: item.code,
      indent: item.indent,
      isBlank: item.isBlank,
      placeholder: item.placeholder,
    })),
    testCases: currentProblem.testCases,
    testHarness: currentProblem.testHarness,
    // Pass current test error for context-aware help
    testError: testResult?.error,
    testResults: testResult?.results,
    // Pass actual user code so AI tutor can see what user typed
    assembledCode: assembleCode(),
    blankValues,
  };

  return (
    <div className="space-y-6">
      {(mainProblem || testCases.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-gray-900">{mainProblem?.title || unitTitle || "Problem"}</h3>
              {mainProblem?.difficulty && (
                <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full border", DIFFICULTY_COLORS[mainProblem.difficulty] || DIFFICULTY_COLORS.Medium)}>
                  {mainProblem.difficulty}
                </span>
              )}
            </div>
            {mainProblem?.patterns?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {mainProblem.patterns.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                ))}
              </div>
            ) : null}
          </div>

          {testCases.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-800">Examples</h4>
              {testCases.slice(0, 3).map((tc, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200 font-mono text-xs space-y-1">
                  <div>
                    <span className="text-gray-500">Input: </span>
                    <span className="text-gray-800">{JSON.stringify(tc.input)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Expected: </span>
                    <span className="text-gray-800">{JSON.stringify(tc.expected)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mainProblem?.externalLink && (
            <a
              href={mainProblem.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <ExternalLink size={14} />
              View on LeetCode
            </a>
          )}
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
        {currentProblem.description}
      </div>

      <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
        {items.map((item) => (
          <Reorder.Item key={item.id} value={item}>
            <div className={clsx(
              "flex items-center gap-3 p-3 bg-white border-2 rounded-xl shadow-sm active:cursor-grabbing cursor-grab touch-none select-none transition-colors",
              isCorrect ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-brand-secondary/50",
              item.isDistractor && stage > 0 && "border-dashed" // Visual hint for dev/debug
            )}>
              <GripVertical className="text-gray-300 flex-shrink-0" size={20} />
              <div className="flex-1 font-mono text-sm text-gray-800" style={{ paddingLeft: `${item.indent * 1.5}rem` }}>
                {item.isBlank ? (
                  // Faded Parsons: Render input for blank lines
                  <input
                    type="text"
                    placeholder={item.placeholder || "Fill in the blank..."}
                    value={blankValues[item.id] || ""}
                    onChange={(e) => {
                      e.stopPropagation();
                      setBlankValues({ ...blankValues, [item.id]: e.target.value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={clsx(
                      "w-full px-3 py-1.5 rounded border-b-2 border-gray-400 bg-gray-100 font-mono text-sm",
                      "focus:outline-none focus:border-brand-primary focus:bg-yellow-50",
                      "placeholder:text-gray-400 placeholder:italic",
                      isCorrect && "bg-green-100 border-green-500"
                    )}
                    disabled={isCorrect}
                    style={{ minWidth: '120px' }}
                  />
                ) : (
                  // Regular code line
                  item.code
                )}
              </div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Test Results */}
      {testResult && (
        <div className={clsx(
          "p-4 rounded-xl border-2",
          testResult.passed ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500"
        )}>
          <div className="flex items-center gap-2 font-bold mb-3">
            {testResult.passed ? (
              <span className="text-green-600 flex items-center gap-2">
                <CheckCircle size={20} /> All Tests Passed!
              </span>
            ) : (
              <span className="text-red-600 flex items-center gap-2">
                <XCircle size={20} /> Tests Failed
              </span>
            )}
          </div>

          {testResult.error && (
            <div className="p-3 bg-red-100 rounded-lg border border-red-200 text-red-800 font-mono text-xs mb-3 whitespace-pre-wrap">
              {testResult.error}
            </div>
          )}

          {testResult.results.length > 0 && (
            <div className="space-y-2">
              {testResult.results.map((r, i) => (
                <div key={i} className={clsx(
                  "p-3 rounded-lg text-sm font-mono border",
                  r.passed ? "bg-green-100 border-green-200" : "bg-red-100 border-red-200"
                )}>
                  <div className="text-gray-600 mb-1">Input: {r.input}</div>
                  <div className="flex justify-between gap-4">
                    <span>Expected: <strong>{r.expected}</strong></span>
                    <span className={r.passed ? "text-green-600" : "text-red-600"}>
                      Got: <strong>{r.actual}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Run Tests Button */}
      <button
        id="check-btn"
        onClick={handleRunTests}
        disabled={isCorrect || isRunning}
        className={clsx(
          "w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all btn-press flex items-center justify-center gap-2",
          isCorrect
            ? "bg-green-500 text-white"
            : isRunning
              ? "bg-gray-400 text-white cursor-wait"
              : "bg-brand-secondary text-white hover:bg-brand-secondary-dark"
        )}
      >
        {isRunning ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Running Tests...
          </>
        ) : isCorrect ? (
          <>
            <CheckCircle size={20} />
            Correct!
          </>
        ) : (
          <>
            <Play size={20} />
            Run Tests
          </>
        )}
      </button>

      {/* Show Solution Button */}
      <button
        onClick={handleSolve}
        disabled={isCorrect}
        className={clsx(
          "w-full py-3 rounded-xl font-semibold text-sm border-2 flex items-center justify-center gap-2 transition-all",
          isCorrect
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-300 text-gray-600 hover:border-brand-secondary hover:text-brand-secondary"
        )}
      >
        <Eye size={18} />
        Show Solution
      </button>

      {/* AI Chatbot */}
      <ChatbotButton
        isOpen={isChatbotOpen}
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
      />
      <ChatbotPanel
        isOpen={isChatbotOpen}
        context={chatbotContext}
        onRegenerate={handleRegenerate}
        onFixProblem={handleFixProblem}
      />
    </div>
  );
}
