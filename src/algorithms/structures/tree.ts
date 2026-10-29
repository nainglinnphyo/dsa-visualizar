import { StepRecorder } from '@/engine/recorder';
import { InputError, type AlgorithmResult } from '@/engine/types';
import type { CodeSource } from '@/engine/code';
import type { ComplexityInfo } from '@/types/learning';

export type TreeMode = 'bst' | 'avl';

/** Which child pointer a recursive step should write back into. */
type Side = 'left' | 'right' | null;

export interface TreeNode {
  id: string;
  value: number;
  left: string | null;
  right: string | null;
  height: number;
}

export interface TreeState {
  nodes: Record<string, TreeNode>;
  root: string | null;
  mode: TreeMode;
  /** Node the algorithm is currently looking at. */
  cursor: string | null;
  /** Nodes just involved in a comparison. */
  compared: string[];
  /** Nodes whose links were just rewired by a rotation. */
  rotated: string[];
  /** Nodes already emitted by a traversal. */
  visited: string[];
  /** Traversal output so far. */
  output: number[];
  found: string | null;
  detaching: string | null;
  /** Nodes currently in the level-order queue. */
  queue: string[];
}

export const MAX_TREE_NODES = 31;

let counter = 0;
const nextId = (): string => {
  counter += 1;
  return `t${counter}`;
};

export function createTree(values: number[] = [], mode: TreeMode = 'bst'): TreeState {
  let state: TreeState = {
    nodes: {},
    root: null,
    mode,
    cursor: null,
    compared: [],
    rotated: [],
    visited: [],
    output: [],
    found: null,
    detaching: null,
    queue: [],
  };
  for (const value of values) {
    const result = treeInsert(state, value);
    state = result.steps[result.steps.length - 1].state;
  }
  return { ...state, cursor: null, compared: [], rotated: [], found: null };
}

const cloneNodes = (nodes: Record<string, TreeNode>): Record<string, TreeNode> =>
  Object.fromEntries(Object.entries(nodes).map(([id, node]) => [id, { ...node }]));

export const inorderValues = (state: TreeState): number[] => {
  const out: number[] = [];
  const walk = (id: string | null): void => {
    if (!id) return;
    walk(state.nodes[id].left);
    out.push(state.nodes[id].value);
    walk(state.nodes[id].right);
  };
  walk(state.root);
  return out;
};

export const treeSize = (state: TreeState): number =>
  Object.keys(state.nodes).length;

export const treeHeight = (state: TreeState): number => {
  const walk = (id: string | null): number =>
    id === null ? 0 : 1 + Math.max(walk(state.nodes[id].left), walk(state.nodes[id].right));
  return walk(state.root);
};

const requireValue = (value: number): number => {
  if (!Number.isInteger(value) || Math.abs(value) > 999) {
    throw new InputError('Enter a whole number between −999 and 999.');
  }
  return value;
};

/* ----------------------------------------------------------------- code */

const bstInsertCode: CodeSource = {
  pseudocode: `function insert(node, value):
  if node == null:
    return new Node(value)
  if value < node.value:
    node.left = insert(node.left, value)
  else if value > node.value:
    node.right = insert(node.right, value)
  else:
    return node            // duplicate, ignore
  return node`,
  typescript: `function insert(node: Node | null, value: number): Node {
  if (node === null) {
    return { value, left: null, right: null };
  }
  if (value < node.value) {
    node.left = insert(node.left, value);
  } else if (value > node.value) {
    node.right = insert(node.right, value);
  }
  return node;
}`,
  lineMap: { 1: [1], 2: [2], 3: [3], 4: [5], 5: [6], 6: [7], 7: [8], 8: [10], 9: [10], 10: [10] },
};

