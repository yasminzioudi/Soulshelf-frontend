// app/friends.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useFriends, useUserSearch } from "@/src/features/friends/useFriends";
import type { PublicUser } from "@/src/features/friends/friends.api";
import { UserAvatar as SharedUserAvatar } from "@/src/shared/components/ui";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

type Tab = "friends" | "requests" | "find";

// ─── Avatar component ──────────────────────────────────────────────────────────
function UserAvatar({ user, size = 44 }: { user: PublicUser; size?: number }) {
  return <SharedUserAvatar name={user.name} avatarUrl={user.avatarUrl} size={size} />;
}


// ─── My Friends Tab ────────────────────────────────────────────────────────────
function FriendsTab() {
  const colors = useColors();
  const { friends, isFriendsLoading, isFriendsError, refetchFriends, removeFriend, isRemovingFriend } =
    useFriends();
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRemove = (user: PublicUser) => {
    Alert.alert(
      "Remove Friend",
      `Remove ${user.name} from your friends?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemovingId(user.id);
            try {
              await removeFriend(user.id);
            } catch {
              Alert.alert("Error", "Could not remove friend. Please try again.");
            } finally {
              setRemovingId(null);
            }
          },
        },
      ],
    );
  };

  if (isFriendsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.subText, { color: colors.textSecondary }]}>Loading friends...</Text>
      </View>
    );
  }

  if (isFriendsError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Unable to load friends</Text>
        <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetchFriends()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (friends.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="people-outline" size={52} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No friends yet</Text>
        <Text style={[styles.subText, { color: colors.textSecondary }]}>
          Use the Find People tab to connect with others.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetchFriends} tintColor={colors.primary} />}
    >
      {friends.map((user) => (
        <TouchableOpacity
          key={user.id}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push(`/users/${user.id}` as any)}
          activeOpacity={0.8}
        >
          <UserAvatar user={user} size={44} />
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: colors.text }]}>{user.name}</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Friend</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.error ?? "#e53e3e" }]}
            onPress={(e) => {
              e.stopPropagation();
              handleRemove(user);
            }}
            disabled={removingId === user.id || isRemovingFriend}
          >
            {removingId === user.id ? (
              <ActivityIndicator size="small" color={colors.error ?? "#e53e3e"} />
            ) : (
              <Text style={[styles.actionBtnText, { color: colors.error ?? "#e53e3e" }]}>Remove</Text>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Friend Requests Tab ───────────────────────────────────────────────────────
function RequestsTab() {
  const colors = useColors();
  const { requests, isRequestsLoading, isRequestsError, refetchRequests, acceptRequest, rejectRequest } = useFriends();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleAccept = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      await acceptRequest(requestId);
    } catch {
      Alert.alert("Error", "Could not accept request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      await rejectRequest(requestId);
    } catch {
      Alert.alert("Error", "Could not reject request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (isRequestsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isRequestsError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Unable to load requests</Text>
        <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetchRequests()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const hasAny = requests.incoming.length > 0 || requests.outgoing.length > 0;

  if (!hasAny) {
    return (
      <View style={styles.center}>
        <Ionicons name="mail-outline" size={52} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No pending requests</Text>
        <Text style={[styles.subText, { color: colors.textSecondary }]}>
          Friend requests you send or receive will appear here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetchRequests} tintColor={colors.primary} />}
    >
      {requests.incoming.length > 0 && (
        <>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Incoming</Text>
          {requests.incoming.map((req) => {
            if (!req.sender) return null;
            const isProcessing = processingId === req.id;
            return (
              <View
                key={req.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <UserAvatar user={req.sender} size={44} />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{req.sender.name}</Text>
                  <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Wants to be your friend</Text>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleAccept(req.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectBtn, { borderColor: colors.border }]}
                    onPress={() => handleReject(req.id)}
                    disabled={isProcessing}
                  >
                    <Text style={[styles.rejectBtnText, { color: colors.textSecondary }]}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </>
      )}

      {requests.outgoing.length > 0 && (
        <>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Outgoing</Text>
          {requests.outgoing.map((req) => {
            if (!req.receiver) return null;
            return (
              <View
                key={req.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <UserAvatar user={req.receiver} size={44} />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: colors.text }]}>{req.receiver.name}</Text>
                  <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Request sent · Pending</Text>
                </View>
                <View style={[styles.pendingBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.pendingText, { color: colors.primary }]}>Pending</Text>
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

// ─── Find People Tab ───────────────────────────────────────────────────────────
function FindPeopleTab() {
  const colors = useColors();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [sendingId, setSendingId] = useState<number | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data: results, isLoading: isSearching } = useUserSearch(debouncedSearchText);
  const { sendRequest } = useFriends();

  const handleSend = async (userId: number) => {
    setSendingId(userId);
    try {
      await sendRequest(userId);
      setSentIds((prev) => new Set(prev).add(userId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not send request.";
      if (msg.includes("409") || msg.includes("already")) {
        setSentIds((prev) => new Set(prev).add(userId));
      } else {
        Alert.alert("Error", "Could not send friend request. Please try again.");
      }
    } finally {
      setSendingId(null);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.listContent}>
        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Results */}
        {searchText.trim().length === 0 && (
          <View style={styles.center}>
            <Ionicons name="person-add-outline" size={52} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Find People</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>
              Type a name above to search for other SoulShelf readers.
            </Text>
          </View>
        )}

        {searchText.trim().length > 0 && isSearching && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {searchText.trim().length > 0 && !isSearching && results?.length === 0 && (
          <View style={styles.center}>
            <Ionicons name="person-outline" size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No users found</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>Try a different name.</Text>
          </View>
        )}

        {results && results.length > 0 && (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.sm }}>
            {results.map((user) => {
              const alreadySent = sentIds.has(user.id);
              const isSending = sendingId === user.id;
              return (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push(`/users/${user.id}` as any)}
                  activeOpacity={0.8}
                >
                  <UserAvatar user={user} size={44} />
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, { color: colors.text }]}>{user.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.sendBtn,
                      alreadySent
                        ? { backgroundColor: colors.primaryLight }
                        : { backgroundColor: colors.primary },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (!alreadySent) handleSend(user.id);
                    }}
                    disabled={alreadySent || isSending}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.sendBtnText, alreadySent ? { color: colors.primary } : {}]}>
                        {alreadySent ? "Sent ✓" : "Add"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function FriendsScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<Tab>("friends");

  const tabs: { key: Tab; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
    { key: "friends", label: "My Friends", icon: "people" },
    { key: "requests", label: "Requests", icon: "mail" },
    { key: "find", label: "Find People", icon: "search" },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Friends &amp; Social</Text>
        <Pressable onPress={() => router.push("/conversations")} hitSlop={12}>
          <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tabItem, isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={18}
                color={isActive ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.primary : colors.textSecondary },
                  isActive && { fontFamily: fontFamily.semiBold },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === "friends" && <FriendsTab />}
        {activeTab === "requests" && <RequestsTab />}
        {activeTab === "find" && <FindPeopleTab />}
      </View>
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
    borderBottomWidth: 1,
  },
  backButton: { width: 32 },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: 2,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    textAlign: "center",
  },
  subText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionHeader: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  cardSub: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  requestActions: {
    flexDirection: "column",
    gap: spacing.xs,
    alignItems: "flex-end",
  },
  acceptBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    minWidth: 68,
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#fff",
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },
  rejectBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    minWidth: 68,
    alignItems: "center",
  },
  rejectBtnText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  actionBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    minWidth: 68,
    alignItems: "center",
  },
  actionBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },
  pendingBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  pendingText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },
  retryBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  retryBtnText: {
    color: "#fff",
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    padding: 0,
  },
  sendBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    minWidth: 68,
    alignItems: "center",
  },
  sendBtnText: {
    color: "#fff",
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },
});
