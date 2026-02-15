/**
 * Algorithm Visualizer Page
 *
 * Interactive page for visualizing algorithms with AI-powered explanations.
 */

import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useStore } from '@/lib/store';
import { useVisualizationStore } from '@/lib/visualizationStore';
import { useAIVisualization } from '@/lib/ai-visualization';
import {
  generateBubbleSortSteps,
  generateBinarySearchSteps,
  generateDFSSteps,
  generateBFSSteps,
  generateDijkstraSteps
} from '@/lib/ai-visualization/toolExecutor';
import {
  Array1DVisualizer,
  Array2DVisualizer,
  GraphVisualizer,
  ChartVisualizer,
  LogVisualizer,
  MarkdownVisualizer,
  AlgorithmPlayer
} from '@/components/visualizers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  Send,
  Loader2,
  Play,
  Search,
  GitBranch,
  BarChart3,
  Binary,
  Route,
  Sparkles,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Visualization } from '@/lib/visualizationStore';

// Sample data for algorithm templates
const SAMPLE_ARRAY = [64, 34, 25, 12, 22, 11, 90];
const SAMPLE_SORTED_ARRAY = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
const SAMPLE_GRAPH_NODES = [
  { id: 'A', label: 'A' },
  { id: 'B', label: 'B' },
  { id: 'C', label: 'C' },
  { id: 'D', label: 'D' },
  { id: 'E', label: 'E' },
  { id: 'F', label: 'F' }
];
const SAMPLE_GRAPH_EDGES = [
  { source: 'A', target: 'B' },
  { source: 'A', target: 'C' },
  { source: 'B', target: 'D' },
  { source: 'B', target: 'E' },
  { source: 'C', target: 'F' },
  { source: 'D', target: 'E' }
];
const SAMPLE_WEIGHTED_EDGES = [
  { source: 'A', target: 'B', weight: 4 },
  { source: 'A', target: 'C', weight: 2 },
  { source: 'B', target: 'C', weight: 1 },
  { source: 'B', target: 'D', weight: 5 },
  { source: 'C', target: 'D', weight: 8 },
  { source: 'C', target: 'E', weight: 10 },
  { source: 'D', target: 'E', weight: 2 },
  { source: 'D', target: 'F', weight: 6 },
  { source: 'E', target: 'F', weight: 3 }
];

// Algorithm templates - these create visualizations directly without AI
const ALGORITHM_TEMPLATES = [
  {
    id: 'bubble_sort',
    name: 'Bubble Sort',
    icon: BarChart3,
    description: 'Simple comparison-based sorting algorithm',
    color: 'bg-blue-500'
  },
  {
    id: 'binary_search',
    name: 'Binary Search',
    icon: Search,
    description: 'Efficient O(log n) search on sorted arrays',
    color: 'bg-green-500'
  },
  {
    id: 'dfs',
    name: 'DFS Traversal',
    icon: GitBranch,
    description: 'Depth-first graph/tree traversal',
    color: 'bg-purple-500'
  },
  {
    id: 'bfs',
    name: 'BFS Traversal',
    icon: Binary,
    description: 'Breadth-first graph/tree traversal',
    color: 'bg-amber-500'
  },
  {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    icon: Route,
    description: 'Shortest path in weighted graphs',
    color: 'bg-red-500'
  }
];

