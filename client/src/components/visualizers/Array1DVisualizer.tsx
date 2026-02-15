/**
 * Array1D Visualizer Component
 *
 * Visualizes 1D arrays with support for:
 * - Value display
 * - Selection highlighting
 * - Animation transitions
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Array1DData {
  values: number[];
  selected?: Array<{ start: number; end: number }>;
  colors?: Record<number, string>;
}

interface Array1DVisualizerProps {
  data: Array1DData;
  step?: number;
}

export function Array1DVisualizer({ data, step }: Array1DVisualizerProps) {
  const { values = [], selected = [], colors = {} } = data;

  const isSelected = (index: number) => {
    return selected.some(s => index >= s.start && index <= s.end);
  };

  const getColor = (index: number) => {
    if (colors[index]) return colors[index];
    if (isSelected(index)) return 'bg-amber-400 border-amber-500';
    return 'bg-blue-500 border-blue-600';
  };

  const maxValue = Math.max(...values, 1);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end justify-center gap-1 min-h-[150px] p-4">
        {values.map((value, index) => (
          <motion.div
            key={`${index}-${value}-${step}`}
            layout
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: index * 0.02
            }}
            className="flex flex-col items-center"
          >
            {/* Value bar */}
            <motion.div
              layout
              className={cn(
                'w-10 rounded-t-md border-2 flex items-end justify-center text-white text-xs font-medium pb-1 transition-colors duration-200',
                getColor(index)
              )}
              style={{
                height: `${Math.max(30, (value / maxValue) * 120)}px`
              }}
              animate={{
                scale: isSelected(index) ? 1.05 : 1,
              }}
            >
              {value}
            </motion.div>

            {/* Index label */}
            <div className={cn(
              'text-xs mt-1 font-mono',
              isSelected(index) ? 'text-amber-600 font-bold' : 'text-slate-500'
            )}>
              {index}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      {selected.length > 0 && (
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-slate-600">Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-400 rounded" />
            <span className="text-slate-600">Selected</span>
          </div>
        </div>
      )}
    </div>
  );
}
