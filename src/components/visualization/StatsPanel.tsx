import { Activity } from 'lucide-react';
import { Panel } from '@/components/ui';
import { relevantMetrics } from '@/engine/statistics';
import type { VisualizationStep } from '@/engine/types';

interface StatsPanelProps<T> {
  steps: VisualizationStep<T>[];
  index: number;
  className?: string;
}

export function StatsPanel<T>({ steps, index, className }: StatsPanelProps<T>) {
  const current = steps[index];
  const metrics = relevantMetrics(steps, current?.stats);

  return (
    <Panel
      title="Statistics"
      icon={<Activity size={13} aria-hidden />}
      className={className}
    >
      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-line bg-canvas px-2.5 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-ink-dim">
            Step
          </dt>
          <dd className="font-mono text-sm tabular-nums text-ink">
            {steps.length === 0 ? 0 : index + 1}
            <span className="text-ink-dim"> / {steps.length}</span>
          </dd>
        </div>
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="rounded-lg border border-line bg-canvas px-2.5 py-2"
          >
            <dt className="text-[10px] uppercase tracking-wider text-ink-dim">
              {metric.label}
            </dt>
            <dd className="font-mono text-sm tabular-nums text-ink">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
      {metrics.length === 0 && (
        <p className="mt-2 text-[11px] text-ink-dim">
          This operation does not record comparisons or writes.
        </p>
      )}
    </Panel>
  );
}
