// src/games/takeAway/takeAwayLogic.ts
// CS Concept: Modular arithmetic — multiples of 4 are losing positions

export type Player = 0 | 1;

export interface TakeAwayState {
  pile: number;
  originalPile: number;
  currentPlayer: Player;
  scores: [number, number];
  gameOver: boolean;
  winner: 'red' | 'blue' | null;
  lastMove: number | null;
  moveHistory: { player: Player; removed: number; remaining: number }[];
  message: string;
  showHint: boolean;
}

export function isLosingPosition(n: number): boolean {
  return n % 4 === 0;
}

export function optimalMove(n: number): number | null {
  // Make opponent face multiple of 4
  const rem = n % 4;
  if (rem === 0) return null; // already losing — any move
  return rem; // remove exactly rem stones
}

export function createInitialState(pile = 12): TakeAwayState {
  return {
    pile,
    originalPile: pile,
    currentPlayer: 0,
    scores: [0, 0],
    gameOver: false,
    winner: null,
    lastMove: null,
    moveHistory: [],
    message: isLosingPosition(pile)
      ? `N=${pile} is a multiple of 4 — Red is in a LOSING position!`
      : `N=${pile} — Red goes first. Remove 1, 2, or 3 stones.`,
    showHint: false,
  };
}

export function applyMove(state: TakeAwayState, remove: number): TakeAwayState {
  if (state.gameOver) return state;
  if (remove < 1 || remove > 3) return state;
  if (remove > state.pile) return state;

  const newPile = state.pile - remove;
  const { currentPlayer } = state;
  const nextPlayer: Player = currentPlayer === 0 ? 1 : 0;

  const history = [...state.moveHistory, { player: currentPlayer, removed: remove, remaining: newPile }];

  if (newPile === 0) {
    const newScores: [number, number] = [...state.scores];
    newScores[currentPlayer]++;
    return {
      ...state,
      pile: 0,
      gameOver: true,
      winner: currentPlayer === 0 ? 'red' : 'blue',
      scores: newScores,
      lastMove: remove,
      moveHistory: history,
      message: `${currentPlayer === 0 ? 'Red' : 'Blue'} took the last stone and WINS! 🎉`,
    };
  }

  const losing = isLosingPosition(newPile);
  return {
    ...state,
    pile: newPile,
    currentPlayer: nextPlayer,
    lastMove: remove,
    moveHistory: history,
    message: losing
      ? `Left ${newPile} stones — multiple of 4! ${nextPlayer === 0 ? 'Red' : 'Blue'} is in a losing position.`
      : `Left ${newPile} stones. ${nextPlayer === 0 ? 'Red' : 'Blue'}'s turn.`,
  };
}

export function resetState(pile?: number): TakeAwayState {
  return createInitialState(pile ?? 12);
}

export const PILE_OPTIONS = [8, 10, 12, 15, 16, 20];
