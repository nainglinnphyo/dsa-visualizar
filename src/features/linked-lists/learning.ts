import type { LearningContent } from '@/types/learning';

export const LIST_LEARNING: LearningContent = {
  what: 'A linked list stores each element in its own node together with a pointer to the next node. Nothing is contiguous, so there is no index arithmetic: reaching position k means following k pointers. In exchange, inserting or deleting at a known position is just a couple of pointer writes — no shifting. A doubly linked list adds a prev pointer, which makes backwards traversal and "delete this node" O(1).',
  how: [
    'A node holds a value and a next pointer (plus prev when doubly linked).',
    'head points at the first node; tail (optional) points at the last.',
    'To insert at the head, point the new node at the old head and move head.',
    'To insert elsewhere, walk to the node *before* the position, then rewire two pointers.',
    'To delete, walk to the predecessor and point its next past the target.',
    'Searching means following next from the head until the value appears or you hit null.',
  ],
  useCases: [
    'Queues and stacks that must grow without reallocating.',
    'LRU caches, where a doubly linked list plus a hash map gives O(1) move-to-front.',
    'Adjacency lists in graphs.',
    'Any list where you hold a reference to a node and need O(1) removal.',
  ],
  pros: [
    'Insertion and deletion at a known node are O(1) with no shifting.',
    'Grows one node at a time — no capacity, no resize copying.',
    'Splitting and joining lists is just pointer surgery.',
  ],
  cons: [
    'No random access: reaching position k costs O(k).',
    'Each node pays the memory overhead of its pointers.',
    'Nodes are scattered in memory, so traversal is far less cache-friendly than an array.',
    'Singly linked lists cannot be walked backwards, and deleting a node needs its predecessor.',
  ],
  challenge:
    'Insert at the head three times, then insert at position 2. Compare the traversal steps each operation needs. Then delete position 0 versus the last position — why is only one of them O(1)?',
};
