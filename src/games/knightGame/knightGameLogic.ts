// src/games/knightGame/knightGameLogic.ts
// CS Concept: Dynamic Programming + Grundy Numbers (Sprague-Grundy theorem)

export type Player = 0 | 1;

export const BOARD_ROWS = 5;
export const BOARD_COLS = 5;

export interface KnightState {
  knightPos: [number, number];   // [row, col]
  visitedCells: [number, number][]; // cells the knight has been on
  currentPlayer: Player;
  scores: [number, number];
  gameOver: boolean;
  winner: 'red' | 'blue' | null;
  moveHistory: { player: Player; from: [number, number]; to: [number, number] }[];
  grundyGrid: number[][];        // precomputed Grundy values
  message: string;
  showGrundy: boolean;
  validMoves: [number, number][];
}

// ─── Knight moves (L-shape, but only forward: row increases) ─────────────────
// To make game finite: knight can only move to cells it hasn't visited
const KNIGHT_DELTAS: [number, number][] = [
  [1, 2], [1, -2], [2, 1], [2, -1],
  [-1, 2], [-1, -2], [-2, 1], [-2, -1],
];

export function getKnightMoves(
  pos: [number, number],
  visited: Set<string>,
  rows = BOARD_ROWS,
  cols = BOARD_COLS
): [number, number][] {
  const [r, c] = pos;
  return KNIGHT_DELTAS
    .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
    .filter(([nr, nc]) =>
      nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
      !visited.has(`${nr},${nc}`)
    );
}

// ─── Grundy number computation via mex ───────────────────────────────────────
function mex(values: Set<number>): number {
  let m = 0;
  while (values.has(m)) m++;
  return m;
}

/** Compute Grundy numbers for all cells on an empty board (no visited constraint) */
export function computeGrundyGrid(rows = BOARD_ROWS, cols = BOARD_COLS): number[][] {
  // Use memoisation — compute from bottom-right corner up
  const memo: Map<string, number> = new Map();

  function grundy(r: number, c: number, visited: Set<string>): number {
    const moves = KNIGHT_DELTAS
      .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
      .filter(([nr, nc]) =>
        nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
        !visited.has(`${nr},${nc}`)
      );

    if (moves.length === 0) return 0; // terminal — losing position

    const childValues = new Set<number>();
    const newVisited = new Set(visited);
    newVisited.add(`${r},${c}`);

    for (const [nr, nc] of moves) {
      childValues.add(grundy(nr, nc, newVisited));
    }
    return mex(childValues);
  }

  // Simple 2D grundy without visited state for display purposes
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  // Compute without visited (approximation for display)
  const simpleGrundy: Map<string, number> = new Map();

  function sg(r: number, c: number): number {
    const key = `${r},${c}`;
    if (simpleGrundy.has(key)) return simpleGrundy.get(key)!;

    const moves = KNIGHT_DELTAS
      .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
      .filter(([nr, nc]) => nr >= 0 && nr < rows && nc >= 0 && nc < cols);

    if (moves.length === 0) { simpleGrundy.set(key, 0); return 0; }

    const childVals = new Set(moves.map(([nr, nc]) => sg(nr, nc)));
    const g = mex(childVals);
    simpleGrundy.set(key, g);
    return g;
  }

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      grid[r][c] = sg(r, c);

  return grid;
}

function getValidMovesFromState(pos: [number, number], visited: [number, number][]): [number, number][] {
  const visitedSet = new Set(visited.map(([r, c]) => `${r},${c}`));
  visitedSet.add(`${pos[0]},${pos[1]}`);
  return getKnightMoves(pos, visitedSet);
}

export function createInitialState(startPos: [number, number] = [4, 0]): KnightState {
  const grundyGrid = computeGrundyGrid();
  const visited: [number, number][] = [startPos];
  const validMoves = getValidMovesFromState(startPos, []);
  const g = grundyGrid[startPos[0]][startPos[1]];

  return {
    knightPos: startPos,
    visitedCells: visited,
    currentPlayer: 0,
    scores: [0, 0],
    gameOver: false,
    winner: null,
    moveHistory: [],
    grundyGrid,
    message: g === 0
      ? `Grundy(start)=0 — Red is in a LOSING position!`
      : `Grundy(start)=${g} — Red has a winning move!`,
    showGrundy: false,
    validMoves,
  };
}

export function applyMove(state: KnightState, to: [number, number]): KnightState {
  if (state.gameOver) return state;
  const { currentPlayer, knightPos, visitedCells } = state;

  // Validate move
  const valid = state.validMoves.some(([r, c]) => r === to[0] && c === to[1]);
  if (!valid) return state;

  const newVisited: [number, number][] = [...visitedCells, to];
  const nextPlayer: Player = currentPlayer === 0 ? 1 : 0;
  const history = [...state.moveHistory, { player: currentPlayer, from: knightPos, to }];
  const nextMoves = getValidMovesFromState(to, newVisited);

  if (nextMoves.length === 0) {
    // Next player has no moves — current player wins
    const newScores: [number, number] = [...state.scores];
    newScores[currentPlayer]++;
    return {
      ...state,
      knightPos: to,
      visitedCells: newVisited,
      gameOver: true,
      winner: currentPlayer === 0 ? 'red' : 'blue',
      scores: newScores,
      moveHistory: history,
      validMoves: [],
      message: `${currentPlayer === 0 ? 'Red' : 'Blue'} WINS — opponent has no moves! 🎉`,
    };
  }

  const g = state.grundyGrid[to[0]][to[1]];
  return {
    ...state,
    knightPos: to,
    visitedCells: newVisited,
    currentPlayer: nextPlayer,
    moveHistory: history,
    validMoves: nextMoves,
    message: `Grundy=${g} ${g === 0 ? '(losing pos for ' + (nextPlayer === 0 ? 'Red' : 'Blue') + ')' : ''}. ${nextPlayer === 0 ? 'Red' : 'Blue'}'s turn.`,
  };
}

export function resetState(startPos?: [number, number]): KnightState {
  return createInitialState(startPos ?? [4, 0]);
}
