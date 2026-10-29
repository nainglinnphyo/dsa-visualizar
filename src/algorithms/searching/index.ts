import { binarySearchSpec } from './binary-search';
import { linearSearchSpec } from './linear-search';
import type { SearchAlgorithmSpec } from './types';

export const SEARCH_ALGORITHMS: SearchAlgorithmSpec[] = [
  linearSearchSpec,
  binarySearchSpec,
];

export const searchAlgorithmById = (
  id: string,
): SearchAlgorithmSpec | undefined =>
  SEARCH_ALGORITHMS.find((algorithm) => algorithm.id === id);

export { linearSearch } from './linear-search';
export { binarySearch } from './binary-search';
export type { SearchAlgorithmSpec, SearchState, SearchInput } from './types';
