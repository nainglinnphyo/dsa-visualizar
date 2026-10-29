export interface ComplexityRow {
  name: string;
  access: string;
  search: string;
  insert: string;
  remove: string;
  space: string;
  note: string;
}

export const STRUCTURE_COMPLEXITY: ComplexityRow[] = [
  {
    name: 'Array',
    access: 'O(1)',
    search: 'O(n)',
    insert: 'O(n)',
    remove: 'O(n)',
    space: 'O(n)',
    note: 'Contiguous memory; insertion shifts the tail.',
  },
  {
    name: 'Sorted array',
    access: 'O(1)',
    search: 'O(log n)',
    insert: 'O(n)',
    remove: 'O(n)',
    space: 'O(n)',
    note: 'Binary search works; keeping it sorted is the cost.',
  },
  {
    name: 'Singly linked list',
    access: 'O(n)',
    search: 'O(n)',
    insert: 'O(1)*',
    remove: 'O(1)*',
    space: 'O(n)',
    note: '* at a known node; reaching that node is O(n).',
  },
  {
    name: 'Stack',
    access: 'O(n)',
    search: 'O(n)',
    insert: 'O(1)',
    remove: 'O(1)',
    space: 'O(n)',
    note: 'Only the top is reachable.',
  },
  {
    name: 'Queue',
    access: 'O(n)',
    search: 'O(n)',
    insert: 'O(1)',
    remove: 'O(1)',
    space: 'O(n)',
    note: 'Only the front and rear are reachable.',
  },
  {
    name: 'Hash table',
    access: '—',
    search: 'O(1) avg',
    insert: 'O(1) avg',
    remove: 'O(1) avg',
    space: 'O(n)',
    note: 'O(n) worst case when every key collides. No ordering.',
  },
  {
    name: 'Binary search tree',
    access: 'O(h)',
    search: 'O(h)',
    insert: 'O(h)',
    remove: 'O(h)',
    space: 'O(n)',
    note: 'h is the height: log n balanced, n degenerate.',
  },
  {
    name: 'AVL tree',
    access: 'O(log n)',
    search: 'O(log n)',
    insert: 'O(log n)',
    remove: 'O(log n)',
    space: 'O(n)',
    note: 'Rotations keep the height within 1.44 log₂ n.',
  },
  {
    name: 'Binary heap',
    access: 'O(1) root',
    search: 'O(n)',
    insert: 'O(log n)',
    remove: 'O(log n)',
    space: 'O(n)',
    note: 'Only the extreme value is cheap to reach.',
  },
];

export interface SortRow {
  name: string;
  best: string;
  average: string;
  worst: string;
  space: string;
  stable: boolean;
  note: string;
}

export const SORT_COMPLEXITY: SortRow[] = [
  {
    name: 'Bubble sort',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
    note: 'Best case needs the early-exit flag.',
  },
  {
    name: 'Selection sort',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: false,
    note: 'At most n − 1 swaps — the fewest writes.',
  },
  {
    name: 'Insertion sort',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    stable: true,
    note: 'Excellent on small or nearly sorted input.',
  },
  {
    name: 'Merge sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
    stable: true,
    note: 'No bad inputs; needs an auxiliary buffer.',
  },
  {
    name: 'Quick sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
    stable: false,
    note: 'Worst case on sorted input with a last-element pivot.',
  },
  {
    name: 'Heap sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
    stable: false,
    note: 'Guaranteed bound with no extra memory.',
  },
  {
    name: 'Counting sort',
    best: 'O(n + k)',
    average: 'O(n + k)',
    worst: 'O(n + k)',
    space: 'O(n + k)',
    stable: true,
    note: 'Not a comparison sort; k is the key range.',
  },
];

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'Big-O notation',
    definition:
      'An upper bound on how a cost grows with input size, ignoring constants and lower-order terms. O(n² + 3n) is just O(n²), because for large n the square dominates.',
  },
  {
    term: 'Amortized cost',
    definition:
      'The average cost per operation across a long sequence. A dynamic array’s push is amortized O(1): most pushes are cheap and the occasional O(n) resize is spread over the ones before it.',
  },
  {
    term: 'Stable sort',
    definition:
      'A sort that keeps equal elements in their original relative order. Stability lets you sort by one key and then another without losing the first ordering.',
  },
  {
    term: 'In-place',
    definition:
      'An algorithm that uses only O(1) extra memory beyond the input. Quicksort is in place; merge sort is not.',
  },
  {
    term: 'Invariant',
    definition:
      'Something that stays true throughout an algorithm. "Everything left of i is sorted" is insertion sort’s invariant, and proving it holds proves the algorithm correct.',
  },
  {
    term: 'Load factor',
    definition:
      'Entries divided by buckets in a hash table. Performance degrades as it rises, so implementations resize at a threshold — usually around 0.7 for open addressing.',
  },
  {
    term: 'Collision',
    definition:
      'Two keys hashing to the same bucket. Unavoidable by the pigeonhole principle; the choice is how to resolve it — chaining or open addressing.',
  },
  {
    term: 'Balance factor',
    definition:
      'In an AVL tree, the height of a node’s left subtree minus its right. Any node outside −1…1 triggers a rotation.',
  },
  {
    term: 'Rotation',
    definition:
      'A local relink of three pointers that changes a subtree’s shape without breaking the search ordering. The basic repair tool of self-balancing trees.',
  },
  {
    term: 'Admissible heuristic',
    definition:
      'An estimate of remaining cost that never overestimates. A* is guaranteed to find an optimal path exactly when its heuristic is admissible.',
  },
  {
    term: 'Backtracking',
    definition:
      'Systematic search that undoes a choice once it is shown to lead nowhere. N-Queens and maze solving are the canonical examples.',
  },
  {
    term: 'Memoization',
    definition:
      'Caching a function’s result per set of arguments so repeated subproblems are solved once. It turns naive Fibonacci from O(φⁿ) into O(n).',
  },
  {
    term: 'Divide and conquer',
    definition:
      'Split a problem into independent subproblems, solve them recursively and combine the answers. Merge sort, quicksort and binary search all follow it.',
  },
  {
    term: 'Greedy algorithm',
    definition:
      'Always take the locally best option. It only gives an optimal answer when the problem has the right structure — Kruskal’s MST is one of the cases where it provably does.',
  },
];

export interface GrowthRow {
  n: number;
  values: { label: string; value: number }[];
}

const GROWTH_FUNCTIONS: { label: string; f: (n: number) => number }[] = [
  { label: 'log₂ n', f: (n) => Math.log2(n) },
  { label: 'n', f: (n) => n },
  { label: 'n log₂ n', f: (n) => n * Math.log2(n) },
  { label: 'n²', f: (n) => n * n },
  { label: '2ⁿ', f: (n) => 2 ** n },
];

export const GROWTH_LABELS = GROWTH_FUNCTIONS.map((entry) => entry.label);

export const GROWTH_TABLE: GrowthRow[] = [8, 16, 32, 64, 128].map((n) => ({
  n,
  values: GROWTH_FUNCTIONS.map((entry) => ({
    label: entry.label,
    value: entry.f(n),
  })),
}));

export function formatGrowth(value: number): string {
  if (!Number.isFinite(value)) return '∞';
  if (value >= 1e15) return value.toExponential(1).replace('e+', '×10^');
  if (value >= 1000) return Math.round(value).toLocaleString('en-US');
  return String(Math.round(value * 10) / 10);
}
