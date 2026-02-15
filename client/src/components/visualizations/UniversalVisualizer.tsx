import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ArrayVisualizer } from "./ArrayVisualizer";
import { MatrixVisualizer } from "./MatrixVisualizer";
import { GenericVisualizer } from "./GenericVisualizer";
import { VisualizationStep } from "@/lib/types";
import { generateAIContent } from "@/lib/ai";
import { useStore } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { DSAVisualizer, parseCommandSequence } from "./dsa";
// Import new visualizer components
import { Array1DVisualizer } from "../visualizers/Array1DVisualizer";
import { GraphVisualizer } from "../visualizers/GraphVisualizer";

function normalizeStep(step: any, index: number): VisualizationStep {
  // If step already has proper format
  if (step.visualizationType && step.data !== undefined) {
    return {
      stepNumber: step.stepNumber || index + 1,
      visualizationType: step.visualizationType,
      data: step.data,
      highlighted: step.highlighted || [],
      pointers: step.pointers || {},
      variables: step.variables || {},
      message: step.message || step.description || "",
      action: step.action,
    };
  }

  // Handle legacy format with state/description
  if (step.state !== undefined || step.description !== undefined) {
    const state = step.state;
    let data: any = [];
    let visualizationType: VisualizationStep["visualizationType"] = "array";

    if (state) {
      if (Array.isArray(state)) {
        data = state;
        if (state.length > 0 && Array.isArray(state[0])) {
          visualizationType = "matrix";
        }
      } else if (typeof state === "object") {
        if (state.array) data = state.array;
        else if (state.result) data = state.result;
        else if (state.stack) { data = state.stack; visualizationType = "stack"; }
        else if (state.queue) { data = state.queue; visualizationType = "queue"; }
        else if (state.list) data = state.list;
        else if (state.node || state.root) { data = state; visualizationType = "tree"; }
        else data = Object.values(state)[0] || state;
      }
    }

    return {
      stepNumber: index + 1,
      visualizationType,
      data,
      highlighted: step.highlighted || [],
      pointers: step.pointers || {},
      variables: step.variables || {},
      message: step.description || step.message || "",
      action: step.action,
    };
  }

  // Fallback
  return {
    stepNumber: index + 1,
    visualizationType: "array",
    data: [],
    highlighted: [],
    pointers: {},
    variables: {},
    message: step.message || step.description || `Step ${index + 1}`,
    action: step.action,
  };
}

interface UniversalVisualizerProps {
  steps: VisualizationStep[] | any[];
  title?: string;
  onClose?: () => void;
  onStepsUpdate?: (newSteps: VisualizationStep[]) => void;
}

