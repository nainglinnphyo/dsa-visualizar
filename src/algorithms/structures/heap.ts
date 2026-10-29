import { StepRecorder } from '@/engine/recorder';
import { InputError, type AlgorithmResult } from '@/engine/types';
import type { CodeSource } from '@/engine/code';
import type { ComplexityInfo } from '@/types/learning';

export type HeapKind = 'min' | 'max';

export interface HeapState {
  values: number[];
  kind: HeapKind;
  /** Value removed by the last extract. */
  extracted: number | null;
}

export const MAX_HEAP_SIZE = 20;

export const createHeap = (values: number[] = [], kind: HeapKind = 'min'): HeapState => ({
  values,
  kind,
  extracted: null,
});

export const parentOf = (i: number): number => Math.floor((i - 1) / 2);
export const leftOf = (i: number): number => 2 * i + 1;
export const rightOf = (i: number): number => 2 * i + 2;

/** True when `child` should sit above `parent` for this heap kind. */
const beats = (kind: HeapKind, child: number, parent: number): boolean =>
  kind === 'min' ? child < parent : child > parent;

const rootWord = (kind: HeapKind): string => (kind === 'min' ? 'smallest' : 'largest');

const insertCode: CodeSource = {
  pseudocode: `function insert(heap, value):
  heap.push(value)
  i = heap.length - 1
  while i > 0:
    parent = floor((i - 1) / 2)
    if heap[i] beats heap[parent]:
      swap heap[i] and heap[parent]
      i = parent
    else:
      break`,
  typescript: `insert(value: number): void {
  this.items.push(value);
  let i = this.items.length - 1;
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    if (!this.beats(this.items[i], this.items[parent])) break;
    [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
    i = parent;
  }
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [5], 6: [6], 7: [7], 8: [8], 9: [6], 10: [6] },
};

const extractCode: CodeSource = {
  pseudocode: `function extractRoot(heap):
  if heap is empty: return null
  root = heap[0]
  heap[0] = heap[last]
  heap.pop()
  i = 0
  while true:
    best = i, l = 2i + 1, r = 2i + 2
    if l < size and heap[l] beats heap[best]: best = l
    if r < size and heap[r] beats heap[best]: best = r
    if best == i: break
    swap heap[i] and heap[best]
    i = best
  return root`,
  typescript: `extractRoot(): number | null {
  if (this.items.length === 0) return null;
  const root = this.items[0];
  const last = this.items.pop()!;
  if (this.items.length > 0) {
    this.items[0] = last;
    let i = 0;
    for (;;) {
      let best = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < this.items.length && this.beats(this.items[l], this.items[best])) best = l;
      if (r < this.items.length && this.beats(this.items[r], this.items[best])) best = r;
      if (best === i) break;
      [this.items[i], this.items[best]] = [this.items[best], this.items[i]];
      i = best;
    }
  }
  return root;
}`,
  lineMap: {
    1: [1], 2: [2], 3: [3], 4: [6], 5: [4], 6: [7], 7: [8], 8: [9, 10, 11],
    9: [12], 10: [13], 11: [14], 12: [15], 13: [16], 14: [19],
  },
};

const buildCode: CodeSource = {
  pseudocode: `function buildHeap(a):
  for i from floor(n / 2) - 1 down to 0:
    siftDown(a, i, n)
  // everything from n/2 on is a leaf and
  // already satisfies the heap property
  // total cost is O(n), not O(n log n)`,
  typescript: `function buildHeap(items: number[]): void {
  for (let i = Math.floor(items.length / 2) - 1; i >= 0; i -= 1) {
    siftDown(items, i, items.length);
  }
}`,
  lineMap: { 1: [1], 2: [2], 3: [3] },
};

const peekCode: CodeSource = {
  pseudocode: `function peek(heap):
  if heap is empty: return null
  return heap[0]`,
  typescript: `peek(): number | null {
  return this.items.length === 0 ? null : this.items[0];
}`,
  lineMap: { 1: [1], 2: [2], 3: [2] },
};

