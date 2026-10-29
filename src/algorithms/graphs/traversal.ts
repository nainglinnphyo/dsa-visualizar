import { StepRecorder } from '@/engine/recorder';
import type { AlgorithmResult } from '@/engine/types';
import {
  createGraphState,
  neighbours,
  requireVertex,
  type Graph,
  type GraphState,
} from './model';
import type { GraphAlgorithmSpec, GraphRunOptions } from './types';

const BFS_PSEUDOCODE = `function bfs(graph, start):
  visited = {start}
  queue = [start]
  while queue is not empty:
    node = queue.removeFirst()
    visit(node)
    for each neighbour of node:
      if neighbour not in visited:
        visited.add(neighbour)
        queue.append(neighbour)
  return visit order`;

const BFS_TYPESCRIPT = `export function bfs(graph: Graph, start: string): string[] {
  const visited = new Set([start]);
  const queue: string[] = [start];
  const order: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);
    for (const { node: next } of neighbours(graph, node)) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return order;
}`;

const DFS_PSEUDOCODE = `function dfs(graph, node, visited):
  if node in visited:
    return
  visited.add(node)
  visit(node)
  for each neighbour of node:
    dfs(graph, neighbour, visited)`;

const DFS_TYPESCRIPT = `export function dfs(
  graph: Graph,
  node: string,
  visited = new Set<string>(),
  order: string[] = [],
): string[] {
  if (visited.has(node)) {
    return order;
  }
  visited.add(node);
  order.push(node);
  for (const { node: next } of neighbours(graph, node)) {
    dfs(graph, next, visited, order);
  }
  return order;
}`;

export function breadthFirstSearch(
  graph: Graph,
  { start }: GraphRunOptions,
): AlgorithmResult<GraphState> {
  const source = requireVertex(graph, start ?? graph.nodes[0]?.id ?? '', 'Start');
  const recorder = new StepRecorder<GraphState>();
  const visited = new Set<string>([source]);
  const order: string[] = [];
  const treeEdges: string[] = [];
  const queue: string[] = [source];

  const snapshot = (overrides: Partial<GraphState> = {}): GraphState => ({
    ...createGraphState(graph),
    visited: [...order],
    frontier: [...queue],
    order: [...order],
    treeEdges: [...treeEdges],
    annotations: Object.fromEntries(
      [...visited].map((id) => [id, 'seen']),
    ),
    ...overrides,
  });

  recorder.push({
    state: snapshot({ current: source }),
    description: `Start BFS at ${source}. The queue holds the frontier, so vertices come out in order of how many edges they are from ${source}.`,
    operation: 'start',
    highlightedLines: [2, 3],
  });

  while (queue.length > 0) {
    const node = queue.shift() as string;
    recorder.push({
      state: snapshot({ current: node }),
      description: `Take ${node} off the front of the queue.`,
      operation: 'dequeue',
      highlightedLines: [4, 5],
    });

    order.push(node);
    recorder.count('reads');
    recorder.push({
      state: snapshot({ current: node }),
      description: `Visit ${node}. Order so far: ${order.join(' → ')}.`,
      operation: 'visit',
      highlightedLines: [6],
    });

    for (const { node: next, edge } of neighbours(graph, node)) {
      recorder.count('comparisons');
      const seen = visited.has(next);
      recorder.push({
        state: snapshot({ current: node, activeEdge: edge.id }),
        description: `Edge ${node}–${next}: ${
          seen ? `${next} has already been queued, skip it.` : `${next} is new, so mark it seen and queue it.`
        }`,
        operation: seen ? 'skip' : 'discover',
        highlightedLines: [7, 8],
      });
      if (seen) continue;
      visited.add(next);
      queue.push(next);
      treeEdges.push(edge.id);
      recorder.push({
        state: snapshot({ current: node, activeEdge: edge.id }),
        description: `Queue is now [${queue.join(', ')}].`,
        operation: 'enqueue',
        highlightedLines: [9, 10],
      });
    }
  }

  const unreached = graph.nodes.filter((node) => !visited.has(node.id));
  recorder.push({
    state: snapshot(),
    description: `BFS finished: ${order.join(' → ')}.${
      unreached.length
        ? ` ${unreached.map((n) => n.id).join(', ')} ${unreached.length === 1 ? 'was' : 'were'} never reached — not connected to ${source}.`
        : ' Every vertex was reachable.'
    }`,
    operation: 'done',
    highlightedLines: [11],
  });

  return recorder.finish({
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    summary: order.join(' → '),
  });
}

