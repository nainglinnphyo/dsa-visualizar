import { StepRecorder } from '@/engine/recorder';
import { InputError, type AlgorithmResult } from '@/engine/types';
import {
  createGraphState,
  neighbours,
  requireVertex,
  type Graph,
  type GraphState,
} from './model';
import type { GraphAlgorithmSpec, GraphRunOptions } from './types';

const DIJKSTRA_PSEUDOCODE = `function dijkstra(graph, source):
  for each vertex v: dist[v] = infinity
  dist[source] = 0
  unsettled = all vertices
  while unsettled is not empty:
    u = unsettled vertex with smallest dist
    remove u from unsettled
    for each edge (u, v, w):
      if dist[u] + w < dist[v]:
        dist[v] = dist[u] + w
        prev[v] = u
  return dist, prev`;

const DIJKSTRA_TYPESCRIPT = `export function dijkstra(graph: Graph, source: string) {
  const dist = new Map(graph.nodes.map((n) => [n.id, Infinity]));
  dist.set(source, 0);
  const prev = new Map<string, string | null>();
  const unsettled = new Set(graph.nodes.map((n) => n.id));

  while (unsettled.size > 0) {
    let u = '';
    let best = Infinity;
    for (const id of unsettled) {
      if (dist.get(id)! < best) {
        best = dist.get(id)!;
        u = id;
      }
    }
    if (best === Infinity) break;
    unsettled.delete(u);
    for (const { node: v, edge } of neighbours(graph, u)) {
      const candidate = dist.get(u)! + edge.weight;
      if (candidate < dist.get(v)!) {
        dist.set(v, candidate);
        prev.set(v, u);
      }
    }
  }
  return { dist, prev };
}`;

const ASTAR_PSEUDOCODE = `function aStar(graph, start, goal, h):
  g[start] = 0
  f[start] = h(start)
  open = {start}
  while open is not empty:
    current = open vertex with smallest f
    if current == goal:
      return reconstructed path
    remove current from open
    for each edge (current, v, w):
      tentative = g[current] + w
      if tentative < g[v]:
        g[v] = tentative
        f[v] = tentative + h(v)
        prev[v] = current
        add v to open
  return "no path"`;

const ASTAR_TYPESCRIPT = `export function aStar(
  graph: Graph,
  start: string,
  goal: string,
  h: (id: string) => number,
) {
  const g = new Map(graph.nodes.map((n) => [n.id, Infinity]));
  g.set(start, 0);
  const f = new Map(g);
  f.set(start, h(start));
  const prev = new Map<string, string | null>();
  const open = new Set([start]);

  while (open.size > 0) {
    let current = '';
    let best = Infinity;
    for (const id of open) {
      if (f.get(id)! < best) {
        best = f.get(id)!;
        current = id;
      }
    }
    if (current === goal) break;
    open.delete(current);
    for (const { node: v, edge } of neighbours(graph, current)) {
      const tentative = g.get(current)! + edge.weight;
      if (tentative < g.get(v)!) {
        g.set(v, tentative);
        f.set(v, tentative + h(v));
        prev.set(v, current);
        open.add(v);
      }
    }
  }
  return prev;
}`;

const format = (value: number): string =>
  value === Infinity ? '∞' : String(Math.round(value * 10) / 10);

const reconstruct = (
  previous: Record<string, string | null>,
  goal: string,
): string[] => {
  const path: string[] = [];
  let current: string | null = goal;
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    seen.add(current);
    path.unshift(current);
    current = previous[current] ?? null;
  }
  return path;
};

const pathEdges = (graph: Graph, path: string[]): string[] => {
  const ids: string[] = [];
  for (let i = 0; i + 1 < path.length; i += 1) {
    const edge = graph.edges.find(
      (candidate) =>
        (candidate.from === path[i] && candidate.to === path[i + 1]) ||
        (!graph.directed &&
          candidate.from === path[i + 1] &&
          candidate.to === path[i]),
    );
    if (edge) ids.push(edge.id);
  }
  return ids;
};

