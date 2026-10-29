import { motion } from 'framer-motion';
import { resolveRole, roleColor, type RoleSets } from './roles';
import { cn } from '@/lib/cn';

export interface CellPointer {
  index: number;
  label: string;
}

interface ArrayCellsProps {
  values: (number | string | null)[];
  roles?: RoleSets;
  /** Labelled arrows drawn under the cells, e.g. front / rear / low / high. */
  pointers?: CellPointer[];
  /** Indices outside this range are dimmed as "eliminated". */
  activeRange?: { low: number; high: number } | null;
  emptyLabel?: string;
  /** Accessible summary of the whole row. */
  ariaLabel?: string;
  size?: 'sm' | 'md';
}

export function ArrayCells({
  values,
  roles = {},
  pointers = [],
  activeRange = null,
  emptyLabel = 'empty',
  ariaLabel,
  size = 'md',
}: ArrayCellsProps) {
  if (values.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-dim">{emptyLabel}</p>;
  }

  const pointersByIndex = new Map<number, string[]>();
  for (const pointer of pointers) {
    const existing = pointersByIndex.get(pointer.index) ?? [];
    existing.push(pointer.label);
    pointersByIndex.set(pointer.index, existing);
  }

  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="img"
      aria-label={
        ariaLabel ??
        `Array of ${values.length} cells: ${values.map((v) => (v === null ? 'empty' : v)).join(', ')}`
      }
    >
      {values.map((value, index) => {
        const role = resolveRole(index, roles);
        const dimmed =
          activeRange !== null &&
          (index < activeRange.low || index > activeRange.high);
        const labels = pointersByIndex.get(index);
        return (
          <div key={index} className="flex flex-col items-center">
            <motion.div
              initial={false}
              animate={{
                borderColor: role === 'idle' ? 'var(--color-line-strong)' : roleColor(role),
                backgroundColor:
                  role === 'idle' ? 'var(--color-canvas)' : `${roleColor(role)}22`,
              }}
              transition={{ duration: 0.16 }}
              className={cn(
                'flex items-center justify-center rounded-md border-2 font-mono tabular-nums',
                size === 'sm'
                  ? 'h-8 min-w-8 px-1.5 text-[12px]'
                  : 'h-11 min-w-11 px-2 text-[13px]',
                value === null ? 'text-ink-dim/50' : 'text-ink',
                dimmed && 'opacity-30',
              )}
            >
              {value === null ? '·' : value}
            </motion.div>
            <span
              className={cn(
                'mt-1 font-mono text-[10px] text-ink-dim/70',
                dimmed && 'opacity-40',
              )}
            >
              {index}
            </span>
            {labels && (
              <span className="mt-0.5 flex flex-col items-center gap-0.5">
                {labels.map((label) => (
                  <span
                    key={label}
                    className="rounded bg-surface-3 px-1 py-px font-mono text-[9px] text-accent"
                  >
                    {label}
                  </span>
                ))}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
