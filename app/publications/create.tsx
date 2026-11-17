// app/publications/create.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCreatePublication } from "@/src/features/publications/usePublications";
import { Button, Input } from "@/src/shared/components/ui";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

interface FormErrors {
  title?: string;
  genre?: string;
  publishedYear?: string;
  pages?: string;
  form?: string;
}

export default function CreatePublicationScreen() {
  const colors = useColors();
  const { createPublication, isCreating } = useCreatePublication();

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("English");
  const [publishedYear, setPublishedYear] = useState("");
  const [pages, setPages] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [content, setContent] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  const pickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setErrors((e) => ({ ...e, form: "Permission to access photos is required." }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset?.base64) {
      setErrors((e) => ({ ...e, form: "Could not read image." }));
      return;
    }

    const mimeType = asset.mimeType ?? "image/jpeg";
    const dataUri = `data:${mimeType};base64,${asset.base64}`;
    setCoverUrl(dataUri);
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!title.trim()) {
      next.title = "Title is required.";
    }
    if (!genre.trim()) {
      next.genre = "Genre is required.";
    }
    if (publishedYear.trim()) {
      const year = parseInt(publishedYear.trim(), 10);
      if (isNaN(year) || year < 1000 || year > 2100) {
        next.publishedYear = "Please enter a valid year.";
      }
    }
    if (pages.trim()) {
      const p = parseInt(pages.trim(), 10);
      if (isNaN(p) || p <= 0) {
        next.pages = "Pages must be a positive integer.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCreate = async () => {
    if (!validate() || isCreating) return;

    setErrors({});
    try {
      const created = await createPublication({
        title: title.trim(),
        genre: genre.trim(),
        description: description.trim() ? description.trim() : undefined,
        language: language.trim() ? language.trim() : undefined,
        publishedYear: publishedYear.trim() ? parseInt(publishedYear.trim(), 10) : undefined,
        pages: pages.trim() ? parseInt(pages.trim(), 10) : undefined,
        coverUrl: coverUrl.trim() ? coverUrl.trim() : undefined,
        content: content.trim() ? content.trim() : undefined,
      });

      // Navigate directly to the newly created publication detail view
      router.replace(`/publications/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create publication.";
      setErrors({ form: msg });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Navigation */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Publication</Text>
          <View style={styles.placeholder} />
        </View>

        {errors.form && (
          <View style={[styles.errorBanner, { backgroundColor: colors.surface }]}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
            <Text style={[styles.errorBannerText, { color: colors.error }]}>{errors.form}</Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Title *</Text>
          <Input
            placeholder="Publication Title"
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              setErrors((e) => ({ ...e, title: undefined }));
            }}
            error={errors.title}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Genre *</Text>
          <Input
            placeholder="Genre (e.g. Fiction, Sci-Fi, Poetry)"
            value={genre}
            onChangeText={(t) => {
              setGenre(t);
              setErrors((e) => ({ ...e, genre: undefined }));
            }}
            error={errors.genre}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Description</Text>
          <Input
            placeholder="Brief summary or description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Language</Text>
            <Input
              placeholder="English"
              value={language}
              onChangeText={setLanguage}
            />
          </View>

          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Published Year</Text>
            <Input
              placeholder="e.g. 2026"
              value={publishedYear}
              onChangeText={(t) => {
                setPublishedYear(t);
                setErrors((e) => ({ ...e, publishedYear: undefined }));
              }}
              keyboardType="number-pad"
              error={errors.publishedYear}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Pages</Text>
            <Input
              placeholder="e.g. 150"
              value={pages}
              onChangeText={(t) => {
                setPages(t);
                setErrors((e) => ({ ...e, pages: undefined }));
              }}
              keyboardType="number-pad"
              error={errors.pages}
            />
          </View>

          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Cover Image</Text>
            <View style={styles.coverPickerWrapper}>
              {coverUrl ? (
                <View style={styles.coverPreviewBox}>
                  <Image source={{ uri: coverUrl }} style={styles.coverPreviewImage} contentFit="cover" />
                  <Pressable onPress={() => setCoverUrl("")} style={styles.removeBadge} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </Pressable>
                </View>
              ) : null}
              <Pressable
                style={[styles.pickButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={pickCoverImage}
              >
                <Ionicons name="camera-outline" size={18} color={colors.primary} />
                <Text style={[styles.pickText, { color: colors.primary }]}>
                  {coverUrl ? "Change" : "Select Photo"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Content / Story Text</Text>
          <Input
            placeholder="Write or paste your publication text here..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={8}
            style={styles.largeTextArea}
          />
        </View>

        <Button
          label="Publish Publication"
          onPress={handleCreate}
          loading={isCreating}
          style={styles.submitButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
  },
  placeholder: {
    width: 24,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  formGroup: {
    marginBottom: spacing.md,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  largeTextArea: {
    minHeight: 180,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: spacing.md,
  },
  coverPickerWrapper: {
    gap: spacing.xs,
  },
  coverPreviewBox: {
    position: "relative",
    width: 60,
    height: 80,
    borderRadius: 4,
    overflow: "hidden",
  },
  coverPreviewImage: {
    width: 60,
    height: 80,
    borderRadius: 4,
  },
  removeBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
  },
  pickButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
  },
  pickText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
});
