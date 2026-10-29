import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import type { StackState } from '@/algorithms/structures/stack';
import type { VisualizationStep } from '@/engine/types';
import { resolveRole, roleColor } from '@/components/visualization/roles';
import { cn } from '@/lib/cn';

interface StackCanvasProps {
  state: StackState;
  step?: VisualizationStep<StackState>;
}

export function StackCanvas({ state, step }: StackCanvasProps) {
  const { items, capacity, status, result } = state;
  const freeSlots = Math.max(0, capacity - items.length);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">size = {items.length}</span>
        <span className="chip">capacity = {capacity}</span>
        <span className="chip">top = {items.length - 1}</span>
        {result !== null && (
          <span className="chip border-emerald/40 bg-emerald/10 text-emerald">
            returned {result}
          </span>
        )}
      </div>

      <div
        className="flex flex-col items-start gap-1"
        role="img"
        aria-label={
          items.length === 0
            ? 'Empty stack'
            : `Stack from top to bottom: ${[...items].reverse().join(', ')}`
        }
      >
        {Array.from({ length: freeSlots }).map((_, i) => (
          <div
            key={`free-${i}`}
            className="flex h-9 w-44 items-center justify-center rounded-md border border-dashed border-line text-[11px] text-ink-dim/50"
          >
            free slot
          </div>
        ))}

        <AnimatePresence initial={false}>
          {[...items]
            .map((value, index) => ({ value, index }))
            .reverse()
            .map(({ value, index }) => {
              const role = resolveRole(index, {
                compared: step?.comparedIndices,
                swapped: step?.swappedIndices,
                sorted: step?.sortedIndices,
                active: step?.activeIndices,
              });
              const isTop = index === items.length - 1;
              return (
                <motion.div
                  key={`${index}-${value}`}
                  layout
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-2"
                >
                  <div
                    className={cn(
                      'flex h-9 w-44 items-center justify-between rounded-md border-2 px-3 font-mono text-[13px] tabular-nums',
                    )}
                    style={{
                      borderColor:
                        role === 'idle'
                          ? 'var(--color-line-strong)'
                          : roleColor(role),
                      backgroundColor:
                        role === 'idle'
                          ? 'var(--color-canvas)'
                          : `color-mix(in srgb, ${roleColor(role)} 16%, transparent)`,
                    }}
                  >
                    <span className="text-[10px] text-ink-dim">[{index}]</span>
                    <span>{value}</span>
                  </div>
                  {isTop && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-accent">
                      <ArrowLeft size={13} aria-hidden />
                      top
                    </span>
                  )}
                </motion.div>
              );
            })}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="flex h-9 w-44 items-center justify-center rounded-md border border-line bg-surface-2 text-[11px] text-ink-dim">
            empty · top = −1
          </div>
        )}

        <div className="mt-0.5 w-44 border-t-2 border-line-strong pt-1 text-center text-[10px] uppercase tracking-wider text-ink-dim">
          bottom
        </div>
      </div>

      {status && (
        <p
          role="alert"
          className="flex items-center gap-2 text-[13px] text-rose"
        >
          <AlertTriangle size={15} aria-hidden />
          Stack {status}.
        </p>
      )}
    </div>
  );
}
