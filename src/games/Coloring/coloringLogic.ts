// src/games/coloring/coloringLogic.ts

export type NodeColor = number | null;

export interface GraphNode {
  id: number;
  x: number;
  y: number;
  color: NodeColor;
}

export interface GraphEdge {
  from: number;
  to: number;
}

export interface ColoringState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  currentPlayer: 0 | 1;
  scores: [number, number];
  kColors: number;
  gameOver: boolean;
  winner: 'player1' | 'player2' | 'draw' | null;
  lastMovedNode: number | null;
}

// ─────────────────────────────────────────
// Graph Generators
// ─────────────────────────────────────────

export function generateCycle(n: number) {
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: i,
    x: 0.5 + 0.4 * Math.cos((2 * Math.PI * i) / n),
    y: 0.5 + 0.4 * Math.sin((2 * Math.PI * i) / n),
    color: null,
  }));

  const edges: GraphEdge[] = [];
  for (let i = 0; i < n; i++) {
    edges.push({ from: i, to: (i + 1) % n });
  }

  return { nodes, edges };
}

export function generateComplete(n: number) {
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: i,
    x: 0.5 + 0.4 * Math.cos((2 * Math.PI * i) / n),
    y: 0.5 + 0.4 * Math.sin((2 * Math.PI * i) / n),
    color: null,
  }));

  const edges: GraphEdge[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      edges.push({ from: i, to: j });
    }
  }

  return { nodes, edges };
}

export function generateGrid(n: number) {
  const size = Math.sqrt(n);
  const grid = Math.floor(size);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const id = r * grid + c;
      nodes.push({
        id,
        x: c / (grid - 1),
        y: r / (grid - 1),
        color: null,
      });

      if (c > 0) edges.push({ from: id, to: id - 1 });
      if (r > 0) edges.push({ from: id, to: id - grid });
    }
  }

  return { nodes, edges };
}

export function generateRandom(n: number, p = 0.3) {
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.random(),
    y: Math.random(),
    color: null,
  }));

  const edges: GraphEdge[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.random() < p) {
        edges.push({ from: i, to: j });
      }
    }
  }

  return { nodes, edges };
}

// ─────────────────────────────────────────
// Core Logic
// ─────────────────────────────────────────

export function getNeighbors(id: number, edges: GraphEdge[]) {
  return edges
    .filter(e => e.from === id || e.to === id)
    .map(e => (e.from === id ? e.to : e.from));
}

export function isValidMove(
  nodeId: number,
  color: number,
  nodes: GraphNode[],
  edges: GraphEdge[]
) {
  if (nodes[nodeId].color !== null) return false;

  const neighbors = getNeighbors(nodeId, edges);
  return !neighbors.some(nId => nodes[nId].color === color);
}

export function anyMoveExists(
  nodes: GraphNode[],
  edges: GraphEdge[],
  kColors: number
) {
  return nodes.some(node =>
    node.color === null &&
    Array.from({ length: kColors }).some(c =>
      isValidMove(node.id, c, nodes, edges)
    )
  );
}

export function createInitialState(
  generator: (n: number) => { nodes: GraphNode[]; edges: GraphEdge[] },
  size: number,
  kColors: number
): ColoringState {
  const { nodes, edges } = generator(size);
  return {
    nodes,
    edges,
    currentPlayer: 0,
    scores: [0, 0],
    kColors,
    gameOver: false,
    winner: null,
    lastMovedNode: null,
  };
}

export function applyMove(
  state: ColoringState,
  nodeId: number,
  chosenColor: number
): ColoringState {
  if (!isValidMove(nodeId, chosenColor, state.nodes, state.edges))
    return state;

  const newNodes = state.nodes.map(n =>
    n.id === nodeId ? { ...n, color: chosenColor } : n
  );

  const newScores: [number, number] = [...state.scores];
  newScores[state.currentPlayer]++;

  const gameOver = !anyMoveExists(newNodes, state.edges, state.kColors);

  let winner: ColoringState['winner'] = null;
  if (gameOver) {
    if (newScores[0] > newScores[1]) winner = 'player1';
    else if (newScores[1] > newScores[0]) winner = 'player2';
    else winner = 'draw';
  }

  return {
    ...state,
    nodes: newNodes,
    scores: newScores,
    currentPlayer: state.currentPlayer === 0 ? 1 : 0,
    gameOver,
    winner,
    lastMovedNode: nodeId,
  };
}