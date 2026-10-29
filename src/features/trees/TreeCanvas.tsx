import { motion } from 'framer-motion';
import type { TreeState } from '@/algorithms/structures/tree';
import { layoutTree, NODE_RADIUS } from './layout';
import { cn } from '@/lib/cn';

interface TreeCanvasProps {
  state: TreeState;
  showHeights: boolean;
}

type Tone = 'idle' | 'cursor' | 'compared' | 'rotated' | 'visited' | 'found' | 'detaching';

const FILL: Record<Tone, string> = {
  idle: 'var(--color-surface-2)',
  cursor: 'color-mix(in srgb, var(--color-viz-active) 28%, transparent)',
  compared: 'color-mix(in srgb, var(--color-viz-compare) 28%, transparent)',
  rotated: 'color-mix(in srgb, var(--color-viz-swap) 30%, transparent)',
  visited: 'color-mix(in srgb, var(--color-viz-visited) 22%, transparent)',
  found: 'color-mix(in srgb, var(--color-viz-sorted) 30%, transparent)',
  detaching: 'color-mix(in srgb, var(--color-viz-swap) 14%, transparent)',
};

const STROKE: Record<Tone, string> = {
  idle: 'var(--color-line-strong)',
  cursor: 'var(--color-viz-active)',
  compared: 'var(--color-viz-compare)',
  rotated: 'var(--color-viz-swap)',
  visited: 'var(--color-viz-visited)',
  found: 'var(--color-viz-sorted)',
  detaching: 'var(--color-viz-swap)',
};

export function TreeCanvas({ state, showHeights }: TreeCanvasProps) {
  const layout = layoutTree(state);

  const toneOf = (id: string): Tone => {
    if (state.detaching === id) return 'detaching';
    if (state.found === id) return 'found';
    if (state.rotated.includes(id)) return 'rotated';
    if (state.cursor === id) return 'cursor';
    if (state.compared.includes(id)) return 'compared';
    if (state.visited.includes(id)) return 'visited';
    return 'idle';
  };

  if (layout.nodes.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-ink-dim">
        The tree is empty — insert a value to begin.
      </p>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        width={layout.width}
        height={layout.height}
        className="max-w-full"
        role="img"
        aria-label={`Binary tree with ${layout.nodes.length} nodes, height ${
          Math.max(...layout.nodes.map((n) => n.depth)) + 1
        }`}
      >
        {layout.edges.map((edge) => (
          <motion.line
            key={`${edge.from.id}-${edge.to.id}`}
            initial={false}
            animate={{
              x1: edge.from.x,
              y1: edge.from.y,
              x2: edge.to.x,
              y2: edge.to.y,
            }}
            transition={{ duration: 0.25 }}
            stroke={
              state.rotated.includes(edge.from.id) ||
              state.rotated.includes(edge.to.id)
                ? 'var(--color-viz-swap)'
                : 'var(--color-line-strong)'
            }
            strokeWidth={1.5}
          />
        ))}

        {layout.nodes.map((node) => {
          const tone = toneOf(node.id);
          return (
            <motion.g
              key={node.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: tone === 'detaching' ? 0.45 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <motion.circle
                initial={false}
                animate={{ cx: node.x, cy: node.y }}
                transition={{ duration: 0.25 }}
                r={NODE_RADIUS}
                fill={FILL[tone]}
                stroke={STROKE[tone]}
                strokeWidth={2}
              />
              <motion.text
                initial={false}
                animate={{ x: node.x, y: node.y + 4 }}
                transition={{ duration: 0.25 }}
                textAnchor="middle"
                className="fill-ink font-mono"
                style={{ fontSize: 11 }}
              >
                {node.value}
              </motion.text>
              {showHeights && (
                <motion.text
                  initial={false}
                  animate={{ x: node.x + NODE_RADIUS + 2, y: node.y - NODE_RADIUS + 4 }}
                  transition={{ duration: 0.25 }}
                  className="fill-ink-dim font-mono"
                  style={{ fontSize: 8.5 }}
                >
                  h{node.height}
                </motion.text>
              )}
            </motion.g>
          );
        })}
      </svg>

      {(state.output.length > 0 || state.queue.length > 0) && (
        <div className="mt-3 space-y-1.5 border-t border-line pt-2.5">
          {state.output.length > 0 && (
            <p className="font-mono text-[12px]">
              <span className="panel-title mr-2">output</span>
              <span className={cn('text-emerald')}>{state.output.join(', ')}</span>
            </p>
          )}
          {state.queue.length > 0 && (
            <p className="font-mono text-[12px]">
              <span className="panel-title mr-2">queue</span>
              <span className="text-accent">
                {state.queue
                  .map((id) => state.nodes[id]?.value)
                  .filter((value) => value !== undefined)
                  .join(', ')}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
