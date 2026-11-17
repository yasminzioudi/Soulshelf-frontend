import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  DEFAULT_READER_SETTINGS,
  getReaderSettings,
  ReaderSettings,
  saveReaderSettings,
} from "@/src/core/storage/readerSettings";
import { useBookDetails } from "@/src/features/books/useBooks";
import { useFavorites } from "@/src/features/favorites/useFavorites";
import { useReader } from "@/src/features/reader/useReader";
import { useVoiceReader } from "@/src/features/reader/useVoiceReader";
import { useAIAssistant } from "@/src/features/ai/useAI";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const bookId = Number(id);
  const isValidId = !isNaN(bookId) && bookId > 0;

  const { book, isLoading: isBookLoading, isError: isBookError, error: bookError } = useBookDetails(
    isValidId ? bookId : 0,
  );

  const {
    chapters,
    isChaptersLoading,
    isChaptersError,
    chaptersError,
    refetchChapters,
    savedChapterNum,
    isProgressLoading,
    saveProgress,
  } = useReader(isValidId ? bookId : 0);

  const { speechState, isSpeaking, isPaused, isIdle, play, pause, resume, stop } = useVoiceReader();

  const { favorites, addFavorite, removeFavorite, isAddingFavorite, isRemovingFavorite } =
    useFavorites();
  const isFavorited = useMemo(
    () => favorites.some((f) => f.bookId === bookId),
    [favorites, bookId],
  );

  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // AI Assistant state
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiAction, setAiAction] = useState<"summarize" | "explain" | "simplify" | "ask">("summarize");
  const [aiQuestion, setAiQuestion] = useState("");
  const {
    executeAction,
    assistantData,
    isLoading: isAILoading,
    isError: isAIError,
    error: aiError,
    reset: resetAI,
  } = useAIAssistant();

  // Load persisted reader typography settings
  useEffect(() => {
    let cancelled = false;
    getReaderSettings().then((settings) => {
      if (!cancelled) {
        setReaderSettings(settings);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdateSetting = <K extends keyof ReaderSettings>(
    key: K,
    value: ReaderSettings[K],
  ) => {
    const updated = { ...readerSettings, [key]: value };
    setReaderSettings(updated);
    void saveReaderSettings({ [key]: value });
  };

  const handleToggleFavorite = async () => {
    if (!isValidId) return;
    try {
      if (isFavorited) {
        await removeFavorite(bookId);
      } else {
        await addFavorite(bookId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update favorites.";
      Alert.alert("Favorite Error", msg);
    }
  };

  // Reader Themes
  const readerThemeColors = useMemo(() => {
    switch (readerSettings.theme) {
      case "light":
        return {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          text: "#0F172A",
          subtext: "#64748B",
          border: "#E2E8F0",
        };
      case "sepia":
        return {
          bg: "#F4ECD8",
          card: "#FAF4E8",
          text: "#433422",
          subtext: "#786550",
          border: "#EADDC6",
        };
      case "dark":
      default:
        return {
          bg: "#0B1120",
          card: "#1E293B",
          text: "#F8FAFC",
          subtext: "#94A3B8",
          border: "#334155",
        };
    }
  }, [readerSettings.theme]);

  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [hasInitializedProgress, setHasInitializedProgress] = useState(false);

  // Restore saved chapter position when chapters and savedProgress load
  useEffect(() => {
    if (chapters.length > 0 && !isProgressLoading && !hasInitializedProgress) {
      const targetIndex = chapters.findIndex((c) => c.chapterNum === savedChapterNum);
      if (targetIndex !== -1) {
        setCurrentChapterIndex(targetIndex);
      } else {
        setCurrentChapterIndex(0);
      }
      setHasInitializedProgress(true);
    }
  }, [chapters, savedChapterNum, isProgressLoading, hasInitializedProgress]);

  // Stop voice playback whenever chapter changes
  useEffect(() => {
    stop();
  }, [currentChapterIndex, stop]);

  const currentChapter = chapters[currentChapterIndex];
  const totalChapters = chapters.length;

  // Split chapter into readable paragraphs
  const paragraphs = useMemo(() => {
    if (!currentChapter?.content) return [];
    return currentChapter.content
      .split(/\r?\n\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [currentChapter?.content]);

  const isFirstChapter = currentChapterIndex <= 0;
  const isLastChapter = currentChapterIndex >= totalChapters - 1;

  const handlePrevChapter = async () => {
    if (isFirstChapter) return;
    await stop();
    const newIndex = currentChapterIndex - 1;
    setCurrentChapterIndex(newIndex);
    const newChapterNum = chapters[newIndex]?.chapterNum;
    if (newChapterNum) {
      try {
        await saveProgress(newChapterNum);
      } catch {
        // Silently handle error
      }
    }
  };

  const handleNextChapter = async () => {
    if (isLastChapter) return;
    await stop();
    const newIndex = currentChapterIndex + 1;
    setCurrentChapterIndex(newIndex);
    const newChapterNum = chapters[newIndex]?.chapterNum;
    if (newChapterNum) {
      try {
        await saveProgress(newChapterNum);
      } catch {
        // Silently handle error
      }
    }
  };

  const handleBack = async () => {
    await stop();
    router.back();
  };

  const renderContent = () => {
    if (!isValidId || isBookError) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>Book Not Found</Text>
          <Text style={[styles.stateSubtitle, { color: colors.textSecondary }]}>
            {bookError instanceof Error ? bookError.message : "Invalid book ID."}
          </Text>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleBack}
          >
            <Text style={styles.actionButtonText}>Go Back</Text>
          </Pressable>
        </View>
      );
    }

    if (isBookLoading || isChaptersLoading || isProgressLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading reader content...
          </Text>
        </View>
      );
    }

    if (isChaptersError) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>Unable to load content</Text>
          <Text style={[styles.stateSubtitle, { color: colors.textSecondary }]}>
            {chaptersError instanceof Error ? chaptersError.message : "Failed to load chapters."}
          </Text>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => refetchChapters()}
          >
            <Text style={styles.actionButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (chapters.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="book-outline" size={56} color={colors.textSecondary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>No Content Available</Text>
          <Text style={[styles.stateSubtitle, { color: colors.textSecondary }]}>
            No readable chapters are currently available for this book.
          </Text>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleBack}
          >
            <Text style={styles.actionButtonText}>Back to Book</Text>
          </Pressable>
        </View>
      );
    }

    const progressPercentage = Math.round(((currentChapterIndex + 1) / totalChapters) * 100);

    return (
      <>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Voice Reader Controls Bar */}
          <View style={[styles.voiceBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.voiceBarHeader}>
              <View style={styles.voiceTitleRow}>
                <Ionicons name="volume-medium-outline" size={20} color={colors.primary} />
                <Text style={[styles.voiceTitle, { color: colors.text }]}>Voice Reader</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      speechState === "speaking"
                        ? colors.primary + "20"
                        : speechState === "paused"
                        ? "#E6A23C20"
                        : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        speechState === "speaking"
                          ? colors.primary
                          : speechState === "paused"
                          ? "#E6A23C"
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {speechState === "speaking" ? "Speaking" : speechState === "paused" ? "Paused" : "Idle"}
                </Text>
              </View>
            </View>

            <View style={styles.voiceControlsRow}>
              <Pressable
                style={[
                  styles.voiceButton,
                  { backgroundColor: isSpeaking ? colors.primary + "20" : colors.primary },
                ]}
                onPress={() => play(currentChapter.content)}
              >
                <Ionicons name="play" size={16} color={isSpeaking ? colors.primary : "#FFFFFF"} />
                <Text style={[styles.voiceButtonText, { color: isSpeaking ? colors.primary : "#FFFFFF" }]}>
                  Play
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.voiceButtonOutline,
                  { borderColor: colors.border },
                  !isSpeaking && styles.disabledVoiceButton,
                ]}
                onPress={pause}
                disabled={!isSpeaking}
              >
                <Ionicons
                  name="pause"
                  size={16}
                  color={!isSpeaking ? colors.textSecondary : colors.text}
                />
                <Text
                  style={[
                    styles.voiceButtonOutlineText,
                    { color: !isSpeaking ? colors.textSecondary : colors.text },
                  ]}
                >
                  Pause
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.voiceButtonOutline,
                  { borderColor: colors.border },
                  !isPaused && styles.disabledVoiceButton,
                ]}
                onPress={resume}
                disabled={!isPaused}
              >
                <Ionicons
                  name="play-forward"
                  size={16}
                  color={!isPaused ? colors.textSecondary : colors.text}
                />
                <Text
                  style={[
                    styles.voiceButtonOutlineText,
                    { color: !isPaused ? colors.textSecondary : colors.text },
                  ]}
                >
                  Resume
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.voiceButtonOutline,
                  { borderColor: colors.border },
                  isIdle && styles.disabledVoiceButton,
                ]}
                onPress={stop}
                disabled={isIdle}
              >
                <Ionicons
                  name="stop"
                  size={16}
                  color={isIdle ? colors.textSecondary : "#E53935"}
                />
                <Text
                  style={[
                    styles.voiceButtonOutlineText,
                    { color: isIdle ? colors.textSecondary : "#E53935" },
                  ]}
                >
                  Stop
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Chapter Content Card with typography & theme styling */}
          <View
            style={[
              styles.textCard,
              {
                backgroundColor: readerThemeColors.card,
                borderColor: readerThemeColors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={[
                styles.chapterTitle,
                {
                  color: readerThemeColors.text,
                  fontFamily:
                    readerSettings.fontFamily === "serif"
                      ? "serif"
                      : readerSettings.fontFamily === "monospace"
                      ? "monospace"
                      : fontFamily.bold,
                },
              ]}
            >
              {currentChapter.title}
            </Text>

            {paragraphs.length > 0 ? (
              paragraphs.map((para, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.bodyText,
                    {
                      color: readerThemeColors.text,
                      fontSize: readerSettings.fontSize,
                      lineHeight: Math.round(readerSettings.fontSize * readerSettings.lineHeight),
                      fontFamily:
                        readerSettings.fontFamily === "serif"
                          ? "serif"
                          : readerSettings.fontFamily === "monospace"
                          ? "monospace"
                          : fontFamily.regular,
                      marginBottom: spacing.md,
                    },
                  ]}
                >
                  {para}
                </Text>
              ))
            ) : (
              <Text
                style={[
                  styles.bodyText,
                  {
                    color: readerThemeColors.text,
                    fontSize: readerSettings.fontSize,
                    lineHeight: Math.round(readerSettings.fontSize * readerSettings.lineHeight),
                    fontFamily:
                      readerSettings.fontFamily === "serif"
                        ? "serif"
                        : readerSettings.fontFamily === "monospace"
                        ? "monospace"
                        : fontFamily.regular,
                  },
                ]}
              >
                {currentChapter.content}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Footer Navigation Bar */}
        <View style={[styles.footerBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            style={[
              styles.navButton,
              isFirstChapter && styles.disabledButton,
            ]}
            onPress={handlePrevChapter}
            disabled={isFirstChapter}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={isFirstChapter ? colors.textSecondary : colors.primary}
            />
            <Text
              style={[
                styles.navButtonText,
                { color: isFirstChapter ? colors.textSecondary : colors.primary },
              ]}
            >
              Previous
            </Text>
          </Pressable>

          <View style={styles.progressBlock}>
            <Text style={[styles.progressText, { color: colors.text }]}>
              Chapter {currentChapterIndex + 1} of {totalChapters}
            </Text>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { backgroundColor: colors.primary, width: `${progressPercentage}%` },
                ]}
              />
            </View>
          </View>

          <Pressable
            style={[
              styles.navButton,
              isLastChapter && styles.disabledButton,
            ]}
            onPress={handleNextChapter}
            disabled={isLastChapter}
          >
            <Text
              style={[
                styles.navButtonText,
                { color: isLastChapter ? colors.textSecondary : colors.primary },
              ]}
            >
              Next
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isLastChapter ? colors.textSecondary : colors.primary}
            />
          </Pressable>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header with Favorite & Typography buttons */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {book?.title ?? "Reader"}
        </Text>
        <View style={styles.headerIcons}>
          {/* AI Assistant Button */}
          <Pressable
            onPress={() => setIsAIOpen(true)}
            hitSlop={8}
            style={styles.headerIconButton}
            accessibilityLabel="AI Reading Assistant"
          >
            <Ionicons name="sparkles" size={20} color="#FFD700" />
          </Pressable>

          {/* Typography Settings Button */}
          <Pressable
            onPress={() => setIsSettingsOpen(true)}
            hitSlop={8}
            style={styles.headerIconButton}
            accessibilityLabel="Reader Typography Settings"
          >
            <Ionicons name="text-outline" size={20} color="#FFFFFF" />
          </Pressable>

          {/* Favorite Toggle Button */}
          <Pressable
            onPress={handleToggleFavorite}
            hitSlop={8}
            style={styles.headerIconButton}
            disabled={isAddingFavorite || isRemovingFavorite}
            accessibilityLabel={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
          >
            {isAddingFavorite || isRemovingFavorite ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={isFavorited ? "heart" : "heart-outline"}
                size={22}
                color={isFavorited ? "#FF4B6E" : "#FFFFFF"}
              />
            )}
          </Pressable>
        </View>
      </View>

      {renderContent()}

      {/* Reader Typography / Settings Modal */}
      <Modal
        visible={isSettingsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSettingsOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsSettingsOpen(false)}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Reader Typography &amp; Display
              </Text>
              <Pressable onPress={() => setIsSettingsOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Font Size */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
                Font Size ({readerSettings.fontSize}px)
              </Text>
              <View style={styles.buttonGroup}>
                {[14, 16, 18, 20, 24].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.chipButton,
                      { borderColor: colors.border },
                      readerSettings.fontSize === size && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => handleUpdateSetting("fontSize", size)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.text },
                        readerSettings.fontSize === size && { color: "#FFFFFF" },
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Font Family */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
                Typeface
              </Text>
              <View style={styles.buttonGroup}>
                {(
                  [
                    { key: "serif", label: "Serif" },
                    { key: "sans-serif", label: "Sans" },
                    { key: "monospace", label: "Mono" },
                  ] as const
                ).map((font) => (
                  <TouchableOpacity
                    key={font.key}
                    style={[
                      styles.chipButton,
                      { flex: 1, borderColor: colors.border },
                      readerSettings.fontFamily === font.key && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => handleUpdateSetting("fontFamily", font.key)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.text },
                        readerSettings.fontFamily === font.key && { color: "#FFFFFF" },
                      ]}
                    >
                      {font.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Line Height */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
                Line Spacing
              </Text>
              <View style={styles.buttonGroup}>
                {(
                  [
                    { value: 1.4, label: "Compact" },
                    { value: 1.7, label: "Normal" },
                    { value: 2.0, label: "Relaxed" },
                  ] as const
                ).map((spacingOpt) => (
                  <TouchableOpacity
                    key={spacingOpt.value}
                    style={[
                      styles.chipButton,
                      { flex: 1, borderColor: colors.border },
                      readerSettings.lineHeight === spacingOpt.value && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => handleUpdateSetting("lineHeight", spacingOpt.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.text },
                        readerSettings.lineHeight === spacingOpt.value && { color: "#FFFFFF" },
                      ]}
                    >
                      {spacingOpt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reading Mode Theme */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
                Theme
              </Text>
              <View style={styles.buttonGroup}>
                {(
                  [
                    { key: "dark", label: "Dark", bg: "#1E293B", text: "#F8FAFC" },
                    { key: "light", label: "Light", bg: "#F1F5F9", text: "#0F172A" },
                    { key: "sepia", label: "Sepia", bg: "#FAF4E8", text: "#433422" },
                  ] as const
                ).map((themeOpt) => (
                  <TouchableOpacity
                    key={themeOpt.key}
                    style={[
                      styles.themeChip,
                      {
                        backgroundColor: themeOpt.bg,
                        borderColor:
                          readerSettings.theme === themeOpt.key
                            ? colors.primary
                            : colors.border,
                        borderWidth: readerSettings.theme === themeOpt.key ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleUpdateSetting("theme", themeOpt.key)}
                  >
                    <Text
                      style={[
                        styles.themeChipText,
                        {
                          color: themeOpt.text,
                          fontWeight:
                            readerSettings.theme === themeOpt.key ? "700" : "500",
                        },
                      ]}
                    >
                      {themeOpt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* AI Reading Assistant Modal */}
      <Modal
        visible={isAIOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAIOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsAIOpen(false)}
        >
          <Pressable
            style={[styles.aiModalSheet, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.aiTitleRow}>
                <Ionicons name="sparkles" size={20} color="#FFD700" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  AI Reading Assistant
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setIsAIOpen(false);
                  resetAI();
                }}
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {currentChapter && (
              <Text style={[styles.aiChapterSubtitle, { color: colors.textSecondary }]}>
                Analyzing: {currentChapter.title}
              </Text>
            )}

            {/* Action selector tabs */}
            <View style={styles.aiActionTabs}>
              {(
                [
                  { key: "summarize", label: "Summarize", icon: "document-text-outline" },
                  { key: "explain", label: "Explain", icon: "bulb-outline" },
                  { key: "simplify", label: "Simplify", icon: "reader-outline" },
                  { key: "ask", label: "Ask Question", icon: "help-circle-outline" },
                ] as const
              ).map((tab) => {
                const active = aiAction === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.aiActionTab,
                      { borderColor: active ? colors.primary : colors.border },
                      active && { backgroundColor: colors.primary + "15" },
                    ]}
                    onPress={() => setAiAction(tab.key)}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      size={14}
                      color={active ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.aiActionTabText,
                        { color: active ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Question input if action is 'ask' */}
            {aiAction === "ask" && (
              <View style={styles.aiQuestionBox}>
                <TextInput
                  style={[
                    styles.aiQuestionInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  value={aiQuestion}
                  onChangeText={setAiQuestion}
                  placeholder="Ask a question about this chapter..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </View>
            )}

            {/* Run button */}
            <TouchableOpacity
              style={[
                styles.aiRunBtn,
                { backgroundColor: colors.primary },
                isAILoading && { opacity: 0.7 },
              ]}
              disabled={isAILoading || (aiAction === "ask" && !aiQuestion.trim())}
              onPress={() => {
                executeAction({
                  action: aiAction,
                  chapterId: currentChapter?.id,
                  bookId: bookId,
                  question: aiAction === "ask" ? aiQuestion.trim() : undefined,
                });
              }}
            >
              {isAILoading ? (
                <View style={styles.aiBtnLoadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.aiRunBtnText}>Gemini is analyzing...</Text>
                </View>
              ) : (
                <View style={styles.aiBtnLoadingRow}>
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  <Text style={styles.aiRunBtnText}>
                    {aiAction === "summarize"
                      ? "Summarize Chapter"
                      : aiAction === "explain"
                      ? "Explain Themes & Meaning"
                      : aiAction === "simplify"
                      ? "Simplify Language"
                      : "Answer Question"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* AI Error */}
            {isAIError && (
              <View style={[styles.aiErrorBox, { backgroundColor: "#FF4B6E15", borderColor: "#FF4B6E40" }]}>
                <Ionicons name="alert-circle-outline" size={18} color="#FF4B6E" />
                <Text style={styles.aiErrorText}>
                  {aiError instanceof Error ? aiError.message : "AI service unavailable."}
                </Text>
              </View>
            )}

            {/* AI Result Card */}
            {assistantData && (
              <ScrollView style={styles.aiResultScroll} showsVerticalScrollIndicator={false}>
                <View
                  style={[
                    styles.aiResultCard,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.aiResultHeader}>
                    <Ionicons name="sparkles" size={16} color="#FFD700" />
                    <Text style={[styles.aiResultBadge, { color: colors.primary }]}>
                      Gemini Analysis
                    </Text>
                  </View>
                  <Text style={[styles.aiResponseText, { color: colors.text }]}>
                    {assistantData.response}
                  </Text>
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  },
  headerTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    marginHorizontal: spacing.sm,
  },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  scrollContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  voiceBar: {
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  voiceBarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voiceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  voiceTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  voiceControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  voiceButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
  },
  voiceButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  voiceButtonOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  voiceButtonOutlineText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  disabledVoiceButton: {
    opacity: 0.4,
  },
  textCard: {
    borderRadius: radius.md,
    padding: spacing.xl,
    minHeight: 300,
  },
  chapterTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    marginBottom: spacing.md,
  },
  bodyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: 26,
  },
  footerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  disabledButton: {
    opacity: 0.4,
  },
  navButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  progressBlock: {
    alignItems: "center",
    gap: 4,
    minWidth: 120,
  },
  progressText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  progressBarBg: {
    width: 100,
    height: 4,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  stateTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    textAlign: "center",
  },
  stateSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  actionButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  headerIconButton: {
    padding: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
  },
  settingRow: {
    gap: spacing.xs,
  },
  settingLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chipButton: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },
  themeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  themeChipText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },
  // AI Assistant Styles
  aiModalSheet: {
    width: "100%",
    maxHeight: "85%",
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  aiTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  aiChapterSubtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    marginTop: -spacing.xs,
  },
  aiActionTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  aiActionTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  aiActionTabText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  aiQuestionBox: {
    width: "100%",
  },
  aiQuestionInput: {
    width: "100%",
    height: 70,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    textAlignVertical: "top",
  },
  aiRunBtn: {
    width: "100%",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  aiBtnLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  aiRunBtnText: {
    color: "#FFFFFF",
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  aiErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  aiErrorText: {
    flex: 1,
    color: "#FF4B6E",
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  aiResultScroll: {
    maxHeight: 220,
  },
  aiResultCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  aiResultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  aiResultBadge: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    textTransform: "uppercase",
  },
  aiResponseText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
