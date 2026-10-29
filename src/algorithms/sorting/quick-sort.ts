import { StepRecorder } from '@/engine/recorder';
import type { AlgorithmResult } from '@/engine/types';
import type { SortAlgorithmSpec, SortState } from './types';

const PSEUDOCODE = `function quickSort(a, lo, hi):
  if lo >= hi:
    return
  p = partition(a, lo, hi)
  quickSort(a, lo, p - 1)
  quickSort(a, p + 1, hi)

function partition(a, lo, hi):
  pivot = a[hi]
  i = lo
  for j from lo to hi - 1:
    if a[j] < pivot:
      swap a[i] and a[j]
      i = i + 1
  swap a[i] and a[hi]
  return i`;

const TYPESCRIPT = `export function quickSort(input: number[]): number[] {
  const a = [...input];
  sort(a, 0, a.length - 1);
  return a;
}

function sort(a: number[], lo: number, hi: number): void {
  if (lo >= hi) return;
  const p = partition(a, lo, hi);
  sort(a, lo, p - 1);
  sort(a, p + 1, hi);
}

function partition(a: number[], lo: number, hi: number): number {
  const pivot = a[hi];
  let i = lo;
  for (let j = lo; j < hi; j += 1) {
    if (a[j] < pivot) {
      [a[i], a[j]] = [a[j], a[i]];
      i += 1;
    }
  }
  [a[i], a[hi]] = [a[hi], a[i]];
  return i;
}`;

export function quickSort(input: number[]): AlgorithmResult<SortState> {
  const recorder = new StepRecorder<SortState>();
  const a = [...input];
  const n = a.length;
  const placed = new Set<number>();
  let maxDepth = 0;

  const snapshot = (extra: Partial<SortState> = {}): SortState => ({
    values: [...a],
    ...extra,
  });

  recorder.push({
    state: snapshot(),
    description:
      n === 0
        ? 'The array is empty, so there is nothing to sort.'
        : `Start with ${n} value${n === 1 ? '' : 's'}. Quicksort picks a pivot, moves everything smaller to its left, then sorts the two sides.`,
    operation: 'start',
    highlightedLines: [1],
  });

  const partition = (lo: number, hi: number, depth: number): number => {
    const pivot = a[hi];
    recorder.count('reads');
    recorder.push({
      state: snapshot({ range: { low: lo, high: hi }, pivotIndex: hi }),
      activeIndices: [hi],
      sortedIndices: [...placed],
      highlightedLines: [8, 9, 10],
      operation: 'pivot',
      description: `Partition a[${lo}…${hi}] using the last value, ${pivot}, as the pivot. The boundary i starts at ${lo}.`,
    });

    let i = lo;
    for (let j = lo; j < hi; j += 1) {
      recorder.count('comparisons');
      recorder.count('reads');
      const smaller = a[j] < pivot;
      recorder.push({
        state: snapshot({ range: { low: lo, high: hi }, pivotIndex: hi }),
        comparedIndices: [j, hi],
        activeIndices: [i],
        sortedIndices: [...placed],
        highlightedLines: [11, 12],
        operation: 'compare',
        description: `Compare a[${j}] = ${a[j]} with the pivot ${pivot} — ${
          smaller
            ? `smaller, so it belongs in the left partition.`
            : `not smaller, so it stays on the right of the boundary.`
        }`,
      });
      if (smaller) {
        if (i !== j) {
          const tmp = a[i];
          a[i] = a[j];
          a[j] = tmp;
          recorder.count('swaps');
          recorder.count('writes', 2);
          recorder.push({
            state: snapshot({ range: { low: lo, high: hi }, pivotIndex: hi }),
            swappedIndices: [i, j],
            sortedIndices: [...placed],
            highlightedLines: [13],
            operation: 'swap',
            description: `Swap a[${i}] and a[${j}] to pull ${a[i]} into the left partition.`,
          });
        }
        i += 1;
        recorder.push({
          state: snapshot({ range: { low: lo, high: hi }, pivotIndex: hi }),
          activeIndices: [i],
          sortedIndices: [...placed],
          highlightedLines: [14],
          operation: 'advance',
          description: `Move the boundary to i = ${i}; a[${lo}…${i - 1}] is now everything smaller than the pivot.`,
        });
      }
    }

    if (i !== hi) {
      const tmp = a[i];
      a[i] = a[hi];
      a[hi] = tmp;
      recorder.count('swaps');
      recorder.count('writes', 2);
    }
    placed.add(i);
    recorder.set('depth', depth);
    recorder.push({
      state: snapshot({ range: { low: lo, high: hi }, pivotIndex: i }),
      swappedIndices: i !== hi ? [i, hi] : [],
      activeIndices: [i],
      sortedIndices: [...placed],
      highlightedLines: [15, 16],
      operation: 'place-pivot',
      description: `Swap the pivot into the boundary: ${pivot} lands at index ${i}, which is its final position.`,
    });
    return i;
  };

  const sort = (lo: number, hi: number, depth: number): void => {
    recorder.set('depth', depth);
    maxDepth = Math.max(maxDepth, depth);
    if (lo >= hi) {
      if (lo === hi) {
        placed.add(lo);
        recorder.push({
          state: snapshot({ range: { low: lo, high: hi } }),
          activeIndices: [lo],
          sortedIndices: [...placed],
          highlightedLines: [2, 3],
          operation: 'base-case',
          description: `a[${lo}…${hi}] holds one value (${a[lo]}) — nothing to partition.`,
        });
      }
      return;
    }
    const p = partition(lo, hi, depth);
    recorder.push({
      state: snapshot({ range: { low: lo, high: hi }, pivotIndex: p }),
      sortedIndices: [...placed],
      highlightedLines: [5, 6],
      operation: 'recurse',
      description: `Recurse into a[${lo}…${p - 1}] and a[${p + 1}…${hi}]; the pivot at ${p} never moves again.`,
    });
    sort(lo, p - 1, depth + 1);
    sort(p + 1, hi, depth + 1);
  };

  if (n > 0) sort(0, n - 1, 1);
  recorder.set('depth', 0);

  recorder.push({
    state: snapshot(),
    sortedIndices: Array.from({ length: n }, (_, k) => k),
    highlightedLines: [1],
    operation: 'done',
    description:
      n <= 1
        ? 'An array of fewer than two values is sorted by definition.'
        : `Sorted with ${recorder.stats.comparisons} comparisons and ${recorder.stats.swaps} swaps; deepest recursion was ${maxDepth} level${maxDepth === 1 ? '' : 's'}.`,
  });

  return recorder.finish({
    timeComplexity: 'O(n log n) average, O(n²) worst',
    spaceComplexity: 'O(log n) average stack',
  });
}

