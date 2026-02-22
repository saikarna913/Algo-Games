// src/core/theme/index.ts
// Centralized theme configuration for the entire app.
// All colors, fonts, spacing and shadows are defined here.
// Import this file wherever styling is needed.

export const Colors = {
  // Primary palette
  background: '#E1E5EA',    // Light Mist Gray - main background
  lightBlue: '#B7D8E6',     // Light Blue - cards, panels
  coastalBlue: '#4A90E2',   // Coastal Blue - primary actions, player 1
  deepTeal: '#2B7A78',      // Deep Teal - player 2, accents
  midnightNavy: '#264653',  // Midnight Navy - text, headers

  // Derived / utility
  white: '#FFFFFF',
  cardBg: '#FFFFFF',
  border: '#C8D4DC',
  textPrimary: '#264653',
  textSecondary: '#4A7A8A',
  textLight: '#7FA8B8',
  error: '#E05C5C',
  success: '#2ECC71',
  warning: '#F39C12',
  overlay: 'rgba(38, 70, 83, 0.5)',

  // Player colors
  playerRed: '#E05C5C',
  playerBlue: '#4A90E2',

  // Stone game
  stoneColor: '#8B6F47',
  nodeEmpty: '#D9E8EF',
  nodeOccupied: '#2B7A78',
} as const;

export const FontFamily = {
  // Pacifico gives a handwritten/playful feel
  display: 'Pacifico_400Regular',
  // Fallback system fonts
  regular: 'System',
  mono: 'monospace',
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 40,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#264653',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#264653',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#264653',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export default { Colors, FontFamily, FontSize, Spacing, BorderRadius, Shadow };
