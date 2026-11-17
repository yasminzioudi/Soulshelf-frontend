// app/index.tsx
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/shared/components/ui";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

export default function SplashScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // 0 = background, 1 = bleu primary
  const bgAnim = useRef(new Animated.Value(0)).current;
  // 0 = hors écran (en bas), 1 = position finale
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.delay(400),
      Animated.timing(sheetAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.primary],
  });

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <View style={styles.illustrationWrapper}>
        <Image
          source={require("../src/assets/images/splash-illustration.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            paddingBottom: spacing.xl + insets.bottom,
            transform: [{ translateY: sheetTranslateY }],
            opacity: sheetAnim,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.primary }]}>SoulShelf</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Stories that live in you.</Text>
        <Button label="Get Started" onPress={() => router.push("/register")} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  illustrationWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  illustration: { width: 260, height: 260, marginTop: -180 },
  sheet: {
    borderTopLeftRadius: radius.lg * 2,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
});
