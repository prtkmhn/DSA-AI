import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStore } from "@/lib/store";
import { Plus, Loader2, CheckCircle2, AlertTriangle, Play, Calendar } from "lucide-react";
import { clsx } from "clsx";
import { Link } from "wouter";
import { generateAIContent } from "@/lib/ai";
import { toast } from "@/hooks/use-toast";

export default function TrackPage() {
  const { trackedProblems, addTrackedProblem, updateProblemStatus, aiSettings } = useStore();
  const [topicInput, setTopicInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!topicInput.trim()) return;
    if (!aiSettings.geminiKey && !aiSettings.groqKey) {
      toast({
        title: "AI Not Configured",
        description: "Please configure AI keys in Settings to create problems.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    addTrackedProblem(topicInput);
    
    // Simulate generation delay (Real AI generation would hook in here)
    // For MVP, we'll just show the UI state
    setTimeout(() => {
      // In a real app, we'd generate the Unit data here and save it to store
      setIsCreating(false);
      setTopicInput("");
    }, 1500);
  };

  return (
    <MobileLayout>
      <div className="flex flex-col h-full bg-gray-50">
        <header className="px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-gray-900">Track Progress</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* AI Problem Creator */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary">
                <Plus size={20} />
              </div>
              <h2 className="font-bold text-lg">AI Problem Creator</h2>
            </div>
            
            <p className="text-sm text-gray-500">
              Enter a topic (e.g. "Sliding Window") and AI will generate a complete learning unit.
            </p>

            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="e.g. Binary Search, DFS..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <button 
                onClick={handleCreate}
                disabled={isCreating || !topicInput}
                className={clsx(
                  "px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center",
                  isCreating || !topicInput ? "bg-gray-300" : "bg-brand-primary hover:bg-brand-primary-dark btn-press"
                )}
              >
                {isCreating ? <Loader2 className="animate-spin" /> : <Plus />}
              </button>
            </div>
          </div>

          {/* Problem List */}
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
                <div key={problem.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
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
                          <AlertTriangle size={10} /> Needs Review
                        </span>
                      )}
                      {problem.status === 'verified' && (
                        <span className="text-xs text-green-600 flex items-center gap-1 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      )}
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-400">
                        {new Date(problem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {problem.unitId && (
                    <Link href={`/unit/${problem.unitId}`}>
                      <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-brand-primary hover:text-white transition-all">
                        <Play size={18} fill="currentColor" />
                      </button>
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
