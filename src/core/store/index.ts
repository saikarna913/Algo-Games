// src/core/store/index.ts
// Global state management using Zustand.
// Handles: player scores, game mode, donation status, active game.
// All games read/write scores through this store.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GameMode = 'two-player' | 'multiplayer';

export interface PlayerScore {
  name: string;
  score: number;
  color: 'red' | 'blue';
}

export interface MultiplayerPlayer {
  id: string;
  name: string;
  score: number;
  color: string;
}

export interface GameStoreState {
  // Mode
  mode: GameMode;
  setMode: (mode: GameMode) => void;

  // Two-player scores
  playerRed: PlayerScore;
  playerBlue: PlayerScore;
  addScore: (player: 'red' | 'blue', points: number) => void;
  resetScores: () => void;

  // Multiplayer
  multiplayerPlayers: MultiplayerPlayer[];
  setMultiplayerPlayers: (players: MultiplayerPlayer[]) => void;
  addMultiplayerScore: (playerId: string, points: number) => void;

  // Active game tracking
  activeGameId: string | null;
  setActiveGame: (gameId: string | null) => void;

  // Donation
  hasDonated: boolean;
  donationPopupSeen: boolean;
  setHasDonated: (val: boolean) => void;
  setDonationPopupSeen: (val: boolean) => void;
  loadDonationState: () => Promise<void>;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  HAS_DONATED: '@cs_games_has_donated',
  DONATION_POPUP_SEEN: '@cs_games_donation_popup_seen',
  SCORES: '@cs_games_scores',
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStoreState>((set, get) => ({
  // ── Mode ──────────────────────────────────────────────────────────────────
  mode: 'two-player',
  setMode: (mode) => set({ mode }),

  // ── Two-Player Scores ─────────────────────────────────────────────────────
  playerRed: { name: 'Red', score: 0, color: 'red' },
  playerBlue: { name: 'Blue', score: 0, color: 'blue' },

  addScore: (player, points) => {
    if (player === 'red') {
      set((state) => ({
        playerRed: { ...state.playerRed, score: state.playerRed.score + points },
      }));
    } else {
      set((state) => ({
        playerBlue: { ...state.playerBlue, score: state.playerBlue.score + points },
      }));
    }
  },

  resetScores: () =>
    set({
      playerRed: { name: 'Red', score: 0, color: 'red' },
      playerBlue: { name: 'Blue', score: 0, color: 'blue' },
      multiplayerPlayers: [],
    }),

  // ── Multiplayer ───────────────────────────────────────────────────────────
  multiplayerPlayers: [],

  setMultiplayerPlayers: (players) => set({ multiplayerPlayers: players }),

  addMultiplayerScore: (playerId, points) =>
    set((state) => ({
      multiplayerPlayers: state.multiplayerPlayers.map((p) =>
        p.id === playerId ? { ...p, score: p.score + points } : p
      ),
    })),

  // ── Active Game ───────────────────────────────────────────────────────────
  activeGameId: null,
  setActiveGame: (gameId) => set({ activeGameId: gameId }),

  // ── Donation ──────────────────────────────────────────────────────────────
  hasDonated: false,
  donationPopupSeen: false,

  setHasDonated: async (val) => {
    set({ hasDonated: val });
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_DONATED, JSON.stringify(val));
  },

  setDonationPopupSeen: async (val) => {
    set({ donationPopupSeen: val });
    await AsyncStorage.setItem(STORAGE_KEYS.DONATION_POPUP_SEEN, JSON.stringify(val));
  },

  // Load persisted donation state on app start
  loadDonationState: async () => {
    try {
      const donated = await AsyncStorage.getItem(STORAGE_KEYS.HAS_DONATED);
      const seen = await AsyncStorage.getItem(STORAGE_KEYS.DONATION_POPUP_SEEN);
      set({
        hasDonated: donated ? JSON.parse(donated) : false,
        donationPopupSeen: seen ? JSON.parse(seen) : false,
      });
    } catch (e) {
      console.warn('Failed to load donation state:', e);
    }
  },
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

/** Combined score of both players in two-player mode */
export const selectCombinedScore = (state: GameStoreState) =>
  state.playerRed.score + state.playerBlue.score;

/** Total score across all multiplayer players */
export const selectMultiplayerTotal = (state: GameStoreState) =>
  state.multiplayerPlayers.reduce((sum, p) => sum + p.score, 0);
