import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const PathFinderIntroScreen = ({
  onStartPuzzle,
  onResumePuzzle,
  onNewPuzzle,
  onExit,
  savedSession = null,
  unlockedStage = 1,
}) => {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onExit} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#F8FAFC" />
          <Text style={styles.backBtnText}>Exit</Text>
        </TouchableOpacity>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>PIXO BRAIN SYSTEM</Text>
        </View>
      </View>

      {/* Hero Badge & Title */}
      <View style={styles.heroBox}>
        <View style={styles.heroIconCircle}>
          <Ionicons name="git-merge" size={44} color="#39FF14" />
        </View>

        <Text style={styles.gameTitle}>PATH FINDER</Text>
        <Text style={styles.tagline}>"Think Smart. Find the Path. Reach the Goal."</Text>

        <Text style={styles.description}>
          Challenge your brain with exciting path puzzles. Find the correct route, avoid obstacles,
          solve clues, and reach the destination.
        </Text>
      </View>

      {/* Feature Highlights Grid */}
      <View style={styles.featuresGrid}>
        <View style={styles.featureItem}>
          <Ionicons name="speedometer-outline" size={18} color="#00E5FF" />
          <Text style={styles.featureTitle}>Difficulty</Text>
          <Text style={styles.featureSub}>Easy to Expert</Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="star" size={18} color="#FFD700" />
          <Text style={styles.featureTitle}>Rating 4.8</Text>
          <Text style={styles.featureSub}>1,420+ Reviews</Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="cloud-done-outline" size={18} color="#39FF14" />
          <Text style={styles.featureTitle}>Cloud Saved</Text>
          <Text style={styles.featureSub}>Auto-Sync</Text>
        </View>

        <View style={styles.featureItem}>
          <Ionicons name="finger-print-outline" size={18} color="#A78BFA" />
          <Text style={styles.featureTitle}>Touch Ready</Text>
          <Text style={styles.featureSub}>Mobile Swipe</Text>
        </View>
      </View>

      {/* 4 Game Modes Summary Card */}
      <View style={styles.modesSummaryCard}>
        <Text style={styles.modesSummaryTitle}>4 BRAIN MODES • 10 PROGRESSIVE STAGES</Text>
        <View style={styles.modesList}>
          <View style={styles.modeRow}>
            <View style={[styles.modePill, { borderColor: '#39FF14' }]}>
              <Text style={[styles.modePillText, { color: '#39FF14' }]}>MODE 1</Text>
            </View>
            <Text style={styles.modeRowTitle}>Classic Path</Text>
            <Text style={styles.modeRowDesc}>Navigate from Start to Finish avoiding obstacles</Text>
          </View>

          <View style={styles.modeRow}>
            <View style={[styles.modePill, { borderColor: '#00E5FF' }]}>
              <Text style={[styles.modePillText, { color: '#00E5FF' }]}>MODE 2</Text>
            </View>
            <Text style={styles.modeRowTitle}>Number Path</Text>
            <Text style={styles.modeRowDesc}>Connect numbered tiles in strict ascending sequence</Text>
          </View>

          <View style={styles.modeRow}>
            <View style={[styles.modePill, { borderColor: '#f43f5e' }]}>
              <Text style={[styles.modePillText, { color: '#f43f5e' }]}>MODE 3</Text>
            </View>
            <Text style={styles.modeRowTitle}>Trap Escape</Text>
            <Text style={styles.modeRowDesc}>Find the safe route avoiding lethal hazard traps</Text>
          </View>

          <View style={styles.modeRow}>
            <View style={[styles.modePill, { borderColor: '#FFD700' }]}>
              <Text style={[styles.modePillText, { color: '#FFD700' }]}>MODE 4</Text>
            </View>
            <Text style={styles.modeRowTitle}>Logic Challenge</Text>
            <Text style={styles.modeRowDesc}>Collect security keys and respect tight move limits</Text>
          </View>
        </View>
      </View>

      {/* Unfinished Session Resume Box (Section 11) */}
      {savedSession && savedSession.stageId ? (
        <View style={styles.savedSessionBox}>
          <View style={styles.savedSessionHeader}>
            <Ionicons name="time" size={18} color="#FFD700" />
            <Text style={styles.savedSessionTitle}>UNFINISHED PUZZLE IN PROGRESS</Text>
          </View>
          <Text style={styles.savedSessionSub}>
            Stage {savedSession.stageId} • {savedSession.moveCount || 0} moves drawn •{' '}
            {savedSession.timer || 0}s elapsed
          </Text>

          <View style={styles.savedSessionActions}>
            <TouchableOpacity
              style={styles.resumeBtn}
              onPress={onResumePuzzle}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={18} color="#000" />
              <Text style={styles.resumeBtnText}>RESUME PUZZLE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newPuzzleBtn}
              onPress={onNewPuzzle}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="#94A3B8" />
              <Text style={styles.newPuzzleBtnText}>NEW PUZZLE</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Main Start / Stage Selection Button */}
      <TouchableOpacity
        style={styles.startBtn}
        onPress={onStartPuzzle}
        activeOpacity={0.85}
      >
        <Ionicons name="play" size={20} color="#000" style={{ marginRight: 8 }} />
        <Text style={styles.startBtnText}>START PUZZLE</Text>
      </TouchableOpacity>

      {/* Exit to Dashboard Button */}
      <TouchableOpacity
        style={styles.exitDashboardBtn}
        onPress={onExit}
        activeOpacity={0.7}
      >
        <Text style={styles.exitDashboardText}>EXIT TO DASHBOARD</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#050805',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  navRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  },
  backBtnText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#39FF14',
    marginRight: 6,
  },
  liveText: {
    color: '#39FF14',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroBox: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  heroIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderWidth: 2,
    borderColor: '#39FF14',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#39FF14',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  gameTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  tagline: {
    color: '#39FF14',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 380,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    marginBottom: 20,
  },
  featureItem: {
    width: '48%',
    backgroundColor: '#0a120c',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#182b1c',
    alignItems: 'center',
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
  featureSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  modesSummaryCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#080e0a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#192b1b',
    padding: 14,
    marginBottom: 20,
  },
  modesSummaryTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
    textAlign: 'center',
  },
  modesList: {
    gap: 8,
  },
  modeRow: {
    flexDirection: 'column',
    backgroundColor: '#0d160f',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#172719',
  },
  modePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 4,
  },
  modePillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modeRowTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  modeRowDesc: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
  },
  savedSessionBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  savedSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  savedSessionTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  savedSessionSub: {
    color: '#CBD5E1',
    fontSize: 12,
    marginBottom: 14,
    textAlign: 'center',
  },
  savedSessionActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  resumeBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#FFD700',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  resumeBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  newPuzzleBtn: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#162217',
    borderWidth: 1,
    borderColor: '#29432d',
    paddingVertical: 12,
    borderRadius: 10,
  },
  newPuzzleBtnText: {
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 4,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#39FF14',
    width: '100%',
    maxWidth: 420,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#39FF14',
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 6,
  },
  startBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  exitDashboardBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  exitDashboardText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

