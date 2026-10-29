import { StepRecorder } from '@/engine/recorder';
import { InputError, type AlgorithmResult } from '@/engine/types';
import {
  createGraphState,
  type Graph,
  type GraphState,
} from './model';
import type { GraphAlgorithmSpec } from './types';

const TOPO_PSEUDOCODE = `function topologicalSort(graph):
  for each vertex v: indegree[v] = number of edges into v
  queue = every vertex with indegree 0
  order = []
  while queue is not empty:
    u = queue.removeFirst()
    order.append(u)
    for each edge (u, v):
      indegree[v] = indegree[v] - 1
      if indegree[v] == 0:
        queue.append(v)
  if length(order) < vertex count:
    report "graph contains a cycle"
  return order`;

const TOPO_TYPESCRIPT = `export function topologicalSort(graph: Graph): string[] | null {
  const indegree = new Map(graph.nodes.map((n) => [n.id, 0]));
  for (const edge of graph.edges) {
    indegree.set(edge.to, indegree.get(edge.to)! + 1);
  }
  const queue = graph.nodes
    .filter((n) => indegree.get(n.id) === 0)
    .map((n) => n.id);
  const order: string[] = [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    order.push(u);
    for (const edge of graph.edges.filter((e) => e.from === u)) {
      const left = indegree.get(edge.to)! - 1;
      indegree.set(edge.to, left);
      if (left === 0) queue.push(edge.to);
    }
  }
  return order.length === graph.nodes.length ? order : null;
}`;

const KRUSKAL_PSEUDOCODE = `function kruskal(graph):
  sort edges by weight ascending
  makeSet(v) for every vertex
  mst = []
  for each edge (u, v, w) in sorted order:
    if find(u) != find(v):
      union(u, v)
      mst.append(edge)
    else:
      skip edge — it would close a cycle
  return mst`;

const KRUSKAL_TYPESCRIPT = `export function kruskal(graph: Graph): Edge[] {
  const parent = new Map(graph.nodes.map((n) => [n.id, n.id]));
  const find = (x: string): string => {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!); // path halving
      x = parent.get(x)!;
    }
    return x;
  };
  const union = (a: string, b: string): void => {
    parent.set(find(a), find(b));
  };

  const mst: Edge[] = [];
  for (const edge of [...graph.edges].sort((a, b) => a.weight - b.weight)) {
    if (find(edge.from) !== find(edge.to)) {
      union(edge.from, edge.to);
      mst.push(edge);
    }
  }
  return mst;
}`;

export function topologicalSort(graph: Graph): AlgorithmResult<GraphState> {
  if (!graph.directed) {
    throw new InputError(
      'Topological sort is only defined for directed graphs. Switch the graph to directed first.',
    );
  }

  const recorder = new StepRecorder<GraphState>();
  const indegree: Record<string, number> = {};
  for (const node of graph.nodes) indegree[node.id] = 0;
  for (const edge of graph.edges) indegree[edge.to] += 1;

  const order: string[] = [];
  const treeEdges: string[] = [];
  const queue = graph.nodes
    .filter((node) => indegree[node.id] === 0)
    .map((node) => node.id);

  const snapshot = (overrides: Partial<GraphState> = {}): GraphState => ({
    ...createGraphState(graph),
    visited: [...order],
    frontier: [...queue],
    order: [...order],
    treeEdges: [...treeEdges],
    annotations: Object.fromEntries(
      graph.nodes.map((node) => [node.id, `in ${indegree[node.id]}`]),
    ),
    ...overrides,
  });

  recorder.push({
    state: snapshot(),
    description: `Count how many edges point *into* each vertex. Those with indegree 0 have no prerequisites, so they can go first: [${queue.join(', ') || 'none'}].`,
    operation: 'indegrees',
    highlightedLines: [2, 3],
  });

  if (queue.length === 0 && graph.nodes.length > 0) {
    recorder.push({
      state: snapshot(),
      description:
        'No vertex has indegree 0, so every vertex depends on another — the graph contains a cycle and has no topological order.',
      operation: 'cycle',
      highlightedLines: [12, 13],
    });
    return recorder.finish({
      timeComplexity: 'O(V + E)',
      spaceComplexity: 'O(V)',
      summary: 'Cycle detected.',
    });
  }

  while (queue.length > 0) {
    const u = queue.shift() as string;
    order.push(u);
    recorder.count('reads');
    recorder.push({
      state: snapshot({ current: u }),
      description: `Take ${u} (indegree 0) and append it to the order: ${order.join(' → ')}.`,
      operation: 'emit',
      highlightedLines: [5, 6, 7],
    });

    for (const edge of graph.edges.filter((candidate) => candidate.from === u)) {
      indegree[edge.to] -= 1;
      recorder.count('writes');
      const ready = indegree[edge.to] === 0;
      if (ready) queue.push(edge.to);
      if (ready) treeEdges.push(edge.id);
      recorder.push({
        state: snapshot({ current: u, activeEdge: edge.id }),
        description: `${u} is placed, so ${edge.to} loses one prerequisite — indegree is now ${indegree[edge.to]}.${
          ready ? ` That frees ${edge.to}; queue it.` : ''
        }`,
        operation: ready ? 'ready' : 'decrement',
        highlightedLines: ready ? [8, 9, 10, 11] : [8, 9],
      });
    }
  }

  const complete = order.length === graph.nodes.length;
  recorder.push({
    state: snapshot(),
    description: complete
      ? `Topological order: ${order.join(' → ')}. Every edge points forwards in this list.`
      : `Only ${order.length} of ${graph.nodes.length} vertices could be placed. The remaining ones form a cycle, so no topological order exists.`,
    operation: complete ? 'done' : 'cycle',
    highlightedLines: complete ? [14] : [12, 13],
  });

  return recorder.finish({
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    summary: complete ? order.join(' → ') : 'Cycle detected.',
  });
}

