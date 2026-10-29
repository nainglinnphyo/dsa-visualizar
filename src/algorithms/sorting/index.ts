import { bubbleSortSpec } from './bubble-sort';
import { countingSortSpec } from './counting-sort';
import { heapSortSpec } from './heap-sort';
import { insertionSortSpec } from './insertion-sort';
import { mergeSortSpec } from './merge-sort';
import { quickSortSpec } from './quick-sort';
import { selectionSortSpec } from './selection-sort';
import type { SortAlgorithmSpec } from './types';

export const SORT_ALGORITHMS: SortAlgorithmSpec[] = [
  bubbleSortSpec,
  selectionSortSpec,
  insertionSortSpec,
  mergeSortSpec,
  quickSortSpec,
  heapSortSpec,
  countingSortSpec,
];

export const sortAlgorithmById = (id: string): SortAlgorithmSpec | undefined =>
  SORT_ALGORITHMS.find((algorithm) => algorithm.id === id);

export { bubbleSort } from './bubble-sort';
export { selectionSort } from './selection-sort';
export { insertionSort } from './insertion-sort';
export { mergeSort } from './merge-sort';
export { quickSort } from './quick-sort';
export { heapSort } from './heap-sort';
export { countingSort } from './counting-sort';
export type { SortAlgorithmSpec, SortState, AuxView } from './types';
