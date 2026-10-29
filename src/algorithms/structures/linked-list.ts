import { StepRecorder } from '@/engine/recorder';
import { InputError, type AlgorithmResult } from '@/engine/types';
import type { CodeSource } from '@/engine/code';
import type { ComplexityInfo } from '@/types/learning';

export interface LinkedNode {
  id: string;
  value: number;
  next: string | null;
  prev: string | null;
}

export interface LinkedListState {
  nodes: Record<string, LinkedNode>;
  head: string | null;
  tail: string | null;
  doubly: boolean;
  /** Node the traversal is currently sitting on. */
  cursor: string | null;
  /** Nodes whose pointers were just rewired. */
  changed: string[];
  /** Node being detached, drawn faded before it disappears. */
  detaching: string | null;
  /** Node matched by a search. */
  found: string | null;
}

export const MAX_NODES = 12;

let counter = 0;
const nextId = (): string => {
  counter += 1;
  return `n${counter}`;
};

export function createLinkedList(
  values: number[] = [],
  doubly = false,
): LinkedListState {
  const nodes: Record<string, LinkedNode> = {};
  let head: string | null = null;
  let tail: string | null = null;
  for (const value of values) {
    const id = nextId();
    nodes[id] = { id, value, next: null, prev: tail };
    if (tail) nodes[tail].next = id;
    else head = id;
    tail = id;
  }
  return {
    nodes,
    head,
    tail,
    doubly,
    cursor: null,
    changed: [],
    detaching: null,
    found: null,
  };
}

/** Node ids in list order, head first. Guards against a malformed cycle. */
export function listOrder(state: LinkedListState): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let current = state.head;
  while (current && !seen.has(current)) {
    seen.add(current);
    out.push(current);
    current = state.nodes[current]?.next ?? null;
  }
  return out;
}

export const listValues = (state: LinkedListState): number[] =>
  listOrder(state).map((id) => state.nodes[id].value);

const snapshot = (
  state: LinkedListState,
  overrides: Partial<LinkedListState> = {},
): LinkedListState => ({
  ...state,
  nodes: Object.fromEntries(
    Object.entries(state.nodes).map(([id, node]) => [id, { ...node }]),
  ),
  cursor: null,
  changed: [],
  detaching: null,
  found: null,
  ...overrides,
});

const requireValue = (value: number): number => {
  if (!Number.isInteger(value) || Math.abs(value) > 999) {
    throw new InputError('Enter a whole number between −999 and 999.');
  }
  return value;
};

/* ----------------------------------------------------------------- code */

const insertHeadCode: CodeSource = {
  pseudocode: `function insertAtHead(list, value):
  node = new Node(value)
  node.next = list.head
  if list.head != null:
    list.head.prev = node      // doubly linked only
  list.head = node
  if list.tail == null:
    list.tail = node`,
  typescript: `insertAtHead(value: T): void {
  const node: Node<T> = { value, next: this.head, prev: null };
  if (this.head) {
    this.head.prev = node;
  }
  this.head = node;
  this.tail ??= node;
}`,
  lineMap: { 1: [1], 2: [2], 3: [2], 4: [3], 5: [4], 6: [6], 7: [7], 8: [7] },
};

