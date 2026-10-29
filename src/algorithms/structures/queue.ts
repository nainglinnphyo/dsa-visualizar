import { StepRecorder } from '@/engine/recorder';
import { InputError, type AlgorithmResult } from '@/engine/types';
import type { CodeSource } from '@/engine/code';
import type { ComplexityInfo } from '@/types/learning';

export interface QueueState {
  /** Fixed-size backing array; null means the slot is free. */
  slots: (number | null)[];
  front: number;
  rear: number;
  size: number;
  capacity: number;
  circular: boolean;
  status: 'overflow' | 'underflow' | null;
  result: number | null;
}

export const createQueue = (capacity = 8, circular = false): QueueState => ({
  slots: new Array<number | null>(capacity).fill(null),
  front: 0,
  rear: -1,
  size: 0,
  capacity,
  circular,
  status: null,
  result: null,
});

const linearEnqueueCode: CodeSource = {
  pseudocode: `function enqueue(q, value):
  if q.rear == capacity - 1:
    report "queue overflow"
    return
  q.rear = q.rear + 1
  q.slots[q.rear] = value
  q.size = q.size + 1`,
  typescript: `enqueue(value: T): void {
  if (this.rear === this.capacity - 1) {
    throw new Error('queue overflow');
  }
  this.rear += 1;
  this.slots[this.rear] = value;
  this.size += 1;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [3], 5: [5], 6: [6], 7: [7] },
};

const circularEnqueueCode: CodeSource = {
  pseudocode: `function enqueue(q, value):
  if q.size == capacity:
    report "queue overflow"
    return
  q.rear = (q.rear + 1) mod capacity
  q.slots[q.rear] = value
  q.size = q.size + 1`,
  typescript: `enqueue(value: T): void {
  if (this.size === this.capacity) {
    throw new Error('queue overflow');
  }
  this.rear = (this.rear + 1) % this.capacity;
  this.slots[this.rear] = value;
  this.size += 1;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [3], 5: [5], 6: [6], 7: [7] },
};

const linearDequeueCode: CodeSource = {
  pseudocode: `function dequeue(q):
  if q.size == 0:
    report "queue underflow"
    return
  value = q.slots[q.front]
  q.slots[q.front] = empty
  q.front = q.front + 1
  q.size = q.size - 1
  return value`,
  typescript: `dequeue(): T {
  if (this.size === 0) {
    throw new Error('queue underflow');
  }
  const value = this.slots[this.front]!;
  this.slots[this.front] = null;
  this.front += 1;
  this.size -= 1;
  return value;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [3], 5: [5], 6: [6], 7: [7], 8: [8], 9: [9] },
};

const circularDequeueCode: CodeSource = {
  pseudocode: `function dequeue(q):
  if q.size == 0:
    report "queue underflow"
    return
  value = q.slots[q.front]
  q.slots[q.front] = empty
  q.front = (q.front + 1) mod capacity
  q.size = q.size - 1
  return value`,
  typescript: `dequeue(): T {
  if (this.size === 0) {
    throw new Error('queue underflow');
  }
  const value = this.slots[this.front]!;
  this.slots[this.front] = null;
  this.front = (this.front + 1) % this.capacity;
  this.size -= 1;
  return value;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [3], 5: [5], 6: [6], 7: [7], 8: [8], 9: [9] },
};

