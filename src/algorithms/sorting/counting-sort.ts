import { StepRecorder } from '@/engine/recorder';
import { InputError, type AlgorithmResult } from '@/engine/types';
import type { AuxView, SortAlgorithmSpec, SortState } from './types';

const PSEUDOCODE = `function countingSort(a):
  if length(a) == 0: return a
  min = min(a); max = max(a)
  count = array of (max - min + 1) zeros
  for value in a:
    count[value - min] += 1
  for i from 1 to length(count) - 1:
    count[i] += count[i - 1]
  output = array of length(a)
  for i from length(a) - 1 down to 0:
    count[a[i] - min] -= 1
    output[count[a[i] - min]] = a[i]
  return output`;

const TYPESCRIPT = `export function countingSort(input: number[]): number[] {
  if (input.length === 0) return [];
  const min = Math.min(...input);
  const max = Math.max(...input);
  const count = new Array<number>(max - min + 1).fill(0);
  for (const value of input) {
    count[value - min] += 1;
  }
  for (let i = 1; i < count.length; i += 1) {
    count[i] += count[i - 1];
  }
  const output = new Array<number>(input.length);
  for (let i = input.length - 1; i >= 0; i -= 1) {
    const slot = count[input[i] - min] - 1;
    count[input[i] - min] = slot;
    output[slot] = input[i];
  }
  return output;
}`;

/** Counting sort is only meaningful (and drawable) over a small key range. */
export const MAX_KEY_RANGE = 60;

