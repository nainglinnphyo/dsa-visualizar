import { StepRecorder } from '@/engine/recorder';
import { InputError, type AlgorithmResult } from '@/engine/types';
import type { SearchAlgorithmSpec, SearchInput, SearchState } from './types';

const PSEUDOCODE = `function binarySearch(a, target):
  low = 0
  high = length(a) - 1
  while low <= high:
    mid = floor((low + high) / 2)
    if a[mid] == target:
      return mid
    if a[mid] < target:
      low = mid + 1
    else:
      high = mid - 1
  return -1`;

const TYPESCRIPT = `export function binarySearch(a: number[], target: number): number {
  let low = 0;
  let high = a.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (a[mid] === target) {
      return mid;
    }
    if (a[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return -1;
}`;

export function binarySearch({
  values,
  target,
}: SearchInput): AlgorithmResult<SearchState> {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i - 1] > values[i]) {
      throw new InputError(
        `Binary search needs ascending input, but a[${i - 1}] = ${values[i - 1]} is greater than a[${i}] = ${values[i]}.`,
      );
    }
  }

  const recorder = new StepRecorder<SearchState>();
  const base = (overrides: Partial<SearchState> = {}): SearchState => ({
    values: [...values],
    target,
    foundIndex: null,
    range: null,
    exhausted: false,
    ...overrides,
  });

  let low = 0;
  let high = values.length - 1;

  recorder.push({
    state: base({ range: values.length ? { low, high } : null }),
    description:
      values.length === 0
        ? `The array is empty, so ${target} cannot be here.`
        : `Look for ${target} in the sorted window a[0…${high}]. Each comparison will halve the window.`,
    operation: 'start',
    highlightedLines: [2, 3],
  });

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    recorder.count('comparisons');
    recorder.count('reads');
    recorder.push({
      state: base({ range: { low, high } }),
      activeIndices: [mid],
      comparedIndices: [mid],
      highlightedLines: [4, 5],
      operation: 'probe',
      description: `Window a[${low}…${high}] holds ${high - low + 1} candidate${high - low === 0 ? '' : 's'}; probe the middle, a[${mid}] = ${values[mid]}.`,
    });

    if (values[mid] === target) {
      recorder.push({
        state: base({ foundIndex: mid, range: { low, high } }),
        activeIndices: [mid],
        sortedIndices: [mid],
        highlightedLines: [6, 7],
        operation: 'found',
        description: `a[${mid}] equals ${target} — found after ${recorder.stats.comparisons} comparison${recorder.stats.comparisons === 1 ? '' : 's'}.`,
      });
      return recorder.finish({
        timeComplexity: 'O(log n)',
        spaceComplexity: 'O(1)',
        summary: `Found at index ${mid}.`,
      });
    }

    if (values[mid] < target) {
      const discarded = mid - low + 1;
      low = mid + 1;
      recorder.push({
        state: base({ range: low <= high ? { low, high } : null }),
        activeIndices: [mid],
        highlightedLines: [8, 9],
        operation: 'go-right',
        description: `${values[mid]} < ${target}, so the target can only be to the right. Discard ${discarded} cell${discarded === 1 ? '' : 's'}; the window becomes a[${low}…${high}].`,
      });
    } else {
      const discarded = high - mid + 1;
      high = mid - 1;
      recorder.push({
        state: base({ range: low <= high ? { low, high } : null }),
        activeIndices: [mid],
        highlightedLines: [10, 11],
        operation: 'go-left',
        description: `${values[mid]} > ${target}, so the target can only be to the left. Discard ${discarded} cell${discarded === 1 ? '' : 's'}; the window becomes a[${low}…${high}].`,
      });
    }
  }

  recorder.push({
    state: base({ exhausted: true }),
    highlightedLines: [12],
    operation: 'not-found',
    description: `The window is empty (low = ${low} passed high = ${high}), so ${target} is not in the array.`,
  });

  return recorder.finish({
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    summary: 'Not found.',
  });
}

export const binarySearchSpec: SearchAlgorithmSpec = {
  id: 'binary-search',
  name: 'Binary Search',
  tagline: 'Halve the candidate window with every comparison.',
  requiresSorted: true,
  run: binarySearch,
  code: {
    pseudocode: PSEUDOCODE,
    typescript: TYPESCRIPT,
    lineMap: {
      1: [1],
      2: [2],
      3: [3],
      4: [4],
      5: [5],
      6: [6],
      7: [7],
      8: [9],
      9: [10],
      10: [11],
      11: [12],
      12: [15],
    },
  },
  complexity: {
    best: 'O(1)',
    average: 'O(log n)',
    worst: 'O(log n)',
    space: 'O(1)',
  },
  learn: {
    what: 'Binary search exploits order. It keeps a window of still-possible indices, looks at the middle one, and uses that single comparison to throw away half the window. After k probes only n / 2ᵏ candidates remain, so it finishes in ⌈log₂(n + 1)⌉ comparisons at worst.',
    how: [
      'Set low = 0 and high = n − 1, the full window.',
      'While the window is non-empty, compute mid = ⌊(low + high) / 2⌋.',
      'If a[mid] is the target, you are done.',
      'If a[mid] is smaller, everything from low to mid is too small — set low = mid + 1.',
      'Otherwise everything from mid to high is too large — set high = mid − 1.',
      'If low passes high the window is empty and the target is absent.',
    ],
    useCases: [
      'Looking values up in a sorted array or a database index.',
      'Finding an insertion point to keep a list sorted.',
      '"Binary search on the answer" — finding the smallest value satisfying a monotone predicate.',
    ],
    pros: [
      'O(log n): a million sorted elements need at most 20 comparisons.',
      'Constant extra memory in the iterative form.',
      'The same halving idea generalises far beyond array lookup.',
    ],
    cons: [
      'The input must be sorted, and keeping it sorted costs time on every insert.',
      'Needs random access, so it does not work on linked lists.',
      'With duplicates it returns *an* index, not necessarily the first one.',
    ],
    challenge:
      'Search a sorted array of 16 values for a target that is not present. Count the probes before the window empties — then double the array and check that the count only grows by one.',
  },
};
