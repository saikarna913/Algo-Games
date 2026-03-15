// src/games/registry.ts
// ─────────────────────────────────────────────────────────────────────────────
// GAME REGISTRY — The heart of the plugin system.
//
// To add a new game:
//   1. Create a folder:  src/games/yourGame/
//   2. Implement the GamePlugin interface in yourGame/index.tsx
//   3. Import and add it to the GAME_REGISTRY array below.
//   4. That's it! The home screen and navigation auto-detect it.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';

// ─── Plugin Interface ─────────────────────────────────────────────────────────

export interface GamePlugin {
  /** Unique string identifier (used in navigation) */
  id: string;

  /** Display name shown on game card */
  title: string;

  /** Short description shown on card */
  description: string;

  /** CS concept tags e.g. ['Graph Theory', 'Coloring'] */
  tags: string[];

  /** Emoji or short icon label */
  icon: string;

  /** Difficulty: 1 = easy, 3 = hard */
  difficulty: 1 | 2 | 3;

  /** Min players needed */
  minPlayers: 2 | 3 | 4;

  /** Whether game is implemented. false = show "Coming Soon" */
  implemented: boolean;

  /** The React component that renders the game screen */
  component: React.ComponentType<GameScreenProps>;

  /** Optional: override scoring logic. Default: winner gets +1 */
  onGameEnd?: (winner: 'red' | 'blue' | string, addScore: (p: 'red' | 'blue', n: number) => void) => void;
}

export interface GameScreenProps {
  /** Current game mode passed from navigation */
  mode: 'two-player' | 'multiplayer';
  /** Callback when game ends — pass winner identifier */
  onGameEnd: (winner: string) => void;
  /** Callback to go back to home */
  onExit: () => void;
  /** When false, the game should hide its internal header/back button */
  showHeader?: boolean;
}

// ─── Game component imports ───────────────────────────────────────────────────

import BipartiteGame from './bipartite/BipartiteGame';
import StonePropagationGame from './stonePropagation/StonePropagationGame';
import ColoringGame from './Coloring/ColoringGame';
import TicTacToeGame from './tictactoe/TicTacToeGame';

// ── New CS games ──────────────────────────────────────────────────────────────
import BinaryBattleGame from './binaryBattle/BinaryBattleGame';
import StackAttackGame from './stackAttack/StackAttackGame';
import SortWarsGame from './sortWars/SortWarsGame';
import MorrisGame from './morris/MorrisGame';

// ─── Registered Games ─────────────────────────────────────────────────────────

