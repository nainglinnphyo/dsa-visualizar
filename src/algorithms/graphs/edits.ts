import { StepRecorder } from '@/engine/recorder';
import type { AlgorithmResult } from '@/engine/types';
import type { CodeSource } from '@/engine/code';
import type { ComplexityInfo } from '@/types/learning';
import {
  addEdge,
  addVertex,
  createGraphState,
  degreeOf,
  neighbours,
  removeEdge,
  removeVertex,
  requireVertex,
  type Graph,
  type GraphState,
} from './model';

const listCode: CodeSource = {
  pseudocode: `class Graph:
  adjacency = map from vertex to list of (neighbour, weight)

  addVertex(v):            // O(1)
    adjacency[v] = []

  addEdge(u, v, w):        // O(1)
    adjacency[u].append((v, w))
    if undirected:
      adjacency[v].append((u, w))

  removeVertex(v):         // O(V + E)
    delete adjacency[v]
    remove v from every other adjacency list

  neighbours(v):           // O(degree(v))
    return adjacency[v]`,
  typescript: `class Graph {
  private adjacency = new Map<string, { to: string; weight: number }[]>();

  addVertex(v: string): void {
    if (!this.adjacency.has(v)) this.adjacency.set(v, []);
  }

  addEdge(u: string, v: string, weight = 1): void {
    this.adjacency.get(u)!.push({ to: v, weight });
    if (!this.directed) this.adjacency.get(v)!.push({ to: u, weight });
  }

  removeVertex(v: string): void {
    this.adjacency.delete(v);
    for (const list of this.adjacency.values()) {
      const i = list.findIndex((e) => e.to === v);
      if (i !== -1) list.splice(i, 1);
    }
  }

  neighbours(v: string) {
    return this.adjacency.get(v) ?? [];
  }
}`,
  lineMap: {
    1: [1], 2: [2], 4: [4], 5: [5], 7: [8], 8: [9], 9: [10], 10: [10],
    12: [13], 13: [14], 14: [15, 16, 17, 18], 16: [21], 17: [22],
  },
};

const snapshotOf = (graph: Graph, overrides: Partial<GraphState> = {}): GraphState => ({
  ...createGraphState(graph),
  ...overrides,
});

export function addVertexOperation(graph: Graph): AlgorithmResult<GraphState> {
  const recorder = new StepRecorder<GraphState>();
  recorder.push({
    state: snapshotOf(graph),
    description: `The graph has ${graph.nodes.length} vertex${graph.nodes.length === 1 ? '' : 'es'}. Adding one means creating an empty adjacency entry — nothing else is touched.`,
    operation: 'before',
    highlightedLines: [4, 5],
  });
  const next = addVertex(graph);
  const added = next.nodes[next.nodes.length - 1];
  recorder.count('writes');
  recorder.push({
    state: snapshotOf(next, { current: added.id, annotations: { [added.id]: 'degree 0' } }),
    description: `Added ${added.label} with an empty neighbour list. Adding a vertex to an adjacency list is O(1); in an adjacency matrix it would mean growing a ${next.nodes.length}×${next.nodes.length} grid.`,
    operation: 'add-vertex',
    highlightedLines: [4, 5],
  });
  return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
}

export function removeVertexOperation(
  graph: Graph,
  rawId: string,
): AlgorithmResult<GraphState> {
  const id = requireVertex(graph, rawId);
  const recorder = new StepRecorder<GraphState>();
  const touching = graph.edges.filter(
    (edge) => edge.from === id || edge.to === id,
  );

  recorder.push({
    state: snapshotOf(graph, {
      current: id,
      rejectedEdges: touching.map((edge) => edge.id),
    }),
    description: `${id} has degree ${degreeOf(graph, id)}. Every edge touching it has to go too, which is why removing a vertex is O(V + E) rather than O(1).`,
    operation: 'find-edges',
    highlightedLines: [12, 13, 14],
  });

  const next = removeVertex(graph, id);
  recorder.count('writes', touching.length + 1);
  recorder.push({
    state: snapshotOf(next),
    description: `Removed ${id} and ${touching.length} incident edge${touching.length === 1 ? '' : 's'}. ${next.nodes.length} vertices remain.`,
    operation: 'remove-vertex',
    highlightedLines: [13, 14],
  });

  return recorder.finish({ timeComplexity: 'O(V + E)', spaceComplexity: 'O(1)' });
}