const avlInsertCode: CodeSource = {
  pseudocode: `function insert(node, value):
  if node == null: return new Node(value)
  if value < node.value: node.left = insert(node.left, value)
  else if value > node.value: node.right = insert(node.right, value)
  else: return node
  node.height = 1 + max(height(node.left), height(node.right))
  balance = height(node.left) - height(node.right)
  if balance > 1 and value < node.left.value:
    return rotateRight(node)              // left-left
  if balance < -1 and value > node.right.value:
    return rotateLeft(node)               // right-right
  if balance > 1:
    node.left = rotateLeft(node.left)     // left-right
    return rotateRight(node)
  if balance < -1:
    node.right = rotateRight(node.right)  // right-left
    return rotateLeft(node)
  return node`,
  typescript: `function insert(node: Node | null, value: number): Node {
  if (node === null) return { value, left: null, right: null, height: 1 };
  if (value < node.value) node.left = insert(node.left, value);
  else if (value > node.value) node.right = insert(node.right, value);
  else return node;

  node.height = 1 + Math.max(height(node.left), height(node.right));
  const balance = height(node.left) - height(node.right);

  if (balance > 1 && value < node.left!.value) return rotateRight(node);
  if (balance < -1 && value > node.right!.value) return rotateLeft(node);
  if (balance > 1) {
    node.left = rotateLeft(node.left!);
    return rotateRight(node);
  }
  if (balance < -1) {
    node.right = rotateRight(node.right!);
    return rotateLeft(node);
  }
  return node;
}`,
  lineMap: {
    1: [1], 2: [2], 3: [3], 4: [4], 5: [5], 6: [7], 7: [8],
    8: [10], 9: [10], 10: [11], 11: [11], 12: [12], 13: [13], 14: [14],
    15: [16], 16: [17], 17: [18], 18: [20],
  },
};

const searchCode: CodeSource = {
  pseudocode: `function search(node, target):
  while node != null:
    if target == node.value:
      return node
    if target < node.value:
      node = node.left
    else:
      node = node.right
  return null`,
  typescript: `function search(root: Node | null, target: number): Node | null {
  let node = root;
  while (node) {
    if (target === node.value) {
      return node;
    }
    node = target < node.value ? node.left : node.right;
  }
  return null;
}`,
  lineMap: { 1: [1], 2: [3], 3: [4], 4: [5], 5: [7], 6: [7], 7: [7], 8: [7], 9: [9] },
};

const deleteCode: CodeSource = {
  pseudocode: `function remove(node, value):
  if node == null: return null
  if value < node.value:
    node.left = remove(node.left, value)
  else if value > node.value:
    node.right = remove(node.right, value)
  else:
    if node.left == null: return node.right
    if node.right == null: return node.left
    successor = min(node.right)
    node.value = successor.value
    node.right = remove(node.right, successor.value)
  return node`,
  typescript: `function remove(node: Node | null, value: number): Node | null {
  if (node === null) return null;
  if (value < node.value) {
    node.left = remove(node.left, value);
  } else if (value > node.value) {
    node.right = remove(node.right, value);
  } else {
    if (node.left === null) return node.right;
    if (node.right === null) return node.left;
    const successor = min(node.right);
    node.value = successor.value;
    node.right = remove(node.right, successor.value);
  }
  return node;
}`,
  lineMap: {
    1: [1], 2: [2], 3: [3], 4: [4], 5: [5], 6: [6], 7: [7],
    8: [8], 9: [9], 10: [10], 11: [11], 12: [12], 13: [15],
  },
};

const traversalCode: CodeSource = {
  pseudocode: `function inorder(node):      // left, self, right
  if node == null: return
  inorder(node.left)
  visit(node)
  inorder(node.right)

function preorder(node):     // self, left, right
  visit(node); preorder(node.left); preorder(node.right)

function postorder(node):    // left, right, self
  postorder(node.left); postorder(node.right); visit(node)

function levelOrder(root):   // breadth first
  queue = [root]
  while queue is not empty:
    node = queue.removeFirst()
    visit(node)
    push node.left and node.right if they exist`,
  typescript: `function inorder(node: Node | null, out: number[]): void {
  if (!node) return;
  inorder(node.left, out);
  out.push(node.value);
  inorder(node.right, out);
}

function levelOrder(root: Node | null): number[] {
  const out: number[] = [];
  const queue: Node[] = root ? [root] : [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    out.push(node.value);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return out;
}`,
  lineMap: {
    1: [1], 2: [2], 3: [3], 4: [4], 5: [5],
    14: [8], 15: [10], 16: [11], 17: [12], 18: [13], 19: [14, 15],
  },
};

