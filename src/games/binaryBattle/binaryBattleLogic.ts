// src/games/binaryBattle/binaryBattleLogic.ts
// CS Concept: Binary number representation, bitwise thinking

export type Player = 0 | 1; // 0 = Red, 1 = Blue

export interface BinaryQuestion {
  decimal: number;       // The number to convert
  bits: number;          // How many bits (4 or 8)
  correctBinary: string; // "1010" etc
}

export interface BinaryBattleState {
  currentQuestion: BinaryQuestion;
  redInput: string;   // Red player's typed binary
  blueInput: string;  // Blue player's typed binary
  currentPlayer: Player;
  scores: [number, number];
  round: number;
  maxRounds: number;
  gameOver: boolean;
  winner: 'red' | 'blue' | 'draw' | null;
  lastResult: 'correct' | 'wrong' | null;
  showAnswer: boolean;
  answeredBy: Player | null; // who answered this round
  streak: [number, number];  // consecutive correct answers
}

const QUESTION_POOL: BinaryQuestion[] = [
  { decimal: 5,   bits: 4, correctBinary: '0101' },
  { decimal: 10,  bits: 4, correctBinary: '1010' },
  { decimal: 7,   bits: 4, correctBinary: '0111' },
  { decimal: 12,  bits: 4, correctBinary: '1100' },
  { decimal: 3,   bits: 4, correctBinary: '0011' },
  { decimal: 9,   bits: 4, correctBinary: '1001' },
  { decimal: 6,   bits: 4, correctBinary: '0110' },
  { decimal: 15,  bits: 4, correctBinary: '1111' },
  { decimal: 13,  bits: 4, correctBinary: '1101' },
  { decimal: 11,  bits: 4, correctBinary: '1011' },
  { decimal: 42,  bits: 8, correctBinary: '00101010' },
  { decimal: 128, bits: 8, correctBinary: '10000000' },
  { decimal: 255, bits: 8, correctBinary: '11111111' },
  { decimal: 64,  bits: 8, correctBinary: '01000000' },
  { decimal: 37,  bits: 8, correctBinary: '00100101' },
  { decimal: 100, bits: 8, correctBinary: '01100100' },
  { decimal: 200, bits: 8, correctBinary: '11001000' },
  { decimal: 85,  bits: 8, correctBinary: '01010101' },
];

let usedIndices: number[] = [];

export function getRandomQuestion(): BinaryQuestion {
  if (usedIndices.length >= QUESTION_POOL.length) usedIndices = [];
  let idx: number;
  do { idx = Math.floor(Math.random() * QUESTION_POOL.length); }
  while (usedIndices.includes(idx));
  usedIndices.push(idx);
  return QUESTION_POOL[idx];
}

export function createInitialState(): BinaryBattleState {
  return {
    currentQuestion: getRandomQuestion(),
    redInput: '',
    blueInput: '',
    currentPlayer: 0,
    scores: [0, 0],
    round: 1,
    maxRounds: 10,
    gameOver: false,
    winner: null,
    lastResult: null,
    showAnswer: false,
    answeredBy: null,
    streak: [0, 0],
  };
}

export function toggleBit(input: string, idx: number, bits: number): string {
  // Ensure input is padded to correct length
  const padded = input.padStart(bits, '0').split('');
  padded[idx] = padded[idx] === '1' ? '0' : '1';
  return padded.join('');
}

export function submitAnswer(state: BinaryBattleState): BinaryBattleState {
  const { currentPlayer, currentQuestion } = state;
  const input = currentPlayer === 0 ? state.redInput : state.blueInput;
  const correct = input === currentQuestion.correctBinary;

  const newScores: [number, number] = [...state.scores];
  const newStreak: [number, number] = [...state.streak];

  if (correct) {
    newStreak[currentPlayer]++;
    // Bonus for streak
    const bonus = newStreak[currentPlayer] >= 3 ? 2 : 1;
    newScores[currentPlayer] += bonus;
  } else {
    newStreak[currentPlayer] = 0;
  }

  const nextRound = state.round + 1;
  const nextPlayer: Player = currentPlayer === 0 ? 1 : 0;
  const isOver = nextRound > state.maxRounds;

  let winner: 'red' | 'blue' | 'draw' | null = null;
  if (isOver) {
    if (newScores[0] > newScores[1]) winner = 'red';
    else if (newScores[1] > newScores[0]) winner = 'blue';
    else winner = 'draw';
  }

  return {
    ...state,
    scores: newScores,
    streak: newStreak,
    lastResult: correct ? 'correct' : 'wrong',
    showAnswer: !correct,
    answeredBy: currentPlayer,
    round: nextRound,
    currentPlayer: nextPlayer,
    gameOver: isOver,
    winner,
    currentQuestion: isOver ? state.currentQuestion : getRandomQuestion(),
    redInput: '',
    blueInput: '',
  };
}

export function setInput(state: BinaryBattleState, input: string): BinaryBattleState {
  if (state.currentPlayer === 0) return { ...state, redInput: input };
  return { ...state, blueInput: input };
}

export function resetState(state: BinaryBattleState): BinaryBattleState {
  return { ...createInitialState(), scores: [0, 0] };
}

export function getCurrentInput(state: BinaryBattleState): string {
  return state.currentPlayer === 0 ? state.redInput : state.blueInput;
}