const insertTailCode: CodeSource = {
  pseudocode: `function insertAtTail(list, value):
  node = new Node(value)
  if list.tail == null:
    list.head = node
    list.tail = node
    return
  list.tail.next = node
  node.prev = list.tail        // doubly linked only
  list.tail = node`,
  typescript: `insertAtTail(value: T): void {
  const node: Node<T> = { value, next: null, prev: this.tail };
  if (!this.tail) {
    this.head = node;
    this.tail = node;
    return;
  }
  this.tail.next = node;
  this.tail = node;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [5], 6: [6], 7: [8], 8: [2], 9: [9] },
};

const insertAtCode: CodeSource = {
  pseudocode: `function insertAt(list, position, value):
  if position == 0:
    insertAtHead(list, value)
    return
  previous = list.head
  for i from 0 to position - 2:
    previous = previous.next
    if previous == null: error "position out of range"
  node = new Node(value)
  node.next = previous.next
  previous.next = node`,
  typescript: `insertAt(position: number, value: T): void {
  if (position === 0) {
    this.insertAtHead(value);
    return;
  }
  let previous = this.head;
  for (let i = 0; i < position - 1; i += 1) {
    if (!previous) throw new RangeError('position out of range');
    previous = previous.next;
  }
  if (!previous) throw new RangeError('position out of range');
  const node: Node<T> = { value, next: previous.next, prev: previous };
  previous.next = node;
}`,
  lineMap: {
    1: [1], 2: [2], 3: [3], 4: [4], 5: [6], 6: [7], 7: [9], 8: [8], 9: [12], 10: [12], 11: [13],
  },
};

const deleteAtCode: CodeSource = {
  pseudocode: `function deleteAt(list, position):
  if list.head == null: error "list is empty"
  if position == 0:
    list.head = list.head.next
    return
  previous = list.head
  for i from 0 to position - 2:
    previous = previous.next
    if previous == null: error "position out of range"
  target = previous.next
  previous.next = target.next
  free target`,
  typescript: `deleteAt(position: number): void {
  if (!this.head) throw new RangeError('list is empty');
  if (position === 0) {
    this.head = this.head.next;
    if (this.head) this.head.prev = null;
    return;
  }
  let previous = this.head;
  for (let i = 0; i < position - 1; i += 1) {
    if (!previous.next) throw new RangeError('position out of range');
    previous = previous.next;
  }
  const target = previous.next;
  if (!target) throw new RangeError('position out of range');
  previous.next = target.next;
  if (target.next) target.next.prev = previous;
}`,
  lineMap: {
    1: [1], 2: [2], 3: [3], 4: [4], 5: [7], 6: [9], 7: [10], 8: [12], 9: [11], 10: [15], 11: [17], 12: [18],
  },
};

const searchCode: CodeSource = {
  pseudocode: `function search(list, target):
  current = list.head
  index = 0
  while current != null:
    if current.value == target:
      return index
    current = current.next
    index = index + 1
  return -1`,
  typescript: `search(target: T): number {
  let current = this.head;
  let index = 0;
  while (current) {
    if (current.value === target) {
      return index;
    }
    current = current.next;
    index += 1;
  }
  return -1;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [5], 6: [6], 7: [8], 8: [9], 9: [11] },
};

/* ----------------------------------------------------------- operations */

export function insertAtHead(
  state: LinkedListState,
  rawValue: number,
): AlgorithmResult<LinkedListState> {
  const value = requireValue(rawValue);
  if (Object.keys(state.nodes).length >= MAX_NODES) {
    throw new InputError(`This visualizer caps the list at ${MAX_NODES} nodes.`);
  }
  const recorder = new StepRecorder<LinkedListState>();

  recorder.push({
    state: snapshot(state, { cursor: state.head }),
    description: `Allocate a node holding ${value}. Nothing has to shift — only pointers change.`,
    operation: 'allocate',
    highlightedLines: [2],
  });

  const id = nextId();
  const nodes = {
    ...Object.fromEntries(
      Object.entries(state.nodes).map(([key, node]) => [key, { ...node }]),
    ),
    [id]: { id, value, next: state.head, prev: null } as LinkedNode,
  };
  if (state.head) nodes[state.head].prev = id;

  recorder.count('writes');
  recorder.push({
    state: snapshot(
      { ...state, nodes, head: id, tail: state.tail ?? id },
      { changed: state.head ? [id, state.head] : [id], cursor: id },
    ),
    description: state.head
      ? `Point the new node's next at the old head, then move head to the new node.${state.doubly ? ' In a doubly linked list the old head’s prev points back at it.' : ''}`
      : 'The list was empty, so the new node becomes both head and tail.',
    operation: 'relink',
    highlightedLines: state.doubly ? [3, 4, 5, 6] : [3, 6],
  });

  if (!state.tail) {
    recorder.push({
      state: snapshot({ ...state, nodes, head: id, tail: id }, { cursor: id }),
      description: 'Set tail to the new node as well.',
      operation: 'set-tail',
      highlightedLines: [7, 8],
    });
  }

  return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
}

