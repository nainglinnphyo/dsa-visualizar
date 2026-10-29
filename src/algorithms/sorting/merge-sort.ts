import { StepRecorder } from '@/engine/recorder';
import type { AlgorithmResult } from '@/engine/types';
import type { AuxView, SortAlgorithmSpec, SortState } from './types';

const PSEUDOCODE = `function mergeSort(a, lo, hi):
  if lo >= hi:
    return
  mid = floor((lo + hi) / 2)
  mergeSort(a, lo, mid)
  mergeSort(a, mid + 1, hi)
  merge(a, lo, mid, hi)

function merge(a, lo, mid, hi):
  left  = copy of a[lo..mid]
  right = copy of a[mid+1..hi]
  i = 0; j = 0; k = lo
  while i < len(left) and j < len(right):
    if left[i] <= right[j]:
      a[k] = left[i]; i = i + 1
    else:
      a[k] = right[j]; j = j + 1
    k = k + 1
  while i < len(left):
    a[k] = left[i]; i = i + 1; k = k + 1
  while j < len(right):
    a[k] = right[j]; j = j + 1; k = k + 1`;

const TYPESCRIPT = `export function mergeSort(input: number[]): number[] {
  const a = [...input];
  sort(a, 0, a.length - 1);
  return a;
}

function sort(a: number[], lo: number, hi: number): void {
  if (lo >= hi) return;
  const mid = Math.floor((lo + hi) / 2);
  sort(a, lo, mid);
  sort(a, mid + 1, hi);
  merge(a, lo, mid, hi);
}

function merge(a: number[], lo: number, mid: number, hi: number): void {
  const left = a.slice(lo, mid + 1);
  const right = a.slice(mid + 1, hi + 1);
  let i = 0;
  let j = 0;
  let k = lo;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      a[k] = left[i];
      i += 1;
    } else {
      a[k] = right[j];
      j += 1;
    }
    k += 1;
  }
  while (i < left.length) {
    a[k] = left[i];
    i += 1;
    k += 1;
  }
  while (j < right.length) {
    a[k] = right[j];
    j += 1;
    k += 1;
  }
}`;

export function mergeSort(input: number[]): AlgorithmResult<SortState> {
  const recorder = new StepRecorder<SortState>();
  const a = [...input];
  const n = a.length;
  /** Indices currently known to sit inside an ordered run. */
  const ordered = new Set<number>();
  let maxDepth = 0;

  const snapshot = (extra: Partial<SortState> = {}): SortState => ({
    values: [...a],
    ...extra,
  });
  const range = (low: number, high: number) => ({ low, high });

  recorder.push({
    state: snapshot(),
    description:
      n === 0
        ? 'The array is empty, so there is nothing to sort.'
        : `Start with ${n} value${n === 1 ? '' : 's'}. Merge sort splits the array in half, sorts each half, then merges the two ordered runs.`,
    operation: 'start',
    highlightedLines: [1],
  });

  const merge = (lo: number, mid: number, hi: number, depth: number): void => {
    recorder.set('depth', depth);
    const left = a.slice(lo, mid + 1);
    const right = a.slice(mid + 1, hi + 1);
    recorder.count('reads', left.length + right.length);
    for (let k = lo; k <= hi; k += 1) ordered.delete(k);

    const aux = (i: number, j: number): AuxView[] => [
      {
        label: `left a[${lo}…${mid}]`,
        values: left,
        activeIndices: i < left.length ? [i] : [],
      },
      {
        label: `right a[${mid + 1}…${hi}]`,
        values: right,
        activeIndices: j < right.length ? [j] : [],
      },
    ];

    recorder.push({
      state: snapshot({ range: range(lo, hi), aux: aux(0, 0) }),
      sortedIndices: [...ordered],
      highlightedLines: [10, 11, 12],
      operation: 'merge-start',
      description: `Copy a[${lo}…${mid}] and a[${mid + 1}…${hi}] into buffers, then merge them back into a[${lo}…${hi}].`,
    });

    let i = 0;
    let j = 0;
    let k = lo;
    while (i < left.length && j < right.length) {
      recorder.count('comparisons');
      const takeLeft = left[i] <= right[j];
      recorder.push({
        state: snapshot({ range: range(lo, hi), aux: aux(i, j) }),
        comparedIndices: [k],
        sortedIndices: [...ordered],
        highlightedLines: [13, 14],
        operation: 'compare',
        description: `Compare the buffer heads ${left[i]} and ${right[j]} — take ${
          takeLeft ? `${left[i]} from the left` : `${right[j]} from the right`
        }.`,
      });
      if (takeLeft) {
        a[k] = left[i];
        i += 1;
      } else {
        a[k] = right[j];
        j += 1;
      }
      recorder.count('writes');
      recorder.push({
        state: snapshot({ range: range(lo, hi), aux: aux(i, j) }),
        swappedIndices: [k],
        sortedIndices: [...ordered],
        highlightedLines: takeLeft ? [15, 18] : [17, 18],
        operation: 'write',
        description: `Write ${a[k]} into a[${k}].`,
      });
      k += 1;
    }

    while (i < left.length) {
      a[k] = left[i];
      recorder.count('writes');
      recorder.push({
        state: snapshot({ range: range(lo, hi), aux: aux(i + 1, j) }),
        swappedIndices: [k],
        sortedIndices: [...ordered],
        highlightedLines: [19, 20],
        operation: 'drain-left',
        description: `The right buffer is empty, so copy the rest of the left buffer: ${a[k]} into a[${k}].`,
      });
      i += 1;
      k += 1;
    }
    while (j < right.length) {
      a[k] = right[j];
      recorder.count('writes');
      recorder.push({
        state: snapshot({ range: range(lo, hi), aux: aux(i, j + 1) }),
        swappedIndices: [k],
        sortedIndices: [...ordered],
        highlightedLines: [21, 22],
        operation: 'drain-right',
        description: `The left buffer is empty, so copy the rest of the right buffer: ${a[k]} into a[${k}].`,
      });
      j += 1;
      k += 1;
    }

    for (let idx = lo; idx <= hi; idx += 1) ordered.add(idx);
    recorder.push({
      state: snapshot({ range: range(lo, hi) }),
      sortedIndices: [...ordered],
      highlightedLines: [7],
      operation: 'merged',
      description: `a[${lo}…${hi}] is now one ordered run of ${hi - lo + 1} values.`,
    });
  };

  const sort = (lo: number, hi: number, depth: number): void => {
    recorder.set('depth', depth);
    maxDepth = Math.max(maxDepth, depth);
    if (lo >= hi) {
      if (lo === hi) {
        ordered.add(lo);
        recorder.push({
          state: snapshot({ range: range(lo, hi) }),
          activeIndices: [lo],
          sortedIndices: [...ordered],
          highlightedLines: [2, 3],
          operation: 'base-case',
          description: `a[${lo}…${hi}] holds the single value ${a[lo]} — a run of one is already sorted.`,
        });
      }
      return;
    }
    const mid = Math.floor((lo + hi) / 2);
    recorder.push({
      state: snapshot({ range: range(lo, hi) }),
      activeIndices: [mid],
      sortedIndices: [...ordered],
      highlightedLines: [4, 5, 6],
      operation: 'divide',
      description: `Split a[${lo}…${hi}] at index ${mid} into a[${lo}…${mid}] and a[${mid + 1}…${hi}].`,
    });
    sort(lo, mid, depth + 1);
    sort(mid + 1, hi, depth + 1);
    merge(lo, mid, hi, depth);
  };

  if (n > 0) sort(0, n - 1, 1);
  recorder.set('depth', 0);

  recorder.push({
    state: snapshot(),
    sortedIndices: Array.from({ length: n }, (_, k) => k),
    highlightedLines: [7],
    operation: 'done',
    description:
      n <= 1
        ? 'An array of fewer than two values is sorted by definition.'
        : `Sorted with ${recorder.stats.comparisons} comparisons and ${recorder.stats.writes} writes, recursing ${maxDepth} level${maxDepth === 1 ? '' : 's'} deep.`,
  });

  return recorder.finish({
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
  });
}