export function heapInsert(
  state: HeapState,
  rawValue: number,
): AlgorithmResult<HeapState> {
  if (!Number.isInteger(rawValue) || Math.abs(rawValue) > 999) {
    throw new InputError('Enter a whole number between −999 and 999.');
  }
  if (state.values.length >= MAX_HEAP_SIZE) {
    throw new InputError(`This visualizer caps the heap at ${MAX_HEAP_SIZE} values.`);
  }

  const recorder = new StepRecorder<HeapState>();
  const values = [...state.values];
  const snapshot = (): HeapState => ({ ...state, values: [...values], extracted: null });

  values.push(rawValue);
  recorder.count('writes');
  let i = values.length - 1;

  recorder.push({
    state: snapshot(),
    activeIndices: [i],
    description: `Append ${rawValue} at index ${i}, the next free slot. That keeps the tree complete but may break the heap property, so sift it up.`,
    operation: 'append',
    highlightedLines: [2, 3],
  });

  while (i > 0) {
    const parent = parentOf(i);
    recorder.count('comparisons');
    recorder.count('reads', 2);
    const shouldSwap = beats(state.kind, values[i], values[parent]);
    recorder.push({
      state: snapshot(),
      comparedIndices: [i, parent],
      activeIndices: [i],
      description: `Compare ${values[i]} at index ${i} with its parent ${values[parent]} at index ${parent} — ${
        shouldSwap
          ? `${values[i]} belongs above, so swap.`
          : 'the heap property already holds here, stop.'
      }`,
      operation: 'compare',
      highlightedLines: [4, 5, 6],
    });
    if (!shouldSwap) break;
    const tmp = values[i];
    values[i] = values[parent];
    values[parent] = tmp;
    recorder.count('swaps');
    recorder.count('writes', 2);
    recorder.push({
      state: snapshot(),
      swappedIndices: [i, parent],
      description: `Swap with the parent; ${tmp} is now at index ${parent}.`,
      operation: 'sift-up',
      highlightedLines: [7, 8],
    });
    i = parent;
  }

  recorder.push({
    state: snapshot(),
    sortedIndices: [0],
    description: `Heap property restored after ${recorder.stats.swaps} swap${recorder.stats.swaps === 1 ? '' : 's'}. The root holds ${values[0]}, the ${rootWord(state.kind)} value.`,
    operation: 'done',
    highlightedLines: [9, 10],
  });

  return recorder.finish({
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
  });
}

export function heapExtract(state: HeapState): AlgorithmResult<HeapState> {
  const recorder = new StepRecorder<HeapState>();
  const values = [...state.values];
  const snapshot = (extracted: number | null = null): HeapState => ({
    ...state,
    values: [...values],
    extracted,
  });

  if (values.length === 0) {
    recorder.push({
      state: snapshot(),
      description: 'The heap is empty — there is nothing to extract.',
      operation: 'underflow',
      highlightedLines: [2],
    });
    return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
  }

  const root = values[0];
  recorder.count('reads');
  recorder.push({
    state: snapshot(root),
    activeIndices: [0],
    description: `The root holds ${root}, the ${rootWord(state.kind)} value — that is what gets returned.`,
    operation: 'read-root',
    highlightedLines: [3],
  });

  const last = values.pop() as number;
  if (values.length === 0) {
    recorder.push({
      state: snapshot(root),
      description: `${root} was the only value; the heap is now empty.`,
      operation: 'done',
      highlightedLines: [14],
    });
    return recorder.finish({
      timeComplexity: 'O(log n)',
      spaceComplexity: 'O(1)',
      summary: `Extracted ${root}.`,
    });
  }

  values[0] = last;
  recorder.count('writes');
  recorder.push({
    state: snapshot(root),
    swappedIndices: [0],
    description: `Move the last value, ${last}, into the root so the tree stays complete. It is almost certainly in the wrong place, so sift it down.`,
    operation: 'move-last',
    highlightedLines: [4, 5],
  });

  let i = 0;
  for (;;) {
    let best = i;
    const left = leftOf(i);
    const right = rightOf(i);
    const children = [left, right].filter((child) => child < values.length);

    if (children.length === 0) {
      recorder.push({
        state: snapshot(root),
        activeIndices: [i],
        description: `Index ${i} is a leaf — sifting is done.`,
        operation: 'leaf',
        highlightedLines: [11, 12],
      });
      break;
    }

    for (const child of children) {
      recorder.count('comparisons');
      recorder.count('reads', 2);
      if (beats(state.kind, values[child], values[best])) best = child;
    }

    recorder.push({
      state: snapshot(root),
      comparedIndices: children,
      activeIndices: [best],
      description: `Compare ${values[i]} with ${children.map((c) => `${values[c]} (index ${c})`).join(' and ')} — the ${rootWord(state.kind)} of the three is ${values[best]}.`,
      operation: 'compare',
      highlightedLines: [8, 9, 10],
    });

    if (best === i) {
      recorder.push({
        state: snapshot(root),
        activeIndices: [i],
        description: `${values[i]} already beats both children, so the heap property holds from here down.`,
        operation: 'settled',
        highlightedLines: [11],
      });
      break;
    }

    const tmp = values[i];
    values[i] = values[best];
    values[best] = tmp;
    recorder.count('swaps');
    recorder.count('writes', 2);
    recorder.push({
      state: snapshot(root),
      swappedIndices: [i, best],
      description: `Swap ${values[best]} down to index ${best} and ${values[i]} up to index ${i}.`,
      operation: 'sift-down',
      highlightedLines: [12, 13],
    });
    i = best;
  }

  recorder.push({
    state: snapshot(root),
    sortedIndices: [0],
    description: `Returned ${root}. The new root is ${values[0]}, and the heap holds ${values.length} value${values.length === 1 ? '' : 's'}.`,
    operation: 'done',
    highlightedLines: [14],
  });

  return recorder.finish({
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    summary: `Extracted ${root}.`,
  });
}