export function UniversalVisualizer({ steps, title, onClose, onStepsUpdate }: UniversalVisualizerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [localSteps, setLocalSteps] = useState(steps);
  const { aiSettings } = useStore();

  // Update local steps if props change
  useEffect(() => {
    setLocalSteps(steps);
  }, [steps]);

  const normalizedSteps = localSteps.map((s, i) => normalizeStep(s, i));
  const step = normalizedSteps[currentStep] || normalizedSteps[0];

  const handleRegenerateVisualization = async () => {
    if (!aiSettings.geminiKey && !aiSettings.groqKey) {
      toast({
        title: "AI Not Configured",
        description: "Please add an API key in Settings to use AI features.",
        variant: "destructive"
      });
      return;
    }

    setIsRegenerating(true);
    try {
      const currentVizType = step?.visualizationType || "array";
      const prompt = `Generate a NEW visualization example for the algorithm "${title || 'this algorithm'}".

Current visualization type: ${currentVizType}

Return ONLY a valid JSON array of visualization steps (no markdown, no explanation), like:
[
  {
    "stepNumber": 1,
    "visualizationType": "${currentVizType}",
    "data": [5, 2, 8, 1, 9],
    "highlighted": [],
    "pointers": {},
    "variables": {"target": 7},
    "message": "Start with a new example array [5, 2, 8, 1, 9] and target 7"
  },
  {
    "stepNumber": 2,
    "visualizationType": "${currentVizType}",
    "data": [5, 2, 8, 1, 9],
    "highlighted": [0],
    "pointers": {"i": 0},
    "variables": {"target": 7, "current": 5},
    "message": "Check first element: 5"
  }
]

REQUIREMENTS:
- Use DIFFERENT input values than typical examples (be creative!)
- Generate 6-10 steps showing the algorithm execution
- Each step must have: stepNumber, visualizationType, data, highlighted, pointers, variables, message
- Messages should be educational and explain what's happening
- Return ONLY the JSON array, nothing else`;

      const result = await generateAIContent(prompt);

      if (result.error) {
        throw new Error(result.error);
      }

      // Parse the JSON response
      const text = result.text.trim();
      const jsonStart = text.indexOf('[');
      const jsonEnd = text.lastIndexOf(']');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("AI didn't return valid JSON array");
      }

      const newSteps = JSON.parse(text.substring(jsonStart, jsonEnd + 1));

      if (!Array.isArray(newSteps) || newSteps.length === 0) {
        throw new Error("Invalid visualization steps returned");
      }

      setLocalSteps(newSteps);
      setCurrentStep(0);
      setIsPlaying(false);

      // Notify parent if callback provided
      if (onStepsUpdate) {
        onStepsUpdate(newSteps);
      }

      toast({
        title: "New Example Generated!",
        description: `Created ${newSteps.length} visualization steps with a fresh example.`,
      });

    } catch (e: unknown) {
      const error = e as Error;
      console.error("Failed to regenerate visualization:", error);
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const goToStep = useCallback((index: number) => {
    setCurrentStep(Math.max(0, Math.min(index, localSteps.length - 1)));
  }, [localSteps.length]);

  const nextStep = useCallback(() => {
    if (currentStep < localSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStep, localSteps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      nextStep();
    }, 1500 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, nextStep]);

  if (!localSteps || localSteps.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        No visualization data available
      </div>
    );
  }

  const renderVisualization = () => {
    if (!step) return null;

    const vizType = step.visualizationType || "array";
    const data = step.data ?? [];
    const highlighted = step.highlighted ?? [];
    const pointers = step.pointers ?? {};

    // Convert old format to new Array1DVisualizer format
    const convertToArray1DData = () => {
      const values = Array.isArray(data) ? data : [data];
      const flatHighlighted = Array.isArray(highlighted) ? highlighted.flat() as number[] : [];

      // Convert highlighted indices to selection ranges
      const selected: Array<{ start: number; end: number }> = [];
      if (flatHighlighted.length > 0) {
        // Group consecutive indices into ranges
        let rangeStart = flatHighlighted[0];
        let rangeEnd = flatHighlighted[0];

        for (let i = 1; i < flatHighlighted.length; i++) {
          if (flatHighlighted[i] === rangeEnd + 1) {
            rangeEnd = flatHighlighted[i];
          } else {
            selected.push({ start: rangeStart, end: rangeEnd });
            rangeStart = flatHighlighted[i];
            rangeEnd = flatHighlighted[i];
          }
        }
        selected.push({ start: rangeStart, end: rangeEnd });
      }

      // Convert pointers to colors for visualization
      const colors: Record<number, string> = {};
      const pointerColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];
      let colorIndex = 0;

      Object.values(pointers).forEach(idx => {
        if (typeof idx === 'number' && idx >= 0 && idx < values.length) {
          colors[idx] = pointerColors[colorIndex % pointerColors.length];
          colorIndex++;
        }
      });

      return { values, selected, colors };
    };

    // Convert to graph data format
    const convertToGraphData = () => {
      // Handle various graph data formats
      const nodes: Array<{ id: string; label?: string; color?: string }> = [];
      const edges: Array<{ source: string; target: string; weight?: number }> = [];
      const highlightedSet = new Set(Array.isArray(highlighted) ? highlighted.map(String) : []);

      if (data && typeof data === 'object') {
        // Format: { nodes: [...], edges: [...] }
        if (data.nodes && Array.isArray(data.nodes)) {
          data.nodes.forEach((n: any) => {
            const nodeId = String(n.id || n);
            nodes.push({
              id: nodeId,
              label: n.label || nodeId,
              color: highlightedSet.has(nodeId) ? '#22c55e' : undefined
            });
          });
        }
        if (data.edges && Array.isArray(data.edges)) {
          data.edges.forEach((e: any) => {
            edges.push({
              source: String(e.source || e.from || e[0]),
              target: String(e.target || e.to || e[1]),
              weight: e.weight
            });
          });
        }
        // Format: adjacency list { A: ['B', 'C'], ... }
        if (!data.nodes && !data.edges) {
          Object.keys(data).forEach(nodeId => {
            nodes.push({
              id: nodeId,
              label: nodeId,
              color: highlightedSet.has(nodeId) ? '#22c55e' : undefined
            });
            const neighbors = data[nodeId];
            if (Array.isArray(neighbors)) {
              neighbors.forEach((neighbor: any) => {
                edges.push({ source: nodeId, target: String(neighbor) });
              });
            }
          });
        }
      }

      return {
        nodes,
        edges,
        directed: false,
        selectedNode: pointers?.current ? String(pointers.current) : null,
        selectedEdge: null
      };
    };

    switch (vizType) {
      case "array":
      case "stack":
      case "queue":
        return (
          <div className="w-full">
            <Array1DVisualizer
              data={convertToArray1DData()}
              step={currentStep}
            />
            {/* Show pointers below the array */}
            {Object.keys(pointers).length > 0 && (
              <div className="flex justify-center gap-4 mt-2">
                {Object.entries(pointers).map(([name, idx]) => (
                  <span key={name} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    {name}: {typeof idx === 'number' ? idx : JSON.stringify(idx)}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      case "matrix":
        return (
          <MatrixVisualizer
            data={Array.isArray(data) ? data : [data]}
            highlighted={highlighted as [number, number][]}
            pointers={pointers as Record<string, [number, number]>}
            action={step.action}
          />
        );
      case "tree":
        return (
          <GenericVisualizer
            data={data}
            highlighted={Array.isArray(highlighted) ? highlighted : []}
            pointers={pointers}
            action={step.action}
            type="tree"
          />
        );
      case "graph":
        return (
          <GraphVisualizer
            data={convertToGraphData()}
            step={currentStep}
          />
        );
      case "linkedlist":
        return (
          <GenericVisualizer
            data={data}
            highlighted={Array.isArray(highlighted) ? highlighted : []}
            pointers={pointers}
            action={step.action}
            type="linkedlist"
          />
        );
      default:
        return (
          <div className="w-full">
            <Array1DVisualizer
              data={convertToArray1DData()}
              step={currentStep}
            />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" data-testid="universal-visualizer">
      {title && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateVisualization}
              disabled={isRegenerating}
              className="text-xs gap-1"
              data-testid="button-regenerate-viz"
            >
              {isRegenerating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {isRegenerating ? "Generating..." : "Try Different Example"}
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-visualizer">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Visualization Area */}
        <div className="min-h-[200px] flex items-center justify-center bg-gray-50 rounded-xl p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {renderVisualization()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step Description */}
        <div className="bg-gradient-to-r from-brand-primary/5 to-brand-primary/10 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <div className="bg-brand-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">
              {step?.stepNumber || currentStep + 1}
            </div>
            <p className="text-sm text-gray-700">{step?.message || "Step description"}</p>
          </div>
        </div>

        {/* Variables Display */}
        {step?.variables && Object.keys(step.variables).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(step.variables).map(([key, value]) => (
              <div
                key={key}
                className="bg-gray-100 rounded-lg px-3 py-1.5 text-xs font-mono"
              >
                <span className="text-gray-500">{key}:</span>{" "}
                <span className="text-gray-800 font-medium">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={reset}
              className="h-8 w-8"
              data-testid="button-viz-reset"
            >
              <SkipBack className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="h-8 w-8"
              data-testid="button-viz-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={isPlaying ? "secondary" : "default"}
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-8 w-8"
              data-testid="button-viz-play"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextStep}
              disabled={currentStep >= localSteps.length - 1}
              className="h-8 w-8"
              data-testid="button-viz-next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToStep(localSteps.length - 1)}
              className="h-8 w-8"
              data-testid="button-viz-end"
            >
              <SkipForward className="w-3 h-3" />
            </Button>
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-2 flex-1 max-w-[150px]">
            <span className="text-xs text-gray-500">Speed</span>
            <Slider
              value={[speed]}
              onValueChange={([val]) => setSpeed(val)}
              min={0.5}
              max={3}
              step={0.5}
              className="flex-1"
              data-testid="slider-viz-speed"
            />
          </div>

          {/* Step Counter */}
          <div className="text-xs text-gray-500">
            {currentStep + 1} / {localSteps.length}
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex gap-1">
          {localSteps.map((_, i) => (
            <button
              key={i}
              onClick={() => goToStep(i)}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i === currentStep ? "bg-brand-primary" : i < currentStep ? "bg-brand-primary/40" : "bg-gray-200"
              )}
              data-testid={`viz-step-indicator-${i}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
