import { StepRecorder } from '@/engine/recorder';
import { InputError, type AlgorithmResult } from '@/engine/types';
import { CallStack } from './simple';
import type {
  Cell,
  RecursionAlgorithmSpec,
  RecursionExtra,
  RecursionState,
} from './types';

/* ------------------------------------------------------- Tower of Hanoi */

const HANOI_PSEUDOCODE = `function hanoi(n, from, to, spare):
  if n == 0:
    return
  hanoi(n - 1, from, spare, to)
  move disk n from "from" to "to"
  hanoi(n - 1, spare, to, from)`;

const HANOI_TYPESCRIPT = `export function hanoi(
  n: number,
  from: number,
  to: number,
  spare: number,
  moves: [number, number][] = [],
): [number, number][] {
  if (n === 0) {
    return moves;
  }
  hanoi(n - 1, from, spare, to, moves);
  moves.push([from, to]);
  hanoi(n - 1, spare, to, from, moves);
  return moves;
}`;

const PEG_NAMES = ['A', 'B', 'C'];

export function towerOfHanoi(
  args: Record<string, number>,
): AlgorithmResult<RecursionState> {
  const disks = Math.trunc(args.disks ?? 3);
  if (disks < 1 || disks > 6) {
    throw new InputError('Choose 1 to 6 disks — 6 already needs 63 moves.');
  }

  const recorder = new StepRecorder<RecursionState>();
  const stack = new CallStack();
  const pegs: number[][] = [
    Array.from({ length: disks }, (_, i) => disks - i),
    [],
    [],
  ];
  let moves = 0;

  const extra = (moving: number | null = null): RecursionExtra => ({
    kind: 'hanoi',
    pegs: pegs.map((peg) => [...peg]),
    moves,
    moving,
  });

  recorder.push({
    state: stack.snapshot(extra()),
    description: `Move ${disks} disks from peg A to peg C, never putting a larger disk on a smaller one. The trick is that moving n disks reduces to moving n − 1 twice.`,
    operation: 'start',
    highlightedLines: [1],
  });

  const solve = (n: number, from: number, to: number, spare: number): void => {
    stack.push(
      `hanoi(${n}, ${PEG_NAMES[from]}→${PEG_NAMES[to]})`,
      stack.depth + 1,
    );
    recorder.set('depth', stack.depth);

    if (n === 0) {
      recorder.count('comparisons');
      recorder.push({
        state: stack.snapshot(extra()),
        description: 'n = 0 — nothing to move. Return immediately.',
        operation: 'base-case',
        highlightedLines: [2, 3],
      });
      stack.pop('—');
      return;
    }

    recorder.push({
      state: stack.snapshot(extra()),
      description: `To move ${n} disks ${PEG_NAMES[from]} → ${PEG_NAMES[to]}: first get the top ${n - 1} out of the way onto ${PEG_NAMES[spare]}.`,
      operation: 'plan',
      highlightedLines: [4],
    });
    solve(n - 1, from, spare, to);
    recorder.set('depth', stack.depth);

    const disk = pegs[from].pop() as number;
    pegs[to].push(disk);
    moves += 1;
    recorder.count('swaps');
    recorder.push({
      state: stack.snapshot(extra(disk)),
      description: `Move disk ${disk} from ${PEG_NAMES[from]} to ${PEG_NAMES[to]}. That is move ${moves} of ${2 ** disks - 1}.`,
      operation: 'move',
      highlightedLines: [5],
    });

    recorder.push({
      state: stack.snapshot(extra()),
      description: `Now move those ${n - 1} disks from ${PEG_NAMES[spare]} on top of disk ${disk} at ${PEG_NAMES[to]}.`,
      operation: 'plan',
      highlightedLines: [6],
    });
    solve(n - 1, spare, to, from);
    recorder.set('depth', stack.depth);

    stack.pop('—');
    recorder.push({
      state: stack.snapshot(extra()),
      description: `All ${n} disks are now on ${PEG_NAMES[to]}. Return.`,
      operation: 'return',
      highlightedLines: [6],
    });
  };

  solve(disks, 0, 2, 1);
  recorder.set('depth', 0);

  recorder.push({
    state: stack.snapshot(extra(), `${moves} moves`),
    description: `Solved in ${moves} moves, which is 2^${disks} − 1 = ${2 ** disks - 1}. That bound is optimal: disk ${disks} must move at least once, and everything above it must clear out and come back.`,
    operation: 'done',
    highlightedLines: [1],
  });

  return recorder.finish({
    timeComplexity: 'O(2ⁿ)',
    spaceComplexity: 'O(n) call stack',
    summary: `${moves} moves`,
  });
}

