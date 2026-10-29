/**
 * Framework-agnostic playback state machine.
 *
 * Owns exactly one timer at a time so playback can never double-advance, and
 * exposes a `subscribe`/`getSnapshot` pair that React binds to with
 * `useSyncExternalStore`.
 */

export interface PlaybackSnapshot {
  index: number;
  total: number;
  isPlaying: boolean;
  /** Steps per second. */
  speed: number;
  atStart: boolean;
  atEnd: boolean;
}

export interface PlaybackOptions {
  total?: number;
  speed?: number;
  /** Injectable for tests. */
  now?: () => number;
}

export const SPEED_MIN = 0.25;
export const SPEED_MAX = 16;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export class PlaybackController {
  private index = 0;
  private total: number;
  private playing = false;
  private rate: number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  private snapshot: PlaybackSnapshot;

  constructor(options: PlaybackOptions = {}) {
    this.total = Math.max(0, options.total ?? 0);
    this.rate = clamp(options.speed ?? 2, SPEED_MIN, SPEED_MAX);
    this.snapshot = this.buildSnapshot();
  }

  /* ---------------------------------------------------------------- store */

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): PlaybackSnapshot => this.snapshot;

  private buildSnapshot(): PlaybackSnapshot {
    const lastIndex = Math.max(0, this.total - 1);
    return {
      index: this.index,
      total: this.total,
      isPlaying: this.playing,
      speed: this.rate,
      atStart: this.index === 0,
      atEnd: this.total === 0 || this.index >= lastIndex,
    };
  }

  private emit(): void {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) listener();
  }

  /* ------------------------------------------------------------- commands */

  /** Swap in a new trace. Resets position and stops playback. */
  load(total: number, options: { keepPlaying?: boolean } = {}): void {
    this.clearTimer();
    this.total = Math.max(0, total);
    this.index = 0;
    this.playing = options.keepPlaying === true && this.total > 1;
    this.emit();
    if (this.playing) this.scheduleNext();
  }

  play(): void {
    if (this.total <= 1) return;
    if (this.snapshot.atEnd) this.index = 0;
    if (this.playing) return;
    this.playing = true;
    this.emit();
    this.scheduleNext();
  }

  pause(): void {
    if (!this.playing) return;
    this.clearTimer();
    this.playing = false;
    this.emit();
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  next(): void {
    this.pause();
    this.seek(this.index + 1);
  }

  previous(): void {
    this.pause();
    this.seek(this.index - 1);
  }

  first(): void {
    this.pause();
    this.seek(0);
  }

  last(): void {
    this.pause();
    this.seek(this.total - 1);
  }

  /** Back to the first step without changing the loaded trace. */
  reset(): void {
    this.clearTimer();
    this.playing = false;
    this.index = 0;
    this.emit();
  }

  seek(index: number): void {
    const target = clamp(index, 0, Math.max(0, this.total - 1));
    if (target === this.index) return;
    this.index = target;
    this.emit();
  }

  setSpeed(stepsPerSecond: number): void {
    const next = clamp(stepsPerSecond, SPEED_MIN, SPEED_MAX);
    if (next === this.rate) return;
    this.rate = next;
    this.emit();
    if (this.playing) {
      // Re-arm so the new rate takes effect immediately.
      this.clearTimer();
      this.scheduleNext();
    }
  }

  /** Must be called when the owning component unmounts. */
  dispose(): void {
    this.clearTimer();
    this.listeners.clear();
  }

  /* --------------------------------------------------------------- timers */

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNext(): void {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      if (!this.playing) return;
      if (this.index >= this.total - 1) {
        this.playing = false;
        this.emit();
        return;
      }
      this.index += 1;
      this.emit();
      if (this.playing) this.scheduleNext();
    }, 1000 / this.rate);
  }
}
