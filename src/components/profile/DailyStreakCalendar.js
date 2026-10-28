import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { toDateKey, getAppTimezone } from '../../services/gamingActivityService';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const DailyStreakCalendar = ({
  completions = [],
  onSelectSession,
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

  // Construct calendar cells
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

      cells.push({
        type: 'day',
        day: d,
        dateKey,
        isCompleted,
        isToday,
        isFuture,
        hasMilestone,
        completions: dayCompletions,
        key: dateKey,
      });
    }
    return cells;
  }, [year, month, daysInMonth, firstDayOfWeek, completedDateSet, completionsByDate, todayKey]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header Block */}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <View style={styles.titleIconRow}>
              <View style={styles.calendarIconWrap}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.titleEyebrow}>VERIFIED CALENDAR</Text>
            </View>
            <Text style={styles.titleText}>YOUR DAILY STREAK</Text>
            <Text style={styles.subtitleText}>
              Complete a game or mission. Keep your legend alive.
            </Text>
          </View>

          {/* Month Navigation & Today Shortcut */}
          <View style={styles.navControls}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={handlePrevMonth}
              activeOpacity={0.7}
              accessibilityLabel="Previous month"
            >
              <Ionicons name="chevron-back" size={18} color={colors.primaryText} />
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
              <Ionicons name="chevron-forward" size={18} color={colors.primaryText} />
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

        {/* Weekday Row */}
        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((wd) => (
            <View key={wd} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{wd}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
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
                  cell.isFuture && styles.dayCellFuture,
                ]}
                activeOpacity={cell.isCompleted ? 0.7 : 0.9}
                onPress={() => {
                  setSelectedDayModal(cell);
                }}
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

                {/* Milestone orange star indicator */}
                {cell.hasMilestone && (
                  <View style={styles.milestoneStarMarker}>
                    <Ionicons
                      name="star"
                      size={9}
                      color={cell.isCompleted ? '#050705' : colors.burntOrange}
                    />
                  </View>
                )}

                {/* Green verified check badge for completed date */}
                {cell.isCompleted && (
                  <View style={styles.completedMiniCheck}>
                    <Ionicons name="checkmark" size={10} color="#050705" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendLabel}>Verified Completed Day</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendBox,
                {
                  backgroundColor: 'transparent',
                  borderWidth: 1.5,
                  borderColor: colors.burntOrange,
                },
              ]}
            />
            <Text style={styles.legendLabel}>Today's Target</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#111712' }]} />
            <Text style={styles.legendLabel}>No Completion</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="star" size={12} color={colors.warmOrange} style={{ marginRight: 4 }} />
            <Text style={styles.legendLabel}>Achievement Unlocked</Text>
          </View>
        </View>
      </View>

      {/* ========================================================= */}
      {/* DAY DETAIL INSPECTION MODAL                               */}
      {/* ========================================================= */}
      <Modal
        visible={!!selectedDayModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDayModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>DAY ACTIVITY INSPECTION</Text>
                <Text style={styles.modalDateTitle}>{selectedDayModal?.dateKey}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDayModal(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedDayModal?.isCompleted ? (
              <View style={styles.modalCompletionsList}>
                <View style={styles.completedBanner}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.completedBannerText}>
                    {selectedDayModal.completions.length} Qualifying{' '}
                    {selectedDayModal.completions.length === 1 ? 'Completion' : 'Completions'} Recorded
                  </Text>
                </View>

                {selectedDayModal.completions.map((comp) => (
                  <TouchableOpacity
                    key={comp.id}
                    style={styles.dayCompItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedDayModal(null);
                      if (onSelectSession) onSelectSession(comp);
                    }}
                  >
                    <View style={styles.dayCompIcon}>
                      <Ionicons name={comp.icon || 'trophy'} size={18} color={colors.primary} />
                    </View>
                    <View style={styles.dayCompInfo}>
                      <Text style={styles.dayCompTitle}>{comp.gameTitle}</Text>
                      <Text style={styles.dayCompMeta}>
                        {comp.gameMode} • Result: {comp.result}
                      </Text>
                    </View>
                    <View style={styles.dayCompScoreWrap}>
                      <Text style={styles.dayCompScore}>{comp.score?.toLocaleString()} pts</Text>
                      <Text style={styles.dayCompXp}>+{comp.xpAwarded} XP</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.modalEmptyState}>
                <Ionicons name="moon-outline" size={38} color={colors.textMuted} style={{ marginBottom: 10 }} />
                <Text style={styles.modalEmptyTitle}>No Qualifying Completion</Text>
                <Text style={styles.modalEmptyDesc}>
                  Under the strict completion rule, starting a session or opening the dashboard does not qualify.
                  Only fully verified games and missions count!
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedDayModal(null)}
            >
              <Text style={styles.modalCloseBtnText}>CLOSE</Text>
            </TouchableOpacity>
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
    marginBottom: 28,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.24)',
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 18,
  },
  titleBlock: {
    flex: 1,
    minWidth: 220,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  titleEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primaryText,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : undefined,
  },
  subtitleText: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.elevatedSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  monthBadge: {
    backgroundColor: colors.elevatedSurface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: 0.5,
  },
  todayShortcutBtn: {
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    borderWidth: 1,
    borderColor: colors.burntOrange,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  todayShortcutText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.warmOrange,
    letterSpacing: 0.5,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.mutedText,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 3,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F1611',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: 2,
    position: 'relative',
  },
  dayCellCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.emerald,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  dayCellTodayTarget: {
    borderColor: colors.burntOrange,
    borderWidth: 1.8,
    backgroundColor: 'rgba(255, 106, 0, 0.08)',
  },
  dayCellFuture: {
    opacity: 0.35,
    backgroundColor: '#090E0A',
  },
  dayNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
  },
  dayNumberTextCompleted: {
    color: '#050705',
    fontWeight: '900',
  },
  dayNumberTextToday: {
    color: colors.warmOrange,
    fontWeight: '900',
  },
  dayNumberTextFuture: {
    color: colors.mutedText,
  },
  milestoneStarMarker: {
    position: 'absolute',
    top: 2,
    right: 3,
  },
  completedMiniCheck: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(57, 255, 20, 0.12)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
    color: colors.secondaryText,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 5, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  modalDateTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryText,
    marginTop: 2,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  completedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  modalCompletionsList: {
    gap: 8,
    marginBottom: 16,
  },
  dayCompItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevatedSurface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  dayCompIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dayCompInfo: {
    flex: 1,
  },
  dayCompTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryText,
  },
  dayCompMeta: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
  },
  dayCompScoreWrap: {
    alignItems: 'flex-end',
  },
  dayCompScore: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  dayCompXp: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warmOrange,
  },
  modalEmptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 14,
  },
  modalEmptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
    marginBottom: 6,
  },
  modalEmptyDesc: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalCloseBtn: {
    backgroundColor: colors.elevatedSurface,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  modalCloseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
  },
});