/* ------------------------------------------------------------ insertion */

export function treeInsert(
  state: TreeState,
  rawValue: number,
): AlgorithmResult<TreeState> {
  const value = requireValue(rawValue);
  if (treeSize(state) >= MAX_TREE_NODES) {
    throw new InputError(
      `This visualizer caps the tree at ${MAX_TREE_NODES} nodes.`,
    );
  }

  const recorder = new StepRecorder<TreeState>();
  const nodes = cloneNodes(state.nodes);
  const isAvl = state.mode === 'avl';
  let currentRoot = state.root;

  const snapshot = (overrides: Partial<TreeState> = {}): TreeState => ({
    ...state,
    nodes: cloneNodes(nodes),
    root: currentRoot,
    cursor: null,
    compared: [],
    rotated: [],
    visited: [],
    output: [],
    found: null,
    detaching: null,
    queue: [],
    ...overrides,
  });

  /**
   * Re-points a parent (or the root) at a new child. Rotations call this
   * *before* recording, so every snapshot shows a consistent tree.
   */
  const link = (
    parent: string | null,
    side: Side,
    child: string | null,
  ): void => {
    if (parent === null || side === null) currentRoot = child;
    else nodes[parent][side] = child;
  };

  const height = (id: string | null): number => (id ? nodes[id].height : 0);
  const refresh = (id: string): void => {
    nodes[id].height =
      1 + Math.max(height(nodes[id].left), height(nodes[id].right));
  };

  const rotateRight = (y: string): string => {
    const x = nodes[y].left as string;
    nodes[y].left = nodes[x].right;
    nodes[x].right = y;
    refresh(y);
    refresh(x);
    return x;
  };
  const rotateLeft = (x: string): string => {
    const y = nodes[x].right as string;
    nodes[x].right = nodes[y].left;
    nodes[y].left = x;
    refresh(x);
    refresh(y);
    return y;
  };

  recorder.push({
    state: snapshot({ cursor: currentRoot }),
    description:
      currentRoot === null
        ? `The tree is empty, so ${value} becomes the root.`
        : `Insert ${value}. Walk down from the root: smaller values go left, larger go right.`,
    operation: 'start',
    highlightedLines: [1],
  });

  let duplicate = false;

  const insert = (
    id: string | null,
    parent: string | null,
    side: Side,
    depth: number,
  ): void => {
    recorder.set('depth', depth);
    if (id === null) {
      const newId = nextId();
      nodes[newId] = { id: newId, value, left: null, right: null, height: 1 };
      link(parent, side, newId);
      recorder.count('writes');
      recorder.push({
        state: snapshot({ cursor: newId, found: newId }),
        description: `Reached an empty spot at depth ${depth} — create the node holding ${value} here.`,
        operation: 'create',
        highlightedLines: [2, 3],
      });
      return;
    }

    recorder.count('comparisons');
    const node = nodes[id];
    recorder.push({
      state: snapshot({ cursor: id, compared: [id] }),
      description: `Compare ${value} with ${node.value} — go ${
        value < node.value
          ? 'left'
          : value > node.value
            ? 'right'
            : 'nowhere, the value is already here'
      }.`,
      operation: 'compare',
      highlightedLines:
        value < node.value ? [4, 5] : value > node.value ? [6, 7] : [8, 9],
    });

    if (value < node.value) {
      insert(node.left, id, 'left', depth + 1);
    } else if (value > node.value) {
      insert(node.right, id, 'right', depth + 1);
    } else {
      duplicate = true;
      return;
    }

    if (!isAvl) return;

    refresh(id);
    const balance = height(nodes[id].left) - height(nodes[id].right);
    if (Math.abs(balance) <= 1) return;

    recorder.push({
      state: snapshot({ cursor: id, compared: [id] }),
      description: `Node ${nodes[id].value} now has balance factor ${balance} (left height ${height(nodes[id].left)}, right height ${height(nodes[id].right)}). |balance| > 1, so AVL must rotate.`,
      operation: 'imbalance',
      highlightedLines: [6, 7],
    });

    const leftChild = nodes[id].left;
    const rightChild = nodes[id].right;

    if (balance > 1 && leftChild !== null && value < nodes[leftChild].value) {
      const pivot = nodes[id].value;
      const newRoot = rotateRight(id);
      link(parent, side, newRoot);
      recorder.push({
        state: snapshot({ rotated: [newRoot, id], cursor: newRoot }),
        description: `Left-left case: rotate right around ${pivot}. ${nodes[newRoot].value} becomes the subtree root.`,
        operation: 'rotate-right',
        highlightedLines: [8, 9],
      });
      return;
    }
    if (balance < -1 && rightChild !== null && value > nodes[rightChild].value) {
      const pivot = nodes[id].value;
      const newRoot = rotateLeft(id);
      link(parent, side, newRoot);
      recorder.push({
        state: snapshot({ rotated: [newRoot, id], cursor: newRoot }),
        description: `Right-right case: rotate left around ${pivot}. ${nodes[newRoot].value} becomes the subtree root.`,
        operation: 'rotate-left',
        highlightedLines: [10, 11],
      });
      return;
    }
    if (balance > 1 && leftChild !== null) {
      const childValue = nodes[leftChild].value;
      const lifted = rotateLeft(leftChild);
      nodes[id].left = lifted;
      recorder.push({
        state: snapshot({ rotated: [lifted, leftChild], cursor: id }),
        description: `Left-right case, step 1: rotate left around the left child ${childValue} to turn this into a left-left case.`,
        operation: 'rotate-left',
        highlightedLines: [12, 13],
      });
      const pivot = nodes[id].value;
      const newRoot = rotateRight(id);
      link(parent, side, newRoot);
      recorder.push({
        state: snapshot({ rotated: [newRoot, id], cursor: newRoot }),
        description: `Left-right case, step 2: rotate right around ${pivot}.`,
        operation: 'rotate-right',
        highlightedLines: [14],
      });
      return;
    }
    if (balance < -1 && rightChild !== null) {
      const childValue = nodes[rightChild].value;
      const lifted = rotateRight(rightChild);
      nodes[id].right = lifted;
      recorder.push({
        state: snapshot({ rotated: [lifted, rightChild], cursor: id }),
        description: `Right-left case, step 1: rotate right around the right child ${childValue} to turn this into a right-right case.`,
        operation: 'rotate-right',
        highlightedLines: [15, 16],
      });
      const pivot = nodes[id].value;
      const newRoot = rotateLeft(id);
      link(parent, side, newRoot);
      recorder.push({
        state: snapshot({ rotated: [newRoot, id], cursor: newRoot }),
        description: `Right-left case, step 2: rotate left around ${pivot}.`,
        operation: 'rotate-left',
        highlightedLines: [17],
      });
    }
  };

  insert(currentRoot, null, null, 1);
  recorder.set('depth', 0);

  const size = Object.keys(nodes).length;
  recorder.push({
    state: snapshot(),
    description: duplicate
      ? `${value} is already in the tree. A BST keeps keys unique, so nothing changed.`
      : isAvl
        ? `Inserted ${value}. Height is ${heightOf(nodes, currentRoot)} for ${size} node${size === 1 ? '' : 's'} — AVL keeps that within 1.44·log₂(n).`
        : `Inserted ${value}. The tree now holds ${size} node${size === 1 ? '' : 's'} with height ${heightOf(nodes, currentRoot)}.`,
    operation: 'done',
    highlightedLines: isAvl ? [18] : [10],
  });

  return recorder.finish({
    timeComplexity: isAvl ? 'O(log n)' : 'O(h) — O(log n) balanced, O(n) worst',
    spaceComplexity: 'O(h) recursion stack',
  });
}

