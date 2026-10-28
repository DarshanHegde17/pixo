import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlowingBackground } from '../components/GlowingBackground';
import { PlayerProfileHeader } from '../components/profile/PlayerProfileHeader';
import { PlayerStatisticsCards } from '../components/profile/PlayerStatisticsCards';
import { DailyStreakCalendar } from '../components/profile/DailyStreakCalendar';
import { ActivityHeatmap } from '../components/profile/ActivityHeatmap';
import { StreakSummaryCard } from '../components/profile/StreakSummaryCard';
import { LastPlayedSection } from '../components/profile/LastPlayedSection';
import { CompletionReportModal } from '../components/profile/CompletionReportModal';
import { MonthlyGamingReport } from '../components/profile/MonthlyGamingReport';
import { GameSessionRunnerModal } from '../components/gameplay/GameSessionRunnerModal';
import { GamingActivityService } from '../services/gamingActivityService';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme';

export const ProfileScreen = ({
  onNavigateHome,
  onNavigateGames,
  onNavigateQuests,
}) => {
  const { user, logout } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [streakInfo, setStreakInfo] = useState({});

  // Active modals
  const [selectedCompletionReport, setSelectedCompletionReport] = useState(null);
  const [resumeSessionModal, setResumeSessionModal] = useState(null);

  // Fetch all user gaming activity records
  const loadProfileData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const userSessions = await GamingActivityService.getUserSessions(user.id);
      const userCompletions = await GamingActivityService.getUserCompletions(user.id);
      const userStats = await GamingActivityService.getPlayerStatistics(user.id);
      const userStreak = await GamingActivityService.calculateUserStreak(user.id);

      setSessions(userSessions);
      setCompletions(userCompletions);
      setStatistics(userStats);
      setStreakInfo(userStreak || {});
    } catch (err) {
      console.error('Failed to load profile gaming records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Handle logout
  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to exit your PIXO session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          if (logout) await logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Bar Navigation & Profile Eyebrow */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onNavigateHome}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={colors.primaryText} style={{ marginRight: 6 }} />
            <Text style={styles.backButtonText}>DASHBOARD</Text>
          </TouchableOpacity>

          <View style={styles.commandCenterBadge}>
            <View style={styles.greenOnlineDot} />
            <Text style={styles.commandCenterText}>PLAYER COMMAND CENTER</Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* 1. CENTERED PLAYER PROFILE (PICTURE, INFO, ACTIONS)       */}
        {/* ========================================================= */}
        <PlayerProfileHeader onProfileUpdated={loadProfileData} />

        {/* Loading Indicator for Heavy Data */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Syncing verified gaming logs...</Text>
          </View>
        ) : (
          <>
            {/* ========================================================= */}
            {/* 2. FOUR PLAYER-STATISTIC CARDS                            */}
            {/* ========================================================= */}
            <PlayerStatisticsCards statistics={statistics} />

            {/* ========================================================= */}
            {/* 3. DAILY COMPLETION STREAK CALENDAR                       */}
            {/* ========================================================= */}
            <DailyStreakCalendar
              completions={completions}
              onSelectSession={(comp) => setSelectedCompletionReport(comp)}
            />

            {/* ========================================================= */}
            {/* 4. MONTHLY ACTIVITY HEATMAP                               */}
            {/* ========================================================= */}
            <ActivityHeatmap completions={completions} />

            {/* ========================================================= */}
            {/* 5. CURRENT & LONGEST STREAK SUMMARY                       */}
            {/* ========================================================= */}
            <StreakSummaryCard
              streakInfo={streakInfo}
              completions={completions}
            />

            {/* ========================================================= */}
            {/* 6. RECENTLY PLAYED GAMES (LAST PLAYED)                    */}
            {/* ========================================================= */}
            <LastPlayedSection
              sessions={sessions}
              onSelectSession={(session) => setSelectedCompletionReport(session)}
              onResumeSession={(session) => setResumeSessionModal(session)}
              onBrowseGames={onNavigateGames}
            />

            {/* ========================================================= */}
            {/* 7. MONTHLY GAMING REPORT & CHART                          */}
            {/* ========================================================= */}
            <MonthlyGamingReport userId={user?.id} />
          </>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* MODAL: DETAILED COMPLETION REPORT (SECTION 10)           */}
      {/* ========================================================= */}
      <CompletionReportModal
        visible={!!selectedCompletionReport}
        session={selectedCompletionReport}
        onClose={() => setSelectedCompletionReport(null)}
      />

      {/* ========================================================= */}
      {/* MODAL: RESUME IN-PROGRESS GAMEPLAY SIMULATOR             */}
      {/* ========================================================= */}
      {resumeSessionModal && (
        <GameSessionRunnerModal
          visible={!!resumeSessionModal}
          game={{
            id: resumeSessionModal.gameId,
            title: resumeSessionModal.gameTitle,
            category: resumeSessionModal.gameCategory,
            icon: resumeSessionModal.icon,
          }}
          existingSession={resumeSessionModal}
          onClose={() => setResumeSessionModal(null)}
          onSessionUpdated={loadProfileData}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 110, // Generous padding so bottom navigation dock never covers content
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevatedSurface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: 0.8,
  },
  commandCenterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
  },
  greenOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  commandCenterText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1.2,
  },
  logoutButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 14,
    letterSpacing: 0.5,
  },
});
