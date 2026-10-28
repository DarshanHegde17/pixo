import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';

export const PlayerStatisticsCards = ({ statistics }) => {
  const {
    totalGamesCompleted = 0,
    totalPlayTimeFormatted = '0m',
    currentStreak = 0,
    totalXpEarned = 0,
  } = statistics || {};

  const cards = [
    {
      id: 'games',
      icon: 'game-controller-outline',
      iconColor: colors.primary,
      stat: totalGamesCompleted.toLocaleString(),
      label: 'TOTAL GAMES COMPLETED',
      subtext: 'Verified unique titles',
      accentColor: colors.primary,
    },
    {
      id: 'playtime',
      icon: 'time-outline',
      iconColor: colors.cyan,
      stat: totalPlayTimeFormatted,
      label: 'TOTAL PLAY TIME',
      subtext: 'Accumulated campaign hours',
      accentColor: colors.cyan,
    },
    {
      id: 'streak',
      icon: 'flame',
      iconColor: colors.burntOrange,
      stat: `${currentStreak} ${currentStreak === 1 ? 'DAY' : 'DAYS'}`,
      label: 'CURRENT STREAK',
      subtext: 'Strict completion record',
      accentColor: colors.burntOrange,
    },
    {
      id: 'xp',
      icon: 'sparkles-outline',
      iconColor: colors.warmOrange,
      stat: `${totalXpEarned.toLocaleString()} XP`,
      label: 'TOTAL XP EARNED',
      subtext: 'Awarded by game engine',
      accentColor: colors.warmOrange,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.id} style={styles.card}>
            {/* Top orange corner accent notch */}
            <View style={[styles.cornerAccent, { backgroundColor: card.accentColor }]} />

            {/* Icon and status badge */}
            <View style={styles.iconRow}>
              <View style={[styles.iconCircle, { borderColor: `${card.accentColor}40` }]}>
                <Ionicons name={card.icon} size={20} color={card.iconColor} />
              </View>
              <View style={styles.liveIndicator}>
                <View style={[styles.liveDot, { backgroundColor: card.accentColor }]} />
              </View>
            </View>

            {/* Large Statistic Number */}
            <Text style={styles.statValue} numberOfLines={1}>
              {card.stat}
            </Text>

            {/* Short Label */}
            <Text style={styles.statLabel} numberOfLines={1}>
              {card.label}
            </Text>

            {/* Supporting Subtext */}
            <Text style={styles.statSubtext} numberOfLines={1}>
              {card.subtext}
            </Text>
          </View>
        ))}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    // 2-column on mobile, up to 4-column on desktop via flex basis
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 150,
    maxWidth: Platform.OS === 'web' ? '24%' : '48%',
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  cornerAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 3,
    borderBottomLeftRadius: 3,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(21, 30, 24, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  liveIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primaryText,
    letterSpacing: 0.5,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : undefined,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.9,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  statSubtext: {
    fontSize: 11,
    color: colors.mutedText,
    letterSpacing: 0.2,
  },
});