export function dijkstra(
  graph: Graph,
  { start, goal }: GraphRunOptions,
): AlgorithmResult<GraphState> {
  const source = requireVertex(graph, start ?? graph.nodes[0]?.id ?? '', 'Start');
  const target = goal ? requireVertex(graph, goal, 'Goal') : null;
  for (const edge of graph.edges) {
    if (edge.weight < 0) {
      throw new InputError(
        `Dijkstra requires non-negative weights, but ${edge.from}–${edge.to} is ${edge.weight}.`,
      );
    }
  }

  const recorder = new StepRecorder<GraphState>();
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const settled: string[] = [];
  const unsettled = new Set(graph.nodes.map((node) => node.id));
  for (const node of graph.nodes) {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  }
  distances[source] = 0;

  const treeEdges: string[] = [];
  const snapshot = (overrides: Partial<GraphState> = {}): GraphState => ({
    ...createGraphState(graph),
    visited: [...settled],
    frontier: [...unsettled].filter((id) => distances[id] < Infinity),
    distances: { ...distances },
    previous: { ...previous },
    order: [...settled],
    treeEdges: [...treeEdges],
    annotations: Object.fromEntries(
      graph.nodes.map((node) => [node.id, format(distances[node.id])]),
    ),
    ...overrides,
  });

  recorder.push({
    state: snapshot({ current: source }),
    description: `Dijkstra from ${source}${target ? ` to ${target}` : ''}. Every distance starts at ∞ except the source, which is 0.`,
    operation: 'start',
    highlightedLines: [2, 3, 4],
  });

  while (unsettled.size > 0) {
    let picked: string | null = null;
    let best = Infinity;
    for (const id of unsettled) {
      recorder.count('comparisons');
      if (distances[id] < best) {
        best = distances[id];
        picked = id;
      }
    }

    if (picked === null || best === Infinity) {
      recorder.push({
        state: snapshot(),
        description:
          'Every remaining vertex still has distance ∞, so nothing else is reachable from the source. Stop.',
        operation: 'unreachable',
        highlightedLines: [5, 6],
      });
      break;
    }

    unsettled.delete(picked);
    settled.push(picked);
    const settledEdge = previous[picked]
      ? graph.edges.find(
          (edge) =>
            (edge.from === previous[picked] && edge.to === picked) ||
            (!graph.directed && edge.from === picked && edge.to === previous[picked]),
        )
      : undefined;
    if (settledEdge) treeEdges.push(settledEdge.id);

    recorder.push({
      state: snapshot({ current: picked }),
      description: `${picked} has the smallest tentative distance (${format(best)}) among unsettled vertices, so that distance is final — no later path can beat it when all weights are non-negative.`,
      operation: 'settle',
      highlightedLines: [5, 6, 7],
    });

    if (target && picked === target) {
      const path = reconstruct(previous, target);
      recorder.push({
        state: snapshot({
          current: picked,
          path,
          treeEdges: [...treeEdges, ...pathEdges(graph, path)],
        }),
        description: `${target} is settled at distance ${format(distances[target])}: ${path.join(' → ')}.`,
        operation: 'found',
        highlightedLines: [11],
      });
      return recorder.finish({
        timeComplexity: 'O(V² ) with a linear scan, O((V + E) log V) with a heap',
        spaceComplexity: 'O(V)',
        summary: `${path.join(' → ')} = ${format(distances[target])}`,
      });
    }

    for (const { node: next, edge } of neighbours(graph, picked)) {
      if (!unsettled.has(next)) continue;
      recorder.count('comparisons');
      const candidate = distances[picked] + edge.weight;
      const previousDistance = distances[next];
      const improved = candidate < previousDistance;
      if (improved) {
        distances[next] = candidate;
        previous[next] = picked;
        recorder.count('writes');
      }
      recorder.push({
        state: snapshot({ current: picked, activeEdge: edge.id }),
        description: improved
          ? `Relax ${picked}→${next}: ${format(best)} + ${edge.weight} = ${format(candidate)}, better than the old ${format(previousDistance)}. Record ${picked} as ${next}'s predecessor.`
          : `Relax ${picked}→${next}: ${format(best)} + ${edge.weight} = ${format(candidate)} is not better than ${format(previousDistance)}, so leave it.`,
        operation: improved ? 'relax' : 'no-improvement',
        highlightedLines: improved ? [8, 9, 10] : [8],
      });
    }
  }

  const summaryLines = graph.nodes
    .map((node) => `${node.id}=${format(distances[node.id])}`)
    .join(', ');
  recorder.push({
    state: snapshot(),
    description: `All reachable vertices are settled. Shortest distances from ${source}: ${summaryLines}.`,
    operation: 'done',
    highlightedLines: [11],
  });

  return recorder.finish({
    timeComplexity: 'O(V²) with a linear scan, O((V + E) log V) with a heap',
    spaceComplexity: 'O(V)',
    summary: summaryLines,
  });
}

/**
 * Straight-line distance in layout space, scaled so it can never overestimate.
 *
 * `k` is the cheapest weight-per-layout-unit of any edge, so any real path of
 * layout length d costs at least k·d, and the straight line is the shortest
 * possible layout length. That makes `k × straightLine` admissible.
 */
export function heuristicFor(
  graph: Graph,
  goal: string,
): { h: (id: string) => number; scale: number } {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const target = byId.get(goal);
  const layoutDistance = (a: string, b: string): number => {
    const from = byId.get(a);
    const to = byId.get(b);
    if (!from || !to) return 0;
    return Math.hypot(from.x - to.x, from.y - to.y);
  };

  let scale = Infinity;
  for (const edge of graph.edges) {
    const span = layoutDistance(edge.from, edge.to);
    if (span > 0) scale = Math.min(scale, edge.weight / span);
  }
  if (!Number.isFinite(scale)) scale = 0;

  return {
    scale,
    h: (id: string): number =>
      target ? scale * layoutDistance(id, goal) : 0,
  };
}

