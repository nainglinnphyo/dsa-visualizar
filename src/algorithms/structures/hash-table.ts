import { StepRecorder } from '@/engine/recorder';
import { InputError, type AlgorithmResult } from '@/engine/types';
import type { CodeSource } from '@/engine/code';
import type { ComplexityInfo } from '@/types/learning';

export type Strategy = 'chaining' | 'linear-probing';

export interface HashEntry {
  key: string;
  value: number;
}

export type HashSlot =
  | { kind: 'empty' }
  | { kind: 'tombstone' }
  | { kind: 'entries'; entries: HashEntry[] };

export interface HashStep {
  char: string;
  code: number;
  accumulator: number;
}

export interface HashTableState {
  strategy: Strategy;
  capacity: number;
  buckets: HashSlot[];
  count: number;
  /** Per-character breakdown of the hash currently being computed. */
  hashTrace: { key: string; steps: HashStep[]; hash: number } | null;
  /** Bucket indices to highlight. */
  highlight: number[];
  /** Probe sequence walked so far, for open addressing. */
  probes: number[];
  result: string | null;
}

export const MULTIPLIER = 31;

export function createHashTable(
  capacity = 8,
  strategy: Strategy = 'chaining',
): HashTableState {
  return {
    strategy,
    capacity,
    buckets: Array.from({ length: capacity }, () => ({ kind: 'empty' as const })),
    count: 0,
    hashTrace: null,
    highlight: [],
    probes: [],
    result: null,
  };
}

/** `h = (h * 31 + charCode) mod capacity`, recorded character by character. */
export function hashKey(
  key: string,
  capacity: number,
): { steps: HashStep[]; hash: number } {
  let accumulator = 0;
  const steps: HashStep[] = [];
  for (const char of key) {
    const code = char.codePointAt(0) ?? 0;
    accumulator = (accumulator * MULTIPLIER + code) % capacity;
    steps.push({ char, code, accumulator });
  }
  return { steps, hash: accumulator };
}

const cloneBuckets = (buckets: HashSlot[]): HashSlot[] =>
  buckets.map((slot) =>
    slot.kind === 'entries'
      ? { kind: 'entries' as const, entries: slot.entries.map((e) => ({ ...e })) }
      : { ...slot },
  );

const snapshot = (
  state: HashTableState,
  overrides: Partial<HashTableState> = {},
): HashTableState => ({
  ...state,
  buckets: cloneBuckets(state.buckets),
  hashTrace: null,
  highlight: [],
  probes: [],
  result: null,
  ...overrides,
});

const validateKey = (key: string): string => {
  const trimmed = key.trim();
  if (trimmed.length === 0) throw new InputError('Enter a key.');
  if (trimmed.length > 12) throw new InputError('Keys are capped at 12 characters.');
  return trimmed;
};

const validateValue = (value: number): number => {
  if (!Number.isInteger(value) || Math.abs(value) > 999) {
    throw new InputError('Values must be whole numbers between −999 and 999.');
  }
  return value;
};

/** Records the per-character hash computation as its own steps. */
function recordHash(
  recorder: StepRecorder<HashTableState>,
  state: HashTableState,
  key: string,
): number {
  const { steps, hash } = hashKey(key, state.capacity);
  recorder.push({
    state: snapshot(state, { hashTrace: { key, steps: [], hash } }),
    description: `Hash "${key}" with h = (h × ${MULTIPLIER} + charCode) mod ${state.capacity}, starting from h = 0.`,
    operation: 'hash',
    highlightedLines: [2],
  });
  for (let i = 0; i < steps.length; i += 1) {
    const current = steps[i];
    const previous = i === 0 ? 0 : steps[i - 1].accumulator;
    recorder.push({
      state: snapshot(state, {
        hashTrace: { key, steps: steps.slice(0, i + 1), hash },
      }),
      description: `'${current.char}' has code ${current.code}: h = (${previous} × ${MULTIPLIER} + ${current.code}) mod ${state.capacity} = ${current.accumulator}.`,
      operation: 'hash-char',
      highlightedLines: [3, 4],
    });
  }
  recorder.push({
    state: snapshot(state, {
      hashTrace: { key, steps, hash },
      highlight: [hash],
    }),
    description: `"${key}" hashes to bucket ${hash}. The hash itself is O(k) in the key length, not in the number of entries.`,
    operation: 'bucket',
    highlightedLines: [5],
  });
  return hash;
}

