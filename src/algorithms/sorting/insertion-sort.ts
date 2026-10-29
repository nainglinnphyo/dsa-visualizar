import { StepRecorder } from '@/engine/recorder';
import type { AlgorithmResult } from '@/engine/types';
import type { SortAlgorithmSpec, SortState } from './types';

const PSEUDOCODE = `function insertionSort(a):
  for i from 1 to length(a) - 1:
    key = a[i]
    j = i - 1
    while j >= 0 and a[j] > key:
      a[j + 1] = a[j]
      j = j - 1
    a[j + 1] = key
  return a`;

const TYPESCRIPT = `export function insertionSort(input: number[]): number[] {
  const a = [...input];
  for (let i = 1; i < a.length; i += 1) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j -= 1;
    }
    a[j + 1] = key;
  }
  return a;
}`;

export function insertionSort(input: number[]): AlgorithmResult<SortState> {
  const recorder = new StepRecorder<SortState>();
  const a = [...input];
  const n = a.length;
  const snapshot = (): SortState => ({ values: [...a] });
  const sortedPrefix = (upTo: number): number[] =>
    Array.from({ length: Math.max(0, upTo + 1) }, (_, k) => k);

  recorder.push({
    state: snapshot(),
    description:
      n === 0
        ? 'The array is empty, so there is nothing to sort.'
        : `Start with ${n} value${n === 1 ? '' : 's'}. The first element alone counts as a sorted prefix.`,
    operation: 'start',
    highlightedLines: [1],
    sortedIndices: sortedPrefix(0),
  });

  for (let i = 1; i < n; i += 1) {
    const key = a[i];
    recorder.count('reads');
    recorder.push({
      state: snapshot(),
      activeIndices: [i],
      sortedIndices: sortedPrefix(i - 1),
      highlightedLines: [2, 3, 4],
      operation: 'pick',
      description: `Lift a[${i}] = ${key} out of the array; it needs a home inside the sorted prefix 0…${i - 1}.`,
    });

    let j = i - 1;
    while (j >= 0) {
      recorder.count('comparisons');
      recorder.count('reads');
      const shift = a[j] > key;
      recorder.push({
        state: snapshot(),
        comparedIndices: [j],
        activeIndices: [i],
        sortedIndices: sortedPrefix(i - 1),
        highlightedLines: [5],
        operation: 'compare',
        description: `Compare a[${j}] = ${a[j]} with the key ${key} — ${
          shift ? 'larger, so it must shift right.' : 'not larger, the key belongs just after it.'
        }`,
      });
      if (!shift) break;
      a[j + 1] = a[j];
      recorder.count('writes');
      recorder.count('swaps');
      recorder.push({
        state: snapshot(),
        swappedIndices: [j, j + 1],
        activeIndices: [i],
        sortedIndices: sortedPrefix(i - 1),
        highlightedLines: [6, 7],
        operation: 'shift',
        description: `Shift ${a[j + 1]} from index ${j} to index ${j + 1}, opening a gap.`,
      });
      j -= 1;
    }

    a[j + 1] = key;
    recorder.count('writes');
    recorder.push({
      state: snapshot(),
      activeIndices: [j + 1],
      sortedIndices: sortedPrefix(i),
      highlightedLines: [8],
      operation: 'insert',
      description: `Drop the key ${key} into index ${j + 1}. The prefix 0…${i} is now sorted.`,
    });
  }

  recorder.push({
    state: snapshot(),
    sortedIndices: sortedPrefix(n - 1),
    highlightedLines: [9],
    operation: 'done',
    description:
      n <= 1
        ? 'An array of fewer than two values is sorted by definition.'
        : `Sorted with ${recorder.stats.comparisons} comparisons and ${recorder.stats.writes} writes.`,
  });

  return recorder.finish({ timeComplexity: 'O(n²)', spaceComplexity: 'O(1)' });
}

export const insertionSortSpec: SortAlgorithmSpec = {
  id: 'insertion-sort',
  name: 'Insertion Sort',
  tagline: 'Grow a sorted prefix by inserting each new value into place.',
  run: insertionSort,
  code: {
    pseudocode: PSEUDOCODE,
    typescript: TYPESCRIPT,
    lineMap: {
      1: [1, 3],
      2: [3],
      3: [4],
      4: [5],
      5: [6],
      6: [7],
      7: [8],
      8: [10],
      9: [12],
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
    what: 'Insertion sort builds the result one element at a time, the way you sort a hand of cards: take the next value, slide the larger sorted values right to open a gap, and drop the value in.',
    how: [
      'The prefix of length 1 is trivially sorted.',
      'Take the next value as the key and hold it aside.',
      'Walk left through the sorted prefix, shifting every larger value one slot right.',
      'Stop at the first value that is not larger and place the key after it.',
      'Repeat until the whole array has been absorbed into the prefix.',
    ],
    useCases: [
      'Small arrays — most library sorts switch to it below ~16 elements.',
      'Nearly sorted or streaming data, where it runs in almost linear time.',
      'The merge step of Timsort and the base case of hybrid quicksorts.',
    ],
    pros: [
      'O(n) on already sorted input and very fast on nearly sorted input.',
      'Stable and in place.',
      'Online: it can sort data as it arrives, one element at a time.',
    ],
    cons: [
      'Quadratic on random or reverse-sorted input.',
      'Shifts a lot of data when the key belongs far to the left.',
    ],
    challenge:
      'Compare reverse-sorted input (9, 7, 5, 3, 1) with sorted input (1, 3, 5, 7, 9). Note the comparison counter in both runs — that gap is the difference between its best and worst case.',
  },
};
