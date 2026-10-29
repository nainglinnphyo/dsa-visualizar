import { describe, expect, it } from 'vitest';
import {
  createTree,
  inorderValues,
  treeDelete,
  treeInsert,
  treeSearch,
  treeTraverse,
  treeHeight,
  treeSize,
  type TraversalKind,
  type TreeMode,
  type TreeState,
} from '../tree';

const lastState = (result: { steps: { state: TreeState }[] }): TreeState =>
  result.steps[result.steps.length - 1].state;

const insertAll = (values: number[], mode: TreeMode): TreeState => {
  let state = createTree([], mode);
  for (const value of values) state = lastState(treeInsert(state, value));
  return state;
};

/** Every node's key is greater than its whole left subtree and less than its right. */
function assertBstInvariant(state: TreeState): void {
  const check = (id: string | null, min: number, max: number): void => {
    if (!id) return;
    const node = state.nodes[id];
    expect(node.value).toBeGreaterThan(min);
    expect(node.value).toBeLessThan(max);
    check(node.left, min, node.value);
    check(node.right, node.value, max);
  };
  check(state.root, -Infinity, Infinity);
}

/** Heights are consistent and every balance factor is within ±1. */
function assertAvlInvariant(state: TreeState): void {
  const check = (id: string | null): number => {
    if (!id) return 0;
    const node = state.nodes[id];
    const left = check(node.left);
    const right = check(node.right);
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
    const height = 1 + Math.max(left, right);
    expect(node.height).toBe(height);
    return height;
  };
  check(state.root);
}

/** No orphaned nodes left behind in the record. */
function assertNoLeaks(state: TreeState): void {
  const reachable = new Set<string>();
  const walk = (id: string | null): void => {
    if (!id) return;
    expect(reachable.has(id)).toBe(false);
    reachable.add(id);
    walk(state.nodes[id].left);
    walk(state.nodes[id].right);
  };
  walk(state.root);
  expect(Object.keys(state.nodes).sort()).toEqual([...reachable].sort());
}

