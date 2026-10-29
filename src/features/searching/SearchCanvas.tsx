import { CheckCircle2, XCircle } from 'lucide-react';
import { ArrayCells, type CellPointer } from '@/components/visualization/ArrayCells';
import type { SearchState } from '@/algorithms/searching';
import type { VisualizationStep } from '@/engine/types';

interface SearchCanvasProps {
  step: VisualizationStep<SearchState>;
  showWindow: boolean;
}

export function SearchCanvas({ step, showWindow }: SearchCanvasProps) {
  const { values, target, foundIndex, range, exhausted } = step.state;

  const pointers: CellPointer[] = [];
  if (showWindow && range) {
    pointers.push({ index: range.low, label: 'low' });
    pointers.push({ index: range.high, label: 'high' });
    const mid = step.activeIndices?.[0];
    if (mid !== undefined) pointers.push({ index: mid, label: 'mid' });
  } else if (!showWindow) {
    const cursor = step.activeIndices?.[0];
    if (cursor !== undefined) pointers.push({ index: cursor, label: 'i' });
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="panel-title">Target</span>
        <span className="chip border-accent/40 bg-accent-soft text-sm text-accent">
          {target}
        </span>
        {showWindow && range && (
          <span className="text-[11px] text-ink-dim">
            Candidates remaining:{' '}
            <span className="font-mono text-ink-soft">
              {range.high - range.low + 1}
            </span>{' '}
            of {values.length}
          </span>
        )}
      </div>

      <ArrayCells
        values={values}
        roles={{
          compared: step.comparedIndices,
          active: step.activeIndices,
          sorted: step.sortedIndices,
        }}
        pointers={pointers}
        activeRange={showWindow ? range : null}
        ariaLabel={`Array of ${values.length} values searching for ${target}`}
      />

      {foundIndex !== null && (
        <p className="flex items-center gap-2 text-[13px] text-emerald">
          <CheckCircle2 size={15} aria-hidden />
          Found {target} at index {foundIndex}.
        </p>
      )}
      {exhausted && (
        <p className="flex items-center gap-2 text-[13px] text-rose">
          <XCircle size={15} aria-hidden />
          {target} is not in the array — the function returns −1.
        </p>
      )}
    </div>
  );
}
