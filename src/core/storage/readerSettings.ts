// src/core/storage/readerSettings.ts
import * as SecureStore from "expo-secure-store";

const READER_SETTINGS_KEY = "ss_reader_settings";

export interface ReaderSettings {
  fontSize: number; // 12–24
  fontFamily: "serif" | "sans-serif" | "monospace";
  lineHeight: number; // 1.2–2.2
  theme: "light" | "dark" | "sepia";
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 16,
  fontFamily: "serif",
  lineHeight: 1.7,
  theme: "dark",
};

export const getReaderSettings = async (): Promise<ReaderSettings> => {
  try {
    const raw = await SecureStore.getItemAsync(READER_SETTINGS_KEY);
    if (!raw) return DEFAULT_READER_SETTINGS;
    return { ...DEFAULT_READER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_READER_SETTINGS;
  }
};

export const saveReaderSettings = async (settings: Partial<ReaderSettings>): Promise<void> => {
  try {
    const current = await getReaderSettings();
    const updated = { ...current, ...settings };
    await SecureStore.setItemAsync(READER_SETTINGS_KEY, JSON.stringify(updated));
  } catch {
    // fail silently — reader still works with in-memory defaults
  }
};