export function insertAtTail(
  state: LinkedListState,
  rawValue: number,
): AlgorithmResult<LinkedListState> {
  const value = requireValue(rawValue);
  if (Object.keys(state.nodes).length >= MAX_NODES) {
    throw new InputError(`This visualizer caps the list at ${MAX_NODES} nodes.`);
  }
  const recorder = new StepRecorder<LinkedListState>();

  recorder.push({
    state: snapshot(state, { cursor: state.tail }),
    description: `Allocate a node holding ${value}.${
      state.tail
        ? ' With a tail pointer this is O(1); without one you would have to walk the whole list first.'
        : ' The list is empty.'
    }`,
    operation: 'allocate',
    highlightedLines: [2],
  });

  const id = nextId();
  const nodes = {
    ...Object.fromEntries(
      Object.entries(state.nodes).map(([key, node]) => [key, { ...node }]),
    ),
    [id]: { id, value, next: null, prev: state.tail } as LinkedNode,
  };
  if (state.tail) nodes[state.tail].next = id;
  recorder.count('writes');

  recorder.push({
    state: snapshot(
      { ...state, nodes, head: state.head ?? id, tail: id },
      { changed: state.tail ? [state.tail, id] : [id], cursor: id },
    ),
    description: state.tail
      ? `Link the old tail's next to the new node and move tail forward.`
      : 'The new node becomes both head and tail.',
    operation: 'relink',
    highlightedLines: state.tail ? [7, 8, 9] : [3, 4, 5, 6],
  });

  return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
}

export function insertAtPosition(
  state: LinkedListState,
  position: number,
  rawValue: number,
): AlgorithmResult<LinkedListState> {
  const value = requireValue(rawValue);
  const order = listOrder(state);
  if (!Number.isInteger(position) || position < 0 || position > order.length) {
    throw new InputError(`Position must be between 0 and ${order.length}.`);
  }
  if (position === 0) return insertAtHead(state, value);
  if (Object.keys(state.nodes).length >= MAX_NODES) {
    throw new InputError(`This visualizer caps the list at ${MAX_NODES} nodes.`);
  }

  const recorder = new StepRecorder<LinkedListState>();
  recorder.push({
    state: snapshot(state, { cursor: state.head }),
    description: `Insert ${value} at position ${position}. There is no random access, so walk ${position - 1} link${position - 1 === 1 ? '' : 's'} from the head first.`,
    operation: 'start',
    highlightedLines: [5],
  });

  let previous = state.head as string;
  for (let i = 0; i < position - 1; i += 1) {
    previous = state.nodes[previous].next as string;
    recorder.count('reads');
    recorder.push({
      state: snapshot(state, { cursor: previous }),
      description: `Follow next to position ${i + 1} (value ${state.nodes[previous].value}).`,
      operation: 'traverse',
      highlightedLines: [6, 7, 8],
    });
  }

  const id = nextId();
  const nodes = {
    ...Object.fromEntries(
      Object.entries(state.nodes).map(([key, node]) => [key, { ...node }]),
    ),
  };
  const after = nodes[previous].next;
  nodes[id] = { id, value, next: after, prev: previous };
  nodes[previous].next = id;
  if (after) nodes[after].prev = id;
  recorder.count('writes', 2);

  recorder.push({
    state: snapshot(
      { ...state, nodes, tail: after === null ? id : state.tail },
      { changed: [previous, id], cursor: id },
    ),
    description: `Point the new node at ${after ? `the node holding ${nodes[after].value}` : 'null'}, then repoint position ${position - 1}'s next at the new node. Two writes, no shifting.`,
    operation: 'relink',
    highlightedLines: [9, 10, 11],
  });

  return recorder.finish({ timeComplexity: 'O(n)', spaceComplexity: 'O(1)' });
}