export function addEdgeOperation(
  graph: Graph,
  from: string,
  to: string,
  weight: number,
): AlgorithmResult<GraphState> {
  const u = requireVertex(graph, from, 'From');
  const v = requireVertex(graph, to, 'To');
  const recorder = new StepRecorder<GraphState>();

  recorder.push({
    state: snapshotOf(graph, { current: u, frontier: [v] }),
    description: `Connect ${u} and ${v} with weight ${weight}.`,
    operation: 'before',
    highlightedLines: [7],
  });

  const next = addEdge(graph, u, v, weight);
  const added = next.edges[next.edges.length - 1];
  recorder.count('writes', graph.directed ? 1 : 2);
  recorder.push({
    state: snapshotOf(next, { activeEdge: added.id, current: u, frontier: [v] }),
    description: graph.directed
      ? `Appended ${v} to ${u}'s list. The graph is directed, so ${v}'s list is untouched — you cannot travel ${v}→${u}.`
      : `Appended ${v} to ${u}'s list and ${u} to ${v}'s. An undirected edge is stored twice, which is why the degrees sum to 2E.`,
    operation: 'add-edge',
    highlightedLines: [8, 9, 10],
  });

  return recorder.finish({ timeComplexity: 'O(1)', spaceComplexity: 'O(1)' });
}

export function removeEdgeOperation(
  graph: Graph,
  from: string,
  to: string,
): AlgorithmResult<GraphState> {
  const u = requireVertex(graph, from, 'From');
  const v = requireVertex(graph, to, 'To');
  const recorder = new StepRecorder<GraphState>();
  const match = graph.edges.find(
    (edge) =>
      (edge.from === u && edge.to === v) ||
      (!graph.directed && edge.from === v && edge.to === u),
  );

  recorder.push({
    state: snapshotOf(graph, {
      activeEdge: match?.id ?? null,
      current: u,
      frontier: [v],
    }),
    description: `Find ${u}–${v} in ${u}'s adjacency list. That scan is O(degree(${u})) = O(${degreeOf(graph, u)}).`,
    operation: 'locate',
    highlightedLines: [16, 17],
  });

  const next = removeEdge(graph, u, v);
  recorder.count('writes', graph.directed ? 1 : 2);
  recorder.push({
    state: snapshotOf(next),
    description: `Removed ${u}–${v}. ${next.edges.length} edge${next.edges.length === 1 ? '' : 's'} remain.`,
    operation: 'remove-edge',
    highlightedLines: [12, 13, 14],
  });

  return recorder.finish({
    timeComplexity: 'O(degree)',
    spaceComplexity: 'O(1)',
  });
}

export function inspectNeighbours(
  graph: Graph,
  rawId: string,
): AlgorithmResult<GraphState> {
  const id = requireVertex(graph, rawId);
  const recorder = new StepRecorder<GraphState>();
  const list = neighbours(graph, id);

  recorder.push({
    state: snapshotOf(graph, { current: id }),
    description: `Read ${id}'s adjacency list. With an adjacency list this costs O(degree(${id})); with a matrix it would mean scanning all ${graph.nodes.length} cells of its row.`,
    operation: 'start',
    highlightedLines: [16, 17],
  });

  const seen: string[] = [];
  for (const { node, edge } of list) {
    seen.push(node);
    recorder.count('reads');
    recorder.push({
      state: snapshotOf(graph, {
        current: id,
        activeEdge: edge.id,
        frontier: [...seen],
      }),
      description: `${id} → ${node}${graph.weighted ? ` with weight ${edge.weight}` : ''}.`,
      operation: 'neighbour',
      highlightedLines: [17],
    });
  }

  recorder.push({
    state: snapshotOf(graph, { current: id, frontier: [...seen] }),
    description: list.length
      ? `${id} has degree ${list.length}: ${seen.join(', ')}.`
      : `${id} is isolated — it has no edges.`,
    operation: 'done',
    highlightedLines: [16, 17],
  });

  return recorder.finish({
    timeComplexity: 'O(degree)',
    spaceComplexity: 'O(1)',
  });
}

export interface GraphEditSpec {
  id: string;
  label: string;
  description: string;
  fields: ('from' | 'to' | 'weight' | 'vertex')[];
  complexity: ComplexityInfo;
}

export const GRAPH_EDIT_CODE = listCode;

export const GRAPH_EDITS: GraphEditSpec[] = [
  {
    id: 'add-vertex',
    label: 'Add vertex',
    description: 'Create a new vertex with an empty neighbour list.',
    fields: [],
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
  },
  {
    id: 'remove-vertex',
    label: 'Remove vertex',
    description: 'Delete a vertex and every edge that touches it.',
    fields: ['vertex'],
    complexity: { best: 'O(V)', average: 'O(V + E)', worst: 'O(V + E)', space: 'O(1)' },
  },
  {
    id: 'add-edge',
    label: 'Add edge',
    description: 'Connect two vertices, in one or both directions.',
    fields: ['from', 'to', 'weight'],
    complexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)', space: 'O(1)' },
  },
  {
    id: 'remove-edge',
    label: 'Remove edge',
    description: 'Find the edge in the adjacency list and drop it.',
    fields: ['from', 'to'],
    complexity: { best: 'O(1)', average: 'O(degree)', worst: 'O(V)', space: 'O(1)' },
  },
  {
    id: 'neighbours',
    label: 'List neighbours',
    description: 'Walk one vertex’s adjacency list.',
    fields: ['vertex'],
    complexity: { best: 'O(1)', average: 'O(degree)', worst: 'O(V)', space: 'O(1)' },
  },
];
