/**
 * Log Visualizer Component
 *
 * Displays log messages with different severity levels.
 */

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface LogMessage {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

interface LogData {
  messages: LogMessage[];
}

interface LogVisualizerProps {
  data: LogData;
}

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle
};

const typeStyles = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200'
};

const iconColors = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-amber-500',
  error: 'text-red-500'
};

export function LogVisualizer({ data }: LogVisualizerProps) {
  const { messages = [] } = data;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div
      ref={scrollRef}
      className="w-full h-56 overflow-y-auto bg-slate-900 rounded-lg p-3 font-mono text-sm"
    >
      <AnimatePresence initial={false}>
        {messages.length === 0 ? (
          <div className="text-slate-500 text-center py-8">
            No log messages yet
          </div>
        ) : (
          messages.map((msg, i) => {
            const Icon = typeIcons[msg.type];
            return (
              <motion.div
                key={`${msg.timestamp}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'flex items-start gap-2 p-2 mb-1 rounded border',
                  typeStyles[msg.type]
                )}
              >
                <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', iconColors[msg.type])} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs opacity-60 mr-2">
                    {formatTime(msg.timestamp)}
                  </span>
                  <span className="break-words">{msg.message}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
}
