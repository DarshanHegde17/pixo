import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import {
  STREAK_ACHIEVEMENT_MILESTONES,
  GamingActivityService,
  toDateKey,
  getAppTimezone,
} from '../../services/gamingActivityService';
import { FieryDualRing } from './FieryDualRing';

export const StreakSummaryCard = ({
  streakInfo = {},
  completions = [],
  userId,
  onClaimMilestoneReward,
}) => {
  const timezone = getAppTimezone();
  const todayKey = toDateKey(new Date(), timezone);

  const currentStreak = typeof streakInfo?.currentStreak === 'number' ? streakInfo.currentStreak : 0;
  const longestStreak = typeof streakInfo?.longestStreak === 'number' ? streakInfo.longestStreak : currentStreak;
  const lastCompletionDate = streakInfo?.lastCompletionDate || null;

  // Check if today has a verified completion
  const hasCompletedToday = useMemo(() => {
    return completions.some(
      (c) => c.status === 'completed' && toDateKey(c.completedAt, timezone) === todayKey
    );
  }, [completions, timezone, todayKey]);

  // Next milestone calculation
  const nextMilestoneObj = useMemo(() => {
    return (
      STREAK_ACHIEVEMENT_MILESTONES.find((m) => m.days > currentStreak) ||
      STREAK_ACHIEVEMENT_MILESTONES[STREAK_ACHIEVEMENT_MILESTONES.length - 1]
    );
  }, [currentStreak]);

  const nextMilestoneDays = nextMilestoneObj.days;

  // Progress to next milestone calculation
  // Prompt example: Current streak: 5 days, Next milestone: 7 days, Progress: 71%
  const milestoneProgressPercent = useMemo(() => {
    if (currentStreak >= 365) return 100;
    if (nextMilestoneDays <= 0) return 0;
    return Math.min(100, Math.round((currentStreak / nextMilestoneDays) * 100));
  }, [currentStreak, nextMilestoneDays]);

  const daysRemainingToNext = Math.max(0, nextMilestoneDays - currentStreak);

  // Claimed milestones state
  const [claimedMilestones, setClaimedMilestones] = useState([]);
  const [selectedMilestoneModal, setSelectedMilestoneModal] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);

  // Load claimed milestones from service
  const loadClaimedMilestones = useCallback(async () => {
    if (!userId) return;
    try {
      const claimed = await GamingActivityService.getClaimedStreakMilestones(userId);
      setClaimedMilestones(claimed || []);
    } catch (e) {
      console.warn('Failed to load claimed milestones:', e);
    }
  }, [userId]);

  useEffect(() => {
    loadClaimedMilestones();
  }, [loadClaimedMilestones]);

  // Subtle flame pulse animation
  const flameScaleAnim = useRef(new Animated.Value(1)).current;
  const flameGlowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(flameScaleAnim, {
            toValue: 1.12,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(flameGlowAnim, {
            toValue: 0.9,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(flameScaleAnim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(flameGlowAnim, {
            toValue: 0.5,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [flameScaleAnim, flameGlowAnim]);

  // Handle claiming a milestone reward
  const handleClaimReward = async (milestone) => {
    if (!userId || isClaiming) return;
    setIsClaiming(true);
    try {
      const res = await GamingActivityService.claimStreakMilestone(userId, milestone.days);
      if (res && res.success) {
        await loadClaimedMilestones();
        if (onClaimMilestoneReward) onClaimMilestoneReward();
        setSelectedMilestoneModal(null);
        Alert.alert(
          'Milestone Claimed! 🏆',
          `Congratulations! You claimed the "${milestone.title}" achievement (+${milestone.rewardXp} XP & +${milestone.rewardCoins} Coins)!`
        );
      } else {
        Alert.alert('Notice', res?.error || 'Unable to claim milestone.');
      }
    } catch (e) {
      console.warn('Error claiming milestone:', e);
      Alert.alert('Error', 'An error occurred while claiming milestone reward.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardOuter}>
        {/* ========================================================= */}
        {/* 1. TOP HEADER: CIRCULAR FLAME INDICATOR & STREAK BANNER   */}
        {/* ========================================================= */}
        <View style={styles.topSection}>
          {/* Fiery Dual-Ring Circular Indicator (Green Crystal + Blazing Fire) */}
          <View style={styles.circularFlameWrap}>
            <FieryDualRing
              size={76}
              centerValue={currentStreak}
              centerLabel="DAYS"
              iconName="flame"
              iconColor="#FF8A00"
            />
          </View>

          {/* Title & Status Block */}
          <View style={styles.headerInfoBlock}>
            <View style={styles.eyebrowRow}>
              <Ionicons name="ribbon-outline" size={13} color="#FF8A00" style={{ marginRight: 4 }} />
              <Text style={styles.eyebrowText}>STREAK ACHIEVEMENT SYSTEM</Text>
            </View>
            <Text style={styles.mainTitleText}>
              {currentStreak > 0 ? `${currentStreak}-DAY STREAK ACTIVE` : 'IGNITE YOUR STREAK'}
            </Text>

            {/* Dynamic Status Callout Pill */}
            <View
              style={[
                styles.statusCallout,
                hasCompletedToday ? styles.statusCalloutSuccess : styles.statusCalloutWarning,
              ]}
            >
              <Ionicons
                name={hasCompletedToday ? 'shield-checkmark' : 'alert-circle'}
                size={14}
                color={hasCompletedToday ? '#39FF14' : '#FF8A00'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.statusCalloutText,
                  hasCompletedToday ? styles.statusCalloutTextSuccess : styles.statusCalloutTextWarning,
                ]}
                numberOfLines={1}
              >
                {hasCompletedToday
                  ? 'Flame locked in for today!'
                  : currentStreak > 0
                  ? 'Play today to extend your streak!'
                  : 'Play a game today to ignite streak!'}
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 2. FOUR COMPACT ACHIEVEMENT STATISTICS CARDS              */}
        {/* ========================================================= */}
        <View style={styles.statsRow}>
          {/* 1. Current Streak */}
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="flame" size={14} color="#FF8A00" />
            </View>
            <Text style={styles.statLabel}>CURRENT</Text>
            <Text style={[styles.statValue, { color: '#FF8A00' }]}>{currentStreak}d</Text>
          </View>

          {/* 2. Longest Streak */}
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="trophy" size={14} color="#FFD700" />
            </View>
            <Text style={styles.statLabel}>LONGEST</Text>
            <Text style={[styles.statValue, { color: '#FFD700' }]}>{longestStreak}d</Text>
          </View>

          {/* 3. Next Milestone */}
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="locate" size={14} color="#39FF14" />
            </View>
            <Text style={styles.statLabel}>NEXT GOAL</Text>
            <Text style={[styles.statValue, { color: '#39FF14' }]}>{nextMilestoneDays}d</Text>
          </View>

          {/* 4. Last Completed Date */}
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="calendar-outline" size={14} color="#00E5FF" />
            </View>
            <Text style={styles.statLabel}>LAST LOGGED</Text>
            <Text style={[styles.statValue, { color: '#00E5FF', fontSize: 11 }]} numberOfLines={1}>
              {lastCompletionDate || (hasCompletedToday ? 'Today' : 'None')}
            </Text>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 3. PROGRESS TO NEXT MILESTONE                             */}
        {/* ========================================================= */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeaderRow}>
            <View style={styles.progressTitleLeft}>
              <Ionicons name="trending-up" size={13} color="#39FF14" style={{ marginRight: 5 }} />
              <Text style={styles.progressGoalText}>
                TARGET: <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{nextMilestoneObj.title}</Text> ({nextMilestoneDays} Days)
              </Text>
            </View>
            <Text style={styles.progressPercentText}>{milestoneProgressPercent}%</Text>
          </View>

          {/* Progress Bar Track & Glow Fill */}
          <View style={styles.progressBarTrack}>
            <LinearGradient
              colors={['#FF8A00', '#39FF14']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${milestoneProgressPercent}%` }]}
            />
          </View>

          <View style={styles.progressSubRow}>
            <Text style={styles.progressRemainingText}>
              {daysRemainingToNext === 0
                ? 'Milestone achieved! Claim your reward.'
                : `${daysRemainingToNext} day${daysRemainingToNext > 1 ? 's' : ''} left to unlock this milestone.`}
            </Text>
            <Text style={styles.progressFractionText}>
              {currentStreak}/{nextMilestoneDays}
            </Text>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 4. ACHIEVEMENT MILESTONES (11 BADGES RACK)                */}
        {/* ========================================================= */}
        <View style={styles.milestonesSection}>
          <View style={styles.milestonesHeaderRow}>
            <Text style={styles.milestonesHeading}>STREAK MILESTONES & REWARDS</Text>
            <Text style={styles.milestonesCountText}>
              {claimedMilestones.length}/{STREAK_ACHIEVEMENT_MILESTONES.length} CLAIMED
            </Text>
          </View>

          <View style={styles.milestonesGrid}>
            {STREAK_ACHIEVEMENT_MILESTONES.map((m) => {
              const isUnlocked = currentStreak >= m.days;
              const isClaimed = claimedMilestones.some((c) => c.days === m.days);
              const isNext = nextMilestoneDays === m.days;

              return (
                <TouchableOpacity
                  key={m.days}
                  style={[
                    styles.milestoneBadgeCard,
                    isUnlocked && styles.milestoneBadgeUnlocked,
                    isClaimed && styles.milestoneBadgeClaimed,
                    isNext && !isUnlocked && styles.milestoneBadgeNext,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedMilestoneModal(m)}
                >
                  {/* Badge Icon */}
                  <View
                    style={[
                      styles.milestoneIconWrap,
                      isUnlocked ? styles.milestoneIconUnlocked : styles.milestoneIconLocked,
                    ]}
                  >
                    <Ionicons
                      name={
                        isClaimed
                          ? 'checkmark-circle'
                          : isUnlocked
                          ? m.icon || 'trophy'
                          : 'lock-closed'
                      }
                      size={14}
                      color={isClaimed ? '#39FF14' : isUnlocked ? '#FFD700' : '#6E7E70'}
                    />
                  </View>

                  {/* Badge Text */}
                  <View style={styles.milestoneTextCol}>
                    <Text
                      style={[
                        styles.milestoneDaysText,
                        isUnlocked && styles.milestoneDaysTextUnlocked,
                      ]}
                      numberOfLines={1}
                    >
                      {m.days}d • {m.title}
                    </Text>

                    <Text style={styles.milestoneStatusSubText} numberOfLines={1}>
                      {isClaimed
                        ? 'CLAIMED'
                        : isUnlocked
                        ? 'READY TO CLAIM'
                        : `${m.days - currentStreak}d to unlock`}
                    </Text>
                  </View>

                  {/* Right Status Indicator */}
                  {isUnlocked && !isClaimed ? (
                    <View style={styles.claimReadyChip}>
                      <Text style={styles.claimReadyChipText}>CLAIM</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* ========================================================= */}
      {/* 5. MILESTONE CELEBRATION / DETAIL MODAL                   */}
      {/* ========================================================= */}
      <Modal
        visible={!!selectedMilestoneModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMilestoneModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedMilestoneModal(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#929B92" />
            </TouchableOpacity>

            {/* Glowing Icon */}
            {selectedMilestoneModal && (
              <>
                <View
                  style={[
                    styles.modalIconCircle,
                    currentStreak >= selectedMilestoneModal.days
                      ? styles.modalIconCircleUnlocked
                      : styles.modalIconCircleLocked,
                  ]}
                >
                  <Ionicons
                    name={
                      currentStreak >= selectedMilestoneModal.days
                        ? selectedMilestoneModal.icon || 'trophy'
                        : 'lock-closed'
                    }
                    size={32}
                    color={
                      currentStreak >= selectedMilestoneModal.days ? '#FFD700' : '#6E7E70'
                    }
                  />
                </View>

                {/* Title & Badge Level */}
                <Text style={styles.modalTitle}>{selectedMilestoneModal.title}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedMilestoneModal.days}-DAY TACTICAL MILESTONE
                </Text>

                {/* Status Message */}
                <Text style={styles.modalDesc}>
                  {currentStreak >= selectedMilestoneModal.days
                    ? `Outstanding commitment! You have maintained an unbroken ${selectedMilestoneModal.days}-day streak on PIXO.`
                    : `Maintain your daily gameplay streak for ${selectedMilestoneModal.days} consecutive days to conquer this achievement.`}
                </Text>

                {/* Rewards Breakdown Box */}
                <View style={styles.modalRewardsBox}>
                  <Text style={styles.modalRewardsTitle}>ACHIEVEMENT BOUNTY</Text>
                  <View style={styles.modalRewardsRow}>
                    <View style={styles.modalRewardChip}>
                      <Ionicons name="flash" size={13} color="#00E5FF" style={{ marginRight: 4 }} />
                      <Text style={styles.modalXpText}>+{selectedMilestoneModal.rewardXp} XP</Text>
                    </View>
                    <View style={styles.modalRewardChip}>
                      <Ionicons name="cash" size={13} color="#FFD700" style={{ marginRight: 4 }} />
                      <Text style={styles.modalCoinText}>+{selectedMilestoneModal.rewardCoins} Coins</Text>
                    </View>
                  </View>
                </View>

                {/* Action Button */}
                {claimedMilestones.some((c) => c.days === selectedMilestoneModal.days) ? (
                  <View style={styles.modalClaimedBtn}>
                    <Ionicons name="checkmark-circle" size={16} color="#050705" style={{ marginRight: 6 }} />
                    <Text style={styles.modalClaimedBtnText}>REWARD CLAIMED</Text>
                  </View>
                ) : currentStreak >= selectedMilestoneModal.days ? (
                  <TouchableOpacity
                    style={styles.modalClaimBtn}
                    onPress={() => handleClaimReward(selectedMilestoneModal)}
                    disabled={isClaiming}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#39FF14', '#00E5FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalClaimGradient}
                    >
                      <Ionicons name="gift" size={16} color="#050705" style={{ marginRight: 6 }} />
                      <Text style={styles.modalClaimBtnText}>
                        {isClaiming ? 'PROCESSING...' : 'CLAIM REWARD'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.modalLockedBtn}>
                    <Ionicons name="lock-closed" size={14} color="#7A8E7E" style={{ marginRight: 6 }} />
                    <Text style={styles.modalLockedBtnText}>
                      {selectedMilestoneModal.days - currentStreak} MORE DAYS REQUIRED
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  cardOuter: {
    backgroundColor: '#0A130C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 0, 0.28)',
    padding: 16,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)' } : {}),
  },

  // 1. Top Section
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  circularFlameWrap: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  circularProgressRingOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#FF8A00',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 15px rgba(255, 138, 0, 0.4)' } : {}),
  },
  flameGlowBackdrop: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(255, 138, 0, 0.25)',
  },
  circularCenterBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0D170F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 0, 0.4)',
  },
  centerFlameIcon: {
    marginBottom: -2,
  },
  centerStreakNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  centerStreakLabel: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#FF8A00',
    letterSpacing: 0.8,
  },
  headerInfoBlock: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  eyebrowText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FF8A00',
    letterSpacing: 1.2,
  },
  mainTitleText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  statusCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  statusCalloutSuccess: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  statusCalloutWarning: {
    backgroundColor: 'rgba(255, 138, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 0, 0.3)',
  },
  statusCalloutText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusCalloutTextSuccess: {
    color: '#39FF14',
  },
  statusCalloutTextWarning: {
    color: '#FF8A00',
  },

  // 2. Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconWrap: {
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#7A8E7E',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '900',
  },

  // 3. Progress Container
  progressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.18)',
    padding: 10,
    marginBottom: 16,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressGoalText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#39FF14',
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FF8A00',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressRemainingText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#7A8E7E',
  },
  progressFractionText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#929B92',
  },

  // 4. Milestones Section
  milestonesSection: {
    marginTop: 2,
  },
  milestonesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  milestonesHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  milestonesCountText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#39FF14',
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  milestoneBadgeCard: {
    width: '49%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D150F',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 7,
    paddingHorizontal: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  milestoneBadgeUnlocked: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: '#39FF14',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 8px rgba(57, 255, 20, 0.25)' } : {}),
  },
  milestoneBadgeClaimed: {
    backgroundColor: 'rgba(57, 255, 20, 0.16)',
    borderColor: 'rgba(57, 255, 20, 0.6)',
  },
  milestoneBadgeNext: {
    borderColor: '#FF8A00',
    backgroundColor: 'rgba(255, 138, 0, 0.08)',
  },
  milestoneIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  milestoneIconUnlocked: {
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
  },
  milestoneIconLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  milestoneTextCol: {
    flex: 1,
  },
  milestoneDaysText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#929B92',
  },
  milestoneDaysTextUnlocked: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  milestoneStatusSubText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#6E7E70',
  },
  claimReadyChip: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: '#39FF14',
    borderRadius: 4,
  },
  claimReadyChipText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#050705',
  },

  // 5. Celebration Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0D1610',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.35)',
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    ...(Platform.OS === 'web' ? { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.9)' } : {}),
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  modalIconCircleUnlocked: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 2,
    borderColor: '#39FF14',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 15px rgba(57, 255, 20, 0.5)' } : {}),
  },
  modalIconCircleLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF8A00',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  modalDesc: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#929B92',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  modalRewardsBox: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalRewardsTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7A8E7E',
    letterSpacing: 1,
    marginBottom: 6,
  },
  modalRewardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalRewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalXpText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#00E5FF',
  },
  modalCoinText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFD700',
  },
  modalClaimBtn: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  modalClaimGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalClaimBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 0.6,
  },
  modalClaimedBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#39FF14',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalClaimedBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 0.6,
  },
  modalLockedBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalLockedBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#7A8E7E',
    letterSpacing: 0.5,
  },
});
