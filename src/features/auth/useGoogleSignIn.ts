// src/features/auth/useGoogleSignIn.ts
//
// Google Sign-In via expo-auth-session (dev build natif iOS/Android requis,
// ne fonctionne pas dans Expo Go sans proxy). Récupère un idToken Google,
// l'envoie au backend (POST /auth/google) qui le vérifie et renvoie une session.
//
// ⚠️ Config requise :
//   - Client ID OAuth "iOS" créé sur Google Cloud Console avec le bon bundle ID
//   - EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID renseigné dans SoulShelf/.env
//   - Le scheme Google reverse-DNS DOIT être déclaré dans app.json
//     (ios.infoPlist.CFBundleURLTypes) ET le build natif relancé après.
//
// Redirect URI réelle envoyée à Google :
//   com.googleusercontent.apps.<guid>:/oauthredirect
// C'est le format standard Google pour les apps iOS installées (pas Expo Go).

import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useEffect } from "react";

import {
    saveAuthSession,
    type StoredUser,
} from "@/src/core/storage/tokenStorage";
import { googleAuthApi } from "@/src/features/auth/auth.api";

WebBrowser.maybeCompleteAuthSession();

// ─── Redirect URI ─────────────────────────────────────────────────────────────
// Google Cloud OAuth 2.0 requires native iOS apps to use the reverse-DNS scheme:
//   com.googleusercontent.apps.<guid>:/oauthredirect
// We pass this exact string directly so AuthSession doesn't rewrite it to "exp://"

const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
const iosGuid = IOS_CLIENT_ID.replace(".apps.googleusercontent.com", "");

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const GOOGLE_REDIRECT_URI = isExpoGo
  ? AuthSession.makeRedirectUri()
  : `com.googleusercontent.apps.${iosGuid}:/oauthredirect`;

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseGoogleSignInOptions {
  onSuccess: (user: StoredUser) => void;
  onError: (message: string) => void;
}

export function useGoogleSignIn({
  onSuccess,
  onError,
}: UseGoogleSignInOptions) {
  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      iosClientId: IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      redirectUri: GOOGLE_REDIRECT_URI,
    },
  );

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type !== "success") return;

      // expo-auth-session returns id_token inside authentication or params
      // depending on the response_type negotiated with Google.
      const idToken =
        response.authentication?.idToken ?? response.params?.id_token;

      if (!idToken) {
        onError(
          "Google didn't return an ID token. Check your OAuth client config.",
        );
        return;
      }

      try {
        const session = await googleAuthApi({ idToken });
        await saveAuthSession(session);
        onSuccess(session.user);
      } catch {
        onError("Couldn't complete Google Sign-In. Please try again.");
      }
    };

    handleGoogleResponse();
  }, [response, onSuccess, onError]);

  return {
    ready: !!request,
    signIn: () => promptAsync(),
  };
}
