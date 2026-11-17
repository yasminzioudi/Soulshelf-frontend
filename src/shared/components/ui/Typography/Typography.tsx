// src/shared/components/ui/Typography/Typography.tsx
import { useColors } from "@/src/theme";
import { StyleSheet, Text, TextProps } from "react-native";
import { fontFamily, fontSize } from "@/src/theme";

type Variant = "h1" | "h2" | "body" | "caption" | "link";

interface TypographyProps extends TextProps {
  variant?: Variant;
  color?: string;
}

export function Typography({
  variant = "body",
  color,
  style,
  children,
  ...rest
}: TypographyProps) {
  const colors = useColors();

  const variantColor =
    variant === "caption"
      ? colors.textSecondary
      : variant === "link"
        ? colors.primary
        : colors.text;

  return (
    <Text
      style={[styles[variant], { color: color ?? variantColor }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
  },
  h2: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  link: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
});
