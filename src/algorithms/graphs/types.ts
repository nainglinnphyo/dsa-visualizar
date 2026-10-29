import type { AlgorithmResult } from '@/engine/types';
import type { CodeSource } from '@/engine/code';
import type { ComplexityInfo, LearningContent } from '@/types/learning';
import type { Graph, GraphState } from './model';

export interface GraphRunOptions {
  start?: string;
  goal?: string;
}

export interface GraphAlgorithmSpec {
  id: string;
  name: string;
  tagline: string;
  needsStart: boolean;
  needsGoal: boolean;
  /** Structural requirement the page enforces before running. */
  requires: 'none' | 'directed-acyclic' | 'undirected';
  run: (graph: Graph, options: GraphRunOptions) => AlgorithmResult<GraphState>;
  code: CodeSource;
  complexity: ComplexityInfo;
  learn: LearningContent;
}
