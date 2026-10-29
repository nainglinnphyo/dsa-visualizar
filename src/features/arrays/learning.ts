import type { LearningContent } from '@/types/learning';

export const ARRAY_LEARNING: LearningContent = {
  what: 'An array stores elements of the same type in one contiguous block of memory. Because every element has the same size, the address of a[i] is base + i × size — a multiply and an add. That is why reading and writing by index is O(1) no matter how large the array is, and why inserting or removing in the middle is O(n): the elements after the hole have to physically move.',
  how: [
    'Allocate a block big enough for n elements.',
    'Compute an element’s address directly from its index — no searching.',
    'To insert at index i, shift elements i…n−1 one slot right, then write.',
    'To delete at index i, shift elements i+1…n−1 one slot left, then shrink.',
    'To find a value you must scan (O(n)), unless the array is sorted and you can binary search (O(log n)).',
  ],
  useCases: [
    'Anywhere you index by position: lookup tables, buffers, matrices, pixel data.',
    'The backing store for other structures — dynamic arrays, heaps, hash tables, ring buffers.',
    'Data you iterate over repeatedly, because contiguous memory is extremely cache-friendly.',
  ],
  pros: [
    'O(1) access and update by index.',
    'Minimal memory overhead — no per-element pointers.',
    'Sequential traversal is the fastest access pattern on real hardware.',
  ],
  cons: [
    'Insertion and deletion in the middle cost O(n) because of the shifting.',
    'A fixed-size array must be reallocated and copied to grow.',
    'Searching an unsorted array is O(n).',
  ],
  challenge:
    'Insert a value at index 0 of an 8-element array and count the writes. Then insert at the end. Both are "one insert" — explain the difference, then predict the write count for deleting index 0.',
};
