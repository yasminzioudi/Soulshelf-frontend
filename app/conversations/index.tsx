// app/conversations/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
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

import { useCurrentUser } from "@/src/features/auth/useCurrentUser";
import { useConversations } from "@/src/features/messaging/useMessaging";
import {
  getOrCreateConversationApi,
  type ConversationSummaryDto,
} from "@/src/features/messaging/messaging.api";
import { useFriends } from "@/src/features/friends/useFriends";
import { useFollowers, useFollowing } from "@/src/features/social/useSocial";
import type { PublicUserDto } from "@/src/features/social/social.api";
import { UserAvatar as SharedUserAvatar } from "@/src/shared/components/ui";
import { formatConversationTime } from "@/src/shared/utils/date";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

function UserAvatar({
  name,
  avatarUrl,
  size = 48,
}: {
  name: string;
  avatarUrl: string | null;
  size?: number;
}) {
  return <SharedUserAvatar name={name} avatarUrl={avatarUrl} size={size} />;
}

export default function ConversationsScreen() {
  const colors = useColors();
  const { user: currentUser } = useCurrentUser();
  const { conversations, isLoading, isError, refetch } = useConversations();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [creatingForUserId, setCreatingForUserId] = useState<number | null>(null);

  // Discover people from friends, following, and followers
  const currentUserId = currentUser?.id ?? 0;
  const { friends } = useFriends();
  const { followers, isLoading: isFollowersLoading } = useFollowers(currentUserId);
  const { following, isLoading: isFollowingLoading } = useFollowing(currentUserId);

  // Merge and deduplicate available contacts (friends + following + followers)
  const contacts = useMemo(() => {
    const map = new Map<number, PublicUserDto>();
    for (const u of friends) {
      if (u.id !== currentUserId) map.set(u.id, u);
    }
    for (const u of following) {
      if (u.id !== currentUserId && !map.has(u.id)) map.set(u.id, u);
    }
    for (const u of followers) {
      if (u.id !== currentUserId && !map.has(u.id)) {
        map.set(u.id, u);
      }
    }
    return Array.from(map.values());
  }, [friends, following, followers, currentUserId]);

  // Filtered contacts based on search query
  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, searchQuery]);

  const handleStartChatWithContact = async (contactId: number) => {
    if (creatingForUserId === contactId) return;
    setCreatingForUserId(contactId);
    try {
      const res = await getOrCreateConversationApi(contactId);
      setSearchQuery("");
      router.push(`/conversations/${res.conversationId}`);
    } catch {
      // Error opening chat
    } finally {
      setCreatingForUserId(null);
    }
  };

  const isSearching = searchQuery.trim().length > 0;
  const contactsLoading = isFollowersLoading || isFollowingLoading;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search Input for Followers/Following */}
      <View style={[styles.searchSection, { borderBottomColor: colors.border }]}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search followers or following to message..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      {isSearching ? (
        // Search Results Section
        <ScrollView
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            PEOPLE YOU CAN MESSAGE
          </Text>

          {contactsLoading ? (
            <View style={styles.centerSmall}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.centerSmall}>
              <Ionicons name="search-outline" size={36} color={colors.textSecondary} />
              <Text style={[styles.emptySubtitle, { color: colors.text }]}>
                No matches found
              </Text>
              <Text style={[styles.subText, { color: colors.textSecondary }]}>
                Only users you follow or who follow you appear here.
              </Text>
            </View>
          ) : (
            filteredContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={[
                  styles.contactCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => handleStartChatWithContact(contact.id)}
                disabled={creatingForUserId === contact.id}
                activeOpacity={0.7}
              >
                <UserAvatar name={contact.name} avatarUrl={contact.avatarUrl} size={44} />
                <View style={styles.contactInfo}>
                  <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                    {contact.name}
                  </Text>
                  {contact.occupation ? (
                    <Text style={[styles.userOccupation, { color: colors.primary }]} numberOfLines={1}>
                      {contact.occupation}
                    </Text>
                  ) : (
                    <Text style={[styles.userOccupation, { color: colors.textSecondary }]}>
                      Follower / Following
                    </Text>
                  )}
                </View>
                {creatingForUserId === contact.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <View style={[styles.startChatBadge, { backgroundColor: colors.primaryLight + "30" }]}>
                    <Ionicons name="chatbubble" size={14} color={colors.primary} />
                    <Text style={[styles.startChatText, { color: colors.primary }]}>Message</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : isLoading ? (
        // Loading Conversations
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.subText, { color: colors.textSecondary }]}>
            Loading conversations...
          </Text>
        </View>
      ) : isError ? (
        // Error Conversations
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Unable to load messages</Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => void refetch()}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : conversations.length === 0 ? (
        // Empty Conversations
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.center}>
            <Ionicons name="chatbubbles-outline" size={56} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>
              Search for followers or following above to start your first direct conversation!
            </Text>
          </View>

          {contacts.length > 0 && (
            <View style={styles.suggestedSection}>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                SUGGESTED CONTACTS
              </Text>
              {contacts.slice(0, 5).map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={[
                    styles.contactCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => handleStartChatWithContact(contact.id)}
                  disabled={creatingForUserId === contact.id}
                  activeOpacity={0.7}
                >
                  <UserAvatar name={contact.name} avatarUrl={contact.avatarUrl} size={44} />
                  <View style={styles.contactInfo}>
                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                      {contact.name}
                    </Text>
                    {contact.occupation ? (
                      <Text style={[styles.userOccupation, { color: colors.primary }]} numberOfLines={1}>
                        {contact.occupation}
                      </Text>
                    ) : null}
                  </View>
                  {creatingForUserId === contact.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <View style={[styles.startChatBadge, { backgroundColor: colors.primaryLight + "30" }]}>
                      <Ionicons name="chatbubble" size={14} color={colors.primary} />
                      <Text style={[styles.startChatText, { color: colors.primary }]}>Message</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        // Conversations List
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
        >
          {conversations.map((conv: ConversationSummaryDto) => (
            <TouchableOpacity
              key={conv.id}
              style={[
                styles.convCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => router.push(`/conversations/${conv.id}`)}
              activeOpacity={0.7}
            >
              <UserAvatar
                name={conv.otherUser.name}
                avatarUrl={conv.otherUser.avatarUrl}
                size={48}
              />
              <View style={styles.convInfo}>
                <View style={styles.convTopRow}>
                  <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                    {conv.otherUser.name}
                  </Text>
                  {conv.latestMessageCreatedAt && (
                    <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                      {formatConversationTime(conv.latestMessageCreatedAt)}
                    </Text>
                  )}
                </View>
                <Text
                  style={[styles.lastMsg, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {conv.latestMessage || "No messages yet"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  backBtn: { width: 32 },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    paddingVertical: 4,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  centerSmall: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  subText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
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
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionSubtitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  suggestedSection: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  convCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  convInfo: {
    flex: 1,
    gap: 4,
  },
  convTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
  },
  userOccupation: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  timeText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  lastMsg: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  startChatBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  startChatText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
});
