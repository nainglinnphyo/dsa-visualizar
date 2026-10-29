import type { TreeState } from '@/algorithms/structures/tree';

export interface PositionedNode {
  id: string;
  value: number;
  height: number;
  x: number;
  y: number;
  depth: number;
}

export interface TreeLayout {
  nodes: PositionedNode[];
  edges: { from: PositionedNode; to: PositionedNode; side: 'left' | 'right' }[];
  width: number;
  height: number;
}

export const X_GAP = 46;
export const Y_GAP = 62;
export const NODE_RADIUS = 17;
const PADDING = NODE_RADIUS + 6;

/**
 * Classic in-order layout: x comes from the in-order rank (so no two nodes
 * overlap and the drawing preserves ordering), y from the depth.
 */
export function layoutTree(state: TreeState): TreeLayout {
  const nodes: PositionedNode[] = [];
  const byId = new Map<string, PositionedNode>();
  let column = 0;
  let maxDepth = 0;

  const walk = (id: string | null, depth: number): void => {
    if (!id || !state.nodes[id]) return;
    const node = state.nodes[id];
    walk(node.left, depth + 1);
    const positioned: PositionedNode = {
      id,
      value: node.value,
      height: node.height,
      x: PADDING + column * X_GAP,
      y: PADDING + depth * Y_GAP,
      depth,
    };
    column += 1;
    maxDepth = Math.max(maxDepth, depth);
    nodes.push(positioned);
    byId.set(id, positioned);
    walk(node.right, depth + 1);
  };

  walk(state.root, 0);

  const edges: TreeLayout['edges'] = [];
  for (const positioned of nodes) {
    const node = state.nodes[positioned.id];
    for (const side of ['left', 'right'] as const) {
      const childId = node[side];
      const child = childId ? byId.get(childId) : undefined;
      if (child) edges.push({ from: positioned, to: child, side });
    }
  }

  return {
    nodes,
    edges,
    width: Math.max(1, column) * X_GAP + PADDING,
    height: (maxDepth + 1) * Y_GAP + PADDING,
  };
}