const heightOf = (nodes: Record<string, TreeNode>, id: string | null): number =>
  id === null
    ? 0
    : 1 + Math.max(heightOf(nodes, nodes[id].left), heightOf(nodes, nodes[id].right));

/* -------------------------------------------------------------- search */

export function treeSearch(
  state: TreeState,
  rawValue: number,
): AlgorithmResult<TreeState> {
  const target = requireValue(rawValue);
  const recorder = new StepRecorder<TreeState>();

  const snapshot = (overrides: Partial<TreeState> = {}): TreeState => ({
    ...state,
    nodes: cloneNodes(state.nodes),
    cursor: null,
    compared: [],
    rotated: [],
    visited: [],
    output: [],
    found: null,
    detaching: null,
    queue: [],
    ...overrides,
  });

  recorder.push({
    state: snapshot({ cursor: state.root }),
    description:
      state.root === null
        ? 'The tree is empty, so the search fails immediately.'
        : `Search for ${target}. Each comparison discards one whole subtree.`,
    operation: 'start',
    highlightedLines: [1, 2],
  });

  let current = state.root;
  let depth = 0;
  while (current) {
    depth += 1;
    recorder.set('depth', depth);
    recorder.count('comparisons');
    const node = state.nodes[current];
    if (node.value === target) {
      recorder.push({
        state: snapshot({ cursor: current, found: current }),
        description: `${node.value} matches — found after ${recorder.stats.comparisons} comparison${recorder.stats.comparisons === 1 ? '' : 's'} at depth ${depth}.`,
        operation: 'found',
        highlightedLines: [3, 4],
      });
      return recorder.finish({
        timeComplexity: 'O(h)',
        spaceComplexity: 'O(1)',
        summary: `Found at depth ${depth}.`,
      });
    }
    const goLeft = target < node.value;
    recorder.push({
      state: snapshot({ cursor: current, compared: [current] }),
      description: `${target} ${goLeft ? '<' : '>'} ${node.value}, so it can only be in the ${goLeft ? 'left' : 'right'} subtree. Everything on the ${goLeft ? 'right' : 'left'} is ruled out.`,
      operation: goLeft ? 'go-left' : 'go-right',
      highlightedLines: goLeft ? [5, 6] : [7, 8],
    });
    current = goLeft ? node.left : node.right;
  }

  recorder.set('depth', 0);
  recorder.push({
    state: snapshot(),
    description: `Ran off the bottom of the tree — ${target} is not present.`,
    operation: 'not-found',
    highlightedLines: [9],
  });

  return recorder.finish({
    timeComplexity: 'O(h)',
    spaceComplexity: 'O(1)',
    summary: 'Not found.',
  });
}

