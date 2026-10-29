import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowLeftRight } from 'lucide-react';
import {
  listOrder,
  type LinkedListState,
} from '@/algorithms/structures/linked-list';
import { cn } from '@/lib/cn';

interface LinkedListCanvasProps {
  state: LinkedListState;
}

function NodeBox({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: 'idle' | 'cursor' | 'changed' | 'found' | 'detaching';
}) {
  return (
    <div
      className={cn(
        'flex min-w-[4.5rem] flex-col items-center rounded-lg border-2 px-3 py-2 transition-colors',
        tone === 'cursor' && 'border-accent bg-accent/12',
        tone === 'changed' && 'border-viz-swap bg-rose/12',
        tone === 'found' && 'border-viz-sorted bg-emerald/12',
        tone === 'detaching' && 'border-dashed border-rose/60 bg-rose/5 opacity-50',
        tone === 'idle' && 'border-line-strong bg-canvas',
      )}
    >
      <span className="font-mono text-[14px] tabular-nums text-ink">{value}</span>
      <span className="mt-0.5 font-mono text-[9px] text-ink-dim">{label}</span>
    </div>
  );
}

export function LinkedListCanvas({ state }: LinkedListCanvasProps) {
  const order = listOrder(state);
  const detached =
    state.detaching && state.nodes[state.detaching]
      ? state.nodes[state.detaching]
      : null;

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">{state.doubly ? 'doubly linked' : 'singly linked'}</span>
        <span className="chip">length = {order.length}</span>
        <span className="chip">
          head = {state.head ? state.nodes[state.head]?.value ?? 'null' : 'null'}
        </span>
        <span className="chip">
          tail = {state.tail ? state.nodes[state.tail]?.value ?? 'null' : 'null'}
        </span>
      </div>

      {order.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-dim">
          The list is empty — head points at null.
        </p>
      ) : (
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="img"
          aria-label={`Linked list: ${order.map((id) => state.nodes[id].value).join(' then ')}`}
        >
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-accent">
            head
          </span>
          <AnimatePresence initial={false} mode="popLayout">
            {order.map((id, index) => {
              const node = state.nodes[id];
              const tone =
                state.found === id
                  ? 'found'
                  : state.cursor === id
                    ? 'cursor'
                    : state.changed.includes(id)
                      ? 'changed'
                      : 'idle';
              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-1.5"
                >
                  <NodeBox value={node.value} label={`[${index}]`} tone={tone} />
                  {index < order.length - 1 ? (
                    state.doubly ? (
                      <ArrowLeftRight
                        size={15}
                        aria-hidden
                        className="shrink-0 text-ink-dim"
                      />
                    ) : (
                      <ArrowRight
                        size={15}
                        aria-hidden
                        className="shrink-0 text-ink-dim"
                      />
                    )
                  ) : (
                    <>
                      <ArrowRight
                        size={15}
                        aria-hidden
                        className="shrink-0 text-ink-dim"
                      />
                      <span className="font-mono text-[11px] text-ink-dim">
                        null
                      </span>
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {detached && (
        <div className="flex items-center gap-2">
          <NodeBox value={detached.value} label="detached" tone="detaching" />
          <p className="text-[11.5px] text-rose">
            No node points here any more, so this one is garbage.
          </p>
        </div>
      )}
    </div>
  );
}
