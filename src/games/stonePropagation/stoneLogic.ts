// src/games/stonePropagation/stoneLogic.ts
// Pure game logic for Stone Propagation. No React dependencies.
//
// RULES:
//   • Graph nodes start empty (0 stones)
//   • Players alternate turns placing one stone on any empty or own node
//   • When a node reaches EXPLOSION_THRESHOLD (4) stones → it explodes:
//     - Distributes 1 stone to each adjacent node
//     - That node's stones reset to 0 (actually: stones = previous - threshold)
//   • Chain reactions: if an adjacent node also hits threshold, it explodes too
//   • A node is "owned" by whoever last placed/caused stones on it
//   • When all nodes are captured by one player → that player wins
//   • Alternatively: player with most owned nodes after N turns wins

export const EXPLOSION_THRESHOLD = 4;
export const MAX_TURNS = 30; // prevent infinite games

// ─── Types ────────────────────────────────────────────────────────────────────

export type StoneOwner = 'red' | 'blue' | null;

export interface StoneNode {
  id: number;
  x: number;        // normalized 0-1 for layout
  y: number;
  stones: number;
  owner: StoneOwner;
}

export interface StoneEdge {
  from: number;
  to: number;
}

export interface StoneState {
  nodes: StoneNode[];
  edges: StoneEdge[];
  currentPlayer: 'red' | 'blue';
  turn: number;
  gameOver: boolean;
  winner: 'red' | 'blue' | 'draw' | null;
  lastExplodedNodes: number[]; // for animation
  scores: { red: number; blue: number };
}

// ─── Graph Preset ─────────────────────────────────────────────────────────────

export const STONE_GRAPH = {
  nodes: [
    { id: 0, x: 0.5,  y: 0.08 },
    { id: 1, x: 0.82, y: 0.30 },
    { id: 2, x: 0.75, y: 0.65 },
    { id: 3, x: 0.5,  y: 0.82 },
    { id: 4, x: 0.25, y: 0.65 },
    { id: 5, x: 0.18, y: 0.30 },
    { id: 6, x: 0.5,  y: 0.45 }, // center hub
  ],
  edges: [
    { from: 0, to: 1 }, { from: 1, to: 2 },
    { from: 2, to: 3 }, { from: 3, to: 4 },
    { from: 4, to: 5 }, { from: 5, to: 0 },
    { from: 0, to: 6 }, { from: 2, to: 6 },
    { from: 4, to: 6 },
  ],
};

// ─── Initial State ────────────────────────────────────────────────────────────

export function createStoneInitialState(): StoneState {
  return {
    nodes: STONE_GRAPH.nodes.map((n) => ({ ...n, stones: 0, owner: null })),
    edges: [...STONE_GRAPH.edges],
    currentPlayer: 'red',
    turn: 0,
    gameOver: false,
    winner: null,
    lastExplodedNodes: [],
    scores: { red: 0, blue: 0 },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getNeighborIds(nodeId: number, edges: StoneEdge[]): number[] {
  return edges
    .filter((e) => e.from === nodeId || e.to === nodeId)
    .map((e) => (e.from === nodeId ? e.to : e.from));
}

// ─── Explosion Logic ──────────────────────────────────────────────────────────

/**
 * Process explosions iteratively (BFS approach to handle chain reactions).
 * Returns updated nodes array and list of nodes that exploded (for animation).
 */
export function processExplosions(
  nodes: StoneNode[],
  edges: StoneEdge[],
  player: 'red' | 'blue'
): { nodes: StoneNode[]; explodedNodes: number[] } {
  let current = nodes.map((n) => ({ ...n })); // deep copy
  const explodedNodes: number[] = [];
  
  // BFS queue of nodes that need to explode
  const queue: number[] = current
    .filter((n) => n.stones >= EXPLOSION_THRESHOLD)
    .map((n) => n.id);

  const maxIterations = 50; // safety limit for chain reactions
  let iterations = 0;

  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    const nodeId = queue.shift()!;
    const node = current[nodeId];

    if (node.stones < EXPLOSION_THRESHOLD) continue; // check again (may have changed)

    // Explode: remove threshold stones from this node
    current[nodeId] = {
      ...node,
      stones: node.stones - EXPLOSION_THRESHOLD,
      // Owner remains or becomes null if empty
      owner: node.stones - EXPLOSION_THRESHOLD > 0 ? node.owner : null,
    };
    explodedNodes.push(nodeId);

    // Distribute 1 stone to each neighbor
    const neighbors = getNeighborIds(nodeId, edges);
    neighbors.forEach((nId) => {
      current[nId] = {
        ...current[nId],
        stones: current[nId].stones + 1,
        owner: player, // conquering player
      };

      // Check if neighbor now needs to explode
      if (current[nId].stones >= EXPLOSION_THRESHOLD) {
        queue.push(nId);
      }
    });
  }

  return { nodes: current, explodedNodes };
}

// ─── Apply Move ───────────────────────────────────────────────────────────────

/**
 * Place a stone on a node. Returns new state or unchanged state if invalid.
 * A player can only place on their own nodes or empty nodes.
 */
export function applyStoneMove(state: StoneState, nodeId: number): StoneState {
  const node = state.nodes[nodeId];

  // Can only place on empty or own nodes
  if (node.owner !== null && node.owner !== state.currentPlayer) {
    return state; // Invalid move
  }

  // Place stone
  let newNodes = state.nodes.map((n) =>
    n.id === nodeId
      ? { ...n, stones: n.stones + 1, owner: state.currentPlayer }
      : n
  );

  // Process chain reactions
  const { nodes: processedNodes, explodedNodes } = processExplosions(
    newNodes,
    state.edges,
    state.currentPlayer
  );
  newNodes = processedNodes;

  // Count owned nodes for score
  const redOwned = newNodes.filter((n) => n.owner === 'red').length;
  const blueOwned = newNodes.filter((n) => n.owner === 'blue').length;

  // Check win conditions
  const nextPlayer = state.currentPlayer === 'red' ? 'blue' : 'red';
  const newTurn = state.turn + 1;

  let gameOver = false;
  let winner: StoneState['winner'] = null;

  // Win condition: opponent has 0 owned nodes after turn 2 (initial placement phase)
  if (newTurn > 2) {
    const opponentOwned = nextPlayer === 'red' ? redOwned : blueOwned;
    if (opponentOwned === 0) {
      gameOver = true;
      winner = state.currentPlayer;
    }
  }

  // Time limit win condition
  if (!gameOver && newTurn >= MAX_TURNS) {
    gameOver = true;
    if (redOwned > blueOwned) winner = 'red';
    else if (blueOwned > redOwned) winner = 'blue';
    else winner = 'draw';
  }

  return {
    ...state,
    nodes: newNodes,
    currentPlayer: nextPlayer,
    turn: newTurn,
    gameOver,
    winner,
    lastExplodedNodes: explodedNodes,
    scores: { red: redOwned, blue: blueOwned },
  };
}
