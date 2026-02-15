/**
 * Chart Visualizer Component
 *
 * Visualizes data as bar, line, or scatter charts.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  x: number | string;
  y: number;
  label?: string;
}

interface ChartData {
  data: DataPoint[];
}

interface ChartVisualizerProps {
  data: ChartData;
  type: 'bar' | 'line' | 'scatter';
}

export function ChartVisualizer({ data, type }: ChartVisualizerProps) {
  const { data: points = [] } = data;

  const width = 450;
  const height = 280;
  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const stats = useMemo(() => {
    if (points.length === 0) return null;

    const numericPoints = points.map((p, i) => ({
      x: typeof p.x === 'number' ? p.x : i,
      y: p.y
    }));

    const xValues = numericPoints.map(p => p.x);
    const yValues = numericPoints.map(p => p.y);

    return {
      minX: Math.min(...xValues),
      maxX: Math.max(...xValues),
      minY: Math.min(0, ...yValues),
      maxY: Math.max(...yValues),
      numericPoints
    };
  }, [points]);

  if (!stats || points.length === 0) {
    return <div className="text-center text-slate-400 py-8">No data to display</div>;
  }

  const scaleX = (x: number) => {
    const range = stats.maxX - stats.minX || 1;
    return padding + ((x - stats.minX) / range) * chartWidth;
  };

  const scaleY = (y: number) => {
    const range = stats.maxY - stats.minY || 1;
    return height - padding - ((y - stats.minY) / range) * chartHeight;
  };

  const xTicks = Array.from({ length: 5 }, (_, i) =>
    stats.minX + (stats.maxX - stats.minX) * (i / 4)
  );
  const yTicks = Array.from({ length: 5 }, (_, i) =>
    stats.minY + (stats.maxY - stats.minY) * (i / 4)
  );

  return (
    <div className="w-full flex justify-center">
      <svg width={width} height={height} className="border border-slate-200 rounded-lg bg-white">
        {/* Grid lines */}
        {xTicks.map((tick, i) => (
          <line
            key={`x-grid-${i}`}
            x1={scaleX(tick)}
            y1={padding}
            x2={scaleX(tick)}
            y2={height - padding}
            stroke="#e2e8f0"
            strokeDasharray="4"
          />
        ))}
        {yTicks.map((tick, i) => (
          <line
            key={`y-grid-${i}`}
            x1={padding}
            y1={scaleY(tick)}
            x2={width - padding}
            y2={scaleY(tick)}
            stroke="#e2e8f0"
            strokeDasharray="4"
          />
        ))}

        {/* Axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#64748b"
          strokeWidth={2}
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#64748b"
          strokeWidth={2}
        />

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={`y-label-${i}`}
            x={padding - 8}
            y={scaleY(tick) + 4}
            textAnchor="end"
            className="text-xs fill-slate-500"
          >
            {tick.toFixed(0)}
          </text>
        ))}

        {/* Chart content */}
        {type === 'bar' && (
          <g>
            {stats.numericPoints.map((point, i) => {
              const barWidth = chartWidth / points.length * 0.6;
              const x = scaleX(point.x) - barWidth / 2;
              const y = scaleY(point.y);
              const barHeight = height - padding - y;

              return (
                <motion.rect
                  key={`bar-${i}`}
                  x={x}
                  y={height - padding}
                  width={barWidth}
                  height={0}
                  fill="#3b82f6"
                  rx={2}
                  initial={{ y: height - padding, height: 0 }}
                  animate={{ y, height: barHeight }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                />
              );
            })}
          </g>
        )}

        {type === 'line' && (
          <g>
            <motion.path
              d={`M ${stats.numericPoints.map((p, i) => `${i === 0 ? '' : 'L '}${scaleX(p.x)} ${scaleY(p.y)}`).join(' ')}`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
            {stats.numericPoints.map((point, i) => (
              <motion.circle
                key={`point-${i}`}
                cx={scaleX(point.x)}
                cy={scaleY(point.y)}
                r={4}
                fill="#3b82f6"
                stroke="white"
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
              />
            ))}
          </g>
        )}

        {type === 'scatter' && (
          <g>
            {stats.numericPoints.map((point, i) => (
              <motion.circle
                key={`scatter-${i}`}
                cx={scaleX(point.x)}
                cy={scaleY(point.y)}
                r={5}
                fill="#8b5cf6"
                stroke="white"
                strokeWidth={2}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