export function depthFirstSearch(
  graph: Graph,
  { start }: GraphRunOptions,
): AlgorithmResult<GraphState> {
  const source = requireVertex(graph, start ?? graph.nodes[0]?.id ?? '', 'Start');
  const recorder = new StepRecorder<GraphState>();
  const visited = new Set<string>();
  const order: string[] = [];
  const treeEdges: string[] = [];
  const stack: string[] = [];

  const snapshot = (overrides: Partial<GraphState> = {}): GraphState => ({
    ...createGraphState(graph),
    visited: [...order],
    frontier: [...stack],
    order: [...order],
    treeEdges: [...treeEdges],
    ...overrides,
  });

  recorder.push({
    state: snapshot({ current: source }),
    description: `Start DFS at ${source}. Each call goes as deep as it can before backtracking, so the frontier here is the call stack.`,
    operation: 'start',
    highlightedLines: [1],
  });

  const visit = (node: string, edgeIn: string | null, depth: number): void => {
    recorder.set('depth', depth);
    recorder.count('comparisons');
    if (visited.has(node)) {
      recorder.push({
        state: snapshot({ current: node, activeEdge: edgeIn }),
        description: `${node} has already been visited — return immediately.`,
        operation: 'skip',
        highlightedLines: [2, 3],
      });
      return;
    }

    stack.push(node);
    visited.add(node);
    order.push(node);
    if (edgeIn) treeEdges.push(edgeIn);
    recorder.count('reads');
    recorder.push({
      state: snapshot({ current: node, activeEdge: edgeIn }),
      description: `Visit ${node} at depth ${depth}. Call stack: ${stack.join(' → ')}.`,
      operation: 'visit',
      highlightedLines: [4, 5],
    });

    for (const { node: next, edge } of neighbours(graph, node)) {
      recorder.push({
        state: snapshot({ current: node, activeEdge: edge.id }),
        description: `Recurse from ${node} into ${next}.`,
        operation: 'recurse',
        highlightedLines: [6, 7],
      });
      visit(next, edge.id, depth + 1);
      recorder.set('depth', depth);
    }

    stack.pop();
    recorder.push({
      state: snapshot({ current: node }),
      description: `${node} has no unexplored neighbours left — backtrack. Call stack: ${stack.join(' → ') || 'empty'}.`,
      operation: 'backtrack',
      highlightedLines: [6, 7],
    });
  };

  visit(source, null, 1);
  recorder.set('depth', 0);

  const unreached = graph.nodes.filter((node) => !visited.has(node.id));
  recorder.push({
    state: snapshot(),
    description: `DFS finished: ${order.join(' → ')}.${
      unreached.length
        ? ` ${unreached.map((n) => n.id).join(', ')} ${unreached.length === 1 ? 'was' : 'were'} never reached.`
        : ''
    }`,
    operation: 'done',
    highlightedLines: [7],
  });

  return recorder.finish({
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V) recursion stack',
    summary: order.join(' → '),
  });
}

