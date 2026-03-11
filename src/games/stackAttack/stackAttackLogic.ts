// src/games/stackAttack/stackAttackLogic.ts
// CS Concept: Stack data structure (LIFO — Last In First Out)

export type Player = 0 | 1;
export type Operation = 'push' | 'pop';

export interface StackItem {
  value: number;
  owner: Player; // who pushed it
}

export interface StackAttackState {
  stack: StackItem[];
  maxStackSize: number;    // overflow if exceeded
  currentPlayer: Player;
  scores: [number, number];
  round: number;
  maxRounds: number;
  gameOver: boolean;
  winner: 'red' | 'blue' | 'draw' | null;
  lastOp: Operation | null;
  lastOpPlayer: Player | null;
  lastOpValue: number | null;
  poppedValue: number | null;
  message: string;
  nextPushValue: number;   // the value that will be pushed next
  eventLog: string[];      // history of moves
  overflowTriggered: boolean;
  underflowTriggered: boolean;
}

function randomValue(): number {
  return Math.floor(Math.random() * 9) + 1; // 1–9
}

export function createInitialState(): StackAttackState {
  return {
    stack: [],
    maxStackSize: 6,
    currentPlayer: 0,
    scores: [0, 0],
    round: 1,
    maxRounds: 12,
    gameOver: false,
    winner: null,
    lastOp: null,
    lastOpPlayer: null,
    lastOpValue: null,
    poppedValue: null,
    message: "Red goes first. Push or Pop!",
    nextPushValue: randomValue(),
    eventLog: [],
    overflowTriggered: false,
    underflowTriggered: false,
  };
}

export function applyPush(state: StackAttackState): StackAttackState {
  const { currentPlayer, stack, maxStackSize, nextPushValue } = state;

  // Stack overflow — current player loses a point
  if (stack.length >= maxStackSize) {
    const newScores: [number, number] = [...state.scores];
    newScores[currentPlayer] = Math.max(0, newScores[currentPlayer] - 1);
    const nextPlayer: Player = currentPlayer === 0 ? 1 : 0;
    const nextRound = state.round + 1;
    const isOver = nextRound > state.maxRounds;
    const log = [...state.eventLog, `${currentPlayer === 0 ? 'RED' : 'BLUE'} caused OVERFLOW! -1 point`];

    return {
      ...state,
      scores: newScores,
      currentPlayer: nextPlayer,
      round: nextRound,
      gameOver: isOver,
      winner: isOver ? resolveWinner(newScores) : null,
      lastOp: 'push',
      lastOpPlayer: currentPlayer,
      lastOpValue: nextPushValue,
      message: `OVERFLOW! ${currentPlayer === 0 ? 'Red' : 'Blue'} loses 1 point.`,
      overflowTriggered: true,
      underflowTriggered: false,
      eventLog: log,
      nextPushValue: randomValue(),
    };
  }

  const newStack: StackItem[] = [...stack, { value: nextPushValue, owner: currentPlayer }];
  const nextPlayer: Player = currentPlayer === 0 ? 1 : 0;
  const nextRound = state.round + 1;
  const isOver = nextRound > state.maxRounds;
  const log = [...state.eventLog, `${currentPlayer === 0 ? 'RED' : 'BLUE'} pushed ${nextPushValue}`];

  return {
    ...state,
    stack: newStack,
    currentPlayer: nextPlayer,
    round: nextRound,
    gameOver: isOver,
    winner: isOver ? resolveWinner(state.scores) : null,
    lastOp: 'push',
    lastOpPlayer: currentPlayer,
    lastOpValue: nextPushValue,
    poppedValue: null,
    message: `${currentPlayer === 0 ? 'Red' : 'Blue'} pushed ${nextPushValue} onto the stack.`,
    overflowTriggered: false,
    underflowTriggered: false,
    eventLog: log,
    nextPushValue: randomValue(),
  };
}

export function applyPop(state: StackAttackState): StackAttackState {
  const { currentPlayer, stack } = state;

  // Stack underflow — current player loses a point
  if (stack.length === 0) {
    const newScores: [number, number] = [...state.scores];
    newScores[currentPlayer] = Math.max(0, newScores[currentPlayer] - 1);
    const nextPlayer: Player = currentPlayer === 0 ? 1 : 0;
    const nextRound = state.round + 1;
    const isOver = nextRound > state.maxRounds;
    const log = [...state.eventLog, `${currentPlayer === 0 ? 'RED' : 'BLUE'} caused UNDERFLOW! -1 point`];

    return {
      ...state,
      scores: newScores,
      currentPlayer: nextPlayer,
      round: nextRound,
      gameOver: isOver,
      winner: isOver ? resolveWinner(newScores) : null,
      lastOp: 'pop',
      lastOpPlayer: currentPlayer,
      lastOpValue: null,
      poppedValue: null,
      message: `UNDERFLOW! ${currentPlayer === 0 ? 'Red' : 'Blue'} loses 1 point.`,
      overflowTriggered: false,
      underflowTriggered: true,
      eventLog: log,
    };
  }

  const popped = stack[stack.length - 1];
  const newStack = stack.slice(0, -1);

  // Bonus: if you pop your own item, +1. Opponent's item = 0.
  const newScores: [number, number] = [...state.scores];
  let msg = '';
  if (popped.owner === currentPlayer) {
    newScores[currentPlayer] += 1;
    msg = `${currentPlayer === 0 ? 'Red' : 'Blue'} popped their own ${popped.value}! +1 point.`;
  } else {
    msg = `${currentPlayer === 0 ? 'Red' : 'Blue'} popped opponent's ${popped.value}. No points.`;
  }

  const nextPlayer: Player = currentPlayer === 0 ? 1 : 0;
  const nextRound = state.round + 1;
  const isOver = nextRound > state.maxRounds;
  const log = [...state.eventLog, `${currentPlayer === 0 ? 'RED' : 'BLUE'} popped ${popped.value} ${popped.owner === currentPlayer ? '(own +1)' : '(opp)'}`];

  return {
    ...state,
    stack: newStack,
    scores: newScores,
    currentPlayer: nextPlayer,
    round: nextRound,
    gameOver: isOver,
    winner: isOver ? resolveWinner(newScores) : null,
    lastOp: 'pop',
    lastOpPlayer: currentPlayer,
    lastOpValue: popped.value,
    poppedValue: popped.value,
    message: msg,
    overflowTriggered: false,
    underflowTriggered: false,
    eventLog: log,
  };
}

function resolveWinner(scores: [number, number]): 'red' | 'blue' | 'draw' {
  if (scores[0] > scores[1]) return 'red';
  if (scores[1] > scores[0]) return 'blue';
  return 'draw';
}

export function resetState(state: StackAttackState): StackAttackState {
  return createInitialState();
}
