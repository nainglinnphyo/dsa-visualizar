import { useId, type ReactNode } from 'react';

interface TooltipProps {
  label: string;
  children: ReactNode;
}

/**
 * CSS-only tooltip. The label is also exposed to assistive tech via
 * `aria-describedby`, so it is not decoration-only.
 */
export function Tooltip({ label, children }: TooltipProps) {
  const id = useId();
  return (
    <span className="group/tooltip relative inline-flex">
      <span aria-describedby={id} className="inline-flex">
        {children}
      </span>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-line-strong bg-surface-3 px-2 py-1 text-[11px] text-ink-soft opacity-0 shadow-lg transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
