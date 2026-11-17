// app/admin/add-book.tsx
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { useCreateAdminBook } from "@/src/features/admin/useAdmin";
import { useCurrentUser } from "@/src/features/auth/useCurrentUser";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

export default function AdminAddBookScreen() {
  const colors = useColors();
  const { user, loading: userLoading } = useCurrentUser();
  const { createBook, isCreating } = useCreateAdminBook();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("English");
  const [publishedYear, setPublishedYear] = useState(new Date().getFullYear().toString());
  const [pages, setPages] = useState("250");
  const [coverImage, setCoverImage] = useState("");
  const [coverColor, setCoverColor] = useState("#1E293B");
  const [isFeatured, setIsFeatured] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("Chapter 1: The Beginning");
  const [chapterContent, setChapterContent] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Missing Field", "Book title is required.");
      return;
    }
    if (!author.trim()) {
      Alert.alert("Missing Field", "Author name is required.");
      return;
    }
    if (!chapterContent.trim()) {
      Alert.alert("Missing Field", "Initial chapter content is required.");
      return;
    }

    try {
      const result = await createBook({
        title: title.trim(),
        author: author.trim(),
        genre: genre.trim() || undefined,
        language: language.trim() || undefined,
        pages: pages ? parseInt(pages, 10) : undefined,
        publishedYear: publishedYear ? parseInt(publishedYear, 10) : undefined,
        coverImage: coverImage.trim() || undefined,
        coverColor: coverColor.trim() || undefined,
        isFeatured,
        chapterTitle: chapterTitle.trim() || "Chapter 1",
        chapterContent: chapterContent.trim(),
      });

      Alert.alert("Success", `Book "${result.book.title}" created successfully!`, [
        {
          text: "View Book",
          onPress: () => router.replace(`/book/${result.book.id}`),
        },
        {
          text: "Back to Explore",
          onPress: () => router.replace("/(tabs)/explore"),
        },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create book.";
      Alert.alert("Error", message);
    }
  };

  if (userLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={56} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Admin Access Required</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
            Only verified administrators can access book creation.
          </Text>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary, marginTop: spacing.lg }]}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Book (Admin)</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Book Details */}
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Book Metadata</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. The Quantum Paradox"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Author Name (String) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={author}
              onChangeText={setAuthor}
              placeholder="e.g. Isaac Asimov"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Genre</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={genre}
                onChangeText={setGenre}
                placeholder="Sci-Fi, Classic..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Language</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={language}
                onChangeText={setLanguage}
                placeholder="English"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Published Year</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={publishedYear}
                onChangeText={setPublishedYear}
                keyboardType="numeric"
                placeholder="2026"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Page Count</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={pages}
                onChangeText={setPages}
                keyboardType="numeric"
                placeholder="300"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Cover Image URL (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={coverImage}
              onChangeText={setCoverImage}
              placeholder="https://..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Cover Hex Color</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={coverColor}
              onChangeText={setCoverColor}
              placeholder="#1E293B"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Featured Toggle */}
          <View style={[styles.switchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={[styles.switchTitle, { color: colors.text }]}>Featured Discovery</Text>
              <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
                Display in the Explore &quot;Featured Discoveries&quot; carousel
              </Text>
            </View>
            <Switch
              value={isFeatured}
              onValueChange={setIsFeatured}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Section: Initial Chapter */}
          <Text style={[styles.sectionHeading, { color: colors.text, marginTop: spacing.xl }]}>
            Initial Chapter
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Chapter Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={chapterTitle}
              onChangeText={setChapterTitle}
              placeholder="Chapter 1: The Beginning"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Chapter Content *</Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
              ]}
              value={chapterContent}
              onChangeText={setChapterContent}
              placeholder="Type or paste the chapter text here..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary, marginTop: spacing.xl },
              isCreating && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Publish Book &amp; Chapter</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: { width: 36 },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    textAlign: "center",
  },
  headerRightPlaceholder: { width: 36 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  sectionHeading: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  textArea: {
    minHeight: 160,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginVertical: spacing.sm,
  },
  switchTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  switchSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  primaryButton: {
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  errorTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    marginTop: spacing.md,
    textAlign: "center",
  },
  errorSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
