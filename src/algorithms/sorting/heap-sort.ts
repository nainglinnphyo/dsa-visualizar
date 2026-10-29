import { StepRecorder } from '@/engine/recorder';
import type { AlgorithmResult } from '@/engine/types';
import type { SortAlgorithmSpec, SortState } from './types';

const PSEUDOCODE = `function heapSort(a):
  n = length(a)
  for i from floor(n / 2) - 1 down to 0:
    siftDown(a, i, n)
  for end from n - 1 down to 1:
    swap a[0] and a[end]
    siftDown(a, 0, end)
  return a

function siftDown(a, root, size):
  largest = root
  left = 2 * root + 1
  right = 2 * root + 2
  if left < size and a[left] > a[largest]:
    largest = left
  if right < size and a[right] > a[largest]:
    largest = right
  if largest != root:
    swap a[root] and a[largest]
    siftDown(a, largest, size)`;

const TYPESCRIPT = `export function heapSort(input: number[]): number[] {
  const a = [...input];
  const n = a.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) {
    siftDown(a, i, n);
  }
  for (let end = n - 1; end > 0; end -= 1) {
    [a[0], a[end]] = [a[end], a[0]];
    siftDown(a, 0, end);
  }
  return a;
}

function siftDown(a: number[], root: number, size: number): void {
  let largest = root;
  const left = 2 * root + 1;
  const right = 2 * root + 2;
  if (left < size && a[left] > a[largest]) largest = left;
  if (right < size && a[right] > a[largest]) largest = right;
  if (largest !== root) {
    [a[root], a[largest]] = [a[largest], a[root]];
    siftDown(a, largest, size);
  }
}`;

export function heapSort(input: number[]): AlgorithmResult<SortState> {
  const recorder = new StepRecorder<SortState>();
  const a = [...input];
  const n = a.length;
  const placed = new Set<number>();

  const snapshot = (extra: Partial<SortState> = {}): SortState => ({
    values: [...a],
    ...extra,
  });

  recorder.push({
    state: snapshot(),
    description:
      n === 0
        ? 'The array is empty, so there is nothing to sort.'
        : `Start with ${n} value${n === 1 ? '' : 's'}. Heap sort first rearranges the array into a max-heap, then repeatedly moves the root to the end.`,
    operation: 'start',
    highlightedLines: [2],
  });

  const siftDown = (root: number, size: number, depth: number): void => {
    recorder.set('depth', depth);
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;
    const children = [left, right].filter((child) => child < size);

    recorder.push({
      state: snapshot({ range: { low: 0, high: size - 1 } }),
      activeIndices: [root],
      comparedIndices: children,
      sortedIndices: [...placed],
      highlightedLines: [11, 12, 13],
      operation: 'sift',
      description:
        children.length === 0
          ? `a[${root}] = ${a[root]} is a leaf inside the heap — nothing to sift.`
          : `Sift a[${root}] = ${a[root]} down. Its child${children.length === 1 ? '' : 'ren'} ${children
              .map((c) => `a[${c}] = ${a[c]}`)
              .join(' and ')}.`,
    });

    if (left < size) {
      recorder.count('comparisons');
      recorder.count('reads', 2);
      if (a[left] > a[largest]) largest = left;
      recorder.push({
        state: snapshot({ range: { low: 0, high: size - 1 } }),
        comparedIndices: [left, root],
        activeIndices: [largest],
        sortedIndices: [...placed],
        highlightedLines: [14, 15],
        operation: 'compare',
        description: `Left child a[${left}] = ${a[left]} vs a[${root}] = ${a[root]} — largest so far is a[${largest}] = ${a[largest]}.`,
      });
    }
    if (right < size) {
      recorder.count('comparisons');
      recorder.count('reads', 2);
      if (a[right] > a[largest]) largest = right;
      recorder.push({
        state: snapshot({ range: { low: 0, high: size - 1 } }),
        comparedIndices: [right, largest],
        activeIndices: [largest],
        sortedIndices: [...placed],
        highlightedLines: [16, 17],
        operation: 'compare',
        description: `Right child a[${right}] = ${a[right]} vs a[${largest}] = ${a[largest]} — largest so far is a[${largest}] = ${a[largest]}.`,
      });
    }

    if (largest !== root) {
      const tmp = a[root];
      a[root] = a[largest];
      a[largest] = tmp;
      recorder.count('swaps');
      recorder.count('writes', 2);
      recorder.push({
        state: snapshot({ range: { low: 0, high: size - 1 } }),
        swappedIndices: [root, largest],
        sortedIndices: [...placed],
        highlightedLines: [18, 19],
        operation: 'swap',
        description: `a[${largest}] was bigger, so swap: ${a[root]} moves up to index ${root}.`,
      });
      siftDown(largest, size, depth + 1);
    } else if (children.length > 0) {
      recorder.push({
        state: snapshot({ range: { low: 0, high: size - 1 } }),
        activeIndices: [root],
        sortedIndices: [...placed],
        highlightedLines: [18],
        operation: 'heap-ok',
        description: `a[${root}] = ${a[root]} is already at least as large as both children — the heap property holds here.`,
      });
    }
  };

  for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) {
    recorder.push({
      state: snapshot({ range: { low: 0, high: n - 1 } }),
      activeIndices: [i],
      sortedIndices: [...placed],
      highlightedLines: [3, 4],
      operation: 'build-heap',
      description: `Build phase: sift index ${i} down. Indices ${Math.floor(n / 2)}…${n - 1} are leaves and need no work.`,
    });
    siftDown(i, n, 1);
  }

  if (n > 1) {
    recorder.push({
      state: snapshot({ range: { low: 0, high: n - 1 } }),
      activeIndices: [0],
      sortedIndices: [...placed],
      highlightedLines: [5],
      operation: 'heap-built',
      description: `The array is now a max-heap, so a[0] = ${a[0]} is the largest value. Start extracting.`,
    });
  }

  for (let end = n - 1; end > 0; end -= 1) {
    const root = a[0];
    const tail = a[end];
    a[0] = tail;
    a[end] = root;
    recorder.count('swaps');
    recorder.count('writes', 2);
    placed.add(end);
    recorder.push({
      state: snapshot({ range: { low: 0, high: end - 1 } }),
      swappedIndices: [0, end],
      sortedIndices: [...placed],
      highlightedLines: [6],
      operation: 'extract',
      description: `Swap the root ${root} with a[${end}]. ${root} is now in its final position and the heap shrinks to ${end} element${end === 1 ? '' : 's'}.`,
    });
    if (end > 1) siftDown(0, end, 1);
  }

  for (let k = 0; k < n; k += 1) placed.add(k);
  recorder.set('depth', 0);
  recorder.push({
    state: snapshot(),
    sortedIndices: [...placed],
    highlightedLines: [8],
    operation: 'done',
    description:
      n <= 1
        ? 'An array of fewer than two values is sorted by definition.'
        : `Sorted in place with ${recorder.stats.comparisons} comparisons and ${recorder.stats.swaps} swaps.`,
  });

  return recorder.finish({
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(1)',
  });
}

