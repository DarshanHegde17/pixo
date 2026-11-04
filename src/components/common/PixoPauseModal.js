import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { NavigationService } from '../../services/navigationService';

/**
 * PixoPauseModal — Unified Cyberpunk Game Pause Menu
 * 
 * Master Prompt Section 5 & 6 Requirements:
 * - Triggered by hardware Back, browser Back, or visible Back Arrow during active gameplay.
 * - Stops active countdown and saves exact remaining time.
 * - Prevents timer from running in background or creating duplicate intervals.
 * - Two main choices:
 *     1. RESUME GAME: Restores question, score, timer, and resumes battle.
 *     2. EXIT GAME: Confirms with player, saves session via GamePersistenceService,
 *        and navigates back to Level Selection without awarding completion rewards.
 */
export const PixoPauseModal = ({
  visible,
  gameTitle = 'BATTLE IN PROGRESS',
  level = 1,
  timeLeft = 30,
  score = 0,
  currentQuestion = 1,
  totalQuestions = 5,
  onResume,
  onExit,
}) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Register high-priority Back handler to absorb Back key while paused
  useEffect(() => {
    if (!visible) {
      setShowExitConfirm(false);
      return;
    }

    // Intercept back actions while pause modal is active
    const unregister = NavigationService.registerBackHandler(
      'pixo_pause_modal',
      () => {
        if (showExitConfirm) {
          // If in exit confirmation, dismiss confirmation and return to pause menu
          setShowExitConfirm(false);
          return true;
        }
        // If in main pause menu, resume game or stay in pause menu
        if (onResume) {
          onResume();
          return true;
        }
        return true;
      },
      90
    );

    return unregister;
  }, [visible, showExitConfirm, onResume]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (showExitConfirm) setShowExitConfirm(false);
        else if (onResume) onResume();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogCard}>
          <LinearGradient
            colors={['#0F2414', '#08140B', '#040905']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dialogGradient}
          >
            {/* Top Amber Status Header */}
            <View style={styles.pauseBadgeWrapper}>
              <View style={styles.pauseIconBadge}>
                <Ionicons
                  name={showExitConfirm ? 'warning' : 'pause'}
                  size={28}
                  color={showExitConfirm ? '#FF453A' : '#FFA000'}
                />
              </View>
              <View style={styles.titleColumn}>
                <Text style={styles.eyebrow}>
                  {showExitConfirm ? 'EXIT CONFIRMATION' : 'TACTICAL PAUSE ENGAGED'}
                </Text>
                <Text style={styles.headingTitle}>
                  {showExitConfirm ? 'Exit Current Game?' : 'GAME PAUSED'}
                </Text>
              </View>
            </View>

            {/* Middle Section: Game State Snapshot */}
            {!showExitConfirm ? (
              <View style={styles.hudContainer}>
                <Text style={styles.gameTitleLabel}>{gameTitle}</Text>

                <View style={styles.statsRow}>
                  {/* Time Remaining */}
                  <View style={styles.statBox}>
                    <Ionicons name="timer-outline" size={16} color="#FF6A00" style={{ marginBottom: 2 }} />
                    <Text style={styles.statValue}>{timeLeft}s</Text>
                    <Text style={styles.statLabel}>TIME LEFT</Text>
                  </View>

                  {/* Level & Question */}
                  <View style={styles.statBox}>
                    <Ionicons name="layers-outline" size={16} color="#00E5FF" style={{ marginBottom: 2 }} />
                    <Text style={styles.statValue}>
                      {currentQuestion}/{totalQuestions}
                    </Text>
                    <Text style={styles.statLabel}>LEVEL {level}</Text>
                  </View>

                  {/* Score */}
                  <View style={styles.statBox}>
                    <Ionicons name="trophy-outline" size={16} color="#FFD700" style={{ marginBottom: 2 }} />
                    <Text style={styles.statValue}>{score.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>SCORE</Text>
                  </View>
                </View>

                <View style={styles.noticeBox}>
                  <Ionicons name="shield-checkmark" size={15} color="#39FF14" style={{ marginRight: 6 }} />
                  <Text style={styles.noticeText}>
                    Active clock is frozen. Your answers and score are preserved.
                  </Text>
                </View>

                {/* Primary Actions */}
                <View style={styles.actionsColumn}>
                  {/* 1. RESUME GAME */}
                  <TouchableOpacity
                    style={styles.resumeBtn}
                    onPress={onResume}
                    activeOpacity={0.85}
                    accessibilityLabel="Resume active game"
                  >
                    <LinearGradient
                      colors={['#39FF14', '#00E5FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.resumeBtnGradient}
                    >
                      <Ionicons name="play" size={18} color="#050705" style={{ marginRight: 8 }} />
                      <Text style={styles.resumeBtnText}>RESUME GAME</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* 2. EXIT GAME */}
                  <TouchableOpacity
                    style={styles.exitBtn}
                    onPress={() => setShowExitConfirm(true)}
                    activeOpacity={0.8}
                    accessibilityLabel="Open exit game confirmation"
                  >
                    <Ionicons name="exit-outline" size={17} color="#FFA000" style={{ marginRight: 8 }} />
                    <Text style={styles.exitBtnText}>EXIT GAME</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Exit Confirmation View */
              <View style={styles.confirmContainer}>
                <Text style={styles.confirmMessage}>
                  Are you sure you want to exit?
                </Text>
                <Text style={styles.confirmSubMessage}>
                  Your unfinished game session will be saved in cloud memory so you can resume it later. You will not earn completion rewards until the level is fully cleared.
                </Text>

                <View style={styles.actionsColumn}>
                  {/* Keep Playing */}
                  <TouchableOpacity
                    style={styles.resumeBtn}
                    onPress={() => setShowExitConfirm(false)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#39FF14', '#00FFA3']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.resumeBtnGradient}
                    >
                      <Ionicons name="shield-checkmark" size={17} color="#050705" style={{ marginRight: 8 }} />
                      <Text style={styles.resumeBtnText}>KEEP PLAYING</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Confirm Exit & Save */}
                  <TouchableOpacity
                    style={styles.confirmExitBtn}
                    onPress={() => {
                      setShowExitConfirm(false);
                      if (onExit) onExit();
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="save-outline" size={17} color="#FF453A" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmExitBtnText}>SAVE & EXIT TO LEVEL SELECTION</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 9999,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.8,
    borderColor: '#39FF14',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 32px rgba(57, 255, 20, 0.35), 0 12px 40px rgba(0, 0, 0, 0.9)',
        }
      : {}),
  },
  dialogGradient: {
    padding: 20,
  },
  pauseBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pauseIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 160, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 160, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleColumn: {
    flex: 1,
  },
  eyebrow: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headingTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  hudContainer: {
    width: '100%',
  },
  gameTitleLabel: {
    color: '#8A9E8D',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#09150C',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  statLabel: {
    color: '#7A8E7E',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 18,
  },
  noticeText: {
    flex: 1,
    color: '#9EC8A5',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  actionsColumn: {
    gap: 10,
  },
  resumeBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(57, 255, 20, 0.3)',
        }
      : {}),
  },
  resumeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  resumeBtnText: {
    color: '#050705',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 160, 0, 0.08)',
    borderWidth: 1.4,
    borderColor: 'rgba(255, 160, 0, 0.4)',
    borderRadius: 14,
    paddingVertical: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  exitBtnText: {
    color: '#FFA000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  confirmContainer: {
    paddingVertical: 4,
  },
  confirmMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  confirmSubMessage: {
    color: '#9EC8A5',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 18,
  },
  confirmExitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderWidth: 1.4,
    borderColor: 'rgba(255, 69, 58, 0.45)',
    borderRadius: 14,
    paddingVertical: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  confirmExitBtnText: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

export default PixoPauseModal;

