import type { LearningContent } from '@/types/learning';

export const HASH_LEARNING: LearningContent = {
  what: 'A hash table turns a key into an array index with a hash function, so lookups do not have to search. Two keys can land on the same bucket — a collision — and the whole design question is what to do about it. Separate chaining keeps a list per bucket; open addressing (here, linear probing) keeps everything in the array and walks forward to the next free slot.',
  how: [
    'Hash the key into an integer, then reduce it modulo the capacity to get a bucket index.',
    'With separate chaining, append the pair to that bucket’s list and scan the list on lookup.',
    'With linear probing, check the bucket; if it is taken by another key, try (h + 1), (h + 2), … until a free slot appears.',
    'Searching repeats the same probe sequence and stops at the first genuinely empty slot.',
    'Deleting under probing must leave a tombstone, otherwise keys stored past the hole become unreachable.',
    'Both schemes resize once the load factor (entries ÷ capacity) gets too high.',
  ],
  useCases: [
    'Dictionaries, sets, and object property lookup in nearly every language runtime.',
    'Caches and memoization tables.',
    'Database indexes and de-duplication.',
    'Counting occurrences — the classic word-frequency problem.',
  ],
  pros: [
    'O(1) average insert, search and delete — independent of the number of entries.',
    'Flexible keys: anything you can hash, not just integers.',
    'Chaining degrades gracefully as the load factor rises.',
  ],
  cons: [
    'Worst case is O(n) when every key collides — an adversary who knows your hash can force it.',
    'No ordering: you cannot ask for the smallest key or iterate in sorted order.',
    'Open addressing needs tombstones and suffers from clustering as it fills.',
    'Resizing is an occasional O(n) rehash of every entry.',
  ],
  challenge:
    'Insert keys until two land in the same bucket. Switch to linear probing and insert the same keys — then delete the *first* of the colliding pair and search for the second. Explain exactly why the tombstone is required.',
};