/* ----------------------------------------------------------------- code */

const chainingInsertCode: CodeSource = {
  pseudocode: `function insert(table, key, value):
  h = 0
  for each char in key:
    h = (h * 31 + code(char)) mod capacity
  bucket = table.buckets[h]
  for entry in bucket:
    if entry.key == key:
      entry.value = value
      return
  append (key, value) to bucket`,
  typescript: `insert(key: string, value: V): void {
  let h = 0;
  for (const char of key) {
    h = (h * 31 + char.codePointAt(0)!) % this.capacity;
  }
  const bucket = this.buckets[h];
  for (const entry of bucket) {
    if (entry.key === key) {
      entry.value = value;
      return;
    }
  }
  bucket.push({ key, value });
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [6], 6: [7], 7: [8], 8: [9], 9: [10], 10: [13] },
};

const probingInsertCode: CodeSource = {
  pseudocode: `function insert(table, key, value):
  h = 0
  for each char in key:
    h = (h * 31 + code(char)) mod capacity
  for probe from 0 to capacity - 1:
    i = (h + probe) mod capacity
    if slot i is empty or holds key:
      table.slots[i] = (key, value)
      return
  report "table is full"`,
  typescript: `insert(key: string, value: V): void {
  let h = 0;
  for (const char of key) {
    h = (h * 31 + char.codePointAt(0)!) % this.capacity;
  }
  for (let probe = 0; probe < this.capacity; probe += 1) {
    const i = (h + probe) % this.capacity;
    const slot = this.slots[i];
    if (!slot || slot.key === key) {
      this.slots[i] = { key, value };
      return;
    }
  }
  throw new Error('table is full');
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [6], 6: [7], 7: [9], 8: [10], 9: [11], 10: [14] },
};

const chainingSearchCode: CodeSource = {
  pseudocode: `function search(table, key):
  h = 0
  for each char in key:
    h = (h * 31 + code(char)) mod capacity
  for entry in table.buckets[h]:
    if entry.key == key:
      return entry.value
  return not found`,
  typescript: `search(key: string): V | undefined {
  let h = 0;
  for (const char of key) {
    h = (h * 31 + char.codePointAt(0)!) % this.capacity;
  }
  for (const entry of this.buckets[h]) {
    if (entry.key === key) {
      return entry.value;
    }
  }
  return undefined;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [6], 6: [7], 7: [8], 8: [11] },
};

const probingSearchCode: CodeSource = {
  pseudocode: `function search(table, key):
  h = 0
  for each char in key:
    h = (h * 31 + code(char)) mod capacity
  for probe from 0 to capacity - 1:
    i = (h + probe) mod capacity
    if slot i is empty: return not found
    if slot i holds key: return its value
  return not found`,
  typescript: `search(key: string): V | undefined {
  let h = 0;
  for (const char of key) {
    h = (h * 31 + char.codePointAt(0)!) % this.capacity;
  }
  for (let probe = 0; probe < this.capacity; probe += 1) {
    const slot = this.slots[(h + probe) % this.capacity];
    if (slot === EMPTY) return undefined;
    if (slot !== TOMBSTONE && slot.key === key) return slot.value;
  }
  return undefined;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [6], 6: [7], 7: [8], 8: [9], 9: [11] },
};

