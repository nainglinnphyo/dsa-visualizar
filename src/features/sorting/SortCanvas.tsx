import { motion } from 'framer-motion';
import type { VisualizationStep } from '@/engine/types';
import type { SortState } from '@/algorithms/sorting';
import { resolveRole, roleColor } from '@/components/visualization/roles';
import { cn } from '@/lib/cn';

interface SortCanvasProps {
  step: VisualizationStep<SortState>;
}

const MIN_BAR_FRACTION = 0.06;

export function SortCanvas({ step }: SortCanvasProps) {
  const { values, pivotIndex, range, aux } = step.state;
  const showValues = values.length <= 28;
  const extent = values.length === 0 ? 1 : Math.max(...values.map(Math.abs), 1);

  return (
    <div className="min-w-0">
      {values.length === 0 ? (
        <p className="flex h-56 items-center justify-center text-sm text-ink-dim">
          The array is empty.
        </p>
      ) : (
        <div
          className="flex h-56 items-end gap-[3px] sm:h-64 lg:h-72"
          role="img"
          aria-label={`Array of ${values.length} values: ${values.join(', ')}`}
        >
          {values.map((value, index) => {
            const role = resolveRole(index, {
              sorted: step.sortedIndices,
              active: step.activeIndices,
              compared: step.comparedIndices,
              swapped: step.swappedIndices,
              pivot: pivotIndex,
            });
            const inRange =
              !range || (index >= range.low && index <= range.high);
            const fraction =
              MIN_BAR_FRACTION +
              (1 - MIN_BAR_FRACTION) * (Math.abs(value) / extent);

            return (
              <div
                key={index}
                className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                style={{ height: '100%' }}
              >
                <motion.div
                  className={cn(
                    'w-full rounded-t-[3px]',
                    !inRange && 'opacity-30',
                  )}
                  animate={{
                    height: `${fraction * 100}%`,
                    backgroundColor: roleColor(role),
                  }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  initial={false}
                />
                {showValues && (
                  <span
                    className={cn(
                      'font-mono text-[10px] tabular-nums',
                      role === 'idle' ? 'text-ink-dim' : 'text-ink',
                      !inRange && 'opacity-40',
                    )}
                  >
                    {value}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showValues && values.length > 0 && (
        <div className="mt-1 flex gap-[3px] border-t border-line pt-1">
          {values.map((_, index) => (
            <span
              key={index}
              className="min-w-0 flex-1 text-center font-mono text-[9px] text-ink-dim/70"
            >
              {index}
            </span>
          ))}
        </div>
      )}

      {aux && aux.length > 0 && (
        <div className="mt-4 space-y-2.5 border-t border-line pt-3">
          {aux.map((view) => (
            <div key={view.label} className="min-w-0">
              <p className="panel-title mb-1">{view.label}</p>
              {view.values.length === 0 ? (
                <p className="text-[11px] text-ink-dim">empty</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {view.values.map((cell, index) => {
                    const isActive = view.activeIndices?.includes(index);
                    return (
                      <div
                        key={index}
                        className={cn(
                          'flex min-w-7 flex-col items-center rounded border px-1.5 py-0.5 font-mono text-[11px] tabular-nums',
                          isActive
                            ? 'border-accent bg-accent/15 text-ink'
                            : cell === null
                              ? 'border-dashed border-line text-ink-dim/50'
                              : 'border-line bg-canvas text-ink-soft',
                        )}
                      >
                        <span>{cell === null ? '·' : cell}</span>
                        {view.indexLabels && (
                          <span className="text-[9px] text-ink-dim/70">
                            {view.indexLabels[index]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {range && (
        <p className="mt-3 text-[11px] text-ink-dim">
          Working range:{' '}
          <span className="font-mono text-ink-soft">
            a[{range.low}…{range.high}]
          </span>{' '}
          — values outside it are dimmed.
        </p>
      )}
    </div>
  );
}
