import { describe, expect, it } from 'vitest';
import { InputError, type AlgorithmResult } from '@/engine/types';
import {
  factorial,
  fibonacci,
  mazeSolver,
  nQueens,
  recursiveBinarySearch,
  towerOfHanoi,
  RECURSION_ALGORITHMS,
  type RecursionState,
} from '..';

const last = (result: AlgorithmResult<RecursionState>): RecursionState =>
  result.steps[result.steps.length - 1].state;

describe('factorial', () => {
  it.each([
    [0, 1],
    [1, 1],
    [2, 2],
    [5, 120],
    [10, 3628800],
  ])('factorial(%i) = %i', (n, expected) => {
    expect(last(factorial({ n })).result).toBe(String(expected));
  });

  it('empties the call stack when it finishes', () => {
    expect(last(factorial({ n: 5 })).frames).toEqual([]);
  });

  it('reaches a maximum depth of n + 1 frames', () => {
    const { steps } = factorial({ n: 5 });
    const maxFrames = Math.max(...steps.map((step) => step.state.frames.length));
    expect(maxFrames).toBe(5);
    expect(Math.max(...steps.map((step) => step.stats.depth))).toBe(5);
  });

  it('rejects out-of-range input', () => {
    expect(() => factorial({ n: -1 })).toThrow(InputError);
    expect(() => factorial({ n: 50 })).toThrow(InputError);
  });
});

describe('fibonacci', () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 1],
    [5, 5],
    [9, 34],
  ])('fib(%i) = %i', (n, expected) => {
    expect(last(fibonacci({ n })).result).toBe(String(expected));
  });

  it('makes the exponential number of calls the naive version is known for', () => {
    // calls(n) = 2 * fib(n + 1) - 1
    const fib = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
    for (const n of [3, 5, 7]) {
      const summary = fibonacci({ n }).summary as string;
      const calls = Number(summary.match(/in (\d+) calls/)?.[1]);
      expect(calls).toBe(2 * fib[n + 1] - 1);
    }
  });

  it('rejects an n large enough to explode the trace', () => {
    expect(() => fibonacci({ n: 30 })).toThrow(InputError);
  });
});

describe('recursive binary search', () => {
  it('finds values that are present', () => {
    // The array holds 2, 4, 6, … so index i holds 2(i + 1).
    for (const target of [2, 8, 14, 30]) {
      const state = last(recursiveBinarySearch({ size: 15, target }));
      const extra = state.extra;
      expect(extra.kind).toBe('array');
      if (extra.kind !== 'array') return;
      expect(extra.found).toBe(target / 2 - 1);
    }
  });

  it('reports a miss for odd targets and out-of-range values', () => {
    for (const target of [7, 1, 99]) {
      expect(last(recursiveBinarySearch({ size: 15, target })).result).toBe(
        'not found',
      );
    }
  });

  it('uses at most ceil(log2(n + 1)) frames', () => {
    const { steps } = recursiveBinarySearch({ size: 31, target: 99 });
    const maxDepth = Math.max(...steps.map((step) => step.state.frames.length));
    expect(maxDepth).toBeLessThanOrEqual(Math.ceil(Math.log2(32)) + 1);
  });

  it('handles a single-element array', () => {
    expect(last(recursiveBinarySearch({ size: 1, target: 2 })).result).toBe('index 0');
    expect(last(recursiveBinarySearch({ size: 1, target: 4 })).result).toBe('not found');
  });

  it('rejects an invalid size', () => {
    expect(() => recursiveBinarySearch({ size: 0, target: 1 })).toThrow(InputError);
  });
});

describe('tower of hanoi', () => {
  it.each([1, 2, 3, 4, 5])('solves %i disks in 2^n - 1 moves', (disks) => {
    const result = towerOfHanoi({ disks });
    const state = last(result);
    expect(state.result).toBe(`${2 ** disks - 1} moves`);
    if (state.extra.kind !== 'hanoi') return;
    expect(state.extra.pegs[2]).toEqual(
      Array.from({ length: disks }, (_, i) => disks - i),
    );
    expect(state.extra.pegs[0]).toEqual([]);
    expect(state.extra.pegs[1]).toEqual([]);
  });

  it('never places a larger disk on a smaller one', () => {
    for (const step of towerOfHanoi({ disks: 4 }).steps) {
      if (step.state.extra.kind !== 'hanoi') continue;
      for (const peg of step.state.extra.pegs) {
        for (let i = 1; i < peg.length; i += 1) {
          expect(peg[i]).toBeLessThan(peg[i - 1]);
        }
      }
    }
  });

  it('conserves every disk at every step', () => {
    for (const step of towerOfHanoi({ disks: 4 }).steps) {
      if (step.state.extra.kind !== 'hanoi') continue;
      const all = step.state.extra.pegs.flat().sort((a, b) => a - b);
      expect(all).toEqual([1, 2, 3, 4]);
    }
  });

  it('rejects an unsupported disk count', () => {
    expect(() => towerOfHanoi({ disks: 0 })).toThrow(InputError);
    expect(() => towerOfHanoi({ disks: 20 })).toThrow(InputError);
  });
});

