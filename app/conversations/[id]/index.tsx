import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useCurrentUser } from "@/src/features/auth/useCurrentUser";
import { useChatMessages, useConversations } from "@/src/features/messaging/useMessaging";
import type { MessageDto } from "@/src/features/messaging/messaging.api";
import { UserAvatar } from "@/src/shared/components/ui";
import { formatMessageBubbleTime } from "@/src/shared/utils/date";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";


export default function ChatDetailScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ id: string }>();
  const conversationId = parseInt(params.id || "0", 10);

  const { user: currentUser } = useCurrentUser();
  const { conversations } = useConversations();
  const { messages, isLoading, isSending, sendMessage } = useChatMessages(conversationId);

  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Find conversation summary to get other user's profile info for header
  const currentConv = conversations.find((c) => c.id === conversationId);
  const otherUser = currentConv?.otherUser;

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessageItem = ({ item }: { item: MessageDto }) => {
    const isMe = item.senderId === currentUser?.id;
    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowMe : styles.messageRowOther,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 2 }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 2 },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isMe ? "#fff" : colors.text },
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              { color: isMe ? "rgba(255,255,255,0.7)" : colors.textSecondary },
            ]}
          >
            {formatMessageBubbleTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        {/* Other user info button */}
        <TouchableOpacity
          style={styles.headerUserInfo}
          onPress={() => otherUser?.id && router.push(`/users/${otherUser.id}` as any)}
          disabled={!otherUser?.id}
        >
          <UserAvatar
            name={otherUser?.name}
            avatarUrl={otherUser?.avatarUrl}
            size={36}
          />
          <View>
            <Text style={[styles.headerName, { color: colors.text }]}>{otherUser?.name || "Chat"}</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>View Profile</Text>
          </View>
        </TouchableOpacity>

        <View style={{ width: 24 }} />
      </View>

      {/* Main Chat Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No messages in this conversation yet. Send a message to start!
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Input Bar */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() ? { backgroundColor: colors.primary } : { backgroundColor: colors.border },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color={inputText.trim() ? "#fff" : colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarMiniImg: {
    width: 36,
    height: 36,
  },
  headerName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },
  headerSub: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  messagesList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 2,
  },
  messageRowMe: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: 4,
  },
  messageText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  messageTime: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    maxHeight: 100,
    paddingVertical: spacing.xs,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
