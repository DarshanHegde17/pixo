import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatService } from '../../services/chatService.js';
import { colors, spacing } from '../../theme';

const QUICK_PROMPTS = [
  'Neon Runner tips?',
  'Shadow Blade tactics?',
  'How do streaks work?',
  'Next XP tier?',
];

export const LeftChatPanel = ({
  user,
  width = 260,
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile,
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const scrollViewRef = useRef(null);

  // Load chat history
  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        const history = await ChatService.getCoPilotHistory(user?.id);
        if (isMounted) {
          setMessages(history);
        }
      } catch (err) {
        console.warn('Failed to load Co-Pilot history:', err);
      }
    };
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Auto-scroll on new message
  const handleScrollToEnd = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  // Send message
  const handleSend = async (customText) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isTyping) return;

    setErrorMessage('');
    setInputText('');
    setIsTyping(true);

    // Optimistically scroll
    setTimeout(handleScrollToEnd, 50);

    try {
      const result = await ChatService.sendCoPilotMessage(user, textToSend);
      setMessages(result.updatedHistory);
    } catch (err) {
      setErrorMessage(err.message || 'Transmission failed. Try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsTyping(false);
      setTimeout(handleScrollToEnd, 100);
    }
  };

  // Clear history
  const handleClearHistory = () => {
    Alert.alert(
      'Reset Co-Pilot Session',
      'Clear tactical conversation history and restore default state?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const cleared = await ChatService.clearCoPilotHistory(user?.id);
            setMessages(cleared);
          },
        },
      ]
    );
  };

  // Collapsed rail view on desktop
  if (isCollapsed && !isMobile) {
    return (
      <View style={styles.collapsedRail}>
        <TouchableOpacity
          style={styles.railHeaderBtn}
          onPress={onToggleCollapse}
          activeOpacity={0.7}
          accessibilityLabel="Expand Tactical AI Co-Pilot"
        >
          <Ionicons name="hardware-chip" size={18} color={colors.primary} />
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} style={{ marginTop: 4 }} />
        </TouchableOpacity>

        <View style={styles.railVerticalBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.railVerticalText}>AI CO-PILOT</Text>
        </View>

        <TouchableOpacity
          style={styles.railExpandAction}
          onPress={onToggleCollapse}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubbles-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.panelContainer, { width: isMobile ? '100%' : width }]}>
      {/* 1. COMPACT HEADER (42-46px) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.onlineIndicator} />
          <Ionicons name="hardware-chip" size={15} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            AI CO-PILOT
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>TACTICAL</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleClearHistory}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Reset chat history"
          >
            <Ionicons name="trash-outline" size={13} color={colors.textMuted} />
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
                accessibilityLabel="Collapse left chat panel"
              >
                <Ionicons name="chevron-back" size={15} color={colors.textSecondary} />
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* 2. QUICK PROMPT CHIPS */}
      <View style={styles.quickPromptsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsScroll}>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <TouchableOpacity
              key={`qp_${idx}`}
              style={styles.promptChip}
              onPress={() => handleSend(prompt)}
              disabled={isTyping}
              activeOpacity={0.7}
            >
              <Text style={styles.promptChipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
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
        {messages.map((item) => {
          const isUser = item.role === 'user';
          return (
            <View
              key={item.id}
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowAssistant,
              ]}
            >
              {/* Avatar for Assistant */}
              {!isUser && (
                <View style={styles.assistantAvatar}>
                  <Ionicons name="hardware-chip" size={12} color={colors.primary} />
                </View>
              )}

              {/* Message Bubble */}
              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.userMessageText : styles.assistantMessageText,
                  ]}
                >
                  {item.text}
                </Text>
                <Text style={styles.messageTime}>{item.timestamp}</Text>
              </View>

              {/* Avatar for User */}
              {isUser && (
                <View style={styles.userAvatar}>
                  {item.profilePicture ? (
                    <Image source={{ uri: item.profilePicture }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name={item.avatar || 'game-controller'} size={12} color={colors.primary} />
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <View style={[styles.messageRow, styles.messageRowAssistant]}>
            <View style={styles.assistantAvatar}>
              <Ionicons name="hardware-chip" size={12} color={colors.primary} />
            </View>
            <View style={[styles.messageBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.typingText}>Analyzing tactics...</Text>
            </View>
          </View>
        )}
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
          placeholder="Ask Co-Pilot..."
          placeholderTextColor={colors.textPlaceholder}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          editable={!isTyping}
          returnKeyType="send"
        />

        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!inputText.trim() || isTyping) && styles.sendBtnDisabled,
          ]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isTyping}
          activeOpacity={0.8}
          accessibilityLabel="Send message to Co-Pilot"
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
    borderRightWidth: 1,
    borderRightColor: 'rgba(57, 255, 20, 0.16)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 10,
  },
  collapsedRail: {
    width: 44,
    height: '100%',
    backgroundColor: '#09110B',
    borderRightWidth: 1,
    borderRightColor: 'rgba(57, 255, 20, 0.16)',
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
    color: colors.primary,
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
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginBottom: 4,
  },
  header: {
    height: 44,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 255, 20, 0.14)',
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
  onlineIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 5px #39FF14' } : {}),
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.8,
  },
  statusBadge: {
    marginLeft: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.primary,
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
  quickPromptsWrap: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 255, 20, 0.08)',
    backgroundColor: 'rgba(5, 7, 5, 0.5)',
  },
  quickPromptsScroll: {
    paddingHorizontal: 8,
    gap: 6,
  },
  promptChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  promptChipText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
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
    alignItems: 'flex-end',
    width: '100%',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111712',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#151E18',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
  },
  assistantBubble: {
    backgroundColor: '#111712',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.18)',
    borderLeftWidth: 2.5,
    borderLeftColor: colors.primary,
    borderBottomLeftRadius: 2,
  },
  userBubble: {
    backgroundColor: '#162319',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.28)',
    borderBottomRightRadius: 2,
  },
  messageText: {
    fontSize: 12,
    lineHeight: 16.5,
    letterSpacing: 0.2,
  },
  assistantMessageText: {
    color: '#E0E6E0',
  },
  userMessageText: {
    color: '#F5F7F4',
  },
  messageTime: {
    fontSize: 8.5,
    color: colors.textMuted,
    alignSelf: 'flex-end',
    marginTop: 3,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111712',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  typingText: {
    fontSize: 10.5,
    color: colors.primary,
    fontWeight: '600',
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
    borderTopColor: 'rgba(57, 255, 20, 0.14)',
  },
  textInput: {
    flex: 1,
    height: 32,
    backgroundColor: '#101610',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 0 8px rgba(57, 255, 20, 0.4)',
        }
      : {}),
  },
  sendBtnDisabled: {
    opacity: 0.4,
    backgroundColor: '#2A3A2C',
  },
});