/* ---------------------------------------------------------- Maze solving */

const MAZE_PSEUDOCODE = `function solve(maze, row, col, path):
  if outside maze or wall or already on path:
    return false
  path.append((row, col))
  if (row, col) is the goal:
    return true
  for each direction in [down, right, up, left]:
    if solve(maze, next row, next col, path):
      return true
  path.removeLast()          // backtrack
  return false`;

const MAZE_TYPESCRIPT = `export function solve(
  maze: string[][],
  row: number,
  col: number,
  path: [number, number][] = [],
  seen = new Set<string>(),
): boolean {
  const key = \`\${row},\${col}\`;
  if (
    row < 0 || row >= maze.length ||
    col < 0 || col >= maze[0].length ||
    maze[row][col] === '#' || seen.has(key)
  ) {
    return false;
  }
  seen.add(key);
  path.push([row, col]);
  if (maze[row][col] === 'G') {
    return true;
  }
  const moves = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  for (const [dr, dc] of moves) {
    if (solve(maze, row + dr, col + dc, path, seen)) {
      return true;
    }
  }
  path.pop();
  return false;
}`;

/**
 * Hand-checked layouts. Both force the solver into at least one dead end
 * before it finds the goal — a maze it walks straight through would show
 * nothing of what backtracking actually is.
 */
const MAZE_LAYOUTS: string[][] = [
  [
    'S.......',
    '.######.',
    '.#......',
    '##.#.#..',
    '...#.#..',
    '.#...#.#',
    '.###.#..',
    '.....#.G',
  ],
  [
    'S..####.',
    '.#.#####',
    '#..#....',
    '#....#.#',
    '#...#..#',
    '#..###..',
    '#.#...#.',
    '#######G',
  ],
];

const toCell = (character: string): Cell =>
  character === '#'
    ? 'wall'
    : character === 'S'
      ? 'start'
      : character === 'G'
        ? 'goal'
        : 'open';

const DIRECTIONS: { name: string; dr: number; dc: number }[] = [
  { name: 'down', dr: 1, dc: 0 },
  { name: 'right', dr: 0, dc: 1 },
  { name: 'up', dr: -1, dc: 0 },
  { name: 'left', dr: 0, dc: -1 },
];

