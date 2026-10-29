import type { AlgorithmVisualizer } from '@/engine/types';
import type { CodeSource } from '@/engine/code';
import type { ComplexityInfo, LearningContent } from '@/types/learning';

/** Extra arrays drawn under the bars (merge buffers, counting buckets…). */
export interface AuxView {
  label: string;
  values: (number | null)[];
  activeIndices?: number[];
  /** Optional labels under each cell, e.g. the key a bucket counts. */
  indexLabels?: string[];
}

export interface SortState {
  values: number[];
  /** Index of the current pivot, for partition-based sorts. */
  pivotIndex?: number;
  /** Sub-range the algorithm is currently working on. */
  range?: { low: number; high: number };
  aux?: AuxView[];
}

export type SortVisualizer = AlgorithmVisualizer<number[], SortState>;

export interface SortAlgorithmSpec {
  id: string;
  name: string;
  tagline: string;
  run: SortVisualizer;
  code: CodeSource;
  complexity: ComplexityInfo;
  learn: LearningContent;
}
