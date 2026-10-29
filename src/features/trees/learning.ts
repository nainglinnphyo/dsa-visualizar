import type { LearningContent } from '@/types/learning';

export const BST_LEARNING: LearningContent = {
  what: 'A binary search tree keeps every key greater than everything in its left subtree and less than everything in its right. That single invariant turns search into a sequence of decisions that each discard half the remaining tree — but only while the tree stays bushy. Insert sorted data into a plain BST and it degenerates into a linked list, which is exactly what AVL trees exist to prevent.',
  how: [
    'Search, insert and delete all start at the root and compare.',
    'Smaller keys go left, larger go right; equal means found.',
    'Insertion attaches a new leaf at the empty spot the search falls off.',
    'Deleting a leaf just unlinks it; a node with one child is replaced by that child.',
    'A node with two children is replaced by its in-order successor — the smallest key in its right subtree — which is then deleted from there.',
    'Every operation costs O(h), where h is the height. The whole game is keeping h small.',
  ],
  useCases: [
    'Ordered maps and sets where you need range queries or "next largest".',
    'Database and filesystem indexes (as B-trees, the same idea with a higher branching factor).',
    'Keeping a stream of values sorted while supporting fast insertion.',
  ],
  pros: [
    'O(log n) search, insert and delete on a balanced tree.',
    'In-order traversal gives the keys in sorted order for free.',
    'Supports successor, predecessor, minimum, maximum and range queries — none of which a hash table can do.',
  ],
  cons: [
    'Unbalanced trees degrade to O(n); sorted input is the worst case.',
    'More memory per element than an array, and far worse cache behaviour.',
    'Deletion with two children is fiddly to get right.',
  ],
  challenge:
    'Insert 1, 2, 3, 4, 5 in order on the BST tab and look at the height. Switch to AVL, clear, and do the same — count the rotations. Then delete the root in both modes and watch which value gets promoted.',
};

export const AVL_LEARNING: LearningContent = {
  what: 'An AVL tree is a BST that repairs itself. Every node stores its height, and after each insert or delete the tree walks back up checking the balance factor (left height − right height). Whenever that factor leaves the range −1…1, one or two rotations restore it. The result is a guaranteed height below 1.44·log₂(n), so every operation is O(log n) even on sorted input.',
  how: [
    'Insert or delete exactly as in a plain BST.',
    'On the way back up the recursion, recompute each node’s height.',
    'Compute balance = height(left) − height(right).',
    'balance > 1 with the new key in the left-left position: one right rotation.',
    'balance < −1 with the new key in the right-right position: one left rotation.',
    'Left-right and right-left cases need two rotations: rotate the child first, then the node.',
    'A rotation only relinks three pointers, so it is O(1); at most O(log n) of them happen per operation.',
  ],
  useCases: [
    'Workloads with far more lookups than updates, where the tighter balance of AVL beats a red-black tree.',
    'In-memory ordered indexes with predictable worst-case latency.',
    'Teaching self-balancing — the rules are easier to state than red-black invariants.',
  ],
  pros: [
    'Guaranteed O(log n) for every operation, with no bad inputs.',
    'More strictly balanced than red-black trees, so lookups are slightly faster.',
    'Rotations are cheap, local pointer surgery.',
  ],
  cons: [
    'More rotations on insert and delete than a red-black tree, so update-heavy workloads suffer.',
    'Every node carries a height field.',
    'Noticeably more code than a plain BST.',
  ],
  challenge:
    'Insert 10, 20, 30 and identify which rotation case fires. Then clear and insert 30, 10, 20 — a different case, two rotations. Can you predict the final root in each before you press play?',
};
