// src/shared/hooks/use-theme-color.ts
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import { colors, colorsDark } from "@/src/theme";

const themeColors = {
  light: {
    text: colors.text,
    background: colors.background,
  },
  dark: {
    text: colorsDark.text,
    background: colorsDark.background,
  },
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof themeColors.light,
) {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return themeColors[theme][colorName];
  }
}
