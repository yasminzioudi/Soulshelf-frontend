// src/shared/providers/ThemeProvider.tsx
import * as SecureStore from 'expo-secure-store';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { colors } from '@/src/theme/colors';
import { colorsDark } from '@/src/theme/colorsDark';
import { fontFamily, radius, shadows, spacing } from '@/src/theme';

// ─── Storage key ──────────────────────────────────────────────────────────────
const THEME_STORAGE_KEY = 'ss_theme_mode';

// ─── Context shape ────────────────────────────────────────────────────────────
type AppColors = typeof colors;

interface AppTheme {
  colors: AppColors;
  fontFamily: typeof fontFamily;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  isDark: boolean;
  toggleTheme: () => void;
}

// Default (light) theme used as context default value
const defaultTheme: AppTheme = {
  colors,
  fontFamily,
  spacing,
  radius,
  shadows,
  isDark: false,
  toggleTheme: () => {},
};

const AppThemeContext = createContext<AppTheme>(defaultTheme);

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAppTheme(): AppTheme {
  return useContext(AppThemeContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: PropsWithChildren) {
  const [isDark, setIsDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted preference on mount (uses expo-secure-store)
  useEffect(() => {
    let active = true;
    const loadTheme = async () => {
      try {
        const value = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (active && value === 'dark') {
          setIsDark(true);
        }
      } catch {
        // Silently fallback to default light theme on storage read failure
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    };
    void loadTheme();
    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      SecureStore.setItemAsync(THEME_STORAGE_KEY, next ? 'dark' : 'light').catch(
        () => {},
      );
      return next;
    });
  }, []);

  const theme: AppTheme = {
    colors: isDark ? (colorsDark as unknown as AppColors) : colors,
    fontFamily,
    spacing,
    radius,
    shadows,
    isDark,
    toggleTheme,
  };

  // Don't render children until we've read storage — avoids a single-frame flash of wrong theme on startup
  if (!hydrated) return null;

  return (
    <AppThemeContext.Provider value={theme}>
      <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        {children}
      </NavigationThemeProvider>
    </AppThemeContext.Provider>
  );
}