const reference = (values: number[], kind: TraversalKind): number[] => {
  interface Node {
    value: number;
    left: Node | null;
    right: Node | null;
  }
  let root: Node | null = null;
  const insert = (node: Node | null, value: number): Node => {
    if (!node) return { value, left: null, right: null };
    if (value < node.value) node.left = insert(node.left, value);
    else if (value > node.value) node.right = insert(node.right, value);
    return node;
  };
  for (const value of values) root = insert(root, value);

  const out: number[] = [];
  if (kind === 'level-order') {
    const queue: Node[] = root ? [root] : [];
    while (queue.length) {
      const node = queue.shift() as Node;
      out.push(node.value);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    return out;
  }
  const walk = (node: Node | null): void => {
    if (!node) return;
    if (kind === 'preorder') out.push(node.value);
    walk(node.left);
    if (kind === 'inorder') out.push(node.value);
    walk(node.right);
    if (kind === 'postorder') out.push(node.value);
  };
  walk(root);
  return out;
};

describe.each(['bst', 'avl'] as const)('%s', (mode) => {
  const CASES: { name: string; values: number[] }[] = [
    { name: 'ascending (worst case for a plain BST)', values: [1, 2, 3, 4, 5, 6, 7] },
    { name: 'descending', values: [7, 6, 5, 4, 3, 2, 1] },
    { name: 'random-ish', values: [50, 30, 70, 20, 40, 60, 80, 35, 65] },
    { name: 'left-right zigzag', values: [30, 10, 20] },
    { name: 'right-left zigzag', values: [10, 30, 20] },
    { name: 'negatives and zero', values: [0, -5, 5, -10, -2, 3, 9] },
    { name: 'single node', values: [42] },
  ];

  it.each(CASES)('keeps the BST invariant after inserting $name', ({ values }) => {
    const state = insertAll(values, mode);
    assertBstInvariant(state);
    assertNoLeaks(state);
    expect(inorderValues(state)).toEqual([...values].sort((a, b) => a - b));
    if (mode === 'avl') assertAvlInvariant(state);
  });

  it('ignores duplicate inserts', () => {
    const state = insertAll([5, 3, 8, 5, 3], mode);
    expect(inorderValues(state)).toEqual([3, 5, 8]);
    expect(treeSize(state)).toBe(3);
  });

  it('handles an empty tree', () => {
    const state = createTree([], mode);
    expect(inorderValues(state)).toEqual([]);
    expect(treeHeight(state)).toBe(0);
    expect(lastState(treeSearch(state, 1)).found).toBeNull();
    expect(inorderValues(lastState(treeDelete(state, 1)))).toEqual([]);
  });

  it.each(CASES)('keeps the invariant after deleting from $name', ({ values }) => {
    const sorted = [...values].sort((a, b) => a - b);
    for (const target of values) {
      let state = insertAll(values, mode);
      state = lastState(treeDelete(state, target));
      assertBstInvariant(state);
      assertNoLeaks(state);
      expect(inorderValues(state)).toEqual(sorted.filter((v) => v !== target));
      if (mode === 'avl') assertAvlInvariant(state);
    }
  });

  it('deletes every node one by one down to empty', () => {
    const values = [50, 30, 70, 20, 40, 60, 80];
    let state = insertAll(values, mode);
    for (const value of values) {
      state = lastState(treeDelete(state, value));
      assertBstInvariant(state);
      assertNoLeaks(state);
      if (mode === 'avl') assertAvlInvariant(state);
    }
    expect(state.root).toBeNull();
    expect(treeSize(state)).toBe(0);
  });

  it('deleting a missing value changes nothing', () => {
    const before = insertAll([5, 3, 8], mode);
    const after = lastState(treeDelete(before, 99));
    expect(inorderValues(after)).toEqual(inorderValues(before));
  });

  it('finds present values and rejects absent ones', () => {
    const state = insertAll([50, 30, 70, 20, 40], mode);
    for (const value of [50, 30, 70, 20, 40]) {
      const result = treeSearch(state, value);
      expect(lastState(result).found).not.toBeNull();
      expect(state.nodes[lastState(result).found as string].value).toBe(value);
    }
    expect(lastState(treeSearch(state, 99)).found).toBeNull();
  });
});

describe('AVL balancing', () => {
  it('keeps ascending inserts logarithmic where a plain BST degenerates', () => {
    const values = Array.from({ length: 15 }, (_, i) => i + 1);
    expect(treeHeight(insertAll(values, 'bst'))).toBe(15);
    expect(treeHeight(insertAll(values, 'avl'))).toBe(4);
  });

  it('stays within the AVL height bound for many shapes', () => {
    for (let trial = 0; trial < 25; trial += 1) {
      const values = Array.from(
        { length: 20 },
        () => Math.floor(Math.random() * 200) - 100,
      );
      const state = insertAll(values, 'avl');
      const n = treeSize(state);
      if (n === 0) continue;
      expect(treeHeight(state)).toBeLessThanOrEqual(
        Math.floor(1.44 * Math.log2(n + 2)),
      );
    }
  });

  it('records a rotation step whenever it rebalances', () => {
    let state = createTree([], 'avl');
    state = lastState(treeInsert(state, 10));
    state = lastState(treeInsert(state, 20));
    const result = treeInsert(state, 30);
    const operations = result.steps.map((step) => step.operation);
    expect(operations).toContain('imbalance');
    expect(operations).toContain('rotate-left');
  });

  it('every intermediate rotation step is itself a valid tree', () => {
    let state = createTree([], 'avl');
    for (const value of [10, 20, 30, 40, 50, 25, 5, 15, 35]) {
      const result = treeInsert(state, value);
      for (const step of result.steps) assertNoLeaks(step.state);
      state = lastState(result);
    }
  });
});

describe('traversals', () => {
  const values = [50, 30, 70, 20, 40, 60, 80];
  const state = insertAll(values, 'bst');

  it.each([
    ['inorder'],
    ['preorder'],
    ['postorder'],
    ['level-order'],
  ] as [TraversalKind][])('%s matches a reference implementation', (kind) => {
    expect(lastState(treeTraverse(state, kind)).output).toEqual(
      reference(values, kind),
    );
  });

  it('in-order output is sorted', () => {
    expect(lastState(treeTraverse(state, 'inorder')).output).toEqual(
      [...values].sort((a, b) => a - b),
    );
  });

  it('emits output incrementally so stepping backward is meaningful', () => {
    const { steps } = treeTraverse(state, 'inorder');
    const lengths = steps.map((step) => step.state.output.length);
    for (let i = 1; i < lengths.length; i += 1) {
      expect(lengths[i]).toBeGreaterThanOrEqual(lengths[i - 1]);
    }
    expect(lengths[lengths.length - 1]).toBe(values.length);
  });

  it('handles an empty tree', () => {
    expect(lastState(treeTraverse(createTree([]), 'inorder')).output).toEqual([]);
  });
});
