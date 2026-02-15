import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import { StackDisplay } from "./stack-display";
import { QueueDisplay } from "./queue-display";
import { LinkedListDisplay } from "./linked-list-display";
import { useStack } from "./use-stack";
import { useQueue } from "./use-queue";
import { useLinkedList, AnimationState } from "./use-linked-list";
import {
  CommandSequence,
  parseCommandSequence,
  executeCommand,
  ExecutionContext,
  DSACommand,
} from "./command-executor";

// =============================================================================
// Types
// =============================================================================

export interface DSAVisualizerProps {
  // Accept commands in various formats
  commands?: string | string[] | CommandSequence | object;
  // Or provide steps directly (for compatibility with existing format)
  steps?: VisualizationStep[];
  // Title for the visualizer
  title?: string;
  // Callback when close button is clicked
  onClose?: () => void;
  // Callback to regenerate visualization
  onRegenerate?: () => Promise<void>;
  // Whether regeneration is in progress
  isRegenerating?: boolean;
}

interface VisualizationStep {
  stepNumber: number;
  visualizationType: string;
  data: any;
  highlighted?: number[] | number[][];
  pointers?: Record<string, number | number[]>;
  variables?: Record<string, any>;
  message: string;
  action?: string;
}

// =============================================================================
// DSA Visualizer Component
// =============================================================================