const deleteCode: CodeSource = {
  pseudocode: `function remove(table, key):
  h = hash(key)
  locate key starting at bucket h
  if not found:
    return false
  remove the entry
  // open addressing leaves a tombstone so
  // later probes do not stop early
  return true`,
  typescript: `remove(key: string): boolean {
  const h = this.hash(key);
  const found = this.locate(h, key);
  if (found === -1) {
    return false;
  }
  this.slots[found] = this.chaining ? EMPTY : TOMBSTONE;
  this.count -= 1;
  return true;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [4], 5: [5], 6: [7], 7: [7], 8: [7], 9: [9] },
};

/* ----------------------------------------------------------- operations */

export function hashInsert(
  state: HashTableState,
  rawKey: string,
  rawValue: number,
): AlgorithmResult<HashTableState> {
  const key = validateKey(rawKey);
  const value = validateValue(rawValue);
  const recorder = new StepRecorder<HashTableState>();
  const hash = recordHash(recorder, state, key);
  const buckets = cloneBuckets(state.buckets);

  if (state.strategy === 'chaining') {
    const slot = buckets[hash];
    const entries = slot.kind === 'entries' ? slot.entries : [];
    const existing = entries.findIndex((entry) => entry.key === key);

    if (entries.length > 0 && existing === -1) {
      recorder.push({
        state: snapshot(state, { highlight: [hash] }),
        description: `Bucket ${hash} already holds ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} — a collision. Separate chaining simply appends to that bucket's list.`,
        operation: 'collision',
        highlightedLines: [6],
      });
    }

    for (let i = 0; i < entries.length; i += 1) {
      recorder.count('comparisons');
      recorder.push({
        state: snapshot(state, { highlight: [hash] }),
        description: `Compare existing key "${entries[i].key}" with "${key}" — ${
          entries[i].key === key ? 'same key, overwrite its value.' : 'different key, keep walking the chain.'
        }`,
        operation: 'compare',
        highlightedLines: [6, 7],
      });
      if (entries[i].key === key) break;
    }

    const nextEntries =
      existing >= 0
        ? entries.map((entry, i) => (i === existing ? { key, value } : entry))
        : [...entries, { key, value }];
    buckets[hash] = { kind: 'entries', entries: nextEntries };
    recorder.count('writes');

    recorder.push({
      state: snapshot(
        {
          ...state,
          buckets,
          count: state.count + (existing >= 0 ? 0 : 1),
        },
        { highlight: [hash], result: `${key} → ${value}` },
      ),
      description:
        existing >= 0
          ? `Key "${key}" already existed, so its value becomes ${value}.`
          : `Append ("${key}", ${value}) to bucket ${hash}. Load factor is now ${((state.count + 1) / state.capacity).toFixed(2)}.`,
      operation: 'insert',
      highlightedLines: existing >= 0 ? [8, 9] : [10],
    });

    return recorder.finish({
      timeComplexity: 'O(1) average, O(n) worst',
      spaceComplexity: 'O(n)',
    });
  }

  // Linear probing
  const probes: number[] = [];
  for (let probe = 0; probe < state.capacity; probe += 1) {
    const index = (hash + probe) % state.capacity;
    probes.push(index);
    const slot = buckets[index];
    const occupied =
      slot.kind === 'entries' && slot.entries.length > 0 && slot.entries[0].key !== key;

    recorder.count('comparisons');
    recorder.push({
      state: snapshot(state, { highlight: [index], probes: [...probes] }),
      description:
        probe === 0
          ? `Probe 0: look at bucket ${index}. ${occupied ? 'Occupied by another key — a collision.' : 'Free, so the key goes here.'}`
          : `Probe ${probe}: (${hash} + ${probe}) mod ${state.capacity} = ${index}. ${occupied ? 'Still occupied, keep walking.' : 'Free — insert here.'}`,
      operation: occupied ? 'collision' : 'probe',
      highlightedLines: [5, 6, 7],
    });

    if (!occupied) {
      buckets[index] = { kind: 'entries', entries: [{ key, value }] };
      recorder.count('writes');
      recorder.push({
        state: snapshot(
          {
            ...state,
            buckets,
            count: state.count + (slot.kind === 'entries' ? 0 : 1),
          },
          { highlight: [index], probes: [...probes], result: `${key} → ${value}` },
        ),
        description: `Store ("${key}", ${value}) in bucket ${index} after ${probe} collision${probe === 1 ? '' : 's'}. Open addressing keeps everything in the array itself.`,
        operation: 'insert',
        highlightedLines: [8, 9],
      });
      return recorder.finish({
        timeComplexity: 'O(1) average, O(n) worst',
        spaceComplexity: 'O(1)',
      });
    }
  }

  recorder.push({
    state: snapshot(state, { highlight: [] }),
    description:
      'Every bucket was probed and all are occupied. An open-addressed table must resize before it fills up — typically at a load factor around 0.7.',
    operation: 'full',
    highlightedLines: [10],
  });

  return recorder.finish({
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
  });
}