export const quickSortSpec: SortAlgorithmSpec = {
  id: 'quick-sort',
  name: 'Quick Sort',
  tagline: 'Partition around a pivot, then sort the two sides.',
  run: quickSort,
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
      8: [14],
      9: [15],
      10: [16],
      11: [17],
      12: [18],
      13: [19],
      14: [20],
      15: [23],
      16: [24],
    },
  },
  complexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
    stable: false,
    inPlace: true,
  },
  learn: {
    what: 'Quicksort chooses a pivot and rearranges the range so that everything smaller sits to its left and everything else to its right. The pivot is then in its final place, and the two sides are sorted recursively. This visualizer uses the Lomuto scheme with the last element as pivot.',
    how: [
      'If the range has fewer than two elements, return.',
      'Take the last element as the pivot.',
      'Keep a boundary i marking the end of the "smaller than pivot" region.',
      'Scan j across the range; whenever a[j] < pivot, swap it to the boundary and advance i.',
      'Finally swap the pivot into the boundary — it is now in its final position.',
      'Recurse on the ranges left and right of the pivot.',
    ],
    useCases: [
      'The default in-memory sort in many standard libraries (usually as part of a hybrid like introsort).',
      'Quickselect — the same partition step finds the k-th smallest value in O(n) average time.',
      'Sorting large arrays where cache locality beats merge sort’s extra copying.',
    ],
    pros: [
      'Fastest comparison sort in practice on random in-memory data.',
      'In place: only O(log n) stack space on average.',
      'The partition step alone solves selection problems.',
    ],
    cons: [
      'O(n²) when the pivot is consistently the smallest or largest value — already sorted input is the worst case for last-element pivots.',
      'Not stable.',
      'Recursion depth can degrade to O(n) without tail-call or median-of-three protection.',
    ],
    challenge:
      'Sort 1, 2, 3, 4, 5 and watch the recursion depth counter climb to 5 — that is the O(n²) worst case. Then randomize and compare. How would picking the median of three values fix it?',
  },
};