export function aStar(
  graph: Graph,
  { start, goal }: GraphRunOptions,
): AlgorithmResult<GraphState> {
  const source = requireVertex(graph, start ?? graph.nodes[0]?.id ?? '', 'Start');
  if (!goal) throw new InputError('A* needs a goal vertex.');
  const target = requireVertex(graph, goal, 'Goal');

  const recorder = new StepRecorder<GraphState>();
  const { h, scale } = heuristicFor(graph, target);
  const g: Record<string, number> = {};
  const f: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  for (const node of graph.nodes) {
    g[node.id] = Infinity;
    f[node.id] = Infinity;
    previous[node.id] = null;
  }
  g[source] = 0;
  f[source] = h(source);

  const open = new Set<string>([source]);
  const closed: string[] = [];

  const snapshot = (overrides: Partial<GraphState> = {}): GraphState => ({
    ...createGraphState(graph),
    visited: [...closed],
    frontier: [...open],
    distances: { ...g },
    previous: { ...previous },
    order: [...closed],
    treeEdges: [],
    annotations: Object.fromEntries(
      graph.nodes.map((node) => [
        node.id,
        g[node.id] === Infinity
          ? '∞'
          : `g${format(g[node.id])} h${format(h(node.id))} f${format(f[node.id])}`,
      ]),
    ),
    ...overrides,
  });

  recorder.push({
    state: snapshot({ current: source }),
    description: `A* from ${source} to ${target}. It ranks the open set by f = g + h, where g is the cost so far and h estimates what is left. Here h is the straight-line layout distance scaled by ${format(scale)}, the cheapest weight per unit of any edge — that guarantees h never overestimates, which is what makes A* optimal.`,
    operation: 'start',
    highlightedLines: [2, 3, 4],
  });

  while (open.size > 0) {
    let current: string | null = null;
    let best = Infinity;
    for (const id of open) {
      recorder.count('comparisons');
      if (f[id] < best) {
        best = f[id];
        current = id;
      }
    }
    if (current === null) break;

    recorder.push({
      state: snapshot({ current }),
      description: `${current} has the smallest f (${format(f[current])} = g ${format(g[current])} + h ${format(h(current))}), so expand it next.`,
      operation: 'expand',
      highlightedLines: [5, 6],
    });

    if (current === target) {
      const path = reconstruct(previous, target);
      recorder.push({
        state: snapshot({
          current,
          path,
          treeEdges: pathEdges(graph, path),
        }),
        description: `Reached ${target} with cost ${format(g[target])}: ${path.join(' → ')}. A* expanded ${closed.length + 1} vertices.`,
        operation: 'found',
        highlightedLines: [6, 7],
      });
      return recorder.finish({
        timeComplexity: 'O(E log V) with a priority queue',
        spaceComplexity: 'O(V)',
        summary: `${path.join(' → ')} = ${format(g[target])}`,
      });
    }

    open.delete(current);
    closed.push(current);

    for (const { node: next, edge } of neighbours(graph, current)) {
      recorder.count('comparisons');
      const tentative = g[current] + edge.weight;
      const improved = tentative < g[next];
      if (improved) {
        g[next] = tentative;
        f[next] = tentative + h(next);
        previous[next] = current;
        open.add(next);
        recorder.count('writes');
      }
      recorder.push({
        state: snapshot({ current, activeEdge: edge.id }),
        description: improved
          ? `${current}→${next} costs ${format(tentative)}; with h ${format(h(next))} that gives f ${format(f[next])}. Add ${next} to the open set.`
          : `${current}→${next} costs ${format(tentative)}, which does not beat ${next}'s known g of ${format(g[next])}. Skip.`,
        operation: improved ? 'relax' : 'no-improvement',
        highlightedLines: improved ? [10, 11, 12, 13, 14] : [9, 10],
      });
    }
  }

  recorder.push({
    state: snapshot(),
    description: `The open set is empty and ${target} was never reached, so no path exists from ${source}.`,
    operation: 'no-path',
    highlightedLines: [15],
  });

  return recorder.finish({
    timeComplexity: 'O(E log V) with a priority queue',
    spaceComplexity: 'O(V)',
    summary: 'No path.',
  });
}

