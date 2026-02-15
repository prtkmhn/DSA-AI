import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStore } from "@/lib/store";
import { Plus, Loader2, CheckCircle2, AlertTriangle, Play, Calendar, RefreshCw, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { Link } from "wouter";
import { generateAIContent, GenerateOptions } from "@/lib/ai";
import { AI_CONFIG } from "@/lib/config";
import { toast } from "@/hooks/use-toast";
import { Unit } from "@/lib/types";
import { buildUnitGenerationPrompt } from "@/lib/prompts";

export default function TrackPage() {
  const { trackedProblems, addTrackedProblem, updateProblemStatus, removeTrackedProblem, aiSettings, addUnit, unlockUnit } = useStore();
  const [topicInput, setTopicInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const parseAIUnit = (text: string): Unit | null => {
    try {
      // Strip ```json ... ``` code fences that AI models often wrap around JSON
      const cleaned = text.replace(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/g, '$1').trim();

      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start === -1 || end === -1) {
        console.error("[parseAIUnit] No JSON object found in response. Text preview:", text.substring(0, 200));
        return null;
      }

      const jsonStr = cleaned.substring(start, end + 1);
      console.log("[parseAIUnit] Extracted JSON length:", jsonStr.length);

      const data = JSON.parse(jsonStr);

      // Validate required fields
      const missingFields = [];
      if (!data.id) missingFields.push('id');
      if (!data.title) missingFields.push('title');
      if (!data.lesson) missingFields.push('lesson');
      if (!data.parsons) missingFields.push('parsons');
      if (!data.parsons?.blocks) missingFields.push('parsons.blocks');

      if (missingFields.length > 0) {
        console.error("[parseAIUnit] Missing required fields:", missingFields.join(', '));
        console.log("[parseAIUnit] Received fields:", Object.keys(data).join(', '));
        return null;
      }

      return data as Unit;
    } catch (e) {
      console.error("[parseAIUnit] JSON parse error:", e);
      console.error("[parseAIUnit] Text that failed to parse:", text.substring(0, 500));
      return null;
    }
  };

  const handleCreate = async () => {
    if (!topicInput.trim()) return;
    if (!aiSettings.geminiKey && !aiSettings.groqKey) {
      toast({
        title: "AI Not Configured",
        description: "Please configure AI keys in Settings first.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    const problemId = addTrackedProblem(topicInput);
    const topic = topicInput;
    setTopicInput("");

    try {
      const prompt = buildUnitGenerationPrompt(topic);

      console.log('[TrackPage] Starting AI generation for topic:', topic);
      const result = await generateAIContent(prompt, {
        model: AI_CONFIG.chatbotModel,  // gemini-3-pro-preview (more capable)
        useGrounding: true,              // let the model search the web for LeetCode data
      });

      if (result.error) {
        console.error('[TrackPage] AI generation error:', result.error);
        throw new Error(result.error);
      }

      console.log('[TrackPage] AI response received, length:', result.text.length);
      console.log('[TrackPage] AI response preview:', result.text.substring(0, 500));

      const unit = parseAIUnit(result.text);
      if (!unit) {
        console.error('[TrackPage] Failed to parse unit. Full response:', result.text);
        // Try to give a more helpful error message
        const hasJson = result.text.includes('{') && result.text.includes('}');
        if (!hasJson) {
          throw new Error("Could not find this problem — AI returned text instead of JSON. Check the problem name and try again.");
        }
        throw new Error("AI response missing required fields (id, title, lesson, parsons.blocks). Try a different problem name or check console for details.");
      }

      console.log('[TrackPage] Successfully parsed unit:', unit.id, unit.title);

      addUnit(unit);
      unlockUnit(unit.id);
      updateProblemStatus(problemId, 'verified', unit.id);

      // Persist to database for refresh resilience
      try {
        await fetch('/api/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unitId: unit.id, unitData: unit })
        });
      } catch (dbError) {
        console.warn("Failed to persist unit to database:", dbError);
        // Non-critical: unit is still in Zustand store
      }

      toast({
        title: "Unit Created!",
        description: `Generated "${unit.title}" successfully.`,
      });

    } catch (e: unknown) {
      const error = e as Error;
      console.error("Generation failed:", error);
      updateProblemStatus(problemId, 'needs_fix');
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRetry = (problem: typeof trackedProblems[0]) => {
    setTopicInput(problem.topic);
  };

  return (
    <MobileLayout>
      <div className="flex flex-col h-full bg-gray-50">
        <header className="px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-gray-900">Track Progress</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary">
                <Plus size={20} />
              </div>
              <h2 className="font-bold text-lg">AI Problem Creator</h2>
            </div>
            
            <p className="text-sm text-gray-500">
              Enter a LeetCode problem slug or topic and AI will generate a complete learning unit.
            </p>

            <div className="flex gap-2">
              <input 
                type="text"
                placeholder='e.g. "two-sum", "container-with-most-water", "Sliding Window"'
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
                onKeyDown={(e) => e.key === 'Enter' && !isCreating && handleCreate()}
                disabled={isCreating}
                data-testid="input-topic"
              />
              <button 
                onClick={handleCreate}
                disabled={isCreating || !topicInput}
                className={clsx(
                  "px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center min-w-12",
                  isCreating || !topicInput ? "bg-gray-300" : "bg-brand-primary hover:bg-brand-primary-dark active:scale-95"
                )}
                data-testid="button-create"
              >
                {isCreating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              Your Queue
            </h3>
            
            {trackedProblems.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No problems tracked yet. Try creating one!
              </div>
            ) : (
              trackedProblems.map((problem) => (
                <div 
                  key={problem.id} 
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between"
                  data-testid={`problem-${problem.id}`}
                >
                  <div>
                    <h4 className="font-bold text-gray-800">{problem.topic}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {problem.status === 'generating' && (
                        <span className="text-xs text-orange-500 flex items-center gap-1 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                          <Loader2 size={10} className="animate-spin" /> Generating...
                        </span>
                      )}
                      {problem.status === 'needs_fix' && (
                        <span className="text-xs text-red-500 flex items-center gap-1 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={10} /> Failed
                        </span>
                      )}
                      {problem.status === 'verified' && (
                        <span className="text-xs text-green-600 flex items-center gap-1 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={10} /> Ready
                        </span>
                      )}
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-400">
                        {new Date(problem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {problem.status === 'needs_fix' && (
                      <button
                        onClick={() => handleRetry(problem)}
                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-orange-100 hover:text-orange-500 transition-all"
                        data-testid={`button-retry-${problem.id}`}
                      >
                        <RefreshCw size={18} />
                      </button>
                    )}

                    {problem.unitId && (
                      <Link href={`/unit/${problem.unitId}`}>
                        <button
                          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-white transition-all"
                          data-testid={`button-play-${problem.id}`}
                        >
                          <Play size={18} fill="currentColor" />
                        </button>
                      </Link>
                    )}

                    {/* Delete button - always visible except when generating */}
                    {problem.status !== 'generating' && (
                      <button
                        onClick={() => removeTrackedProblem(problem.id)}
                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-100 hover:text-red-500 transition-all"
                        data-testid={`button-delete-${problem.id}`}
                        title="Delete from queue"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
