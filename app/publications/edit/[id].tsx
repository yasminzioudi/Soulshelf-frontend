// app/publications/edit/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, Stack, useLocalSearchParams } from "expo-router";
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

import { getUser, StoredUser } from "@/src/core/storage/tokenStorage";
import {
  usePublication,
  useUpdatePublication,
} from "@/src/features/publications/usePublications";
import { Button, Input } from "@/src/shared/components/ui";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

interface FormErrors {
  title?: string;
  genre?: string;
  publishedYear?: string;
  pages?: string;
  form?: string;
}

export default function EditPublicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const pubId = Number(id);
  const isValidId = !isNaN(pubId) && pubId > 0;

  const { publication, isLoading, isError, error } = usePublication(isValidId ? pubId : 0);
  const { updatePublication, isUpdating } = useUpdatePublication();

  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("English");
  const [publishedYear, setPublishedYear] = useState("");
  const [pages, setPages] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [content, setContent] = useState("");

  const [isInitialized, setIsInitialized] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    let cancelled = false;
    const fetchUser = async () => {
      const user = await getUser();
      if (!cancelled) {
        setCurrentUser(user);
      }
    };
    void fetchUser();
    return () => {
      cancelled = true;
    };
  }, []);

  // Pre-populate fields once publication data is fetched
  useEffect(() => {
    if (publication && !isInitialized) {
      setTitle(publication.title ?? "");
      setGenre(publication.genre ?? "");
      setDescription(publication.description ?? "");
      setLanguage(publication.language ?? "English");
      setPublishedYear(publication.publishedYear ? String(publication.publishedYear) : "");
      setPages(publication.pages ? String(publication.pages) : "");
      setCoverUrl(publication.coverUrl ?? "");
      setContent(publication.content ?? "");
      setIsInitialized(true);
    }
  }, [publication, isInitialized]);

  const isOwner = Boolean(
    publication && currentUser && publication.authorId === currentUser.id,
  );

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

  const handleUpdate = async () => {
    if (!validate() || isUpdating) return;

    setErrors({});
    try {
      await updatePublication({
        id: pubId,
        payload: {
          title: title.trim(),
          genre: genre.trim(),
          description: description.trim() ? description.trim() : null,
          language: language.trim() ? language.trim() : "English",
          publishedYear: publishedYear.trim() ? parseInt(publishedYear.trim(), 10) : null,
          pages: pages.trim() ? parseInt(pages.trim(), 10) : null,
          coverUrl: coverUrl.trim() ? coverUrl.trim() : null,
          content: content.trim() ? content.trim() : null,
        },
      });

      router.replace(`/publications/${pubId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update publication.";
      setErrors({ form: msg });
    }
  };

  if (!isValidId || (publication && currentUser && !isOwner)) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.error} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>Unauthorized Action</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            You do not have permission to edit this publication.
          </Text>
          <Button label="Go Back" onPress={() => router.back()} style={styles.backBtn} />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !isInitialized) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Loading publication data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !publication) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>Error</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {error instanceof Error ? error.message : "Failed to load publication."}
          </Text>
          <Button label="Go Back" onPress={() => router.back()} style={styles.backBtn} />
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
        {/* Header Navigation */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Publication</Text>
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
          label="Save Changes"
          onPress={handleUpdate}
          loading={isUpdating}
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  stateTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    textAlign: "center",
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  backBtn: {
    marginTop: spacing.sm,
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
