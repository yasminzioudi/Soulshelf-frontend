// src/theme/colors.ts
export const colors = {
  primary: '#1C82AD',
  primaryLight: '#4FA3C7',
  text: '#000000',
  textSecondary: '#6A6F73',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  border: '#E5E7EB',
  error: '#D92D20',
  white: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof colors;