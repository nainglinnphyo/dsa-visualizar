import { describe, expect, it } from 'vitest';
import { InputError, type AlgorithmResult } from '@/engine/types';
import {
  addEdge,
  addVertex,
  adjacencyList,
  adjacencyMatrix,
  breadthFirstSearch,
  buildGraph,
  degreeOf,
  depthFirstSearch,
  dijkstra,
  aStar,
  heuristicFor,
  kruskal,
  neighbours,
  removeEdge,
  removeVertex,
  SAMPLE_DAG,
  SAMPLE_GRAPH,
  topologicalSort,
  type Graph,
  type GraphState,
} from '..';

const last = (result: AlgorithmResult<GraphState>): GraphState =>
  result.steps[result.steps.length - 1].state;

const WEIGHTED = SAMPLE_GRAPH();

/** Reference shortest distances from A in the sample graph, by hand. */
const EXPECTED_DISTANCES: Record<string, number> = {
  A: 0,
  B: 3, // A→C→B = 2 + 1
  C: 2,
  D: 8, // A→C→B→D = 2 + 1 + 5
  E: 10, // A→C→B→D→E = 8 + 2
  F: 13, // …→E→F = 10 + 3
  G: 14, // …→F→G = 13 + 1
};

describe('graph model', () => {
  it('lists neighbours symmetrically in an undirected graph', () => {
    const graph = buildGraph(['A', 'B', 'C'], [['A', 'B', 1], ['B', 'C', 2]]);
    expect(neighbours(graph, 'B').map((n) => n.node)).toEqual(['A', 'C']);
    expect(neighbours(graph, 'A').map((n) => n.node)).toEqual(['B']);
  });

  it('lists neighbours one way in a directed graph', () => {
    const graph = buildGraph(['A', 'B'], [['A', 'B', 1]], { directed: true });
    expect(neighbours(graph, 'A').map((n) => n.node)).toEqual(['B']);
    expect(neighbours(graph, 'B')).toEqual([]);
  });

  it('degrees sum to twice the edge count when undirected', () => {
    const total = WEIGHTED.nodes.reduce(
      (sum, node) => sum + degreeOf(WEIGHTED, node.id),
      0,
    );
    expect(total).toBe(2 * WEIGHTED.edges.length);
  });

  it('builds a symmetric adjacency matrix for undirected graphs', () => {
    const matrix = adjacencyMatrix(WEIGHTED);
    for (let i = 0; i < matrix.length; i += 1) {
      for (let j = 0; j < matrix.length; j += 1) {
        expect(matrix[i][j]).toBe(matrix[j][i]);
      }
    }
  });

  it('builds an asymmetric matrix for directed graphs', () => {
    const matrix = adjacencyMatrix(SAMPLE_DAG());
    const symmetric = matrix.every((row, i) =>
      row.every((cell, j) => cell === matrix[j][i]),
    );
    expect(symmetric).toBe(false);
  });

  it('adjacency list rows match the neighbour helper', () => {
    for (const row of adjacencyList(WEIGHTED)) {
      expect(row.to).toHaveLength(degreeOf(WEIGHTED, row.id));
    }
  });

  it('removing a vertex drops every incident edge', () => {
    const next = removeVertex(WEIGHTED, 'C');
    expect(next.nodes.some((node) => node.id === 'C')).toBe(false);
    expect(next.edges.some((edge) => edge.from === 'C' || edge.to === 'C')).toBe(false);
  });

  it('rejects invalid edits', () => {
    expect(() => addEdge(WEIGHTED, 'A', 'A', 1)).toThrow(InputError);
    expect(() => addEdge(WEIGHTED, 'A', 'B', 1)).toThrow(InputError);
    expect(() => addEdge(WEIGHTED, 'A', 'Z', 1)).toThrow(InputError);
    expect(() => addEdge(WEIGHTED, 'A', 'G', 0)).toThrow(InputError);
    expect(() => removeEdge(WEIGHTED, 'A', 'G')).toThrow(InputError);
    expect(() => removeVertex(WEIGHTED, 'Z')).toThrow(InputError);
  });

  it('caps the vertex count', () => {
    let graph: Graph = buildGraph([], []);
    for (let i = 0; i < 12; i += 1) graph = addVertex(graph);
    expect(graph.nodes).toHaveLength(12);
    expect(() => addVertex(graph)).toThrow(InputError);
  });
});

