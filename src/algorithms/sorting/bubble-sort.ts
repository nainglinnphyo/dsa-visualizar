import { StepRecorder } from '@/engine/recorder';
import type { AlgorithmResult } from '@/engine/types';
import type { SortAlgorithmSpec, SortState } from './types';

const PSEUDOCODE = `function bubbleSort(a):
  n = length(a)
  for i from 0 to n - 2:
    swapped = false
    for j from 0 to n - 2 - i:
      if a[j] > a[j + 1]:
        swap a[j] and a[j + 1]
        swapped = true
    mark a[n - 1 - i] as final
    if not swapped:
      break
  return a`;

const TYPESCRIPT = `export function bubbleSort(input: number[]): number[] {
  const a = [...input];
  const n = a.length;
  for (let i = 0; i < n - 1; i += 1) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j += 1) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return a;
}`;

export function bubbleSort(input: number[]): AlgorithmResult<SortState> {
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
        : `Start with ${n} value${n === 1 ? '' : 's'}. Bubble sort repeatedly walks the array swapping neighbours that are out of order.`,
    operation: 'start',
    highlightedLines: [2],
    sortedIndices: [],
  });

  let swapped = true;
  for (let i = 0; i < n - 1 && swapped; i += 1) {
    swapped = false;
    recorder.push({
      state: snapshot(),
      description: `Pass ${i + 1}: carry the largest remaining value to index ${n - 1 - i}.`,
      operation: 'pass',
      highlightedLines: [3, 4],
      sortedIndices: [...sorted],
      activeIndices: [],
    });

    for (let j = 0; j < n - 1 - i; j += 1) {
      recorder.count('comparisons');
      recorder.count('reads', 2);
      const outOfOrder = a[j] > a[j + 1];
      recorder.push({
        state: snapshot(),
        comparedIndices: [j, j + 1],
        sortedIndices: [...sorted],
        highlightedLines: [5, 6],
        operation: 'compare',
        description: `Compare a[${j}] = ${a[j]} with a[${j + 1}] = ${a[j + 1]} — ${
          outOfOrder ? 'out of order.' : 'already in order, leave them.'
        }`,
      });

      if (outOfOrder) {
        const left = a[j];
        const right = a[j + 1];
        a[j] = right;
        a[j + 1] = left;
        recorder.count('swaps');
        recorder.count('writes', 2);
        swapped = true;
        recorder.push({
          state: snapshot(),
          swappedIndices: [j, j + 1],
          sortedIndices: [...sorted],
          highlightedLines: [7, 8],
          operation: 'swap',
          description: `Swap them: ${right} moves to index ${j} and ${left} to index ${j + 1}.`,
        });
      }
    }

    sorted.add(n - 1 - i);
    recorder.push({
      state: snapshot(),
      sortedIndices: [...sorted],
      activeIndices: [n - 1 - i],
      highlightedLines: [9],
      operation: 'lock',
      description: `Index ${n - 1 - i} now holds ${a[n - 1 - i]}, its final position.`,
    });

    if (!swapped) {
      for (let k = 0; k <= n - 2 - i; k += 1) sorted.add(k);
      recorder.push({
        state: snapshot(),
        sortedIndices: [...sorted],
        highlightedLines: [10, 11],
        operation: 'early-exit',
        description:
          'That pass made no swaps, which means the array is already ordered. Bubble sort can stop early.',
      });
    }
  }

  for (let k = 0; k < n; k += 1) sorted.add(k);
  recorder.push({
    state: snapshot(),
    sortedIndices: [...sorted],
    highlightedLines: [12],
    operation: 'done',
    description:
      n <= 1
        ? 'An array of fewer than two values is sorted by definition.'
        : `Sorted in ${recorder.stats.comparisons} comparisons and ${recorder.stats.swaps} swaps.`,
  });

  return recorder.finish({ timeComplexity: 'O(n²)', spaceComplexity: 'O(1)' });
}

export const bubbleSortSpec: SortAlgorithmSpec = {
  id: 'bubble-sort',
  name: 'Bubble Sort',
  tagline: 'Repeatedly swap adjacent values until nothing is out of order.',
  run: bubbleSort,
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
      8: [9],
      10: [12],
      11: [12],
      12: [14],
    },
  },
  complexity: {
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
    inPlace: true,
  },
  learn: {
    what: 'Bubble sort compares every pair of neighbouring values and swaps them when they are in the wrong order. After each full pass the largest value left has "bubbled" to the end, so the sorted region grows by one from the right.',
    how: [
      'Walk from the start of the unsorted region to its end.',
      'Compare each element with the one after it.',
      'Swap the pair when the left value is larger.',
      'The last element of the pass is now final — shrink the unsorted region.',
      'If a whole pass performs no swaps, the array is sorted and you can stop early.',
    ],
    useCases: [
      'Teaching comparison sorting and loop invariants.',
      'Tiny arrays, or nearly sorted data where the early exit makes it O(n).',
      'Detecting whether a list is already sorted as a side effect.',
    ],
    pros: [
      'Very easy to reason about and implement correctly.',
      'Stable: equal values keep their relative order.',
      'In place — no extra memory beyond a temporary for the swap.',
      'Adaptive with the swapped flag: one pass over sorted input.',
    ],
    cons: [
      'O(n²) comparisons and swaps make it unusable for large inputs.',
      'Moves data far more than insertion sort on the same input.',
    ],
    challenge:
      'Enter 5, 1, 4, 2, 8 and predict how many swaps the first pass makes before you press play. Then try an already sorted array and watch the early exit fire after a single pass.',
  },
};
