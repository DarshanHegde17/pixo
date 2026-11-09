import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  PIXEL_KINGDOM_LEVELS,
  PixelKingdomPersistenceService,
} from '../../../services/pixelKingdomPersistenceService';
import { PixelKingdomAudio } from '../../../services/pixelKingdomAudioService';

export const PixelKingdomLevelSelect = ({
  userId,
  onSelectLevel,
  onBackToIntro,
}) => {
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState([]);
  const [highScores, setHighScores] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadProgression = useCallback(async () => {
    try {
      const [unlocked, completed, scores] = await Promise.all([
        PixelKingdomPersistenceService.getUnlockedLevel(userId),
        PixelKingdomPersistenceService.getCompletedLevels(userId),
        PixelKingdomPersistenceService.getHighScores(userId),
      ]);
      setUnlockedLevel(unlocked || 1);
      setCompletedLevels(completed || []);
      setHighScores(scores || {});
    } catch (e) {
      console.warn('Failed to load Pixel Kingdom progression:', e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProgression();
  }, [loadProgression]);

  const handleCardPress = (lvl) => {
    const isUnlocked = lvl.level <= unlockedLevel;
    if (!isUnlocked) {
      PixelKingdomAudio.playHit();
      Alert.alert(
        'Mission Locked 🔒',
        `Complete Level ${lvl.level - 1} (${PIXEL_KINGDOM_LEVELS[lvl.level - 2]?.title || 'previous'}) to unlock ${lvl.title}.`,
        [{ text: 'Understood' }]
      );
      return;
    }

    PixelKingdomAudio.playJump();
    onSelectLevel(lvl.level);
  };

  return (
    <View style={styles.container}>
      {/* Top Header Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBackToIntro} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color="#39FF14" style={{ marginRight: 6 }} />
          <Text style={styles.backButtonText}>INTRO</Text>
        </TouchableOpacity>

        <View style={styles.progressionBadge}>
          <Ionicons name="trophy" size={13} color="#FFD700" style={{ marginRight: 4 }} />
          <Text style={styles.progressionBadgeText}>
            {completedLevels.length} / 10 COMPLETED
          </Text>
        </View>
      </View>

      {/* Screen Title Block */}
      <View style={styles.titleSection}>
        <View style={styles.titleBadge}>
          <Ionicons name="map" size={13} color="#39FF14" style={{ marginRight: 5 }} />
          <Text style={styles.titleBadgeText}>CAMPAIGN PROGRESSION</Text>
        </View>
        <Text style={styles.mainTitle}>MISSION LEVEL SELECTION</Text>
        <Text style={styles.subTitle}>
          Sequential progression • Complete each level to unlock the next.
        </Text>
      </View>

      {/* Scrollable Levels Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.levelsGrid}>
          {PIXEL_KINGDOM_LEVELS.map((lvl) => {
            const isCompleted = completedLevels.includes(lvl.level);
            const isUnlocked = lvl.level <= unlockedLevel;
            const isCurrentTarget = lvl.level === unlockedLevel && !isCompleted;
            const bestScore = highScores[lvl.level] || 0;

            let statusLabel = 'LOCKED';
            let statusColor = '#64748B';
            if (isCompleted) {
              statusLabel = 'COMPLETED';
              statusColor = '#39FF14';
            } else if (isUnlocked) {
              statusLabel = 'UNLOCKED';
              statusColor = '#00E5FF';
            }

            return (
              <TouchableOpacity
                key={lvl.level}
                style={[
                  styles.levelCard,
                  isUnlocked ? styles.levelCardUnlocked : styles.levelCardLocked,
                  isCurrentTarget && styles.levelCardTarget,
                ]}
                onPress={() => handleCardPress(lvl)}
                activeOpacity={isUnlocked ? 0.75 : 0.9}
              >
                <LinearGradient
                  colors={
                    isCompleted
                      ? ['#0D2413', '#061309']
                      : isUnlocked
                      ? ['#0F2128', '#071014']
                      : ['#111612', '#0A0E0B']
                  }
                  style={styles.cardGradient}
                >
                  {/* Top Row: Stage Badge & Lock Icon */}
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.stagePill,
                        { borderColor: lvl.accentColor },
                        lvl.isBossLevel && styles.bossStagePill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stagePillText,
                          { color: lvl.isBossLevel ? '#FFD700' : lvl.accentColor },
                        ]}
                      >
                        {lvl.badge}
                      </Text>
                    </View>

                    <View style={styles.lockIconWrap}>
                      {isCompleted ? (
                        <Ionicons name="checkmark-circle" size={18} color="#39FF14" />
                      ) : isUnlocked ? (
                        <Ionicons name="lock-open" size={17} color="#00E5FF" />
                      ) : (
                        <Ionicons name="lock-closed" size={17} color="#64748B" />
                      )}
                    </View>
                  </View>

                  {/* Level Thumbnail / Icon Banner */}
                  <View style={styles.thumbnailContainer}>
                    <View
                      style={[
                        styles.thumbCircle,
                        { borderColor: lvl.accentColor },
                        !isUnlocked && { opacity: 0.4 },
                      ]}
                    >
                      <Ionicons
                        name={
                          lvl.isBossLevel
                            ? 'skull'
                            : lvl.bgTheme === 'forest'
                            ? 'leaf'
                            : lvl.bgTheme === 'ruins'
                            ? 'cube'
                            : lvl.bgTheme === 'volcano'
                            ? 'flame'
                            : 'shield'
                        }
                        size={22}
                        color={isUnlocked ? lvl.accentColor : '#64748B'}
                      />
                    </View>
                    <View style={styles.levelNumberBox}>
                      <Text style={styles.levelNumberText}>LVL {lvl.level}</Text>
                    </View>
                  </View>

                  {/* Mission Title & Subtitle */}
                  <Text
                    style={[
                      styles.levelTitle,
                      !isUnlocked && { color: '#94A3B8' },
                    ]}
                    numberOfLines={1}
                  >
                    {lvl.title}
                  </Text>
                  <Text style={styles.levelSubtitle} numberOfLines={1}>
                    {lvl.subtitle}
                  </Text>

                  {/* Mission Objective Snip */}
                  <Text style={styles.objectiveSnip} numberOfLines={2}>
                    {isUnlocked ? lvl.objective : 'Complete the previous mission to unlock.'}
                  </Text>

                  {/* Card Footer: Difficulty & Status */}
                  <View style={styles.cardFooter}>
                    <View style={styles.diffPill}>
                      <View style={[styles.diffDot, { backgroundColor: lvl.difficultyColor }]} />
                      <Text style={[styles.diffText, { color: lvl.difficultyColor }]}>
                        {lvl.difficulty}
                      </Text>
                    </View>

                    <View style={[styles.statusPill, { borderColor: statusColor }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {statusLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Best Score (if available) */}
                  {bestScore > 0 && (
                    <View style={styles.bestScoreRow}>
                      <Ionicons name="ribbon-outline" size={12} color="#FFD700" style={{ marginRight: 4 }} />
                      <Text style={styles.bestScoreText}>BEST: {bestScore} PTS</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050A06',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 255, 20, 0.15)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#39FF14',
    letterSpacing: 0.8,
  },
  progressionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  progressionBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.6,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  titleBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#39FF14',
    letterSpacing: 1,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : undefined,
  },
  subTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  levelCard: {
    width: '48%',
    minWidth: 150,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 4,
  },
  levelCardUnlocked: {
    borderColor: 'rgba(0, 229, 255, 0.35)',
  },
  levelCardLocked: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    opacity: 0.7,
  },
  levelCardTarget: {
    borderColor: '#39FF14',
    borderWidth: 1.5,
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  cardGradient: {
    padding: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stagePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bossStagePill: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  stagePillText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lockIconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  thumbCircle: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#0B150F',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumberBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  levelNumberText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
  },
  levelTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  levelSubtitle: {
    fontSize: 10,
    color: '#718096',
    marginTop: 1,
  },
  objectiveSnip: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 6,
    minHeight: 26,
    lineHeight: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  diffPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diffDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  diffText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  bestScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  bestScoreText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFD700',
  },
});

