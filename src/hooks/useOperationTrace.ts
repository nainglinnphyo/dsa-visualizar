import { useCallback, useRef, useState } from 'react';
import { InputError, type AlgorithmResult } from '@/engine/types';

export interface OperationTrace<TState> {
  /** Trace of the most recent operation, or null before the first one. */
  trace: AlgorithmResult<TState> | null;
  /** Increments per operation so playback reloads even at the same length. */
  traceKey: number;
  /** The state the next operation starts from: the end of the last trace. */
  base: TState;
  error: string | null;
  run: (operation: (base: TState) => AlgorithmResult<TState>) => void;
  /** Discard history and return to the supplied state. */
  resetTo: (state: TState) => void;
  clearError: () => void;
}

/**
 * Drives data-structure pages: each operation produces a fresh trace that
 * starts from where the previous one ended, so the structure persists while
 * the last operation stays fully scrubbable.
 */
export function useOperationTrace<TState>(
  initialState: TState,
): OperationTrace<TState> {
  const [state, setState] = useState<{
    trace: AlgorithmResult<TState> | null;
    base: TState;
  }>({ trace: null, base: initialState });
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef(0);
  const [traceKey, setTraceKey] = useState(0);

  const currentBase = state.trace
    ? state.trace.steps[state.trace.steps.length - 1].state
    : state.base;

  const run = useCallback(
    (operation: (base: TState) => AlgorithmResult<TState>) => {
      setState((previous) => {
        const from = previous.trace
          ? previous.trace.steps[previous.trace.steps.length - 1].state
          : previous.base;
        try {
          const trace = operation(from);
          setError(null);
          keyRef.current += 1;
          setTraceKey(keyRef.current);
          return { trace, base: from };
        } catch (cause) {
          if (cause instanceof InputError) {
            setError(cause.message);
            return previous;
          }
          throw cause;
        }
      });
    },
    [],
  );

  const resetTo = useCallback((next: TState) => {
    keyRef.current += 1;
    setTraceKey(keyRef.current);
    setState({ trace: null, base: next });
    setError(null);
  }, []);

  return {
    trace: state.trace,
    traceKey,
    base: currentBase,
    error,
    run,
    resetTo,
    clearError: useCallback(() => setError(null), []),
  };
}
