import {
  emptyStats,
  type AlgorithmResult,
  type StepStats,
  type VisualizationStep,
} from './types';

type StepInput<T> = Omit<VisualizationStep<T>, 'stats'> & {
  stats?: Partial<StepStats>;
};

/**
 * Collects visualization steps while an algorithm runs and keeps running
 * totals of comparisons/swaps/reads/writes.
 *
 * Every recorded step gets a *copy* of the counters, so navigating backwards
 * through the trace restores the statistics that were true at that moment.
 */
export class StepRecorder<T> {
  private readonly steps: VisualizationStep<T>[] = [];
  private counters: StepStats = emptyStats();

  /** Increment a counter by `by` (default 1) and return the new value. */
  count(key: keyof StepStats, by = 1): number {
    this.counters = { ...this.counters, [key]: this.counters[key] + by };
    return this.counters[key];
  }

  /** Set an absolute counter value, used for recursion depth. */
  set(key: keyof StepStats, value: number): void {
    this.counters = { ...this.counters, [key]: value };
  }

  get stats(): StepStats {
    return this.counters;
  }

  /** Record a snapshot. The caller is responsible for passing immutable state. */
  push(step: StepInput<T>): void {
    const { stats, ...rest } = step;
    if (stats) this.counters = { ...this.counters, ...stats };
    this.steps.push({ ...rest, stats: { ...this.counters } });
  }

  get length(): number {
    return this.steps.length;
  }

  finish(meta: {
    timeComplexity: string;
    spaceComplexity: string;
    summary?: string;
  }): AlgorithmResult<T> {
    return { steps: this.steps, ...meta };
  }
}
