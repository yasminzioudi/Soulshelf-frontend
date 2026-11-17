// src/features/friends/useFriends.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptFriendRequest,
  getFriendRequests,
  getFriends,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from "./friends.api";

export function useFriends() {
  const queryClient = useQueryClient();

  const friendsQuery = useQuery({
    queryKey: ["friends"],
    queryFn: () => getFriends(),
    staleTime: 30_000,
  });

  const requestsQuery = useQuery({
    queryKey: ["friendRequests"],
    queryFn: () => getFriendRequests(),
    staleTime: 30_000,
  });

  const sendRequestMutation = useMutation({
    mutationFn: (userId: number) => sendFriendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: number) => acceptFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (requestId: number) => rejectFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: (userId: number) => removeFriend(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  return {
    friends: friendsQuery.data ?? [],
    isFriendsLoading: friendsQuery.isLoading,
    isFriendsError: friendsQuery.isError,
    refetchFriends: friendsQuery.refetch,

    requests: requestsQuery.data ?? { incoming: [], outgoing: [] },
    isRequestsLoading: requestsQuery.isLoading,
    isRequestsError: requestsQuery.isError,
    refetchRequests: requestsQuery.refetch,

    sendRequest: sendRequestMutation.mutateAsync,
    isSendingRequest: sendRequestMutation.isPending,
    sendRequestError: sendRequestMutation.error,

    acceptRequest: acceptRequestMutation.mutateAsync,
    isAcceptingRequest: acceptRequestMutation.isPending,

    rejectRequest: rejectRequestMutation.mutateAsync,
    isRejectingRequest: rejectRequestMutation.isPending,

    removeFriend: removeFriendMutation.mutateAsync,
    isRemovingFriend: removeFriendMutation.isPending,
  };
}

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ["userSearch", query],
    queryFn: () => searchUsers(query),
    enabled: query.trim().length > 0,
    staleTime: 30_000,
  });
}
