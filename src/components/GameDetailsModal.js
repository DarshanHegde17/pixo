import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';
import { GamingActivityService } from '../services/gamingActivityService';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

/**
 * SOLOPLAY V3 Cinematic Game Details Modal
 * With sequential level unlocking progression (Levels 1–6)
 */
export const GameDetailsModal = ({
  visible,
  game,
  onClose,
  onLaunch,
}) => {
  const { user } = useAuth();
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);

  // Web: lock background page scrolling when modal is open
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (visible) {
        const origOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = origOverflow || '';
        };
      }
    }
  }, [visible]);

  useEffect(() => {
    let isMounted = true;
    async function loadUnlocked() {
      if (visible && game?.id && user?.id) {
        try {
          const lvl = await GamingActivityService.getUserUnlockedLevel(user.id, game.id);
          if (isMounted) {
            const valid = Math.max(1, lvl || 1);
            setUnlockedLevel(valid);
            setSelectedLevel(valid);
          }
        } catch (e) {
          console.warn('Error loading game level progression:', e);
        }
      } else {
        setUnlockedLevel(1);
        setSelectedLevel(1);
      }
    }
    loadUnlocked();
    return () => {
      isMounted = false;
    };
  }, [visible, game?.id, user?.id]);

  if (!visible || !game) return null;

  const isCurrentLevelLocked = selectedLevel > unlockedLevel;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop touchable to close popup on outside click */}
        <TouchableOpacity
          style={styles.modalBackdropTouch}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Close game dialog"
        />

        <View
          style={styles.modalCard}
          onStartShouldSetResponder={() => true}
        >
          {/* Glowing Border Wrap */}
          <View style={styles.borderGlow}>
            <View style={styles.innerCard}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.titleWrap}>
                  <Text style={styles.modalGenre}>{game.category || game.genre || 'Single Player'}</Text>
                  <Text style={styles.modalTitle}>{game.title}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Scrollable Middle Content Container */}
              <ScrollView
                style={styles.modalBodyScroll}
                contentContainerStyle={styles.modalBodyContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {/* Tags */}
                {Array.isArray(game.tags) && (
                  <View style={styles.modalTagRow}>
                    {game.tags.map((tag, idx) => (
                      <View key={idx} style={styles.modalTag}>
                        <Text style={styles.modalTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Description */}
                <Text style={styles.modalDesc}>
                  {game.desc || game.description || 'Embark on an immersive solo journey with high-octane gameplay, rich storyline, and seamless progression.'}
                </Text>

                {/* Sequential Level Selection (Levels 1–6) */}
                <View style={styles.levelSectionWrap}>
                  <View style={styles.levelSectionHeader}>
                    <Text style={styles.levelSectionTitle}>MISSION LEVEL SELECTION</Text>
                    <Text style={styles.levelSectionSubtitle}>
                      Sequential progression • Complete each level to unlock the next
                    </Text>
                  </View>

                  <View style={styles.levelGrid}>
                    {[1, 2, 3, 4, 5, 6].map((lvl) => {
                      const isLocked = lvl > unlockedLevel;
                      const isCompleted = lvl < unlockedLevel;
                      const isSelected = selectedLevel === lvl;

                      return (
                        <TouchableOpacity
                          key={lvl}
                          style={[
                            styles.levelCard,
                            isSelected && styles.levelCardSelected,
                            isCompleted && styles.levelCardCompleted,
                            isLocked && styles.levelCardLocked,
                          ]}
                          onPress={() => {
                            if (isLocked) {
                              Alert.alert(
                                '🔒 Level Locked',
                                `Complete Level ${lvl - 1} first to unlock Level ${lvl}!`
                              );
                            } else {
                              setSelectedLevel(lvl);
                            }
                          }}
                          activeOpacity={isLocked ? 0.7 : 0.85}
                        >
                          <View style={styles.levelCardTop}>
                            <Text style={[styles.levelCardNum, isSelected && styles.levelCardNumActive]}>
                              LVL {lvl}
                            </Text>
                            {isCompleted ? (
                              <Ionicons name="checkmark-circle" size={13} color="#39FF14" />
                            ) : isLocked ? (
                              <Ionicons name="lock-closed" size={12} color="#777777" />
                            ) : (
                              <Ionicons name="flash" size={12} color="#39FF14" />
                            )}
                          </View>
                          <Text style={[styles.levelCardDesc, isLocked && styles.levelCardDescLocked]}>
                            {isLocked ? `Complete L${lvl - 1}` : isCompleted ? `Cleared ✓` : `Available`}
                          </Text>
                          <Text style={[styles.levelRewardHint, isLocked && styles.levelRewardHintLocked]}>
                            +{lvl * 25} XP
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Specs & Capabilities Box */}
                <View style={styles.modalStatsBox}>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="star" size={15} color="#FFB547" />
                    <Text style={styles.modalStatText}>{game.rating || '4.9 ★'}</Text>
                  </View>
                  <View style={styles.modalStatDivider} />
                  <View style={styles.modalStatItem}>
                    <Ionicons name="cloud-done-outline" size={15} color={colors.primary} />
                    <Text style={styles.modalStatText}>Cloud Saved</Text>
                  </View>
                  <View style={styles.modalStatDivider} />
                  <View style={styles.modalStatItem}>
                    <Ionicons name="game-controller-outline" size={15} color={colors.orangeWarm} />
                    <Text style={styles.modalStatText}>Controller Ready</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Fixed Bottom Launch Button Container */}
              <View style={styles.modalFooter}>
                {isCurrentLevelLocked ? (
                  <View style={styles.launchButtonLocked}>
                    <Ionicons name="lock-closed" size={16} color="#777777" style={{ marginRight: 8 }} />
                    <Text style={styles.launchButtonTextLocked}>
                      LOCKED • COMPLETE LEVEL {selectedLevel - 1} TO UNLOCK
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.launchButton}
                    onPress={() => onLaunch({ ...game, difficulty: selectedLevel })}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="play" size={17} color="#050705" style={{ marginRight: 8 }} />
                    <Text style={styles.launchButtonText}>
                      LAUNCH LEVEL {selectedLevel} MISSION →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 5, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    position: 'relative',
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }
      : {}),
  },
  modalBackdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90vh',
    height: Platform.OS === 'web' ? '86vh' : undefined,
    borderRadius: 22,
    overflow: 'hidden',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  borderGlow: {
    backgroundColor: 'rgba(57, 255, 20, 0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 106, 0, 0.45)',
    borderRadius: 22,
    padding: 1.5,
    flex: 1,
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(57, 255, 20, 0.25)',
        }
      : {
          elevation: 12,
        }),
  },
  innerCard: {
    backgroundColor: 'rgba(17, 25, 35, 0.98)',
    borderRadius: 21,
    padding: spacing.lg,
    flex: 1,
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    flexShrink: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  modalBodyScroll: {
    flex: 1,
    minHeight: 0,
    ...(Platform.OS === 'web'
      ? {
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }
      : {}),
  },
  modalBodyContent: {
    paddingBottom: spacing.sm,
    paddingRight: 4,
  },
  modalFooter: {
    flexShrink: 0,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(57, 255, 20, 0.15)',
  },
  titleWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  modalGenre: {
    color: colors.orangeWarm,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.6,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', sans-serif",
        }
      : {}),
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
        }
      : {}),
  },
  modalTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  modalTag: {
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalTagText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  levelSectionWrap: {
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
    borderRadius: 14,
    padding: spacing.md,
  },
  levelSectionHeader: {
    marginBottom: 10,
  },
  levelSectionTitle: {
    color: '#39FF14',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  levelSectionSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelCard: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.15s ease' } : {}),
  },
  levelCardSelected: {
    borderColor: '#39FF14',
    borderWidth: 2,
    backgroundColor: 'rgba(57, 255, 20, 0.22)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 16px rgba(57, 255, 20, 0.45)',
          transform: 'translateY(-1px)',
        }
      : {}),
  },
  levelCardCompleted: {
    borderColor: 'rgba(57, 255, 20, 0.35)',
    backgroundColor: 'rgba(57, 255, 20, 0.05)',
  },
  levelCardLocked: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(15, 15, 15, 0.65)',
    opacity: 0.6,
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : {}),
  },
  levelCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  levelCardNum: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '900',
  },
  levelCardNumActive: {
    color: '#39FF14',
  },
  levelCardDesc: {
    color: colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  levelCardDescLocked: {
    color: '#777777',
  },
  levelRewardHint: {
    color: '#00E5FF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  levelRewardHintLocked: {
    color: '#555555',
  },
  modalStatsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 22, 16, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.16)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  modalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalStatText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalStatDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  launchButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#39FF14',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.8)',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(57, 255, 20, 0.4)',
        }
      : {}),
  },
  launchButtonText: {
    color: '#050705',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  launchButtonLocked: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : {}),
  },
  launchButtonTextLocked: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});

export default GameDetailsModal;