export function DSAVisualizer({
  commands,
  steps,
  title,
  onClose,
  onRegenerate,
  isRegenerating = false,
}: DSAVisualizerProps) {
  // Parse commands if provided
  const commandSequence = useMemo(() => {
    if (commands) {
      return parseCommandSequence(commands);
    }
    // Convert legacy steps to command sequence
    if (steps && steps.length > 0) {
      return convertStepsToSequence(steps);
    }
    return null;
  }, [commands, steps]);

  const visualizerType = commandSequence?.visualizerType || "stack";

  // Initialize hooks based on visualizer type
  const stackHook = useStack();
  const queueHook = useQueue();
  const linkedListHook = useLinkedList("SLL");

  // Playback state
  const [currentStep, setCurrentStep] = useState(-1); // -1 = initial state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);

  // Get total steps
  const totalSteps = commandSequence?.commands.length || 0;

  // Create execution context
  const executionContext: ExecutionContext = useMemo(
    () => ({
      stack: stackHook,
      queue: queueHook,
      linkedList: linkedListHook,
    }),
    [stackHook, queueHook, linkedListHook]
  );

  // Initialize visualization
  const initialize = useCallback(() => {
    if (!commandSequence) return;

    stackHook.clear();
    queueHook.clear();
    linkedListHook.clear();

    if (commandSequence.initialState) {
      switch (visualizerType) {
        case "stack":
          stackHook.initialize(commandSequence.initialState);
          break;
        case "queue":
          queueHook.initialize(commandSequence.initialState);
          break;
        case "linked-list":
          linkedListHook.initialize(commandSequence.initialState);
          break;
      }
    }

    setCurrentStep(-1);
    setHasStarted(true);
  }, [commandSequence, visualizerType, stackHook, queueHook, linkedListHook]);

  // Execute a single step
  const executeStep = useCallback(
    async (stepIndex: number) => {
      if (!commandSequence || stepIndex >= commandSequence.commands.length) return;

      const command = commandSequence.commands[stepIndex];
      await executeCommand(command, executionContext);
    },
    [commandSequence, executionContext]
  );

  // Go to next step
  const nextStep = useCallback(async () => {
    if (currentStep >= totalSteps - 1) {
      setIsPlaying(false);
      return;
    }

    const nextIndex = currentStep + 1;
    await executeStep(nextIndex);
    setCurrentStep(nextIndex);
  }, [currentStep, totalSteps, executeStep]);

  // Go to previous step (requires reset and replay)
  const prevStep = useCallback(async () => {
    if (currentStep <= -1) return;

    const targetStep = currentStep - 1;
    initialize();

    // Replay up to target step
    for (let i = 0; i <= targetStep; i++) {
      if (commandSequence?.commands[i]) {
        await executeCommand(commandSequence.commands[i], executionContext);
      }
    }

    setCurrentStep(targetStep);
  }, [currentStep, commandSequence, executionContext, initialize]);

  // Reset to initial state
  const reset = useCallback(() => {
    setIsPlaying(false);
    initialize();
  }, [initialize]);

  // Go to end
  const goToEnd = useCallback(async () => {
    setIsPlaying(false);
    initialize();

    // Execute all commands
    if (commandSequence) {
      for (const command of commandSequence.commands) {
        await executeCommand(command, executionContext);
      }
    }

    setCurrentStep(totalSteps - 1);
  }, [commandSequence, executionContext, initialize, totalSteps]);

  // Initialize on mount or when commands change
  useEffect(() => {
    if (commandSequence && !hasStarted) {
      initialize();
    }
  }, [commandSequence, hasStarted, initialize]);

  // Auto-play effect
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      nextStep();
    }, 1500 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, nextStep]);

  // Get current message
  const getMessage = () => {
    if (currentStep === -1) {
      return commandSequence?.initialState
        ? `Initial state: [${commandSequence.initialState.join(", ")}]`
        : "Ready to start";
    }

    const command = commandSequence?.commands[currentStep];
    if (command?.message) return command.message;

    // Generate message from command
    if (command) {
      return `${command.action}(${command.args.join(", ")})`;
    }

    return "";
  };

  // Render the appropriate visualizer
  const renderVisualization = () => {
    switch (visualizerType) {
      case "stack":
        return (
          <StackDisplay
            stack={stackHook.stack}
            highlightedIndex={stackHook.highlightedIndex}
          />
        );

      case "queue":
        return (
          <QueueDisplay
            queue={queueHook.queue}
            highlightedIndex={queueHook.highlightedIndex}
          />
        );

      case "linked-list":
        return (
          <LinkedListDisplay
            list={linkedListHook.list}
            highlightedNodes={linkedListHook.animationState.highlightedNodes}
            message={linkedListHook.animationState.message}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center p-8 text-gray-500">
            Unsupported visualizer type: {visualizerType}
          </div>
        );
    }
  };

  // Check if any hook is animating
  const isAnimating =
    stackHook.isAnimating || queueHook.isAnimating || linkedListHook.isAnimating;

  if (!commandSequence || totalSteps === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        No visualization commands provided
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      data-testid="dsa-visualizer"
    >
      {/* Header */}
      {title && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isRegenerating || isAnimating}
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
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                data-testid="button-close-visualizer"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Visualization Area */}
        <div className="min-h-[300px] flex items-center justify-center bg-gray-50 rounded-xl p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${visualizerType}-${currentStep}`}
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
              {currentStep + 2}
            </div>
            <p className="text-sm text-gray-700">{getMessage()}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={reset}
              disabled={isAnimating}
              className="h-8 w-8"
              data-testid="button-viz-reset"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={prevStep}
              disabled={currentStep <= -1 || isAnimating}
              className="h-8 w-8"
              data-testid="button-viz-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={isPlaying ? "secondary" : "default"}
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={isAnimating || currentStep >= totalSteps - 1}
              className="h-8 w-8"
              data-testid="button-viz-play"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextStep}
              disabled={currentStep >= totalSteps - 1 || isAnimating}
              className="h-8 w-8"
              data-testid="button-viz-next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToEnd}
              disabled={isAnimating}
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
            {currentStep + 2} / {totalSteps + 1}
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex gap-1">
          {/* Initial state indicator */}
          <button
            onClick={reset}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              currentStep === -1
                ? "bg-brand-primary"
                : "bg-brand-primary/40"
            )}
            data-testid="viz-step-indicator-init"
          />
          {/* Command step indicators */}
          {commandSequence?.commands.map((_, i) => (
            <button
              key={i}
              onClick={async () => {
                initialize();
                for (let j = 0; j <= i; j++) {
                  await executeCommand(commandSequence.commands[j], executionContext);
                }
                setCurrentStep(i);
              }}
              disabled={isAnimating}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i === currentStep
                  ? "bg-brand-primary"
                  : i < currentStep
                  ? "bg-brand-primary/40"
                  : "bg-gray-200"
              )}
              data-testid={`viz-step-indicator-${i}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Helper: Convert legacy steps format to command sequence
// =============================================================================

function convertStepsToSequence(steps: VisualizationStep[]): CommandSequence | null {
  if (!steps || steps.length === 0) return null;

  const firstStep = steps[0];
  const vizType = normalizeVizType(firstStep.visualizationType);

  const commands: DSACommand[] = [];
  let initialState: (string | number)[] | undefined;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // First step with data is the initial state
    if (i === 0 && Array.isArray(step.data) && step.data.length > 0) {
      initialState = step.data;
      continue;
    }

    // Try to extract command from action or generate one
    if (step.action) {
      const action = step.action.toLowerCase();

      if (vizType === "stack") {
        if (action.includes("push")) {
          const match = action.match(/push[(\s]+(\d+|\w+)/i);
          const value = match ? match[1] : step.variables?.value;
          if (value !== undefined) {
            commands.push({ type: "stack", action: "push", args: [value], message: step.message });
          }
        } else if (action.includes("pop")) {
          commands.push({ type: "stack", action: "pop", args: [], message: step.message });
        }
      } else if (vizType === "queue") {
        if (action.includes("enqueue") || action.includes("add")) {
          const match = action.match(/(?:enqueue|add)[(\s]+(\d+|\w+)/i);
          const value = match ? match[1] : step.variables?.value;
          if (value !== undefined) {
            commands.push({ type: "queue", action: "enqueue", args: [value], message: step.message });
          }
        } else if (action.includes("dequeue") || action.includes("remove")) {
          commands.push({ type: "queue", action: "dequeue", args: [], message: step.message });
        }
      }
    }
  }

  return {
    visualizerType: vizType,
    initialState,
    commands,
  };
}

function normalizeVizType(
  type: string
): "stack" | "queue" | "linked-list" | "array" | "binary-tree" {
  const normalized = type.toLowerCase();
  if (normalized === "stack") return "stack";
  if (normalized === "queue") return "queue";
  if (normalized === "linkedlist" || normalized === "linked-list") return "linked-list";
  if (normalized === "tree" || normalized === "binary-tree" || normalized === "binarytree")
    return "binary-tree";
  return "array";
}

export default DSAVisualizer;
