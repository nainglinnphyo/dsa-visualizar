import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { ArrayCells } from '@/components/visualization/ArrayCells';
import type {
  ArrayExtra,
  HanoiExtra,
  MazeExtra,
  QueensExtra,
} from '@/algorithms/recursion/types';
import { cn } from '@/lib/cn';

const PEG_NAMES = ['A', 'B', 'C'];

export function HanoiView({ extra }: { extra: HanoiExtra }) {
  const maxDisk = Math.max(
    1,
    ...extra.pegs.flatMap((peg) => peg),
  );

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">moves = {extra.moves}</span>
        {extra.moving !== null && (
          <span className="chip border-accent/40 bg-accent-soft text-accent">
            moving disk {extra.moving}
          </span>
        )}
      </div>
      <div
        className="grid grid-cols-3 gap-3"
        role="img"
        aria-label={extra.pegs
          .map((peg, i) => `Peg ${PEG_NAMES[i]}: ${peg.join(', ') || 'empty'}`)
          .join('. ')}
      >
        {extra.pegs.map((peg, pegIndex) => (
          <div key={pegIndex} className="flex flex-col items-center">
            <div className="flex h-36 w-full flex-col-reverse items-center justify-start gap-[3px] border-b-2 border-line-strong pb-1">
              <div
                aria-hidden
                className="absolute h-0 w-0"
              />
              {peg.map((disk) => (
                <motion.div
                  key={disk}
                  layout
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={cn(
                    'flex h-5 items-center justify-center rounded-sm font-mono text-[10px] text-ink',
                    extra.moving === disk
                      ? 'bg-viz-active/70'
                      : 'bg-viz-pivot/55',
                  )}
                  style={{ width: `${26 + (disk / maxDisk) * 64}%` }}
                >
                  {disk}
                </motion.div>
              ))}
            </div>
            <span className="mt-1 font-mono text-[11px] text-ink-dim">
              {PEG_NAMES[pegIndex]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MazeView({ extra }: { extra: MazeExtra }) {
  const pathIndex = new Map(extra.path.map((key, i) => [key, i]));

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">path = {extra.path.length}</span>
        <span className="chip">dead ends = {extra.deadEnds.length}</span>
        {extra.solved && (
          <span className="chip border-emerald/40 bg-emerald/10 text-emerald">
            solved
          </span>
        )}
      </div>
      <div
        className="inline-grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${extra.grid[0].length}, 1.6rem)` }}
        role="img"
        aria-label={`Maze ${extra.grid.length} by ${extra.grid[0].length}, ${extra.path.length} cells on the current path`}
      >
        {extra.grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r},${c}`;
            const onPath = pathIndex.has(key);
            const deadEnd = extra.deadEnds.includes(key);
            const isCurrent = extra.current === key;
            return (
              <div
                key={key}
                className={cn(
                  'flex h-[1.6rem] items-center justify-center rounded-[3px] font-mono text-[9px] transition-colors',
                  cell === 'wall' && 'bg-surface-3',
                  cell !== 'wall' && !onPath && !deadEnd && 'bg-canvas',
                  deadEnd && !onPath && 'bg-rose/15 text-rose/70',
                  onPath && 'bg-viz-active/30 text-ink',
                  isCurrent && 'ring-2 ring-accent',
                  cell === 'start' && 'bg-violet/35 text-ink',
                  cell === 'goal' && 'bg-emerald/35 text-ink',
                )}
              >
                {cell === 'start'
                  ? 'S'
                  : cell === 'goal'
                    ? 'G'
                    : onPath
                      ? pathIndex.get(key)
                      : deadEnd
                        ? '×'
                        : ''}
              </div>
            );
          }),
        )}
      </div>
      <p className="text-[11px] text-ink-dim">
        Numbers show the order of the current path. × marks a cell the solver
        stepped onto and then backtracked out of.
      </p>
    </div>
  );
}

export function QueensView({ extra }: { extra: QueensExtra }) {
  const placed = extra.queens.filter((column) => column >= 0).length;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">
          {placed} / {extra.size} queens placed
        </span>
        {extra.trying && (
          <span
            className={cn(
              'chip',
              extra.conflict
                ? 'border-rose/40 bg-rose/10 text-rose'
                : 'border-emerald/40 bg-emerald/10 text-emerald',
            )}
          >
            trying ({extra.trying.row}, {extra.trying.column})
          </span>
        )}
      </div>
      <div
        className="inline-grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${extra.size}, 2rem)` }}
        role="img"
        aria-label={`Chess board ${extra.size} by ${extra.size} with ${placed} queens placed`}
      >
        {Array.from({ length: extra.size }).map((_, row) =>
          Array.from({ length: extra.size }).map((__, column) => {
            const hasQueen = extra.queens[row] === column;
            const isTrying =
              extra.trying?.row === row && extra.trying?.column === column;
            const isConflict =
              extra.conflict?.row === row && extra.conflict?.column === column;
            const dark = (row + column) % 2 === 1;
            return (
              <div
                key={`${row}-${column}`}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-[3px] transition-colors',
                  dark ? 'bg-surface-3' : 'bg-surface-2',
                  isTrying &&
                    (extra.conflict
                      ? 'ring-2 ring-rose'
                      : 'ring-2 ring-emerald'),
                  isConflict && 'bg-rose/25',
                )}
              >
                {hasQueen && (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Crown size={15} className="text-amber" aria-hidden />
                  </motion.span>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

export function ArrayWindowView({ extra }: { extra: ArrayExtra }) {
  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip border-accent/40 bg-accent-soft text-accent">
          target = {extra.target}
        </span>
        <span className="chip">
          window = [{extra.low}…{extra.high}]
        </span>
      </div>
      <ArrayCells
        values={extra.values}
        size="sm"
        roles={{
          compared: extra.mid !== null ? [extra.mid] : [],
          sorted: extra.found !== null ? [extra.found] : [],
        }}
        pointers={
          extra.low <= extra.high
            ? [
                { index: extra.low, label: 'low' },
                { index: extra.high, label: 'high' },
                ...(extra.mid !== null
                  ? [{ index: extra.mid, label: 'mid' }]
                  : []),
              ]
            : []
        }
        activeRange={
          extra.low <= extra.high ? { low: extra.low, high: extra.high } : null
        }
      />
    </div>
  );
}