/* -------------------------------------------------------------- delete */

export function treeDelete(
  state: TreeState,
  rawValue: number,
): AlgorithmResult<TreeState> {
  const value = requireValue(rawValue);
  const recorder = new StepRecorder<TreeState>();
  const nodes = cloneNodes(state.nodes);
  const isAvl = state.mode === 'avl';
  let currentRoot = state.root;

  const snapshot = (overrides: Partial<TreeState> = {}): TreeState => ({
    ...state,
    nodes: cloneNodes(nodes),
    root: currentRoot,
    cursor: null,
    compared: [],
    rotated: [],
    visited: [],
    output: [],
    found: null,
    detaching: null,
    queue: [],
    ...overrides,
  });

  const link = (
    parent: string | null,
    side: Side,
    child: string | null,
  ): void => {
    if (parent === null || side === null) currentRoot = child;
    else nodes[parent][side] = child;
  };

  const height = (id: string | null): number => (id ? nodes[id].height : 0);
  const refresh = (id: string): void => {
    nodes[id].height =
      1 + Math.max(height(nodes[id].left), height(nodes[id].right));
  };
  const rotateRight = (y: string): string => {
    const x = nodes[y].left as string;
    nodes[y].left = nodes[x].right;
    nodes[x].right = y;
    refresh(y);
    refresh(x);
    return x;
  };
  const rotateLeft = (x: string): string => {
    const y = nodes[x].right as string;
    nodes[x].right = nodes[y].left;
    nodes[y].left = x;
    refresh(x);
    refresh(y);
    return y;
  };

  let removed = false;

  recorder.push({
    state: snapshot({ cursor: currentRoot }),
    description:
      currentRoot === null
        ? 'The tree is empty — nothing to delete.'
        : `Delete ${value}. First find it, then deal with its children.`,
    operation: 'start',
    highlightedLines: [1, 2],
  });

  const remove = (
    id: string | null,
    parent: string | null,
    side: Side,
    target: number,
    depth: number,
  ): void => {
    recorder.set('depth', depth);
    if (id === null) return;
    const node = nodes[id];
    recorder.count('comparisons');

    if (target < node.value) {
      recorder.push({
        state: snapshot({ cursor: id, compared: [id] }),
        description: `${target} < ${node.value} — search the left subtree.`,
        operation: 'go-left',
        highlightedLines: [3, 4],
      });
      remove(node.left, id, 'left', target, depth + 1);
    } else if (target > node.value) {
      recorder.push({
        state: snapshot({ cursor: id, compared: [id] }),
        description: `${target} > ${node.value} — search the right subtree.`,
        operation: 'go-right',
        highlightedLines: [5, 6],
      });
      remove(node.right, id, 'right', target, depth + 1);
    } else {
      removed = true;
      const left = nodes[id].left;
      const right = nodes[id].right;

      if (left === null || right === null) {
        const replacement = left ?? right;
        recorder.push({
          state: snapshot({ cursor: id, detaching: id }),
          description:
            replacement === null
              ? `${node.value} is a leaf — just unlink it.`
              : `${node.value} has one child (${nodes[replacement].value}), so that child takes its place.`,
          operation: 'unlink',
          highlightedLines: [7, 8, 9],
        });
        link(parent, side, replacement);
        delete nodes[id];
        recorder.push({
          state: snapshot({ cursor: replacement }),
          description: `${node.value} is gone and the subtree stays a valid BST.`,
          operation: 'free',
          highlightedLines: [8, 9],
        });
        return;
      }

      let successor = right;
      while (nodes[successor].left !== null) {
        successor = nodes[successor].left as string;
      }
      recorder.push({
        state: snapshot({ cursor: successor, compared: [id, successor] }),
        description: `${node.value} has two children. Its in-order successor is ${nodes[successor].value} — the smallest value in the right subtree, and the only value that can take its place without breaking the ordering.`,
        operation: 'successor',
        highlightedLines: [10],
      });

      const successorValue = nodes[successor].value;
      nodes[id].value = successorValue;
      recorder.count('writes');
      recorder.push({
        state: snapshot({ cursor: id, compared: [id] }),
        description: `Copy ${successorValue} up into this node, then delete the successor from the right subtree instead.`,
        operation: 'replace',
        highlightedLines: [11, 12],
      });
      remove(nodes[id].right, id, 'right', successorValue, depth + 1);
    }

    if (!isAvl) return;
    if (!nodes[id]) return;

    refresh(id);
    const balance = height(nodes[id].left) - height(nodes[id].right);
    if (Math.abs(balance) <= 1) return;

    recorder.push({
      state: snapshot({ cursor: id, compared: [id] }),
      description: `The deletion left ${nodes[id].value} unbalanced (balance ${balance}). AVL rebalances on the way back up.`,
      operation: 'imbalance',
      highlightedLines: [13],
    });

    if (balance > 1) {
      const leftChild = nodes[id].left as string;
      if (height(nodes[leftChild].left) < height(nodes[leftChild].right)) {
        const childValue = nodes[leftChild].value;
        const lifted = rotateLeft(leftChild);
        nodes[id].left = lifted;
        recorder.push({
          state: snapshot({ rotated: [lifted, leftChild], cursor: id }),
          description: `Left-right case: rotate the left child ${childValue} left first.`,
          operation: 'rotate-left',
          highlightedLines: [13],
        });
      }
      const pivot = nodes[id].value;
      const newRoot = rotateRight(id);
      link(parent, side, newRoot);
      recorder.push({
        state: snapshot({ rotated: [newRoot, id], cursor: newRoot }),
        description: `Rotate right around ${pivot}; ${nodes[newRoot].value} becomes the subtree root.`,
        operation: 'rotate-right',
        highlightedLines: [13],
      });
      return;
    }

    const rightChild = nodes[id].right as string;
    if (height(nodes[rightChild].right) < height(nodes[rightChild].left)) {
      const childValue = nodes[rightChild].value;
      const lifted = rotateRight(rightChild);
      nodes[id].right = lifted;
      recorder.push({
        state: snapshot({ rotated: [lifted, rightChild], cursor: id }),
        description: `Right-left case: rotate the right child ${childValue} right first.`,
        operation: 'rotate-right',
        highlightedLines: [13],
      });
    }
    const pivot = nodes[id].value;
    const newRoot = rotateLeft(id);
    link(parent, side, newRoot);
    recorder.push({
      state: snapshot({ rotated: [newRoot, id], cursor: newRoot }),
      description: `Rotate left around ${pivot}; ${nodes[newRoot].value} becomes the subtree root.`,
      operation: 'rotate-left',
      highlightedLines: [13],
    });
  };

  remove(currentRoot, null, null, value, 1);
  recorder.set('depth', 0);

  recorder.push({
    state: snapshot(),
    description: removed
      ? `Deleted ${value}. An in-order traversal is still ascending, which is the BST invariant.`
      : `${value} is not in the tree, so nothing changed.`,
    operation: removed ? 'done' : 'not-found',
    highlightedLines: [13],
  });

  return recorder.finish({
    timeComplexity: isAvl ? 'O(log n)' : 'O(h)',
    spaceComplexity: 'O(h) recursion stack',
  });
}