describe('maze solver', () => {
  it.each([0, 1])('solves layout %i and ends on the goal', (layout) => {
    const state = last(mazeSolver({ layout }));
    expect(state.extra.kind).toBe('maze');
    if (state.extra.kind !== 'maze') return;
    expect(state.extra.solved).toBe(true);
    const path = state.extra.path;
    const [lastRow, lastColumn] = path[path.length - 1].split(',').map(Number);
    expect(state.extra.grid[lastRow][lastColumn]).toBe('goal');
  });

  it('produces a path of orthogonally adjacent open cells', () => {
    const state = last(mazeSolver({ layout: 0 }));
    if (state.extra.kind !== 'maze') return;
    const path = state.extra.path.map((key) => key.split(',').map(Number));
    for (const [row, column] of path) {
      expect(state.extra.grid[row][column]).not.toBe('wall');
    }
    for (let i = 1; i < path.length; i += 1) {
      const distance =
        Math.abs(path[i][0] - path[i - 1][0]) +
        Math.abs(path[i][1] - path[i - 1][1]);
      expect(distance).toBe(1);
    }
  });

  it('never revisits a cell within the final path', () => {
    const state = last(mazeSolver({ layout: 1 }));
    if (state.extra.kind !== 'maze') return;
    expect(new Set(state.extra.path).size).toBe(state.extra.path.length);
  });

  it('backtracks out of dead ends', () => {
    const operations = mazeSolver({ layout: 0 }).steps.map((step) => step.operation);
    expect(operations).toContain('backtrack');
  });
});

describe('n-queens', () => {
  const assertSafe = (queens: number[]): void => {
    for (let row = 0; row < queens.length; row += 1) {
      for (let other = row + 1; other < queens.length; other += 1) {
        expect(queens[row]).not.toBe(queens[other]);
        expect(Math.abs(row - other)).not.toBe(
          Math.abs(queens[row] - queens[other]),
        );
      }
    }
  };

  it.each([1, 4, 5, 6, 7, 8])('solves the %i-queens board', (size) => {
    const state = last(nQueens({ size }));
    expect(state.extra.kind).toBe('queens');
    if (state.extra.kind !== 'queens') return;
    expect(state.extra.queens.every((column) => column >= 0)).toBe(true);
    assertSafe(state.extra.queens);
  });

  it.each([2, 3])('reports that %i queens have no solution', (size) => {
    expect(last(nQueens({ size })).result).toBe('no solution');
  });

  it('never leaves two queens attacking each other mid-search', () => {
    for (const step of nQueens({ size: 6 }).steps) {
      if (step.state.extra.kind !== 'queens') continue;
      const placed = step.state.extra.queens
        .map((column, row) => ({ row, column }))
        .filter((entry) => entry.column >= 0);
      for (let i = 0; i < placed.length; i += 1) {
        for (let j = i + 1; j < placed.length; j += 1) {
          expect(placed[i].column).not.toBe(placed[j].column);
          expect(Math.abs(placed[i].row - placed[j].row)).not.toBe(
            Math.abs(placed[i].column - placed[j].column),
          );
        }
      }
    }
  });

  it('backtracks on boards that need it', () => {
    const operations = nQueens({ size: 6 }).steps.map((step) => step.operation);
    expect(operations).toContain('backtrack');
  });

  it('rejects an unsupported board size', () => {
    expect(() => nQueens({ size: 0 })).toThrow(InputError);
    expect(() => nQueens({ size: 12 })).toThrow(InputError);
  });
});

describe('trace contract', () => {
  it.each(RECURSION_ALGORITHMS.map((spec) => [spec.name, spec] as const))(
    '%s describes and highlights every step with its defaults',
    (_name, spec) => {
      const result = spec.run(spec.defaults);
      expect(result.steps.length).toBeGreaterThan(1);
      const lineCount = spec.code.pseudocode.split('\n').length;
      for (const step of result.steps) {
        expect(step.description.length).toBeGreaterThan(0);
        for (const line of step.highlightedLines ?? []) {
          expect(line).toBeGreaterThanOrEqual(1);
          expect(line).toBeLessThanOrEqual(lineCount);
        }
      }
    },
  );

  it.each(RECURSION_ALGORITHMS.map((spec) => [spec.name, spec] as const))(
    '%s unwinds its call stack completely',
    (_name, spec) => {
      const result = spec.run(spec.defaults);
      expect(last(result).frames).toEqual([]);
    },
  );
});
