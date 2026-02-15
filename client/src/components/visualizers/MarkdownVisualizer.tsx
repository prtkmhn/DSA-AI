/**
 * Markdown Visualizer Component
 *
 * Displays markdown content with syntax highlighting.
 */

import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownData {
  content: string;
}

interface MarkdownVisualizerProps {
  data: MarkdownData;
}

export function MarkdownVisualizer({ data }: MarkdownVisualizerProps) {
  const { content = '' } = data;

  return (
    <div className="w-full overflow-auto max-h-96 p-4 bg-white rounded-lg border border-slate-200">
      <div className="prose prose-sm max-w-none prose-slate">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;

            if (isInline) {
              return (
                <code className={cn('text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-sm', className)} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <div className="relative">
                {match && (
                  <div className="absolute top-2 right-2 text-xs text-slate-400 uppercase">
                    {match[1]}
                  </div>
                )}
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-slate-800 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-slate-800 mb-3 mt-6">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-slate-700 mb-2 mt-4">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 text-slate-600 ml-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 text-slate-600 ml-2">{children}</ol>
          ),
          p: ({ children }) => (
            <p className="text-slate-600 mb-3 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-800">{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      </div>
    </div>
  );
}
