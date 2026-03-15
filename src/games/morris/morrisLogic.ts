// src/games/morris/morrisLogic.ts
// CS Concept: Graph Theory — adjacency, connected components, constraint satisfaction

// ─── Board Layout ─────────────────────────────────────────────────────────────
// 24 positions arranged in 3 concentric squares connected by spokes
// Position indices:
//
//  0 ——————— 1 ——————— 2
//  |         |         |
//  |  8 ——— 9 ——— 10   |
//  |  |              |  |
//  |  | 16—17—18    |  |
//  |  |   |   |     |  |
//  7  15  23  19   11  3
//  |  |   |   |     |  |
//  |  | 22—21—20    |  |
//  |  |              |  |
//  |  14——13——12    |  |
//  |         |         |
//  6 ——————— 5 ——————— 4

export type Cell = null | 'red' | 'blue';
export type Phase = 'place' | 'move' | 'fly';

export interface MorrisState {
  board: Cell[];                    // 24 cells
  currentPlayer: 'red' | 'blue';
  phase: [Phase, Phase];            // phase per player
  piecesInHand: [number, number];   // pieces yet to place (red, blue)
  piecesOnBoard: [number, number];  // pieces currently on board
  selectedIdx: number | null;       // for move phase
  millFormed: boolean;              // must remove opponent piece
  gameOver: boolean;
  winner: 'red' | 'blue' | null;
  scores: [number, number];
  moveCount: number;
  lastPlaced: number | null;
  lastRemoved: number | null;
  message: string;
  mills: number[][];               // currently active mills (for highlighting)
}

// ─── Adjacency List ───────────────────────────────────────────────────────────
export const ADJACENCY: number[][] = [
  [1, 7],         // 0
  [0, 2, 9],      // 1
  [1, 3],         // 2 (note: [1,3] not [1,2] — no wrap here; 3 is adjacent)
  [2, 4, 11],     // 3  ← fixed
  [3, 5],         // 4
  [4, 6, 13],     // 5
  [5, 7],         // 6
  [0, 6, 15],     // 7
  [9, 15],        // 8  ← inner top-left
  [1, 8, 10, 17], // 9
  [9, 11],        // 10
  [3, 10, 12, 19],// 11 ← fixed: also connects to 19 via spoke? No — only inner
  [11, 13],       // 12
  [5, 12, 14, 21],// 13
  [13, 15],       // 14
  [7, 8, 14, 23], // 15
  [17, 23],       // 16
  [9, 16, 18],    // 17
  [17, 19],       // 18
  [11, 18, 20],   // 19 ← fixed
  [19, 21],       // 20
  [13, 20, 22],   // 21
  [21, 23],       // 22
  [15, 16, 22],   // 23 ← fixed
];