export const heapSortSpec: SortAlgorithmSpec = {
  id: 'heap-sort',
  name: 'Heap Sort',
  tagline: 'Build a max-heap in place, then pop the root to the back.',
  run: heapSort,
  code: {
    pseudocode: PSEUDOCODE,
    typescript: TYPESCRIPT,
    lineMap: {
      1: [1],
      2: [3],
      3: [4],
      4: [5],
      5: [7],
      6: [8],
      7: [9],
      8: [11],
      10: [14],
      11: [15],
      12: [16],
      13: [17],
      14: [18],
      15: [18],
      16: [19],
      17: [19],
      18: [20],
      19: [21],
      20: [22],
    },
  },
  complexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
    stable: false,
    inPlace: true,
  },
  learn: {
    what: 'Heap sort treats the array as an implicit binary heap: the children of index i live at 2i+1 and 2i+2. It first turns the array into a max-heap bottom-up, then repeatedly swaps the root (the maximum) with the last heap slot and shrinks the heap, which grows a sorted suffix from the right.',
    how: [
      'Everything from index ⌊n/2⌋ onwards is a leaf, so start sifting at ⌊n/2⌋ − 1 and work backwards.',
      'Sifting down compares a node with its two children and swaps it with the larger one until it is in place.',
      'After the build phase a[0] holds the maximum.',
      'Swap a[0] with the last heap element — that element is now final.',
      'Shrink the heap by one and sift the new root down.',
      'Repeat until the heap holds one element.',
    ],
    useCases: [
      'Guaranteed O(n log n) with O(1) extra memory — useful in memory-constrained or real-time systems.',
      'The fallback in introsort when quicksort recurses too deeply.',
      'Priority queues, which share the same sift operations.',
    ],
    pros: [
      'O(n log n) worst case with no extra memory.',
      'The build phase is only O(n), not O(n log n).',
      'No worst-case input that degrades it.',
    ],
    cons: [
      'Not stable.',
      'Jumps around the array, so it is far less cache-friendly than quicksort.',
      'Usually measurably slower than quicksort in practice despite the same asymptotics.',
    ],
    challenge:
      'Watch the build phase only. Pause when the heap is built and check: is a[1] ≥ a[3] and a[1] ≥ a[4]? That inequality at every node is the whole heap property.',
  },
};
