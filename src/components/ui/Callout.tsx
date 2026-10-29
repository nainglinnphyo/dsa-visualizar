import { AlertTriangle, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CalloutProps {
  tone?: 'info' | 'warning';
  children: ReactNode;
  className?: string;
}

export function Callout({ tone = 'info', children, className }: CalloutProps) {
  const Icon = tone === 'warning' ? AlertTriangle : Info;
  return (
    <div
      role={tone === 'warning' ? 'alert' : undefined}
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed',
        tone === 'warning'
          ? 'border-rose/40 bg-rose/10 text-rose'
          : 'border-line bg-surface-2 text-ink-soft',
        className,
      )}
    >
      <Icon size={14} className="mt-px shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
