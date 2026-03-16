// src/games/nim/nimLogic.ts
// CS Concept: Nim — Combinatorial Game Theory, XOR / Sprague-Grundy theorem

export type Player = 0 | 1; // 0 = Red, 1 = Blue

export interface NimState {
  piles: number[];           // current stone counts per pile
  originalPiles: number[];   // for reference display
  currentPlayer: Player;
  scores: [number, number];
  gameOver: boolean;
  winner: 'red' | 'blue' | null;
  selectedPile: number | null;   // which pile is being reduced
  selectedRemove: number;        // how many to remove from selected pile
  lastMove: { pile: number; removed: number } | null;
  xorValue: number;              // current nim-sum
  xorHistory: number[];          // xor after each move
  moveCount: number;
  message: string;
  showHint: boolean;             // show XOR hint
  hintMove: { pile: number; to: number } | null; // optimal move hint
}

// ─── XOR helpers ─────────────────────────────────────────────────────────────

export function computeXor(piles: number[]): number {
  return piles.reduce((acc, p) => acc ^ p, 0);
}

export function isLosingPosition(piles: number[]): boolean {
  return computeXor(piles) === 0;
}

/** Find the optimal move: pick a pile and reduce it so XOR becomes 0 */
export function findOptimalMove(piles: number[]): { pile: number; to: number } | null {
  const xor = computeXor(piles);
  if (xor === 0) return null; // already losing — no optimal move
  for (let i = 0; i < piles.length; i++) {
    const target = piles[i] ^ xor;
    if (target < piles[i]) {
      return { pile: i, to: target };
    }
  }
  return null;
}

/** Build XOR breakdown string for display e.g. "3 ⊕ 4 ⊕ 5 = 2" */
export function xorBreakdown(piles: number[]): string {
  const nonEmpty = piles.filter(p => p > 0);
  if (nonEmpty.length === 0) return '0';
  return nonEmpty.join(' ⊕ ') + ' = ' + computeXor(piles);
}

/** Convert number to fixed-width binary string */
export function toBinary(n: number, width = 4): string {
  return n.toString(2).padStart(width, '0');
}

// ─── Preset pile configurations ───────────────────────────────────────────────

export interface PilePreset {
  label: string;
  piles: number[];
  description: string;
}

export const PRESETS: PilePreset[] = [
  { label: 'Classic',   piles: [3, 4, 5],    description: 'XOR = 2 → Red wins' },
  { label: 'Balanced',  piles: [1, 2, 3],    description: 'XOR = 0 → Blue wins' },
  { label: 'Hard',      piles: [4, 5, 6, 7], description: '4 piles challenge' },
  { label: 'Mini',      piles: [1, 3, 5],    description: 'XOR = 7 → Red wins' },
  { label: 'Tricky',    piles: [2, 2, 4],    description: 'XOR = 4 → Red wins' },
  { label: 'Equal',     piles: [3, 3],        description: 'XOR = 0 → Blue wins' },
];

// ─── State factory ────────────────────────────────────────────────────────────

export function createInitialState(piles: number[] = [3, 4, 5]): NimState {
  const xor = computeXor(piles);
  const hint = findOptimalMove(piles);
  return {
    piles: [...piles],
    originalPiles: [...piles],
    currentPlayer: 0,
    scores: [0, 0],
    gameOver: false,
    winner: null,
    selectedPile: null,
    selectedRemove: 1,
    lastMove: null,
    xorValue: xor,
    xorHistory: [xor],
    moveCount: 0,
    message: xor === 0
      ? 'Red goes first — but this is a losing position for Red!'
      : 'Red goes first — winning position! Remove stones wisely.',
    showHint: false,
    hintMove: hint,
  };
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export function selectPile(state: NimState, pileIdx: number): NimState {
  if (state.gameOver) return state;
  if (state.piles[pileIdx] === 0) return state;
  return {
    ...state,
    selectedPile: pileIdx,
    selectedRemove: 1,
    message: `Pile ${pileIdx + 1} selected. Choose how many to remove.`,
  };
}

export function setRemoveCount(state: NimState, count: number): NimState {
  if (state.selectedPile === null) return state;
  const max = state.piles[state.selectedPile];
  const clamped = Math.max(1, Math.min(count, max));
  return { ...state, selectedRemove: clamped };
}

export function confirmMove(state: NimState): NimState {
  const { selectedPile, selectedRemove, currentPlayer } = state;
  if (selectedPile === null || selectedRemove < 1) return state;
  if (state.piles[selectedPile] < selectedRemove) return state;

  const newPiles = [...state.piles];
  newPiles[selectedPile] -= selectedRemove;

  const allEmpty = newPiles.every(p => p === 0);
  const newXor = computeXor(newPiles);
  const nextPlayer: Player = currentPlayer === 0 ? 1 : 0;

  if (allEmpty) {
    const newScores: [number, number] = [...state.scores];
    newScores[currentPlayer]++;
    return {
      ...state,
      piles: newPiles,
      gameOver: true,
      winner: currentPlayer === 0 ? 'red' : 'blue',
      scores: newScores,
      selectedPile: null,
      selectedRemove: 1,
      lastMove: { pile: selectedPile, removed: selectedRemove },
      xorValue: 0,
      xorHistory: [...state.xorHistory, 0],
      moveCount: state.moveCount + 1,
      message: `${currentPlayer === 0 ? 'Red' : 'Blue'} took the last stone and WINS! 🎉`,
      hintMove: null,
    };
  }

  const hintMove = findOptimalMove(newPiles);
  const isLosing = newXor === 0;

  return {
    ...state,
    piles: newPiles,
    currentPlayer: nextPlayer,
    selectedPile: null,
    selectedRemove: 1,
    lastMove: { pile: selectedPile, removed: selectedRemove },
    xorValue: newXor,
    xorHistory: [...state.xorHistory, newXor],
    moveCount: state.moveCount + 1,
    hintMove,
    message: isLosing
      ? `${nextPlayer === 0 ? 'Red' : 'Blue'}'s turn — XOR = 0, losing position!`
      : `${nextPlayer === 0 ? 'Red' : 'Blue'}'s turn — XOR = ${newXor}, winning position.`,
  };
}

export function toggleHint(state: NimState): NimState {
  return { ...state, showHint: !state.showHint };
}

export function resetState(piles?: number[]): NimState {
  return createInitialState(piles);
}
