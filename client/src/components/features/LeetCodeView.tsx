import { useState } from "react";
import { Unit } from "@/lib/types";
import { CodeVerifier } from "./CodeVerifier";
import { ChatbotButton, ChatbotPanel, ChatbotContext } from "@/components/chatbot";
import { Badge } from "@/components/ui/badge";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { ExternalLink } from "lucide-react";

interface LeetCodeViewProps {
  unit: Unit;
  onComplete: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-green-100 text-green-700 border-green-200",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Hard: "bg-red-100 text-red-700 border-red-200",
};

export function LeetCodeView({ unit, onComplete }: LeetCodeViewProps) {
  const isMobile = useIsMobile();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const difficulty = unit.mainProblem?.difficulty || "Medium";
  const patterns = unit.mainProblem?.patterns || [];
  const externalLink = unit.mainProblem?.externalLink;

  // Build chatbot context for the code editor mode
  const chatbotContext: ChatbotContext = {
    problemTitle: unit.title,
    problemDescription: unit.parsons.description,
    blocks: 'blocks' in unit.parsons && unit.parsons.blocks
      ? unit.parsons.blocks.map((b) => ({
          id: b.id,
          text: b.text,
          indent: b.indent,
          isBlank: b.isBlank,
          placeholder: b.placeholder,
        }))
      : [],
    testCases: unit.testCases || [],
    testHarness: unit.toyExample?.testHarness || "",
  };

  const problemPanel = (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      {/* Title + Difficulty */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-xl font-bold text-gray-900">{unit.title}</h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[difficulty]}`}>
            {difficulty}
          </span>
        </div>

        {/* Pattern tags */}
        {patterns.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {patterns.map((p) => (
              <Badge key={p} variant="secondary" className="text-xs">
                {p}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Problem description */}
      <div className="prose prose-sm text-gray-700">
        <p>{unit.parsons.description}</p>
        {unit.toyExample?.description && (
          <p className="mt-2 text-gray-600">{unit.toyExample.description}</p>
        )}
      </div>

      {/* Test cases / examples */}
      {unit.testCases && unit.testCases.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-800">Examples</h3>
          {unit.testCases.map((tc, i) => (
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

      {/* External link */}
      {externalLink && (
        <a
          href={externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <ExternalLink size={14} />
          View on LeetCode
        </a>
      )}
    </div>
  );

  const editorPanel = (
    <div className="h-full">
      <CodeVerifier
        starterCode={unit.toyExample?.starterCode || "# Write your solution here\n"}
        testHarness={unit.toyExample?.testHarness || ""}
        onSuccess={onComplete}
      />
    </div>
  );

  if (isMobile) {
    // Stacked layout on mobile
    return (
      <div className="space-y-4">
        {problemPanel}
        <div className="h-[400px]">{editorPanel}</div>

        <ChatbotButton
          isOpen={isChatbotOpen}
          onClick={() => setIsChatbotOpen(!isChatbotOpen)}
        />
        <ChatbotPanel isOpen={isChatbotOpen} context={chatbotContext} />
      </div>
    );
  }

  // Desktop: resizable split panels
  return (
    <div className="h-[calc(100vh-220px)] min-h-[500px]">
      <ResizablePanelGroup direction="horizontal" className="rounded-xl border border-gray-200 overflow-hidden">
        <ResizablePanel defaultSize={40} minSize={25}>
          <div className="h-full bg-white">{problemPanel}</div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={60} minSize={35}>
          {editorPanel}
        </ResizablePanel>
      </ResizablePanelGroup>

      <ChatbotButton
        isOpen={isChatbotOpen}
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
      />
      <ChatbotPanel isOpen={isChatbotOpen} context={chatbotContext} />
    </div>
  );
}
