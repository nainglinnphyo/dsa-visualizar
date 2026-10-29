import { cn } from '@/lib/cn';

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

interface TabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 gap-0.5 rounded-lg border border-line bg-canvas p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md font-medium transition-colors',
              size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs',
              selected
                ? 'bg-surface-3 text-ink'
                : 'text-ink-dim hover:text-ink-soft',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
