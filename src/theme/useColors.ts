// src/theme/useColors.ts
// Convenience hook — returns the active palette (light or dark).
// Use this in every screen/component instead of the static `colors` import.
//
// Usage:
//   import { useColors } from '@/src/theme';
//   const colors = useColors();
//
import { useAppTheme } from '@/src/shared/providers/ThemeProvider';

export function useColors() {
  return useAppTheme().colors;
}