describe('traversals', () => {
  it('BFS visits every connected vertex exactly once', () => {
    const order = last(breadthFirstSearch(WEIGHTED, { start: 'A' })).order;
    expect(new Set(order).size).toBe(order.length);
    expect(order).toHaveLength(WEIGHTED.nodes.length);
    expect(order[0]).toBe('A');
  });

  it('BFS visits in non-decreasing edge distance from the source', () => {
    const order = last(breadthFirstSearch(WEIGHTED, { start: 'A' })).order;
    // Reference hop counts computed with a plain queue.
    const hops = new Map<string, number>([['A', 0]]);
    const queue = ['A'];
    while (queue.length) {
      const node = queue.shift() as string;
      for (const { node: next } of neighbours(WEIGHTED, node)) {
        if (!hops.has(next)) {
          hops.set(next, (hops.get(node) as number) + 1);
          queue.push(next);
        }
      }
    }
    const distances = order.map((id) => hops.get(id) as number);
    for (let i = 1; i < distances.length; i += 1) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
    }
  });

  it('DFS visits every connected vertex exactly once', () => {
    const order = last(depthFirstSearch(WEIGHTED, { start: 'A' })).order;
    expect(new Set(order).size).toBe(order.length);
    expect(order).toHaveLength(WEIGHTED.nodes.length);
  });

  it('both traversals stop at a disconnected component', () => {
    const graph = buildGraph(['A', 'B', 'C'], [['A', 'B', 1]]);
    expect(last(breadthFirstSearch(graph, { start: 'A' })).order).toEqual(['A', 'B']);
    expect(last(depthFirstSearch(graph, { start: 'A' })).order).toEqual(['A', 'B']);
  });

  it('handles a single isolated vertex', () => {
    const graph = buildGraph(['A'], []);
    expect(last(breadthFirstSearch(graph, { start: 'A' })).order).toEqual(['A']);
    expect(last(depthFirstSearch(graph, { start: 'A' })).order).toEqual(['A']);
  });

  it('terminates on a cyclic graph', () => {
    const graph = buildGraph(
      ['A', 'B', 'C'],
      [['A', 'B', 1], ['B', 'C', 1], ['C', 'A', 1]],
    );
    expect(last(depthFirstSearch(graph, { start: 'A' })).order).toHaveLength(3);
  });

  it('rejects a start vertex that is not in the graph', () => {
    expect(() => breadthFirstSearch(WEIGHTED, { start: 'Z' })).toThrow(InputError);
  });
});

describe('dijkstra', () => {
  it('matches hand-computed shortest distances', () => {
    const state = last(dijkstra(WEIGHTED, { start: 'A' }));
    for (const [id, expected] of Object.entries(EXPECTED_DISTANCES)) {
      expect(state.distances[id]).toBe(expected);
    }
  });

  it('settles vertices in non-decreasing distance order', () => {
    const state = last(dijkstra(WEIGHTED, { start: 'A' }));
    const distances = state.order.map((id) => state.distances[id]);
    for (let i = 1; i < distances.length; i += 1) {
      expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
    }
  });

  it('reconstructs a path whose weights sum to the reported distance', () => {
    const state = last(dijkstra(WEIGHTED, { start: 'A', goal: 'G' }));
    expect(state.path[0]).toBe('A');
    expect(state.path[state.path.length - 1]).toBe('G');
    let total = 0;
    for (let i = 0; i + 1 < state.path.length; i += 1) {
      const edge = WEIGHTED.edges.find(
        (candidate) =>
          (candidate.from === state.path[i] && candidate.to === state.path[i + 1]) ||
          (candidate.from === state.path[i + 1] && candidate.to === state.path[i]),
      );
      total += edge?.weight ?? 0;
    }
    expect(total).toBe(EXPECTED_DISTANCES.G);
  });

  it('leaves unreachable vertices at infinity', () => {
    const graph = buildGraph(['A', 'B', 'C'], [['A', 'B', 1]]);
    const state = last(dijkstra(graph, { start: 'A' }));
    expect(state.distances.C).toBe(Infinity);
  });

  it('rejects negative weights', () => {
    const graph = buildGraph(['A', 'B'], [['A', 'B', -1]]);
    expect(() => dijkstra(graph, { start: 'A' })).toThrow(InputError);
  });
});

describe('a*', () => {
  it('uses an admissible heuristic', () => {
    // h must never exceed the true shortest distance to the goal.
    const truth = last(dijkstra(WEIGHTED, { start: 'G' })).distances;
    const { h } = heuristicFor(WEIGHTED, 'G');
    for (const node of WEIGHTED.nodes) {
      expect(h(node.id)).toBeLessThanOrEqual(truth[node.id] + 1e-9);
    }
    expect(h('G')).toBeCloseTo(0, 9);
  });

  it('finds the same optimal cost as dijkstra', () => {
    for (const goal of ['B', 'D', 'F', 'G']) {
      const state = last(aStar(WEIGHTED, { start: 'A', goal }));
      expect(state.distances[goal]).toBeCloseTo(EXPECTED_DISTANCES[goal], 9);
      expect(state.path[0]).toBe('A');
      expect(state.path[state.path.length - 1]).toBe(goal);
    }
  });

  it('reports no path when the goal is unreachable', () => {
    const graph = buildGraph(['A', 'B', 'C'], [['A', 'B', 1]]);
    expect(aStar(graph, { start: 'A', goal: 'C' }).summary).toBe('No path.');
  });

  it('requires a goal', () => {
    expect(() => aStar(WEIGHTED, { start: 'A' })).toThrow(InputError);
  });
});

