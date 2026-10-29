import { Monitor, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useThemeStore, type ThemePreference } from './theme';
import { cn } from '@/lib/cn';

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
];

interface ThemeToggleProps {
  /** `full` also renders the text labels. */
  size?: 'compact' | 'full';
  className?: string;
}

export function ThemeToggle({ size = 'compact', className }: ThemeToggleProps) {
  const preference = useThemeStore((state) => state.preference);
  const resolved = useThemeStore((state) => state.resolved);
  const setPreference = useThemeStore((state) => state.setPreference);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        'inline-flex gap-0.5 rounded-lg border border-line bg-canvas p-0.5',
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const selected = option.value === preference;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={
              option.value === 'system'
                ? `System theme (currently ${resolved})`
                : `${option.label} theme`
            }
            title={
              option.value === 'system'
                ? `Follow the system theme (currently ${resolved})`
                : `${option.label} theme`
            }
            onClick={() => setPreference(option.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-md transition-colors',
              size === 'full' ? 'flex-1 justify-center px-2 py-1' : 'px-1.5 py-1',
              selected
                ? 'bg-surface-3 text-ink'
                : 'text-ink-dim hover:text-ink-soft',
            )}
          >
            <option.icon size={13} aria-hidden />
            {size === 'full' && (
              <span className="text-[11px] font-medium">{option.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
