// src/theme/colorsDark.ts
// Mirror of colors.ts — same keys, dark palette values.
// Light Mode values are intentionally unchanged in colors.ts.
export const colorsDark = {
  primary: '#4FA3C7',
  primaryLight: '#1C82AD',
  text: '#F1F1F1',
  textSecondary: '#9CA3AF',
  background: '#0F1117',
  surface: '#1C1E26',
  border: '#2D2F3A',
  error: '#F87171',
  white: '#FFFFFF',
} as const;

export type ColorsDark = typeof colorsDark;
