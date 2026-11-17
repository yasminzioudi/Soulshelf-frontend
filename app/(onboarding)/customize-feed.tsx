// app/(onboarding)/customize-feed.tsx
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { updateMeApi } from "@/src/features/auth/auth.api";
import { getAccessToken, saveUser } from "@/src/core/storage/tokenStorage";
import { Button, Input, SegmentedControl } from "@/src/shared/components/ui";
import { fontFamily, fontSize, spacing, useColors } from "@/src/theme";

const READING_LEVELS = ["Beginner", "Intermediate", "Expert"];

const DATE_REGEX = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

interface FormErrors {
  name?: string;
  dateOfBirth?: string;
  gender?: string;
  occupation?: string;
  country?: string;
  favoriteGenre?: string;
}

export default function CustomizeFeedScreen() {
  const colors = useColors();
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [country, setCountry] = useState("");
  const [favoriteGenre, setFavoriteGenre] = useState("");
  const [readingLevel, setReadingLevel] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = "This field is required.";
    if (!dateOfBirth.trim()) {
      next.dateOfBirth = "This field is required.";
    } else if (!DATE_REGEX.test(dateOfBirth.trim())) {
      next.dateOfBirth = "Please use the format DD/MM/YYYY.";
    }
    if (!gender.trim()) next.gender = "This field is required.";
    if (!occupation.trim()) next.occupation = "This field is required.";
    if (!country.trim()) next.country = "This field is required.";
    if (!favoriteGenre.trim()) next.favoriteGenre = "This field is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (token && occupation.trim()) {
        const updated = await updateMeApi({ occupation: occupation.trim() }, token);
        await saveUser(updated);
      }
    } catch {
      // Continue onboarding even if patch fails
    } finally {
      setLoading(false);
      router.push("/follow-friends");
    }
  };

  const handleSkip = () => {
    router.push("/(tabs)/library");
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Barre de progression — étape 1 sur 2 */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: "50%", backgroundColor: colors.primary }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Titre */}
        <Text style={[styles.title, { color: colors.text }]}>Customize your Feed</Text>

        {/* Champs du formulaire */}
        <View style={styles.form}>
          <Input
            placeholder="Name"
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
            autoCapitalize="words"
            autoComplete="name"
            error={errors.name}
          />
          <Input
            placeholder="Date of Birth (DD/MM/YYYY)"
            value={dateOfBirth}
            onChangeText={(t) => { setDateOfBirth(t); setErrors((e) => ({ ...e, dateOfBirth: undefined })); }}
            keyboardType="numbers-and-punctuation"
            error={errors.dateOfBirth}
          />
          <Input
            placeholder="Gender"
            value={gender}
            onChangeText={(t) => { setGender(t); setErrors((e) => ({ ...e, gender: undefined })); }}
            autoCapitalize="words"
            error={errors.gender}
          />
          <Input
            placeholder="Occupation"
            value={occupation}
            onChangeText={(t) => { setOccupation(t); setErrors((e) => ({ ...e, occupation: undefined })); }}
            autoCapitalize="words"
            autoComplete="organization-title"
            error={errors.occupation}
          />
          <Input
            placeholder="Country"
            value={country}
            onChangeText={(t) => { setCountry(t); setErrors((e) => ({ ...e, country: undefined })); }}
            autoCapitalize="words"
            autoComplete="country"
            error={errors.country}
          />
          <Input
            placeholder="Favorite Genre"
            value={favoriteGenre}
            onChangeText={(t) => { setFavoriteGenre(t); setErrors((e) => ({ ...e, favoriteGenre: undefined })); }}
            autoCapitalize="words"
            error={errors.favoriteGenre}
          />
        </View>

        {/* Section Reading Level */}
        <View style={styles.readingSection}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Reading Level</Text>
          <SegmentedControl
            options={READING_LEVELS}
            selectedIndex={readingLevel}
            onSelect={setReadingLevel}
          />
        </View>

        {/* Bouton principal */}
        <Button
          label="Next: Find Friend"
          onPress={handleNext}
          loading={loading}
          style={styles.submitButton}
        />

        {/* Lien Skip */}
        <Pressable onPress={handleSkip} style={styles.skipWrapper}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>No, this Later</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  progressTrack: {
    height: 4,
    width: "100%",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    alignSelf: "flex-start",
    marginBottom: spacing.xl,
  },
  form: {
    width: "100%",
    marginBottom: spacing.md,
  },
  readingSection: {
    width: "100%",
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
  },
  submitButton: {
    width: "100%",
    marginBottom: spacing.md,
  },
  skipWrapper: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
