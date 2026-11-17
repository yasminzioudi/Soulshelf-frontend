// app/(auth)/login.tsx
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, SocialAuthRow } from "@/src/shared/components/ui";
import { saveAuthSession } from "@/src/core/storage/tokenStorage";
import { loginApi } from "@/src/features/auth/auth.api";
import { useGoogleSignIn } from "@/src/features/auth/useGoogleSignIn";
import { useColors } from "@/src/theme";
import { fontFamily, fontSize, spacing } from "@/src/theme";
import axios from "axios";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  email?: string;
  password?: string;
  form?: string;
}

export default function LoginScreen() {
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = useCallback(() => {
    router.replace("/(tabs)/library");
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
    if (!email.trim()) {
      next.email = "This field is required.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (!password) next.password = "This field is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    if (loading) return;

    setLoading(true);
    setErrors({});

    try {
      const session = await loginApi({ email: email.trim(), password });
      await saveAuthSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
      });
      router.replace("/(tabs)/library");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverError = err.response?.data?.error as string | undefined;
        setErrors({ form: serverError ?? "Something went wrong. Please try again." });
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
        <Text style={[styles.title, { color: colors.primary }]}>Sign In</Text>

        {errors.form && (
          <Text style={[styles.formError, { color: colors.error }]}>{errors.form}</Text>
        )}

        <View style={styles.form}>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined, form: undefined })); }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            error={errors.email}
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined, form: undefined })); }}
            secureTextEntry={!showPassword}
            autoComplete="current-password"
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

        <Pressable onPress={() => router.push("/forgot-password")} style={styles.forgotWrapper}>
          <Text style={[styles.forgotLink, { color: colors.primary }]}>Forgot your password?</Text>
        </Pressable>

        <Button label="Sign In" onPress={handleLogin} loading={loading} style={styles.submitButton} />

        <View style={styles.socialSection}>
          <SocialAuthRow
            label="or Continue With"
            onGooglePress={googleSignIn}
            googleDisabled={!googleReady || loading}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>You don't have an account? </Text>
          <Pressable onPress={() => router.push("/register")}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>sign up</Text>
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
    paddingHorizontal: spacing.sm,
  },
  form: { width: "100%", marginBottom: spacing.xs },
  forgotWrapper: { alignSelf: "flex-start", marginBottom: spacing.lg },
  forgotLink: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  submitButton: { marginBottom: spacing.lg },
  socialSection: { width: "100%", marginBottom: spacing.lg },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
  },
  footerText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  footerLink: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
});
