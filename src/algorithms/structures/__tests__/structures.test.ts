import { describe, expect, it } from 'vitest';
import { InputError, type AlgorithmResult } from '@/engine/types';
import {
  createStack,
  stackPeek,
  stackPop,
  stackPush,
} from '../stack';
import {
  createQueue,
  queueDequeue,
  queueEnqueue,
  queuePeek,
  type QueueState,
} from '../queue';
import {
  createLinkedList,
  deleteAtPosition,
  insertAtHead,
  insertAtPosition,
  insertAtTail,
  listValues,
  searchList,
  type LinkedListState,
} from '../linked-list';
import {
  createHashTable,
  hashDelete,
  hashInsert,
  hashKey,
  hashSearch,
  MULTIPLIER,
  type HashTableState,
} from '../hash-table';
import {
  createHeap,
  heapBuild,
  heapExtract,
  heapInsert,
  heapPeek,
  leftOf,
  parentOf,
  rightOf,
  type HeapKind,
  type HeapState,
} from '../heap';

const last = <T>(result: AlgorithmResult<T>): T =>
  result.steps[result.steps.length - 1].state;

describe('stack', () => {
  it('pops in reverse order of pushes', () => {
    let state = createStack(5);
    for (const value of [1, 2, 3]) state = last(stackPush(state, value));
    const popped: number[] = [];
    for (let i = 0; i < 3; i += 1) {
      const result = stackPop(state);
      state = last(result);
      popped.push(state.result as number);
    }
    expect(popped).toEqual([3, 2, 1]);
    expect(state.items).toEqual([]);
  });

  it('reports overflow without losing the existing items', () => {
    let state = createStack(2);
    state = last(stackPush(state, 1));
    state = last(stackPush(state, 2));
    state = last(stackPush(state, 3));
    expect(state.status).toBe('overflow');
    expect(state.items).toEqual([1, 2]);
  });

  it('reports underflow on an empty stack', () => {
    const state = last(stackPop(createStack(3)));
    expect(state.status).toBe('underflow');
    expect(state.result).toBeNull();
  });

  it('peek leaves the stack unchanged', () => {
    const start = last(stackPush(createStack(3), 7));
    const after = last(stackPeek(start));
    expect(after.items).toEqual(start.items);
    expect(after.result).toBe(7);
  });

  it('peek on empty underflows', () => {
    expect(last(stackPeek(createStack(3))).status).toBe('underflow');
  });

  it('rejects non-integer pushes', () => {
    expect(() => stackPush(createStack(3), 1.5)).toThrow(InputError);
  });
});

describe('queue', () => {
  const drain = (state: QueueState, times: number): number[] => {
    const out: number[] = [];
    let current = state;
    for (let i = 0; i < times; i += 1) {
      current = last(queueDequeue(current));
      if (current.result !== null) out.push(current.result);
    }
    return out;
  };

  it.each(['linear', 'circular'] as const)(
    '%s queue dequeues in insertion order',
    (kind) => {
      let state = createQueue(5, kind === 'circular');
      for (const value of [1, 2, 3]) state = last(queueEnqueue(state, value));
      expect(drain(state, 3)).toEqual([1, 2, 3]);
    },
  );

  it('a linear queue reports overflow even with free slots at the front', () => {
    let state = createQueue(3, false);
    for (const value of [1, 2, 3]) state = last(queueEnqueue(state, value));
    state = last(queueDequeue(state));
    state = last(queueEnqueue(state, 4));
    expect(state.status).toBe('overflow');
    expect(state.size).toBe(2);
  });

  it('a circular queue reuses the freed slot', () => {
    let state = createQueue(3, true);
    for (const value of [1, 2, 3]) state = last(queueEnqueue(state, value));
    state = last(queueDequeue(state));
    state = last(queueEnqueue(state, 4));
    expect(state.status).toBeNull();
    expect(state.size).toBe(3);
    expect(drain(state, 3)).toEqual([2, 3, 4]);
  });

  it('a circular queue overflows only when size reaches capacity', () => {
    let state = createQueue(2, true);
    state = last(queueEnqueue(state, 1));
    state = last(queueEnqueue(state, 2));
    state = last(queueEnqueue(state, 3));
    expect(state.status).toBe('overflow');
  });

  it('wraps front and rear around the capacity', () => {
    let state = createQueue(3, true);
    for (const value of [1, 2, 3]) state = last(queueEnqueue(state, value));
    state = last(queueDequeue(state));
    state = last(queueDequeue(state));
    state = last(queueEnqueue(state, 4));
    state = last(queueEnqueue(state, 5));
    expect(state.front).toBe(2);
    expect(state.rear).toBe(1);
    expect(drain(state, 3)).toEqual([3, 4, 5]);
  });

  it('underflows on an empty queue', () => {
    expect(last(queueDequeue(createQueue(3))).status).toBe('underflow');
    expect(last(queuePeek(createQueue(3))).status).toBe('underflow');
  });

  it('peek returns the front without removing it', () => {
    let state = createQueue(3);
    state = last(queueEnqueue(state, 9));
    const peeked = last(queuePeek(state));
    expect(peeked.result).toBe(9);
    expect(peeked.size).toBe(1);
  });
});

