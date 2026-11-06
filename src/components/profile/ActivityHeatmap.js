import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { toDateKey, getAppTimezone } from '../../services/gamingActivityService';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Returns color according to strict completion count intensity matching GitHub/Dribbble reference
 */
function getIntensityColor(count, isFuture) {
  if (isFuture) return '#0c120e'; // Dim outline for future dates
  if (count === 0) return '#121914'; // Zero completions: dark charcoal slate
  if (count === 1) return '#0D3817'; // 1: subtle emerald green
  if (count === 2) return '#007A30'; // 2: medium forest green
  if (count >= 3 && count <= 4) return '#00C853'; // 3-4: electric green
  return '#39FF14'; // 5+: vivid neon green
}

export const ActivityHeatmap = ({ completions = [], streakInfo = {} }) => {
  const timezone = getAppTimezone();
  const today = new Date();
  const todayKey = toDateKey(today, timezone);
  const currentCalendarYear = today.getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentCalendarYear);
  const [inspectedDay, setInspectedDay] = useState(null);

  // Map completions count & xp by dateKey
  const countsByDate = useMemo(() => {
    const map = {};
    const xpMap = {};
    const milestoneMap = {};

    completions.forEach((c) => {
      if (c.status === 'completed' && c.completedAt) {
        const k = toDateKey(c.completedAt, timezone);
        if (k) {
          map[k] = (map[k] || 0) + 1;
          xpMap[k] = (xpMap[k] || 0) + (c.xpAwarded || 0);
          if (Array.isArray(c.achievements) && c.achievements.length > 0) {
            milestoneMap[k] = true;
          }
        }
      }
    });
    return { map, xpMap, milestoneMap };
  }, [completions, timezone]);

  // Construct 52/53 continuous week columns for the selected year
  const { weeks, monthHeaders, totalContributionsInYear } = useMemo(() => {
    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear, 11, 31);

    const weekList = [];
    let currentWeek = [];

    // Pad days before Jan 1 (0 = Sunday)
    for (let i = 0; i < startOfYear.getDay(); i++) {
      currentWeek.push(null);
    }

    let cur = new Date(startOfYear);
    let totalInYear = 0;

    while (cur <= endOfYear) {
      const year = cur.getFullYear();
      const month = String(cur.getMonth() + 1).padStart(2, '0');
      const day = String(cur.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const count = countsByDate.map[dateKey] || 0;
      const xp = countsByDate.xpMap[dateKey] || 0;
      const hasMilestone = !!countsByDate.milestoneMap[dateKey];
      const isToday = dateKey === todayKey;
      const isFuture = dateKey > todayKey;

      if (!isFuture) {
        totalInYear += count;
      }

      currentWeek.push({
        date: new Date(cur),
        dateKey,
        dayNumber: cur.getDate(),
        monthNumber: cur.getMonth(),
        count,
        xp,
        hasMilestone,
        isToday,
        isFuture,
      });

      if (currentWeek.length === 7) {
        weekList.push(currentWeek);
        currentWeek = [];
      }

      cur.setDate(cur.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weekList.push(currentWeek);
    }

    // Determine month headers over week columns
    let lastSeenMonth = -1;
    const headers = weekList.map((week) => {
      const firstValidDay = week.find((d) => d !== null);
      if (!firstValidDay) return '';
      const m = firstValidDay.monthNumber;
      if (m !== lastSeenMonth) {
        lastSeenMonth = m;
        return MONTH_NAMES[m];
      }
      return '';
    });

    return {
      weeks: weekList,
      monthHeaders: headers,
      totalContributionsInYear: totalInYear,
    };
  }, [selectedYear, countsByDate, todayKey]);

  // Current streak calculation
  const currentStreakDays = typeof streakInfo?.currentStreak === 'number'
    ? streakInfo.currentStreak
    : (completions.some((c) => toDateKey(c.completedAt, timezone) === todayKey) ? 1 : 0);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* ========================================================= */}
        {/* TOP HEADER: "586 contributions in 2026" & YEAR SELECTOR   */}
        {/* ========================================================= */}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <View style={styles.titleIconRow}>
              <View style={styles.heatmapIconWrap}>
                <Ionicons name="grid" size={15} color="#39FF14" />
              </View>
              <Text style={styles.titleEyebrow}>VERIFIED GAMING ACTIVITY</Text>
            </View>
            <Text style={styles.heroContributionsTitle}>
              {totalContributionsInYear} contributions in {selectedYear}
            </Text>
            <Text style={styles.subtitleText}>
              GitHub-style continuous activity matrix in one unbroken timeline.
            </Text>
          </View>

          {/* Year Switcher Pills */}
          <View style={styles.yearSwitchWrap}>
            {[currentCalendarYear, currentCalendarYear - 1].map((yr) => {
              const isSelected = selectedYear === yr;
              return (
                <TouchableOpacity
                  key={yr}
                  style={[styles.yearPill, isSelected && styles.yearPillActive]}
                  onPress={() => {
                    setSelectedYear(yr);
                    setInspectedDay(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.yearPillText, isSelected && styles.yearPillTextActive]}>
                    {yr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ========================================================= */}
        {/* CONTINUOUS 52-WEEK HORIZONTAL HEATMAP STRETCH (NO 3-MOS)  */}
        {/* ========================================================= */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.horizontalScroll}
        >
          <View style={styles.matrixContainer}>
            {/* Top Month Labels Row */}
            <View style={styles.monthsHeaderRow}>
              {/* Spacer for left weekday labels */}
              <View style={styles.weekdayLabelSpacer} />

              {/* Month label columns matching week columns */}
              <View style={styles.monthLabelsColsWrap}>
                {monthHeaders.map((mLabel, idx) => (
                  <View key={`m-${idx}`} style={styles.monthHeaderCol}>
                    {mLabel ? <Text style={styles.monthHeaderText}>{mLabel}</Text> : null}
                  </View>
                ))}
              </View>
            </View>

            {/* Grid Body: Left Weekday Labels + 53 Week Columns */}
            <View style={styles.gridBodyRow}>
              {/* Left Weekday Labels (Mon, Wed, Fri) */}
              <View style={styles.weekdayLabelsCol}>
                <View style={styles.weekdayLabelCell}>
                  <Text style={styles.weekdayLabelText}></Text>
                </View>
                <View style={styles.weekdayLabelCell}>
                  <Text style={styles.weekdayLabelText}>Mon</Text>
                </View>
                <View style={styles.weekdayLabelCell}>
                  <Text style={styles.weekdayLabelText}></Text>
                </View>
                <View style={styles.weekdayLabelCell}>
                  <Text style={styles.weekdayLabelText}>Wed</Text>
                </View>
                <View style={styles.weekdayLabelCell}>
                  <Text style={styles.weekdayLabelText}></Text>
                </View>
                <View style={styles.weekdayLabelCell}>
                  <Text style={styles.weekdayLabelText}>Fri</Text>
                </View>
                <View style={styles.weekdayLabelCell}>
                  <Text style={styles.weekdayLabelText}></Text>
                </View>
              </View>

              {/* 53 Week Columns */}
              <View style={styles.weeksColsWrap}>
                {weeks.map((week, wIdx) => (
                  <View key={`week-${wIdx}`} style={styles.weekCol}>
                    {week.map((cell, dIdx) => {
                      if (!cell) {
                        return <View key={`empty-${wIdx}-${dIdx}`} style={styles.cellEmpty} />;
                      }

                      const cellBg = getIntensityColor(cell.count, cell.isFuture);
                      const isInspected = inspectedDay?.dateKey === cell.dateKey;

                      return (
                        <TouchableOpacity
                          key={cell.dateKey}
                          style={[
                            styles.cellSquare,
                            { backgroundColor: cellBg },
                            cell.count >= 5 && styles.cellMaxGlow,
                            cell.isToday && styles.cellTodayActive,
                            isInspected && styles.cellInspectedHighlight,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => setInspectedDay(cell)}
                        >
                          {cell.hasMilestone && <View style={styles.milestoneDot} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ========================================================= */}
        {/* INTERACTIVE DATE INSPECT HUD BANNER                       */}
        {/* ========================================================= */}
        {inspectedDay ? (
          <View style={styles.inspectHud}>
            <View style={styles.inspectHudLeft}>
              <View style={styles.inspectDotBadge}>
                <Ionicons
                  name={inspectedDay.count > 0 ? 'flame' : 'calendar-outline'}
                  size={15}
                  color={inspectedDay.count > 0 ? '#39FF14' : '#7A8E7E'}
                />
              </View>
              <View>
                <Text style={styles.inspectDateTitle}>
                  {inspectedDay.date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {inspectedDay.isToday ? ' (Today)' : ''}
                </Text>
                <Text style={styles.inspectMetricsText}>
                  <Text style={{ color: inspectedDay.count > 0 ? '#39FF14' : '#FFFFFF', fontWeight: '800' }}>
                    {inspectedDay.count}
                  </Text>{' '}
                  {inspectedDay.count === 1 ? 'game completed' : 'games completed'}
                  {inspectedDay.xp > 0 ? ` • +${inspectedDay.xp} XP awarded` : ''}
                  {inspectedDay.hasMilestone ? ' • 🏆 Milestone Unlocked!' : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setInspectedDay(null)}
              style={styles.closeHudBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#7A8E7E" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ========================================================= */}
        {/* BOTTOM METRICS: "254 day streak" & "+510 contributions"   */}
        {/* ========================================================= */}
        <View style={styles.bottomStatsRow}>
          <View style={styles.streakStatBlock}>
            <Ionicons name="flame" size={18} color="#39FF14" style={{ marginRight: 6 }} />
            <Text style={styles.streakStatValue}>{currentStreakDays} day streak</Text>
          </View>

          <View style={styles.contributionsStatBlock}>
            <Ionicons name="shield-checkmark" size={16} color="#39FF14" style={{ marginRight: 6 }} />
            <Text style={styles.contributionsStatValue}>
              +{totalContributionsInYear} verified games in {selectedYear}
            </Text>
          </View>
        </View>

        {/* ========================================================= */}
        {/* INTENSITY SCALE LEGEND                                    */}
        {/* ========================================================= */}
        <View style={styles.legendRow}>
          <Text style={styles.legendTextLabel}>Less</Text>
          <View style={[styles.legendSquare, { backgroundColor: '#121914' }]} />
          <View style={[styles.legendSquare, { backgroundColor: '#0D3817' }]} />
          <View style={[styles.legendSquare, { backgroundColor: '#007A30' }]} />
          <View style={[styles.legendSquare, { backgroundColor: '#00C853' }]} />
          <View style={[styles.legendSquare, { backgroundColor: '#39FF14', shadowColor: '#39FF14', shadowOpacity: 0.8, shadowRadius: 4 }]} />
          <Text style={styles.legendTextLabel}>More</Text>

          <View style={styles.legendDivider} />

          <View style={styles.milestoneLegendWrap}>
            <View style={styles.legendMilestoneDot} />
            <Text style={styles.legendTextLabel}>Milestone</Text>
          </View>

          <View style={styles.activeTodayLegendWrap}>
            <View style={styles.legendTodayBox} />
            <Text style={styles.legendTextLabel}>Active Target</Text>
          </View>
        </View>
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
  card: {
    backgroundColor: '#0A0F0B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.26)',
    padding: 22,
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  titleBlock: {
    flex: 1,
    minWidth: 220,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  heatmapIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(57, 255, 20, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  titleEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#39FF14',
    letterSpacing: 1.5,
  },
  heroContributionsTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : undefined,
  },
  subtitleText: {
    fontSize: 12,
    color: '#7A8E7E',
    marginTop: 4,
  },
  yearSwitchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#101611',
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.18)',
  },
  yearPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  yearPillActive: {
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.5)',
  },
  yearPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A8E7E',
  },
  yearPillTextActive: {
    color: '#39FF14',
  },
  horizontalScroll: {
    width: '100%',
    marginVertical: 4,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  matrixContainer: {
    flexDirection: 'column',
  },
  monthsHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
    height: 16,
  },
  weekdayLabelSpacer: {
    width: 32,
  },
  monthLabelsColsWrap: {
    flexDirection: 'row',
  },
  monthHeaderCol: {
    width: 15, // Matches weekCol width (11px cell + 4px gap)
    alignItems: 'flex-start',
    overflow: 'visible',
  },
  monthHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7A8E7E',
    position: 'absolute',
    left: 0,
    top: 0,
    width: 36,
    letterSpacing: 0.2,
  },
  gridBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  weekdayLabelsCol: {
    width: 32,
    marginRight: 4,
  },
  weekdayLabelCell: {
    height: 15, // Matches cellSquare height (11px + 4px gap)
    justifyContent: 'center',
  },
  weekdayLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7A8E7E',
  },
  weeksColsWrap: {
    flexDirection: 'row',
    gap: 4,
  },
  weekCol: {
    flexDirection: 'column',
    gap: 4,
  },
  cellEmpty: {
    width: 11,
    height: 11,
    backgroundColor: 'transparent',
  },
  cellSquare: {
    width: 11,
    height: 11,
    borderRadius: 2.5,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cellMaxGlow: {
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  cellTodayActive: {
    borderWidth: 1.5,
    borderColor: '#39FF14',
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  cellInspectedHighlight: {
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    transform: [{ scale: 1.3 }],
    zIndex: 10,
  },
  milestoneDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FF8A00',
  },
  inspectHud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121C14',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.35)',
  },
  inspectHudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inspectDotBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  inspectDateTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inspectMetricsText: {
    fontSize: 11,
    color: '#A2B5A5',
    marginTop: 2,
  },
  closeHudBtn: {
    padding: 4,
  },
  bottomStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(57, 255, 20, 0.14)',
  },
  streakStatBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakStatValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#39FF14',
    letterSpacing: 0.3,
  },
  contributionsStatBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contributionsStatValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#39FF14',
    letterSpacing: 0.2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  legendTextLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A8E7E',
  },
  legendSquare: {
    width: 11,
    height: 11,
    borderRadius: 2.5,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  legendDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 4,
  },
  milestoneLegendWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendMilestoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF8A00',
  },
  activeTodayLegendWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendTodayBox: {
    width: 11,
    height: 11,
    borderRadius: 2.5,
    borderWidth: 1.5,
    borderColor: '#39FF14',
    backgroundColor: '#121914',
  },
});
