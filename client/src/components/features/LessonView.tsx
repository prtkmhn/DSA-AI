import { useState } from "react";
import { Unit } from "@/lib/types";
import { useStore } from "@/lib/store";
import { ParsonsProblem } from "./ParsonsProblem";
import { LeetCodeView } from "./LeetCodeView";
// import { UniversalVisualizer } from "../visualizations/UniversalVisualizer"; // Re-enable when visualization step is ready
import { ChevronRight, ArrowLeft, Zap, Sparkles, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import confetti from "canvas-confetti";
import ReactMarkdown from "react-markdown";
import { generateAIContent } from "@/lib/ai";
import { toast } from "@/hooks/use-toast";
import { buildLessonHintPrompt } from "@/lib/prompts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface LessonViewProps {
  unit: Unit;
}

export function LessonView({ unit }: LessonViewProps) {
  const [step, setStep] = useState(0); // 0..N slides -> Visualization (optional) -> Faded Parsons -> Complete
  const { completeUnit, unlockUnit, aiSettings, updateUnit } = useStore();
  const [, setLocation] = useLocation();
  const [practiceMode, setPracticeMode] = useState<'parsons' | 'code'>('parsons');

  const slides = unit.lesson.slides;
  // Add visualization step if unit has visualizationSteps
  // Visualization step disabled. To re-enable, restore:
  // const hasVisualization = unit.visualizationSteps && unit.visualizationSteps.length > 0;
  const hasVisualization = false;
  const totalSteps = slides.length + (hasVisualization ? 2 : 1); // +1 Visualization (optional), +1 Faded Parsons

  const progress = ((step + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleFinish = () => {
    confetti();
    completeUnit(unit.id);
    if (unit.id === 'two-sum') unlockUnit('valid-parens');

    setTimeout(() => setLocation('/'), 2000);
  };

  // AI Hint State
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);

  const handleAskAI = async (context: string) => {
    if (!aiSettings.geminiKey && !aiSettings.groqKey) {
      toast({
        title: "AI Not Configured",
        description: "Please add an API key in Settings to use AI features.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingHint(true);
    setAiHint(null);
    try {
      const prompt = buildLessonHintPrompt(unit.title, context);
      const result = await generateAIContent(prompt);

      if (result.error) {
        toast({ title: "AI Error", description: result.error, variant: "destructive" });
      } else {
        setAiHint(result.text);
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate hint.", variant: "destructive" });
    } finally {
      setIsGeneratingHint(false);
    }
  };

  // Persist fixed parsons blocks to the store
  const handleProblemFixed = (fixedData: any) => {
    const parsonsUpdate: any = { ...unit.parsons };
    if (fixedData.blocks) parsonsUpdate.blocks = fixedData.blocks;
    if (fixedData.title) parsonsUpdate.title = fixedData.title;
    if (fixedData.description) parsonsUpdate.description = fixedData.description;

    const unitUpdates: any = { parsons: parsonsUpdate };
    if (fixedData.testHarness && unit.toyExample) {
      unitUpdates.toyExample = { ...unit.toyExample, testHarness: fixedData.testHarness };
    }
    if (fixedData.testCases) {
      unitUpdates.testCases = fixedData.testCases;
    }

    updateUnit(unit.id, unitUpdates);
  };

  // Render Logic
  const renderContent = () => {
    // 1. Lesson Slides
    if (step < slides.length) {
      const slide = slides[step];
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-brand-primary/10 inline-flex px-3 py-1 rounded-full text-brand-primary text-xs font-bold uppercase tracking-wider">
            {slide.type}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{slide.title}</h1>
          <div className="prose prose-lg text-gray-600">
            <ReactMarkdown>{slide.content}</ReactMarkdown>
          </div>
          {slide.codeSnippet && (
            <div className="bg-gray-900 text-gray-100 p-4 rounded-xl font-mono text-sm overflow-x-auto shadow-lg border border-gray-800">
              <pre>{slide.codeSnippet}</pre>
            </div>
          )}

          {/* AI Helper Button */}
          <div className="mt-4">
             {!aiHint ? (
               <button
                 onClick={() => handleAskAI(slide.content)}
                 disabled={isGeneratingHint}
                 className="flex items-center gap-2 text-sm text-brand-secondary font-bold hover:text-brand-secondary-dark transition-colors"
               >
                 {isGeneratingHint ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                 {isGeneratingHint ? "Asking AI..." : "Explain this to me differently"}
               </button>
             ) : (
               <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-4 rounded-xl mt-4 animate-in fade-in">
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-1">
                     <Zap size={12} fill="currentColor" /> AI Explanation
                   </span>
                   <button onClick={() => setAiHint(null)} className="text-gray-400 hover:text-gray-600">
                     <span className="sr-only">Close</span>
                     &times;
                   </button>
                 </div>
                 <p className="text-sm text-indigo-900 leading-relaxed">{aiHint}</p>
               </div>
             )}
          </div>

          <button
            onClick={handleNext}
            className="w-full bg-brand-primary text-white font-bold text-lg py-4 rounded-xl mt-8 shadow-brand hover:bg-brand-primary-dark transition-colors btn-press flex items-center justify-center gap-2"
          >
            Continue <ChevronRight />
          </button>
        </div>
      );
    }

    // 2. Visualization Step (if unit has visualizationSteps)
    if (hasVisualization && step === slides.length) {
      return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 p-1 rounded">Watch</span>
              See How It Works
            </h2>
            <p className="text-gray-600 text-sm">Step through the algorithm to understand how it solves the problem.</p>
          </div>
          <UniversalVisualizer
            steps={unit.visualizationSteps!}
            title={unit.title}
          />
          <button
            onClick={handleNext}
            className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-lg shadow-lg hover:bg-brand-primary-dark transition-all btn-press"
          >
            Continue to Practice →
          </button>
        </div>
      );
    }

    // 3. Practice Step (Parsons or Code Editor)
    const parsonsStepIndex = hasVisualization ? slides.length + 1 : slides.length;
    if (step === parsonsStepIndex) {
      return (
        <div className="animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-700 p-1 rounded">Build it</span>
              {unit.parsons.title}
            </h2>
            <p className="text-gray-600 text-sm">{unit.parsons.description}</p>
          </div>

          <Tabs value={practiceMode} onValueChange={(v) => setPracticeMode(v as 'parsons' | 'code')} className="mb-4">
            <TabsList>
              <TabsTrigger value="parsons">Parsons Blocks</TabsTrigger>
              <TabsTrigger value="code">Code Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="parsons">
              <ParsonsProblem
                problem={unit.parsons}
                unitTitle={unit.title}
                mainProblem={unit.mainProblem}
                testHarness={unit.toyExample?.testHarness}
                testCases={unit.testCases}
                solution={unit.toyExample?.solution}
                onComplete={handleFinish}
                unitId={unit.id}
                onProblemFixed={handleProblemFixed}
              />
            </TabsContent>

            <TabsContent value="code">
              <LeetCodeView unit={unit} onComplete={handleFinish} />
            </TabsContent>
          </Tabs>
        </div>
      );
    }
  };

  const isCodeMode = practiceMode === 'code' && step === (hasVisualization ? slides.length + 1 : slides.length);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
        <Link href="/">
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={24} />
          </button>
        </Link>
        <div className="flex-1 mx-6 bg-gray-100 h-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className={isCodeMode ? "mx-auto h-full" : "max-w-xl mx-auto h-full"}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
