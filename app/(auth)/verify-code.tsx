// app/(auth)/verify-code.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { forgotPasswordApi, verifyResetCodeApi } from "@/src/features/auth/auth.api";
import { Button } from "@/src/shared/components/ui";
import { useColors } from "@/src/theme";
import { fontFamily, fontSize, radius, spacing } from "@/src/theme";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function VerifyCodeScreen() {
  const colors = useColors();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChange = useCallback((text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, "");

    if (cleaned.length === OTP_LENGTH) {
      const digits = cleaned.split("");
      setOtp(digits);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      return;
    }

    const digit = cleaned.slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === "Backspace") {
        if (!otp[index] && index > 0) {
          inputRefs.current[index - 1]?.focus();
          setOtp((prev) => {
            const next = [...prev];
            next[index - 1] = "";
            return next;
          });
        }
      }
    },
    [otp],
  );

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      Alert.alert("Error", `Please enter the full ${OTP_LENGTH}-digit code.`);
      return;
    }
    if (!email) {
      Alert.alert("Error", "Missing email address. Please request a new reset code.");
      return;
    }
    setLoading(true);
    try {
      const { resetToken } = await verifyResetCodeApi({ email, code });
      router.push({
        pathname: "/reset-password",
        params: { resetToken },
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      Alert.alert("Verification Failed", msg ?? "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    if (!email) {
      Alert.alert("Error", "Missing email address. Please go back and re-enter your email.");
      return;
    }
    setCooldown(RESEND_COOLDOWN);
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
    try {
      await forgotPasswordApi({ email });
      Alert.alert("Code Sent", "A new verification code has been sent.");
    } catch {
      Alert.alert("Error", "Could not resend verification code. Please try again.");
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.primary }]}>Verify Code</Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter the {OTP_LENGTH}-digit code sent to your email.
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <Pressable
              key={index}
              onPress={() => inputRefs.current[index]?.focus()}
              style={styles.otpBoxWrapper}
            >
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  {
                    borderColor: digit.length > 0 ? colors.primary : colors.border,
                    backgroundColor: digit.length > 0 ? colors.white : colors.surface,
                    color: colors.text,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                selectTextOnFocus
                textAlign="center"
                accessible
                accessibilityLabel={`Digit ${index + 1} of ${OTP_LENGTH}`}
              />
            </Pressable>
          ))}
        </View>

        <Button
          label="Verify"
          onPress={handleVerify}
          loading={loading}
          style={styles.submitButton}
        />

        <View style={styles.resendRow}>
          <Text style={[styles.resendText, { color: colors.textSecondary }]}>Didn't receive the code? </Text>
          <Pressable onPress={handleResend} disabled={cooldown > 0}>
            <Text
              style={[
                styles.resendLink,
                { color: cooldown > 0 ? colors.textSecondary : colors.primary },
              ]}
            >
              {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
            </Text>
          </Pressable>
        </View>

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
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
    width: "100%",
  },
  otpBoxWrapper: { justifyContent: "center", alignItems: "center" },
  otpInput: {
    width: 46,
    height: 54,
    borderWidth: 1.5,
    borderRadius: radius.md,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
    textAlign: "center",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  submitButton: { marginBottom: spacing.lg, width: "100%" },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  resendText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm },
  resendLink: { fontFamily: fontFamily.semiBold, fontSize: fontSize.sm },
  backWrapper: { marginTop: spacing.sm, paddingVertical: spacing.sm },
  backLink: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
