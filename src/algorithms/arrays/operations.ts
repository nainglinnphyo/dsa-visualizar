import { StepRecorder } from '@/engine/recorder';
import { InputError, type AlgorithmResult } from '@/engine/types';
import type { CodeSource } from '@/engine/code';
import type { ComplexityInfo } from '@/types/learning';
import { binarySearchSpec } from '@/algorithms/searching/binary-search';
import { linearSearchSpec } from '@/algorithms/searching/linear-search';
import type { SearchState } from '@/algorithms/searching/types';

export interface ArrayState {
  values: number[];
  /** Set while a search operation is running. */
  target?: number;
  foundIndex?: number | null;
  range?: { low: number; high: number } | null;
  exhausted?: boolean;
}

export interface ArrayOperationArgs {
  index?: number;
  value?: number;
}

export type ArrayField = 'index' | 'value';

export interface ArrayOperationSpec {
  id: string;
  label: string;
  description: string;
  fields: ArrayField[];
  code: CodeSource;
  complexity: ComplexityInfo;
  run: (
    state: ArrayState,
    args: ArrayOperationArgs,
  ) => AlgorithmResult<ArrayState>;
}

export const MAX_ARRAY_LENGTH = 24;

const requireIndex = (
  args: ArrayOperationArgs,
  upperBound: number,
  inclusive = false,
): number => {
  const index = args.index;
  if (index === undefined || !Number.isInteger(index)) {
    throw new InputError('Enter a whole-number index.');
  }
  const max = inclusive ? upperBound : upperBound - 1;
  if (index < 0 || index > max) {
    if (upperBound === 0) {
      throw new InputError('The array is empty, so there is no valid index.');
    }
    throw new InputError(`Index must be between 0 and ${max}.`);
  }
  return index;
};

const requireValue = (args: ArrayOperationArgs): number => {
  const value = args.value;
  if (value === undefined || !Number.isFinite(value)) {
    throw new InputError('Enter a numeric value.');
  }
  if (!Number.isInteger(value) || Math.abs(value) > 999) {
    throw new InputError('Values must be whole numbers between −999 and 999.');
  }
  return value;
};

/* --------------------------------------------------------------- access */

const accessCode: CodeSource = {
  pseudocode: `function access(a, i):
  if i < 0 or i >= length(a):
    error "index out of bounds"
  address = base(a) + i * sizeof(element)
  return value at address`,
  typescript: `export function access(a: number[], i: number): number {
  if (i < 0 || i >= a.length) {
    throw new RangeError('index out of bounds');
  }
  // One multiply and one add — no scanning involved.
  return a[i];
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [6], 5: [6] },
};

function accessOperation(
  state: ArrayState,
  args: ArrayOperationArgs,
): AlgorithmResult<ArrayState> {
  const recorder = new StepRecorder<ArrayState>();
  const index = requireIndex(args, state.values.length);
  const values = [...state.values];

  recorder.push({
    state: { values: [...values] },
    description: `Read a[${index}]. The array is one contiguous block, so the address is base + ${index} × element size.`,
    operation: 'bounds-check',
    highlightedLines: [2, 3, 4],
    activeIndices: [index],
  });
  recorder.count('reads');
  recorder.push({
    state: { values: [...values] },
    description: `a[${index}] = ${values[index]}. No elements were scanned — index access is a single step regardless of array size.`,
    operation: 'read',
    highlightedLines: [5],
    activeIndices: [index],
    sortedIndices: [index],
  });

  return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
}

/* --------------------------------------------------------------- update */

const updateCode: CodeSource = {
  pseudocode: `function update(a, i, value):
  if i < 0 or i >= length(a):
    error "index out of bounds"
  a[i] = value
  return a`,
  typescript: `export function update(a: number[], i: number, value: number): number[] {
  if (i < 0 || i >= a.length) {
    throw new RangeError('index out of bounds');
  }
  a[i] = value;
  return a;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [5], 5: [6] },
};

function updateOperation(
  state: ArrayState,
  args: ArrayOperationArgs,
): AlgorithmResult<ArrayState> {
  const recorder = new StepRecorder<ArrayState>();
  const index = requireIndex(args, state.values.length);
  const value = requireValue(args);
  const values = [...state.values];
  const previous = values[index];

  recorder.push({
    state: { values: [...values] },
    description: `Overwrite a[${index}], which currently holds ${previous}.`,
    operation: 'bounds-check',
    highlightedLines: [2, 3],
    activeIndices: [index],
  });
  values[index] = value;
  recorder.count('writes');
  recorder.push({
    state: { values: [...values] },
    description: `a[${index}] is now ${value} (was ${previous}). Nothing else moved.`,
    operation: 'write',
    highlightedLines: [4, 5],
    swappedIndices: [index],
  });

  return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
}

/* --------------------------------------------------------------- insert */

