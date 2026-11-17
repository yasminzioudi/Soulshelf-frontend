// src/shared/components/ui/AvatarWithLabel/AvatarWithLabel.tsx
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/src/theme";
import { fontFamily, fontSize, spacing } from "@/src/theme";

interface AvatarWithLabelProps {
  initials?: string;
  color?: string;
  name?: string;
  size?: number;
}

export function AvatarWithLabel({
  initials = "?",
  color,
  name,
  size = 64,
}: AvatarWithLabelProps) {
  const colors = useColors();
  const bgColor = color ?? colors.primary;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
          },
        ]}
      >
        <Text style={[styles.initials, { fontSize: size * 0.35, color: colors.white }]}>
          {initials}
        </Text>
      </View>
      {name ? (
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: spacing.xs,
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: fontFamily.semiBold,
  },
  name: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    textAlign: "center",
    maxWidth: 80,
  },
});
