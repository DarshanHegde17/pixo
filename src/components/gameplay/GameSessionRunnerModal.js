import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { GamingActivityService, formatDuration } from '../../services/gamingActivityService';
import { useAuth } from '../../context/AuthContext';

export const GameSessionRunnerModal = ({
  visible,
  game,
  existingSession = null,
  onClose,
  onSessionUpdated,
}) => {
  const { user, addXp } = useAuth();

  const [activeSession, setActiveSession] = useState(existingSession);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [comboHits, setComboHits] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);

  const timerRef = useRef(null);

  // Initialize or resume session
  useEffect(() => {
    let isMounted = true;
    if (visible && game && user?.id) {
      async function initSession() {
        try {
          if (existingSession) {
            setActiveSession(existingSession);
            setElapsedSeconds(existingSession.durationSeconds || 0);
            setSessionScore(existingSession.score || 1200);
          } else {
            const sess = await GamingActivityService.startSession(user.id, game);
            if (isMounted) {
              setActiveSession(sess);
              setElapsedSeconds(0);
              setSessionScore(1500);
            }
          }
        } catch (err) {
          console.error('Failed to init game session:', err);
        }
      }
      initSession();
    }

    return () => {
      isMounted = false;
    };
  }, [visible, game, existingSession, user?.id]);

  // Session duration timer
  useEffect(() => {
    if (visible && activeSession && activeSession.status === 'in_progress') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, activeSession]);

  if (!visible || !game) return null;

  // Interactive gameplay action: Hit Combo / Hack node
  const handlePerformAction = () => {
    setComboHits((prev) => prev + 1);
    setSessionScore((prev) => prev + Math.floor(350 + Math.random() * 200));
  };

  // 1. COMPLETE CHALLENGE (Strict Victory)
  const handleComplete = async () => {
    if (!user?.id || !activeSession) return;
    setIsProcessing(true);

    try {
      const xpReward = game.id?.startsWith('q') ? 250 : 350;
      const res = await GamingActivityService.completeSession(user.id, activeSession.id, {
        score: Math.max(8500, sessionScore + 5000),
        durationSeconds: Math.max(15, elapsedSeconds),
        result: comboHits > 5 ? 'Victory - S Rank Flawless' : 'Victory - Mission Cleared',
        xpAwarded: xpReward,
        achievements: [
          'Solo Challenger Cleared',
          comboHits > 5 ? 'Combo Master x10' : 'Campaign Milestone',
        ],
        personalBest: true,
      });

      // Award XP to user profile
      if (addXp) {
        await addXp(xpReward);
      }

      setNotification({
        type: 'success',
        title: 'MISSION COMPLETE! 🏆',
        message: `+${xpReward} XP awarded! Qualifying daily streak updated.`,
      });

      if (onSessionUpdated) onSessionUpdated();

      setTimeout(() => {
        setIsProcessing(false);
        setNotification(null);
        onClose();
      }, 1200);
    } catch (err) {
      setIsProcessing(false);
      setNotification({
        type: 'error',
        title: 'Completion Error',
        message: err.message,
      });
    }
  };

  // 2. FAIL CHALLENGE (Defeat)
  const handleFail = async () => {
    if (!user?.id || !activeSession) return;
    setIsProcessing(true);

    try {
      await GamingActivityService.failSession(user.id, activeSession.id, {
        score: sessionScore,
        durationSeconds: Math.max(10, elapsedSeconds),
        result: 'Defeat - Challenge Failed',
      });

      setNotification({
        type: 'error',
        title: 'MISSION FAILED ❌',
        message: 'Defeat recorded. Fails do NOT qualify for daily streak or XP.',
      });

      if (onSessionUpdated) onSessionUpdated();

      setTimeout(() => {
        setIsProcessing(false);
        setNotification(null);
        onClose();
      }, 1200);
    } catch (err) {
      setIsProcessing(false);
      setNotification({
        type: 'error',
        title: 'Action Error',
        message: err.message,
      });
    }
  };

  // 3. ABANDON SESSION (Exit early)
  const handleAbandon = async () => {
    if (!user?.id || !activeSession) return;
    setIsProcessing(true);

    try {
      await GamingActivityService.abandonSession(user.id, activeSession.id);

      setNotification({
        type: 'warning',
        title: 'MISSION ABANDONED ⏹',
        message: 'Abandoned session recorded. Does not qualify for streak.',
      });

      if (onSessionUpdated) onSessionUpdated();

      setTimeout(() => {
        setIsProcessing(false);
        setNotification(null);
        onClose();
      }, 1000);
    } catch (err) {
      setIsProcessing(false);
      onClose();
    }
  };

  // 4. PAUSE / SAVE PROGRESS (Leaves as in_progress)
  const handlePauseAndSave = () => {
    if (onSessionUpdated) onSessionUpdated();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Top HUD Header */}
          <View style={styles.hudHeader}>
            <View style={styles.hudTitleWrap}>
              <View style={styles.liveIndicator}>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveText}>LIVE SIMULATION SESSION</Text>
              </View>
              <Text style={styles.gameTitle} numberOfLines={1}>
                {game.title}
              </Text>
              <Text style={styles.gameCategory}>
                {game.category || game.genre || 'Action Campaign'} • Session ID: {activeSession?.id?.substring(0, 14)}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={handlePauseAndSave}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Notification banner */}
          {notification && (
            <View
              style={[
                styles.noticeBanner,
                notification.type === 'success' && styles.noticeSuccess,
                notification.type === 'error' && styles.noticeError,
                notification.type === 'warning' && styles.noticeWarning,
              ]}
            >
              <Text style={styles.noticeTitle}>{notification.title}</Text>
              <Text style={styles.noticeMsg}>{notification.message}</Text>
            </View>
          )}

          {/* Gameplay Live HUD Stats */}
          <View style={styles.hudStatsGrid}>
            <View style={styles.hudStatBox}>
              <Ionicons name="time" size={16} color={colors.cyan} />
              <Text style={styles.hudStatLabel}>ELAPSED TIME</Text>
              <Text style={styles.hudStatValue}>{formatDuration(elapsedSeconds)}</Text>
            </View>

            <View style={styles.hudStatBox}>
              <Ionicons name="flash" size={16} color={colors.primary} />
              <Text style={styles.hudStatLabel}>SCORE</Text>
              <Text style={[styles.hudStatValue, { color: colors.primary }]}>
                {sessionScore.toLocaleString()}
              </Text>
            </View>

            <View style={styles.hudStatBox}>
              <Ionicons name="flame" size={16} color={colors.burntOrange} />
              <Text style={styles.hudStatLabel}>COMBOS</Text>
              <Text style={[styles.hudStatValue, { color: colors.warmOrange }]}>
                x{comboHits}
              </Text>
            </View>
          </View>

          {/* Interactive Gameplay Zone */}
          <View style={styles.gameArena}>
            <View style={styles.arenaCrosshair}>
              <Ionicons name="disc-outline" size={42} color={colors.primary} />
            </View>
            <Text style={styles.arenaTitle}>TARGET: CYBER EXTRACTION SECTOR</Text>
            <Text style={styles.arenaSubtitle}>
              Tap the action trigger to charge your laser railgun and advance combo multiplier.
            </Text>

            <TouchableOpacity
              style={styles.actionTriggerBtn}
              onPress={handlePerformAction}
              activeOpacity={0.7}
            >
              <Ionicons name="flash" size={18} color="#050705" style={{ marginRight: 6 }} />
              <Text style={styles.actionTriggerBtnText}>FIRE PULSE COMBO (+{Math.floor(400 + comboHits * 50)} PTS)</Text>
            </TouchableOpacity>
          </View>

          {/* Rule Verification Callout */}
          <View style={styles.strictRuleCard}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.strictRuleText}>
              Strict Rule: Only verified <Text style={{ color: colors.primary, fontWeight: '800' }}>COMPLETION</Text> turns the calendar green and extends your daily streak. Abandoning or failing leaves no streak progress.
            </Text>
          </View>

          {/* Control Actions Row */}
          <View style={styles.actionControlsRow}>
            {/* Fail Action */}
            <TouchableOpacity
              style={styles.failBtn}
              onPress={handleFail}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={15} color={colors.error} style={{ marginRight: 4 }} />
              <Text style={styles.failBtnText}>FAIL MISSION</Text>
            </TouchableOpacity>

            {/* Abandon Action */}
            <TouchableOpacity
              style={styles.abandonBtn}
              onPress={handleAbandon}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Ionicons name="exit-outline" size={15} color={colors.warmOrange} style={{ marginRight: 4 }} />
              <Text style={styles.abandonBtnText}>ABANDON</Text>
            </TouchableOpacity>

            {/* Complete Victory Action */}
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={handleComplete}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#050705" />
              ) : (
                <>
                  <Ionicons name="trophy" size={16} color="#050705" style={{ marginRight: 6 }} />
                  <Text style={styles.completeBtnText}>COMPLETE VICTORY</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 5, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    padding: 22,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  hudTitleWrap: {
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.2,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primaryText,
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : undefined,
  },
  gameCategory: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.elevatedSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeBanner: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  noticeSuccess: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderColor: colors.primary,
  },
  noticeError: {
    backgroundColor: 'rgba(255, 77, 77, 0.12)',
    borderColor: colors.error,
  },
  noticeWarning: {
    backgroundColor: 'rgba(255, 159, 67, 0.12)',
    borderColor: colors.warmOrange,
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primaryText,
  },
  noticeMsg: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
  },
  hudStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  hudStatBox: {
    flex: 1,
    backgroundColor: colors.elevatedSurface,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  hudStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.mutedText,
    letterSpacing: 0.6,
    marginTop: 4,
    marginBottom: 2,
  },
  hudStatValue: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primaryText,
  },
  gameArena: {
    backgroundColor: 'rgba(9, 17, 11, 0.95)',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    alignItems: 'center',
    marginBottom: 16,
  },
  arenaCrosshair: {
    marginBottom: 8,
  },
  arenaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 4,
  },
  arenaSubtitle: {
    fontSize: 11,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  actionTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  actionTriggerBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 0.6,
  },
  strictRuleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 30, 24, 0.7)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
    marginBottom: 16,
  },
  strictRuleText: {
    flex: 1,
    fontSize: 11,
    color: colors.secondaryText,
    lineHeight: 15,
  },
  actionControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  failBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  failBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.error,
  },
  abandonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 67, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 67, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  abandonBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.warmOrange,
  },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
  },
  completeBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 0.6,
  },
});
