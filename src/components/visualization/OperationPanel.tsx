import { Play, Terminal } from 'lucide-react';
import type { ReactNode } from 'react';
import { Callout, Panel } from '@/components/ui';
import { cn } from '@/lib/cn';

export interface OperationFieldSpec {
  name: string;
  label: string;
  placeholder?: string;
  /** Rendered as a numeric field with inputMode numeric. */
  numeric?: boolean;
}

export interface OperationChoice {
  id: string;
  label: string;
  description: string;
  fields: OperationFieldSpec[];
}

interface OperationPanelProps {
  operations: OperationChoice[];
  selected: string;
  onSelect: (id: string) => void;
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  onRun: () => void;
  error?: string | null;
  /** Rendered under the form, e.g. structure-level toggles. */
  extra?: ReactNode;
  runLabel?: string;
  busy?: boolean;
  title?: string;
}

export function OperationPanel({
  operations,
  selected,
  onSelect,
  values,
  onChange,
  onRun,
  error,
  extra,
  runLabel = 'Run operation',
  busy = false,
  title = 'Operations',
}: OperationPanelProps) {
  const operation =
    operations.find((item) => item.id === selected) ?? operations[0];

  return (
    <Panel title={title} icon={<Terminal size={13} aria-hidden />} collapsible>
      <div
        role="radiogroup"
        aria-label="Operation"
        className="flex flex-wrap gap-1.5"
      >
        {operations.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={item.id === operation.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              'btn',
              item.id === operation.id &&
                'border-accent bg-accent-soft text-accent',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="mt-2.5 text-[12px] text-ink-dim">{operation.description}</p>

      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onRun();
        }}
      >
        {operation.fields.map((field) => (
          <div key={field.name} className="w-28 min-w-0">
            <label
              htmlFor={`op-${field.name}`}
              className="panel-title mb-1 block"
            >
              {field.label}
            </label>
            <input
              id={`op-${field.name}`}
              className="field font-mono"
              value={values[field.name] ?? ''}
              placeholder={field.placeholder}
              inputMode={field.numeric ? 'numeric' : undefined}
              onChange={(event) => onChange(field.name, event.target.value)}
            />
          </div>
        ))}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          <Play size={13} aria-hidden />
          {runLabel}
        </button>
      </form>

      {error && (
        <Callout tone="warning" className="mt-2.5">
          {error}
        </Callout>
      )}

      {extra && <div className="mt-3 border-t border-line pt-3">{extra}</div>}
    </Panel>
  );
}
