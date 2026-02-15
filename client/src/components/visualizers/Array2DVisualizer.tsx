/**
 * Array2D Visualizer Component
 *
 * Visualizes 2D arrays/matrices with support for:
 * - Grid display
 * - Cell selection highlighting
 * - Row/column headers
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Array2DData {
  values: number[][];
  selected?: Array<{ startRow: number; startCol: number; endRow: number; endCol: number }>;
}

interface Array2DVisualizerProps {
  data: Array2DData;
  step?: number;
}

export function Array2DVisualizer({ data, step }: Array2DVisualizerProps) {
  const { values = [], selected = [] } = data;

  if (values.length === 0) {
    return <div className="text-center text-slate-400 py-8">No data to display</div>;
  }

  const isSelected = (row: number, col: number) => {
    return selected.some(
      s => row >= s.startRow && row <= s.endRow && col >= s.startCol && col <= s.endCol
    );
  };

  const numRows = values.length;
  const numCols = values[0]?.length || 0;

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block p-4">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="w-8 h-8" /> {/* Empty corner cell */}
              {Array.from({ length: numCols }, (_, i) => (
                <th
                  key={`col-${i}`}
                  className="w-10 h-8 text-xs text-slate-500 font-mono"
                >
                  {i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                <td className="w-8 h-10 text-xs text-slate-500 font-mono text-right pr-2">
                  {rowIndex}
                </td>
                {row.map((value, colIndex) => {
                  const selected = isSelected(rowIndex, colIndex);
                  return (
                    <td key={`cell-${rowIndex}-${colIndex}`} className="p-0.5">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                          delay: (rowIndex * numCols + colIndex) * 0.01
                        }}
                        className={cn(
                          'w-10 h-10 flex items-center justify-center text-sm font-medium rounded border-2 transition-colors duration-200',
                          selected
                            ? 'bg-amber-100 border-amber-400 text-amber-800'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                        )}
                      >
                        {value}
                      </motion.div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {selected.length > 0 && (
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded" />
            <span className="text-slate-600">Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-100 border border-amber-400 rounded" />
            <span className="text-slate-600">Selected</span>
          </div>
        </div>
      )}
    </div>
  );
}