/* ----------------------------------------------------------- traversals */

export type TraversalKind = 'inorder' | 'preorder' | 'postorder' | 'level-order';

const TRAVERSAL_LINES: Record<TraversalKind, number[]> = {
  inorder: [1, 2, 3, 4, 5],
  preorder: [7, 8],
  postorder: [10, 11],
  'level-order': [13, 14, 15, 16, 17, 18, 19],
};

export function treeTraverse(
  state: TreeState,
  kind: TraversalKind,
): AlgorithmResult<TreeState> {
  const recorder = new StepRecorder<TreeState>();
  const visited: string[] = [];
  const output: number[] = [];
  const lines = TRAVERSAL_LINES[kind];

  const snapshot = (overrides: Partial<TreeState> = {}): TreeState => ({
    ...state,
    nodes: cloneNodes(state.nodes),
    cursor: null,
    compared: [],
    rotated: [],
    visited: [...visited],
    output: [...output],
    found: null,
    detaching: null,
    queue: [],
    ...overrides,
  });

  const LABEL: Record<TraversalKind, string> = {
    inorder: 'In-order (left, node, right) visits a BST in ascending order',
    preorder: 'Pre-order (node, left, right) emits the root first, which makes it ideal for copying a tree',
    postorder: 'Post-order (left, right, node) emits children before parents, which makes it ideal for freeing a tree',
    'level-order': 'Level-order walks breadth first using a queue, one depth at a time',
  };

  recorder.push({
    state: snapshot(),
    description: `${LABEL[kind]}.`,
    operation: 'start',
    highlightedLines: lines,
  });

  if (state.root === null) {
    recorder.push({
      state: snapshot(),
      description: 'The tree is empty, so the traversal emits nothing.',
      operation: 'done',
      highlightedLines: lines,
    });
    return recorder.finish({
      timeComplexity: 'O(n)',
      spaceComplexity: kind === 'level-order' ? 'O(w) queue' : 'O(h) stack',
    });
  }

  const visit = (id: string, depth: number, note: string): void => {
    visited.push(id);
    output.push(state.nodes[id].value);
    recorder.count('reads');
    recorder.set('depth', depth);
    recorder.push({
      state: snapshot({ cursor: id }),
      description: `Visit ${state.nodes[id].value}. ${note} Output so far: ${output.join(', ')}.`,
      operation: 'visit',
      highlightedLines: lines,
    });
  };

  if (kind === 'level-order') {
    const queue: string[] = [state.root];
    while (queue.length > 0) {
      const id = queue.shift() as string;
      recorder.push({
        state: snapshot({ cursor: id, queue: [...queue] }),
        description: `Take ${state.nodes[id].value} off the front of the queue.`,
        operation: 'dequeue',
        highlightedLines: [16, 17],
      });
      visit(id, 1, 'Then enqueue its children.');
      const node = state.nodes[id];
      for (const child of [node.left, node.right]) {
        if (child) queue.push(child);
      }
      if (node.left || node.right) {
        recorder.push({
          state: snapshot({ cursor: id, queue: [...queue] }),
          description: `Queue is now [${queue.map((q) => state.nodes[q].value).join(', ')}].`,
          operation: 'enqueue',
          highlightedLines: [19],
        });
      }
    }
  } else {
    const walk = (id: string | null, depth: number): void => {
      if (id === null) return;
      recorder.set('depth', depth);
      const node = state.nodes[id];
      if (kind === 'preorder') {
        visit(id, depth, 'Pre-order emits a node before descending.');
        walk(node.left, depth + 1);
        walk(node.right, depth + 1);
      } else if (kind === 'inorder') {
        walk(node.left, depth + 1);
        visit(id, depth, 'In-order emits a node once its whole left subtree is done.');
        walk(node.right, depth + 1);
      } else {
        walk(node.left, depth + 1);
        walk(node.right, depth + 1);
        visit(id, depth, 'Post-order emits a node only after both children.');
      }
    };
    walk(state.root, 1);
  }

  recorder.set('depth', 0);
  recorder.push({
    state: snapshot(),
    description: `${kind} traversal complete: ${output.join(', ')}.${
      kind === 'inorder' ? ' Note that the output is sorted — that is the BST property.' : ''
    }`,
    operation: 'done',
    highlightedLines: lines,
  });

  return recorder.finish({
    timeComplexity: 'O(n)',
    spaceComplexity: kind === 'level-order' ? 'O(w) queue' : 'O(h) stack',
    summary: output.join(', '),
  });
}

