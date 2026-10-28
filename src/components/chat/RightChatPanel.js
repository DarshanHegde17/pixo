import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatService } from '../../services/chatService.js';
import { colors, spacing } from '../../theme';

const COMMS_FILTERS = [
  { id: 'all', label: 'All Transmissions' },
  { id: 'achievements', label: 'High Scores' },
  { id: 'squad', label: 'Squad' },
];

export const RightChatPanel = ({
  user,
  width = 260,
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const scrollViewRef = useRef(null);

  // Load Global Comms history
  const loadCommsHistory = async () => {
    try {
      const history = await ChatService.getGlobalCommsHistory();
      setMessages(history);
    } catch (err) {
      console.warn('Failed to load Global Comms history:', err);
    }
  };

  useEffect(() => {
    loadCommsHistory();
  }, []);

  // Auto-scroll on new message
  const handleScrollToEnd = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  // Broadcast message
  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    setErrorMessage('');
    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    // Optimistically scroll
    setTimeout(handleScrollToEnd, 50);

    try {
      const result = await ChatService.sendGlobalCommsMessage(user, textToSend);
      setMessages(result.updatedHistory);
    } catch (err) {
      setErrorMessage(err.message || 'Transmission failed. Try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSending(false);
      setTimeout(handleScrollToEnd, 100);
    }
  };

  // Reset Comms
  const handleResetComms = () => {
    Alert.alert(
      'Reset Comms Channel',
      'Clear custom transmissions and reload verified frequency messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const reset = await ChatService.resetGlobalCommsHistory();
            setMessages(reset);
          },
        },
      ]
    );
  };

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'achievements') {
      return (
        msg.text.includes('Chapter') ||
        msg.text.includes('points') ||
        msg.text.includes('unlocked') ||
        msg.text.includes('conquered')
      );
    }
    if (selectedFilter === 'squad') {
      return msg.userId === user?.id || msg.text.includes('Anyone');
    }
    return true;
  });

  // Collapsed rail view on desktop
  if (isCollapsed && !isMobile) {
    return (
      <View style={styles.collapsedRail}>
        <TouchableOpacity
          style={styles.railHeaderBtn}
          onPress={onToggleCollapse}
          activeOpacity={0.7}
          accessibilityLabel="Expand Global Comms"
        >
          <Ionicons name="radio-outline" size={18} color={colors.orangeAccent} />
          <Ionicons name="chevron-back" size={14} color={colors.textSecondary} style={{ marginTop: 4 }} />
        </TouchableOpacity>

        <View style={styles.railVerticalBadge}>
          <View style={styles.orangeDot} />
          <Text style={styles.railVerticalText}>GLOBAL COMMS</Text>
        </View>

        <TouchableOpacity
          style={styles.railExpandAction}
          onPress={onToggleCollapse}
          activeOpacity={0.7}
        >
          <Ionicons name="globe-outline" size={16} color={colors.orangeAccent} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.panelContainer, { width: isMobile ? '100%' : width }]}>
      {/* 1. COMPACT HEADER (42-46px) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.orangeLiveDot} />
          <Ionicons name="radio" size={14} color={colors.orangeAccent} style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            GLOBAL COMMS
          </Text>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>1.4k CH</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleResetComms}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Reset comms feed"
          >
            <Ionicons name="refresh-outline" size={13} color={colors.textMuted} />
          </TouchableOpacity>

          {isMobile ? (
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={onCloseMobile}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close chat"
            >
              <Ionicons name="close" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            onToggleCollapse && (
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={onToggleCollapse}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Collapse right chat panel"
              >
                <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* 2. COMPACT CHANNEL FILTER PILLS */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {COMMS_FILTERS.map((f) => {
            const isSelected = selectedFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                onPress={() => setSelectedFilter(f.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isSelected && styles.filterPillTextSelected]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. MESSAGE AREA */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageScroll}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={handleScrollToEnd}
      >
        {filteredMessages.map((msg) => {
          const isMe = msg.userId === user?.id;
          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isMe ? styles.messageRowMe : styles.messageRowOther,
              ]}
            >
              {/* Avatar on left for other users */}
              {!isMe && (
                <View style={[styles.avatarBox, { borderColor: msg.accentColor || colors.orangeAccent }]}>
                  {msg.profilePicture ? (
                    <Image source={{ uri: msg.profilePicture }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name={msg.avatar || 'game-controller'} size={11} color={msg.accentColor || colors.orangeAccent} />
                  )}
                </View>
              )}

              {/* Message Bubble Container */}
              <View style={[styles.bubbleWrapper, isMe && styles.bubbleWrapperMe]}>
                {/* Sender Eyebrow */}
                <View style={styles.senderHeader}>
                  <Text style={[styles.senderName, isMe && styles.senderNameMe]} numberOfLines={1}>
                    {isMe ? 'YOU' : msg.sender}
                  </Text>
                  <View style={styles.levelTag}>
                    <Text style={styles.levelTagText}>LV{msg.userLevel || 1}</Text>
                  </View>
                  <Text style={styles.timestampText}>{msg.timestamp}</Text>
                </View>

                {/* Bubble Text */}
                <View
                  style={[
                    styles.messageBubble,
                    isMe ? styles.bubbleMe : styles.bubbleOther,
                  ]}
                >
                  <Text style={styles.messageText}>{msg.text}</Text>
                </View>
              </View>

              {/* Avatar on right for current user */}
              {isMe && (
                <View style={[styles.avatarBox, styles.avatarBoxMe]}>
                  {user?.profilePicture ? (
                    <Image source={{ uri: user.profilePicture }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name={user?.avatar || 'game-controller'} size={11} color={colors.primary} />
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Error Feedback */}
      {errorMessage.length > 0 && (
        <View style={styles.errorToast}>
          <Ionicons name="alert-circle" size={12} color={colors.error} style={{ marginRight: 4 }} />
          <Text style={styles.errorText} numberOfLines={1}>{errorMessage}</Text>
        </View>
      )}

      {/* 4. COMPACT INPUT AREA (42-46px) */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.textInput}
          placeholder="Broadcast to comms..."
          placeholderTextColor={colors.textPlaceholder}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          editable={!isSending}
          returnKeyType="send"
        />

        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!inputText.trim() || isSending) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
          activeOpacity={0.8}
          accessibilityLabel="Broadcast transmission to global comms"
        >
          <Ionicons name="send" size={13} color="#050705" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panelContainer: {
    height: '100%',
    backgroundColor: '#09110B',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 106, 0, 0.16)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 10,
  },
  collapsedRail: {
    width: 44,
    height: '100%',
    backgroundColor: '#09110B',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 106, 0, 0.16)',
    alignItems: 'center',
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  railHeaderBtn: {
    alignItems: 'center',
    padding: 6,
  },
  railVerticalBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  railVerticalText: {
    color: colors.orangeAccent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 8,
    transform: [{ rotate: '90deg' }],
    width: 80,
    textAlign: 'center',
  },
  railExpandAction: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 106, 0, 0.1)',
  },
  orangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.orangeAccent,
    marginBottom: 4,
  },
  header: {
    height: 44,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 106, 0, 0.14)',
    backgroundColor: '#070C08',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orangeLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.orangeAccent,
    marginRight: 6,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 5px #FF6A00' } : {}),
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.8,
  },
  liveBadge: {
    marginLeft: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 106, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.28)',
  },
  liveBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.orangeAccent,
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    padding: 5,
    marginLeft: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  filterWrap: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 106, 0, 0.08)',
    backgroundColor: 'rgba(5, 7, 5, 0.5)',
  },
  filterScroll: {
    paddingHorizontal: 8,
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 106, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.2)',
  },
  filterPillSelected: {
    backgroundColor: 'rgba(255, 106, 0, 0.24)',
    borderColor: colors.orangeAccent,
  },
  filterPillText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterPillTextSelected: {
    color: colors.orangeAccent,
    fontWeight: '800',
  },
  messageScroll: {
    flex: 1,
  },
  messageList: {
    padding: 8,
    paddingBottom: 12,
    gap: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  avatarBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111712',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginTop: 2,
  },
  avatarBoxMe: {
    borderColor: colors.primary,
    marginLeft: 6,
    marginRight: 0,
  },
  avatarImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  bubbleWrapper: {
    maxWidth: '82%',
  },
  bubbleWrapperMe: {
    alignItems: 'flex-end',
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  senderName: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.textSecondary,
    marginRight: 4,
  },
  senderNameMe: {
    color: colors.primary,
  },
  levelTag: {
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    borderRadius: 2,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    marginRight: 4,
  },
  levelTagText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: colors.primary,
  },
  timestampText: {
    fontSize: 8,
    color: colors.textMuted,
  },
  messageBubble: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bubbleOther: {
    backgroundColor: '#111712',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.18)',
    borderLeftWidth: 2.5,
    borderLeftColor: colors.orangeAccent,
    borderTopLeftRadius: 2,
  },
  bubbleMe: {
    backgroundColor: '#1A1812',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.28)',
    borderRightWidth: 2.5,
    borderRightColor: colors.orangeAccent,
    borderTopRightRadius: 2,
  },
  messageText: {
    fontSize: 12,
    lineHeight: 16.5,
    color: '#F5F7F4',
    letterSpacing: 0.2,
  },
  errorToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 77, 77, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  errorText: {
    color: colors.error,
    fontSize: 10,
    fontWeight: '600',
  },
  inputArea: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#070C08',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 106, 0, 0.14)',
  },
  textInput: {
    flex: 1,
    height: 32,
    backgroundColor: '#101610',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    color: colors.textPrimary,
    fontSize: 11.5,
    marginRight: 6,
    outlineStyle: 'none',
  },
  sendBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: colors.orangeAccent,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 0 8px rgba(255, 106, 0, 0.4)',
        }
      : {}),
  },
  sendBtnDisabled: {
    opacity: 0.4,
    backgroundColor: '#3A281E',
  },
});
