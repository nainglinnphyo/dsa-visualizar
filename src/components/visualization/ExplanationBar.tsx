import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface ExplanationBarProps {
  description: string;
  operation?: string;
  stepKey: number;
  className?: string;
}

/** The "what just happened" line under the canvas. Announced to screen readers. */
export function ExplanationBar({
  description,
  operation,
  stepKey,
  className,
}: ExplanationBarProps) {
  return (
    <div
      className={cn('card flex items-start gap-2.5 px-3 py-2.5', className)}
      aria-live="polite"
      aria-atomic="true"
    >
      {operation && (
        <span className="chip mt-px shrink-0 border-accent/40 bg-accent-soft text-accent">
          {operation}
        </span>
      )}
      <motion.p
        key={stepKey}
        initial={{ opacity: 0, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        className="min-w-0 text-[13px] leading-relaxed text-ink-soft"
      >
        {description}
      </motion.p>
    </div>
  );
}
