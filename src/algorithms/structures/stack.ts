import { StepRecorder } from '@/engine/recorder';
import { InputError, type AlgorithmResult } from '@/engine/types';
import type { CodeSource } from '@/engine/code';
import type { ComplexityInfo } from '@/types/learning';

export interface StackState {
  items: number[];
  capacity: number;
  /** Set when an operation could not complete. */
  status: 'overflow' | 'underflow' | null;
  /** Value returned by the last pop/peek. */
  result: number | null;
}

export const createStack = (capacity = 8, items: number[] = []): StackState => ({
  items,
  capacity,
  status: null,
  result: null,
});

const pushCode: CodeSource = {
  pseudocode: `function push(stack, value):
  if stack.top == capacity - 1:
    report "stack overflow"
    return
  stack.top = stack.top + 1
  stack.items[stack.top] = value`,
  typescript: `push(value: T): void {
  if (this.top === this.capacity - 1) {
    throw new Error('stack overflow');
  }
  this.top += 1;
  this.items[this.top] = value;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [3], 5: [5], 6: [6] },
};

const popCode: CodeSource = {
  pseudocode: `function pop(stack):
  if stack.top == -1:
    report "stack underflow"
    return
  value = stack.items[stack.top]
  stack.top = stack.top - 1
  return value`,
  typescript: `pop(): T {
  if (this.top === -1) {
    throw new Error('stack underflow');
  }
  const value = this.items[this.top];
  this.top -= 1;
  return value;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [3], 5: [5], 6: [6], 7: [7] },
};

const peekCode: CodeSource = {
  pseudocode: `function peek(stack):
  if stack.top == -1:
    report "stack underflow"
    return
  return stack.items[stack.top]`,
  typescript: `peek(): T {
  if (this.top === -1) {
    throw new Error('stack underflow');
  }
  return this.items[this.top];
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [3], 5: [5] },
};

const topIndex = (state: StackState): number => state.items.length - 1;

export function stackPush(
  state: StackState,
  value: number,
): AlgorithmResult<StackState> {
  if (!Number.isInteger(value) || Math.abs(value) > 999) {
    throw new InputError('Push a whole number between −999 and 999.');
  }
  const recorder = new StepRecorder<StackState>();
  const items = [...state.items];

  recorder.push({
    state: { ...state, items: [...items], status: null, result: null },
    description: `Push ${value}. Check whether the stack is full: top = ${topIndex(state)}, capacity = ${state.capacity}.`,
    operation: 'check',
    highlightedLines: [2],
    activeIndices: [topIndex(state)],
  });

  if (items.length >= state.capacity) {
    recorder.push({
      state: { ...state, items: [...items], status: 'overflow', result: null },
      description: `Stack overflow: all ${state.capacity} slots are in use, so ${value} cannot be pushed. A fixed-capacity stack must reject the push (a growable one would reallocate here).`,
      operation: 'overflow',
      highlightedLines: [3, 4],
    });
    return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
  }

  items.push(value);
  recorder.count('writes');
  recorder.push({
    state: { ...state, items: [...items], status: null, result: null },
    description: `Increment top to ${items.length - 1} and store ${value} there. Push touches nothing else, so it is O(1).`,
    operation: 'push',
    highlightedLines: [5, 6],
    swappedIndices: [items.length - 1],
  });

  return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
}

export function stackPop(state: StackState): AlgorithmResult<StackState> {
  const recorder = new StepRecorder<StackState>();
  const items = [...state.items];

  recorder.push({
    state: { ...state, items: [...items], status: null, result: null },
    description: `Pop. Check whether the stack is empty: top = ${topIndex(state)}.`,
    operation: 'check',
    highlightedLines: [2],
    activeIndices: items.length ? [items.length - 1] : [],
  });

  if (items.length === 0) {
    recorder.push({
      state: { ...state, items: [], status: 'underflow', result: null },
      description:
        'Stack underflow: there is nothing to pop. Real implementations either throw or return a sentinel here.',
      operation: 'underflow',
      highlightedLines: [3, 4],
    });
    return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
  }

  const value = items[items.length - 1];
  recorder.count('reads');
  recorder.push({
    state: { ...state, items: [...items], status: null, result: value },
    description: `Read the top element, ${value}, at index ${items.length - 1}.`,
    operation: 'read',
    highlightedLines: [5],
    comparedIndices: [items.length - 1],
  });

  items.pop();
  recorder.push({
    state: { ...state, items: [...items], status: null, result: value },
    description: `Decrement top to ${items.length - 1} and return ${value}. Last in, first out — ${value} was the most recent push.`,
    operation: 'pop',
    highlightedLines: [6, 7],
  });

  return recorder.finish({
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    summary: `Popped ${value}.`,
  });
}

export function stackPeek(state: StackState): AlgorithmResult<StackState> {
  const recorder = new StepRecorder<StackState>();
  const items = [...state.items];

  recorder.push({
    state: { ...state, items: [...items], status: null, result: null },
    description: `Peek. Check whether the stack is empty: top = ${topIndex(state)}.`,
    operation: 'check',
    highlightedLines: [2],
  });

  if (items.length === 0) {
    recorder.push({
      state: { ...state, items: [], status: 'underflow', result: null },
      description: 'Nothing to peek at — the stack is empty.',
      operation: 'underflow',
      highlightedLines: [3, 4],
    });
    return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
  }

  const value = items[items.length - 1];
  recorder.count('reads');
  recorder.push({
    state: { ...state, items: [...items], status: null, result: value },
    description: `The top element is ${value}. Peek reads it without changing top, so the stack is unchanged.`,
    operation: 'peek',
    highlightedLines: [5],
    sortedIndices: [items.length - 1],
  });

  return recorder.finish({
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    summary: `Top is ${value}.`,
  });
}

export interface StackOperationSpec {
  id: string;
  label: string;
  description: string;
  needsValue: boolean;
  code: CodeSource;
  complexity: ComplexityInfo;
}

export const STACK_OPERATIONS: StackOperationSpec[] = [
  {
    id: 'push',
    label: 'Push',
    description: 'Add a value on top of the stack.',
    needsValue: true,
    code: pushCode,
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
  },
  {
    id: 'pop',
    label: 'Pop',
    description: 'Remove and return the top value.',
    needsValue: false,
    code: popCode,
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
  },
  {
    id: 'peek',
    label: 'Peek',
    description: 'Read the top value without removing it.',
    needsValue: false,
    code: peekCode,
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
  },
];