describe('linked list', () => {
  const run = (
    state: LinkedListState,
    operation: (s: LinkedListState) => AlgorithmResult<LinkedListState>,
  ): LinkedListState => last(operation(state));

  it('inserts at the head in reverse order', () => {
    let state = createLinkedList([]);
    for (const value of [1, 2, 3]) state = run(state, (s) => insertAtHead(s, value));
    expect(listValues(state)).toEqual([3, 2, 1]);
  });

  it('inserts at the tail in order', () => {
    let state = createLinkedList([]);
    for (const value of [1, 2, 3]) state = run(state, (s) => insertAtTail(s, value));
    expect(listValues(state)).toEqual([1, 2, 3]);
  });

  it('inserts at an interior position', () => {
    let state = createLinkedList([1, 2, 4]);
    state = run(state, (s) => insertAtPosition(s, 2, 3));
    expect(listValues(state)).toEqual([1, 2, 3, 4]);
  });

  it('inserting at position 0 is the same as inserting at the head', () => {
    const state = run(createLinkedList([2, 3]), (s) => insertAtPosition(s, 0, 1));
    expect(listValues(state)).toEqual([1, 2, 3]);
  });

  it('inserting at length appends', () => {
    const state = run(createLinkedList([1, 2]), (s) => insertAtPosition(s, 2, 3));
    expect(listValues(state)).toEqual([1, 2, 3]);
    expect(state.nodes[state.tail as string].value).toBe(3);
  });

  it('rejects an out-of-range position', () => {
    expect(() => insertAtPosition(createLinkedList([1]), 5, 9)).toThrow(InputError);
    expect(() => deleteAtPosition(createLinkedList([1]), 3)).toThrow(InputError);
    expect(() => deleteAtPosition(createLinkedList([]), 0)).toThrow(InputError);
  });

  it.each([0, 1, 2])('deletes position %i', (position) => {
    const state = run(createLinkedList([10, 20, 30]), (s) =>
      deleteAtPosition(s, position),
    );
    expect(listValues(state)).toEqual([10, 20, 30].filter((_, i) => i !== position));
  });

  it('frees the detached node rather than leaking it', () => {
    const state = run(createLinkedList([1, 2, 3]), (s) => deleteAtPosition(s, 1));
    expect(Object.keys(state.nodes)).toHaveLength(2);
  });

  it('keeps head and tail correct when emptying the list', () => {
    let state = createLinkedList([1]);
    state = run(state, (s) => deleteAtPosition(s, 0));
    expect(state.head).toBeNull();
    expect(state.tail).toBeNull();
    expect(listValues(state)).toEqual([]);
  });

  it('updates the tail when the last node is deleted', () => {
    const state = run(createLinkedList([1, 2, 3]), (s) => deleteAtPosition(s, 2));
    expect(state.nodes[state.tail as string].value).toBe(2);
  });

  it('maintains prev pointers in a doubly linked list', () => {
    let state = createLinkedList([1, 2], true);
    state = run(state, (s) => insertAtTail(s, 3));
    state = run(state, (s) => insertAtHead(s, 0));
    const order = listValues(state);
    expect(order).toEqual([0, 1, 2, 3]);
    let id = state.tail;
    const backwards: number[] = [];
    while (id) {
      backwards.push(state.nodes[id].value);
      id = state.nodes[id].prev;
    }
    expect(backwards).toEqual([...order].reverse());
  });

  it('finds a value and reports a miss', () => {
    const state = createLinkedList([4, 7, 2]);
    const hit = last(searchList(state, 7));
    expect(hit.nodes[hit.found as string].value).toBe(7);
    expect(last(searchList(state, 99)).found).toBeNull();
  });

  it('searching an empty list reports not found', () => {
    expect(last(searchList(createLinkedList([]), 1)).found).toBeNull();
  });
});