export function hashSearch(
  state: HashTableState,
  rawKey: string,
): AlgorithmResult<HashTableState> {
  const key = validateKey(rawKey);
  const recorder = new StepRecorder<HashTableState>();
  const hash = recordHash(recorder, state, key);

  if (state.strategy === 'chaining') {
    const slot = state.buckets[hash];
    const entries = slot.kind === 'entries' ? slot.entries : [];
    for (let i = 0; i < entries.length; i += 1) {
      recorder.count('comparisons');
      const match = entries[i].key === key;
      recorder.push({
        state: snapshot(state, {
          highlight: [hash],
          result: match ? `${key} → ${entries[i].value}` : null,
        }),
        description: `Chain position ${i}: "${entries[i].key}" ${match ? `matches — the value is ${entries[i].value}.` : `is not "${key}", keep walking.`}`,
        operation: match ? 'found' : 'compare',
        highlightedLines: match ? [6, 7] : [5, 6],
      });
      if (match) {
        return recorder.finish({
          timeComplexity: 'O(1) average',
          spaceComplexity: 'O(1)',
          summary: `Found ${entries[i].value}.`,
        });
      }
    }
    recorder.push({
      state: snapshot(state, { highlight: [hash] }),
      description: `Bucket ${hash}${entries.length ? "'s chain is exhausted" : ' is empty'}, so "${key}" is not in the table.`,
      operation: 'not-found',
      highlightedLines: [8],
    });
    return recorder.finish({
      timeComplexity: 'O(1) average',
      spaceComplexity: 'O(1)',
      summary: 'Not found.',
    });
  }

  const probes: number[] = [];
  for (let probe = 0; probe < state.capacity; probe += 1) {
    const index = (hash + probe) % state.capacity;
    probes.push(index);
    const slot = state.buckets[index];
    recorder.count('comparisons');

    if (slot.kind === 'empty') {
      recorder.push({
        state: snapshot(state, { highlight: [index], probes: [...probes] }),
        description: `Bucket ${index} is empty. The probe sequence would have placed "${key}" here, so it cannot be in the table — stop.`,
        operation: 'not-found',
        highlightedLines: [7],
      });
      return recorder.finish({
        timeComplexity: 'O(1) average',
        spaceComplexity: 'O(1)',
        summary: 'Not found.',
      });
    }

    if (slot.kind === 'tombstone') {
      recorder.push({
        state: snapshot(state, { highlight: [index], probes: [...probes] }),
        description: `Bucket ${index} holds a tombstone — something was deleted here. Keep probing rather than stopping, or later keys would become unreachable.`,
        operation: 'tombstone',
        highlightedLines: [5, 6],
      });
      continue;
    }

    const entry = slot.entries[0];
    const match = entry.key === key;
    recorder.push({
      state: snapshot(state, {
        highlight: [index],
        probes: [...probes],
        result: match ? `${key} → ${entry.value}` : null,
      }),
      description: `Bucket ${index} holds "${entry.key}" — ${match ? `match, value is ${entry.value}.` : 'different key, probe the next slot.'}`,
      operation: match ? 'found' : 'probe',
      highlightedLines: [8],
    });
    if (match) {
      return recorder.finish({
        timeComplexity: 'O(1) average',
        spaceComplexity: 'O(1)',
        summary: `Found ${entry.value}.`,
      });
    }
  }

  recorder.push({
    state: snapshot(state),
    description: `Probed every bucket without finding "${key}".`,
    operation: 'not-found',
    highlightedLines: [9],
  });
  return recorder.finish({
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    summary: 'Not found.',
  });
}

