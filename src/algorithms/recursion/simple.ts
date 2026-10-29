import { StepRecorder } from '@/engine/recorder';
import { InputError, type AlgorithmResult } from '@/engine/types';
import type {
  Frame,
  RecursionAlgorithmSpec,
  RecursionExtra,
  RecursionState,
} from './types';

/** Shared bookkeeping for a call stack animation. */
export class CallStack {
  private frames: Frame[] = [];
  private returns: { label: string; result: string }[] = [];
  private nextId = 0;

  push(label: string, depth: number): Frame {
    const frame: Frame = {
      id: (this.nextId += 1),
      label,
      depth,
      status: 'active',
    };
    for (const existing of this.frames) existing.status = 'waiting';
    this.frames.push(frame);
    return frame;
  }

  pop(result: string): void {
    const frame = this.frames.pop();
    if (frame) this.returns.push({ label: frame.label, result });
    const top = this.frames[this.frames.length - 1];
    if (top) top.status = 'active';
  }

  markReturning(result: string): void {
    const top = this.frames[this.frames.length - 1];
    if (top) {
      top.status = 'returning';
      top.result = result;
    }
  }

  get depth(): number {
    return this.frames.length;
  }

  snapshot(extra: RecursionExtra, result: string | null = null): RecursionState {
    return {
      frames: this.frames.map((frame) => ({ ...frame })),
      returns: this.returns.slice(-8).map((entry) => ({ ...entry })),
      result,
      extra,
    };
  }
}

const NONE: RecursionExtra = { kind: 'none' };

const FACTORIAL_PSEUDOCODE = `function factorial(n):
  if n <= 1:
    return 1
  return n * factorial(n - 1)`;

const FACTORIAL_TYPESCRIPT = `export function factorial(n: number): number {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}`;

export function factorial(args: Record<string, number>): AlgorithmResult<RecursionState> {
  const n = Math.trunc(args.n ?? 5);
  if (n < 0 || n > 12) {
    throw new InputError('Choose n between 0 and 12 (13! overflows a double).');
  }

  const recorder = new StepRecorder<RecursionState>();
  const stack = new CallStack();

  const compute = (value: number): number => {
    stack.push(`factorial(${value})`, stack.depth + 1);
    recorder.set('depth', stack.depth);
    recorder.push({
      state: stack.snapshot(NONE),
      description: `Call factorial(${value}). Each call gets its own stack frame holding its own n.`,
      operation: 'call',
      highlightedLines: [1],
    });

    if (value <= 1) {
      recorder.count('comparisons');
      stack.markReturning('1');
      recorder.push({
        state: stack.snapshot(NONE),
        description: `${value} ≤ 1, so this is the base case: return 1 without recursing. Without a base case the recursion would never stop.`,
        operation: 'base-case',
        highlightedLines: [2, 3],
      });
      stack.pop('1');
      recorder.push({
        state: stack.snapshot(NONE),
        description: 'The frame returns 1 and is popped off the stack.',
        operation: 'return',
        highlightedLines: [3],
      });
      return 1;
    }

    recorder.count('comparisons');
    recorder.push({
      state: stack.snapshot(NONE),
      description: `${value} > 1, so this call needs factorial(${value - 1}) before it can multiply. It waits while that runs.`,
      operation: 'recurse',
      highlightedLines: [4],
    });

    const inner = compute(value - 1);
    recorder.set('depth', stack.depth);
    const product = value * inner;
    recorder.count('writes');
    stack.markReturning(String(product));
    recorder.push({
      state: stack.snapshot(NONE),
      description: `factorial(${value - 1}) returned ${inner}. Now this frame can finish: ${value} × ${inner} = ${product}.`,
      operation: 'combine',
      highlightedLines: [4],
    });
    stack.pop(String(product));
    recorder.push({
      state: stack.snapshot(NONE),
      description: `Return ${product} to the caller and pop the frame.`,
      operation: 'return',
      highlightedLines: [4],
    });
    return product;
  };

  const answer = compute(n);
  recorder.set('depth', 0);
  recorder.push({
    state: stack.snapshot(NONE, String(answer)),
    description: `${n}! = ${answer}. The stack is empty again — ${n + 1} frames were created in total, one per value from ${n} down to 0.`,
    operation: 'done',
    highlightedLines: [1],
  });

  return recorder.finish({
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n) call stack',
    summary: `${n}! = ${answer}`,
  });
}

const FIB_PSEUDOCODE = `function fib(n):
  if n <= 1:
    return n
  return fib(n - 1) + fib(n - 2)`;

const FIB_TYPESCRIPT = `export function fib(n: number): number {
  if (n <= 1) {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
}

// Memoized: O(n) instead of O(φⁿ)
export function fibMemo(n: number, memo = new Map<number, number>()): number {
  if (n <= 1) return n;
  const cached = memo.get(n);
  if (cached !== undefined) return cached;
  const value = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, value);
  return value;
}`;

