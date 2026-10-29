import {
  ArrowUpDown,
  Binary,
  BookOpen,
  Braces,
  GitBranch,
  Hash,
  Layers,
  LayoutDashboard,
  ListOrdered,
  Network,
  Rows3,
  Search,
  Table,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** One-line summary shown on the dashboard cards. */
  blurb: string;
}

export interface NavSection {
  heading: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Overview',
    items: [
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboard,
        blurb: 'Everything available in one place, with suggested starting points.',
      },
    ],
  },
  {
    heading: 'Data Structures',
    items: [
      {
        label: 'Arrays',
        to: '/data-structures/arrays',
        icon: Rows3,
        blurb: 'Index access, insertion, deletion, linear and binary search.',
      },
      {
        label: 'Linked Lists',
        to: '/data-structures/linked-lists',
        icon: ListOrdered,
        blurb: 'Singly and doubly linked nodes with animated pointer rewiring.',
      },
      {
        label: 'Stacks',
        to: '/data-structures/stacks',
        icon: Layers,
        blurb: 'Push, pop and peek with the top pointer and LIFO ordering.',
      },
      {
        label: 'Queues',
        to: '/data-structures/queues',
        icon: ArrowUpDown,
        blurb: 'Linear and circular queues with front and rear pointers.',
      },
      {
        label: 'Hash Tables',
        to: '/data-structures/hash-tables',
        icon: Hash,
        blurb: 'Watch the hash function run, then resolve collisions two ways.',
      },
      {
        label: 'Trees',
        to: '/data-structures/trees',
        icon: Binary,
        blurb: 'BST and AVL insertion, deletion, rotations and four traversals.',
      },
      {
        label: 'Heaps',
        to: '/data-structures/heaps',
        icon: TrendingUp,
        blurb: 'Min and max heaps as both a tree and the array behind it.',
      },
      {
        label: 'Graphs',
        to: '/data-structures/graphs',
        icon: Network,
        blurb: 'Build directed or undirected graphs and inspect them.',
      },
    ],
  },
  {
    heading: 'Algorithms',
    items: [
      {
        label: 'Sorting',
        to: '/algorithms/sorting',
        icon: Table,
        blurb: 'Seven sorts as animated bars with live comparison counts.',
      },
      {
        label: 'Searching',
        to: '/algorithms/searching',
        icon: Search,
        blurb: 'Linear versus binary search, step by step.',
      },
      {
        label: 'Graph Algorithms',
        to: '/algorithms/graphs',
        icon: GitBranch,
        blurb: 'BFS, DFS, Dijkstra, A*, topological sort and Kruskal’s MST.',
      },
      {
        label: 'Recursion',
        to: '/algorithms/recursion',
        icon: Braces,
        blurb: 'Call stacks for factorial, Fibonacci, Hanoi, mazes and N-Queens.',
      },
    ],
  },
  {
    heading: 'Learn',
    items: [
      {
        label: 'Learning Resources',
        to: '/learn',
        icon: BookOpen,
        blurb: 'Complexity cheat sheet, glossary and how to use this tool.',
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap(
  (section) => section.items,
);
