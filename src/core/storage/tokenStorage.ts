// src/core/storage/tokenStorage.ts
import * as SecureStore from "expo-secure-store";

// ─── Clés de stockage ──────────────────────────────────────────────────────────

const KEYS = {
  ACCESS_TOKEN: "ss_access_token",
  REFRESH_TOKEN: "ss_refresh_token",
  USER: "ss_user",
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface StoredUser {
  id: number;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  occupation?: string | null;
  bio?: string | null;
  role?: string | null;
}

// ─── Access Token ──────────────────────────────────────────────────────────────

export const saveAccessToken = (token: string): Promise<void> =>
  SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);

export const getAccessToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);

export const deleteAccessToken = (): Promise<void> =>
  SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);

// ─── Refresh Token ─────────────────────────────────────────────────────────────

export const saveRefreshToken = (token: string): Promise<void> =>
  SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);

export const getRefreshToken = (): Promise<string | null> =>
  SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);

export const deleteRefreshToken = (): Promise<void> =>
  SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);

// ─── User data ────────────────────────────────────────────────────────────────

export const saveUser = (user: StoredUser): Promise<void> => {
  const isDataUri = user.avatarUrl?.startsWith("data:");
  const toStore: StoredUser = isDataUri
    ? { id: user.id, email: user.email, name: user.name, avatarUrl: null }
    : user;
  return SecureStore.setItemAsync(KEYS.USER, JSON.stringify(toStore));
};


export const getUser = async (): Promise<StoredUser | null> => {
  const raw = await SecureStore.getItemAsync(KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
};

export const deleteUser = (): Promise<void> =>
  SecureStore.deleteItemAsync(KEYS.USER);

// ─── Convenience: clear everything on logout ──────────────────────────────────

export const clearAuthStorage = async (): Promise<void> => {
  await Promise.all([
    deleteAccessToken(),
    deleteRefreshToken(),
    deleteUser(),
  ]);
};

// ─── Convenience: save full auth session ──────────────────────────────────────

export const saveAuthSession = async (session: {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
}): Promise<void> => {
  await Promise.all([
    saveAccessToken(session.accessToken),
    saveRefreshToken(session.refreshToken),
    saveUser(session.user),
  ]);
};
