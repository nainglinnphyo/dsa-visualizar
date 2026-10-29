import type { LearningContent } from '@/types/learning';

export const HEAP_LEARNING: LearningContent = {
  what: 'A binary heap is a complete binary tree where every parent beats its children — smaller for a min-heap, larger for a max-heap. Because the tree is complete it can live inside a plain array with no pointers at all: the children of index i are at 2i+1 and 2i+2, and its parent is at ⌊(i−1)/2⌋. The root is therefore always the minimum (or maximum), readable in O(1).',
  how: [
    'Insert: append the value at the end to keep the tree complete, then sift it up while it beats its parent.',
    'Extract: take the root, move the last value into the root, shrink by one, then sift it down past the better child.',
    'Sifting only ever follows one root-to-leaf path, so both are O(log n).',
    'Heapify an existing array bottom-up: every index from ⌊n/2⌋ on is a leaf already, so start just before that and sift down.',
    'Bottom-up heapify is O(n), not O(n log n) — most nodes are near the leaves and barely move.',
  ],
  useCases: [
    'Priority queues: schedulers, event simulation, bandwidth shaping.',
    'Dijkstra and A*, which repeatedly need the closest unvisited node.',
    'Heap sort, which is just build-heap followed by n extractions.',
    'Streaming "top k" problems — keep a k-sized heap of the best so far.',
  ],
  pros: [
    'O(1) access to the extreme value; O(log n) insert and extract.',
    'No pointers and no allocation — an array is the whole data structure.',
    'Building from an unsorted array is linear time.',
  ],
  cons: [
    'Only the extreme is cheap: searching for an arbitrary value is O(n).',
    'Not sorted — an in-order walk of the array means nothing.',
    'Poor locality when sifting through a large heap, since indices jump by powers of two.',
  ],
  challenge:
    'Insert 5, 3, 8, 1 into a min-heap and count the sift-up swaps. Then press Heapify on a random array and compare the comparison count against inserting the same values one at a time — this is the O(n) versus O(n log n) difference.',
};
