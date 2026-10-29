import type { StepStats, VisualizationStep } from './types';

export interface StatMetric {
  key: keyof StepStats;
  label: string;
  /** Hidden when the algorithm never touches this counter. */
  value: number;
}

const LABELS: Record<keyof StepStats, string> = {
  comparisons: 'Comparisons',
  swaps: 'Swaps / moves',
  reads: 'Array reads',
  writes: 'Array writes',
  depth: 'Call depth',
};

const ORDER: (keyof StepStats)[] = [
  'comparisons',
  'swaps',
  'reads',
  'writes',
  'depth',
];

/** Counters that are non-zero at some point in the trace, so empty rows are hidden. */
export function relevantMetrics<T>(
  steps: VisualizationStep<T>[],
  current: StepStats | undefined,
): StatMetric[] {
  if (!current) return [];
  const used = new Set<keyof StepStats>();
  for (const step of steps) {
    for (const key of ORDER) {
      if (step.stats[key] > 0) used.add(key);
    }
  }
  return ORDER.filter((key) => used.has(key)).map((key) => ({
    key,
    label: LABELS[key],
    value: current[key],
  }));
}

export interface OperationHistoryEntry {
  index: number;
  operation: string;
  description: string;
}

/** The operations leading up to (and including) `upTo`, newest first. */
export function operationHistory<T>(
  steps: VisualizationStep<T>[],
  upTo: number,
  limit = 40,
): OperationHistoryEntry[] {
  const entries: OperationHistoryEntry[] = [];
  for (let i = Math.min(upTo, steps.length - 1); i >= 0 && entries.length < limit; i -= 1) {
    const step = steps[i];
    if (!step?.operation) continue;
    entries.push({
      index: i,
      operation: step.operation,
      description: step.description,
    });
  }
  return entries;
}
