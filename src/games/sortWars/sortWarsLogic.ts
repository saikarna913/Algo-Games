// src/games/sortWars/sortWarsLogic.ts
// CS Concept: Bubble Sort — compare & swap adjacent elements

export type Player = 0 | 1;

export interface SortWarsState {
  array: number[];          // shared array, players sort it together
  originalArray: number[];  // to show progress
  currentPlayer: Player;
  scores: [number, number];
  round: number;
  maxRounds: number;
  gameOver: boolean;
  winner: 'red' | 'blue' | 'draw' | null;
  selectedIdx: number | null; // first selected index for swap
  lastSwap: [number, number] | null;
  swapCount: [number, number]; // how many swaps each player made
  sortedPositions: number[]; // indices that are in sorted position
  message: string;
  eventLog: string[];
  isSorted: boolean;
}

function generateArray(size: number = 8): number[] {
  const arr = Array.from({ length: size }, (_, i) => i + 1);
  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Make sure it's not already sorted
  while (isSortedCheck(arr)) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  return arr;
}

export function isSortedCheck(arr: number[]): boolean {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] > arr[i + 1]) return false;
  }
  return true;
}

export function getSortedPositions(arr: number[]): number[] {
  // Find indices where element is already in its correct sorted position
  const sorted = [...arr].sort((a, b) => a - b);
  const result: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === sorted[i]) result.push(i);
  }
  return result;
}

export function createInitialState(): SortWarsState {
  const arr = generateArray(8);
  return {
    array: arr,
    originalArray: [...arr],
    currentPlayer: 0,
    scores: [0, 0],
    round: 1,
    maxRounds: 20,
    gameOver: false,
    winner: null,
    selectedIdx: null,
    lastSwap: null,
    swapCount: [0, 0],
    sortedPositions: getSortedPositions(arr),
    message: "Red goes first! Tap two adjacent elements to swap them.",
    eventLog: [],
    isSorted: false,
  };
}

export function selectCell(state: SortWarsState, idx: number): SortWarsState {
  if (state.gameOver) return state;

  // First selection
  if (state.selectedIdx === null) {
    return {
      ...state,
      selectedIdx: idx,
      message: `Selected position ${idx + 1}. Now pick an adjacent cell to swap!`,
    };
  }

  // Second selection — must be adjacent
  const first = state.selectedIdx;
  if (Math.abs(first - idx) !== 1) {
    // Not adjacent — reselect
    return {
      ...state,
      selectedIdx: idx,
      message: `Only adjacent swaps allowed! Re-selected position ${idx + 1}.`,
    };
  }

  // Perform swap
  const newArray = [...state.array];
  [newArray[first], newArray[idx]] = [newArray[idx], newArray[first]];

  const { currentPlayer } = state;

  // Score: +1 if the swap moved a smaller element left (i.e., good swap)
  const isGoodSwap = newArray[Math.min(first, idx)] < newArray[Math.max(first, idx)];
  const newScores: [number, number] = [...state.scores];
  const newSwapCount: [number, number] = [...state.swapCount];
  newSwapCount[currentPlayer]++;

  if (isGoodSwap) {
    newScores[currentPlayer] += 1;
  }

  const sorted = isSortedCheck(newArray);
  const nextPlayer: Player = currentPlayer === 0 ? 1 : 0;
  const nextRound = state.round + 1;
  const isOver = sorted || nextRound > state.maxRounds;

  let winner: 'red' | 'blue' | 'draw' | null = null;
  if (isOver) {
    if (newScores[0] > newScores[1]) winner = 'red';
    else if (newScores[1] > newScores[0]) winner = 'blue';
    else winner = 'draw';
  }

  const swapMsg = isGoodSwap
    ? `${currentPlayer === 0 ? 'Red' : 'Blue'} made a GOOD swap! +1 point.`
    : `${currentPlayer === 0 ? 'Red' : 'Blue'} swapped — no progress.`;

  const log = [
    ...state.eventLog,
    `${currentPlayer === 0 ? 'RED' : 'BLUE'} swap [${first + 1}↔${idx + 1}] ${isGoodSwap ? '+1' : ''}`,
  ];

  return {
    ...state,
    array: newArray,
    scores: newScores,
    swapCount: newSwapCount,
    currentPlayer: nextPlayer,
    round: nextRound,
    gameOver: isOver,
    winner,
    selectedIdx: null,
    lastSwap: [first, idx],
    sortedPositions: getSortedPositions(newArray),
    message: sorted ? '🎉 Array Sorted!' : swapMsg,
    eventLog: log,
    isSorted: sorted,
  };
}

export function resetState(state: SortWarsState): SortWarsState {
  return createInitialState();
}
