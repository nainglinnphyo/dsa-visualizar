import { History } from 'lucide-react';
import { Panel } from '@/components/ui';
import { operationHistory } from '@/engine/statistics';
import type { VisualizationStep } from '@/engine/types';
import { cn } from '@/lib/cn';

interface OperationHistoryProps<T> {
  steps: VisualizationStep<T>[];
  index: number;
  onSelect: (index: number) => void;
  className?: string;
}

export function OperationHistory<T>({
  steps,
  index,
  onSelect,
  className,
}: OperationHistoryProps<T>) {
  const entries = operationHistory(steps, index);

  return (
    <Panel
      title="Operation history"
      icon={<History size={13} aria-hidden />}
      className={className}
      bodyClassName="p-0"
      collapsible
      defaultOpen={false}
    >
      {entries.length === 0 ? (
        <p className="px-3 py-2.5 text-[11px] text-ink-dim">
          No operations recorded yet.
        </p>
      ) : (
        <ol className="max-h-64 overflow-y-auto py-1">
          {entries.map((entry) => (
            <li key={entry.index}>
              <button
                type="button"
                onClick={() => onSelect(entry.index)}
                className={cn(
                  'flex w-full items-baseline gap-2 px-3 py-1 text-left text-[11px] transition-colors hover:bg-surface-2',
                  entry.index === index && 'bg-surface-2',
                )}
              >
                <span className="w-7 shrink-0 font-mono tabular-nums text-ink-dim">
                  {entry.index + 1}
                </span>
                <span className="w-24 shrink-0 font-mono text-accent/90">
                  {entry.operation}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink-soft">
                  {entry.description}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
