import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { MULTIPLIER, type HashTableState } from '@/algorithms/structures/hash-table';
import { cn } from '@/lib/cn';

interface HashTableCanvasProps {
  state: HashTableState;
}

export function HashTableCanvas({ state }: HashTableCanvasProps) {
  const { buckets, hashTrace, highlight, probes, capacity, count, strategy } =
    state;
  const loadFactor = (count / capacity).toFixed(2);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">
          {strategy === 'chaining' ? 'separate chaining' : 'linear probing'}
        </span>
        <span className="chip">capacity = {capacity}</span>
        <span className="chip">entries = {count}</span>
        <span
          className={cn(
            'chip',
            Number(loadFactor) > 0.7 && 'border-amber/50 text-amber',
          )}
        >
          load factor = {loadFactor}
        </span>
        {state.result && (
          <span className="chip border-emerald/40 bg-emerald/10 text-emerald">
            {state.result}
          </span>
        )}
      </div>

      <div className="rounded-lg border border-line bg-canvas p-3">
        <p className="panel-title mb-2">Hash function</p>
        {hashTrace ? (
          <div className="min-w-0 space-y-2">
            <p className="font-mono text-[11.5px] text-ink-soft">
              h = (h × {MULTIPLIER} + charCode) mod {capacity}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] text-ink-dim">
                "{hashTrace.key}"
              </span>
              <ArrowRight size={12} aria-hidden className="text-ink-dim" />
              <span className="font-mono text-[11px] text-ink-dim">h = 0</span>
              {hashTrace.steps.map((charStep, index) => (
                <motion.span
                  key={`${charStep.char}-${index}`}
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <ArrowRight size={12} aria-hidden className="text-ink-dim" />
                  <span className="rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                    '{charStep.char}'={charStep.code} → {charStep.accumulator}
                  </span>
                </motion.span>
              ))}
              {hashTrace.steps.length > 0 &&
                hashTrace.steps.length ===
                  [...hashTrace.key].length && (
                  <span className="chip border-accent/40 bg-accent-soft text-accent">
                    bucket {hashTrace.hash}
                  </span>
                )}
            </div>
          </div>
        ) : (
          <p className="text-[11.5px] text-ink-dim">
            Run an operation to watch the key get hashed character by character.
          </p>
        )}
      </div>

      <div>
        <p className="panel-title mb-2">Buckets</p>
        <ul className="space-y-1">
          {buckets.map((slot, index) => {
            const active = highlight.includes(index);
            const probed = probes.includes(index) && !active;
            return (
              <li
                key={index}
                className={cn(
                  'flex min-h-9 items-center gap-2 rounded-md border px-2 py-1 transition-colors',
                  active
                    ? 'border-accent bg-accent/12'
                    : probed
                      ? 'border-amber/50 bg-amber/5'
                      : 'border-line bg-canvas',
                )}
              >
                <span className="w-6 shrink-0 text-right font-mono text-[11px] text-ink-dim">
                  {index}
                </span>
                {slot.kind === 'empty' && (
                  <span className="text-[11px] text-ink-dim/60">empty</span>
                )}
                {slot.kind === 'tombstone' && (
                  <span className="rounded border border-dashed border-rose/50 px-1.5 py-0.5 font-mono text-[11px] text-rose/80">
                    tombstone
                  </span>
                )}
                {slot.kind === 'entries' && (
                  <div className="flex min-w-0 flex-wrap items-center gap-1">
                    {slot.entries.map((entry, i) => (
                      <motion.span
                        key={entry.key}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1"
                      >
                        {i > 0 && (
                          <ArrowRight
                            size={11}
                            aria-hidden
                            className="text-ink-dim"
                          />
                        )}
                        <span className="rounded border border-line-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                          {entry.key}: {entry.value}
                        </span>
                      </motion.span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