describe('hash table', () => {
  it('computes the documented hash function', () => {
    const { hash, steps } = hashKey('ab', 8);
    const expected = ((0 * MULTIPLIER + 97) % 8) * MULTIPLIER + 98;
    expect(hash).toBe(expected % 8);
    expect(steps).toHaveLength(2);
  });

  it.each(['chaining', 'linear-probing'] as const)(
    '%s stores and retrieves values',
    (strategy) => {
      let table: HashTableState = createHashTable(8, strategy);
      const pairs: [string, number][] = [
        ['cat', 1],
        ['dog', 2],
        ['bird', 3],
      ];
      for (const [key, value] of pairs) table = last(hashInsert(table, key, value));
      for (const [key, value] of pairs) {
        expect(last(hashSearch(table, key)).result).toBe(`${key} → ${value}`);
      }
      expect(table.count).toBe(3);
    },
  );

  it.each(['chaining', 'linear-probing'] as const)(
    '%s overwrites rather than duplicating an existing key',
    (strategy) => {
      let table = createHashTable(8, strategy);
      table = last(hashInsert(table, 'cat', 1));
      table = last(hashInsert(table, 'cat', 9));
      expect(table.count).toBe(1);
      expect(last(hashSearch(table, 'cat')).result).toBe('cat → 9');
    },
  );

  it('chaining keeps colliding keys in the same bucket', () => {
    // A capacity of 1 forces every key into bucket 0.
    let table = createHashTable(1, 'chaining');
    table = last(hashInsert(table, 'a', 1));
    table = last(hashInsert(table, 'b', 2));
    const slot = table.buckets[0];
    expect(slot.kind).toBe('entries');
    expect(slot.kind === 'entries' && slot.entries).toHaveLength(2);
  });

  it('linear probing places a colliding key in the next free slot', () => {
    let table = createHashTable(4, 'linear-probing');
    table = last(hashInsert(table, 'a', 1));
    const firstBucket = table.buckets.findIndex((slot) => slot.kind === 'entries');
    table = last(hashInsert(table, 'e', 2)); // 'a'=97, 'e'=101; 97%4 === 101%4
    const occupied = table.buckets
      .map((slot, i) => (slot.kind === 'entries' ? i : -1))
      .filter((i) => i >= 0);
    expect(occupied).toHaveLength(2);
    expect(occupied).toContain(firstBucket);
  });

  it('leaves a tombstone so probing can still reach later keys', () => {
    let table = createHashTable(4, 'linear-probing');
    table = last(hashInsert(table, 'a', 1));
    table = last(hashInsert(table, 'e', 2));
    table = last(hashDelete(table, 'a'));
    expect(table.buckets.some((slot) => slot.kind === 'tombstone')).toBe(true);
    expect(last(hashSearch(table, 'e')).result).toBe('e → 2');
  });

  it('chaining deletion removes only the target from the chain', () => {
    let table = createHashTable(1, 'chaining');
    table = last(hashInsert(table, 'a', 1));
    table = last(hashInsert(table, 'b', 2));
    table = last(hashDelete(table, 'a'));
    expect(table.count).toBe(1);
    expect(last(hashSearch(table, 'b')).result).toBe('b → 2');
    expect(last(hashSearch(table, 'a')).result).toBeNull();
  });

  it('searching a missing key reports not found', () => {
    const table = createHashTable(8, 'chaining');
    expect(last(hashSearch(table, 'ghost')).result).toBeNull();
  });

  it('validates keys and values', () => {
    const table = createHashTable(8);
    expect(() => hashInsert(table, '   ', 1)).toThrow(InputError);
    expect(() => hashInsert(table, 'averylongkeyindeed', 1)).toThrow(InputError);
    expect(() => hashInsert(table, 'ok', 1.5)).toThrow(InputError);
  });

  it('reports a full open-addressed table rather than looping forever', () => {
    let table = createHashTable(2, 'linear-probing');
    table = last(hashInsert(table, 'a', 1));
    table = last(hashInsert(table, 'b', 2));
    const result = hashInsert(table, 'c', 3);
    expect(result.steps[result.steps.length - 1].operation).toBe('full');
  });
});