export function mazeSolver(
  args: Record<string, number>,
): AlgorithmResult<RecursionState> {
  const layoutIndex = Math.trunc(args.layout ?? 0);
  const layout = MAZE_LAYOUTS[layoutIndex] ?? MAZE_LAYOUTS[0];
  const grid: Cell[][] = layout.map((row) => [...row].map(toCell));
  const rows = grid.length;
  const columns = grid[0].length;

  const recorder = new StepRecorder<RecursionState>();
  const stack = new CallStack();
  const path: string[] = [];
  const deadEnds: string[] = [];
  const seen = new Set<string>();
  let solved = false;

  const extra = (current: string | null): RecursionExtra => ({
    kind: 'maze',
    grid: grid.map((row) => [...row]),
    path: [...path],
    deadEnds: [...deadEnds],
    current,
    solved,
  });

  recorder.push({
    state: stack.snapshot(extra(null)),
    description: `Find a path from S to G. The solver walks down, right, up, left in that order, and undoes any step that leads nowhere — that undo is the backtracking.`,
    operation: 'start',
    highlightedLines: [1],
  });

  const solve = (row: number, column: number, via: string): boolean => {
    const key = `${row},${column}`;
    stack.push(`solve(${row}, ${column})`, stack.depth + 1);
    recorder.set('depth', stack.depth);
    recorder.count('comparisons');

    const outside = row < 0 || row >= rows || column < 0 || column >= columns;
    const blocked = !outside && grid[row][column] === 'wall';
    const repeated = seen.has(key);

    if (outside || blocked || repeated) {
      recorder.push({
        state: stack.snapshot(extra(outside ? null : key)),
        description: outside
          ? `(${row}, ${column}) is outside the maze — reject this branch.`
          : blocked
            ? `(${row}, ${column}) is a wall — reject.`
            : `(${row}, ${column}) is already on the current path — reject, or the search would loop forever.`,
        operation: 'reject',
        highlightedLines: [2, 3],
      });
      stack.pop('false');
      return false;
    }

    seen.add(key);
    path.push(key);
    recorder.count('writes');
    recorder.push({
      state: stack.snapshot(extra(key)),
      description: `Step onto (${row}, ${column})${via ? ` by moving ${via}` : ''}. Path length is now ${path.length}.`,
      operation: 'step',
      highlightedLines: [3, 4],
    });

    if (grid[row][column] === 'goal') {
      solved = true;
      recorder.push({
        state: stack.snapshot(extra(key)),
        description: `(${row}, ${column}) is the goal. Return true, and every waiting frame returns true too without undoing its step — that is how the path survives.`,
        operation: 'goal',
        highlightedLines: [5, 6],
      });
      stack.pop('true');
      return true;
    }

    for (const direction of DIRECTIONS) {
      recorder.push({
        state: stack.snapshot(extra(key)),
        description: `From (${row}, ${column}), try ${direction.name}.`,
        operation: 'try',
        highlightedLines: [7, 8],
      });
      if (solve(row + direction.dr, column + direction.dc, direction.name)) {
        recorder.set('depth', stack.depth);
        stack.pop('true');
        return true;
      }
      recorder.set('depth', stack.depth);
    }

    path.pop();
    deadEnds.push(key);
    recorder.push({
      state: stack.snapshot(extra(key)),
      description: `Every direction from (${row}, ${column}) failed, so it is a dead end. Remove it from the path and return false — the caller will try its next direction.`,
      operation: 'backtrack',
      highlightedLines: [9, 10],
    });
    stack.pop('false');
    return false;
  };

  let startRow = 0;
  let startColumn = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      if (grid[r][c] === 'start') {
        startRow = r;
        startColumn = c;
      }
    }
  }

  const found = solve(startRow, startColumn, '');
  recorder.set('depth', 0);

  recorder.push({
    state: stack.snapshot(
      extra(null),
      found ? `path of ${path.length} cells` : 'no path',
    ),
    description: found
      ? `Reached the goal with a path of ${path.length} cells after abandoning ${deadEnds.length} dead end${deadEnds.length === 1 ? '' : 's'}. Depth-first backtracking finds *a* path, not necessarily the shortest — BFS would give that.`
      : 'Every reachable cell was tried and none led to the goal, so no path exists.',
    operation: 'done',
    highlightedLines: [10, 11],
  });

  return recorder.finish({
    timeComplexity: 'O(rows × columns)',
    spaceComplexity: 'O(rows × columns) call stack',
    summary: found ? `${path.length} cells` : 'no path',
  });
}

/* -------------------------------------------------------------- N-Queens */

const QUEENS_PSEUDOCODE = `function solve(board, row):
  if row == n:
    return true                  // all rows filled
  for column from 0 to n - 1:
    if isSafe(board, row, column):
      place queen at (row, column)
      if solve(board, row + 1):
        return true
      remove queen             // backtrack
  return false

function isSafe(board, row, column):
  for each placed queen (r, c):
    if c == column or |row - r| == |column - c|:
      return false
  return true`;