// ─── Mills (three-in-a-row winning lines) ────────────────────────────────────
export const MILLS: number[][] = [
  // Outer square
  [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
  // Middle square
  [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
  // Inner square
  [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
  // Spokes (vertical + horizontal through centre)
  [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getActiveMills(board: Cell[], player: Cell): number[][] {
  return MILLS.filter(([a, b, c]) =>
    board[a] === player && board[b] === player && board[c] === player
  );
}

export function isInMill(idx: number, board: Cell[], player: Cell): boolean {
  return MILLS.some(([a, b, c]) =>
    (a === idx || b === idx || c === idx) &&
    board[a] === player && board[b] === player && board[c] === player
  );
}

export function allInMills(board: Cell[], player: Cell): boolean {
  return board.every((cell, i) => cell !== player || isInMill(i, board, player));
}

export function canMove(board: Cell[], player: Cell, phase: Phase): boolean {
  if (phase === 'fly') return true;
  for (let i = 0; i < 24; i++) {
    if (board[i] === player) {
      if (ADJACENCY[i].some(j => board[j] === null)) return true;
    }
  }
  return false;
}

function detectNewMill(
  board: Cell[],
  idx: number,
  player: Cell,
  prevBoard: Cell[]
): boolean {
  return MILLS.some(([a, b, c]) => {
    if (a !== idx && b !== idx && c !== idx) return false;
    const nowMill = board[a] === player && board[b] === player && board[c] === player;
    const wasMill = prevBoard[a] === player && prevBoard[b] === player && prevBoard[c] === player;
    return nowMill && !wasMill;
  });
}

function playerIndex(p: 'red' | 'blue'): 0 | 1 {
  return p === 'red' ? 0 : 1;
}

function opponent(p: 'red' | 'blue'): 'red' | 'blue' {
  return p === 'red' ? 'blue' : 'red';
}

function getPhase(piecesInHand: number, piecesOnBoard: number): Phase {
  if (piecesInHand > 0) return 'place';
  if (piecesOnBoard === 3) return 'fly';
  return 'move';
}

// ─── Initial State ────────────────────────────────────────────────────────────

export function createInitialState(): MorrisState {
  return {
    board: Array(24).fill(null),
    currentPlayer: 'red',
    phase: ['place', 'place'],
    piecesInHand: [9, 9],
    piecesOnBoard: [0, 0],
    selectedIdx: null,
    millFormed: false,
    gameOver: false,
    winner: null,
    scores: [0, 0],
    moveCount: 0,
    lastPlaced: null,
    lastRemoved: null,
    message: "Red places first. Tap an empty spot to place your piece.",
    mills: [],
  };
}

// ─── Place Phase ──────────────────────────────────────────────────────────────

export function applyPlace(state: MorrisState, idx: number): MorrisState {
  if (state.board[idx] !== null) return state;
  if (state.millFormed) return state;

  const { currentPlayer } = state;
  const pi = playerIndex(currentPlayer);
  if (state.piecesInHand[pi] === 0) return state;

  const newBoard = [...state.board];
  newBoard[idx] = currentPlayer;

  const newHand: [number, number] = [...state.piecesInHand];
  newHand[pi]--;
  const newOnBoard: [number, number] = [...state.piecesOnBoard];
  newOnBoard[pi]++;

  const millNow = detectNewMill(newBoard, idx, currentPlayer, state.board);
  const activeMills = getActiveMills(newBoard, currentPlayer);

  const newPhase: [Phase, Phase] = [
    getPhase(newHand[0], newOnBoard[0]),
    getPhase(newHand[1], newOnBoard[1]),
  ];

  if (millNow) {
    return {
      ...state,
      board: newBoard,
      piecesInHand: newHand,
      piecesOnBoard: newOnBoard,
      phase: newPhase,
      millFormed: true,
      lastPlaced: idx,
      mills: activeMills,
      message: `${currentPlayer === 'red' ? 'Red' : 'Blue'} formed a MILL! Remove an opponent piece.`,
      moveCount: state.moveCount + 1,
    };
  }

  const next = opponent(currentPlayer);
  return {
    ...state,
    board: newBoard,
    piecesInHand: newHand,
    piecesOnBoard: newOnBoard,
    phase: newPhase,
    currentPlayer: next,
    lastPlaced: idx,
    mills: activeMills,
    message: `${next === 'red' ? 'Red' : 'Blue'}'s turn. ${newHand[playerIndex(next)] > 0 ? 'Place a piece.' : 'Move a piece.'}`,
    moveCount: state.moveCount + 1,
  };
}

// ─── Remove Phase (after mill) ────────────────────────────────────────────────

export function applyRemove(state: MorrisState, idx: number): MorrisState {
  if (!state.millFormed) return state;
  const { currentPlayer } = state;
  const opp = opponent(currentPlayer);

  if (state.board[idx] !== opp) return state;

  // Can only remove non-mill pieces unless all opponent pieces are in mills
  if (isInMill(idx, state.board, opp) && !allInMills(state.board, opp)) {
    return { ...state, message: "That piece is in a mill! Remove a non-mill piece." };
  }

  const newBoard = [...state.board];
  newBoard[idx] = null;

  const newOnBoard: [number, number] = [...state.piecesOnBoard];
  newOnBoard[playerIndex(opp)]--;

  // Check win: opponent has < 3 pieces and no pieces in hand
  const oppHand = state.piecesInHand[playerIndex(opp)];
  const oppTotal = newOnBoard[playerIndex(opp)] + oppHand;
  const isWin = oppTotal < 3;

  const activeMills = getActiveMills(newBoard, currentPlayer);

  if (isWin) {
    const newScores: [number, number] = [...state.scores];
    newScores[playerIndex(currentPlayer)]++;
    return {
      ...state,
      board: newBoard,
      piecesOnBoard: newOnBoard,
      millFormed: false,
      gameOver: true,
      winner: currentPlayer,
      scores: newScores,
      lastRemoved: idx,
      mills: activeMills,
      message: `${currentPlayer === 'red' ? 'Red' : 'Blue'} WINS! Opponent has too few pieces.`,
    };
  }

  const next = opponent(currentPlayer);
  const pi = playerIndex(next);
  const newPhase: [Phase, Phase] = [
    getPhase(state.piecesInHand[0], newOnBoard[0]),
    getPhase(state.piecesInHand[1], newOnBoard[1]),
  ];

  // Check if next player can move
  if (!canMove(newBoard, next, newPhase[pi]) && state.piecesInHand[pi] === 0) {
    const newScores: [number, number] = [...state.scores];
    newScores[playerIndex(currentPlayer)]++;
    return {
      ...state,
      board: newBoard,
      piecesOnBoard: newOnBoard,
      millFormed: false,
      phase: newPhase,
      gameOver: true,
      winner: currentPlayer,
      scores: newScores,
      lastRemoved: idx,
      mills: activeMills,
      message: `${currentPlayer === 'red' ? 'Red' : 'Blue'} WINS! Opponent cannot move.`,
    };
  }

  return {
    ...state,
    board: newBoard,
    piecesOnBoard: newOnBoard,
    millFormed: false,
    currentPlayer: next,
    phase: newPhase,
    lastRemoved: idx,
    mills: activeMills,
    message: `Removed! ${next === 'red' ? 'Red' : 'Blue'}'s turn.`,
  };
}

// ─── Move / Fly Phase ─────────────────────────────────────────────────────────

export function applyMoveSelect(state: MorrisState, idx: number): MorrisState {
  if (state.millFormed) return state;
  const { currentPlayer } = state;
  const pi = playerIndex(currentPlayer);

  if (state.board[idx] !== currentPlayer) return state;

  return {
    ...state,
    selectedIdx: idx,
    message: `${currentPlayer === 'red' ? 'Red' : 'Blue'}: tap a highlighted spot to move.`,
  };
}

export function applyMoveTo(state: MorrisState, idx: number): MorrisState {
  if (state.selectedIdx === null) return state;
  if (state.millFormed) return state;
  const { currentPlayer } = state;
  const pi = playerIndex(currentPlayer);
  const phase = state.phase[pi];
  const from = state.selectedIdx;

  if (state.board[idx] !== null) return state;

  // Must be adjacent unless flying
  if (phase !== 'fly' && !ADJACENCY[from].includes(idx)) {
    return { ...state, message: "Can only move to an adjacent empty spot!" };
  }

  const newBoard = [...state.board];
  newBoard[from] = null;
  newBoard[idx] = currentPlayer;

  const millNow = detectNewMill(newBoard, idx, currentPlayer, state.board);
  const activeMills = getActiveMills(newBoard, currentPlayer);

  const newPhase: [Phase, Phase] = [
    getPhase(state.piecesInHand[0], state.piecesOnBoard[0]),
    getPhase(state.piecesInHand[1], state.piecesOnBoard[1]),
  ];

  if (millNow) {
    return {
      ...state,
      board: newBoard,
      selectedIdx: null,
      phase: newPhase,
      millFormed: true,
      lastPlaced: idx,
      mills: activeMills,
      message: `${currentPlayer === 'red' ? 'Red' : 'Blue'} formed a MILL! Remove an opponent piece.`,
      moveCount: state.moveCount + 1,
    };
  }

  const next = opponent(currentPlayer);
  const ni = playerIndex(next);

  // Check if next player can move
  if (!canMove(newBoard, next, newPhase[ni]) && state.piecesInHand[ni] === 0) {
    const newScores: [number, number] = [...state.scores];
    newScores[pi]++;
    return {
      ...state,
      board: newBoard,
      selectedIdx: null,
      phase: newPhase,
      millFormed: false,
      gameOver: true,
      winner: currentPlayer,
      scores: newScores,
      lastPlaced: idx,
      mills: activeMills,
      message: `${currentPlayer === 'red' ? 'Red' : 'Blue'} WINS! Opponent cannot move.`,
    };
  }

  return {
    ...state,
    board: newBoard,
    selectedIdx: null,
    currentPlayer: next,
    phase: newPhase,
    lastPlaced: idx,
    mills: activeMills,
    message: `${next === 'red' ? 'Red' : 'Blue'}'s turn. ${newPhase[ni] === 'fly' ? 'You can FLY!' : 'Move a piece.'}`,
    moveCount: state.moveCount + 1,
  };
}

// ─── Unified tap handler ──────────────────────────────────────────────────────

export function applyTap(state: MorrisState, idx: number): MorrisState {
  const { currentPlayer, millFormed } = state;
  const pi = playerIndex(currentPlayer);
  const phase = state.phase[pi];

  // Remove opponent piece after mill
  if (millFormed) return applyRemove(state, idx);

  // Place phase
  if (phase === 'place') return applyPlace(state, idx);

  // Move/fly phase
  if (state.selectedIdx === null) {
    if (state.board[idx] === currentPlayer) return applyMoveSelect(state, idx);
    return state;
  }

  // Already selected — tap same piece to deselect
  if (idx === state.selectedIdx) {
    return { ...state, selectedIdx: null, message: `${currentPlayer === 'red' ? 'Red' : 'Blue'}: select a piece to move.` };
  }

  // Tap own piece — reselect
  if (state.board[idx] === currentPlayer) return applyMoveSelect(state, idx);

  // Move to empty spot
  if (state.board[idx] === null) return applyMoveTo(state, idx);

  return state;
}

// ─── Valid move targets (for highlighting) ────────────────────────────────────

export function getValidTargets(state: MorrisState): number[] {
  const { currentPlayer, selectedIdx, millFormed } = state;
  const pi = playerIndex(currentPlayer);
  const phase = state.phase[pi];
  const opp = opponent(currentPlayer);

  if (millFormed) {
    // Highlight removable opponent pieces
    const oppInMills = allInMills(state.board, opp);
    return state.board
      .map((c, i) => (c === opp && (oppInMills || !isInMill(i, state.board, opp)) ? i : -1))
      .filter(i => i !== -1);
  }

  if (phase === 'place') {
    return state.board.map((c, i) => (c === null ? i : -1)).filter(i => i !== -1);
  }

  if (selectedIdx !== null) {
    if (phase === 'fly') {
      return state.board.map((c, i) => (c === null ? i : -1)).filter(i => i !== -1);
    }
    return ADJACENCY[selectedIdx].filter(i => state.board[i] === null);
  }

  return [];
}

export function resetState(): MorrisState {
  return createInitialState();
}
