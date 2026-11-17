// src/shared/components/ui/BookCover/BookCover.tsx
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/src/theme";
import { fontFamily, fontSize, radius, spacing } from "@/src/theme";

interface BookCoverProps {
  title: string;
  genre?: string | null;
  author?: string | null;
  color?: string | null;
  coverImage?: string | null;
  width?: number | string;
  hideMeta?: boolean;
  onPress?: () => void;
}

export function BookCover({
  title,
  genre,
  author,
  color,
  coverImage,
  width,
  hideMeta = false,
  onPress,
}: BookCoverProps) {
  const colors = useColors();
  const coverColor = color ?? colors.primary;
  const hasImage = Boolean(coverImage && coverImage.trim().length > 0);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.wrapper,
        width ? (typeof width === "number" ? { width } : { width: width as any }) : styles.flex,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}${author ? `, by ${author}` : ""}${genre ? `, ${genre}` : ""}`}
    >
      <View style={[styles.cover, { backgroundColor: coverColor }]}>
        {hasImage ? (
          <Image
            source={{ uri: coverImage! }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Text style={[styles.coverTitle, { color: colors.white }]} numberOfLines={3}>
            {title}
          </Text>
        )}
      </View>

      {!hideMeta && (
        <View style={styles.metaBlock}>
          {hasImage ? (
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
              {title}
            </Text>
          ) : null}

          {author ? (
            <Text style={[styles.author, { color: colors.textSecondary }]} numberOfLines={1}>
              {author}
            </Text>
          ) : null}

          {genre ? (
            <Text style={[styles.genre, { color: colors.textSecondary }]} numberOfLines={1}>
              {genre}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  cover: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: radius.md,
  },
  coverTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    textAlign: "center",
    lineHeight: 16,
  },
  metaBlock: {
    alignItems: "center",
    width: "100%",
    gap: 2,
  },
  cardTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    textAlign: "center",
    lineHeight: 16,
  },
  author: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    textAlign: "center",
  },
  genre: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    textAlign: "center",
    opacity: 0.8,
  },
});
