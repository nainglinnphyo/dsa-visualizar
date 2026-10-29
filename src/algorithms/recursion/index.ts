import {
  factorialSpec,
  fibonacciSpec,
  recursiveBinarySearchSpec,
} from './simple';
import { hanoiSpec, mazeSpec, nQueensSpec } from './backtracking';
import type { RecursionAlgorithmSpec } from './types';

export const RECURSION_ALGORITHMS: RecursionAlgorithmSpec[] = [
  factorialSpec,
  fibonacciSpec,
  recursiveBinarySearchSpec,
  hanoiSpec,
  mazeSpec,
  nQueensSpec,
];

export const recursionAlgorithmById = (
  id: string,
): RecursionAlgorithmSpec | undefined =>
  RECURSION_ALGORITHMS.find((algorithm) => algorithm.id === id);

export { factorial, fibonacci, recursiveBinarySearch } from './simple';
export { towerOfHanoi, mazeSolver, nQueens } from './backtracking';
export * from './types';
