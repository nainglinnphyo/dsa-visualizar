import { Gauge } from 'lucide-react';
import { Panel } from '@/components/ui';
import type { ComplexityInfo } from '@/types/learning';

interface ComplexityPanelProps {
  /** Complexity of the specific run being visualized. */
  timeComplexity: string;
  spaceComplexity: string;
  info?: ComplexityInfo;
  className?: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <dt className="text-[11px] text-ink-dim">{label}</dt>
      <dd className="font-mono text-[11.5px] text-ink">{value}</dd>
    </div>
  );
}

export function ComplexityPanel({
  timeComplexity,
  spaceComplexity,
  info,
  className,
}: ComplexityPanelProps) {
  return (
    <Panel
      title="Complexity"
      icon={<Gauge size={13} aria-hidden />}
      className={className}
    >
      <dl className="divide-y divide-line">
        <Row label="Time" value={timeComplexity} />
        <Row label="Space" value={spaceComplexity} />
        {info?.best && <Row label="Best case" value={info.best} />}
        {info?.average && <Row label="Average case" value={info.average} />}
        {info?.worst && <Row label="Worst case" value={info.worst} />}
        {info?.stable !== undefined && (
          <Row label="Stable" value={info.stable ? 'yes' : 'no'} />
        )}
        {info?.inPlace !== undefined && (
          <Row label="In place" value={info.inPlace ? 'yes' : 'no'} />
        )}
      </dl>
    </Panel>
  );
}