describe('heap', () => {
  const assertHeapProperty = (state: HeapState): void => {
    for (let i = 1; i < state.values.length; i += 1) {
      const parent = state.values[parentOf(i)];
      if (state.kind === 'min') expect(parent).toBeLessThanOrEqual(state.values[i]);
      else expect(parent).toBeGreaterThanOrEqual(state.values[i]);
    }
  };

  it.each(['min', 'max'] as const)(
    '%s-heap keeps the heap property after each insert',
    (kind: HeapKind) => {
      let state = createHeap([], kind);
      for (const value of [5, 3, 8, 1, 9, 2, 7]) {
        state = last(heapInsert(state, value));
        assertHeapProperty(state);
      }
    },
  );

  it.each(['min', 'max'] as const)(
    '%s-heap extracts values in sorted order',
    (kind: HeapKind) => {
      const values = [5, 3, 8, 1, 9, 2, 7];
      let state = createHeap([], kind);
      for (const value of values) state = last(heapInsert(state, value));
      const out: number[] = [];
      while (state.values.length > 0) {
        const result = heapExtract(state);
        state = last(result);
        out.push(state.extracted as number);
        assertHeapProperty(state);
      }
      const expected = [...values].sort((a, b) => (kind === 'min' ? a - b : b - a));
      expect(out).toEqual(expected);
    },
  );

  it('heapify turns an arbitrary array into a valid heap', () => {
    for (const kind of ['min', 'max'] as const) {
      const state = last(heapBuild(createHeap([9, 4, 7, 1, 8, 2, 6, 3], kind)));
      assertHeapProperty(state);
      expect([...state.values].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 6, 7, 8, 9]);
    }
  });

  it("heapify stays inside Floyd's O(n) bound", () => {
    // Building bottom-up does at most 2n comparisons and fewer than n swaps,
    // because the sum of all node heights in a complete tree is below n.
    // (Inserting one at a time is O(n log n) in the worst case, but on a
    // given input it can still make fewer comparisons, so that is not the
    // property to assert here.)
    const values = [9, 4, 7, 1, 8, 2, 6, 3, 11, 5, 12, 10];
    for (const kind of ['min', 'max'] as const) {
      const built = heapBuild(createHeap(values, kind));
      const stats = built.steps[built.steps.length - 1].stats;
      expect(stats.comparisons).toBeLessThanOrEqual(2 * values.length);
      expect(stats.swaps).toBeLessThan(values.length);
    }
  });

  it('inserting one at a time stays inside the O(n log n) bound', () => {
    const values = [9, 4, 7, 1, 8, 2, 6, 3, 11, 5, 12, 10];
    let state = createHeap([], 'min');
    let comparisons = 0;
    for (const value of values) {
      const result = heapInsert(state, value);
      comparisons += result.steps[result.steps.length - 1].stats.comparisons;
      state = last(result);
    }
    expect(comparisons).toBeLessThanOrEqual(
      values.length * Math.ceil(Math.log2(values.length + 1)),
    );
  });

  it('handles duplicates', () => {
    let state = createHeap([], 'min');
    for (const value of [4, 4, 4, 2, 2]) state = last(heapInsert(state, value));
    const out: number[] = [];
    while (state.values.length > 0) {
      state = last(heapExtract(state));
      out.push(state.extracted as number);
    }
    expect(out).toEqual([2, 2, 4, 4, 4]);
  });

  it('extracting from an empty heap underflows', () => {
    const result = heapExtract(createHeap([], 'min'));
    expect(result.steps[result.steps.length - 1].operation).toBe('underflow');
    expect(last(result).values).toEqual([]);
  });

  it('peek reads the root without changing the heap', () => {
    const state = createHeap([1, 4, 3], 'min');
    const after = last(heapPeek(state));
    expect(after.values).toEqual([1, 4, 3]);
    expect(heapPeek(state).summary).toBe('Root is 1.');
  });

  it('index helpers match the array layout', () => {
    expect(leftOf(0)).toBe(1);
    expect(rightOf(0)).toBe(2);
    expect(parentOf(1)).toBe(0);
    expect(parentOf(2)).toBe(0);
    expect(parentOf(leftOf(5))).toBe(5);
    expect(parentOf(rightOf(5))).toBe(5);
  });

  it('rejects oversized and non-integer inserts', () => {
    expect(() => heapInsert(createHeap([], 'min'), 1.5)).toThrow(InputError);
    const full = createHeap(Array.from({ length: 20 }, (_, i) => i), 'min');
    expect(() => heapInsert(full, 99)).toThrow(InputError);
  });
});

/** Stacks and queues share a shape, so this guards the trace contract. */
describe('operation traces', () => {
  const traces: AlgorithmResult<unknown>[] = [
    stackPush(createStack(4), 1),
    stackPop(createStack(4, [1])),
    queueEnqueue(createQueue(4), 1),
    queueDequeue(createQueue(4)),
    insertAtHead(createLinkedList([1]), 2),
    hashInsert(createHashTable(8), 'cat', 1),
    heapInsert(createHeap([1], 'min'), 0),
  ];

  it.each(traces.map((trace, i) => [i, trace] as const))(
    'trace %i records at least one described step with a line highlight',
    (_i, trace) => {
      expect(trace.steps.length).toBeGreaterThan(0);
      for (const step of trace.steps) {
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.highlightedLines?.length ?? 0).toBeGreaterThan(0);
      }
      expect(trace.timeComplexity.length).toBeGreaterThan(0);
      expect(trace.spaceComplexity.length).toBeGreaterThan(0);
    },
  );
});
