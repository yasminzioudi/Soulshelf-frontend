// src/shared/components/ui/SocialAuthRow/SocialAuthRow.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/src/theme";
import { fontFamily, fontSize, spacing } from "@/src/theme";

const GOOGLE_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><path fill="%23EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="%234285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="%23FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="%2334A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

interface SocialButton {
  name: "logo-google" | "logo-apple" | "logo-twitter";
  label: string;
  color: string;
}

const BUTTONS: SocialButton[] = [
  { name: "logo-google", label: "Google", color: "#DB4437" },
  { name: "logo-apple", label: "Apple", color: "#000000" },
  { name: "logo-twitter", label: "Twitter", color: "#1DA1F2" },
];

interface SocialAuthRowProps {
  label?: string;
  onGooglePress?: () => void;
  googleDisabled?: boolean;
}

export function SocialAuthRow({
  label = "or Continue With",
  onGooglePress,
  googleDisabled = false,
}: SocialAuthRowProps) {
  const colors = useColors();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.row}>
        {BUTTONS.map((btn) => {
          const isGoogle = btn.name === "logo-google";
          return (
            <Pressable
              key={btn.name}
              style={({ pressed }) => [
                styles.socialButton,
                { borderColor: colors.border, backgroundColor: colors.white },
                pressed && styles.socialButtonPressed,
              ]}
              accessibilityLabel={`Sign in with ${btn.label}`}
              onPress={isGoogle ? onGooglePress : undefined}
              disabled={isGoogle ? googleDisabled : true}
            >
              {isGoogle ? (
                <Image
                  source={{ uri: GOOGLE_LOGO_SVG }}
                  style={{ width: 26, height: 26 }}
                  contentFit="contain"
                />
              ) : (
                <Ionicons name={btn.name} size={26} color={btn.color} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    width: "100%",
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  socialButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