export const mergeSortSpec: SortAlgorithmSpec = {
  id: 'merge-sort',
  name: 'Merge Sort',
  tagline: 'Divide into halves, sort each, then merge the ordered runs.',
  run: mergeSort,
  code: {
    pseudocode: PSEUDOCODE,
    typescript: TYPESCRIPT,
    lineMap: {
      1: [7],
      2: [8],
      3: [8],
      4: [9],
      5: [10],
      6: [11],
      7: [12],
      9: [15],
      10: [16],
      11: [17],
      12: [18, 19, 20],
      13: [21],
      14: [22],
      15: [23, 24],
      16: [25],
      17: [26, 27],
      18: [29],
      19: [31],
      20: [32, 33, 34],
      21: [36],
      22: [37, 38, 39],
    },
  },
  complexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
    stable: true,
    inPlace: false,
  },
  learn: {
    what: 'Merge sort is the classic divide-and-conquer sort. It halves the array until every piece holds one element, then repeatedly merges two ordered runs into one larger ordered run. Because merging two runs of total length m costs O(m) and there are log n levels of merging, the total work is O(n log n) on every input.',
    how: [
      'If the range holds zero or one element it is already sorted — return.',
      'Split the range at its midpoint.',
      'Recursively sort the left half, then the right half.',
      'Copy both halves into buffers.',
      'Repeatedly take the smaller of the two buffer heads and write it back into the array.',
      'When one buffer empties, copy the remainder of the other.',
    ],
    useCases: [
      'Sorting linked lists, where it needs no random access and no extra array.',
      'External sorting of data too large for memory.',
      'Anywhere a guaranteed O(n log n) worst case and stability matter — it underpins Timsort.',
    ],
    pros: [
      'O(n log n) on best, average and worst input — no pathological cases.',
      'Stable, so it can sort by one key then another.',
      'Merging is sequential, which is cache- and disk-friendly, and parallelises well.',
    ],
    cons: [
      'Needs O(n) auxiliary memory for the buffers.',
      'Slower than quicksort in practice on in-memory arrays because of the copying.',
      'Not adaptive in the textbook form: sorted input costs the same as random input.',
    ],
    challenge:
      'Run it on 8 values and count the merge levels. Then watch the "left buffer empty" drain steps: on which input does the merge never need to drain at all?',
  },
};
