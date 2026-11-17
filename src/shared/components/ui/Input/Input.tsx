// src/shared/components/ui/Input/Input.tsx
import { useColors } from "@/src/theme";
import { forwardRef, ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { fontFamily, fontSize, radius, spacing } from "@/src/theme";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, rightElement, style, ...rest }, ref) => {
    const colors = useColors();

    return (
      <View style={styles.container}>
        {label && (
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        )}
        <View
          style={[
            styles.inputWrapper,
            { borderColor: colors.primary, backgroundColor: colors.surface },
            error && styles.inputError,
          ]}
        >
          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.text }, style as object]}
            placeholderTextColor={colors.textSecondary}
            {...rest}
          />
          {rightElement && (
            <View style={styles.rightElementWrapper}>{rightElement}</View>
          )}
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  },
);

Input.displayName = "Input";

const styles = StyleSheet.create({
  container: { width: "100%", marginBottom: spacing.md },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
  },
  rightElementWrapper: {
    paddingRight: spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  inputError: { borderColor: "#D64545" },
  error: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: "#D64545",
    marginTop: spacing.xs,
  },
});
