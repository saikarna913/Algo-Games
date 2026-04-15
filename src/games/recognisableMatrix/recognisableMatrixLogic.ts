// src/games/recognisableMatrix/recognisableMatrixLogic.ts
// Recognisable Matrix Game Logic
// Goal: Swap rows and columns to make all diagonal elements 1

export interface MatrixState {
  matrix: number[][];
  n: number;
  rowSwaps: number;
  colSwaps: number;
  moves: Array<{ type: 'row' | 'col'; idx1: number; idx2: number }>;
  isRecognisable: boolean | null;
  gameOver: boolean;
  winner: 'red' | 'blue' | 'draw' | null;
  scores: [number, number];
  currentPlayer: 0 | 1; // 0 = red (makes move), 1 = blue (tries to find solution)
  maxMoves: number;
  hintUsed: number;
  maxHints: number;
}

/**
 * Generate a random binary matrix of size n×n
 */
export function generateRandomMatrix(n: number): number[][] {
  return Array(n)
    .fill(0)
    .map(() => Array(n)
      .fill(0)
      .map(() => Math.random() > 0.5 ? 1 : 0));
}

/**
 * Create initial game state for a given matrix size
 */
export function createInitialState(n: number = 4): MatrixState {
  const matrix = generateRandomMatrix(n);
  return {
    matrix, // Will be mutated as player makes moves
    n,
    rowSwaps: 0,
    colSwaps: 0,
    moves: [],
    isRecognisable: null,
    gameOver: false,
    winner: null,
    scores: [0, 0],
    currentPlayer: 0,
    maxMoves: n * 3,
    hintUsed: 0,
    maxHints: 2,
  };
}

/**
 * Check if all diagonal elements are 1
 */
export function isAllDiagonalOnes(matrix: number[][], n: number): boolean {
  for (let i = 0; i < n; i++) {
    if (matrix[i][i] !== 1) return false;
  }
  return true;
}

/**
 * Swap two rows in the matrix
 */
export function swapRows(matrix: number[][], r1: number, r2: number): number[][] {
  const newMatrix = matrix.map(row => [...row]);
  [newMatrix[r1], newMatrix[r2]] = [newMatrix[r2], newMatrix[r1]];
  return newMatrix;
}

/**
 * Swap two columns in the matrix
 */
export function swapColumns(matrix: number[][], c1: number, c2: number): number[][] {
  const newMatrix = matrix.map(row => [...row]);
  for (let i = 0; i < newMatrix.length; i++) {
    [newMatrix[i][c1], newMatrix[i][c2]] = [newMatrix[i][c2], newMatrix[i][c1]];
  }
  return newMatrix;
}

/**
 * Apply a row swap move
 */
export function applyRowSwap(state: MatrixState, r1: number, r2: number): MatrixState {
  if (r1 === r2) return state;
  if (state.gameOver) return state;

  const newMatrix = swapRows(state.matrix, r1, r2);
  const newState = {
    ...state,
    matrix: newMatrix,
    rowSwaps: state.rowSwaps + 1,
    moves: [...state.moves, { type: 'row' as const, idx1: r1, idx2: r2 }],
    currentPlayer: 1 as const,
  };

  // Check if player won (diagonal all 1s)
  if (isAllDiagonalOnes(newMatrix, state.n)) {
    return {
      ...newState,
      gameOver: true,
      winner: 'red',
    };
  }

  // Check if max moves exceeded
  if (newState.rowSwaps + newState.colSwaps >= state.maxMoves) {
    return {
      ...newState,
      gameOver: true,
      winner: 'blue',
    };
  }

  return newState;
}

/**
 * Apply a column swap move
 */
export function applyColSwap(state: MatrixState, c1: number, c2: number): MatrixState {
  if (c1 === c2) return state;
  if (state.gameOver) return state;

  const newMatrix = swapColumns(state.matrix, c1, c2);
  const newState = {
    ...state,
    matrix: newMatrix,
    colSwaps: state.colSwaps + 1,
    moves: [...state.moves, { type: 'col' as const, idx1: c1, idx2: c2 }],
    currentPlayer: 0 as const,
  };

  // Check if player won
  if (isAllDiagonalOnes(newMatrix, state.n)) {
    return {
      ...newState,
      gameOver: true,
      winner: 'red',
    };
  }

  // Check if max moves exceeded
  if (newState.rowSwaps + newState.colSwaps >= state.maxMoves) {
    return {
      ...newState,
      gameOver: true,
      winner: 'blue',
    };
  }

  return newState;
}

/**
 * Undo the last move
 */
export function undoLastMove(state: MatrixState): MatrixState {
  if (state.moves.length === 0) return state;

  let matrix = state.matrix;
  let rowSwaps = state.rowSwaps;
  let colSwaps = state.colSwaps;

  const lastMove = state.moves[state.moves.length - 1];
  if (lastMove.type === 'row') {
    matrix = swapRows(matrix, lastMove.idx1, lastMove.idx2);
    rowSwaps--;
  } else {
    matrix = swapColumns(matrix, lastMove.idx1, lastMove.idx2);
    colSwaps--;
  }

  return {
    ...state,
    matrix,
    rowSwaps,
    colSwaps,
    moves: state.moves.slice(0, -1),
    currentPlayer: lastMove.type === 'row' ? 0 : 1,
  };
}

/**
 * Check if matrix is recognisable using bipartite matching
 * A matrix is recognisable if a perfect matching exists in the bipartite graph
 * where edge (i,j) exists if matrix[i][j] == 1
 */
export function checkRecognisable(matrix: number[][], n: number): boolean {
  // Build adjacency list: for each row i, which columns have value 1?
  const adj: number[][] = [];
  for (let i = 0; i < n; i++) {
    adj[i] = [];
    for (let j = 0; j < n; j++) {
      if (matrix[i][j] === 1) {
        adj[i].push(j);
      }
    }
  }

  // Matching array: matchCol[j] = i means column j is matched to row i
  const matchCol = Array(n).fill(-1);

  // Try to find a matching for each row
  let matchedRows = 0;
  for (let i = 0; i < n; i++) {
    const visited = Array(n).fill(false);
    if (dfsMatching(i, adj, visited, matchCol)) {
      matchedRows++;
    }
  }

  // Perfect matching exists if all rows are matched
  return matchedRows === n;
}

/**
 * DFS for bipartite matching (Hungarian algorithm)
 */
function dfsMatching(u: number, adj: number[][], visited: boolean[], matchCol: number[]): boolean {
  for (const v of adj[u]) {
    if (visited[v]) continue;
    visited[v] = true;

    // If column v is not matched OR we can re-match the previous row
    if (matchCol[v] === -1 || dfsMatching(matchCol[v], adj, visited, matchCol)) {
      matchCol[v] = u;
      return true;
    }
  }
  return false;
}

/**
 * Reset state while preserving scores
 */
export function resetState(state: MatrixState): MatrixState {
  const n = state.n;
  return {
    ...createInitialState(n),
    scores: state.scores,
  };
}
