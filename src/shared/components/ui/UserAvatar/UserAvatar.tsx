// src/shared/components/ui/UserAvatar/UserAvatar.tsx
import { Image, type ImageContentFit } from "expo-image";
import { useEffect, useState } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { fontFamily, useColors } from "@/src/theme";

export interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  initialsStyle?: StyleProp<TextStyle>;
  contentFit?: ImageContentFit;
}

export function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 44,
  style,
  initialsStyle,
  contentFit = "cover",
}: UserAvatarProps) {
  const colors = useColors();
  const [imageError, setImageError] = useState(false);

  // Reset error fallback whenever avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const trimmedUrl = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  const isValidUrl =
    Boolean(trimmedUrl) &&
    !imageError &&
    (trimmedUrl.startsWith("http://") ||
      trimmedUrl.startsWith("https://") ||
      trimmedUrl.startsWith("data:image/") ||
      trimmedUrl.startsWith("file://"));

  const getInitials = (): string => {
    if (name && name.trim()) {
      return name.trim().charAt(0).toUpperCase();
    }
    if (email && email.trim()) {
      return email.trim().charAt(0).toUpperCase();
    }
    return "?";
  };

  const radius = size / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.primaryLight,
        },
        style,
      ]}
    >
      {isValidUrl ? (
        <Image
          source={{ uri: trimmedUrl }}
          style={{ width: size, height: size, borderRadius: radius }}
          contentFit={contentFit}
          cachePolicy="memory-disk"
          transition={100}
          onError={() => setImageError(true)}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: Math.max(11, Math.round(size * 0.4)),
              color: "#fff",
            },
            initialsStyle,
          ]}
        >
          {getInitials()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: fontFamily.bold,
  },
});