export function hashDelete(
  state: HashTableState,
  rawKey: string,
): AlgorithmResult<HashTableState> {
  const key = validateKey(rawKey);
  const recorder = new StepRecorder<HashTableState>();
  const hash = recordHash(recorder, state, key);
  const buckets = cloneBuckets(state.buckets);

  if (state.strategy === 'chaining') {
    const slot = buckets[hash];
    const entries = slot.kind === 'entries' ? slot.entries : [];
    const index = entries.findIndex((entry) => entry.key === key);
    recorder.count('comparisons', Math.max(1, index + 1));

    if (index === -1) {
      recorder.push({
        state: snapshot(state, { highlight: [hash] }),
        description: `"${key}" is not in bucket ${hash}, so there is nothing to delete.`,
        operation: 'not-found',
        highlightedLines: [3, 4, 5],
      });
      return recorder.finish({
        timeComplexity: 'O(1) average',
        spaceComplexity: 'O(1)',
      });
    }

    const remaining = entries.filter((_, i) => i !== index);
    buckets[hash] =
      remaining.length > 0
        ? { kind: 'entries', entries: remaining }
        : { kind: 'empty' };

    recorder.push({
      state: snapshot(
        { ...state, buckets, count: state.count - 1 },
        { highlight: [hash] },
      ),
      description: `Unlink "${key}" from bucket ${hash}'s chain. With chaining there is no tombstone to worry about — the rest of the chain is still reachable.`,
      operation: 'delete',
      highlightedLines: [6, 9],
    });
    return recorder.finish({
      timeComplexity: 'O(1) average',
      spaceComplexity: 'O(1)',
    });
  }

  const probes: number[] = [];
  for (let probe = 0; probe < state.capacity; probe += 1) {
    const index = (hash + probe) % state.capacity;
    probes.push(index);
    const slot = buckets[index];
    recorder.count('comparisons');

    if (slot.kind === 'empty') break;
    if (slot.kind === 'entries' && slot.entries[0].key === key) {
      buckets[index] = { kind: 'tombstone' };
      recorder.push({
        state: snapshot(
          { ...state, buckets, count: state.count - 1 },
          { highlight: [index], probes: [...probes] },
        ),
        description: `Found "${key}" at bucket ${index}. Mark it as a tombstone rather than empty: a plain empty slot would cut short the probe sequence of any key that collided past this point.`,
        operation: 'tombstone',
        highlightedLines: [6, 7, 8],
      });
      return recorder.finish({
        timeComplexity: 'O(1) average',
        spaceComplexity: 'O(1)',
      });
    }

    recorder.push({
      state: snapshot(state, { highlight: [index], probes: [...probes] }),
      description: `Bucket ${index} does not hold "${key}" — keep probing.`,
      operation: 'probe',
      highlightedLines: [3],
    });
  }

  recorder.push({
    state: snapshot(state),
    description: `"${key}" is not in the table.`,
    operation: 'not-found',
    highlightedLines: [4, 5],
  });
  return recorder.finish({
    timeComplexity: 'O(1) average',
    spaceComplexity: 'O(1)',
  });
}

export interface HashOperationSpec {
  id: string;
  label: string;
  description: string;
  needsValue: boolean;
  code: (strategy: Strategy) => CodeSource;
  complexity: ComplexityInfo;
}

export const HASH_OPERATIONS: HashOperationSpec[] = [
  {
    id: 'insert',
    label: 'Insert',
    description: 'Hash the key, then store the pair in its bucket.',
    needsValue: true,
    code: (strategy) =>
      strategy === 'chaining' ? chainingInsertCode : probingInsertCode,
    complexity: {
      best: 'O(1)',
      average: 'O(1)',
      worst: 'O(n)',
      space: 'O(n)',
    },
  },
  {
    id: 'search',
    label: 'Search',
    description: 'Hash the key, then look inside that bucket.',
    needsValue: false,
    code: (strategy) =>
      strategy === 'chaining' ? chainingSearchCode : probingSearchCode,
    complexity: {
      best: 'O(1)',
      average: 'O(1)',
      worst: 'O(n)',
      space: 'O(1)',
    },
  },
  {
    id: 'delete',
    label: 'Delete',
    description: 'Remove a pair — with a tombstone when open addressing.',
    needsValue: false,
    code: () => deleteCode,
    complexity: {
      best: 'O(1)',
      average: 'O(1)',
      worst: 'O(n)',
      space: 'O(1)',
    },
  },
];
