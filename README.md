# DSA Visualizer

Interactive, step-by-step visualizations of data structures and algorithms.

Every visualizer runs a real implementation. Algorithms are pure functions that
record an immutable snapshot per operation; the UI replays that recording. That
is why stepping backward is exact rather than approximate, and why the same code
is covered directly by unit tests.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check with project references, then build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Watch mode |
| `npm run typecheck` | Type-check without emitting |

## Architecture

The core idea is a single reusable engine rather than per-algorithm animation
code.

```
input ──▶ pure algorithm ──▶ AlgorithmResult<T>  ──▶ PlaybackController ──▶ React
                              { steps[], O(time), O(space) }
```

- **`src/engine/`** — the contracts and the machinery.
  - `types.ts` — `VisualizationStep<T>`, `AlgorithmResult<T>`, `InputError`.
  - `recorder.ts` — `StepRecorder`, which collects snapshots and keeps running
    counters. Each step gets a *copy* of the counters, so navigating backward
    restores the statistics that were true at that moment.
  - `playback-controller.ts` — a framework-agnostic state machine owning exactly
    one timer, exposed to React through `useSyncExternalStore`.
  - `code.ts` — pseudocode/TypeScript listings and the pseudocode→TypeScript
    line mapping used to highlight the executing line.
- **`src/algorithms/`** — pure implementations. No React, no DOM, no timers.
- **`src/features/`** — one folder per topic: a canvas component, a page, and
  its learning content.
- **`src/components/`** — the shared shell: playback controls, code panel,
  complexity panel, statistics, operation history, layout and UI primitives.
- **`src/hooks/`** — `usePlayback`, `useKeyboardPlayback`, `useAlgorithmTrace`
  (for algorithms driven by their input) and `useOperationTrace` (for data
  structures, where each operation starts from the end of the previous one).

Adding an algorithm means writing a function that returns an
`AlgorithmResult<T>` plus a canvas component. Everything else — playback,
scrubbing, code highlighting, statistics, keyboard control — comes from the
shell.

### Why steps are snapshots

Each recorded step owns its own copy of the state. Backward navigation is then a
plain array index rather than an inverse operation, which removes a whole class
of "undo is subtly wrong" bugs and makes the trace directly testable.

## What's covered

**Data structures** — arrays, singly/doubly linked lists, stacks, queues
(linear and circular), hash tables (separate chaining and linear probing with
tombstones), binary search trees and AVL trees, binary heaps, graphs.

**Algorithms** — linear and binary search; bubble, selection, insertion, merge,
quick, heap and counting sort; BFS, DFS, Dijkstra, A*, topological sort,
Kruskal's MST; factorial, Fibonacci, recursive binary search, Tower of Hanoi,
maze solving and N-Queens.

## Testing

```bash
npm test
```

The suite covers algorithm correctness (empty, single-element, duplicate,
sorted, reverse-sorted and negative inputs), structural invariants (BST
ordering, AVL balance factors and heights, heap property, no leaked nodes),
reference cross-checks (traversals against a separate implementation, Kruskal
against a brute-force minimum, A* admissibility against Dijkstra's true
distances), the playback engine (forward/backward navigation, reset, speed
changes, no overlapping timers, cleanup on unmount) and the React shell
(keyboard control, code-panel synchronization, input validation).

## Keyboard

`Space` play/pause · `←` `→` step · `Home` `End` jump · `R` reset
