// src/games/subtractSet/subtractSetLogic.ts
// CS Concept: DP on game states with allowed move set S

export type Player = 0 | 1;

export interface SubtractSetState {
  pile: number;
  originalPile: number;
  moveSet: number[];
  dp: boolean[];         // dp[n] = true means WIN for player to move
  currentPlayer: Player;
  scores: [number, number];
  gameOver: boolean;
  winner: 'red' | 'blue' | null;
  moveHistory: { player: Player; removed: number; remaining: number }[];
  message: string;
  showDP: boolean;
}

export function computeDP(n: number, S: number[]): boolean[] {
  const dp: boolean[] = Array(n + 1).fill(false);
  // dp[0] = false (no stones = previous player won)
  for (let i = 1; i <= n; i++) {
    for (const s of S) {
      if (s <= i && !dp[i - s]) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp;
}

export const PRESETS: { label: string; S: number[]; N: number }[] = [
  { label: 'S={1,3,4}',  S: [1, 3, 4], N: 14 },
  { label: 'S={1,2,3}',  S: [1, 2, 3], N: 12 },
  { label: 'S={2,3,5}',  S: [2, 3, 5], N: 15 },
  { label: 'S={1,4,5}',  S: [1, 4, 5], N: 16 },
];

export function createSubtractState(pile = 14, moveSet = [1, 3, 4]): SubtractSetState {
  const dp = computeDP(pile, moveSet);
  return {
    pile, originalPile: pile, moveSet,
    dp, currentPlayer: 0, scores: [0, 0],
    gameOver: false, winner: null, moveHistory: [],
    message: dp[pile] ? 'Red has a winning move!' : 'Red is in a losing position!',
    showDP: false,
  };
}

export function applySubtractMove(state: SubtractSetState, remove: number): SubtractSetState {
  if (!state.moveSet.includes(remove) || remove > state.pile) return state;
  const newPile = state.pile - remove;
  const { currentPlayer } = state;
  const nextPlayer: Player = currentPlayer === 0 ? 1 : 0;
  const history = [...state.moveHistory, { player: currentPlayer, removed: remove, remaining: newPile }];

  if (newPile === 0) {
    const newScores: [number, number] = [...state.scores];
    newScores[currentPlayer]++;
    return { ...state, pile: 0, gameOver: true, winner: currentPlayer === 0 ? 'red' : 'blue', scores: newScores, moveHistory: history, message: `${currentPlayer === 0 ? 'Red' : 'Blue'} WINS! 🎉` };
  }

  return {
    ...state, pile: newPile, currentPlayer: nextPlayer, moveHistory: history,
    message: state.dp[newPile]
      ? `Left ${newPile} — winning for ${nextPlayer === 0 ? 'Red' : 'Blue'}.`
      : `Left ${newPile} — LOSING for ${nextPlayer === 0 ? 'Red' : 'Blue'}!`,
  };
}

export function resetSubtract(pile?: number, S?: number[]): SubtractSetState {
  return createSubtractState(pile ?? 14, S ?? [1, 3, 4]);
}