export function fibonacci(args: Record<string, number>): AlgorithmResult<RecursionState> {
  const n = Math.trunc(args.n ?? 6);
  if (n < 0 || n > 9) {
    throw new InputError(
      'Choose n between 0 and 9 — naive Fibonacci makes O(φⁿ) calls, so the trace explodes past that.',
    );
  }

  const recorder = new StepRecorder<RecursionState>();
  const stack = new CallStack();
  let calls = 0;

  const compute = (value: number): number => {
    calls += 1;
    stack.push(`fib(${value})`, stack.depth + 1);
    recorder.set('depth', stack.depth);
    recorder.push({
      state: stack.snapshot(NONE),
      description: `Call fib(${value}). Call #${calls} so far.`,
      operation: 'call',
      highlightedLines: [1],
    });

    if (value <= 1) {
      recorder.count('comparisons');
      stack.markReturning(String(value));
      recorder.push({
        state: stack.snapshot(NONE),
        description: `Base case: fib(${value}) = ${value}.`,
        operation: 'base-case',
        highlightedLines: [2, 3],
      });
      stack.pop(String(value));
      return value;
    }

    recorder.count('comparisons');
    recorder.push({
      state: stack.snapshot(NONE),
      description: `fib(${value}) needs both fib(${value - 1}) and fib(${value - 2}). It evaluates the left branch first.`,
      operation: 'recurse',
      highlightedLines: [4],
    });
    const left = compute(value - 1);
    recorder.set('depth', stack.depth);
    recorder.push({
      state: stack.snapshot(NONE),
      description: `fib(${value - 1}) = ${left}. Now the right branch, fib(${value - 2}) — note this subtree may already have been computed elsewhere, which is the waste memoization removes.`,
      operation: 'recurse',
      highlightedLines: [4],
    });
    const right = compute(value - 2);
    recorder.set('depth', stack.depth);
    const sum = left + right;
    recorder.count('writes');
    stack.markReturning(String(sum));
    recorder.push({
      state: stack.snapshot(NONE),
      description: `fib(${value}) = ${left} + ${right} = ${sum}.`,
      operation: 'combine',
      highlightedLines: [4],
    });
    stack.pop(String(sum));
    return sum;
  };

  const answer = compute(n);
  recorder.set('depth', 0);
  recorder.push({
    state: stack.snapshot(NONE, String(answer)),
    description: `fib(${n}) = ${answer}, computed with ${calls} calls. Memoizing would need only ${n + 1} — every repeated subtree is recomputed from scratch here.`,
    operation: 'done',
    highlightedLines: [1],
  });

  return recorder.finish({
    timeComplexity: 'O(φⁿ) naive, O(n) memoized',
    spaceComplexity: 'O(n) call stack',
    summary: `fib(${n}) = ${answer} in ${calls} calls`,
  });
}

const BINARY_PSEUDOCODE = `function search(a, target, low, high):
  if low > high:
    return -1
  mid = floor((low + high) / 2)
  if a[mid] == target:
    return mid
  if a[mid] < target:
    return search(a, target, mid + 1, high)
  return search(a, target, low, mid - 1)`;

const BINARY_TYPESCRIPT = `export function search(
  a: number[],
  target: number,
  low = 0,
  high = a.length - 1,
): number {
  if (low > high) {
    return -1;
  }
  const mid = Math.floor((low + high) / 2);
  if (a[mid] === target) {
    return mid;
  }
  return a[mid] < target
    ? search(a, target, mid + 1, high)
    : search(a, target, low, mid - 1);
}`;

