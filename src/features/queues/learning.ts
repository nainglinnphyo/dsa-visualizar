import type { LearningContent } from '@/types/learning';

export const QUEUE_LEARNING: LearningContent = {
  what: 'A queue is a first-in-first-out (FIFO) collection: values enter at the rear and leave at the front. Two indices track those ends, so enqueue and dequeue are both O(1). A naive array-backed queue leaks capacity as front advances; a circular queue fixes that by wrapping both indices modulo the capacity.',
  how: [
    'Keep a fixed array plus `front`, `rear` and `size`.',
    'enqueue: if there is room, advance rear and write the value there.',
    'dequeue: if size is non-zero, read the value at front, clear the slot and advance front.',
    'In a circular queue both advances are modulo capacity, so the indices wrap to the start.',
    'Fullness is tested with `size === capacity` rather than `rear === capacity − 1`, which is what makes the reclaimed slots usable.',
  ],
  useCases: [
    'Task, print and message queues, where fairness matters.',
    'Breadth-first search, which is exactly a queue of frontier nodes.',
    'Buffering between a producer and a consumer running at different speeds (ring buffers).',
    'Scheduling: round-robin CPU time slices.',
  ],
  pros: [
    'O(1) enqueue and dequeue with no shifting.',
    'FIFO ordering gives a fairness guarantee for free.',
    'A circular queue uses a fixed block of memory with no allocation at all.',
  ],
  cons: [
    'No access to the middle — you cannot index into a queue.',
    'A linear array queue wastes the slots in front of `front`.',
    'With a circular queue, full and empty both leave front and rear adjacent, so a separate size (or a sacrificed slot) is required to tell them apart.',
  ],
  challenge:
    'On a linear queue of capacity 4: enqueue four values, dequeue two, then enqueue again. It reports overflow with two slots free. Switch to circular and repeat — then work out why `size` has to be tracked separately.',
};
