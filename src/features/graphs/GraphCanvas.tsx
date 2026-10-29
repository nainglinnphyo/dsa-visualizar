import { motion } from 'framer-motion';
import type { GraphState } from '@/algorithms/graphs/model';

interface GraphCanvasProps {
  state: GraphState;
  /** Highlighted by the editor rather than an algorithm. */
  selected?: string[];
}

const WIDTH = 440;
const HEIGHT = 320;
const PAD = 34;
const RADIUS = 17;

const toX = (x: number): number => PAD + (x / 100) * (WIDTH - 2 * PAD);
const toY = (y: number): number => PAD + (y / 100) * (HEIGHT - 2 * PAD);

type Tone = 'idle' | 'current' | 'visited' | 'frontier' | 'path' | 'selected';

const FILL: Record<Tone, string> = {
  idle: 'var(--color-surface-2)',
  current: 'color-mix(in srgb, var(--color-viz-active) 32%, transparent)',
  visited: 'color-mix(in srgb, var(--color-viz-sorted) 26%, transparent)',
  frontier: 'color-mix(in srgb, var(--color-viz-compare) 26%, transparent)',
  path: 'color-mix(in srgb, var(--color-viz-pivot) 32%, transparent)',
  selected: 'color-mix(in srgb, var(--color-viz-active) 20%, transparent)',
};

const STROKE: Record<Tone, string> = {
  idle: 'var(--color-line-strong)',
  current: 'var(--color-viz-active)',
  visited: 'var(--color-viz-sorted)',
  frontier: 'var(--color-viz-compare)',
  path: 'var(--color-viz-pivot)',
  selected: 'var(--color-viz-active)',
};

export function GraphCanvas({ state, selected = [] }: GraphCanvasProps) {
  const { graph } = state;
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));

  const toneOf = (id: string): Tone => {
    if (state.path.includes(id)) return 'path';
    if (state.current === id) return 'current';
    if (state.visited.includes(id)) return 'visited';
    if (state.frontier.includes(id)) return 'frontier';
    if (selected.includes(id)) return 'selected';
    return 'idle';
  };

  if (graph.nodes.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-ink-dim">
        The graph has no vertices — add one to begin.
      </p>
    );
  }

  return (
    <div className="min-w-0">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mx-auto block w-full max-w-[34rem]"
        role="img"
        aria-label={`Graph with ${graph.nodes.length} vertices and ${graph.edges.length} edges`}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--color-line-strong)" />
          </marker>
          <marker
            id="arrow-active"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--color-viz-active)" />
          </marker>
        </defs>

        {graph.edges.map((edge) => {
          const from = byId.get(edge.from);
          const to = byId.get(edge.to);
          if (!from || !to) return null;
          const x1 = toX(from.x);
          const y1 = toY(from.y);
          const x2 = toX(to.x);
          const y2 = toY(to.y);
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const gap = RADIUS + (graph.directed ? 6 : 2);
          const sx = x1 + Math.cos(angle) * gap;
          const sy = y1 + Math.sin(angle) * gap;
          const ex = x2 - Math.cos(angle) * gap;
          const ey = y2 - Math.sin(angle) * gap;

          const isActive = state.activeEdge === edge.id;
          const isTree = state.treeEdges.includes(edge.id);
          const isRejected = state.rejectedEdges.includes(edge.id);
          const stroke = isActive
            ? 'var(--color-viz-active)'
            : isTree
              ? 'var(--color-viz-sorted)'
              : isRejected
                ? 'var(--color-viz-swap)'
                : 'var(--color-line-strong)';

          return (
            <g key={edge.id}>
              <motion.line
                initial={false}
                animate={{ stroke, strokeWidth: isActive || isTree ? 2.5 : 1.4 }}
                transition={{ duration: 0.18 }}
                x1={sx}
                y1={sy}
                x2={ex}
                y2={ey}
                strokeDasharray={isRejected ? '4 3' : undefined}
                markerEnd={
                  graph.directed
                    ? isActive
                      ? 'url(#arrow-active)'
                      : 'url(#arrow)'
                    : undefined
                }
              />
              {graph.weighted && (
                <g>
                  <circle
                    cx={(sx + ex) / 2}
                    cy={(sy + ey) / 2}
                    r={8.5}
                    fill="var(--color-canvas)"
                  />
                  <text
                    x={(sx + ex) / 2}
                    y={(sy + ey) / 2 + 3}
                    textAnchor="middle"
                    className="font-mono"
                    style={{ fontSize: 9.5 }}
                    fill={isActive || isTree ? stroke : 'var(--color-ink-dim)'}
                  >
                    {edge.weight}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {graph.nodes.map((node) => {
          const tone = toneOf(node.id);
          const annotation = state.annotations[node.id];
          return (
            <g key={node.id}>
              <motion.circle
                initial={false}
                animate={{ fill: FILL[tone], stroke: STROKE[tone] }}
                transition={{ duration: 0.18 }}
                cx={toX(node.x)}
                cy={toY(node.y)}
                r={RADIUS}
                strokeWidth={2}
              />
              <text
                x={toX(node.x)}
                y={toY(node.y) + 4}
                textAnchor="middle"
                className="fill-ink font-mono"
                style={{ fontSize: 12 }}
              >
                {node.label}
              </text>
              {annotation && (
                <text
                  x={toX(node.x)}
                  y={toY(node.y) + RADIUS + 11}
                  textAnchor="middle"
                  className="fill-ink-dim font-mono"
                  style={{ fontSize: 8.5 }}
                >
                  {annotation}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
