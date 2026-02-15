/**
 * Algorithm Player Component
 *
 * Provides animation controls and step-by-step visualization
 * for algorithm animations.
 */

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Array1DVisualizer } from './Array1DVisualizer';
import { GraphVisualizer } from './GraphVisualizer';

interface AlgorithmStep {
  type: string;
  description: string;
  array?: number[];
  indices?: number[];
  nodeId?: string;
  visited?: string[];
  queue?: string[];
  [key: string]: unknown;
}

interface AlgorithmData {
  name: string;
  steps: AlgorithmStep[];
  currentStep: number;
  array?: number[];
  graph?: {
    nodes: Array<{ id: string; label?: string; color?: string }>;
    edges: Array<{ source: string; target: string; weight?: number }>;
    directed: boolean;
    selectedNode: string | null;
    selectedEdge: { source: string; target: string } | null;
  };
}

interface AlgorithmPlayerProps {
  data: AlgorithmData;
  onStepChange?: (step: number) => void;
}

const SPEED_OPTIONS = [
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2 },
];

export function AlgorithmPlayer({ data, onStepChange }: AlgorithmPlayerProps) {
  const { steps = [], name } = data;
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const totalSteps = steps.length;
  const step = steps[currentStep] || { type: 'init', description: 'No steps' };

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || currentStep >= totalSteps - 1) {
      if (currentStep >= totalSteps - 1) {
        setIsPlaying(false);
      }
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = Math.min(prev + 1, totalSteps - 1);
        onStepChange?.(next);
        return next;
      });
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, currentStep, totalSteps, speed, onStepChange]);

  const handlePlayPause = useCallback(() => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0);
      onStepChange?.(0);
    }
    setIsPlaying(prev => !prev);
  }, [currentStep, totalSteps, onStepChange]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    onStepChange?.(0);
  }, [onStepChange]);

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    const next = Math.min(currentStep + 1, totalSteps - 1);
    setCurrentStep(next);
    onStepChange?.(next);
  }, [currentStep, totalSteps, onStepChange]);

  const handleStepBack = useCallback(() => {
    setIsPlaying(false);
    const prev = Math.max(currentStep - 1, 0);
    setCurrentStep(prev);
    onStepChange?.(prev);
  }, [currentStep, onStepChange]);

  const handleSliderChange = useCallback((value: number[]) => {
    setIsPlaying(false);
    const step = value[0];
    setCurrentStep(step);
    onStepChange?.(step);
  }, [onStepChange]);

  // Determine which visualization to show based on algorithm type
  const isArrayAlgorithm = ['bubble_sort', 'binary_search', 'quick_sort', 'merge_sort'].includes(name);
  const isGraphAlgorithm = ['dfs', 'bfs', 'dijkstra', 'bst_search'].includes(name);

  // Get current array state from step
  const getCurrentArrayData = () => {
    const arrayFromStep = step.array as number[] | undefined;
    const indices = step.indices as number[] | undefined;

    return {
      values: arrayFromStep || data.array || [],
      selected: indices ? [{ start: indices[0], end: indices[indices.length - 1] }] : []
    };
  };

  // Get current graph state from step
  const getCurrentGraphData = () => {
    const selectedNode = step.nodeId as string | undefined;
    const visited = (step.visited as string[]) || [];
    const graphNodes = data.graph?.nodes || [];
    const graphEdges = data.graph?.edges || [];

    return {
      nodes: graphNodes.map(node => ({
        ...node,
        color: visited.includes(node.id) ? '#22c55e' : (selectedNode === node.id ? '#fbbf24' : undefined)
      })),
      edges: graphEdges,
      directed: data.graph?.directed || false,
      selectedNode: selectedNode || null,
      selectedEdge: null
    };
  };

  return (
    <div className="w-full space-y-4">
      {/* Visualization Area */}
      <div className="min-h-[200px] bg-slate-50 rounded-lg border border-slate-200 p-4">
        {isArrayAlgorithm && <Array1DVisualizer data={getCurrentArrayData()} step={currentStep} />}
        {isGraphAlgorithm && <GraphVisualizer data={getCurrentGraphData()} step={currentStep} />}
        {!isArrayAlgorithm && !isGraphAlgorithm && (
          <div className="text-center text-slate-400 py-8">
            Visualization for {name}
          </div>
        )}
      </div>

      {/* Step Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-blue-600 uppercase">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-xs text-blue-500 capitalize">{step.type.replace(/_/g, ' ')}</span>
        </div>
        <p className="text-sm text-blue-800">{step.description}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            disabled={currentStep === 0}
            className="h-8 w-8"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleStepBack}
            disabled={currentStep === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={handlePlayPause}
            className="h-8 w-8"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleStepForward}
            disabled={currentStep >= totalSteps - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Speed:</span>
          {SPEED_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              variant={speed === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSpeed(opt.value)}
              className="h-6 px-2 text-xs"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Step Slider */}
      <div className="px-2">
        <Slider
          value={[currentStep]}
          onValueChange={handleSliderChange}
          max={totalSteps - 1}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-1 text-xs text-slate-400">
          <span>Start</span>
          <span>End</span>
        </div>
      </div>
    </div>
  );
}
