// src/games/bipartite/bipartiteLogic.ts
// Pure game logic — no React dependencies. Easy to unit-test.
//
// BIPARTITE GRAPH COLORING RULES:
//   • Two players alternate coloring uncolored nodes
//   • Red player = color 0, Blue player = color 1
//   • A move is INVALID if any neighbor of the node has the same color
//   • This maintains the bipartite property: no two adjacent nodes share a color
//   • Game ends when no valid moves remain
//   • Player with more colored nodes wins

// ─── Types ────────────────────────────────────────────────────────────────────

export type NodeColor = null | 0 | 1; // null = unclaimed, 0 = red, 1 = blue

export interface GraphNode {
  id: number;
  x: number; // layout position (0-1 normalized)
  y: number;
}

export interface GraphEdge {
  from: number;
  to: number;
  owner: NodeColor; // who claimed this edge
}

export interface BipartiteState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  currentPlayer: 0 | 1; // 0 = Red, 1 = Blue
  scores: [number, number]; // [red score, blue score]
  gameOver: boolean;
  winner: 'red' | 'blue' | 'draw' | null;
  lastMovedEdge: number | null;
}

// ─── Graph Presets ────────────────────────────────────────────────────────────
// Pre-defined bipartite graphs so both players play on a fair graph.

export const GRAPH_PRESETS: Array<{ nodes: Omit<GraphNode, 'color'>[]; edges: { from: number; to: number }[] }> = [
  // Preset 0: Simple 6-node bipartite (3+3)
  {
    nodes: [
      { id: 0, x: 0.2, y: 0.2 },
      { id: 1, x: 0.5, y: 0.15 },
      { id: 2, x: 0.8, y: 0.2 },
      { id: 3, x: 0.2, y: 0.75 },
      { id: 4, x: 0.5, y: 0.8 },
      { id: 5, x: 0.8, y: 0.75 },
    ],
    edges: [
      { from: 0, to: 3 }, { from: 0, to: 4 },
      { from: 1, to: 3 }, { from: 1, to: 5 },
      { from: 2, to: 4 }, { from: 2, to: 5 },
    ],
  },

  // Preset 1: Petersen-like 10-node graph
  {
    nodes: [
      { id: 0, x: 0.5, y: 0.05 },
      { id: 1, x: 0.82, y: 0.28 },
      { id: 2, x: 0.72, y: 0.68 },
      { id: 3, x: 0.28, y: 0.68 },
      { id: 4, x: 0.18, y: 0.28 },
      { id: 5, x: 0.5, y: 0.25 },
      { id: 6, x: 0.66, y: 0.38 },
      { id: 7, x: 0.58, y: 0.58 },
      { id: 8, x: 0.42, y: 0.58 },
      { id: 9, x: 0.34, y: 0.38 },
    ],
    edges: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 0 },
      { from: 0, to: 5 }, { from: 1, to: 6 }, { from: 2, to: 7 },
      { from: 3, to: 8 }, { from: 4, to: 9 },
      { from: 5, to: 7 }, { from: 7, to: 9 }, { from: 9, to: 6 },
      { from: 6, to: 8 }, { from: 8, to: 5 },
    ],
  },
];

// ─── Initial State Factory ────────────────────────────────────────────────────

export function createInitialState(presetIndex = 0): BipartiteState {
  const preset = GRAPH_PRESETS[presetIndex % GRAPH_PRESETS.length];
  return {
    nodes: preset.nodes.map((n) => ({ ...n })),
    edges: preset.edges.map((e) => ({ ...e, owner: null })),
    currentPlayer: 0,
    scores: [0, 0],
    gameOver: false,
    winner: null,
    lastMovedEdge: null,
  };
}

// ─── Core Logic Functions ─────────────────────────────────────────────────────

/** Get neighbor node IDs for a given node */
export function getNeighbors(nodeId: number, edges: GraphEdge[]): number[] {
  return edges
    .filter((e) => e.from === nodeId || e.to === nodeId)
    .map((e) => (e.from === nodeId ? e.to : e.from));
}

/**
 * Check if coloring a node with the current player's color is valid.
 * A move is valid if no adjacent node has the same color.
 */
export function isValidMove(
  edgeId: number,
  playerColor: NodeColor,
  nodes: GraphNode[],
  edges: GraphEdge[]
): boolean {
  const edge = edges[edgeId];
  if (!edge) return false;
  if (edge.owner !== null) return false; // already claimed

  // A node cannot have more than one claimed edge — ensure both endpoints are free
  const { from, to } = edge;
  const fromTaken = edges.some((e) => e.owner !== null && (e.from === from || e.to === from));
  const toTaken = edges.some((e) => e.owner !== null && (e.from === to || e.to === to));
  return !fromTaken && !toTaken;
}

/**
 * Get all valid moves for a player.
 * Returns array of node IDs that can be colored.
 */
export function getValidMoves(
  playerColor: NodeColor,
  nodes: GraphNode[],
  edges: GraphEdge[]
): number[] {
  return edges
    .map((e, idx) => ({ e, idx }))
    .filter(({ e, idx }) => e.owner === null && isValidMove(idx, playerColor, nodes, edges))
    .map(({ idx }) => idx);
}

/**
 * Apply a move to the state and return the new state.
 * Does NOT mutate the original state (immutable update).
 */
export function applyMove(state: BipartiteState, edgeId: number): BipartiteState {
  const playerColor = state.currentPlayer as NodeColor;

  // Validate
  if (!isValidMove(edgeId, playerColor, state.nodes, state.edges)) {
    return state; // invalid — return unchanged
  }

  // Claim edge
  const newEdges = state.edges.map((e, idx) =>
    idx === edgeId ? { ...e, owner: playerColor } : e
  );

  // Update scores
  const newScores: [number, number] = [...state.scores];
  newScores[state.currentPlayer]++;

  // Switch player
  const nextPlayer = state.currentPlayer === 0 ? 1 : 0;

  // Determine if either player has valid moves left
  const nextValidMoves = getValidMoves(nextPlayer as NodeColor, state.nodes, newEdges);
  const currentValidMoves = getValidMoves(playerColor, state.nodes, newEdges);

  let gameOver = false;
  let winner: BipartiteState['winner'] = null;

  if (nextValidMoves.length === 0 && currentValidMoves.length === 0) {
    gameOver = true;
    if (newScores[0] > newScores[1]) winner = 'red';
    else if (newScores[1] > newScores[0]) winner = 'blue';
    else winner = 'draw';
  }

  return {
    ...state,
    edges: newEdges,
    scores: newScores,
    currentPlayer: nextPlayer as 0 | 1,
    gameOver,
    winner,
    lastMovedEdge: edgeId,
  };
}
