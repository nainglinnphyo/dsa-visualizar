import { StepRecorder } from '@/engine/recorder';
import type { AlgorithmResult } from '@/engine/types';
import type { SearchAlgorithmSpec, SearchInput, SearchState } from './types';

const PSEUDOCODE = `function linearSearch(a, target):
  for i from 0 to length(a) - 1:
    if a[i] == target:
      return i
  return -1`;

const TYPESCRIPT = `export function linearSearch(a: number[], target: number): number {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === target) {
      return i;
    }
  }
  return -1;
}`;

export function linearSearch({
  values,
  target,
}: SearchInput): AlgorithmResult<SearchState> {
  const recorder = new StepRecorder<SearchState>();
  const base = (overrides: Partial<SearchState> = {}): SearchState => ({
    values: [...values],
    target,
    foundIndex: null,
    range: null,
    exhausted: false,
    ...overrides,
  });

  recorder.push({
    state: base(),
    description:
      values.length === 0
        ? `The array is empty, so ${target} cannot be here.`
        : `Look for ${target} by checking every cell from index 0 — the array does not need to be sorted.`,
    operation: 'start',
    highlightedLines: [1, 2],
  });

  for (let i = 0; i < values.length; i += 1) {
    recorder.count('comparisons');
    recorder.count('reads');
    const match = values[i] === target;
    recorder.push({
      state: base(),
      comparedIndices: [i],
      activeIndices: [i],
      highlightedLines: [2, 3],
      operation: 'compare',
      description: `a[${i}] = ${values[i]} — ${
        match ? `match.` : `not ${target}, keep scanning.`
      }`,
    });
    if (match) {
      recorder.push({
        state: base({ foundIndex: i }),
        activeIndices: [i],
        sortedIndices: [i],
        highlightedLines: [4],
        operation: 'found',
        description: `Found ${target} at index ${i} after ${recorder.stats.comparisons} comparison${recorder.stats.comparisons === 1 ? '' : 's'}.`,
      });
      return recorder.finish({
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        summary: `Found at index ${i}.`,
      });
    }
  }

  recorder.push({
    state: base({ exhausted: true }),
    highlightedLines: [5],
    operation: 'not-found',
    description: `Every cell was checked and none held ${target}, so the search returns −1.`,
  });

  return recorder.finish({
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    summary: 'Not found.',
  });
}

export const linearSearchSpec: SearchAlgorithmSpec = {
  id: 'linear-search',
  name: 'Linear Search',
  tagline: 'Check every element in order until the target turns up.',
  requiresSorted: false,
  run: linearSearch,
  code: {
    pseudocode: PSEUDOCODE,
    typescript: TYPESCRIPT,
    lineMap: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [7] },
  },
  complexity: {
    best: 'O(1)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
  },
  learn: {
    what: 'Linear search walks the collection from one end to the other, comparing each element with the target and returning the first index that matches. It makes no assumptions about order, so it works on any sequence.',
    how: [
      'Start at index 0.',
      'Compare the element with the target.',
      'If they match, return the index immediately.',
      'Otherwise move to the next index.',
      'If the end is reached with no match, report −1.',
    ],
    useCases: [
      'Unsorted data, where sorting first would cost more than the scan.',
      'Small collections, where the constant factor beats anything cleverer.',
      'Linked lists and streams, which have no random access for binary search.',
    ],
    pros: [
      'Works on any order, including data that cannot be sorted meaningfully.',
      'No preprocessing and no extra memory.',
      'Finds the first occurrence, which matters when duplicates exist.',
    ],
    cons: [
      'O(n) comparisons — it scales badly as the collection grows.',
      'Repeated searches over the same data waste work a sorted structure would avoid.',
    ],
    challenge:
      'Search for a value that sits in the last cell, then for one that is absent. Both cost n comparisons — explain why the absent case cannot be detected any sooner.',
  },
};
