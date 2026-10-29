import { useEffect, useState } from 'react';
import { Check, Shuffle, Sliders } from 'lucide-react';
import { Callout, Panel, Slider } from '@/components/ui';
import { InputError } from '@/engine/types';
import { formatList, parseNumberList } from '@/lib/numbers';

export type Preset = 'random' | 'sorted' | 'reversed' | 'few-unique' | 'nearly-sorted';

export const PRESETS: { value: Preset; label: string }[] = [
  { value: 'random', label: 'Random' },
  { value: 'sorted', label: 'Sorted' },
  { value: 'reversed', label: 'Reversed' },
  { value: 'few-unique', label: 'Few unique' },
  { value: 'nearly-sorted', label: 'Nearly sorted' },
];

interface ArrayInputPanelProps {
  values: number[];
  size: number;
  minSize: number;
  maxSize: number;
  maxValue: number;
  onSizeChange: (size: number) => void;
  onPreset: (preset: Preset) => void;
  onApplyValues: (values: number[]) => void;
  disabled?: boolean;
  note?: string;
}

export function ArrayInputPanel({
  values,
  size,
  minSize,
  maxSize,
  maxValue,
  onSizeChange,
  onPreset,
  onApplyValues,
  disabled = false,
  note,
}: ArrayInputPanelProps) {
  const [draft, setDraft] = useState(() => formatList(values));
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  // Keep the textarea in sync when the array changes from elsewhere
  // (randomize, preset, size slider) without clobbering an in-progress edit.
  useEffect(() => {
    setDraft(formatList(values));
    setError(null);
  }, [values]);

  const apply = (): void => {
    try {
      const parsed = parseNumberList(draft, {
        min: -maxValue,
        max: maxValue,
        maxLength: maxSize,
        allowEmpty: true,
      });
      setError(null);
      onApplyValues(parsed);
      setApplied(true);
      window.setTimeout(() => setApplied(false), 1200);
    } catch (cause) {
      setError(cause instanceof InputError ? cause.message : 'Invalid input.');
    }
  };

  return (
    <Panel
      title="Input"
      icon={<Sliders size={13} aria-hidden />}
      collapsible
      defaultOpen
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <Slider
            label="Array size"
            value={size}
            min={minSize}
            max={maxSize}
            onChange={onSizeChange}
            disabled={disabled}
            format={(value) => `${value} values`}
          />
          <div>
            <p className="panel-title mb-1.5">Generate</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className="btn"
                  disabled={disabled}
                  onClick={() => onPreset(preset.value)}
                >
                  {preset.value === 'random' && (
                    <Shuffle size={13} aria-hidden />
                  )}
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <label htmlFor="custom-values" className="panel-title mb-1.5 block">
            Custom values
          </label>
          <textarea
            id="custom-values"
            value={draft}
            rows={3}
            spellCheck={false}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                apply();
              }
            }}
            className="field resize-y font-mono text-[12px]"
            placeholder="e.g. 5, 1, 4, 2, 8"
            aria-describedby="custom-values-hint"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p id="custom-values-hint" className="text-[11px] text-ink-dim">
              Up to {maxSize} whole numbers, −{maxValue}…{maxValue}.
            </p>
            <button type="button" className="btn" onClick={apply}>
              {applied ? <Check size={13} aria-hidden /> : null}
              {applied ? 'Applied' : 'Apply'}
            </button>
          </div>
          {error && (
            <Callout tone="warning" className="mt-2">
              {error}
            </Callout>
          )}
          {note && !error && (
            <Callout className="mt-2">{note}</Callout>
          )}
        </div>
      </div>
    </Panel>
  );
}
