import { motion } from 'framer-motion';
import { ArrayCells } from '@/components/visualization/ArrayCells';
import { resolveRole, roleColor } from '@/components/visualization/roles';
import { leftOf, rightOf, type HeapState } from '@/algorithms/structures/heap';
import type { VisualizationStep } from '@/engine/types';

interface HeapCanvasProps {
  state: HeapState;
  step?: VisualizationStep<HeapState>;
}

const NODE_RADIUS = 17;
const LEVEL_HEIGHT = 62;
const MIN_LEAF_WIDTH = 42;

interface Placed {
  index: number;
  value: number;
  x: number;
  y: number;
}

/** Complete-binary-tree layout: depth from ⌊log₂(i+1)⌋, x spread per level. */
function layoutHeap(values: number[]): { nodes: Placed[]; width: number; height: number } {
  if (values.length === 0) return { nodes: [], width: 1, height: 1 };
  const maxDepth = Math.floor(Math.log2(values.length));
  const leaves = 2 ** maxDepth;
  const width = Math.max(leaves * MIN_LEAF_WIDTH, 2 * MIN_LEAF_WIDTH);
  const nodes = values.map((value, index) => {
    const depth = Math.floor(Math.log2(index + 1));
    const positionInLevel = index - (2 ** depth - 1);
    const slotWidth = width / 2 ** depth;
    return {
      index,
      value,
      x: (positionInLevel + 0.5) * slotWidth,
      y: NODE_RADIUS + 4 + depth * LEVEL_HEIGHT,
    };
  });
  return {
    nodes,
    width,
    height: (maxDepth + 1) * LEVEL_HEIGHT + NODE_RADIUS,
  };
}

export function HeapCanvas({ state, step }: HeapCanvasProps) {
  const layout = layoutHeap(state.values);
  const roles = {
    compared: step?.comparedIndices,
    active: step?.activeIndices,
    swapped: step?.swappedIndices,
    sorted: step?.sortedIndices,
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">{state.kind}-heap</span>
        <span className="chip">size = {state.values.length}</span>
        <span className="chip">
          root = {state.values.length ? state.values[0] : '—'}
        </span>
        {state.extracted !== null && (
          <span className="chip border-emerald/40 bg-emerald/10 text-emerald">
            extracted {state.extracted}
          </span>
        )}
      </div>

      {state.values.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-dim">
          The heap is empty — insert a value to begin.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            width={layout.width}
            height={layout.height}
            className="max-w-full"
            role="img"
            aria-label={`${state.kind} heap as a tree with ${state.values.length} nodes`}
          >
            {layout.nodes.map((node) => (
              <g key={`edges-${node.index}`}>
                {[leftOf(node.index), rightOf(node.index)]
                  .filter((child) => child < state.values.length)
                  .map((child) => {
                    const target = layout.nodes[child];
                    return (
                      <motion.line
                        key={child}
                        initial={false}
                        animate={{
                          x1: node.x,
                          y1: node.y,
                          x2: target.x,
                          y2: target.y,
                        }}
                        transition={{ duration: 0.2 }}
                        stroke="var(--color-line-strong)"
                        strokeWidth={1.5}
                      />
                    );
                  })}
              </g>
            ))}

            {layout.nodes.map((node) => {
              const role = resolveRole(node.index, roles);
              return (
                <g key={node.index}>
                  <motion.circle
                    initial={false}
                    animate={{
                      cx: node.x,
                      cy: node.y,
                      fill:
                        role === 'idle'
                          ? 'var(--color-surface-2)'
                          : `color-mix(in srgb, ${roleColor(role)} 28%, transparent)`,
                      stroke:
                        role === 'idle'
                          ? 'var(--color-line-strong)'
                          : roleColor(role),
                    }}
                    transition={{ duration: 0.2 }}
                    r={NODE_RADIUS}
                    strokeWidth={2}
                  />
                  <motion.text
                    initial={false}
                    animate={{ x: node.x, y: node.y + 4 }}
                    transition={{ duration: 0.2 }}
                    textAnchor="middle"
                    className="fill-ink font-mono"
                    style={{ fontSize: 11 }}
                  >
                    {node.value}
                  </motion.text>
                  <motion.text
                    initial={false}
                    animate={{
                      x: node.x + NODE_RADIUS + 1,
                      y: node.y - NODE_RADIUS + 5,
                    }}
                    transition={{ duration: 0.2 }}
                    className="fill-ink-dim font-mono"
                    style={{ fontSize: 8.5 }}
                  >
                    {node.index}
                  </motion.text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      <div className="border-t border-line pt-3">
        <p className="panel-title mb-2">
          Array representation — children of i live at 2i+1 and 2i+2
        </p>
        <ArrayCells
          values={state.values}
          roles={roles}
          size="sm"
          emptyLabel="empty"
          ariaLabel={`Heap array: ${state.values.join(', ')}`}
        />
      </div>
    </div>
  );
}