export function heapPeek(state: HeapState): AlgorithmResult<HeapState> {
  const recorder = new StepRecorder<HeapState>();
  const snapshot = (): HeapState => ({ ...state, values: [...state.values], extracted: null });

  if (state.values.length === 0) {
    recorder.push({
      state: snapshot(),
      description: 'The heap is empty, so there is no root to read.',
      operation: 'underflow',
      highlightedLines: [2],
    });
    return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
  }

  recorder.count('reads');
  recorder.push({
    state: snapshot(),
    activeIndices: [0],
    sortedIndices: [0],
    description: `The root is always the ${rootWord(state.kind)} value: ${state.values[0]}. Reading it is O(1) — only removing it costs O(log n).`,
    operation: 'peek',
    highlightedLines: [3],
  });

  return recorder.finish({
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    summary: `Root is ${state.values[0]}.`,
  });
}

/** Floyd's bottom-up heapify over the current array. */
export function heapBuild(state: HeapState): AlgorithmResult<HeapState> {
  const recorder = new StepRecorder<HeapState>();
  const values = [...state.values];
  const n = values.length;
  const snapshot = (): HeapState => ({ ...state, values: [...values], extracted: null });

  recorder.push({
    state: snapshot(),
    description:
      n === 0
        ? 'There is nothing to heapify.'
        : `Heapify ${n} values in place. Indices ${Math.floor(n / 2)}…${n - 1} are leaves, so they already satisfy the heap property — start at index ${Math.floor(n / 2) - 1}.`,
    operation: 'start',
    highlightedLines: [1, 2],
  });

  const siftDown = (start: number, size: number): void => {
    let i = start;
    for (;;) {
      let best = i;
      const children = [leftOf(i), rightOf(i)].filter((c) => c < size);
      if (children.length === 0) return;
      for (const child of children) {
        recorder.count('comparisons');
        recorder.count('reads', 2);
        if (beats(state.kind, values[child], values[best])) best = child;
      }
      recorder.push({
        state: snapshot(),
        comparedIndices: children,
        activeIndices: [i],
        description: `Index ${i} holds ${values[i]}; children are ${children.map((c) => values[c]).join(' and ')}. ${
          best === i ? 'It already beats them.' : `${values[best]} must move up.`
        }`,
        operation: 'compare',
        highlightedLines: [3],
      });
      if (best === i) return;
      const tmp = values[i];
      values[i] = values[best];
      values[best] = tmp;
      recorder.count('swaps');
      recorder.count('writes', 2);
      recorder.push({
        state: snapshot(),
        swappedIndices: [i, best],
        description: `Swap indices ${i} and ${best}, then keep sifting from ${best}.`,
        operation: 'sift-down',
        highlightedLines: [3],
      });
      i = best;
    }
  };

  for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) {
    recorder.push({
      state: snapshot(),
      activeIndices: [i],
      description: `Sift index ${i} (value ${values[i]}) down into place.`,
      operation: 'sift-start',
      highlightedLines: [2, 3],
    });
    siftDown(i, n);
  }

  recorder.push({
    state: snapshot(),
    sortedIndices: n > 0 ? [0] : [],
    description:
      n === 0
        ? 'Nothing to do.'
        : `Heap built with ${recorder.stats.comparisons} comparisons. Building bottom-up is O(n) — most nodes are near the leaves and barely move.`,
    operation: 'done',
    highlightedLines: [4, 5, 6],
  });

  return recorder.finish({ timeComplexity: 'O(n)', spaceComplexity: 'O(1)' });
}

export interface HeapOperationSpec {
  id: string;
  label: string;
  description: string;
  needsValue: boolean;
  code: CodeSource;
  complexity: ComplexityInfo;
}

export const HEAP_OPERATIONS: HeapOperationSpec[] = [
  {
    id: 'insert',
    label: 'Insert',
    description: 'Append at the end, then sift up until the parent wins.',
    needsValue: true,
    code: insertCode,
    complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
  },
  {
    id: 'extract',
    label: 'Extract root',
    description: 'Return the root, move the last value up, then sift down.',
    needsValue: false,
    code: extractCode,
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)', space: 'O(1)' },
  },
  {
    id: 'peek',
    label: 'Peek',
    description: 'Read the root without removing it.',
    needsValue: false,
    code: peekCode,
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
  },
  {
    id: 'build',
    label: 'Heapify',
    description: 'Turn the current array into a heap bottom-up, in O(n).',
    needsValue: false,
    code: buildCode,
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  },
];