const QUEENS_TYPESCRIPT = `export function solve(queens: number[], row: number, n: number): boolean {
  if (row === n) {
    return true;
  }
  for (let column = 0; column < n; column += 1) {
    if (isSafe(queens, row, column)) {
      queens[row] = column;
      if (solve(queens, row + 1, n)) {
        return true;
      }
      queens[row] = -1;
    }
  }
  return false;
}

function isSafe(queens: number[], row: number, column: number): boolean {
  for (let r = 0; r < row; r += 1) {
    const c = queens[r];
    if (c === column || Math.abs(row - r) === Math.abs(column - c)) {
      return false;
    }
  }
  return true;
}`;

export function nQueens(
  args: Record<string, number>,
): AlgorithmResult<RecursionState> {
  const size = Math.trunc(args.size ?? 6);
  if (size < 1 || size > 8) {
    throw new InputError('Choose a board between 1×1 and 8×8.');
  }

  const recorder = new StepRecorder<RecursionState>();
  const stack = new CallStack();
  const queens = new Array<number>(size).fill(-1);
  let placements = 0;

  const extra = (
    trying: { row: number; column: number } | null,
    conflict: { row: number; column: number } | null = null,
  ): RecursionExtra => ({
    kind: 'queens',
    size,
    queens: [...queens],
    trying,
    conflict,
    solutions: 0,
  });

  recorder.push({
    state: stack.snapshot(extra(null)),
    description: `Place ${size} queens on a ${size}×${size} board so no two share a row, column or diagonal. One queen per row is assumed, so each frame only has to choose a column.`,
    operation: 'start',
    highlightedLines: [1],
  });

  /** Returns the blocking queen, or null when the square is safe. */
  const conflictFor = (
    row: number,
    column: number,
  ): { row: number; column: number } | null => {
    for (let r = 0; r < row; r += 1) {
      const c = queens[r];
      if (c === -1) continue;
      recorder.count('comparisons');
      if (c === column || Math.abs(row - r) === Math.abs(column - c)) {
        return { row: r, column: c };
      }
    }
    return null;
  };

  const solve = (row: number): boolean => {
    stack.push(`solve(row ${row})`, stack.depth + 1);
    recorder.set('depth', stack.depth);

    if (row === size) {
      recorder.push({
        state: stack.snapshot(extra(null)),
        description: `All ${size} rows hold a queen — this is a solution. Return true all the way up.`,
        operation: 'solution',
        highlightedLines: [2, 3],
      });
      stack.pop('true');
      return true;
    }

    for (let column = 0; column < size; column += 1) {
      const conflict = conflictFor(row, column);
      recorder.push({
        state: stack.snapshot(extra({ row, column }, conflict)),
        description: conflict
          ? `(${row}, ${column}) is attacked by the queen at (${conflict.row}, ${conflict.column}) — ${
              conflict.column === column ? 'same column' : 'same diagonal'
            }. Try the next column.`
          : `(${row}, ${column}) is not attacked by any placed queen, so it is safe.`,
        operation: conflict ? 'conflict' : 'safe',
        highlightedLines: [4, 5],
      });

      if (conflict) continue;

      queens[row] = column;
      placements += 1;
      recorder.count('writes');
      recorder.push({
        state: stack.snapshot(extra({ row, column })),
        description: `Place a queen at (${row}, ${column}) — placement ${placements} — and move on to row ${row + 1}.`,
        operation: 'place',
        highlightedLines: [6, 7],
      });

      if (solve(row + 1)) {
        recorder.set('depth', stack.depth);
        stack.pop('true');
        return true;
      }
      recorder.set('depth', stack.depth);

      queens[row] = -1;
      recorder.push({
        state: stack.snapshot(extra({ row, column })),
        description: `Row ${row + 1} had no safe square anywhere, so (${row}, ${column}) cannot be part of a solution. Remove that queen and try column ${column + 1} — this is the backtrack.`,
        operation: 'backtrack',
        highlightedLines: [8, 9],
      });
    }

    recorder.push({
      state: stack.snapshot(extra(null)),
      description: `No column in row ${row} works given the queens above it. Return false so the caller backtracks.`,
      operation: 'dead-end',
      highlightedLines: [10],
    });
    stack.pop('false');
    return false;
  };

  const solved = solve(0);
  recorder.set('depth', 0);

  recorder.push({
    state: stack.snapshot(
      extra(null),
      solved ? queens.map((column) => column + 1).join(', ') : 'no solution',
    ),
    description: solved
      ? `Solved after ${placements} placements and ${recorder.stats.comparisons} safety checks. Queens sit at columns ${queens.join(', ')} for rows 0…${size - 1}. Brute force would have tried ${size}^${size} = ${size ** size} boards; pruning each unsafe square early is what makes this tractable.`
      : `No arrangement exists for ${size} queens — 2×2 and 3×3 are the only impossible sizes.`,
    operation: 'done',
    highlightedLines: [1],
  });

  return recorder.finish({
    timeComplexity: 'O(n!) worst case, far less with pruning',
    spaceComplexity: 'O(n) call stack',
    summary: solved ? queens.join(', ') : 'no solution',
  });
}

