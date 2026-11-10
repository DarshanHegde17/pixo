import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const PathFinderHUD = ({
  stage,
  timerSeconds = 0,
  movesCount = 0,
  mistakesCount = 0,
  hintsRemaining = 3,
  onHintPress,
  onResetPress,
  onPausePress,
  isLocked = false,
}) => {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const maxMoves = stage?.maxMoves || null;

  return (
    <View style={styles.hudContainer}>
      {/* Top Header Row: Stage, Difficulty & Action Buttons */}
      <View style={styles.topRow}>
        <View style={styles.stageInfoCol}>
          <View style={styles.badgeRow}>
            <View style={styles.stageBadge}>
              <Text style={styles.stageBadgeText}>
                {stage?.name ? stage.name.toUpperCase() : 'STAGE 1'}
              </Text>
            </View>
            <View style={styles.diffBadge}>
              <Text style={styles.diffBadgeText}>
                {stage?.difficulty ? stage.difficulty.toUpperCase() : 'BEGINNER'}
              </Text>
            </View>
          </View>
          <Text style={styles.stageTitle} numberOfLines={1}>
            {stage?.title || 'Path Finder'}
          </Text>
        </View>

        {/* HUD Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.hudBtn, styles.hintBtn]}
            onPress={onHintPress}
            activeOpacity={0.7}
            disabled={isLocked || hintsRemaining <= 0}
          >
            <Ionicons name="bulb-outline" size={16} color="#00E5FF" />
            <Text style={styles.hintBtnText}>{hintsRemaining}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.hudBtn}
            onPress={onResetPress}
            activeOpacity={0.7}
            disabled={isLocked}
          >
            <Ionicons name="refresh" size={17} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.hudBtn, styles.pauseBtn]}
            onPress={onPausePress}
            activeOpacity={0.7}
          >
            <Ionicons name="pause" size={16} color="#39FF14" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Metrics Row: Timer, Moves, Mistakes */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Ionicons name="time-outline" size={13} color="#94A3B8" style={styles.metricIcon} />
          <Text style={styles.metricLabel}>TIMER</Text>
          <Text style={styles.metricValue}>{formatTime(timerSeconds)}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Ionicons name="footsteps-outline" size={13} color="#94A3B8" style={styles.metricIcon} />
          <Text style={styles.metricLabel}>MOVES</Text>
          <Text style={[styles.metricValue, maxMoves && movesCount > maxMoves && styles.metricAlert]}>
            {movesCount}
            {maxMoves ? ` / ${maxMoves}` : ''}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Ionicons name="alert-circle-outline" size={13} color="#94A3B8" style={styles.metricIcon} />
          <Text style={styles.metricLabel}>MISTAKES</Text>
          <Text style={[styles.metricValue, mistakesCount > 0 && styles.mistakeValue]}>
            {mistakesCount}
          </Text>
        </View>
      </View>

      {/* Objective Banner */}
      {stage?.objective ? (
        <View style={styles.objectiveBanner}>
          <Ionicons name="flag-outline" size={13} color="#39FF14" style={{ marginRight: 6 }} />
          <Text style={styles.objectiveText} numberOfLines={2}>
            {stage.objective}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  hudContainer: {
    backgroundColor: '#0a100b',
    borderWidth: 1,
    borderColor: '#192b1b',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stageInfoCol: {
    flex: 1,
    marginRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  stageBadge: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
  },
  stageBadgeText: {
    color: '#39FF14',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  diffBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
  },
  diffBadgeText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stageTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#121a13',
    borderWidth: 1,
    borderColor: '#223524',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  hintBtn: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    width: 'auto',
    minWidth: 44,
    borderColor: 'rgba(0, 229, 255, 0.4)',
  },
  hintBtnText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 3,
  },
  pauseBtn: {
    borderColor: 'rgba(57, 255, 20, 0.4)',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#070b08',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#142116',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    marginBottom: 2,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metricValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  metricAlert: {
    color: '#EF4444',
  },
  mistakeValue: {
    color: '#EF4444',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#18271a',
  },
  objectiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.06)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.18)',
  },
  objectiveText: {
    color: '#C6F6D5',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },
});

