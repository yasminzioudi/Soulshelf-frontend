// app/(auth)/reset-password.tsx
import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { Ionicons } from "@expo/vector-icons";
import { resetPasswordApi } from "@/src/features/auth/auth.api";
import { Button, Input } from "@/src/shared/components/ui";
import { useColors } from "@/src/theme";
import { fontFamily, fontSize, spacing } from "@/src/theme";

export default function ResetPasswordScreen() {
  const colors = useColors();
  const { resetToken } = useLocalSearchParams<{ resetToken?: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!resetToken) {
      Alert.alert(
        "Error",
        "Invalid or expired reset session. Please request a new code.",
        [{ text: "OK", onPress: () => router.replace("/forgot-password") }],
      );
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert("Error", "Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi({ resetToken, newPassword });
      Alert.alert(
        "Password Reset Successful",
        "Your password has been updated successfully. You can now log in with your new password.",
        [{ text: "Log In", onPress: () => router.replace("/login") }],
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      Alert.alert("Reset Failed", msg ?? "Could not reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.primary }]}>New Password</Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Enter your new password below. Ensure it is at least 6 characters.
        </Text>

        <View style={styles.form}>
          <Input
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            autoCapitalize="none"
            rightElement={
              <Pressable
                onPress={() => setShowNewPassword((prev) => !prev)}
                hitSlop={8}
                accessible
                accessibilityLabel={showNewPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            }
          />
          <View style={styles.inputSpacing} />
          <Input
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            rightElement={
              <Pressable
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                hitSlop={8}
                accessible
                accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            }
          />
        </View>

        <Button
          label="Reset Password"
          onPress={handleResetPassword}
          loading={loading}
          style={styles.submitButton}
        />

        <Pressable
          onPress={() => router.replace("/login")}
          style={styles.backWrapper}
        >
          <Text style={[styles.backLink, { color: colors.primary }]}>Back to Sign In</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  form: { width: "100%", marginBottom: spacing.lg },
  inputSpacing: { height: spacing.md },
  submitButton: { marginBottom: spacing.lg, width: "100%" },
  backWrapper: { marginTop: spacing.sm, paddingVertical: spacing.sm },
  backLink: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
