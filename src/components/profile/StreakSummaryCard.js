import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { STREAK_MILESTONES, toDateKey, getAppTimezone } from '../../services/gamingActivityService';

export const StreakSummaryCard = ({ streakInfo = {}, completions = [] }) => {
  const timezone = getAppTimezone();
  const todayKey = toDateKey(new Date(), timezone);

  const {
    currentStreak = 0,
    longestStreak = 0,
    lastCompletionDate = null,
    nextMilestone = 3,
    progressPercent = 0,
  } = streakInfo;

  // Check if today has a verified completion
  const hasCompletedToday = completions.some(
    (c) => c.status === 'completed' && toDateKey(c.completedAt, timezone) === todayKey
  );

  // Subtle flame pulse animation
  const flameScaleAnim = useRef(new Animated.Value(1)).current;
  const flameGlowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(flameScaleAnim, {
            toValue: 1.15,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(flameGlowAnim, {
            toValue: 0.85,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(flameScaleAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(flameGlowAnim, {
            toValue: 0.4,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [flameScaleAnim, flameGlowAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.cardOuter}>
        <LinearGradient
          colors={['rgba(255, 106, 0, 0.22)', 'rgba(9, 17, 11, 0.96)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Header Block with Flame Graphic */}
          <View style={styles.headerRow}>
            <View style={styles.flameContainer}>
              <Animated.View
                style={[
                  styles.flameGlowCircle,
                  {
                    opacity: flameGlowAnim,
                    transform: [{ scale: flameScaleAnim }],
                  },
                ]}
              />
              <View style={styles.flameBadge}>
                <Ionicons name="flame" size={32} color={colors.burntOrange} />
              </View>
            </View>

            <View style={styles.titleColumn}>
              <Text style={styles.eyebrowText}>DAILY CONSISTENCY</Text>
              <Text style={styles.titleText}>KEEP THE STREAK ALIVE</Text>
              <Text style={styles.quoteText}>
                "One completed challenge at a time. Build your legacy."
              </Text>
            </View>
          </View>

          {/* Dynamic Status Callout */}
          <View
            style={[
              styles.statusCallout,
              hasCompletedToday ? styles.statusCalloutSuccess : styles.statusCalloutWarning,
            ]}
          >
            <Ionicons
              name={hasCompletedToday ? 'shield-checkmark' : 'alert-circle'}
              size={18}
              color={hasCompletedToday ? colors.primary : colors.warmOrange}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.statusCalloutText,
                hasCompletedToday ? styles.statusCalloutTextSuccess : styles.statusCalloutTextWarning,
              ]}
            >
              {hasCompletedToday
                ? 'Streak secured for today! Flame locked in.'
                : currentStreak > 0
                ? `Complete today's challenge to extend your streak to ${currentStreak + 1} days!`
                : 'Complete your first game or mission today to ignite your streak!'}
            </Text>
          </View>

          {/* Key Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{currentStreak}</Text>
              <Text style={styles.metricLabel}>CURRENT STREAK</Text>
              <Text style={styles.metricSub}>Consecutive Days</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{longestStreak}</Text>
              <Text style={styles.metricLabel}>LONGEST RECORD</Text>
              <Text style={styles.metricSub}>All-Time Best</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{nextMilestone}</Text>
              <Text style={styles.metricLabel}>NEXT MILESTONE</Text>
              <Text style={styles.metricSub}>Days Goal</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { fontSize: 13, marginTop: 4 }]} numberOfLines={1}>
                {lastCompletionDate || 'No record'}
              </Text>
              <Text style={styles.metricLabel}>LAST COMPLETED</Text>
              <Text style={styles.metricSub}>Verified Date</Text>
            </View>
          </View>

          {/* Milestone Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressTitle}>
                PROGRESS TO {nextMilestone}-DAY MILESTONE
              </Text>
              <Text style={styles.progressPercentText}>{progressPercent}%</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <LinearGradient
                colors={['#39FF14', '#00C853']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              />
            </View>
          </View>

          {/* Milestone Badges Strip */}
          <View style={styles.milestonesStrip}>
            {STREAK_MILESTONES.map((m) => {
              const isPassed = currentStreak >= m;
              const isNext = nextMilestone === m;
              return (
                <View
                  key={m}
                  style={[
                    styles.milestonePill,
                    isPassed && styles.milestonePillPassed,
                    isNext && styles.milestonePillNext,
                  ]}
                >
                  <Ionicons
                    name={isPassed ? 'checkmark-circle' : isNext ? 'flame' : 'lock-closed'}
                    size={11}
                    color={isPassed ? '#050705' : isNext ? colors.burntOrange : colors.mutedText}
                    style={{ marginRight: 3 }}
                  />
                  <Text
                    style={[
                      styles.milestonePillText,
                      isPassed && styles.milestonePillTextPassed,
                      isNext && styles.milestonePillTextNext,
                    ]}
                  >
                    {m}d
                  </Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  cardOuter: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    overflow: 'hidden',
    shadowColor: colors.burntOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  cardGradient: {
    padding: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flameContainer: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 16,
  },
  flameGlowCircle: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 106, 0, 0.35)',
    shadowColor: colors.burntOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
  },
  flameBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(26, 17, 10, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 106, 0, 0.5)',
  },
  titleColumn: {
    flex: 1,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.warmOrange,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primaryText,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : undefined,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.secondaryText,
    marginTop: 2,
  },
  statusCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 18,
    borderWidth: 1,
  },
  statusCalloutSuccess: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: 'rgba(57, 255, 20, 0.35)',
  },
  statusCalloutWarning: {
    backgroundColor: 'rgba(255, 106, 0, 0.12)',
    borderColor: 'rgba(255, 106, 0, 0.4)',
  },
  statusCalloutText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  statusCalloutTextSuccess: {
    color: colors.primary,
  },
  statusCalloutTextWarning: {
    color: colors.warmOrange,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(17, 23, 18, 0.85)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
    marginBottom: 18,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryText,
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : undefined,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.7,
    marginTop: 2,
    textAlign: 'center',
  },
  metricSub: {
    fontSize: 10,
    color: colors.mutedText,
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primaryText,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F1811',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  milestonesStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  milestonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 23, 18, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  milestonePillPassed: {
    backgroundColor: colors.primary,
    borderColor: colors.emerald,
  },
  milestonePillNext: {
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    borderColor: colors.burntOrange,
  },
  milestonePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
  },
  milestonePillTextPassed: {
    color: '#050705',
    fontWeight: '900',
  },
  milestonePillTextNext: {
    color: colors.warmOrange,
    fontWeight: '800',
  },
});