export const dijkstraSpec: GraphAlgorithmSpec = {
  id: 'dijkstra',
  name: "Dijkstra's Algorithm",
  tagline: 'Settle the closest unvisited vertex, then relax its edges.',
  needsStart: true,
  needsGoal: true,
  requires: 'none',
  run: dijkstra,
  code: {
    pseudocode: DIJKSTRA_PSEUDOCODE,
    typescript: DIJKSTRA_TYPESCRIPT,
    lineMap: {
      1: [1], 2: [2], 3: [3], 4: [5], 5: [7], 6: [8, 9, 10, 11, 12, 13, 14, 15],
      7: [17], 8: [18, 19], 9: [20], 10: [21], 11: [25],
    },
  },
  complexity: {
    best: 'O((V + E) log V)',
    average: 'O((V + E) log V)',
    worst: 'O(V²) with a linear scan',
    space: 'O(V)',
  },
  learn: {
    what: "Dijkstra's algorithm finds shortest paths from one source in a graph with non-negative weights. It keeps a tentative distance for every vertex, repeatedly settles the unsettled vertex with the smallest tentative distance, and relaxes its outgoing edges. The settled distance is provably final: with no negative weights, no path through a vertex that is still further away could ever come back cheaper.",
    how: [
      'Set every distance to ∞ except the source, which is 0.',
      'Pick the unsettled vertex with the smallest tentative distance.',
      'Mark it settled — its distance is now final.',
      'For each edge out of it, check whether going through it beats the neighbour’s current distance.',
      'If it does, lower that distance and record the predecessor.',
      'Repeat until every reachable vertex is settled; follow predecessors backwards to rebuild a path.',
    ],
    useCases: [
      'Routing and navigation on road or network graphs.',
      'Link-state routing protocols such as OSPF.',
      'Any least-cost problem over non-negative costs — latency, fuel, money.',
    ],
    pros: [
      'Gives optimal shortest paths from one source to every vertex at once.',
      'With a binary heap it runs in O((V + E) log V).',
      'Stopping early when the target settles is still correct.',
    ],
    cons: [
      'Breaks on negative weights — a later cheaper route can contradict a settled vertex. Use Bellman-Ford.',
      'Explores in all directions, so it does far more work than A* when there is a single known goal.',
      'A naive linear scan for the minimum makes it O(V²).',
    ],
    challenge:
      'From A, settle vertices one at a time and write down the order. Compare it with BFS: find a vertex BFS reaches in fewer hops but Dijkstra settles later, and explain which answer each question wants.',
  },
};

export const aStarSpec: GraphAlgorithmSpec = {
  id: 'a-star',
  name: 'A* Search',
  tagline: 'Dijkstra plus a heuristic that aims at the goal.',
  needsStart: true,
  needsGoal: true,
  requires: 'none',
  run: aStar,
  code: {
    pseudocode: ASTAR_PSEUDOCODE,
    typescript: ASTAR_TYPESCRIPT,
    lineMap: {
      1: [1], 2: [8], 3: [10], 4: [12], 5: [14], 6: [15, 16, 17, 18, 19, 20, 21],
      7: [23], 8: [23], 9: [25], 10: [26, 27], 11: [28], 12: [29], 13: [30], 14: [31], 15: [36],
    },
  },
  complexity: {
    best: 'O(E)',
    average: 'O(E log V)',
    worst: 'O(E log V)',
    space: 'O(V)',
  },
  learn: {
    what: 'A* is Dijkstra with a sense of direction. Instead of always expanding the cheapest-so-far vertex (g), it expands the one with the smallest f = g + h, where h is an estimate of the remaining cost to the goal. If h never overestimates — if it is *admissible* — A* still returns an optimal path, but it can skip huge parts of the graph that obviously lead away from the goal.',
    how: [
      'Keep g (best known cost from the start) and f = g + h for every vertex.',
      'Put the start in the open set.',
      'Repeatedly expand the open vertex with the smallest f.',
      'When the goal is expanded, follow the predecessors back to build the path.',
      'For each neighbour, if going through the current vertex gives a smaller g, update g, f and the predecessor, and (re-)open it.',
      'h ≡ 0 makes A* behave exactly like Dijkstra; a perfect h walks straight to the goal.',
    ],
    useCases: [
      'Game pathfinding on grids and navigation meshes.',
      'Robot motion planning.',
      'Puzzle solving — the 15-puzzle with a Manhattan-distance heuristic.',
    ],
    pros: [
      'Optimal whenever the heuristic is admissible.',
      'Usually expands far fewer vertices than Dijkstra for a single goal.',
      'The heuristic is a tuning knob: better estimate, less search.',
    ],
    cons: [
      'An inadmissible heuristic silently returns non-optimal paths.',
      'Still holds the whole open set in memory.',
      'Needs a meaningful estimate, which some graphs simply do not have.',
      'With one source and many goals, Dijkstra does less total work.',
    ],
    challenge:
      'Run Dijkstra and A* between the same pair and compare how many vertices each expands. Then note what would happen if the heuristic were doubled — still fast, but would the path still be optimal?',
  },
};
