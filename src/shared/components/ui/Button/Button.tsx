// src/shared/components/ui/Button/Button.tsx
import { useColors } from "@/src/theme";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
} from "react-native";
import { fontFamily, fontSize, radius, spacing } from "@/src/theme";

type Variant = "primary" | "outline" | "ghost";

interface ButtonProps extends PressableProps {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = "primary",
  loading = false,
  fullWidth = true,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const colors = useColors();

  const variantStyle =
    variant === "primary"
      ? { backgroundColor: colors.primary }
      : variant === "outline"
        ? { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary }
        : { backgroundColor: "transparent" };

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style as object,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.white : colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.label,
            { color: variant !== "primary" ? colors.primary : colors.white },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: { width: "100%" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
  },
});
