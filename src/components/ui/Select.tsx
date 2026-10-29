import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

interface SelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  hint?: string;
  className?: string;
  hideLabel?: boolean;
}

export function Select({
  label,
  value,
  options,
  onChange,
  hint,
  className,
  hideLabel = false,
}: SelectProps) {
  const id = useId();
  const groups = [...new Set(options.map((option) => option.group))];
  const grouped = groups.length > 1 || groups[0] !== undefined;

  return (
    <div className={cn('min-w-0', className)}>
      <label
        htmlFor={id}
        className={cn('panel-title mb-1 block', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field appearance-none pr-8"
        >
          {grouped
            ? groups.map((group) => (
                <optgroup key={group ?? 'other'} label={group ?? 'Other'}>
                  {options
                    .filter((option) => option.group === group)
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </optgroup>
              ))
            : options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
        </select>
        <ChevronDown
          size={14}
          aria-hidden
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-dim"
        />
      </div>
      {hint && <p className="mt-1 text-[11px] text-ink-dim">{hint}</p>}
    </div>
  );
}
