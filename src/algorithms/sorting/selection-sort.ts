import { StepRecorder } from '@/engine/recorder';
import type { AlgorithmResult } from '@/engine/types';
import type { SortAlgorithmSpec, SortState } from './types';

const PSEUDOCODE = `function selectionSort(a):
  n = length(a)
  for i from 0 to n - 2:
    minIndex = i
    for j from i + 1 to n - 1:
      if a[j] < a[minIndex]:
        minIndex = j
    if minIndex != i:
      swap a[i] and a[minIndex]
    mark a[i] as final
  return a`;

const TYPESCRIPT = `export function selectionSort(input: number[]): number[] {
  const a = [...input];
  const n = a.length;
  for (let i = 0; i < n - 1; i += 1) {
    let minIndex = i;
    for (let j = i + 1; j < n; j += 1) {
      if (a[j] < a[minIndex]) {
        minIndex = j;
      }
    }
    if (minIndex !== i) {
      [a[i], a[minIndex]] = [a[minIndex], a[i]];
    }
  }
  return a;
}`;

export function selectionSort(input: number[]): AlgorithmResult<SortState> {
  const recorder = new StepRecorder<SortState>();
  const a = [...input];
  const n = a.length;
  const sorted = new Set<number>();
  const snapshot = (): SortState => ({ values: [...a] });

  recorder.push({
    state: snapshot(),
    description:
      n === 0
        ? 'The array is empty, so there is nothing to sort.'
        : `Start with ${n} value${n === 1 ? '' : 's'}. Selection sort finds the smallest remaining value and moves it into place.`,
    operation: 'start',
    highlightedLines: [2],
    sortedIndices: [],
  });

  for (let i = 0; i < n - 1; i += 1) {
    let minIndex = i;
    recorder.push({
      state: snapshot(),
      activeIndices: [i],
      sortedIndices: [...sorted],
      highlightedLines: [3, 4],
      operation: 'select',
      description: `Pass ${i + 1}: assume a[${i}] = ${a[i]} is the smallest value in the unsorted region.`,
    });

    for (let j = i + 1; j < n; j += 1) {
      recorder.count('comparisons');
      recorder.count('reads', 2);
      const smaller = a[j] < a[minIndex];
      recorder.push({
        state: snapshot(),
        comparedIndices: [j, minIndex],
        activeIndices: [minIndex],
        sortedIndices: [...sorted],
        highlightedLines: [5, 6],
        operation: 'compare',
        description: `Compare a[${j}] = ${a[j]} with the current minimum a[${minIndex}] = ${a[minIndex]} — ${
          smaller ? 'smaller, so it becomes the new minimum.' : 'not smaller, keep looking.'
        }`,
      });
      if (smaller) {
        minIndex = j;
        recorder.push({
          state: snapshot(),
          activeIndices: [minIndex],
          sortedIndices: [...sorted],
          highlightedLines: [7],
          operation: 'new-min',
          description: `Minimum is now a[${minIndex}] = ${a[minIndex]}.`,
        });
      }
    }

    if (minIndex !== i) {
      const from = a[minIndex];
      const to = a[i];
      a[i] = from;
      a[minIndex] = to;
      recorder.count('swaps');
      recorder.count('writes', 2);
      recorder.push({
        state: snapshot(),
        swappedIndices: [i, minIndex],
        sortedIndices: [...sorted],
        highlightedLines: [8, 9],
        operation: 'swap',
        description: `Swap a[${i}] and a[${minIndex}]: ${from} moves into position ${i}.`,
      });
    } else {
      recorder.push({
        state: snapshot(),
        activeIndices: [i],
        sortedIndices: [...sorted],
        highlightedLines: [8],
        operation: 'no-swap',
        description: `a[${i}] = ${a[i]} was already the smallest — no swap needed.`,
      });
    }

    sorted.add(i);
    recorder.push({
      state: snapshot(),
      sortedIndices: [...sorted],
      highlightedLines: [10],
      operation: 'lock',
      description: `Index ${i} is final. Exactly ${n - i - 1} value${n - i - 1 === 1 ? '' : 's'} left to place.`,
    });
  }

  for (let k = 0; k < n; k += 1) sorted.add(k);
  recorder.push({
    state: snapshot(),
    sortedIndices: [...sorted],
    highlightedLines: [11],
    operation: 'done',
    description:
      n <= 1
        ? 'An array of fewer than two values is sorted by definition.'
        : `Sorted using ${recorder.stats.comparisons} comparisons but only ${recorder.stats.swaps} swap${recorder.stats.swaps === 1 ? '' : 's'}.`,
  });

  return recorder.finish({ timeComplexity: 'O(n²)', spaceComplexity: 'O(1)' });
}

export const selectionSortSpec: SortAlgorithmSpec = {
  id: 'selection-sort',
  name: 'Selection Sort',
  tagline: 'Find the smallest remaining value, then swap it into place.',
  run: selectionSort,
  code: {
    pseudocode: PSEUDOCODE,
    typescript: TYPESCRIPT,
    lineMap: {
      1: [1],
      2: [3],
      3: [4],
      4: [5],
      5: [6],
      6: [7],
      7: [8],
      8: [11],
      9: [12],
      11: [15],
    },
  },
  complexity: {
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: false,
    inPlace: true,
  },
  learn: {
    what: 'Selection sort splits the array into a sorted prefix and an unsorted suffix. Each pass scans the whole suffix for its smallest value and swaps that value to the front of the suffix, growing the sorted prefix by one.',
    how: [
      'Treat index i as the start of the unsorted region.',
      'Scan every later index, remembering where the smallest value lives.',
      'Swap that smallest value into index i — at most one swap per pass.',
      'Move i forward and repeat until one element remains.',
    ],
    useCases: [
      'When writes are far more expensive than reads (flash memory, wear levelling).',
      'Small arrays where the exactly-n-1 swap bound is attractive.',
      'Teaching the sorted-prefix invariant.',
    ],
    pros: [
      'Performs at most n − 1 swaps, the fewest of the simple sorts.',
      'In place and very predictable: the comparison count never varies.',
    ],
    cons: [
      'Always O(n²) comparisons, even on already sorted input — it is not adaptive.',
      'Not stable: a long-distance swap can reorder equal values.',
    ],
    challenge:
      'Sort 4, 2, 2, 8 and watch the two 2s. Can you spot the pass where their relative order flips? That is why selection sort is not stable.',
  },
};
