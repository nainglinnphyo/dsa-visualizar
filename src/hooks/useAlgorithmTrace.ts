import { useMemo } from 'react';
import { InputError, type AlgorithmResult } from '@/engine/types';

export interface TraceState<TState> {
  result: AlgorithmResult<TState> | null;
  /** Validation message from the algorithm, safe to show to the user. */
  error: string | null;
}

/**
 * Runs a pure algorithm and memoises the trace, turning `InputError` into a
 * displayable message instead of crashing the page.
 */
export function useAlgorithmTrace<TInput, TState>(
  run: (input: TInput) => AlgorithmResult<TState>,
  input: TInput,
): TraceState<TState> {
  return useMemo(() => {
    try {
      return { result: run(input), error: null };
    } catch (error) {
      if (error instanceof InputError) {
        return { result: null, error: error.message };
      }
      throw error;
    }
  }, [run, input]);
}
