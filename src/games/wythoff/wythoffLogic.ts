// src/games/wythoff/wythoffLogic.ts
// CS Concept: Golden Ratio losing positions

export type Player = 0 | 1;
const PHI = (1 + Math.sqrt(5)) / 2;

export interface WythoffState {
  piles: [number, number];
  currentPlayer: Player;
  scores: [number, number];
  gameOver: boolean;
  winner: 'red' | 'blue' | null;
  lastMove: { type: 'one' | 'both'; from: [number,number]; removed: [number,number] } | null;
  message: string;
  showHint: boolean;
  losingPairs: [number, number][];
  moveCount: number;
}

export function getLosingPairs(max = 15): [number, number][] {
  const pairs: [number, number][] = [];
  for (let k = 0; pairs.length < 12; k++) {
    const a = Math.floor(k * PHI);
    const b = Math.floor(k * PHI * PHI);
    if (a <= max && b <= max) pairs.push([a, b]);
  }
  return pairs;
}

export function isLosingPosition(piles: [number, number]): boolean {
  const pairs = getLosingPairs(30);
  return pairs.some(([a, b]) => (piles[0] === a && piles[1] === b) || (piles[0] === b && piles[1] === a));
}

export function findOptimalMove(piles: [number, number]): { type: 'one' | 'both'; result: [number, number] } | null {
  const [a, b] = piles;
  const pairs = getLosingPairs(30);
  // Try all valid moves
  for (let i = 1; i <= a; i++) {
    const np: [number, number] = [a - i, b];
    if (pairs.some(([pa, pb]) => (np[0] === pa && np[1] === pb) || (np[0] === pb && np[1] === pa)))
      return { type: 'one', result: np };
  }
  for (let i = 1; i <= b; i++) {
    const np: [number, number] = [a, b - i];
    if (pairs.some(([pa, pb]) => (np[0] === pa && np[1] === pb) || (np[0] === pb && np[1] === pa)))
      return { type: 'one', result: np };
  }
  for (let i = 1; i <= Math.min(a, b); i++) {
    const np: [number, number] = [a - i, b - i];
    if (pairs.some(([pa, pb]) => (np[0] === pa && np[1] === pb) || (np[0] === pb && np[1] === pa)))
      return { type: 'both', result: np };
  }
  return null;
}

export function createInitialState(piles: [number, number] = [6, 10]): WythoffState {
  const losing = isLosingPosition(piles);
  return {
    piles,
    currentPlayer: 0,
    scores: [0, 0],
    gameOver: false,
    winner: null,
    lastMove: null,
    message: losing ? `Losing position for Red! (φ-pair)` : `Winning position for Red.`,
    showHint: false,
    losingPairs: getLosingPairs(15),
    moveCount: 0,
  };
}

export function applyWythoffMove(state: WythoffState, newPiles: [number, number], moveType: 'one' | 'both'): WythoffState {
  if (state.gameOver) return state;
  const [oa, ob] = state.piles;
  const [na, nb] = newPiles;
  if (na < 0 || nb < 0 || na > oa || nb > ob) return state;
  if (moveType === 'one' && na === oa && nb === ob) return state;
  if (moveType === 'both' && (oa - na) !== (ob - nb)) return state;

  const allEmpty = na === 0 && nb === 0;
  const nextPlayer: Player = state.currentPlayer === 0 ? 1 : 0;
  const { currentPlayer } = state;

  if (allEmpty) {
    const newScores: [number, number] = [...state.scores];
    newScores[currentPlayer]++;
    return { ...state, piles: newPiles, gameOver: true, winner: currentPlayer === 0 ? 'red' : 'blue', scores: newScores, lastMove: { type: moveType, from: state.piles, removed: [oa-na, ob-nb] }, message: `${currentPlayer === 0 ? 'Red' : 'Blue'} WINS! Took the last stones.`, moveCount: state.moveCount + 1 };
  }

  const losing = isLosingPosition(newPiles);
  return {
    ...state,
    piles: newPiles,
    currentPlayer: nextPlayer,
    lastMove: { type: moveType, from: state.piles, removed: [oa-na, ob-nb] },
    message: losing ? `Left (${na},${nb}) — φ-pair! ${nextPlayer === 0 ? 'Red' : 'Blue'} is losing.` : `${nextPlayer === 0 ? 'Red' : 'Blue'}'s turn.`,
    moveCount: state.moveCount + 1,
  };
}

export function resetWythoff(piles?: [number, number]): WythoffState {
  return createInitialState(piles ?? [6, 10]);
}
