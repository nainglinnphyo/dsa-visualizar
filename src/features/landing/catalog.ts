/**
 * Counts shown on the landing page.
 *
 * These are literals rather than imports so the landing route does not pull
 * every algorithm module into the entry bundle. `catalog.test.ts` asserts each
 * number against the real registry, so they cannot drift.
 */
export const CATALOG = {
  dataStructures: 8,
  sorting: 7,
  searching: 2,
  graph: 6,
  recursion: 6,
} as const;

export const TOTAL_ALGORITHMS =
  CATALOG.sorting + CATALOG.searching + CATALOG.graph + CATALOG.recursion;

export interface CatalogGroup {
  title: string;
  to: string;
  items: string[];
}

export const DATA_STRUCTURE_GROUPS: CatalogGroup[] = [
  {
    title: 'Arrays',
    to: '/data-structures/arrays',
    items: ['Access & update', 'Insert & delete with shifting', 'Linear & binary search'],
  },
  {
    title: 'Linked lists',
    to: '/data-structures/linked-lists',
    items: ['Singly & doubly linked', 'Insert at head, tail or position', 'Animated pointer rewiring'],
  },
  {
    title: 'Stacks',
    to: '/data-structures/stacks',
    items: ['Push, pop, peek', 'Top pointer and LIFO order', 'Overflow & underflow'],
  },
  {
    title: 'Queues',
    to: '/data-structures/queues',
    items: ['Enqueue, dequeue, peek', 'Front and rear pointers', 'Linear vs circular'],
  },
  {
    title: 'Hash tables',
    to: '/data-structures/hash-tables',
    items: ['Hash computed per character', 'Separate chaining', 'Linear probing with tombstones'],
  },
  {
    title: 'Trees',
    to: '/data-structures/trees',
    items: ['BST and AVL', 'All four rotation cases', 'Four traversals'],
  },
  {
    title: 'Heaps',
    to: '/data-structures/heaps',
    items: ['Min and max heaps', 'Insert, extract, heapify', 'Tree and array views in sync'],
  },
  {
    title: 'Graphs',
    to: '/data-structures/graphs',
    items: ['Directed & undirected', 'Add/remove vertices and edges', 'Adjacency list vs matrix'],
  },
];

export const ALGORITHM_GROUPS: CatalogGroup[] = [
  {
    title: 'Sorting',
    to: '/algorithms/sorting',
    items: [
      'Bubble, selection, insertion',
      'Merge, quick, heap',
      'Counting sort (non-comparison)',
    ],
  },
  {
    title: 'Searching',
    to: '/algorithms/searching',
    items: ['Linear search', 'Binary search', 'Candidate window shrinking live'],
  },
  {
    title: 'Graph algorithms',
    to: '/algorithms/graphs',
    items: ['BFS, DFS', 'Dijkstra, A*', 'Topological sort, Kruskal MST'],
  },
  {
    title: 'Recursion & backtracking',
    to: '/algorithms/recursion',
    items: [
      'Factorial, Fibonacci, binary search',
      'Tower of Hanoi',
      'Maze solving, N-Queens',
    ],
  },
];