export interface TreeOperationSpec {
  id: string;
  label: string;
  description: string;
  needsValue: boolean;
  code: (mode: TreeMode) => CodeSource;
  complexity: ComplexityInfo;
}

export const TREE_OPERATIONS: TreeOperationSpec[] = [
  {
    id: 'insert',
    label: 'Insert',
    description: 'Walk down comparing, then attach a leaf (and rebalance in AVL mode).',
    needsValue: true,
    code: (mode) => (mode === 'avl' ? avlInsertCode : bstInsertCode),
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(n)', space: 'O(h)' },
  },
  {
    id: 'search',
    label: 'Search',
    description: 'Each comparison discards one entire subtree.',
    needsValue: true,
    code: () => searchCode,
    complexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(n)', space: 'O(1)' },
  },
  {
    id: 'delete',
    label: 'Delete',
    description: 'Unlink a leaf, promote a single child, or swap in the in-order successor.',
    needsValue: true,
    code: () => deleteCode,
    complexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(n)', space: 'O(h)' },
  },
  {
    id: 'inorder',
    label: 'In-order',
    description: 'left → node → right. On a BST this emits ascending values.',
    needsValue: false,
    code: () => traversalCode,
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(h)' },
  },
  {
    id: 'preorder',
    label: 'Pre-order',
    description: 'node → left → right.',
    needsValue: false,
    code: () => traversalCode,
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(h)' },
  },
  {
    id: 'postorder',
    label: 'Post-order',
    description: 'left → right → node.',
    needsValue: false,
    code: () => traversalCode,
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(h)' },
  },
  {
    id: 'level-order',
    label: 'Level-order',
    description: 'Breadth first, using a queue.',
    needsValue: false,
    code: () => traversalCode,
    complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(w)' },
  },
];
