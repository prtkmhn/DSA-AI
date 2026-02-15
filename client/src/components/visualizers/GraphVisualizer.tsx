/**
 * Graph Visualizer Component
 *
 * Visualizes graphs and trees with support for:
 * - Node display with labels
 * - Edge connections (directed/undirected)
 * - Node/edge highlighting
 * - Force-directed layout
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface Node {
  id: string;
  label?: string;
  x?: number;
  y?: number;
  color?: string;
}

interface Edge {
  source: string;
  target: string;
  weight?: number;
  directed?: boolean;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  directed?: boolean;
  selectedNode?: string | null;
  selectedEdge?: { source: string; target: string } | null;
}

interface GraphVisualizerProps {
  data: GraphData;
  step?: number;
}

interface PositionedNode extends Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function GraphVisualizer({ data }: GraphVisualizerProps) {
  const { nodes = [], edges = [], directed = false, selectedNode, selectedEdge } = data;
  const hasPresetPositions = nodes.length > 0 && nodes.every((node) => typeof node.x === 'number' && typeof node.y === 'number');
  const [positions, setPositions] = useState<Map<string, PositionedNode>>(() => new Map());
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(500);

  const width = Math.max(260, containerWidth - 4);
  const height = Math.max(220, Math.round(width * 0.7));
  const nodeRadius = 22;

  // Initialize positions with circular layout
  useEffect(() => {
    const newPositions = new Map<string, PositionedNode>();

    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.35;

      newPositions.set(node.id, {
        ...node,
        x: node.x ?? width / 2 + radius * Math.cos(angle),
        y: node.y ?? height / 2 + radius * Math.sin(angle),
        vx: 0,
        vy: 0
      });
    });

    setPositions(newPositions);
  }, [nodes, width, height]);

  // Keep SVG responsive to parent width to avoid clipping inside cards.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerWidth(Math.round(entry.contentRect.width));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Force-directed layout simulation
  useEffect(() => {
    if (hasPresetPositions) return;
    if (positions.size === 0) return;

    let frameCount = 0;
    const maxFrames = 100; // Limit simulation duration

    const simulate = () => {
      if (frameCount++ > maxFrames) return;

      setPositions(prev => {
        const next = new Map(prev);
        const nodeList = Array.from(next.values());

        // Repulsion force
        for (let i = 0; i < nodeList.length; i++) {
          for (let j = i + 1; j < nodeList.length; j++) {
            const a = nodeList[i];
            const b = nodeList[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 1500 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }
        }

        // Attraction force
        edges.forEach(edge => {
          const a = next.get(edge.source);
          const b = next.get(edge.target);
          if (!a || !b) return;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 80) * 0.01;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        });

        // Center gravity
        nodeList.forEach(node => {
          const dx = width / 2 - node.x;
          const dy = height / 2 - node.y;
          node.vx += dx * 0.001;
          node.vy += dy * 0.001;
        });

        // Apply velocity with damping
        nodeList.forEach(node => {
          node.vx *= 0.85;
          node.vy *= 0.85;
          node.x += node.vx;
          node.y += node.vy;

          // Keep within bounds
          node.x = Math.max(nodeRadius, Math.min(width - nodeRadius, node.x));
          node.y = Math.max(nodeRadius, Math.min(height - nodeRadius, node.y));
        });

        return next;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [edges, hasPresetPositions, positions.size]);

  const positionedNodes = useMemo(() => Array.from(positions.values()), [positions]);

  const getNodeColor = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node?.color) return node.color;
    if (selectedNode === nodeId) return '#fbbf24';
    return '#3b82f6';
  };

  const isEdgeSelected = (edge: Edge) => {
    if (!selectedEdge) return false;
    return edge.source === selectedEdge.source && edge.target === selectedEdge.target;
  };

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="border border-slate-200 rounded-lg bg-slate-50"
      >
        {/* Edges */}
        {edges.map((edge, i) => {
          const source = positions.get(edge.source);
          const target = positions.get(edge.target);
          if (!source || !target) return null;

          const isSelected = isEdgeSelected(edge);
          const strokeColor = isSelected ? '#fbbf24' : '#94a3b8';
          const strokeWidth = isSelected ? 3 : 2;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / dist;
          const unitY = dy / dist;

          const startX = source.x + unitX * nodeRadius;
          const startY = source.y + unitY * nodeRadius;
          const endX = target.x - unitX * nodeRadius;
          const endY = target.y - unitY * nodeRadius;

          return (
            <g key={`edge-${i}`}>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
              />

              {/* Arrowhead for directed edges */}
              {(directed || edge.directed) && (
                <polygon
                  points="0,-5 10,0 0,5"
                  fill={strokeColor}
                  transform={`translate(${endX},${endY}) rotate(${Math.atan2(dy, dx) * 180 / Math.PI})`}
                />
              )}

              {/* Weight label */}
              {edge.weight !== undefined && (
                <text
                  x={(startX + endX) / 2}
                  y={(startY + endY) / 2 - 5}
                  textAnchor="middle"
                  className="text-xs fill-slate-600 font-medium"
                >
                  {edge.weight}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {positionedNodes.map((node) => (
          <motion.g
            key={node.id}
            initial={{ scale: 0 }}
            animate={{
              x: node.x,
              y: node.y,
              scale: selectedNode === node.id ? 1.1 : 1
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <circle
              r={nodeRadius}
              fill={getNodeColor(node.id)}
              stroke={selectedNode === node.id ? '#f59e0b' : '#1e40af'}
              strokeWidth={selectedNode === node.id ? 3 : 2}
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm font-medium fill-white"
            >
              {node.label || node.id}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
