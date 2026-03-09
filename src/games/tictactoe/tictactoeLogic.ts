// src/games/tictactoe/tictactoeLogic.ts
// Simple tic-tac-toe game logic (pure functions)

export type Cell = null | 0 | 1; // 0 = X (Red), 1 = O (Blue)

export interface TicState {
  board: Cell[]; // 9 cells
  currentPlayer: 0 | 1;
  winner: 'red' | 'blue' | 'draw' | null;
  gameOver: boolean;
  scores: [number, number];
  lastMove: number | null;
}

export function createInitialState(): TicState {
  return {
    board: Array(9).fill(null),
    currentPlayer: 0,
    winner: null,
    gameOver: false,
    scores: [0, 0],
    lastMove: null,
  };
}

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

export function checkWinner(board: Cell[]): 'red' | 'blue' | 'draw' | null {
  for (const [a,b,c] of LINES) {
    if (board[a] !== null && board[a] === board[b] && board[b] === board[c]) {
      return board[a] === 0 ? 'red' : 'blue';
    }
  }
  if (board.every((c) => c !== null)) return 'draw';
  return null;
}

export function isValidMove(idx: number, board: Cell[]): boolean {
  return idx >=0 && idx < 9 && board[idx] === null;
}

export function applyMove(state: TicState, idx: number): TicState {
  if (state.gameOver) return state;
  if (!isValidMove(idx, state.board)) return state;

  const newBoard = state.board.slice();
  newBoard[idx] = state.currentPlayer as Cell;

  const winner = checkWinner(newBoard);
  const newScores: [number,number] = [...state.scores];
  let gameOver = false;
  if (winner) {
    gameOver = true;
    if (winner === 'red') newScores[0]++;
    else if (winner === 'blue') newScores[1]++;
  }

  const nextPlayer = state.currentPlayer === 0 ? 1 : 0;

  return {
    ...state,
    board: newBoard,
    currentPlayer: nextPlayer,
    winner: winner,
    gameOver,
    scores: newScores,
    lastMove: idx,
  };
}

export function resetState(state: TicState): TicState {
  return { ...createInitialState(), scores: state.scores };
}