describe('topological sort', () => {
  it('produces an order where every edge points forwards', () => {
    const dag = SAMPLE_DAG();
    const order = last(topologicalSort(dag)).order;
    expect(order).toHaveLength(dag.nodes.length);
    const position = new Map(order.map((id, i) => [id, i]));
    for (const edge of dag.edges) {
      expect(position.get(edge.from) as number).toBeLessThan(
        position.get(edge.to) as number,
      );
    }
  });

  it('detects a cycle instead of returning a partial order', () => {
    const cyclic = buildGraph(
      ['A', 'B', 'C'],
      [['A', 'B', 1], ['B', 'C', 1], ['C', 'A', 1]],
      { directed: true },
    );
    const result = topologicalSort(cyclic);
    expect(result.summary).toBe('Cycle detected.');
    expect(last(result).order.length).toBeLessThan(cyclic.nodes.length);
  });

  it('rejects undirected graphs', () => {
    expect(() => topologicalSort(WEIGHTED)).toThrow(InputError);
  });

  it('orders a graph with no edges at all', () => {
    const graph = buildGraph(['A', 'B'], [], { directed: true });
    expect(last(topologicalSort(graph)).order).toHaveLength(2);
  });
});

describe('kruskal', () => {
  it('returns a spanning tree with V - 1 edges and no cycle', () => {
    const state = last(kruskal(WEIGHTED));
    expect(state.treeEdges).toHaveLength(WEIGHTED.nodes.length - 1);

    // Union-find over the chosen edges: no edge may join two already-joined vertices.
    const parent = new Map(WEIGHTED.nodes.map((node) => [node.id, node.id]));
    const find = (x: string): string => {
      let current = x;
      while (parent.get(current) !== current) current = parent.get(current) as string;
      return current;
    };
    for (const id of state.treeEdges) {
      const edge = WEIGHTED.edges.find((candidate) => candidate.id === id);
      expect(edge).toBeDefined();
      const a = find((edge as { from: string }).from);
      const b = find((edge as { to: string }).to);
      expect(a).not.toBe(b);
      parent.set(a, b);
    }
    const roots = new Set(WEIGHTED.nodes.map((node) => find(node.id)));
    expect(roots.size).toBe(1);
  });

  it('matches a brute-force minimum over all spanning trees', () => {
    const graph = buildGraph(
      ['A', 'B', 'C', 'D'],
      [
        ['A', 'B', 1],
        ['B', 'C', 4],
        ['C', 'D', 2],
        ['A', 'D', 3],
        ['A', 'C', 5],
      ],
    );
    const chosen = last(kruskal(graph)).treeEdges;
    const weight = chosen.reduce(
      (sum, id) => sum + (graph.edges.find((e) => e.id === id)?.weight ?? 0),
      0,
    );

    // Enumerate every 3-edge subset and keep the cheapest acyclic connected one.
    let bestWeight = Infinity;
    const edges = graph.edges;
    for (let a = 0; a < edges.length; a += 1) {
      for (let b = a + 1; b < edges.length; b += 1) {
        for (let c = b + 1; c < edges.length; c += 1) {
          const subset = [edges[a], edges[b], edges[c]];
          const parent = new Map(graph.nodes.map((n) => [n.id, n.id]));
          const find = (x: string): string => {
            let current = x;
            while (parent.get(current) !== current) current = parent.get(current) as string;
            return current;
          };
          let acyclic = true;
          for (const edge of subset) {
            const u = find(edge.from);
            const v = find(edge.to);
            if (u === v) {
              acyclic = false;
              break;
            }
            parent.set(u, v);
          }
          if (!acyclic) continue;
          const total = subset.reduce((sum, edge) => sum + edge.weight, 0);
          bestWeight = Math.min(bestWeight, total);
        }
      }
    }
    expect(weight).toBe(bestWeight);
  });

  it('produces a forest on a disconnected graph', () => {
    const graph = buildGraph(
      ['A', 'B', 'C', 'D'],
      [['A', 'B', 1], ['C', 'D', 1]],
    );
    const state = last(kruskal(graph));
    expect(state.treeEdges).toHaveLength(2);
    expect(kruskal(graph).summary).toContain('2 edges');
  });

  it('rejects directed graphs', () => {
    expect(() => kruskal(SAMPLE_DAG())).toThrow(InputError);
  });
});

describe('trace contract', () => {
  const traces: AlgorithmResult<GraphState>[] = [
    breadthFirstSearch(WEIGHTED, { start: 'A' }),
    depthFirstSearch(WEIGHTED, { start: 'A' }),
    dijkstra(WEIGHTED, { start: 'A', goal: 'G' }),
    aStar(WEIGHTED, { start: 'A', goal: 'G' }),
    topologicalSort(SAMPLE_DAG()),
    kruskal(WEIGHTED),
  ];

  it.each(traces.map((trace, i) => [i, trace] as const))(
    'trace %i describes and highlights every step',
    (_i, trace) => {
      expect(trace.steps.length).toBeGreaterThan(1);
      for (const step of trace.steps) {
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.highlightedLines?.length ?? 0).toBeGreaterThan(0);
      }
    },
  );

  it.each(traces.map((trace, i) => [i, trace] as const))(
    'trace %i never mutates a shared state object',
    (_i, trace) => {
      const seen = new Set<unknown>();
      for (const step of trace.steps) {
        expect(seen.has(step.state)).toBe(false);
        seen.add(step.state);
      }
    },
  );
});
