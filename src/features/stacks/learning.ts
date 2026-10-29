import type { LearningContent } from '@/types/learning';

export const STACK_LEARNING: LearningContent = {
  what: 'A stack is a last-in-first-out (LIFO) collection: you may only add to and remove from the same end, called the top. Because every operation touches exactly one index, push, pop and peek are all O(1). A stack backed by a fixed array can overflow when it is full and underflow when you pop from empty.',
  how: [
    'Keep the elements in an array and an index `top`, starting at −1 for empty.',
    'push: check for overflow, increment top, write the value there.',
    'pop: check for underflow, read the value at top, decrement top.',
    'peek: read the value at top without moving it.',
    'Nothing shifts, so the cost never depends on how many elements are stored.',
  ],
  useCases: [
    'The call stack: every function call pushes a frame and every return pops one.',
    'Undo/redo histories and browser back buttons.',
    'Expression evaluation, bracket matching and converting infix to postfix.',
    'Depth-first search, as the explicit alternative to recursion.',
  ],
  pros: [
    'All operations are O(1) with tiny constant factors.',
    'Trivially simple to implement correctly over an array or a linked list.',
    'The LIFO discipline matches nested, recursive problems exactly.',
  ],
  cons: [
    'You can only reach the top element — no indexing or searching.',
    'A fixed-capacity stack overflows; a growable one pays an occasional O(n) resize.',
    'Deep recursion on a real call stack can exhaust it.',
  ],
  challenge:
    'Push 1, 2, 3 then pop three times. Write down the order you get back before you run it. Then set the capacity to 2 and push a third value — what does a real implementation do at that point?',
};
