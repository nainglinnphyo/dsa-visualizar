import { AnimatePresence, motion } from 'framer-motion';
import type { RecursionState } from '@/algorithms/recursion/types';
import { cn } from '@/lib/cn';

export function CallStackView({ state }: { state: RecursionState }) {
  const frames = [...state.frames].reverse();

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="panel-title">Call stack (top first)</p>
        <span className="chip">depth = {state.frames.length}</span>
      </div>

      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {frames.map((frame) => (
            <motion.div
              key={frame.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'flex items-center justify-between gap-3 rounded-md border px-2.5 py-1.5 font-mono text-[12px]',
                frame.status === 'active' && 'border-accent bg-accent/12 text-ink',
                frame.status === 'returning' &&
                  'border-emerald/60 bg-emerald/10 text-ink',
                frame.status === 'waiting' &&
                  'border-line bg-canvas text-ink-dim',
              )}
              style={{ marginLeft: `${Math.min(frame.depth - 1, 8) * 8}px` }}
            >
              <span className="truncate">{frame.label}</span>
              <span className="shrink-0 text-[11px]">
                {frame.status === 'returning' ? (
                  <span className="text-emerald">→ {frame.result}</span>
                ) : frame.status === 'active' ? (
                  <span className="text-accent">running</span>
                ) : (
                  'waiting'
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {frames.length === 0 && (
          <p className="rounded-md border border-dashed border-line px-2.5 py-2 text-[11.5px] text-ink-dim">
            The stack is empty.
          </p>
        )}
      </div>

      {state.returns.length > 0 && (
        <div className="border-t border-line pt-2">
          <p className="panel-title mb-1">Returned values</p>
          <p className="font-mono text-[11.5px] text-ink-soft">
            {state.returns
              .map((entry) => `${entry.label} → ${entry.result}`)
              .join('   ·   ')}
          </p>
        </div>
      )}

      {state.result !== null && (
        <p className="border-t border-line pt-2 font-mono text-[12.5px] text-emerald">
          result: {state.result}
        </p>
      )}
    </div>
  );
}