export function deleteAtPosition(
  state: LinkedListState,
  position: number,
): AlgorithmResult<LinkedListState> {
  const order = listOrder(state);
  if (order.length === 0) {
    throw new InputError('The list is empty — there is nothing to delete.');
  }
  if (!Number.isInteger(position) || position < 0 || position >= order.length) {
    throw new InputError(`Position must be between 0 and ${order.length - 1}.`);
  }

  const recorder = new StepRecorder<LinkedListState>();
  const targetId = order[position];

  recorder.push({
    state: snapshot(state, { cursor: state.head }),
    description: `Delete position ${position} (value ${state.nodes[targetId].value}).`,
    operation: 'start',
    highlightedLines: [2, 3],
  });

  const nodes = Object.fromEntries(
    Object.entries(state.nodes).map(([key, node]) => [key, { ...node }]),
  );

  if (position === 0) {
    const newHead = nodes[targetId].next;
    if (newHead) nodes[newHead].prev = null;
    recorder.push({
      state: snapshot(
        { ...state, nodes, head: newHead },
        { detaching: targetId, cursor: newHead },
      ),
      description: `Move head to ${newHead ? `the node holding ${nodes[newHead].value}` : 'null'} — the old head is now unreachable.`,
      operation: 'relink',
      highlightedLines: [3, 4, 5],
    });
    delete nodes[targetId];
    recorder.push({
      state: snapshot({
        ...state,
        nodes,
        head: newHead,
        tail: newHead === null ? null : state.tail,
      }),
      description: 'Free the detached node. Deleting the head is O(1).',
      operation: 'free',
      highlightedLines: [11],
    });
    return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
  }

  let previous = state.head as string;
  for (let i = 0; i < position - 1; i += 1) {
    previous = state.nodes[previous].next as string;
    recorder.count('reads');
    recorder.push({
      state: snapshot(state, { cursor: previous }),
      description: `Walk to position ${i + 1} (value ${state.nodes[previous].value}); deletion needs the node *before* the target.`,
      operation: 'traverse',
      highlightedLines: [6, 7, 8],
    });
  }

  const after = nodes[targetId].next;
  nodes[previous].next = after;
  if (after) nodes[after].prev = previous;
  recorder.count('writes');

  recorder.push({
    state: snapshot({ ...state, nodes }, { detaching: targetId, changed: [previous] }),
    description: `Point position ${position - 1}'s next past the target, at ${after ? `the node holding ${nodes[after].value}` : 'null'}.`,
    operation: 'relink',
    highlightedLines: [9, 10],
  });

  delete nodes[targetId];
  recorder.push({
    state: snapshot({
      ...state,
      nodes,
      tail: after === null ? previous : state.tail,
    }),
    description: `Free the detached node. The walk cost O(n); the rewiring itself was a single pointer write.`,
    operation: 'free',
    highlightedLines: [11],
  });

  return recorder.finish({ timeComplexity: 'O(n)', spaceComplexity: 'O(1)' });
}

export function searchList(
  state: LinkedListState,
  rawValue: number,
): AlgorithmResult<LinkedListState> {
  const target = requireValue(rawValue);
  const recorder = new StepRecorder<LinkedListState>();
  const order = listOrder(state);

  recorder.push({
    state: snapshot(state, { cursor: state.head }),
    description: `Search for ${target}. A linked list has no indexes, so the only option is to follow next from the head.`,
    operation: 'start',
    highlightedLines: [2, 3],
  });

  for (let i = 0; i < order.length; i += 1) {
    const id = order[i];
    const node = state.nodes[id];
    recorder.count('comparisons');
    recorder.count('reads');
    const match = node.value === target;
    recorder.push({
      state: snapshot(state, { cursor: id, found: match ? id : null }),
      description: `Position ${i} holds ${node.value} — ${match ? 'match.' : `not ${target}, follow next.`}`,
      operation: match ? 'found' : 'compare',
      highlightedLines: match ? [5, 6] : [4, 5, 7, 8],
    });
    if (match) {
      return recorder.finish({
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        summary: `Found at position ${i}.`,
      });
    }
  }

  recorder.push({
    state: snapshot(state),
    description: `Reached the end of the list without finding ${target}; the search returns −1.`,
    operation: 'not-found',
    highlightedLines: [9],
  });

  return recorder.finish({
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    summary: 'Not found.',
  });
}

export interface ListOperationSpec {
  id: string;
  label: string;
  description: string;
  fields: ('position' | 'value')[];
  code: CodeSource;
  complexity: ComplexityInfo;
}

export const LIST_OPERATIONS: ListOperationSpec[] = [
  {
    id: 'insert-head',
    label: 'Insert at head',
    description: 'Add a node at the beginning — always O(1).',
    fields: ['value'],
    code: insertHeadCode,
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
  },
  {
    id: 'insert-tail',
    label: 'Insert at tail',
    description: 'Add a node at the end, using the tail pointer.',
    fields: ['value'],
    code: insertTailCode,
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
  },
  {
    id: 'insert-at',
    label: 'Insert at position',
    description: 'Walk to a position, then splice a node in.',
    fields: ['position', 'value'],
    code: insertAtCode,
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  },
  {
    id: 'delete-at',
    label: 'Delete at position',
    description: 'Walk to the node before the target, then unlink it.',
    fields: ['position'],
    code: deleteAtCode,
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  },
  {
    id: 'search',
    label: 'Search',
    description: 'Follow next until the value appears.',
    fields: ['value'],
    code: searchCode,
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
  },
];
