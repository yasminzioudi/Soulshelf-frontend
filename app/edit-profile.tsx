// app/edit-profile.tsx
import { Button, Input } from "@/src/shared/components/ui";
import { fontFamily, fontSize, spacing, useColors } from "@/src/theme";
import { getMeApi, updateMeApi } from "@/src/features/auth/auth.api";
import {
  getAccessToken,
  saveUser,
} from "@/src/core/storage/tokenStorage";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";

interface FormErrors {
  name?: string;
  occupation?: string;
  bio?: string;
  form?: string;
}

export default function EditProfileScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [originalOccupation, setOriginalOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [originalBio, setOriginalBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ── Load fresh user data from the DB ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const user = await getMeApi(token);
        if (cancelled) return;
        setName(user.name ?? "");
        setOriginalName(user.name ?? "");
        setOccupation(user.occupation ?? "");
        setOriginalOccupation(user.occupation ?? "");
        setBio(user.bio ?? "");
        setOriginalBio(user.bio ?? "");
        if (user.avatarUrl) {
          setAvatarUri(user.avatarUrl);
          setOriginalAvatarUrl(user.avatarUrl);
        }
      } catch {
        // Silent fallback — form starts empty
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  // ── Image picker ─────────────────────────────────────────────────────────
  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setErrors((e) => ({ ...e, form: "Permission to access photos is required." }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],       // square crop
      quality: 0.7,          // compress a bit
      base64: true,          // we send it as a data URI
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset?.base64) {
      setErrors((e) => ({ ...e, form: "Could not read the image. Please try another." }));
      return;
    }

    const mimeType = asset.mimeType ?? "image/jpeg";
    const dataUri = `data:${mimeType};base64,${asset.base64}`;
    setAvatarUri(dataUri);
    setAvatarChanged(true);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const next: FormErrors = {};
    if (name.trim().length > 100) {
      next.name = "Name must be at most 100 characters.";
    }
    if (occupation.trim().length > 100) {
      next.occupation = "Occupation must be at most 100 characters.";
    }
    if (bio.trim().length > 500) {
      next.bio = "Bio must be at most 500 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    if (saving) return;

    setSaving(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setErrors({ form: "You are not authenticated. Please sign in again." });
        return;
      }

      const payload: { name?: string; avatarUrl?: string; occupation?: string; bio?: string } = {};

      const trimmedName = name.trim();
      if (trimmedName !== originalName) payload.name = trimmedName || undefined;
      const trimmedOccupation = occupation.trim();
      if (trimmedOccupation !== originalOccupation) payload.occupation = trimmedOccupation || undefined;
      const trimmedBio = bio.trim();
      if (trimmedBio !== originalBio) payload.bio = trimmedBio || undefined;

      if (avatarChanged && avatarUri && avatarUri !== originalAvatarUrl) {
        payload.avatarUrl = avatarUri;
      }

      if (Object.keys(payload).length === 0) {
        router.back();
        return;
      }

      const updatedUser = await updateMeApi(payload, accessToken);
      await saveUser(updatedUser);

      // Synchronize React Query cache immediately
      queryClient.setQueryData(["currentUser"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["users", updatedUser.id, "profile"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => router.back(), 800);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const serverError = err.response?.data?.error as string | undefined;
        if (err.response?.status === 401) {
          setErrors({ form: "Session expired. Please sign in again." });
        } else {
          setErrors({ form: serverError ?? "Something went wrong. Please try again." });
        }
      } else {
        setErrors({ form: "Network error. Check your connection and try again." });
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Initials fallback ─────────────────────────────────────────────────────
  const initials = name.trim() ? name.trim()[0].toUpperCase() : "?";

  if (loadingProfile) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Edit profile</Text>

        {/* Avatar picker */}
        <Pressable style={styles.avatarWrapper} onPress={pickAvatar}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }]}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}
          <View style={[styles.cameraOverlay, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </View>
        </Pressable>
        <Text style={[styles.changePhotoHint, { color: colors.textSecondary }]}>Tap to change photo</Text>

        {/* Success / error banners */}
        {successMessage ? (
          <Text style={styles.successMessage}>{successMessage}</Text>
        ) : null}
        {errors.form ? (
          <Text style={[styles.formError, { color: colors.error }]}>{errors.form}</Text>
        ) : null}

        {/* Fields */}
        <Input
          label="Name"
          value={name}
          onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
          placeholder="Your name"
          error={errors.name}
        />

        <Input
          label="Occupation"
          value={occupation}
          onChangeText={(t) => { setOccupation(t); setErrors((e) => ({ ...e, occupation: undefined })); }}
          placeholder="Your occupation"
          error={errors.occupation}
        />

        <Input
          label="Bio"
          value={bio}
          onChangeText={(t) => { setBio(t); setErrors((e) => ({ ...e, bio: undefined })); }}
          placeholder="Write a brief bio..."
          error={errors.bio}
          multiline
          numberOfLines={3}
        />

        <Button label="Save changes" onPress={handleSave} loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: "center",
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    marginBottom: spacing.xl,
    alignSelf: "flex-start",
  },
  avatarWrapper: { position: "relative", marginBottom: spacing.xs },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: "hidden",
  },
  initials: {
    color: "#FFFFFF",
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  changePhotoHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginBottom: spacing.xl,
  },
  successMessage: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: "#0a7c42",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  formError: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
