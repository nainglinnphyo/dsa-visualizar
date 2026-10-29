import { describe, expect, it } from 'vitest';
import { binarySearch, linearSearch } from '..';
import { InputError } from '@/engine/types';
import type { SearchState } from '../types';
import type { AlgorithmResult } from '@/engine/types';

const final = (result: AlgorithmResult<SearchState>): SearchState =>
  result.steps[result.steps.length - 1].state;

const finalStats = (result: AlgorithmResult<SearchState>) =>
  result.steps[result.steps.length - 1].stats;

const CASES: { name: string; values: number[]; target: number; index: number }[] = [
  { name: 'first element', values: [1, 3, 5, 7], target: 1, index: 0 },
  { name: 'last element', values: [1, 3, 5, 7], target: 7, index: 3 },
  { name: 'middle element', values: [1, 3, 5, 7, 9], target: 5, index: 2 },
  { name: 'absent below range', values: [10, 20, 30], target: 5, index: -1 },
  { name: 'absent above range', values: [10, 20, 30], target: 99, index: -1 },
  { name: 'absent inside range', values: [10, 20, 30], target: 25, index: -1 },
  { name: 'single element hit', values: [42], target: 42, index: 0 },
  { name: 'single element miss', values: [42], target: 7, index: -1 },
  { name: 'empty array', values: [], target: 1, index: -1 },
  { name: 'negatives', values: [-9, -4, 0, 3], target: -4, index: 1 },
];

describe('linear search', () => {
  it.each(CASES)('handles the $name case', ({ values, target, index }) => {
    const state = final(linearSearch({ values, target }));
    expect(state.foundIndex).toBe(index === -1 ? null : index);
    expect(state.exhausted).toBe(index === -1);
  });

  it('works on unsorted input', () => {
    expect(final(linearSearch({ values: [9, 2, 7, 4], target: 7 })).foundIndex).toBe(2);
  });

  it('returns the first of several matches', () => {
    expect(final(linearSearch({ values: [5, 5, 5], target: 5 })).foundIndex).toBe(0);
  });

  it('stops comparing once it finds the target', () => {
    const result = linearSearch({ values: [1, 2, 3, 4, 5], target: 2 });
    expect(finalStats(result).comparisons).toBe(2);
  });

  it('compares every element when the target is absent', () => {
    const result = linearSearch({ values: [1, 2, 3, 4, 5], target: 99 });
    expect(finalStats(result).comparisons).toBe(5);
  });
});

describe('binary search', () => {
  it.each(CASES)('handles the $name case', ({ values, target, index }) => {
    const state = final(binarySearch({ values, target }));
    if (index === -1) {
      expect(state.foundIndex).toBeNull();
      expect(state.exhausted).toBe(true);
    } else {
      expect(state.values[state.foundIndex as number]).toBe(target);
    }
  });

  it('rejects unsorted input with a useful message', () => {
    expect(() => binarySearch({ values: [3, 1, 2], target: 1 })).toThrow(InputError);
    expect(() => binarySearch({ values: [3, 1, 2], target: 1 })).toThrow(/ascending/);
  });

  it('accepts input with duplicates as long as it is non-decreasing', () => {
    const state = final(binarySearch({ values: [1, 2, 2, 2, 3], target: 2 }));
    expect(state.values[state.foundIndex as number]).toBe(2);
  });

  it('needs at most ceil(log2(n + 1)) comparisons', () => {
    const values = Array.from({ length: 1000 }, (_, i) => i);
    for (const target of [0, 1, 499, 998, 999, -1, 1000]) {
      const comparisons = finalStats(binarySearch({ values, target })).comparisons;
      expect(comparisons).toBeLessThanOrEqual(Math.ceil(Math.log2(values.length + 1)));
    }
  });

  it('halves the window on every probe', () => {
    const values = Array.from({ length: 16 }, (_, i) => i);
    const { steps } = binarySearch({ values, target: 99 });
    const sizes = steps
      .filter((step) => step.operation === 'probe')
      .map((step) =>
        step.state.range ? step.state.range.high - step.state.range.low + 1 : 0,
      );
    for (let i = 1; i < sizes.length; i += 1) {
      expect(sizes[i]).toBeLessThanOrEqual(Math.ceil(sizes[i - 1] / 2));
    }
  });

  it('agrees with linear search on every target in a sorted array', () => {
    const values = [2, 4, 6, 8, 10, 12];
    for (let target = 1; target <= 13; target += 1) {
      const linear = final(linearSearch({ values, target })).foundIndex;
      const binary = final(binarySearch({ values, target })).foundIndex;
      expect(binary === null).toBe(linear === null);
      if (binary !== null) expect(values[binary]).toBe(target);
    }
  });
});