export function recursiveBinarySearch(
  args: Record<string, number>,
): AlgorithmResult<RecursionState> {
  const size = Math.trunc(args.size ?? 15);
  const target = Math.trunc(args.target ?? 7);
  if (size < 1 || size > 31) {
    throw new InputError('Choose an array size between 1 and 31.');
  }

  // A deterministic sorted array keeps the trace reproducible.
  const values = Array.from({ length: size }, (_, i) => (i + 1) * 2);
  const recorder = new StepRecorder<RecursionState>();
  const stack = new CallStack();

  const extra = (
    low: number,
    high: number,
    mid: number | null,
    found: number | null,
  ): RecursionExtra => ({
    kind: 'array',
    values: [...values],
    target,
    low,
    high,
    mid,
    found,
  });

  const search = (low: number, high: number): number => {
    stack.push(`search(${low}, ${high})`, stack.depth + 1);
    recorder.set('depth', stack.depth);
    recorder.push({
      state: stack.snapshot(extra(low, high, null, null)),
      description:
        low > high
          ? `Call search(${low}, ${high}) — the window is empty.`
          : `Call search(${low}, ${high}): ${high - low + 1} candidate${high - low === 0 ? '' : 's'} left.`,
      operation: 'call',
      highlightedLines: [1],
    });

    recorder.count('comparisons');
    if (low > high) {
      stack.markReturning('-1');
      recorder.push({
        state: stack.snapshot(extra(low, high, null, null)),
        description: `low (${low}) passed high (${high}), so ${target} is not in the array. Return −1.`,
        operation: 'base-case',
        highlightedLines: [2, 3],
      });
      stack.pop('-1');
      return -1;
    }

    const mid = Math.floor((low + high) / 2);
    recorder.count('reads');
    recorder.push({
      state: stack.snapshot(extra(low, high, mid, null)),
      description: `mid = ⌊(${low} + ${high}) / 2⌋ = ${mid}; a[${mid}] = ${values[mid]}.`,
      operation: 'probe',
      highlightedLines: [4, 5],
    });

    recorder.count('comparisons');
    if (values[mid] === target) {
      stack.markReturning(String(mid));
      recorder.push({
        state: stack.snapshot(extra(low, high, mid, mid)),
        description: `a[${mid}] equals ${target} — return index ${mid} straight up the stack.`,
        operation: 'found',
        highlightedLines: [5, 6],
      });
      stack.pop(String(mid));
      return mid;
    }

    const goRight = values[mid] < target;
    recorder.push({
      state: stack.snapshot(extra(low, high, mid, null)),
      description: `${values[mid]} ${goRight ? '<' : '>'} ${target}, so recurse into the ${goRight ? 'right' : 'left'} half. This is tail recursion — nothing happens after the recursive call.`,
      operation: goRight ? 'go-right' : 'go-left',
      highlightedLines: goRight ? [7, 8] : [9],
    });

    const answer = goRight ? search(mid + 1, high) : search(low, mid - 1);
    recorder.set('depth', stack.depth);
    stack.markReturning(String(answer));
    recorder.push({
      state: stack.snapshot(extra(low, high, mid, answer >= 0 ? answer : null)),
      description: `Pass ${answer} back up unchanged.`,
      operation: 'return',
      highlightedLines: goRight ? [8] : [9],
    });
    stack.pop(String(answer));
    return answer;
  };

  const index = search(0, values.length - 1);
  recorder.set('depth', 0);
  recorder.push({
    state: stack.snapshot(
      extra(0, values.length - 1, null, index >= 0 ? index : null),
      index >= 0 ? `index ${index}` : 'not found',
    ),
    description:
      index >= 0
        ? `Found ${target} at index ${index} using ${recorder.stats.comparisons} comparisons on ${size} values.`
        : `${target} is not in the array (it holds even numbers 2…${size * 2}).`,
    operation: 'done',
    highlightedLines: [1],
  });

  return recorder.finish({
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(log n) call stack',
    summary: index >= 0 ? `index ${index}` : 'not found',
  });
}

export const factorialSpec: RecursionAlgorithmSpec = {
  id: 'factorial',
  name: 'Factorial',
  tagline: 'The simplest recursion: one call per step, one multiply on the way back.',
  fields: [{ name: 'n', label: 'n', min: 0, max: 12 }],
  defaults: { n: 5 },
  run: factorial,
  code: {
    pseudocode: FACTORIAL_PSEUDOCODE,
    typescript: FACTORIAL_TYPESCRIPT,
    lineMap: { 1: [1], 2: [2], 3: [3], 4: [5] },
  },
  complexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(n)',
  },
  learn: {
    what: 'factorial(n) = n × factorial(n−1), with factorial(0) = factorial(1) = 1. It is the clearest illustration of how recursion works: every call pushes a frame that holds its own n and waits, the chain bottoms out at the base case, and the answers multiply together as the frames unwind.',
    how: [
      'Check the base case first: n ≤ 1 returns 1 immediately.',
      'Otherwise the call needs factorial(n − 1) before it can do anything.',
      'That pushes another frame; the current one waits.',
      'Frames keep stacking until n reaches 1.',
      'Then each frame multiplies the returned value by its own n and returns.',
      'The stack reaches depth n + 1, which is the space cost.',
    ],
    useCases: [
      'Combinatorics — permutations, combinations, binomial coefficients.',
      'Teaching recursion, stack frames and base cases.',
      'As the textbook example of a function better written as a loop.',
    ],
    pros: [
      'The code matches the mathematical definition exactly.',
      'Easy to reason about and prove correct by induction.',
    ],
    cons: [
      'O(n) stack space where a loop uses O(1).',
      'Overflows a 64-bit float past 170! and a double’s exact integers past 18!.',
      'Deep recursion risks a stack overflow in languages without tail-call elimination.',
    ],
    challenge:
      'Run factorial(5) and count the frames at maximum depth. Then step backwards from the end and watch the multiplications happen in reverse — which multiply runs first, 5 × 24 or 2 × 1?',
  },
};

