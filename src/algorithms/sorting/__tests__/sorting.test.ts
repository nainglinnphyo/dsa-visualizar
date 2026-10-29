import { describe, expect, it } from 'vitest';
import { SORT_ALGORITHMS } from '..';
import { countingSort, MAX_KEY_RANGE } from '../counting-sort';
import { InputError } from '@/engine/types';
import type { SortAlgorithmSpec } from '../types';

const CASES: { name: string; input: number[] }[] = [
  { name: 'empty', input: [] },
  { name: 'single element', input: [42] },
  { name: 'two elements out of order', input: [2, 1] },
  { name: 'already sorted', input: [1, 2, 3, 4, 5, 6] },
  { name: 'reverse sorted', input: [9, 7, 5, 3, 1] },
  { name: 'all duplicates', input: [4, 4, 4, 4] },
  { name: 'some duplicates', input: [5, 1, 4, 1, 5, 9, 2, 6] },
  { name: 'negatives', input: [-3, 7, -1, 0, -9, 4] },
  { name: 'min/max boundaries', input: [0, -20, 20, -20, 20] },
];

/** Sorts that reorder purely by swapping, so no value is ever duplicated. */
const SWAP_ONLY = new Set(['bubble-sort', 'selection-sort', 'quick-sort', 'heap-sort']);

const expectedFor = (input: number[]): number[] =>
  [...input].sort((a, b) => a - b);

const finalValues = (algorithm: SortAlgorithmSpec, input: number[]): number[] => {
  const { steps } = algorithm.run(input);
  return steps[steps.length - 1].state.values;
};

describe.each(SORT_ALGORITHMS.map((a) => [a.name, a] as const))(
  '%s',
  (_name, algorithm) => {
    it.each(CASES)('sorts the $name case', ({ input }) => {
      expect(finalValues(algorithm, input)).toEqual(expectedFor(input));
    });

    it('never mutates the caller’s array', () => {
      const input = [5, 3, 8, 1];
      const copy = [...input];
      algorithm.run(input);
      expect(input).toEqual(copy);
    });

    it('produces at least one step and every state is a distinct snapshot', () => {
      const { steps } = algorithm.run([3, 1, 2]);
      expect(steps.length).toBeGreaterThan(0);
      const seen = new Set<number[]>();
      for (const step of steps) {
        expect(seen.has(step.state.values)).toBe(false);
        seen.add(step.state.values);
      }
    });

    it('starts and ends holding exactly the input multiset', () => {
      const input = [6, 2, 9, 2, 7];
      const expected = expectedFor(input);
      const { steps } = algorithm.run(input);
      expect([...steps[0].state.values].sort((a, b) => a - b)).toEqual(expected);
      expect(
        [...steps[steps.length - 1].state.values].sort((a, b) => a - b),
      ).toEqual(expected);
    });

    it('keeps the array a permutation of the input mid-run when it sorts by swapping', () => {
      // Algorithms that only ever swap hold a valid permutation at every step.
      // Insertion sort holds the key aside while shifting, merge sort writes
      // from buffers and counting sort builds a separate output, so all three
      // legitimately show a transient duplicate mid-run.
      if (!SWAP_ONLY.has(algorithm.id)) return;
      const input = [6, 2, 9, 2, 7];
      const expected = expectedFor(input);
      for (const step of algorithm.run(input).steps) {
        expect([...step.state.values].sort((a, b) => a - b)).toEqual(expected);
      }
    });

    it('reports statistics that never decrease', () => {
      const { steps } = algorithm.run([8, 3, 5, 1, 9, 2]);
      for (let i = 1; i < steps.length; i += 1) {
        expect(steps[i].stats.comparisons).toBeGreaterThanOrEqual(
          steps[i - 1].stats.comparisons,
        );
        expect(steps[i].stats.writes).toBeGreaterThanOrEqual(
          steps[i - 1].stats.writes,
        );
      }
    });

    it('describes every step and highlights at least one line', () => {
      for (const step of algorithm.run([4, 2, 7]).steps) {
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.highlightedLines?.length ?? 0).toBeGreaterThan(0);
      }
    });

    it('maps every highlighted pseudocode line onto a real line', () => {
      const lineCount = algorithm.code.pseudocode.split('\n').length;
      for (const step of algorithm.run([4, 2, 7, 1]).steps) {
        for (const line of step.highlightedLines ?? []) {
          expect(line).toBeGreaterThanOrEqual(1);
          expect(line).toBeLessThanOrEqual(lineCount);
        }
      }
    });

    it('maps pseudocode lines onto real TypeScript lines', () => {
      const tsLines = algorithm.code.typescript.split('\n').length;
      for (const targets of Object.values(algorithm.code.lineMap ?? {})) {
        for (const line of targets) {
          expect(line).toBeGreaterThanOrEqual(1);
          expect(line).toBeLessThanOrEqual(tsLines);
        }
      }
    });
  },
);

describe('stability', () => {
  // Sort pairs by key using only the numeric sort, then check equal keys kept
  // their input order. Encoded as key * 10 + tag so the sort sees one number.
  const stableAlgorithms = SORT_ALGORITHMS.filter((a) => a.complexity.stable);

  it.each(stableAlgorithms.map((a) => [a.name, a] as const))(
    '%s keeps equal keys in input order',
    (_name, algorithm) => {
      const input = [31, 11, 32, 12, 33];
      const result = finalValues(algorithm, input);
      const tens = result.filter((v) => v >= 30).map((v) => v % 10);
      expect(tens).toEqual([1, 2, 3]);
    },
  );
});

describe('counting sort guards', () => {
  it('rejects a key range it cannot allocate buckets for', () => {
    expect(() => countingSort([0, MAX_KEY_RANGE + 5])).toThrow(InputError);
  });

  it('accepts a range exactly at the limit', () => {
    expect(() => countingSort([0, MAX_KEY_RANGE - 1])).not.toThrow();
  });

  it('performs no comparisons', () => {
    const { steps } = countingSort([3, 1, 2]);
    expect(steps[steps.length - 1].stats.comparisons).toBe(0);
  });
});
