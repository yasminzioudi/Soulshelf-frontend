// src/features/auth/auth.api.ts
//
// Fonctions d'appel API pour le domaine auth.
// Appelées directement par les écrans — pas de couche RTK Query ici
// (les formulaires auth ne bénéficient pas de la mise en cache).

import { apiClient } from "@/src/core/api/client";
import type { StoredUser } from "@/src/core/storage/tokenStorage";

// ─── Types réponse backend ─────────────────────────────────────────────────────

interface AuthResponse {
  success: true;
  data: {
    user: StoredUser;
    accessToken: string;
    refreshToken: string;
  };
}

interface SignupResponse {
  success: true;
  data: StoredUser;
}

interface UpdateMeResponse {
  success: true;
  data: StoredUser;
}

// ─── B1: POST /auth/signup ─────────────────────────────────────────────────────

export interface SignupPayload {
  email: string;
  password: string;
  name?: string;
}

export const signupApi = async (
  payload: SignupPayload,
): Promise<StoredUser> => {
  const res = await apiClient.post<SignupResponse>("/auth/signup", payload);
  return res.data.data;
};

// ─── B2: POST /auth/login ──────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export const loginApi = async (
  payload: LoginPayload,
): Promise<AuthResponse["data"]> => {
  const res = await apiClient.post<AuthResponse>("/auth/login", payload);
  return res.data.data;
};

// ─── B3: PATCH /users/me ──────────────────────────────────────────────────────

export interface UpdateMePayload {
  name?: string;
  avatarUrl?: string;
  occupation?: string;
  bio?: string;
}

export const updateMeApi = async (
  payload: UpdateMePayload,
  accessToken: string,
): Promise<StoredUser> => {
  const res = await apiClient.patch<UpdateMeResponse>("/users/me", payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.data;
};

// ─── GET /users/me ──────────────────────────────────────────────────────────────
// Reads the caller's own up-to-date profile from the database.

interface MeResponse {
  success: true;
  data: StoredUser;
}

export const getMeApi = async (accessToken: string): Promise<StoredUser> => {
  const res = await apiClient.get<MeResponse>("/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.data;
};

// ─── POST /auth/logout ───────────────────────────────────────────────────────────

export const logoutApi = async (
  refreshToken: string,
  accessToken: string,
): Promise<void> => {
  await apiClient.post(
    "/auth/logout",
    { refreshToken },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
};

// ─── POST /auth/google ───────────────────────────────────────────────────────────

export interface GoogleAuthPayload {
  idToken: string;
}

export const googleAuthApi = async (
  payload: GoogleAuthPayload,
): Promise<AuthResponse["data"]> => {
  const res = await apiClient.post<AuthResponse>("/auth/google", payload);
  return res.data.data;
};

// ─── Forgot Password Flow ───────────────────────────────────────────────────────

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  success: true;
  data: {
    success: boolean;
    message: string;
  };
}

export const forgotPasswordApi = async (
  payload: ForgotPasswordPayload,
): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.post<ForgotPasswordResponse>(
    "/auth/forgot-password",
    payload,
  );
  return res.data.data;
};

export interface VerifyResetCodePayload {
  email: string;
  code: string;
}

export interface VerifyResetCodeResponse {
  success: true;
  data: {
    resetToken: string;
  };
}

export const verifyResetCodeApi = async (
  payload: VerifyResetCodePayload,
): Promise<{ resetToken: string }> => {
  const res = await apiClient.post<VerifyResetCodeResponse>(
    "/auth/verify-reset-code",
    payload,
  );
  return res.data.data;
};

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: true;
  data: {
    success: boolean;
  };
}

export const resetPasswordApi = async (
  payload: ResetPasswordPayload,
): Promise<{ success: boolean }> => {
  const res = await apiClient.post<ResetPasswordResponse>(
    "/auth/reset-password",
    payload,
  );
  return res.data.data;
};