export const bfsSpec: GraphAlgorithmSpec = {
  id: 'bfs',
  name: 'Breadth-First Search',
  tagline: 'Explore level by level using a queue.',
  needsStart: true,
  needsGoal: false,
  requires: 'none',
  run: breadthFirstSearch,
  code: {
    pseudocode: BFS_PSEUDOCODE,
    typescript: BFS_TYPESCRIPT,
    lineMap: {
      1: [1], 2: [2], 3: [3], 4: [5], 5: [6], 6: [7], 7: [8], 8: [9], 9: [10], 10: [11], 11: [15],
    },
  },
  complexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
    space: 'O(V)',
  },
  learn: {
    what: 'Breadth-first search explores a graph in rings around the start: first everything one edge away, then everything two edges away, and so on. A FIFO queue is what enforces that ordering. On an unweighted graph the order a vertex is dequeued is exactly its shortest-edge-count distance from the source, which is why BFS solves unweighted shortest paths.',
    how: [
      'Mark the start as seen and put it in the queue.',
      'Take the front vertex off the queue and visit it.',
      'Look at each of its neighbours.',
      'Any neighbour not yet seen is marked and pushed to the back of the queue.',
      'Repeat until the queue drains. Vertices never reached were not connected to the start.',
      'Mark on discovery, not on dequeue — otherwise a vertex can enter the queue twice.',
    ],
    useCases: [
      'Shortest path in an unweighted graph or grid maze.',
      'Finding connected components, and testing bipartiteness.',
      'Crawling and "degrees of separation" queries.',
      'Level-order traversal of a tree is BFS on a tree.',
    ],
    pros: [
      'Finds the fewest-edge path, which DFS does not.',
      'O(V + E) — every vertex and edge is touched once.',
      'Iterative, so no risk of blowing the call stack.',
    ],
    cons: [
      'The queue can hold a whole level, which is O(V) memory on wide graphs.',
      'Ignores edge weights, so it is wrong for weighted shortest paths — use Dijkstra.',
      'Explores in every direction, with no sense of a goal.',
    ],
    challenge:
      'Run BFS and Dijkstra from A on the sample graph and compare the orders. Find a vertex that BFS reaches in fewer edges but at a higher total weight.',
  },
};

export const dfsSpec: GraphAlgorithmSpec = {
  id: 'dfs',
  name: 'Depth-First Search',
  tagline: 'Follow one path as far as possible, then backtrack.',
  needsStart: true,
  needsGoal: false,
  requires: 'none',
  run: depthFirstSearch,
  code: {
    pseudocode: DFS_PSEUDOCODE,
    typescript: DFS_TYPESCRIPT,
    lineMap: { 1: [1], 2: [7], 3: [8], 4: [10], 5: [11], 6: [13], 7: [14] },
  },
  complexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
    space: 'O(V)',
  },
  learn: {
    what: 'Depth-first search commits to one branch and follows it until it dead-ends, then backtracks to the last vertex with an unexplored neighbour. The recursion call stack *is* the frontier. It visits exactly the same vertices as BFS, just in a very different order, and the structure of its backtracking is what makes cycle detection, topological sorting and strongly-connected components possible.',
    how: [
      'Mark the current vertex as visited and emit it.',
      'Take its first unvisited neighbour and recurse into it.',
      'Keep descending until the current vertex has no unvisited neighbours.',
      'Return — that is the backtrack — and try the next neighbour of the caller.',
      'Check "already visited" on entry, otherwise a cycle makes the recursion run forever.',
    ],
    useCases: [
      'Cycle detection and topological sorting.',
      'Finding connected and strongly connected components.',
      'Maze generation and backtracking search (N-Queens, Sudoku).',
      'Walking a filesystem or expression tree.',
    ],
    pros: [
      'O(V + E), and uses memory proportional to the depth rather than the width.',
      'Very short to write recursively.',
      'Backtracking order exposes structure BFS cannot see.',
    ],
    cons: [
      'The path it finds is usually not the shortest.',
      'Deep graphs can overflow the call stack — an explicit stack avoids that.',
      'The visit order depends on neighbour ordering, so it is less predictable.',
    ],
    challenge:
      'Run DFS and BFS from the same start and write down both orders. Find a vertex where DFS’s path is longer than BFS’s, then explain from the frontier why that happens.',
  },
};
