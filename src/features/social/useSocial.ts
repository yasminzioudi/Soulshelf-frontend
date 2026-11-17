import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  followUserApi,
  getDiscoverWritersApi,
  getFollowStatusApi,
  getFollowersApi,
  getFollowingApi,
  getUserProfileApi,
  searchPeopleApi,
  unfollowUserApi,
} from "./social.api";
import type { StoredUser } from "@/src/core/storage/tokenStorage";

export function useDiscoverWriters() {
  const query = useQuery({
    queryKey: ["social", "discover", "writers"],
    queryFn: () => getDiscoverWritersApi(),
    staleTime: 30_000,
  });

  return {
    writers: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSearchPeople(queryStr: string) {
  const query = useQuery({
    queryKey: ["social", "search", queryStr],
    queryFn: () => searchPeopleApi(queryStr),
    enabled: Boolean(queryStr && queryStr.trim().length > 0),
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useUserProfile(userId: number) {
  const query = useQuery({
    queryKey: ["users", userId, "profile"],
    queryFn: () => getUserProfileApi(userId),
    enabled: Boolean(userId && userId > 0),
    staleTime: 30_000,
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useFollowers(userId: number) {
  const query = useQuery({
    queryKey: ["social", "followers", userId],
    queryFn: () => getFollowersApi(userId),
    enabled: Boolean(userId && userId > 0),
    staleTime: 30_000,
  });

  return {
    followers: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useFollowing(userId: number) {
  const query = useQuery({
    queryKey: ["social", "following", userId],
    queryFn: () => getFollowingApi(userId),
    enabled: Boolean(userId && userId > 0),
    staleTime: 30_000,
  });

  return {
    following: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useFollowUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (userId: number) => followUserApi(userId),
    onSuccess: (data, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ["users", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["social", "status", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["social", "followers"] });
      queryClient.invalidateQueries({ queryKey: ["social", "following"] });
      queryClient.invalidateQueries({ queryKey: ["social", "discover"] });

      // Invalidate current user profile since followingCount changed
      const currentUser = queryClient.getQueryData<StoredUser>(["currentUser"]);
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: ["users", currentUser.id, "profile"] });
      }
    },
  });

  return {
    followUser: mutation.mutateAsync,
    isFollowingLoading: mutation.isPending,
  };
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (userId: number) => unfollowUserApi(userId),
    onSuccess: (data, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ["users", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["social", "status", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["social", "followers"] });
      queryClient.invalidateQueries({ queryKey: ["social", "following"] });
      queryClient.invalidateQueries({ queryKey: ["social", "discover"] });

      // Invalidate current user profile since followingCount changed
      const currentUser = queryClient.getQueryData<StoredUser>(["currentUser"]);
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: ["users", currentUser.id, "profile"] });
      }
    },
  });

  return {
    unfollowUser: mutation.mutateAsync,
    isUnfollowingLoading: mutation.isPending,
  };
}

