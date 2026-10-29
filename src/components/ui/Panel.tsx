import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PanelProps {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Renders the panel as a collapsible disclosure. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function Panel({
  title,
  icon,
  actions,
  children,
  className,
  bodyClassName,
  collapsible = false,
  defaultOpen = true,
}: PanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  const isOpen = collapsible ? open : true;

  return (
    <section className={cn('card flex min-w-0 flex-col', className)}>
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-controls={bodyId}
            className="-mx-1 flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-0.5 text-left"
          >
            {icon && <span className="text-ink-dim">{icon}</span>}
            <span className="panel-title truncate">{title}</span>
            <ChevronDown
              size={13}
              className={cn(
                'ml-auto shrink-0 text-ink-dim transition-transform',
                !isOpen && '-rotate-90',
              )}
              aria-hidden
            />
          </button>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            {icon && <span className="text-ink-dim">{icon}</span>}
            <h2 className="panel-title truncate">{title}</h2>
          </div>
        )}
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </header>
      {isOpen && (
        <div id={bodyId} className={cn('min-w-0 p-3', bodyClassName)}>
          {children}
        </div>
      )}
    </section>
  );
}
