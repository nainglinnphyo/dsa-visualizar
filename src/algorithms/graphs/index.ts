import { bfsSpec, dfsSpec } from './traversal';
import { aStarSpec, dijkstraSpec } from './shortest-path';
import { kruskalSpec, topologicalSpec } from './ordering';
import type { GraphAlgorithmSpec } from './types';

export const GRAPH_ALGORITHMS: GraphAlgorithmSpec[] = [
  bfsSpec,
  dfsSpec,
  dijkstraSpec,
  aStarSpec,
  topologicalSpec,
  kruskalSpec,
];

export const graphAlgorithmById = (
  id: string,
): GraphAlgorithmSpec | undefined =>
  GRAPH_ALGORITHMS.find((algorithm) => algorithm.id === id);

export * from './model';
export type { GraphAlgorithmSpec, GraphRunOptions } from './types';
export { breadthFirstSearch, depthFirstSearch } from './traversal';
export { dijkstra, aStar, heuristicFor } from './shortest-path';
export { topologicalSort, kruskal } from './ordering';