export const hanoiSpec: RecursionAlgorithmSpec = {
  id: 'hanoi',
  name: 'Tower of Hanoi',
  tagline: 'Two recursive calls around a single move.',
  fields: [{ name: 'disks', label: 'Disks', min: 1, max: 6 }],
  defaults: { disks: 3 },
  run: towerOfHanoi,
  code: {
    pseudocode: HANOI_PSEUDOCODE,
    typescript: HANOI_TYPESCRIPT,
    lineMap: { 1: [1], 2: [8], 3: [9], 4: [11], 5: [12], 6: [13] },
  },
  complexity: {
    best: 'O(2ⁿ)',
    average: 'O(2ⁿ)',
    worst: 'O(2ⁿ)',
    space: 'O(n)',
  },
  learn: {
    what: 'Three pegs, n disks of decreasing size, and one rule: a larger disk may never sit on a smaller one. The recursive insight is that moving n disks from A to C is the same problem twice: move n−1 to the spare peg, move the big disk across, then move those n−1 on top of it. That gives T(n) = 2·T(n−1) + 1 = 2ⁿ − 1 moves, which is provably optimal.',
    how: [
      'Moving 0 disks is the base case — do nothing.',
      'Move the top n−1 disks from the source to the spare peg, using the destination as the new spare.',
      'Move disk n, now exposed, from the source to the destination.',
      'Move those n−1 disks from the spare onto the destination, using the source as the new spare.',
      'Which peg plays which role rotates at each level, and that is the entire algorithm.',
    ],
    useCases: [
      'Teaching recursion where the recursive call is not a simple tail call.',
      'Benchmarking recursion and stack depth.',
      'Backup rotation schemes that reuse the Hanoi move sequence.',
    ],
    pros: [
      'Six lines of code for a problem that is painful to solve iteratively.',
      'Provably optimal: 2ⁿ − 1 moves cannot be beaten.',
      'Stack depth is only n, even though the move count is exponential.',
    ],
    cons: [
      'Exponential time — 20 disks is over a million moves.',
      'The move sequence is hard to follow without a picture.',
    ],
    challenge:
      'Solve 3 disks and count the moves (7 = 2³ − 1). Before running 4, predict the count. Then pause halfway through 4 disks: which peg holds the largest disk at exactly the midpoint, and why must that be true?',
  },
};

