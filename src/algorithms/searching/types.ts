import type { AlgorithmVisualizer } from '@/engine/types';
import type { CodeSource } from '@/engine/code';
import type { ComplexityInfo, LearningContent } from '@/types/learning';

export interface SearchInput {
  values: number[];
  target: number;
}

export interface SearchState {
  values: number[];
  target: number;
  /** Index where the target was found, or null while still searching. */
  foundIndex: number | null;
  /** Remaining candidate window; null for algorithms that scan everything. */
  range: { low: number; high: number } | null;
  /** True once the search has finished without a match. */
  exhausted: boolean;
}

export interface SearchAlgorithmSpec {
  id: string;
  name: string;
  tagline: string;
  /** Binary search needs sorted input; the page uses this to keep data valid. */
  requiresSorted: boolean;
  run: AlgorithmVisualizer<SearchInput, SearchState>;
  code: CodeSource;
  complexity: ComplexityInfo;
  learn: LearningContent;
}