export function kruskal(graph: Graph): AlgorithmResult<GraphState> {
  if (graph.directed) {
    throw new InputError(
      'A minimum spanning tree is defined for undirected graphs. Switch the graph to undirected first.',
    );
  }

  const recorder = new StepRecorder<GraphState>();
  const parent: Record<string, string> = {};
  for (const node of graph.nodes) parent[node.id] = node.id;

  const find = (x: string): string => {
    let current = x;
    while (parent[current] !== current) current = parent[current];
    return current;
  };

  const sorted = [...graph.edges].sort(
    (a, b) => a.weight - b.weight || a.id.localeCompare(b.id),
  );
  const treeEdges: string[] = [];
  const rejectedEdges: string[] = [];
  let totalWeight = 0;

  const snapshot = (overrides: Partial<GraphState> = {}): GraphState => ({
    ...createGraphState(graph),
    treeEdges: [...treeEdges],
    rejectedEdges: [...rejectedEdges],
    visited: graph.nodes
      .filter((node) => treeEdges.some((id) => id.includes(node.id)))
      .map((node) => node.id),
    annotations: Object.fromEntries(
      graph.nodes.map((node) => [node.id, `set ${find(node.id)}`]),
    ),
    ...overrides,
  });

  recorder.push({
    state: snapshot(),
    description: `Sort all ${sorted.length} edges by weight: ${sorted.map((e) => `${e.from}–${e.to}(${e.weight})`).join(', ')}. Every vertex starts in its own set.`,
    operation: 'sort',
    highlightedLines: [2, 3, 4],
  });

  for (const edge of sorted) {
    const rootFrom = find(edge.from);
    const rootTo = find(edge.to);
    recorder.count('comparisons');
    const wouldCycle = rootFrom === rootTo;

    recorder.push({
      state: snapshot({ activeEdge: edge.id }),
      description: `Consider ${edge.from}–${edge.to} (weight ${edge.weight}). ${edge.from} is in set ${rootFrom}, ${edge.to} is in set ${rootTo} — ${
        wouldCycle
          ? 'the same set, so this edge would close a cycle.'
          : 'different sets, so this edge safely joins two components.'
      }`,
      operation: 'consider',
      highlightedLines: [5, 6],
    });

    if (wouldCycle) {
      rejectedEdges.push(edge.id);
      recorder.push({
        state: snapshot({ activeEdge: edge.id }),
        description: `Skip ${edge.from}–${edge.to}. Adding it would create a cycle, and a tree has none.`,
        operation: 'reject',
        highlightedLines: [9, 10],
      });
      continue;
    }

    parent[rootFrom] = rootTo;
    treeEdges.push(edge.id);
    totalWeight += edge.weight;
    recorder.count('writes');
    recorder.push({
      state: snapshot({ activeEdge: edge.id }),
      description: `Take ${edge.from}–${edge.to} into the MST and union the two sets. The tree now has ${treeEdges.length} edge${treeEdges.length === 1 ? '' : 's'} and total weight ${totalWeight}.`,
      operation: 'accept',
      highlightedLines: [7, 8],
    });

    if (treeEdges.length === graph.nodes.length - 1) break;
  }

  const spanning = treeEdges.length === graph.nodes.length - 1;
  recorder.push({
    state: snapshot(),
    description: spanning
      ? `Minimum spanning tree complete: ${treeEdges.length} edges with total weight ${totalWeight}. A spanning tree of ${graph.nodes.length} vertices always has exactly ${graph.nodes.length - 1} edges.`
      : `Only ${treeEdges.length} edge${treeEdges.length === 1 ? '' : 's'} could be taken, so the graph is not connected — this is a minimum spanning *forest* of weight ${totalWeight}.`,
    operation: 'done',
    highlightedLines: [11],
  });

  return recorder.finish({
    timeComplexity: 'O(E log E)',
    spaceComplexity: 'O(V)',
    summary: `${treeEdges.length} edges, total weight ${totalWeight}`,
  });
}

