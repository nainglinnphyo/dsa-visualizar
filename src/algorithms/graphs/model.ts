import { InputError } from '@/engine/types';

export interface GraphNode {
  id: string;
  label: string;
  /** Layout coordinates in an arbitrary 0…100 space. */
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed: boolean;
  weighted: boolean;
}

export interface GraphState {
  graph: Graph;
  /** Fully processed nodes. */
  visited: string[];
  /** Nodes waiting in the queue / stack / priority queue. */
  frontier: string[];
  current: string | null;
  /** Edge currently being relaxed or examined. */
  activeEdge: string | null;
  /** Edges kept by the algorithm (traversal tree, MST, shortest-path tree). */
  treeEdges: string[];
  /** Edges rejected, e.g. a Kruskal edge that would close a cycle. */
  rejectedEdges: string[];
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  /** Visit / topological order produced so far. */
  order: string[];
  /** Final path, when the algorithm produces one. */
  path: string[];
  /** Extra per-node annotations, e.g. `g=4 h=3 f=7` or a union-find root. */
  annotations: Record<string, string>;
}

export const MAX_VERTICES = 12;

export const edgeId = (from: string, to: string): string => `${from}-${to}`;

export function createGraphState(graph: Graph): GraphState {
  return {
    graph,
    visited: [],
    frontier: [],
    current: null,
    activeEdge: null,
    treeEdges: [],
    rejectedEdges: [],
    distances: {},
    previous: {},
    order: [],
    path: [],
    annotations: {},
  };
}

export const cloneGraph = (graph: Graph): Graph => ({
  ...graph,
  nodes: graph.nodes.map((node) => ({ ...node })),
  edges: graph.edges.map((edge) => ({ ...edge })),
});

/** Neighbours of `id`, honouring direction. Sorted for deterministic traces. */
export function neighbours(
  graph: Graph,
  id: string,
): { node: string; edge: GraphEdge }[] {
  const out: { node: string; edge: GraphEdge }[] = [];
  for (const edge of graph.edges) {
    if (edge.from === id) out.push({ node: edge.to, edge });
    else if (!graph.directed && edge.to === id) out.push({ node: edge.from, edge });
  }
  return out.sort((a, b) => a.node.localeCompare(b.node));
}

export function adjacencyList(graph: Graph): { id: string; to: string[] }[] {
  return graph.nodes.map((node) => ({
    id: node.id,
    to: neighbours(graph, node.id).map(({ node: target, edge }) =>
      graph.weighted ? `${target}(${edge.weight})` : target,
    ),
  }));
}

export function adjacencyMatrix(graph: Graph): number[][] {
  const index = new Map(graph.nodes.map((node, i) => [node.id, i]));
  const size = graph.nodes.length;
  const matrix = Array.from({ length: size }, () => new Array<number>(size).fill(0));
  for (const edge of graph.edges) {
    const from = index.get(edge.from);
    const to = index.get(edge.to);
    if (from === undefined || to === undefined) continue;
    matrix[from][to] = graph.weighted ? edge.weight : 1;
    if (!graph.directed) matrix[to][from] = graph.weighted ? edge.weight : 1;
  }
  return matrix;
}

export const degreeOf = (graph: Graph, id: string): number =>
  neighbours(graph, id).length;

/** Places `count` vertices evenly on a circle in the 0…100 layout space. */
function circleLayout(count: number): { x: number; y: number }[] {
  if (count === 1) return [{ x: 50, y: 50 }];
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      x: 50 + 38 * Math.cos(angle),
      y: 50 + 36 * Math.sin(angle),
    };
  });
}

export function relayout(graph: Graph): Graph {
  const positions = circleLayout(graph.nodes.length);
  return {
    ...graph,
    nodes: graph.nodes.map((node, i) => ({ ...node, ...positions[i] })),
  };
}

const LABELS = 'ABCDEFGHIJKL';

export function emptyGraph(directed = false, weighted = true): Graph {
  return { nodes: [], edges: [], directed, weighted };
}