export const mazeSpec: RecursionAlgorithmSpec = {
  id: 'maze',
  name: 'Maze Solving',
  tagline: 'Depth-first backtracking through a grid.',
  fields: [{ name: 'layout', label: 'Maze', min: 0, max: 1 }],
  defaults: { layout: 0 },
  run: mazeSolver,
  code: {
    pseudocode: MAZE_PSEUDOCODE,
    typescript: MAZE_TYPESCRIPT,
    lineMap: { 1: [1], 2: [9, 10, 11, 12], 3: [13], 4: [16], 5: [17], 6: [18], 7: [20, 21], 8: [22], 9: [25], 10: [26], 11: [26] },
  },
  complexity: {
    best: 'O(1)',
    average: 'O(rows × cols)',
    worst: 'O(rows × cols)',
    space: 'O(rows × cols)',
  },
  learn: {
    what: 'Maze solving by recursion is depth-first search with an undo. The solver commits to a direction and keeps going until it hits a wall, the edge, or a cell already on its path. When every direction from a cell fails, it removes that cell from the path and returns false, letting the previous cell try its next direction. That removal is backtracking.',
    how: [
      'Reject immediately if the cell is outside the maze, a wall, or already on the path.',
      'Otherwise step onto it and add it to the path.',
      'If it is the goal, return true — and every waiting frame returns true without undoing, so the path stays intact.',
      'Try each direction in turn, recursing into it.',
      'If all four fail, pop the cell off the path, mark it a dead end and return false.',
      'The "already seen" check is what stops the search cycling forever.',
    ],
    useCases: [
      'Puzzle and game solvers — mazes, Sudoku, word search.',
      'Flood fill and connected-region problems.',
      'Any constraint search where partial solutions can be abandoned early.',
    ],
    pros: [
      'Short and direct — the recursion handles all the bookkeeping.',
      'Memory proportional to path length rather than frontier width.',
      'Finds a path on any maze that has one.',
    ],
    cons: [
      'The path found is usually not the shortest — BFS gives that.',
      'Worst case visits every cell.',
      'Deep mazes can exhaust the call stack.',
    ],
    challenge:
      'Watch for the first backtrack and note which cell becomes a dead end. Then count the path length and compare it with the straight-line distance from S to G — how much longer is the depth-first path?',
  },
};

export const nQueensSpec: RecursionAlgorithmSpec = {
  id: 'n-queens',
  name: 'N-Queens',
  tagline: 'Place one queen per row, undoing whenever a row runs out of squares.',
  fields: [{ name: 'size', label: 'Board size', min: 1, max: 8 }],
  defaults: { size: 6 },
  run: nQueens,
  code: {
    pseudocode: QUEENS_PSEUDOCODE,
    typescript: QUEENS_TYPESCRIPT,
    lineMap: {
      1: [1], 2: [2], 3: [3], 4: [5], 5: [6], 6: [7], 7: [8], 8: [9], 9: [11], 10: [14],
      12: [17], 13: [18, 19], 14: [20], 15: [21], 16: [24],
    },
  },
  complexity: {
    best: 'O(n²)',
    average: 'O(n!) with pruning',
    worst: 'O(n!)',
    space: 'O(n)',
  },
  learn: {
    what: 'N-Queens asks for n queens on an n×n board with none attacking another. Because every row must hold exactly one queen, the search is "choose a column for row 0, then row 1, …". The power comes from pruning: an unsafe square is rejected before any deeper search happens, which cuts away whole subtrees of the nⁿ possible boards.',
    how: [
      'Work row by row — row r’s frame only chooses a column.',
      'A square is safe if no placed queen shares its column or either diagonal (|Δrow| ≠ |Δcolumn|).',
      'Place a queen on the first safe square and recurse into the next row.',
      'If that recursion succeeds, the whole board is solved.',
      'If it fails, remove the queen and try the next column — the backtrack.',
      'If no column in a row works, return false so the row above backtracks instead.',
    ],
    useCases: [
      'The canonical constraint-satisfaction and backtracking example.',
      'Benchmarking search pruning and heuristics.',
      'A stepping stone to Sudoku solvers, graph colouring and scheduling.',
    ],
    pros: [
      'Pruning makes an astronomically large search space tractable.',
      'Only O(n) memory — a single column per row.',
      'The same skeleton solves most constraint puzzles.',
    ],
    cons: [
      'Still exponential in the worst case.',
      'Performance depends heavily on the order columns are tried.',
      '2×2 and 3×3 have no solution at all, which is easy to mistake for a bug.',
    ],
    challenge:
      'Run 4×4 and find the first backtrack. Then try 3×3 and watch it exhaust every option — can you argue from the first two rows why no 3×3 solution can exist?',
  },
};