const insertCode: CodeSource = {
  pseudocode: `function insert(a, i, value):
  if i < 0 or i > length(a):
    error "index out of bounds"
  for j from length(a) down to i + 1:
    a[j] = a[j - 1]
  a[i] = value
  return a`,
  typescript: `export function insert(a: number[], i: number, value: number): number[] {
  if (i < 0 || i > a.length) {
    throw new RangeError('index out of bounds');
  }
  for (let j = a.length; j > i; j -= 1) {
    a[j] = a[j - 1];
  }
  a[i] = value;
  return a;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [5], 5: [6], 6: [8], 7: [9] },
};

function insertOperation(
  state: ArrayState,
  args: ArrayOperationArgs,
): AlgorithmResult<ArrayState> {
  const recorder = new StepRecorder<ArrayState>();
  if (state.values.length >= MAX_ARRAY_LENGTH) {
    throw new InputError(
      `This visualizer caps the array at ${MAX_ARRAY_LENGTH} elements. Delete one first.`,
    );
  }
  const index = requireIndex(args, state.values.length, true);
  const value = requireValue(args);
  const values = [...state.values];

  recorder.push({
    state: { values: [...values] },
    description: `Insert ${value} at index ${index}. Everything from index ${index} onwards has to shift one slot right first.`,
    operation: 'bounds-check',
    highlightedLines: [2, 3],
    activeIndices: [index],
  });

  values.push(values[values.length - 1] ?? value);
  for (let j = values.length - 1; j > index; j -= 1) {
    values[j] = values[j - 1];
    recorder.count('writes');
    recorder.push({
      state: { values: [...values] },
      description: `Shift a[${j - 1}] = ${values[j]} right into a[${j}].`,
      operation: 'shift',
      highlightedLines: [4, 5],
      swappedIndices: [j],
      activeIndices: [j - 1],
    });
  }

  values[index] = value;
  recorder.count('writes');
  recorder.push({
    state: { values: [...values] },
    description: `Write ${value} into the gap at index ${index}. ${
      values.length - index - 1
    } element${values.length - index - 1 === 1 ? '' : 's'} moved, which is why insertion is O(n).`,
    operation: 'write',
    highlightedLines: [6, 7],
    swappedIndices: [index],
  });

  return recorder.finish({ timeComplexity: 'O(n)', spaceComplexity: 'O(1)' });
}

/* --------------------------------------------------------------- delete */

const deleteCode: CodeSource = {
  pseudocode: `function remove(a, i):
  if i < 0 or i >= length(a):
    error "index out of bounds"
  for j from i to length(a) - 2:
    a[j] = a[j + 1]
  shrink a by one
  return a`,
  typescript: `export function remove(a: number[], i: number): number[] {
  if (i < 0 || i >= a.length) {
    throw new RangeError('index out of bounds');
  }
  for (let j = i; j < a.length - 1; j += 1) {
    a[j] = a[j + 1];
  }
  a.length -= 1;
  return a;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [5], 5: [6], 6: [8], 7: [9] },
};

function deleteOperation(
  state: ArrayState,
  args: ArrayOperationArgs,
): AlgorithmResult<ArrayState> {
  const recorder = new StepRecorder<ArrayState>();
  const index = requireIndex(args, state.values.length);
  const values = [...state.values];
  const removed = values[index];

  recorder.push({
    state: { values: [...values] },
    description: `Delete a[${index}] = ${removed}. The hole has to be closed by shifting every later element left.`,
    operation: 'bounds-check',
    highlightedLines: [2, 3],
    activeIndices: [index],
  });

  for (let j = index; j < values.length - 1; j += 1) {
    values[j] = values[j + 1];
    recorder.count('writes');
    recorder.push({
      state: { values: [...values] },
      description: `Shift a[${j + 1}] = ${values[j]} left into a[${j}].`,
      operation: 'shift',
      highlightedLines: [4, 5],
      swappedIndices: [j],
      activeIndices: [j + 1],
    });
  }

  values.pop();
  recorder.push({
    state: { values: [...values] },
    description: `Shrink the array to ${values.length} element${values.length === 1 ? '' : 's'}. ${removed} is gone.`,
    operation: 'shrink',
    highlightedLines: [6, 7],
  });

  return recorder.finish({ timeComplexity: 'O(n)', spaceComplexity: 'O(1)' });
}

/* --------------------------------------------------------------- search */

const fromSearch = (
  result: AlgorithmResult<SearchState>,
): AlgorithmResult<ArrayState> => ({
  ...result,
  steps: result.steps.map((step) => ({
    ...step,
    state: {
      values: step.state.values,
      target: step.state.target,
      foundIndex: step.state.foundIndex,
      range: step.state.range,
      exhausted: step.state.exhausted,
    },
  })),
});

function searchOperation(
  spec: typeof linearSearchSpec,
): ArrayOperationSpec['run'] {
  return (state, args) => {
    const value = requireValue(args);
    return fromSearch(spec.run({ values: state.values, target: value }));
  };
}

/* ---------------------------------------------------------------- specs */

export const ARRAY_OPERATIONS: ArrayOperationSpec[] = [
  {
    id: 'access',
    label: 'Access',
    description: 'Read the value stored at an index.',
    fields: ['index'],
    code: accessCode,
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
    run: accessOperation,
  },
  {
    id: 'update',
    label: 'Update',
    description: 'Overwrite the value stored at an index.',
    fields: ['index', 'value'],
    code: updateCode,
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
    run: updateOperation,
  },
  {
    id: 'insert',
    label: 'Insert',
    description: 'Insert a value at an index, shifting the tail right.',
    fields: ['index', 'value'],
    code: insertCode,
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
    run: insertOperation,
  },
  {
    id: 'delete',
    label: 'Delete',
    description: 'Remove the value at an index, shifting the tail left.',
    fields: ['index'],
    code: deleteCode,
    complexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)', space: 'O(1)' },
    run: deleteOperation,
  },
  {
    id: 'linear-search',
    label: 'Linear search',
    description: 'Scan every cell until the value appears.',
    fields: ['value'],
    code: linearSearchSpec.code,
    complexity: linearSearchSpec.complexity,
    run: searchOperation(linearSearchSpec),
  },
  {
    id: 'binary-search',
    label: 'Binary search',
    description: 'Halve the window each comparison — needs sorted values.',
    fields: ['value'],
    code: binarySearchSpec.code,
    complexity: binarySearchSpec.complexity,
    run: searchOperation(binarySearchSpec),
  },
];

export const arrayOperationById = (id: string): ArrayOperationSpec | undefined =>
  ARRAY_OPERATIONS.find((operation) => operation.id === id);
