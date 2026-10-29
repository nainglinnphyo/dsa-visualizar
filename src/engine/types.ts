/**
 * Core contracts for the visualization engine.
 *
 * An algorithm is a *pure function* from input to a deterministic list of
 * immutable snapshots. Nothing in here knows about React, timers or the DOM,
 * which is what makes the same implementation usable for visualization, unit
 * tests and the learning pages.
 */

/** Cumulative counters captured at the moment a step was recorded. */
export interface StepStats {
  comparisons: number;
  swaps: number;
  reads: number;
  writes: number;
  /** Depth of the call stack for recursive algorithms. */
  depth: number;
}

export const emptyStats = (): StepStats => ({
  comparisons: 0,
  swaps: 0,
  reads: 0,
  writes: 0,
  depth: 0,
});

/** A single frame of an algorithm's execution. */
export interface VisualizationStep<T> {
  /** Immutable snapshot of the data structure at this point in time. */
  state: T;
  /** Indices the algorithm is "looking at" (cursors, pointers). */
  activeIndices?: number[];
  /** Indices being compared against each other. */
  comparedIndices?: number[];
  /** Indices whose values were just exchanged. */
  swappedIndices?: number[];
  /** Indices in their final, sorted position. */
  sortedIndices?: number[];
  /** Pseudocode lines (1-based) responsible for this step. */
  highlightedLines?: number[];
  /** Human readable explanation of what just happened. */
  description: string;
  /** Short machine-ish label, e.g. `compare`, `swap`, `push`. */
  operation?: string;
  /** Cumulative counters as of this step. */
  stats: StepStats;
}

/** The complete, replayable trace of one algorithm run. */
export interface AlgorithmResult<T> {
  steps: VisualizationStep<T>[];
  timeComplexity: string;
  spaceComplexity: string;
  /** Optional free-form result, e.g. the index found by a search. */
  summary?: string;
}

export type AlgorithmVisualizer<TInput, TState> = (
  input: TInput,
) => AlgorithmResult<TState>;

/** Thrown by validators so the UI can show a useful message. */
export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InputError';
  }
}