export default function VisualizerPage() {
  const { aiSettings } = useStore();
  const { visualizations, explanation, clearAll } = useVisualizationStore();
  const { isLoading, state, createVisualization, reset } = useAIVisualization();

  const [question, setQuestion] = useState('');

  const hasApiKey = Boolean(aiSettings.geminiKey);
  const hasMarkdownVisualization = visualizations.some((viz) => viz.type === 'markdown');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    if (!hasApiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please configure your Gemini API key in Settings.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await createVisualization(question);
      setQuestion('');
      toast({
        title: 'Visualization Created',
        description: `Created ${result.visualizationIds.length} visualization(s).`
      });
    } catch (error) {
      const msg = (error as Error).message;
      let title = 'Error';
      if (msg.includes('API key')) {
        title = 'API Key Issue';
      } else if (msg.includes('model') || msg.includes('404')) {
        title = 'Model Not Available';
      } else if (msg.includes('parse') || msg.includes('JSON')) {
        title = 'Response Parsing Error';
      }
      toast({
        title,
        description: msg,
        variant: 'destructive'
      });
    }
  };

  // Direct template execution - no AI needed!
  const handleTemplateClick = (template: typeof ALGORITHM_TEMPLATES[0]) => {
    const vizStore = useVisualizationStore.getState();

    switch (template.id) {
      case 'bubble_sort':
        vizStore.handleAlgorithmCreate(
          'bubble_sort_demo',
          'bubble_sort',
          generateBubbleSortSteps(SAMPLE_ARRAY),
          'Bubble Sort Visualization',
          { array: SAMPLE_ARRAY }
        );
        break;

      case 'binary_search':
        vizStore.handleAlgorithmCreate(
          'binary_search_demo',
          'binary_search',
          generateBinarySearchSteps(SAMPLE_SORTED_ARRAY, 23),
          'Binary Search (target: 23)',
          { array: SAMPLE_SORTED_ARRAY }
        );
        break;

      case 'dfs':
        vizStore.handleAlgorithmCreate(
          'dfs_demo',
          'dfs',
          generateDFSSteps(SAMPLE_GRAPH_NODES, SAMPLE_GRAPH_EDGES, 'A'),
          'DFS Traversal from A',
          { nodes: SAMPLE_GRAPH_NODES, edges: SAMPLE_GRAPH_EDGES }
        );
        break;

      case 'bfs':
        vizStore.handleAlgorithmCreate(
          'bfs_demo',
          'bfs',
          generateBFSSteps(SAMPLE_GRAPH_NODES, SAMPLE_GRAPH_EDGES, 'A'),
          'BFS Traversal from A',
          { nodes: SAMPLE_GRAPH_NODES, edges: SAMPLE_GRAPH_EDGES }
        );
        break;

      case 'dijkstra':
        vizStore.handleAlgorithmCreate(
          'dijkstra_demo',
          'dijkstra',
          generateDijkstraSteps(SAMPLE_GRAPH_NODES, SAMPLE_WEIGHTED_EDGES, 'A', 'F'),
          "Dijkstra's Shortest Path: A → F",
          { nodes: SAMPLE_GRAPH_NODES, edges: SAMPLE_WEIGHTED_EDGES }
        );
        break;
    }

    toast({
      title: `${template.name}`,
      description: 'Visualization created! Use the controls to step through.'
    });
  };

  const handleClear = () => {
    clearAll();
    reset();
  };

  const renderVisualization = (viz: Visualization) => {
    switch (viz.type) {
      case 'array1d':
        return <Array1DVisualizer data={viz.data} />;
      case 'array2d':
        return <Array2DVisualizer data={viz.data} />;
      case 'graph':
        return <GraphVisualizer data={viz.data} />;
      case 'chart_bar':
        return <ChartVisualizer data={viz.data} type="bar" />;
      case 'chart_line':
        return <ChartVisualizer data={viz.data} type="line" />;
      case 'chart_scatter':
        return <ChartVisualizer data={viz.data} type="scatter" />;
      case 'log':
        return <LogVisualizer data={viz.data} />;
      case 'markdown':
        return <MarkdownVisualizer data={viz.data} />;
      case 'algorithm':
        return <AlgorithmPlayer data={viz.data} />;
      default:
        return <div className="text-slate-400 text-center py-4">Unknown visualization type</div>;
    }
  };

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Algorithm Visualizer</h1>
        </div>
        {/* API Key Warning */}
        {!hasApiKey && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-3">
              <p className="text-sm text-amber-800">
                Configure your Gemini API key in Settings to use AI-powered visualizations.
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="ask">Ask AI</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {ALGORITHM_TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      isLoading && 'opacity-50 pointer-events-none'
                    )}
                    onClick={() => handleTemplateClick(template)}
                  >
                    <CardContent className="p-4">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', template.color)}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Ask AI Tab */}
          <TabsContent value="ask" className="space-y-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about any algorithm..."
                disabled={isLoading || !hasApiKey}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !question.trim() || !hasApiKey}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>

            <div className="text-xs text-slate-500 space-y-1">
              <p>Try asking:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>"Explain how quicksort works"</li>
                <li>"Visualize binary search on [1,3,5,7,9]"</li>
                <li>"Compare DFS and BFS traversal"</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <div className="text-center">
                  <p className="font-medium">
                    {state.isSelectingTools && 'Selecting visualization tools...'}
                    {state.isGeneratingContent && 'Generating content...'}
                    {state.isExecutingTools && 'Creating visualizations...'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">This may take a few seconds</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {state.error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-3">
              <p className="text-sm text-red-800">{state.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Visualizations */}
        {visualizations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Visualizations ({visualizations.length})
              </h2>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>

            {visualizations.map((viz) => (
              <Card key={viz.id}>
                {viz.title && (
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{viz.title}</CardTitle>
                  </CardHeader>
                )}
                <CardContent className={viz.title ? 'pt-0' : ''}>
                  {renderVisualization(viz)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* AI Content */}
        {explanation && !isLoading && !hasMarkdownVisualization && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Explanation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownVisualizer data={{ content: explanation }} />
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && visualizations.length === 0 && !explanation && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-slate-500">
                <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No visualizations yet</p>
                <p className="text-sm mt-1">
                  Select a template or ask AI to create visualizations
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
