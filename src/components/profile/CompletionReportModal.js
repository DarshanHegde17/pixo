import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { formatDuration } from '../../services/gamingActivityService';

export const CompletionReportModal = ({
  visible,
  session,
  onClose,
}) => {
  if (!visible || !session) return null;

  const formattedDate = session.completedAt
    ? new Date(session.completedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Completion timestamp unavailable';

  const durationStr = formatDuration(session.durationSeconds);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.statusBadgeWrap}>
                <View style={styles.statusGreenDot} />
                <Text style={styles.statusBadgeText}>VERIFIED COMPLETION</Text>
              </View>
              <Text style={styles.gameTitle} numberOfLines={2}>
                {session.gameTitle}
              </Text>
              <Text style={styles.gameCategory}>
                {session.gameCategory || 'Campaign Mission'} • {session.gameMode || 'Standard Mode'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Victory / Result Banner */}
            <View style={styles.resultBanner}>
              <View style={styles.resultIconCircle}>
                <Ionicons name="trophy" size={26} color={colors.primary} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultEyebrow}>FINAL VERIFIED RESULT</Text>
                <Text style={styles.resultTitle}>{session.result || 'Victory - Completed'}</Text>
              </View>
              {session.personalBest && (
                <View style={styles.pbBadge}>
                  <Ionicons name="star" size={11} color="#050705" style={{ marginRight: 3 }} />
                  <Text style={styles.pbBadgeText}>NEW RECORD</Text>
                </View>
              )}
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              {/* Score */}
              <View style={styles.metricCard}>
                <Ionicons name="flash-outline" size={16} color={colors.primary} />
                <Text style={styles.metricLabel}>FINAL SCORE</Text>
                <Text style={styles.metricValue}>
                  {session.score !== undefined ? session.score.toLocaleString() : 'Unavailable'}
                </Text>
              </View>

              {/* XP Awarded */}
              <View style={styles.metricCard}>
                <Ionicons name="sparkles-outline" size={16} color={colors.warmOrange} />
                <Text style={styles.metricLabel}>XP EARNED</Text>
                <Text style={[styles.metricValue, { color: colors.warmOrange }]}>
                  {session.xpAwarded !== undefined ? `+${session.xpAwarded} XP` : 'Unavailable'}
                </Text>
              </View>

              {/* Duration */}
              <View style={styles.metricCard}>
                <Ionicons name="time-outline" size={16} color={colors.cyan} />
                <Text style={styles.metricLabel}>VERIFIED DURATION</Text>
                <Text style={styles.metricValue}>{durationStr}</Text>
              </View>

              {/* Timestamp */}
              <View style={styles.metricCard}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.metricLabel}>COMPLETED AT</Text>
                <Text style={[styles.metricValue, { fontSize: 11 }]} numberOfLines={1}>
                  {formattedDate}
                </Text>
              </View>
            </View>

            {/* Verified Achievements List */}
            <View style={styles.achievementsBlock}>
              <View style={styles.achievementsHeader}>
                <Ionicons name="ribbon-outline" size={16} color={colors.warmOrange} style={{ marginRight: 6 }} />
                <Text style={styles.achievementsTitle}>ACHIEVEMENTS UNLOCKED</Text>
              </View>

              {Array.isArray(session.achievements) && session.achievements.length > 0 ? (
                <View style={styles.achievementsList}>
                  {session.achievements.map((ach, idx) => (
                    <View key={idx} style={styles.achievementItem}>
                      <View style={styles.achievementOrangeStar}>
                        <Ionicons name="star" size={12} color={colors.burntOrange} />
                      </View>
                      <Text style={styles.achievementText}>{ach}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noAchievements}>
                  <Text style={styles.noAchievementsText}>Standard challenge completion.</Text>
                </View>
              )}
            </View>

            {/* Audit / Integrity Note */}
            <View style={styles.auditNote}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.auditNoteText}>
                Session ID: {session.id} • Verified against game completion rule.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.modalDoneBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.modalDoneBtnText}>CLOSE REPORT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 5, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.35)',
    padding: 22,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 255, 20, 0.15)',
  },
  headerTitleWrap: {
    flex: 1,
  },
  statusBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  statusGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primaryText,
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : undefined,
  },
  gameCategory: {
    fontSize: 12,
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
  scrollBody: {
    paddingVertical: 4,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 30, 24, 0.95)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    marginBottom: 16,
  },
  resultIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.mutedText,
    letterSpacing: 0.8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 2,
  },
  pbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmOrange,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pbBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.elevatedSurface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.mutedText,
    letterSpacing: 0.6,
    marginTop: 4,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primaryText,
  },
  achievementsBlock: {
    backgroundColor: 'rgba(21, 30, 24, 0.6)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.25)',
    marginBottom: 16,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  achievementsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.warmOrange,
    letterSpacing: 0.8,
  },
  achievementsList: {
    gap: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.2)',
  },
  achievementOrangeStar: {
    marginRight: 8,
  },
  achievementText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
  },
  noAchievements: {
    paddingVertical: 6,
  },
  noAchievementsText: {
    fontSize: 12,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  auditNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 14,
  },
  auditNoteText: {
    fontSize: 11,
    color: colors.mutedText,
  },
  modalDoneBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  modalDoneBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 0.8,
  },
});
