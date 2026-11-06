import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { toDateKey, getAppTimezone, formatDuration } from '../../services/gamingActivityService';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const DailyStreakCalendar = ({
  completions = [],
  onSelectSession,
  streakInfo = {},
}) => {
  const timezone = getAppTimezone();
  const today = new Date();
  const todayKey = toDateKey(today, timezone);

  // Current viewed month & year
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDayModal, setSelectedDayModal] = useState(null);

  // Group verified completions by dateKey
  const { completionsByDate, completedDateSet } = useMemo(() => {
    const map = {};
    const set = new Set();
    completions.forEach((c) => {
      if (c.status === 'completed' && c.completedAt) {
        const k = toDateKey(c.completedAt, timezone);
        if (k) {
          set.add(k);
          if (!map[k]) map[k] = [];
          map[k].push(c);
        }
      }
    });
    return { completionsByDate: map, completedDateSet: set };
  }, [completions, timezone]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // Month navigation
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleTodayShortcut = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Month metadata
  const monthName = viewDate.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)

  // Monthly stats calculations
  const { completedDaysInMonth, monthlyCompletionPercentage } = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (completedDateSet.has(dateKey)) {
        count++;
      }
    }
    const pct = daysInMonth > 0 ? Math.round((count / daysInMonth) * 100) : 0;
    return { completedDaysInMonth: count, monthlyCompletionPercentage: pct };
  }, [year, month, daysInMonth, completedDateSet]);

  const currentStreakCount = typeof streakInfo?.currentStreak === 'number' ? streakInfo.currentStreak : 0;

  // Construct compact 7-column calendar cells
  const calendarCells = useMemo(() => {
    const cells = [];
    // Padding before day 1
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ type: 'empty', key: `empty-${i}` });
    }

    const currentMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isCompleted = completedDateSet.has(dateKey);
      const isToday = dateKey === todayKey;
      const isFuture = cellDate.getTime() > currentMidnight;
      const dayCompletions = completionsByDate[dateKey] || [];
      const hasMilestone = dayCompletions.some(
        (c) => Array.isArray(c.achievements) && c.achievements.length > 0
      );

      // Aggregate statistics for this day
      const gamesCount = dayCompletions.filter((c) => !c.gameId?.startsWith('q')).length;
      const missionsCount = dayCompletions.filter((c) => c.gameId?.startsWith('q')).length;
      const totalXp = dayCompletions.reduce((acc, c) => acc + (c.xpAwarded || 0), 0);
      const totalDuration = dayCompletions.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);

      cells.push({
        type: 'day',
        day: d,
        dateKey,
        isCompleted,
        isToday,
        isFuture,
        hasMilestone,
        gamesCount,
        missionsCount,
        totalXp,
        totalDuration,
        completions: dayCompletions,
        key: dateKey,
      });
    }
    return cells;
  }, [year, month, daysInMonth, firstDayOfWeek, completedDateSet, completionsByDate, todayKey]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* ========================================================= */}
        {/* 1. COMPACT HEADER BLOCK                                   */}
        {/* ========================================================= */}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <View style={styles.titleIconRow}>
              <View style={styles.calendarIconWrap}>
                <Ionicons name="calendar-outline" size={16} color="#39FF14" />
              </View>
              <Text style={styles.titleEyebrow}>DAILY STREAK CALENDAR</Text>
            </View>
            <Text style={styles.titleText}>ACTIVITY LOG</Text>
          </View>

          {/* Month Navigation & Today Shortcut */}
          <View style={styles.navControls}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={handlePrevMonth}
              activeOpacity={0.7}
              accessibilityLabel="Previous month"
            >
              <Ionicons name="chevron-back" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>{`${monthName} ${year}`}</Text>
            </View>

            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNextMonth}
              activeOpacity={0.7}
              accessibilityLabel="Next month"
            >
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.todayShortcutBtn}
              onPress={handleTodayShortcut}
              activeOpacity={0.75}
            >
              <Text style={styles.todayShortcutText}>TODAY</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 2. THREE-PILL COMPACT STATUS SUMMARY BANNER               */}
        {/* ========================================================= */}
        <View style={styles.headerStatsRow}>
          {/* Current Streak Pill */}
          <View style={styles.statPill}>
            <Ionicons name="flame" size={13} color="#FF8A00" style={{ marginRight: 5 }} />
            <Text style={styles.statPillLabel}>STREAK:</Text>
            <Text style={[styles.statPillValue, { color: '#FF8A00' }]}>{currentStreakCount} DAYS</Text>
          </View>

          {/* Completed Days Pill */}
          <View style={styles.statPill}>
            <Ionicons name="checkmark-circle" size={13} color="#39FF14" style={{ marginRight: 5 }} />
            <Text style={styles.statPillLabel}>COMPLETED:</Text>
            <Text style={[styles.statPillValue, { color: '#39FF14' }]}>
              {completedDaysInMonth} / {daysInMonth}
            </Text>
          </View>

          {/* Monthly Completion Rate Pill */}
          <View style={styles.statPill}>
            <Ionicons name="pie-chart" size={13} color="#00E5FF" style={{ marginRight: 5 }} />
            <Text style={styles.statPillLabel}>RATE:</Text>
            <Text style={[styles.statPillValue, { color: '#00E5FF' }]}>{monthlyCompletionPercentage}%</Text>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 3. COMPACT 7-COLUMN WEEKDAY HEADER                        */}
        {/* ========================================================= */}
        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((wd) => (
            <View key={wd} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{wd}</Text>
            </View>
          ))}
        </View>

        {/* ========================================================= */}
        {/* 4. COMPACT 7-COLUMN GRID OF SMALL ROUNDED-SQUARE CELLS    */}
        {/* ========================================================= */}
        <View style={styles.grid}>
          {calendarCells.map((cell) => {
            if (cell.type === 'empty') {
              return <View key={cell.key} style={styles.dayCellEmpty} />;
            }

            return (
              <TouchableOpacity
                key={cell.key}
                style={[
                  styles.dayCell,
                  cell.isCompleted && styles.dayCellCompleted,
                  cell.isToday && !cell.isCompleted && styles.dayCellTodayTarget,
                  cell.isToday && cell.isCompleted && styles.dayCellTodayCompleted,
                  cell.isFuture && styles.dayCellFuture,
                ]}
                activeOpacity={0.7}
                onPress={() => setSelectedDayModal(cell)}
              >
                <Text
                  style={[
                    styles.dayNumberText,
                    cell.isCompleted && styles.dayNumberTextCompleted,
                    cell.isToday && !cell.isCompleted && styles.dayNumberTextToday,
                    cell.isFuture && styles.dayNumberTextFuture,
                  ]}
                >
                  {cell.day}
                </Text>

                {/* Small flame icon for streak-completed days */}
                {cell.isCompleted && (
                  <View style={styles.cellIconBadge}>
                    <Ionicons name="flame" size={8} color="#FF8A00" />
                  </View>
                )}

                {/* Small star icon for achievement dates */}
                {cell.hasMilestone && (
                  <View style={styles.milestoneStarBadge}>
                    <Ionicons name="star" size={8} color="#FFD700" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ========================================================= */}
        {/* 5. COMPACT GAMING LEGEND                                  */}
        {/* ========================================================= */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendBoxCompleted]}>
              <Ionicons name="flame" size={8} color="#FF8A00" />
            </View>
            <Text style={styles.legendLabel}>Completed Streak</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendBoxTarget]} />
            <Text style={styles.legendLabel}>Today's Target</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendBoxIncomplete]} />
            <Text style={styles.legendLabel}>Incomplete</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="star" size={10} color="#FFD700" style={{ marginRight: 4 }} />
            <Text style={styles.legendLabel}>Achievement</Text>
          </View>
        </View>
      </View>

      {/* ========================================================= */}
      {/* 6. INTERACTIVE DATE ACTIVITY INSPECTION POPUP             */}
      {/* ========================================================= */}
      <Modal
        visible={!!selectedDayModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDayModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Header with Selected Date */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>TACTICAL ACTIVITY REPORT</Text>
                <Text style={styles.modalDateTitle}>{selectedDayModal?.dateKey}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDayModal(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color="#929B92" />
              </TouchableOpacity>
            </View>

            {/* Status Banner */}
            <View
              style={[
                styles.modalStatusBanner,
                selectedDayModal?.isCompleted
                  ? styles.modalStatusCompleted
                  : selectedDayModal?.isToday
                  ? styles.modalStatusToday
                  : styles.modalStatusIncomplete,
              ]}
            >
              <Ionicons
                name={
                  selectedDayModal?.isCompleted
                    ? 'shield-checkmark'
                    : selectedDayModal?.isToday
                    ? 'flame'
                    : 'close-circle'
                }
                size={16}
                color={
                  selectedDayModal?.isCompleted
                    ? '#39FF14'
                    : selectedDayModal?.isToday
                    ? '#FF8A00'
                    : '#7A8E7E'
                }
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.modalStatusText,
                  {
                    color: selectedDayModal?.isCompleted
                      ? '#39FF14'
                      : selectedDayModal?.isToday
                      ? '#FF8A00'
                      : '#929B92',
                  },
                ]}
              >
                {selectedDayModal?.isCompleted
                  ? 'VERIFIED COMPLETED DAY'
                  : selectedDayModal?.isToday
                  ? "TODAY'S STREAK TARGET (IN PROGRESS)"
                  : selectedDayModal?.isFuture
                  ? 'UPCOMING CALENDAR DATE'
                  : 'NO ACTIVITY RECORDED'}
              </Text>
            </View>

            {/* 4 Key Statistics Cards */}
            <View style={styles.modalStatsGrid}>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatLabel}>GAMES COMPLETED</Text>
                <Text style={[styles.modalStatValue, { color: '#00E5FF' }]}>
                  {selectedDayModal?.gamesCount || 0}
                </Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatLabel}>MISSIONS COMPLETED</Text>
                <Text style={[styles.modalStatValue, { color: '#39FF14' }]}>
                  {selectedDayModal?.missionsCount || 0}
                </Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatLabel}>TOTAL XP EARNED</Text>
                <Text style={[styles.modalStatValue, { color: '#FFD700' }]}>
                  +{selectedDayModal?.totalXp || 0} XP
                </Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={styles.modalStatLabel}>PLAY DURATION</Text>
                <Text style={[styles.modalStatValue, { color: '#FFFFFF' }]}>
                  {formatDuration(selectedDayModal?.totalDuration || 0)}
                </Text>
              </View>
            </View>

            {/* Completed sessions list */}
            {selectedDayModal?.completions && selectedDayModal.completions.length > 0 ? (
              <View style={styles.modalSessionsWrap}>
                <Text style={styles.modalSessionsHeading}>COMPLETED GAMEPLAY SESSIONS</Text>
                <ScrollView style={styles.modalSessionsList} showsVerticalScrollIndicator={false}>
                  {selectedDayModal.completions.map((comp) => (
                    <TouchableOpacity
                      key={comp.id}
                      style={styles.modalSessionRow}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedDayModal(null);
                        if (onSelectSession) onSelectSession(comp);
                      }}
                    >
                      <View style={styles.modalSessionIcon}>
                        <Ionicons name={comp.icon || 'game-controller'} size={15} color="#39FF14" />
                      </View>
                      <View style={styles.modalSessionInfo}>
                        <Text style={styles.modalSessionTitle}>{comp.gameTitle}</Text>
                        <Text style={styles.modalSessionSubtitle}>
                          {comp.gameMode} • {formatDuration(comp.durationSeconds)}
                        </Text>
                      </View>
                      <View style={styles.modalSessionReward}>
                        <Text style={styles.modalSessionXp}>+{comp.xpAwarded} XP</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.modalEmptyBox}>
                <Text style={styles.modalEmptyText}>
                  {selectedDayModal?.isFuture
                    ? 'Log in on this day to record verified gameplay activity.'
                    : 'No qualifying game completions were logged on this date.'}
                </Text>
              </View>
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
  card: {
    backgroundColor: '#0A130C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    padding: 14,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)' } : {}),
  },

  // 1. Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  titleBlock: {
    flex: 1,
    minWidth: 140,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  calendarIconWrap: {
    marginRight: 6,
  },
  titleEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    color: '#39FF14',
    letterSpacing: 1.2,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  monthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
  },
  monthBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#39FF14',
    letterSpacing: 0.5,
  },
  todayShortcutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 138, 0, 0.15)',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 0, 0.4)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  todayShortcutText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FF8A00',
    letterSpacing: 0.6,
  },

  // 2. Three-Pill Summary Row
  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  statPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7A8E7E',
    marginRight: 4,
  },
  statPillValue: {
    fontSize: 9.5,
    fontWeight: '900',
  },

  // 3. Weekday Row
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  weekdayText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6E7E70',
    letterSpacing: 0.5,
  },

  // 4. 7-Column Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 5,
  },
  dayCellEmpty: {
    width: '14.285%',
    aspectRatio: 1,
    maxWidth: 42,
  },
  dayCell: {
    width: '14.285%',
    maxWidth: 42,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0D150F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
    marginVertical: 1,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  dayCellCompleted: {
    backgroundColor: 'rgba(57, 255, 20, 0.16)',
    borderColor: '#39FF14',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 8px rgba(57, 255, 20, 0.35)' } : {}),
  },
  dayCellTodayTarget: {
    borderColor: '#FF8A00',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 138, 0, 0.12)',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 8px rgba(255, 138, 0, 0.4)' } : {}),
  },
  dayCellTodayCompleted: {
    borderColor: '#39FF14',
    borderWidth: 1.5,
    backgroundColor: 'rgba(57, 255, 20, 0.22)',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 10px rgba(57, 255, 20, 0.5)' } : {}),
  },
  dayCellFuture: {
    opacity: 0.35,
    backgroundColor: '#080E09',
  },
  dayNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#929B92',
  },
  dayNumberTextCompleted: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  dayNumberTextToday: {
    color: '#FF8A00',
    fontWeight: '900',
  },
  dayNumberTextFuture: {
    color: '#4A584C',
  },
  cellIconBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  milestoneStarBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
  },

  // 5. Legend
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendBoxCompleted: {
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
    borderWidth: 1,
    borderColor: '#39FF14',
  },
  legendBoxTarget: {
    backgroundColor: 'rgba(255, 138, 0, 0.2)',
    borderWidth: 1.5,
    borderColor: '#FF8A00',
  },
  legendBoxIncomplete: {
    backgroundColor: '#0D150F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  legendLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#7A8E7E',
  },

  // 6. Interactive Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0D1610',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    padding: 16,
    ...(Platform.OS === 'web' ? { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.9)' } : {}),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  modalEyebrow: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#39FF14',
    letterSpacing: 1,
  },
  modalDateTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  modalStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalStatusCompleted: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  modalStatusToday: {
    backgroundColor: 'rgba(255, 138, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 0, 0.35)',
  },
  modalStatusIncomplete: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  modalStatItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 8,
  },
  modalStatLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#7A8E7E',
    marginBottom: 2,
  },
  modalStatValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  modalSessionsWrap: {
    marginTop: 4,
  },
  modalSessionsHeading: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#929B92',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalSessionsList: {
    maxHeight: 140,
  },
  modalSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 8,
    marginBottom: 6,
  },
  modalSessionIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modalSessionInfo: {
    flex: 1,
  },
  modalSessionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSessionSubtitle: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#7A8E7E',
  },
  modalSessionReward: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderRadius: 4,
  },
  modalSessionXp: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#00E5FF',
  },
  modalEmptyBox: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyText: {
    fontSize: 10.5,
    color: '#7A8E7E',
    textAlign: 'center',
  },
});