export const fibonacciSpec: RecursionAlgorithmSpec = {
  id: 'fibonacci',
  name: 'Fibonacci',
  tagline: 'Two recursive calls per frame — and a lot of repeated work.',
  fields: [{ name: 'n', label: 'n', min: 0, max: 9 }],
  defaults: { n: 5 },
  run: fibonacci,
  code: {
    pseudocode: FIB_PSEUDOCODE,
    typescript: FIB_TYPESCRIPT,
    lineMap: { 1: [1], 2: [2], 3: [3], 4: [5] },
  },
  complexity: {
    best: 'O(n) memoized',
    average: 'O(φⁿ) naive',
    worst: 'O(φⁿ) naive',
    space: 'O(n)',
  },
  learn: {
    what: 'The naive recursive Fibonacci makes two calls per frame, so the call tree is exponential: computing fib(n) takes roughly φⁿ calls where φ ≈ 1.618. The damage is that whole subtrees get recomputed — fib(3) is evaluated from scratch every time it appears. Memoizing the results collapses the tree to a line and makes it O(n).',
    how: [
      'fib(0) = 0 and fib(1) = 1 are the base cases.',
      'Any other call evaluates fib(n−1) completely, then fib(n−2), then adds.',
      'The left branch is fully explored before the right one even starts.',
      'The same arguments recur across different branches, with no memory between them.',
      'A memo table (or bottom-up iteration) makes each distinct n cost one evaluation.',
    ],
    useCases: [
      'Motivating memoization and dynamic programming.',
      'Benchmarking function call overhead.',
      'Modelling anything with the "sum of the previous two" structure.',
    ],
    pros: [
      'The code is a direct transcription of the recurrence.',
      'Makes the cost of overlapping subproblems impossible to miss.',
    ],
    cons: [
      'Exponential time without memoization — fib(50) is already hopeless.',
      'O(n) stack depth.',
      'An iterative two-variable loop solves it in O(n) time and O(1) space.',
    ],
    challenge:
      'Run fib(5) and count the total calls, then fib(6) and fib(7). The counts are 15, 25, 41 — roughly ×1.6 each time. Find fib(2) in the trace and count how many separate times it is evaluated.',
  },
};

export const recursiveBinarySearchSpec: RecursionAlgorithmSpec = {
  id: 'binary-search-recursive',
  name: 'Binary Search (recursive)',
  tagline: 'One frame per halving — tail recursion a compiler could flatten.',
  fields: [
    { name: 'size', label: 'Array size', min: 1, max: 31 },
    { name: 'target', label: 'Target', min: 0, max: 64 },
  ],
  defaults: { size: 15, target: 14 },
  run: recursiveBinarySearch,
  code: {
    pseudocode: BINARY_PSEUDOCODE,
    typescript: BINARY_TYPESCRIPT,
    lineMap: { 1: [1], 2: [7], 3: [8], 4: [10], 5: [11], 6: [12], 7: [14], 8: [15], 9: [16] },
  },
  complexity: {
    best: 'O(1)',
    average: 'O(log n)',
    worst: 'O(log n)',
    space: 'O(log n)',
  },
  learn: {
    what: 'The recursive form of binary search passes the shrinking window down as arguments instead of updating variables in a loop. Each frame either answers immediately or hands the problem to exactly one child, which makes it *tail recursive*: nothing happens after the recursive call returns, so the value just passes straight back up.',
    how: [
      'The window is the pair (low, high).',
      'If low > high the window is empty — return −1.',
      'Otherwise probe the middle element.',
      'A match returns its index.',
      'Too small means recurse on (mid + 1, high); too large means (low, mid − 1).',
      'Because the call is in tail position, the stack depth is only O(log n) and a compiler could turn it into a loop.',
    ],
    useCases: [
      'Demonstrating divide and conquer in its simplest form.',
      'Languages with tail-call optimisation, where it compiles to a loop.',
      'As the base pattern for recursive searches over sorted structures.',
    ],
    pros: [
      'Reads exactly like the recurrence it implements.',
      'O(log n) frames at most.',
      'No mutable loop state to get wrong.',
    ],
    cons: [
      'Without tail-call optimisation it still costs O(log n) stack frames.',
      'Marginally slower than the iterative version because of call overhead.',
      'Needs sorted, randomly accessible data.',
    ],
    challenge:
      'The array holds the even numbers 2, 4, 6, …. Search for 14 and count the frames. Then search for 15 — an odd number that cannot be there — and find the exact frame where low passes high.',
  },
};
