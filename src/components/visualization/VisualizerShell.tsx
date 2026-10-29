import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface VisualizerShellProps {
  /** The main drawing area. */
  canvas: ReactNode;
  /** Legend / meta rendered directly under the canvas, inside the same card. */
  canvasFooter?: ReactNode;
  explanation: ReactNode;
  controls: ReactNode;
  /** Input configuration and operation panels. */
  config?: ReactNode;
  /** Code, complexity, statistics — stacked in the right rail. */
  rail: ReactNode;
  className?: string;
}

export function VisualizerShell({
  canvas,
  canvasFooter,
  explanation,
  controls,
  config,
  rail,
  className,
}: VisualizerShellProps) {
  return (
    <div
      className={cn(
        'grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="card min-w-0 p-3 sm:p-4">
          {canvas}
          {canvasFooter && (
            <div className="mt-3 border-t border-line pt-2.5">{canvasFooter}</div>
          )}
        </div>
        {explanation}
        {controls}
        {config}
      </div>
      <div className="flex min-w-0 flex-col gap-4">{rail}</div>
    </div>
  );
}
