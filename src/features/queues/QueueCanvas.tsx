import { AlertTriangle } from 'lucide-react';
import { ArrayCells, type CellPointer } from '@/components/visualization/ArrayCells';
import type { QueueState } from '@/algorithms/structures/queue';
import type { VisualizationStep } from '@/engine/types';

interface QueueCanvasProps {
  state: QueueState;
  step?: VisualizationStep<QueueState>;
}

/** Reads the logical contents front-to-rear, honouring wrap-around. */
export function queueOrder(state: QueueState): number[] {
  const out: number[] = [];
  for (let i = 0; i < state.size; i += 1) {
    const index = state.circular
      ? (state.front + i) % state.capacity
      : state.front + i;
    const value = state.slots[index];
    if (value !== null && value !== undefined) out.push(value);
  }
  return out;
}

export function QueueCanvas({ state, step }: QueueCanvasProps) {
  const pointers: CellPointer[] = [];
  if (state.size > 0) {
    pointers.push({ index: state.front, label: 'front' });
    if (state.rear >= 0) pointers.push({ index: state.rear, label: 'rear' });
  }

  const order = queueOrder(state);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">{state.circular ? 'circular' : 'linear'}</span>
        <span className="chip">size = {state.size}</span>
        <span className="chip">capacity = {state.capacity}</span>
        <span className="chip">front = {state.front}</span>
        <span className="chip">rear = {state.rear}</span>
        {state.result !== null && (
          <span className="chip border-emerald/40 bg-emerald/10 text-emerald">
            returned {state.result}
          </span>
        )}
      </div>

      <div>
        <p className="panel-title mb-2">Backing array</p>
        <ArrayCells
          values={state.slots}
          roles={{
            compared: step?.comparedIndices,
            swapped: step?.swappedIndices,
            sorted: step?.sortedIndices,
            active: step?.activeIndices,
          }}
          pointers={pointers}
          ariaLabel={`Queue backing array of ${state.capacity} slots`}
        />
      </div>

      <div>
        <p className="panel-title mb-1.5">Logical order (front → rear)</p>
        <p className="font-mono text-[12px] text-ink-soft">
          {order.length === 0 ? (
            <span className="text-ink-dim">empty</span>
          ) : (
            order.join('  →  ')
          )}
        </p>
      </div>

      {!state.circular && state.rear === state.capacity - 1 && state.front > 0 && (
        <p className="text-[11.5px] leading-relaxed text-amber">
          The linear queue reports itself full even though indices 0…
          {state.front - 1} are free. Those slots can never be reused because
          rear only moves forward — switch to circular to reclaim them.
        </p>
      )}

      {state.status && (
        <p role="alert" className="flex items-center gap-2 text-[13px] text-rose">
          <AlertTriangle size={15} aria-hidden />
          Queue {state.status}.
        </p>
      )}
    </div>
  );
}
