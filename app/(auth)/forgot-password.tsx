// app/(auth)/forgot-password.tsx
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
import { router } from "expo-router";

import { forgotPasswordApi } from "@/src/features/auth/auth.api";
import { Button, Input } from "@/src/shared/components/ui";
import { useColors } from "@/src/theme";
import { fontFamily, fontSize, spacing } from "@/src/theme";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await forgotPasswordApi({ email: trimmedEmail });
      Alert.alert(
        "Code Sent",
        `If an account exists for ${trimmedEmail}, a reset code has been sent.`,
        [
          {
            text: "OK",
            onPress: () =>
              router.push({
                pathname: "/verify-code",
                params: { email: trimmedEmail },
              }),
          },
        ],
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      Alert.alert("Error", msg ?? "Could not send reset code. Please try again.");
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
        <Text style={[styles.title, { color: colors.primary }]}>Forgot Password</Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Enter your email address and we'll send you a code to reset your password.
        </Text>

        <View style={styles.form}>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        <Button
          label="Send Reset Code"
          onPress={handleSendCode}
          loading={loading}
          style={styles.submitButton}
        />

        <Pressable onPress={() => router.push("/login")} style={styles.backWrapper}>
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
  form: { width: "100%", marginBottom: spacing.md },
  submitButton: { marginBottom: spacing.lg },
  backWrapper: { marginTop: spacing.sm, paddingVertical: spacing.sm },
  backLink: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