export const topologicalSpec: GraphAlgorithmSpec = {
  id: 'topological',
  name: 'Topological Sort',
  tagline: "Kahn's algorithm: repeatedly take a vertex with no prerequisites.",
  needsStart: false,
  needsGoal: false,
  requires: 'directed-acyclic',
  run: (graph) => topologicalSort(graph),
  code: {
    pseudocode: TOPO_PSEUDOCODE,
    typescript: TOPO_TYPESCRIPT,
    lineMap: {
      1: [1], 2: [2, 3, 4, 5], 3: [6, 7, 8], 4: [9], 5: [11], 6: [12], 7: [13],
      8: [14], 9: [15, 16], 10: [17], 11: [17], 12: [20], 13: [20], 14: [20],
    },
  },
  complexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
    space: 'O(V)',
  },
  learn: {
    what: 'A topological sort orders the vertices of a directed acyclic graph so that every edge points forwards in the list — a valid order to do tasks in when some depend on others. Kahn’s algorithm builds it by repeatedly taking a vertex with no remaining incoming edges. If it runs out of such vertices before placing them all, the leftovers form a cycle, so the algorithm doubles as cycle detection.',
    how: [
      'Compute the indegree (number of incoming edges) of every vertex.',
      'Queue every vertex whose indegree is 0 — these have no prerequisites.',
      'Take one off the queue and append it to the order.',
      'For each edge leaving it, decrement the target’s indegree.',
      'Any target that drops to 0 is now free; queue it.',
      'If the final order is shorter than the vertex count, the graph has a cycle.',
    ],
    useCases: [
      'Build systems and package managers resolving dependencies.',
      'Task and course scheduling with prerequisites.',
      'Spreadsheet recalculation order.',
      'Instruction scheduling in compilers.',
    ],
    pros: [
      'O(V + E) — a single pass over vertices and edges.',
      'Detects cycles for free.',
      'The queue order is a knob: a priority queue gives the lexicographically smallest order.',
    ],
    cons: [
      'Only defined for directed acyclic graphs.',
      'The order is usually not unique, which can hide bugs that depend on a particular one.',
    ],
    challenge:
      'Run it on the sample DAG and note the order. Then add an edge from F back to A and run it again — find the exact step where the queue empties early.',
  },
};

export const kruskalSpec: GraphAlgorithmSpec = {
  id: 'kruskal',
  name: "Kruskal's MST",
  tagline: 'Take the cheapest edge that does not close a cycle.',
  needsStart: false,
  needsGoal: false,
  requires: 'undirected',
  run: (graph) => kruskal(graph),
  code: {
    pseudocode: KRUSKAL_PSEUDOCODE,
    typescript: KRUSKAL_TYPESCRIPT,
    lineMap: {
      1: [1], 2: [16], 3: [2], 4: [15], 5: [16], 6: [17], 7: [18], 8: [19],
      9: [17], 10: [17], 11: [22],
    },
  },
  complexity: {
    best: 'O(E log E)',
    average: 'O(E log E)',
    worst: 'O(E log E)',
    space: 'O(V)',
  },
  learn: {
    what: "Kruskal's algorithm builds a minimum spanning tree — the cheapest set of edges that connects every vertex without a cycle. It sorts all edges by weight and greedily takes each one unless its two endpoints are already connected. A union-find (disjoint set) structure answers that \"already connected?\" question in almost constant time.",
    how: [
      'Sort every edge by weight, ascending.',
      'Put each vertex in its own set.',
      'Walk the sorted edges. For each, find the set of both endpoints.',
      'Same set means the endpoints are already connected, so the edge would close a cycle — skip it.',
      'Different sets means the edge safely merges two components — take it and union the sets.',
      'Stop once V − 1 edges have been taken; that is a spanning tree.',
    ],
    useCases: [
      'Laying out networks — cabling, pipelines, circuit routing — at minimum cost.',
      'Clustering: cutting the k−1 most expensive MST edges gives k clusters.',
      'Approximation algorithms for the travelling salesman problem.',
    ],
    pros: [
      'Simple greedy rule that is provably optimal (the cut property).',
      'O(E log E), dominated by the sort.',
      'Works naturally on disconnected graphs, producing a spanning forest.',
    ],
    cons: [
      'Needs all edges up front, so it suits sparse graphs more than dense ones.',
      'Requires union-find to be efficient.',
      "Prim's algorithm is usually faster on dense graphs.",
    ],
    challenge:
      'Run it and find the first edge that gets rejected. Name the cycle it would have closed. Then check: is the total MST weight the same if two edges share a weight and you swap their order?',
  },
};
