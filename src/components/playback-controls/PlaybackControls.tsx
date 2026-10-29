import {
  ChevronFirst,
  ChevronLast,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  SPEED_MAX,
  SPEED_MIN,
  type PlaybackController,
  type PlaybackSnapshot,
} from '@/engine/playback-controller';
import { Tooltip } from '@/components/ui';
import { cn } from '@/lib/cn';

interface PlaybackControlsProps {
  controller: PlaybackController;
  playback: PlaybackSnapshot;
  /** Extra controls rendered on the right, e.g. randomize. */
  trailing?: ReactNode;
  disabled?: boolean;
}

const SPEED_STOPS = [0.5, 1, 2, 4, 8, 16];

export function PlaybackControls({
  controller,
  playback,
  trailing,
  disabled = false,
}: PlaybackControlsProps) {
  const { index, total, isPlaying, atStart, atEnd, speed } = playback;
  const lastIndex = Math.max(0, total - 1);
  const noTrace = total === 0 || disabled;

  return (
    <div className="card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Tooltip label="First step (Home)">
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => controller.first()}
              disabled={noTrace || atStart}
              aria-label="Go to first step"
            >
              <ChevronFirst size={16} aria-hidden />
            </button>
          </Tooltip>
          <Tooltip label="Step backward (←)">
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => controller.previous()}
              disabled={noTrace || atStart}
              aria-label="Step backward"
            >
              <SkipBack size={15} aria-hidden />
            </button>
          </Tooltip>
          <Tooltip label={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
            <button
              type="button"
              className="btn btn-primary min-w-[88px]"
              onClick={() => controller.toggle()}
              disabled={noTrace || total <= 1}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={15} aria-hidden />
              ) : (
                <Play size={15} aria-hidden />
              )}
              {isPlaying ? 'Pause' : atEnd && total > 1 ? 'Replay' : 'Play'}
            </button>
          </Tooltip>
          <Tooltip label="Step forward (→)">
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => controller.next()}
              disabled={noTrace || atEnd}
              aria-label="Step forward"
            >
              <SkipForward size={15} aria-hidden />
            </button>
          </Tooltip>
          <Tooltip label="Last step (End)">
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => controller.last()}
              disabled={noTrace || atEnd}
              aria-label="Go to last step"
            >
              <ChevronLast size={16} aria-hidden />
            </button>
          </Tooltip>
          <Tooltip label="Reset to the initial state (R)">
            <button
              type="button"
              className="btn btn-icon"
              onClick={() => controller.reset()}
              disabled={noTrace}
              aria-label="Reset"
            >
              <RotateCcw size={14} aria-hidden />
            </button>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-ink-dim">
          <span className="panel-title">Speed</span>
          <div className="flex gap-0.5 rounded-lg border border-line bg-canvas p-0.5">
            {SPEED_STOPS.map((stop) => (
              <button
                key={stop}
                type="button"
                onClick={() => controller.setSpeed(stop)}
                aria-pressed={speed === stop}
                className={cn(
                  'rounded-md px-1.5 py-0.5 font-mono text-[11px] transition-colors',
                  speed === stop
                    ? 'bg-surface-3 text-ink'
                    : 'text-ink-dim hover:text-ink-soft',
                )}
              >
                {stop}×
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">{trailing}</div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <input
          type="range"
          className="range flex-1"
          min={0}
          max={lastIndex}
          step={1}
          value={index}
          disabled={noTrace || total <= 1}
          onChange={(event) => {
            controller.pause();
            controller.seek(Number(event.target.value));
          }}
          aria-label="Scrub to step"
          aria-valuetext={`Step ${total === 0 ? 0 : index + 1} of ${total}`}
        />
        <span
          className="shrink-0 font-mono text-[11px] tabular-nums text-ink-soft"
          aria-live="off"
        >
          {total === 0 ? '0 / 0' : `${index + 1} / ${total}`}
        </span>
      </div>

      <p className="mt-1.5 text-[11px] text-ink-dim">
        {noTrace
          ? 'No trace loaded.'
          : isPlaying
            ? `Playing at ${speed}× (${speed} step${speed === 1 ? '' : 's'} per second).`
            : atEnd && total > 1
              ? 'Finished — press Replay or step backward.'
              : atStart
                ? 'Ready. Press Play, or step through one operation at a time.'
                : 'Paused.'}
      </p>
      <span className="sr-only">
        Speed range {SPEED_MIN}× to {SPEED_MAX}×.
      </span>
    </div>
  );
}