const peekCode: CodeSource = {
  pseudocode: `function peek(q):
  if q.size == 0:
    report "queue underflow"
    return
  return q.slots[q.front]`,
  typescript: `peek(): T {
  if (this.size === 0) {
    throw new Error('queue underflow');
  }
  return this.slots[this.front]!;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [3], 5: [5] },
};

const clone = (state: QueueState, overrides: Partial<QueueState> = {}): QueueState => ({
  ...state,
  slots: [...state.slots],
  status: null,
  result: null,
  ...overrides,
});

export function queueEnqueue(
  state: QueueState,
  value: number,
): AlgorithmResult<QueueState> {
  if (!Number.isInteger(value) || Math.abs(value) > 999) {
    throw new InputError('Enqueue a whole number between −999 and 999.');
  }
  const recorder = new StepRecorder<QueueState>();
  const full = state.circular
    ? state.size === state.capacity
    : state.rear === state.capacity - 1;

  recorder.push({
    state: clone(state),
    description: state.circular
      ? `Enqueue ${value}. A circular queue is full when size (${state.size}) equals capacity (${state.capacity}).`
      : `Enqueue ${value}. A linear queue is full when rear reaches the last index (rear = ${state.rear}, capacity − 1 = ${state.capacity - 1}).`,
    operation: 'check',
    highlightedLines: [2],
    activeIndices: state.rear >= 0 ? [state.rear] : [],
  });

  if (full) {
    recorder.push({
      state: clone(state, { status: 'overflow' }),
      description: state.circular
        ? `Queue overflow: all ${state.capacity} slots hold a value.`
        : `Queue overflow: rear is at the last index. Note that ${state.front} slot${state.front === 1 ? ' is' : 's are'} free at the front — a linear queue cannot reuse them, which is exactly the problem a circular queue solves.`,
      operation: 'overflow',
      highlightedLines: [3, 4],
    });
    return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
  }

  const rear = state.circular
    ? (state.rear + 1) % state.capacity
    : state.rear + 1;
  const slots = [...state.slots];
  slots[rear] = value;
  recorder.count('writes');

  recorder.push({
    state: clone(state, { slots, rear, size: state.size + 1 }),
    description: state.circular
      ? `rear = (${state.rear} + 1) mod ${state.capacity} = ${rear}; store ${value} there. Size is now ${state.size + 1}.`
      : `rear becomes ${rear}; store ${value} there. Size is now ${state.size + 1}.`,
    operation: 'enqueue',
    highlightedLines: [5, 6, 7],
    swappedIndices: [rear],
  });

  return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
}

export function queueDequeue(state: QueueState): AlgorithmResult<QueueState> {
  const recorder = new StepRecorder<QueueState>();

  recorder.push({
    state: clone(state),
    description: `Dequeue. The queue is empty when size is 0 (size = ${state.size}).`,
    operation: 'check',
    highlightedLines: [2],
    activeIndices: state.size > 0 ? [state.front] : [],
  });

  if (state.size === 0) {
    recorder.push({
      state: clone(state, { status: 'underflow' }),
      description: 'Queue underflow: there is nothing to dequeue.',
      operation: 'underflow',
      highlightedLines: [3, 4],
    });
    return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
  }

  const value = state.slots[state.front] as number;
  recorder.count('reads');
  recorder.push({
    state: clone(state, { result: value }),
    description: `Read the front element, ${value}, at index ${state.front}.`,
    operation: 'read',
    highlightedLines: [5],
    comparedIndices: [state.front],
  });

  const slots = [...state.slots];
  slots[state.front] = null;
  const front = state.circular
    ? (state.front + 1) % state.capacity
    : state.front + 1;

  recorder.push({
    state: clone(state, {
      slots,
      front,
      size: state.size - 1,
      result: value,
    }),
    description: state.circular
      ? `Free the slot and move front to (${state.front} + 1) mod ${state.capacity} = ${front}. Returned ${value} — first in, first out.`
      : `Free the slot and move front to ${front}. Returned ${value} — first in, first out.`,
    operation: 'dequeue',
    highlightedLines: [6, 7, 8, 9],
    activeIndices: [front],
  });

  return recorder.finish({
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    summary: `Dequeued ${value}.`,
  });
}

export function queuePeek(state: QueueState): AlgorithmResult<QueueState> {
  const recorder = new StepRecorder<QueueState>();

  recorder.push({
    state: clone(state),
    description: `Peek at the front without removing it (size = ${state.size}).`,
    operation: 'check',
    highlightedLines: [2],
  });

  if (state.size === 0) {
    recorder.push({
      state: clone(state, { status: 'underflow' }),
      description: 'Nothing to peek at — the queue is empty.',
      operation: 'underflow',
      highlightedLines: [3, 4],
    });
    return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
  }

  const value = state.slots[state.front] as number;
  recorder.count('reads');
  recorder.push({
    state: clone(state, { result: value }),
    description: `The front element is ${value}, at index ${state.front}. The queue is unchanged.`,
    operation: 'peek',
    highlightedLines: [5],
    sortedIndices: [state.front],
  });

  return recorder.finish({
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    summary: `Front is ${value}.`,
  });
}

export interface QueueOperationSpec {
  id: string;
  label: string;
  description: string;
  needsValue: boolean;
  code: (circular: boolean) => CodeSource;
  complexity: ComplexityInfo;
}

export const QUEUE_OPERATIONS: QueueOperationSpec[] = [
  {
    id: 'enqueue',
    label: 'Enqueue',
    description: 'Add a value at the rear of the queue.',
    needsValue: true,
    code: (circular) => (circular ? circularEnqueueCode : linearEnqueueCode),
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
  },
  {
    id: 'dequeue',
    label: 'Dequeue',
    description: 'Remove and return the value at the front.',
    needsValue: false,
    code: (circular) => (circular ? circularDequeueCode : linearDequeueCode),
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
  },
  {
    id: 'peek',
    label: 'Peek',
    description: 'Read the front value without removing it.',
    needsValue: false,
    code: () => peekCode,
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
  },
];
