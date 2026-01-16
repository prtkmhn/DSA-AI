import { useState } from "react";
import { Unit } from "@/lib/types";
import { useStore } from "@/lib/store";
import { CodeVerifier } from "./CodeVerifier";
import { ParsonsProblem } from "./ParsonsProblem";
import { ChevronRight, ArrowLeft, CheckCircle2, Zap, Sparkles, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { clsx } from "clsx";
import confetti from "canvas-confetti";
import ReactMarkdown from "react-markdown";
import { generateAIContent } from "@/lib/ai";
import { toast } from "@/hooks/use-toast";

interface LessonViewProps {
  unit: Unit;
}

export function LessonView({ unit }: LessonViewProps) {
  const [step, setStep] = useState(0); // 0..N slides -> Toy Example -> Parsons -> Complete
  const { completeUnit, unlockUnit, aiSettings } = useStore();
  const [, setLocation] = useLocation();

  const slides = unit.lesson.slides;
  const totalSteps = slides.length + 2; // +1 Toy, +1 Parsons

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
      const prompt = `Explain the concept of "${unit.title}" specifically regarding: ${context}. Keep it brief, encouraging, and use a simple analogy.`;
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

    // 2. Toy Example (Coding)
    if (step === slides.length) {
      return (
        <div className="h-full flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-2">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="bg-purple-100 text-purple-700 p-1 rounded">Try it</span>
              {unit.toyExample.title}
            </h2>
            <p className="text-gray-600 text-sm">{unit.toyExample.description}</p>
          </div>
          <div className="flex-1 min-h-[400px]">
            <CodeVerifier 
              starterCode={unit.toyExample.starterCode} 
              testHarness={unit.toyExample.testHarness}
              onSuccess={() => setTimeout(handleNext, 1500)} 
            />
          </div>
        </div>
      );
    }

    // 3. Parsons Problem
    if (step === slides.length + 1) {
      return (
        <div className="animate-in fade-in zoom-in-95 duration-500">
           <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-700 p-1 rounded">Build it</span>
              {unit.parsons.title}
            </h2>
          </div>
          <ParsonsProblem 
            problem={unit.parsons} 
            onComplete={handleFinish} 
          />
        </div>
      );
    }
  };

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
        <div className="max-w-xl mx-auto h-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
