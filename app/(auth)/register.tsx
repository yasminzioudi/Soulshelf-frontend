// app/(auth)/register.tsx
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import axios from "axios";

import { Button, Input, SocialAuthRow } from "@/src/shared/components/ui";
import { useColors } from "@/src/theme";
import { fontFamily, fontSize, spacing } from "@/src/theme";
import { signupApi, loginApi } from "@/src/features/auth/auth.api";
import { saveAuthSession } from "@/src/core/storage/tokenStorage";
import { useGoogleSignIn } from "@/src/features/auth/useGoogleSignIn";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
}

export default function RegisterScreen() {
  const colors = useColors();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = useCallback(() => {
    router.replace("/customize-feed");
  }, []);
  const handleGoogleError = useCallback((message: string) => {
    setErrors({ form: message });
  }, []);
  const { ready: googleReady, signIn: googleSignIn } = useGoogleSignIn({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
  });

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = "This field is required.";
    if (!email.trim()) {
      next.email = "This field is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (!password) {
      next.password = "This field is required.";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    if (loading) return;

    setLoading(true);
    setErrors({});

    try {
      await signupApi({
        email: email.trim(),
        password,
        name: name.trim(),
      });
      // Signup returns only the user (no tokens). Auto-login to get a full
      // auth session so the onboarding screen can call authenticated APIs.
      const session = await loginApi({ email: email.trim(), password });
      await saveAuthSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
      });
      router.replace("/customize-feed");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverError = err.response?.data?.error as string | undefined;
        if (serverError === "An account with this email already exists.") {
          setErrors({ email: "An account with this email already exists." });
        } else {
          setErrors({ form: serverError ?? "Something went wrong. Please try again." });
        }
      } else {
        setErrors({ form: "Network error. Check your connection and try again." });
      }
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
        <Text style={[styles.title, { color: colors.primary }]}>Sign Up</Text>

        {errors.form && (
          <Text style={[styles.formError, { color: colors.error }]}>{errors.form}</Text>
        )}

        <View style={styles.form}>
          <Input
            placeholder="Name"
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
            autoCapitalize="words"
            autoComplete="name"
            error={errors.name}
          />
          <Input
            placeholder="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            error={errors.email}
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            error={errors.password}
            rightElement={
              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={8}
                accessible
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            }
          />
        </View>

        <Button
          label="Sign Up"
          onPress={handleRegister}
          loading={loading}
          style={styles.submitButton}
        />

        <View style={styles.socialSection}>
          <SocialAuthRow
            label="or Register With"
            onGooglePress={googleSignIn}
            googleDisabled={!googleReady || loading}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>You already have account? </Text>
          <Pressable onPress={() => router.push("/login")}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Login</Text>
          </Pressable>
        </View>
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
    marginBottom: spacing.xl,
  },
  formError: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  form: { width: "100%", marginBottom: spacing.md },
  submitButton: { marginTop: spacing.sm, marginBottom: spacing.lg },
  socialSection: { width: "100%", marginBottom: spacing.lg },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
  },
  footerText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm },
  footerLink: { fontFamily: fontFamily.semiBold, fontSize: fontSize.sm },
});