export function countingSort(input: number[]): AlgorithmResult<SortState> {
  const recorder = new StepRecorder<SortState>();
  const values = [...input];
  const n = values.length;

  if (n === 0) {
    recorder.push({
      state: { values: [] },
      description: 'The array is empty, so counting sort returns immediately.',
      operation: 'done',
      highlightedLines: [2],
    });
    return recorder.finish({
      timeComplexity: 'O(n + k)',
      spaceComplexity: 'O(n + k)',
    });
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const keyRange = max - min + 1;
  if (keyRange > MAX_KEY_RANGE) {
    throw new InputError(
      `Counting sort allocates one bucket per distinct key. This input spans ${keyRange} keys (${min}…${max}); keep the range within ${MAX_KEY_RANGE}.`,
    );
  }

  const count = new Array<number>(keyRange).fill(0);
  const output = new Array<number | null>(n).fill(null);
  const keyLabels = Array.from({ length: keyRange }, (_, i) => String(min + i));

  const aux = (options: {
    countActive?: number[];
    outputActive?: number[];
    countLabel?: string;
  } = {}): AuxView[] => [
    {
      label: options.countLabel ?? `count (keys ${min}…${max})`,
      values: [...count],
      activeIndices: options.countActive ?? [],
      indexLabels: keyLabels,
    },
    {
      label: 'output',
      values: [...output],
      activeIndices: options.outputActive ?? [],
    },
  ];

  const snapshot = (overrides: Partial<SortState> = {}): SortState => ({
    values: [...values],
    aux: aux(),
    ...overrides,
  });

  recorder.push({
    state: snapshot(),
    description: `Start with ${n} value${n === 1 ? '' : 's'} spanning keys ${min}…${max}. Counting sort never compares two values — it counts how often each key occurs.`,
    operation: 'start',
    highlightedLines: [3, 4],
  });

  for (let i = 0; i < n; i += 1) {
    const bucket = values[i] - min;
    count[bucket] += 1;
    recorder.count('reads');
    recorder.count('writes');
    recorder.push({
      state: snapshot({ aux: aux({ countActive: [bucket] }) }),
      activeIndices: [i],
      highlightedLines: [5, 6],
      operation: 'tally',
      description: `a[${i}] = ${values[i]} → bucket ${values[i]}, now counted ${count[bucket]} time${count[bucket] === 1 ? '' : 's'}.`,
    });
  }

  recorder.push({
    state: snapshot({ aux: aux({ countLabel: 'count (tallies)' }) }),
    highlightedLines: [7],
    operation: 'tally-done',
    description:
      'Every value is tallied. Next, turn the tallies into running totals so each bucket says where its keys end in the output.',
  });

  for (let i = 1; i < count.length; i += 1) {
    count[i] += count[i - 1];
    recorder.count('writes');
    recorder.push({
      state: snapshot({
        aux: aux({ countActive: [i - 1, i], countLabel: 'count (prefix sums)' }),
      }),
      highlightedLines: [7, 8],
      operation: 'prefix-sum',
      description: `count[${keyLabels[i]}] += count[${keyLabels[i - 1]}] → ${count[i]}. Keys ≤ ${keyLabels[i]} occupy the first ${count[i]} output slots.`,
    });
  }

  recorder.push({
    state: snapshot({ aux: aux({ countLabel: 'count (prefix sums)' }) }),
    highlightedLines: [9, 10],
    operation: 'place-start',
    description:
      'Now walk the input from right to left. Going backwards is what keeps counting sort stable.',
  });

  for (let i = n - 1; i >= 0; i -= 1) {
    const bucket = values[i] - min;
    const slot = count[bucket] - 1;
    count[bucket] = slot;
    output[slot] = values[i];
    recorder.count('reads');
    recorder.count('writes', 2);
    recorder.push({
      state: snapshot({
        aux: aux({
          countActive: [bucket],
          outputActive: [slot],
          countLabel: 'count (prefix sums)',
        }),
      }),
      activeIndices: [i],
      highlightedLines: [11, 12],
      operation: 'place',
      description: `a[${i}] = ${values[i]} belongs at output[${slot}]. Decrement count[${keyLabels[bucket]}] to ${slot} so the next equal key lands just before it.`,
    });
  }

  const sorted = output.map((value) => value as number);
  recorder.push({
    state: {
      values: sorted,
      aux: aux({ countLabel: 'count (exhausted)' }),
    },
    sortedIndices: Array.from({ length: n }, (_, k) => k),
    highlightedLines: [13],
    operation: 'done',
    description: `Copy the output back: sorted in O(n + k) with ${recorder.stats.writes} writes and zero comparisons.`,
  });

  return recorder.finish({
    timeComplexity: 'O(n + k)',
    spaceComplexity: 'O(n + k)',
  });
}

export const countingSortSpec: SortAlgorithmSpec = {
  id: 'counting-sort',
  name: 'Counting Sort',
  tagline: 'Count each key, turn counts into offsets, place values directly.',
  run: countingSort,
  code: {
    pseudocode: PSEUDOCODE,
    typescript: TYPESCRIPT,
    lineMap: {
      1: [1],
      2: [2],
      3: [3, 4],
      4: [5],
      5: [6],
      6: [7],
      7: [9],
      8: [10],
      9: [12],
      10: [13],
      11: [14, 15],
      12: [16],
      13: [18],
    },
  },
  complexity: {
    best: 'O(n + k)',
    average: 'O(n + k)',
    worst: 'O(n + k)',
    space: 'O(n + k)',
    stable: true,
    inPlace: false,
  },
  learn: {
    what: 'Counting sort is not a comparison sort. For integer keys in a known range of size k it counts occurrences of each key, converts those counts into prefix sums (the end offset of each key in the output), then places each input value directly at its computed slot. That makes it O(n + k) — linear when k is O(n).',
    how: [
      'Find the minimum and maximum key so you know the range.',
      'Allocate one bucket per key and tally how often each key appears.',
      'Replace each bucket with a running total, so bucket i holds "how many values are ≤ key i".',
      'Walk the input backwards; for each value, decrement its bucket and write the value at that index.',
      'Walking backwards preserves the input order of equal keys, which makes the sort stable.',
    ],
    useCases: [
      'Sorting ages, exam scores, pixel values, or any small-range integer key.',
      'As the per-digit pass inside radix sort.',
      'Counting-based histogram work where the tally itself is the useful output.',
    ],
    pros: [
      'Linear time when the key range is comparable to n — beats the Ω(n log n) comparison bound.',
      'Stable, which is why radix sort can use it.',
      'No comparisons at all, so the comparison counter stays at zero.',
    ],
    cons: [
      'Needs O(k) memory, which is hopeless for wide ranges (sorting 32-bit ints would need 4 billion buckets).',
      'Only works on keys that map to array indices — integers, or values with an integer key.',
      'Not in place: it builds a separate output array.',
    ],
    challenge:
      'Enter 3, 1, 3, 2 and follow the two 3s. Which one lands at the higher output index, and why does walking the input backwards guarantee that?',
  },
};
