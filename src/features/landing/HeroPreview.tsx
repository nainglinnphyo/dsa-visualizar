import { useEffect } from 'react';
import { bubbleSort } from '@/algorithms/sorting/bubble-sort';
import { resolveRole, roleColor } from '@/components/visualization/roles';
import { usePlayback } from '@/hooks/usePlayback';
import { useAlgorithmTrace } from '@/hooks/useAlgorithmTrace';
import { cn } from '@/lib/cn';

const SAMPLE = [34, 12, 78, 45, 9, 61, 23, 55, 17, 40];
const RESTART_DELAY = 1600;

/**
 * The hero demo runs the real bubble sort through the real playback
 * controller — the same trace the sorting page would record. Nothing here is
 * a scripted animation.
 *
 * The bars animate with a CSS transition rather than Framer Motion so the
 * landing route does not pull an animation library into the entry bundle.
 */
export function HeroPreview() {
  const { result } = useAlgorithmTrace(bubbleSort, SAMPLE);
  const steps = result?.steps ?? [];
  const { controller, playback } = usePlayback(steps.length, {
    autoPlay: true,
    initialSpeed: 6,
  });

  // Loop the demo so the hero is never sitting on a finished sort.
  useEffect(() => {
    if (!playback.atEnd || playback.isPlaying) return;
    const timer = window.setTimeout(() => controller.play(), RESTART_DELAY);
    return () => window.clearTimeout(timer);
  }, [controller, playback.atEnd, playback.isPlaying]);

  const step = steps[playback.index];
  if (!step) return null;

  const { values } = step.state;
  const extent = Math.max(...values, 1);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <span className="panel-title">Bubble sort · live</span>
        <span className="font-mono text-[10px] tabular-nums text-ink-dim">
          step {playback.index + 1}/{steps.length}
        </span>
      </div>

      <div className="p-3">
        <div className="flex h-36 items-end gap-[3px]" aria-hidden>
          {values.map((value, index) => {
            const role = resolveRole(index, {
              sorted: step.sortedIndices,
              active: step.activeIndices,
              compared: step.comparedIndices,
              swapped: step.swappedIndices,
            });
            return (
              <div
                key={index}
                className="min-w-0 flex-1 rounded-t-[3px] transition-[height,background-color] duration-150 ease-out"
                style={{
                  height: `${8 + (value / extent) * 92}%`,
                  backgroundColor: roleColor(role),
                }}
              />
            );
          })}
        </div>

        <p className="mt-3 line-clamp-2 min-h-[2.1rem] text-[12px] leading-relaxed text-ink-soft">
          {step.description}
        </p>

        <dl className="mt-2 flex gap-4 border-t border-line pt-2">
          {[
            { label: 'comparisons', value: step.stats.comparisons },
            { label: 'swaps', value: step.stats.swaps },
          ].map((metric) => (
            <div key={metric.label} className="flex items-baseline gap-1.5">
              <dt className="text-[10px] uppercase tracking-wider text-ink-dim">
                {metric.label}
              </dt>
              <dd className="font-mono text-[12px] tabular-nums text-ink">
                {metric.value}
              </dd>
            </div>
          ))}
          <div
            className={cn(
              'ml-auto font-mono text-[11px]',
              playback.atEnd ? 'text-emerald' : 'text-ink-dim',
            )}
          >
            {playback.atEnd ? 'sorted' : 'running'}
          </div>
        </dl>
      </div>
    </div>
  );
}
