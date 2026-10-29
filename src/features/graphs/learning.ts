import type { LearningContent } from '@/types/learning';

export const GRAPH_LEARNING: LearningContent = {
  what: 'A graph is a set of vertices and the edges between them — the most general of the common data structures, and the one that models networks, dependencies, maps and relationships. Edges may be directed (one-way) or undirected, and weighted or not. Almost every graph algorithm is built on one of two representations: an adjacency list, which stores each vertex’s neighbours, or an adjacency matrix, which stores a cell for every possible pair.',
  how: [
    'An adjacency list keeps, per vertex, a list of its neighbours. Space is O(V + E).',
    'An adjacency matrix keeps a V × V grid of 0/1 (or weights). Space is O(V²).',
    'Adding a vertex or edge to a list is O(1); looking up whether a specific edge exists is O(degree).',
    'A matrix answers "is there an edge u→v?" in O(1), but iterating one vertex’s neighbours costs O(V).',
    'Removing a vertex means dropping it and every edge that touches it.',
    'In an undirected graph each edge appears in both endpoints’ lists, so the degrees sum to 2E.',
  ],
  useCases: [
    'Social networks, web links and recommendation systems.',
    'Road, rail and computer networks.',
    'Dependency graphs in build systems and package managers.',
    'State machines, and the state space of a puzzle or game.',
  ],
  pros: [
    'Models any pairwise relationship directly.',
    'Adjacency lists are compact for sparse graphs, which is most real-world graphs.',
    'A huge body of ready-made algorithms applies the moment you have a graph.',
  ],
  cons: [
    'Adjacency matrices waste O(V²) space on sparse graphs.',
    'Adjacency lists make "does edge u→v exist?" a scan rather than a lookup.',
    'Many interesting graph problems (Hamiltonian path, graph colouring) are NP-hard.',
  ],
  challenge:
    'Build a graph with 5 vertices and 4 edges, then compare the adjacency list with the matrix. At what edge count does the matrix stop wasting space? Then remove a vertex and watch how many edges disappear with it.',
};