export function buildGraph(
  labels: string[],
  edges: [string, string, number?][],
  options: { directed?: boolean; weighted?: boolean } = {},
): Graph {
  const positions = circleLayout(labels.length);
  const graph: Graph = {
    directed: options.directed ?? false,
    weighted: options.weighted ?? true,
    nodes: labels.map((label, i) => ({
      id: label,
      label,
      x: positions[i].x,
      y: positions[i].y,
    })),
    edges: edges.map(([from, to, weight]) => ({
      id: edgeId(from, to),
      from,
      to,
      weight: weight ?? 1,
    })),
  };
  return graph;
}

/** A connected, weighted sample that shows Dijkstra beating BFS. */
export const SAMPLE_GRAPH = (): Graph =>
  buildGraph(
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    [
      ['A', 'B', 4],
      ['A', 'C', 2],
      ['B', 'C', 1],
      ['B', 'D', 5],
      ['C', 'D', 8],
      ['C', 'E', 10],
      ['D', 'E', 2],
      ['D', 'F', 6],
      ['E', 'F', 3],
      ['F', 'G', 1],
      ['E', 'G', 7],
    ],
  );

/** A directed acyclic sample for topological sort. */
export const SAMPLE_DAG = (): Graph =>
  buildGraph(
    ['A', 'B', 'C', 'D', 'E', 'F'],
    [
      ['A', 'C', 1],
      ['B', 'C', 1],
      ['B', 'D', 1],
      ['C', 'E', 1],
      ['D', 'F', 1],
      ['E', 'F', 1],
    ],
    { directed: true, weighted: false },
  );

export function addVertex(graph: Graph): Graph {
  if (graph.nodes.length >= MAX_VERTICES) {
    throw new InputError(`This visualizer caps the graph at ${MAX_VERTICES} vertices.`);
  }
  const used = new Set(graph.nodes.map((node) => node.id));
  const label = [...LABELS].find((candidate) => !used.has(candidate));
  if (!label) throw new InputError('No free vertex labels left.');
  return relayout({
    ...graph,
    nodes: [...graph.nodes, { id: label, label, x: 50, y: 50 }],
  });
}

export function removeVertex(graph: Graph, id: string): Graph {
  if (!graph.nodes.some((node) => node.id === id)) {
    throw new InputError(`There is no vertex ${id}.`);
  }
  return relayout({
    ...graph,
    nodes: graph.nodes.filter((node) => node.id !== id),
    edges: graph.edges.filter((edge) => edge.from !== id && edge.to !== id),
  });
}

export function addEdge(
  graph: Graph,
  from: string,
  to: string,
  weight: number,
): Graph {
  const has = (id: string): boolean => graph.nodes.some((node) => node.id === id);
  if (!has(from)) throw new InputError(`There is no vertex ${from}.`);
  if (!has(to)) throw new InputError(`There is no vertex ${to}.`);
  if (from === to) throw new InputError('Self-loops are not supported here.');
  if (!Number.isFinite(weight) || weight <= 0 || weight > 99) {
    throw new InputError('Weight must be between 1 and 99.');
  }
  const duplicate = graph.edges.some(
    (edge) =>
      (edge.from === from && edge.to === to) ||
      (!graph.directed && edge.from === to && edge.to === from),
  );
  if (duplicate) throw new InputError(`${from}–${to} already exists.`);
  return {
    ...graph,
    edges: [...graph.edges, { id: edgeId(from, to), from, to, weight }],
  };
}

export function removeEdge(graph: Graph, from: string, to: string): Graph {
  const match = graph.edges.find(
    (edge) =>
      (edge.from === from && edge.to === to) ||
      (!graph.directed && edge.from === to && edge.to === from),
  );
  if (!match) throw new InputError(`There is no edge ${from}–${to}.`);
  return { ...graph, edges: graph.edges.filter((edge) => edge.id !== match.id) };
}

export function requireVertex(graph: Graph, id: string, label = 'Vertex'): string {
  const trimmed = id.trim().toUpperCase();
  if (!graph.nodes.some((node) => node.id === trimmed)) {
    throw new InputError(
      `${label} "${id}" is not in the graph. Available: ${graph.nodes.map((n) => n.id).join(', ') || 'none'}.`,
    );
  }
  return trimmed;
}