export const GAME_REGISTRY: GamePlugin[] = [

  // ── Game 1: Bipartite Graph Coloring ──────────────────────────────────────
  {
    id: 'bipartite',
    title: 'Bipartite Coloring',
    description:
      'Color graph nodes while maintaining bipartite constraints. Challenge your opponent in this graph theory duel!',
    tags: ['Graph Theory', 'Coloring', 'BFS'],
    icon: '🔵',
    difficulty: 2,
    minPlayers: 2,
    implemented: true,
    component: BipartiteGame,
  },

  // ── Game 2: Stone Propagation ─────────────────────────────────────────────
  {
    id: 'stonePropagation',
    title: 'Stone Propagation',
    description:
      'Place stones on graph nodes. When a node reaches 4 stones, they explode outward! Chain reactions win the game.',
    tags: ['Graph Theory', 'Simulation', 'Chain Reaction'],
    icon: '🪨',
    difficulty: 3,
    minPlayers: 2,
    implemented: true,
    component: StonePropagationGame,
  },

  // ── Game 3: Graph Coloring ────────────────────────────────────────────────
  {
    id: 'graphColoring',
    title: 'Graph Coloring',
    description:
      'Compete to color nodes without violating adjacency constraints. Explore k-coloring, complex graphs, and strategic play.',
    tags: ['Graph Theory', 'Coloring', 'NP-Complete'],
    icon: '🎨',
    difficulty: 3,
    minPlayers: 2,
    implemented: true,
    component: ColoringGame,
  },

  // ── Game 4: Tic-Tac-Toe ───────────────────────────────────────────────────
  {
    id: 'tictactoe',
    title: 'Tic Tac Toe',
    description: 'Classic 3×3 Tic-Tac-Toe. Claim three in a row to win.',
    tags: ['Classic', 'Strategy'],
    icon: '❌',
    difficulty: 1,
    minPlayers: 2,
    implemented: true,
    component: TicTacToeGame,
  },

  // ── Game 5: Binary Battle ─────────────────────────────────────────────────
  {
    id: 'binaryBattle',
    title: 'Binary Battle',
    description:
      'Convert decimal numbers to binary by toggling bit buttons. Race your opponent across 10 rounds — streaks earn bonus points!',
    tags: ['Binary', 'Number Systems', 'Bitwise'],
    icon: '💻',
    difficulty: 1,
    minPlayers: 2,
    implemented: true,
    component: BinaryBattleGame,
    onGameEnd: (winner, addScore) => {
      if (winner === 'red' || winner === 'blue') addScore(winner, 1);
    },
  },

  // ── Game 6: Stack Attack ──────────────────────────────────────────────────
  {
    id: 'stackAttack',
    title: 'Stack Attack',
    description:
      'Push and pop from a shared stack. Score by popping your own items — but trigger overflow or underflow and lose a point!',
    tags: ['Data Structures', 'Stack', 'LIFO'],
    icon: '📚',
    difficulty: 2,
    minPlayers: 2,
    implemented: true,
    component: StackAttackGame,
    onGameEnd: (winner, addScore) => {
      if (winner === 'red' || winner === 'blue') addScore(winner, 1);
    },
  },

  // ── Game 7: Sort Wars ─────────────────────────────────────────────────────
  {
    id: 'sortWars',
    title: 'Sort Wars',
    description:
      'Swap adjacent elements to sort a shared array. Good swaps score points — collaborate and compete to finish the sort!',
    tags: ['Sorting', 'Bubble Sort', 'Algorithms'],
    icon: '📊',
    difficulty: 1,
    minPlayers: 2,
    implemented: true,
    component: SortWarsGame,
    onGameEnd: (winner, addScore) => {
      if (winner === 'red' || winner === 'blue') addScore(winner, 1);
    },
  },

  // ── Coming Soon: Spanning Tree ────────────────────────────────────────────
  {
    id: 'spanningTree',
    title: 'Spanning Tree Wars',
    description:
      'Compete to build the minimum spanning tree. Strategic edge selection in this graph optimization battle.',
    tags: ['Graph Theory', 'MST', 'Greedy'],
    icon: '🌳',
    difficulty: 2,
    minPlayers: 2,
    implemented: false,
    component: () => null,
  },

  // ── Coming Soon: Binary Search Battle ────────────────────────────────────
  {
    id: 'binarySearch',
    title: 'Binary Search Battle',
    description:
      'Guess the hidden number using binary search strategy. Fewest guesses wins!',
    tags: ['Search', 'Binary Search', 'Strategy'],
    icon: '🔍',
    difficulty: 1,
    minPlayers: 2,
    implemented: false,
    component: () => null,
  },


  {
  id: 'morris',
  title: "Nine Men's Morris",
  description:
    "Place, move, and fly pieces on a 3-ring graph board. Form mills of 3 to remove opponent pieces. A 3000-year-old graph theory puzzle!",
  tags: ['Graph Theory', 'Adjacency', 'Strategy', 'Classic'],
  icon: '⬡',
  difficulty: 3,
  minPlayers: 2,
  implemented: true,
  component: MorrisGame,
  onGameEnd: (winner, addScore) => {
    if (winner === 'red' || winner === 'blue') addScore(winner, 1);
  },
  },

];

// ─── Helper utilities ─────────────────────────────────────────────────────────

/** Find a game by its ID */
export const getGameById = (id: string): GamePlugin | undefined =>
  GAME_REGISTRY.find((g) => g.id === id);

/** Get only implemented games */
export const getImplementedGames = (): GamePlugin[] =>
  GAME_REGISTRY.filter((g) => g.implemented);

/** Get coming-soon games */
export const getComingSoonGames = (): GamePlugin[] =>
  GAME_REGISTRY.filter((g) => !g.implemented);