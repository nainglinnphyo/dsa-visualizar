import type { AlgorithmResult } from '@/engine/types';
import type { CodeSource } from '@/engine/code';
import type { ComplexityInfo, LearningContent } from '@/types/learning';

export interface Frame {
  id: number;
  /** e.g. `fact(4)` */
  label: string;
  depth: number;
  status: 'active' | 'waiting' | 'returning';
  /** Shown once the frame has a value to hand back. */
  result?: string;
}

export interface HanoiExtra {
  kind: 'hanoi';
  /** Index 0..2; each peg lists disks bottom-first. */
  pegs: number[][];
  moves: number;
  /** Disk currently being moved. */
  moving: number | null;
}

export type Cell = 'wall' | 'open' | 'start' | 'goal';

export interface MazeExtra {
  kind: 'maze';
  grid: Cell[][];
  /** Cells on the current recursion path, in order. */
  path: string[];
  /** Cells already tried and abandoned. */
  deadEnds: string[];
  current: string | null;
  solved: boolean;
}

export interface QueensExtra {
  kind: 'queens';
  size: number;
  /** queens[row] = column, or −1 when that row is empty. */
  queens: number[];
  /** Square being tested right now. */
  trying: { row: number; column: number } | null;
  /** The queen that blocks `trying`, when there is one. */
  conflict: { row: number; column: number } | null;
  solutions: number;
}

export interface ArrayExtra {
  kind: 'array';
  values: number[];
  target: number;
  low: number;
  high: number;
  mid: number | null;
  found: number | null;
}

export interface NoExtra {
  kind: 'none';
}

export type RecursionExtra =
  | NoExtra
  | HanoiExtra
  | MazeExtra
  | QueensExtra
  | ArrayExtra;

export interface RecursionState {
  frames: Frame[];
  /** Values returned so far, newest last. */
  returns: { label: string; result: string }[];
  result: string | null;
  extra: RecursionExtra;
}

export interface RecursionField {
  name: string;
  label: string;
  min: number;
  max: number;
  step?: number;
}

export interface RecursionAlgorithmSpec {
  id: string;
  name: string;
  tagline: string;
  fields: RecursionField[];
  defaults: Record<string, number>;
  run: (args: Record<string, number>) => AlgorithmResult<RecursionState>;
  code: CodeSource;
  complexity: ComplexityInfo;
  learn: LearningContent;
}

export const emptyRecursionState = (
  extra: RecursionExtra = { kind: 'none' },
): RecursionState => ({
  frames: [],
  returns: [],
  result: null,
  extra,
});
