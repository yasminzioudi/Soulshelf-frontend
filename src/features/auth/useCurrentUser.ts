// src/features/auth/useCurrentUser.ts
//
// Hook partagé : lit l'utilisateur via React Query (["currentUser"]) comme
// source de vérité unique, avec SecureStore pour la persistance locale.
// Synchronise immédiatement les changements de profil à travers toute l'application.

import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  getUser,
  saveUser,
  type StoredUser,
} from "@/src/core/storage/tokenStorage";
import { getMeApi, logoutApi } from "@/src/features/auth/auth.api";

export function useCurrentUser() {
  const queryClient = useQueryClient();
  const [initialCachedUser, setInitialCachedUser] = useState<StoredUser | null>(null);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUser().then((cached) => {
      if (!cancelled) {
        if (cached) {
          setInitialCachedUser(cached);
          queryClient.setQueryData<StoredUser>(["currentUser"], (old) => old ?? cached);
        }
        setHasLoadedInitial(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  const { data: user, isLoading, refetch } = useQuery<StoredUser | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      if (!accessToken) return null;
      try {
        const fresh = await getMeApi(accessToken);
        await saveUser(fresh);
        return fresh;
      } catch {
        const cached = await getUser();
        return cached ?? null;
      }
    },
    staleTime: 60_000,
  });

  const currentUser = user ?? initialCachedUser;
  const loading = !hasLoadedInitial && isLoading;

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const logout = useCallback(async () => {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    if (accessToken && refreshToken) {
      try {
        await logoutApi(refreshToken, accessToken);
      } catch {
        // Ignorer l'erreur réseau / token déjà expiré
      }
    }

    await clearAuthStorage();
    queryClient.setQueryData(["currentUser"], null);
    queryClient.removeQueries({ queryKey: ["currentUser"] });
    router.replace("/login");
  }, [queryClient]);

  return { user: currentUser, loading, refresh, logout };
}

