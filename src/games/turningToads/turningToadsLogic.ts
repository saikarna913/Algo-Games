// src/games/turningToads/turningToadsLogic.ts
// CS Concept: Combinatorial game theory — symmetry strategy

export type Player = 0 | 1;
export type Toad = 'R' | 'B' | 'empty'; // Red toad, Blue toad, empty

export interface TurningToadsState {
  cells: Toad[];
  currentPlayer: Player;
  scores: [number, number];
  gameOver: boolean;
  winner: 'red' | 'blue' | null;
  moveHistory: { player: Player; type: 'move' | 'jump'; from: number; to: number }[];
  message: string;
  validMoves: { from: number; to: number; type: 'move' | 'jump' }[];
  selectedIdx: number | null;
  moveCount: number;
}

const SIZE = 7; // 3 red + empty + 3 blue

export function createInitialState(): TurningToadsState {
  // R R R _ B B B
  const cells: Toad[] = ['R','R','R','empty','B','B','B'];
  return {
    cells, currentPlayer: 0,
    scores: [0, 0], gameOver: false, winner: null,
    moveHistory: [], message: "Red moves RIGHT. Blue moves LEFT. Jump opponents!",
    validMoves: getValidMoves(cells, 0), selectedIdx: null, moveCount: 0,
  };
}

export function getValidMoves(cells: Toad[], player: Player): { from: number; to: number; type: 'move' | 'jump' }[] {
  const moves: { from: number; to: number; type: 'move' | 'jump' }[] = [];
  const myToad = player === 0 ? 'R' : 'B';
  const dir = player === 0 ? 1 : -1; // Red moves right, Blue moves left

  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== myToad) continue;
    const step = i + dir;
    const jump = i + dir * 2;
    if (step >= 0 && step < cells.length && cells[step] === 'empty')
      moves.push({ from: i, to: step, type: 'move' });
    if (jump >= 0 && jump < cells.length && cells[jump] === 'empty' && cells[step] !== myToad && cells[step] !== 'empty')
      moves.push({ from: i, to: jump, type: 'jump' });
  }
  return moves;
}

export function applyToadMove(state: TurningToadsState, from: number, to: number): TurningToadsState {
  if (state.gameOver) return state;
  const valid = state.validMoves.find(m => m.from === from && m.to === to);
  if (!valid) return state;

  const newCells = [...state.cells];
  newCells[to] = newCells[from];
  newCells[from] = 'empty';

  const { currentPlayer } = state;
  const nextPlayer: Player = currentPlayer === 0 ? 1 : 0;
  const history = [...state.moveHistory, { player: currentPlayer, type: valid.type, from, to }];
  const nextMoves = getValidMoves(newCells, nextPlayer);

  // Check if solved: B B B _ R R R
  const solved = newCells.slice(0,3).every(c => c === 'B') && newCells[3] === 'empty' && newCells.slice(4).every(c => c === 'R');

  if (nextMoves.length === 0 || solved) {
    const newScores: [number, number] = [...state.scores];
    newScores[currentPlayer]++;
    return {
      ...state, cells: newCells, gameOver: true,
      winner: currentPlayer === 0 ? 'red' : 'blue', scores: newScores,
      moveHistory: history, validMoves: [],
      message: solved ? '🎉 Puzzle solved! All toads swapped!' : `${currentPlayer === 0 ? 'Red' : 'Blue'} WINS — opponent stuck!`,
      moveCount: state.moveCount + 1, selectedIdx: null,
    };
  }

  return {
    ...state, cells: newCells, currentPlayer: nextPlayer,
    moveHistory: history, validMoves: nextMoves,
    message: `${valid.type === 'jump' ? 'JUMP!' : 'Step.'} ${nextPlayer === 0 ? 'Red' : 'Blue'}'s turn.`,
    moveCount: state.moveCount + 1, selectedIdx: null,
  };
}

export function selectToad(state: TurningToadsState, idx: number): TurningToadsState {
  if (state.gameOver) return state;
  if (state.cells[idx] === 'empty') {
    // If a toad is selected and this is a valid target
    if (state.selectedIdx !== null) return applyToadMove(state, state.selectedIdx, idx);
    return state;
  }
  const myToad = state.currentPlayer === 0 ? 'R' : 'B';
  if (state.cells[idx] !== myToad) return state;
  return { ...state, selectedIdx: idx };
}

export function resetToads(): TurningToadsState {
  return createInitialState();
}
