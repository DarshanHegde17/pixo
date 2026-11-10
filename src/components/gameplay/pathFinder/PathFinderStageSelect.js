import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PATH_FINDER_STAGES } from '../../../services/pathFinderService';

export const PathFinderStageSelect = ({
  unlockedStage = 1,
  completedStages = [],
  stageStats = {},
  onSelectStage,
  onBack,
}) => {
  const getModeColor = (mode) => {
    switch (mode) {
      case 'classic':
        return '#39FF14';
      case 'number':
        return '#00E5FF';
      case 'trap':
        return '#f43f5e';
      case 'logic':
        return '#FFD700';
      default:
        return '#39FF14';
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#F8FAFC" />
          <Text style={styles.backBtnText}>Intro</Text>
        </TouchableOpacity>

        <View style={styles.titleCol}>
          <Text style={styles.headerTitle}>STAGE SELECTION</Text>
          <Text style={styles.headerSubtitle}>
            Sequential progression • Complete each stage to unlock the next
          </Text>
        </View>
      </View>

      {/* Progress Counter */}
      <View style={styles.progressSummary}>
        <View style={styles.progItem}>
          <Text style={styles.progVal}>{completedStages.length}/10</Text>
          <Text style={styles.progLabel}>COMPLETED</Text>
        </View>
        <View style={styles.progDivider} />
        <View style={styles.progItem}>
          <Text style={[styles.progVal, { color: '#39FF14' }]}>{unlockedStage}/10</Text>
          <Text style={styles.progLabel}>UNLOCKED</Text>
        </View>
        <View style={styles.progDivider} />
        <View style={styles.progItem}>
          <Text style={[styles.progVal, { color: '#FFD700' }]}>
            {completedStages.reduce((acc, id) => {
              const s = PATH_FINDER_STAGES.find((st) => st.id === id);
              return acc + (s ? s.rewardCoins : 0);
            }, 0)}
          </Text>
          <Text style={styles.progLabel}>COINS EARNED</Text>
        </View>
      </View>

      {/* 10 Stages List */}
      <View style={styles.stagesList}>
        {PATH_FINDER_STAGES.map((stage) => {
          const isUnlocked = stage.id <= unlockedStage;
          const isCompleted = completedStages.includes(stage.id);
          const stats = stageStats[stage.id] || null;
          const modeColor = getModeColor(stage.mode);

          return (
            <TouchableOpacity
              key={`stage_${stage.id}`}
              style={[
                styles.stageCard,
                !isUnlocked && styles.stageCardLocked,
                isCompleted && styles.stageCardCompleted,
              ]}
              onPress={() => isUnlocked && onSelectStage(stage.id)}
              disabled={!isUnlocked}
              activeOpacity={0.8}
            >
              {/* Left Stage Indicator */}
              <View
                style={[
                  styles.stageNumberCircle,
                  !isUnlocked && styles.stageNumberCircleLocked,
                  isCompleted && styles.stageNumberCircleCompleted,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark-sharp" size={18} color="#000" />
                ) : !isUnlocked ? (
                  <Ionicons name="lock-closed" size={16} color="#64748B" />
                ) : (
                  <Text style={styles.stageNumberText}>{stage.id}</Text>
                )}
              </View>

              {/* Middle Info */}
              <View style={styles.stageDetailsCol}>
                <View style={styles.badgeHeaderRow}>
                  <View style={[styles.modeTag, { borderColor: modeColor }]}>
                    <Text style={[styles.modeTagText, { color: modeColor }]}>
                      {stage.modeName.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.gridSizeTag}>
                    {stage.gridSize}x{stage.gridSize} GRID
                  </Text>
                </View>

                <Text style={[styles.stageCardTitle, !isUnlocked && styles.lockedText]}>
                  {stage.name}: {stage.title}
                </Text>

                {/* Stars / Best Stats or Rewards */}
                {isCompleted && stats ? (
                  <View style={styles.statsRow}>
                    <View style={styles.starsRow}>
                      {[1, 2, 3].map((starIdx) => (
                        <Ionicons
                          key={`star_${starIdx}`}
                          name={starIdx <= (stats.stars || 1) ? 'star' : 'star-outline'}
                          size={12}
                          color="#FFD700"
                          style={{ marginRight: 2 }}
                        />
                      ))}
                    </View>
                    <Text style={styles.statsText}>
                      Best: {stats.bestMoves || 0} moves • {stats.bestTime || 0}s
                    </Text>
                  </View>
                ) : (
                  <View style={styles.rewardRow}>
                    <Ionicons name="gift-outline" size={12} color="#39FF14" style={{ marginRight: 4 }} />
                    <Text style={styles.rewardText}>
                      Reward: +{stage.rewardXp} XP • +{stage.rewardCoins} Coins
                    </Text>
                  </View>
                )}
              </View>

              {/* Right Action Arrow / Lock */}
              <View style={styles.actionCol}>
                {isUnlocked ? (
                  <View style={[styles.playPill, isCompleted && styles.replayPill]}>
                    <Text style={[styles.playPillText, isCompleted && styles.replayPillText]}>
                      {isCompleted ? 'REPLAY' : 'PLAY'}
                    </Text>
                    <Ionicons
                      name="play"
                      size={10}
                      color={isCompleted ? '#39FF14' : '#000'}
                      style={{ marginLeft: 3 }}
                    />
                  </View>
                ) : (
                  <Ionicons name="lock-closed-outline" size={18} color="#475569" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#050805',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#0f1811',
    borderWidth: 1,
    borderColor: '#1d2e20',
    marginRight: 12,
  },
  backBtnText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  titleCol: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  progressSummary: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0a120c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#182b1c',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  progItem: {
    alignItems: 'center',
  },
  progVal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  progLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.6,
  },
  progDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#162518',
  },
  stagesList: {
    width: '100%',
    maxWidth: 440,
    gap: 10,
  },
  stageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a120c',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1d3121',
    padding: 12,
  },
  stageCardLocked: {
    backgroundColor: '#070a08',
    borderColor: '#121a13',
    opacity: 0.65,
  },
  stageCardCompleted: {
    borderColor: 'rgba(57, 255, 20, 0.4)',
    backgroundColor: 'rgba(57, 255, 20, 0.04)',
  },
  stageNumberCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#142518',
    borderWidth: 1.5,
    borderColor: '#39FF14',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stageNumberCircleLocked: {
    backgroundColor: '#0e1510',
    borderColor: '#243427',
  },
  stageNumberCircleCompleted: {
    backgroundColor: '#39FF14',
    borderColor: '#39FF14',
  },
  stageNumberText: {
    color: '#39FF14',
    fontWeight: '900',
    fontSize: 15,
  },
  stageDetailsCol: {
    flex: 1,
    marginRight: 10,
  },
  badgeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modeTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 6,
  },
  modeTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  gridSizeTag: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  stageCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  lockedText: {
    color: '#64748B',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    marginRight: 6,
  },
  statsText: {
    color: '#A0AEC0',
    fontSize: 11,
    fontWeight: '600',
  },
  actionCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#39FF14',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  playPillText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  replayPill: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.5)',
  },
  replayPillText: {
    color: '#39FF14',
  },
});

