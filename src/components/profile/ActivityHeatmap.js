import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { toDateKey, getAppTimezone } from '../../services/gamingActivityService';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Returns color according to strict completion count intensity
 */
function getIntensityColor(count) {
  if (count === 0) return '#101610'; // Zero completions: dark charcoal
  if (count === 1) return '#0D3817'; // 1: subtle green
  if (count === 2) return '#007A30'; // 2: medium green
  if (count >= 3 && count <= 4) return '#00C853'; // 3-4: bright green
  return '#39FF14'; // 5+: vivid neon green
}

export const ActivityHeatmap = ({ completions = [] }) => {
  const timezone = getAppTimezone();
  const today = new Date();

  // Mode: 'current' | 'previous' | 'last3'
  const [viewMode, setViewMode] = useState('current');
  const [hoveredDate, setHoveredDate] = useState(null);

  // Group completions count by date
  const countsByDate = useMemo(() => {
    const map = {};
    const milestoneMap = {};
    completions.forEach((c) => {
      if (c.status === 'completed' && c.completedAt) {
        const k = toDateKey(c.completedAt, timezone);
        if (k) {
          map[k] = (map[k] || 0) + 1;
          if (Array.isArray(c.achievements) && c.achievements.length > 0) {
            milestoneMap[k] = true;
          }
        }
      }
    });
    return { map, milestoneMap };
  }, [completions, timezone]);

  // Construct months to display
  const monthsToDisplay = useMemo(() => {
    const makeMonthData = (year, month) => {
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthTitle = new Date(year, month, 1)
        .toLocaleString('en-US', { month: 'short' })
        .toUpperCase();

      const days = [];
      for (let i = 0; i < firstDay; i++) {
        days.push({ type: 'empty', key: `empty-${year}-${month}-${i}` });
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const count = countsByDate.map[dateKey] || 0;
        const hasMilestone = !!countsByDate.milestoneMap[dateKey];

        days.push({
          type: 'day',
          day: d,
          dateKey,
          count,
          hasMilestone,
          key: dateKey,
        });
      }

      return {
        year,
        month,
        title: `${monthTitle} ${year}`,
        days,
      };
    };

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    if (viewMode === 'current') {
      return [makeMonthData(currentYear, currentMonth)];
    }
    if (viewMode === 'previous') {
      const prevDate = new Date(currentYear, currentMonth - 1, 1);
      return [makeMonthData(prevDate.getFullYear(), prevDate.getMonth())];
    }
    // Last 3 months
    const m3 = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      m3.push(makeMonthData(d.getFullYear(), d.getMonth()));
    }
    return m3;
  }, [viewMode, today, countsByDate]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header Block */}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <View style={styles.titleIconRow}>
              <View style={styles.heatmapIconWrap}>
                <Ionicons name="grid" size={16} color={colors.primary} />
              </View>
              <Text style={styles.titleEyebrow}>ACTIVITY DENSITY</Text>
            </View>
            <Text style={styles.titleText}>YOUR MONTH IN PLAY</Text>
            <Text style={styles.subtitleText}>
              Every completed challenge leaves its mark.
            </Text>
          </View>

          {/* View Filter Mode Pills */}
          <View style={styles.modePillsRow}>
            <TouchableOpacity
              style={[styles.modePill, viewMode === 'current' && styles.modePillActive]}
              onPress={() => setViewMode('current')}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.modePillText,
                  viewMode === 'current' && styles.modePillTextActive,
                ]}
              >
                Current
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modePill, viewMode === 'previous' && styles.modePillActive]}
              onPress={() => setViewMode('previous')}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.modePillText,
                  viewMode === 'previous' && styles.modePillTextActive,
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modePill, viewMode === 'last3' && styles.modePillActive]}
              onPress={() => setViewMode('last3')}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.modePillText,
                  viewMode === 'last3' && styles.modePillTextActive,
                ]}
              >
                Last 3 Months
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Heatmaps Container */}
        <View style={styles.heatmapsWrap}>
          {monthsToDisplay.map((m) => (
            <View key={m.title} style={styles.singleMonthBlock}>
              <View style={styles.monthLabelRow}>
                <Text style={styles.monthSectionTitle}>{m.title}</Text>
              </View>

              {/* Weekday indicator headers */}
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((wd) => (
                  <View key={wd} style={styles.weekdayCell}>
                    <Text style={styles.weekdayText}>{wd[0]}</Text>
                  </View>
                ))}
              </View>

              {/* 7-column Heatmap Grid */}
              <View style={styles.grid}>
                {m.days.map((cell) => {
                  if (cell.type === 'empty') {
                    return <View key={cell.key} style={styles.heatCellEmpty} />;
                  }

                  const cellColor = getIntensityColor(cell.count);

                  return (
                    <TouchableOpacity
                      key={cell.key}
                      style={[
                        styles.heatCell,
                        {
                          backgroundColor: cellColor,
                          borderColor: cell.count > 0 ? 'rgba(57, 255, 20, 0.4)' : '#172219',
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setHoveredDate(cell)}
                    >
                      {/* Orange milestone marker dot */}
                      {cell.hasMilestone && (
                        <View style={styles.orangeMilestoneDot} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Tooltip / Active date inspect banner */}
        {hoveredDate && (
          <View style={styles.inspectBanner}>
            <Ionicons name="sparkles" size={15} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.inspectBannerText}>
              {hoveredDate.dateKey}: {hoveredDate.count}{' '}
              {hoveredDate.count === 1 ? 'verified challenge' : 'verified challenges'} completed
              {hoveredDate.hasMilestone ? ' • Achievement unlocked!' : ''}
            </Text>
            <TouchableOpacity onPress={() => setHoveredDate(null)} style={{ marginLeft: 8 }}>
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Intensity Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>COMPLETION INTENSITY:</Text>
          <View style={styles.legendScale}>
            <Text style={styles.legendLabelSmall}>0</Text>
            <View style={[styles.legendBox, { backgroundColor: '#101610' }]} />
            <View style={[styles.legendBox, { backgroundColor: '#0D3817' }]} />
            <View style={[styles.legendBox, { backgroundColor: '#007A30' }]} />
            <View style={[styles.legendBox, { backgroundColor: '#00C853' }]} />
            <View style={[styles.legendBox, { backgroundColor: '#39FF14' }]} />
            <Text style={styles.legendLabelSmall}>5+</Text>
          </View>
          <View style={styles.milestoneLegendItem}>
            <View style={styles.orangeMilestoneDotDemo} />
            <Text style={styles.legendLabelSmall}>Milestone</Text>
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
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.24)',
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
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
    minWidth: 200,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  heatmapIconWrap: {
    width: 26,
    height: 26,
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
  modePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.elevatedSurface,
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
  },
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  modePillActive: {
    backgroundColor: 'rgba(57, 255, 20, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryText,
  },
  modePillTextActive: {
    color: colors.primary,
  },
  heatmapsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  singleMonthBlock: {
    flex: 1,
    minWidth: 260,
  },
  monthLabelRow: {
    marginBottom: 8,
  },
  monthSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.warmOrange,
    letterSpacing: 1,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.mutedText,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  heatCellEmpty: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 3,
  },
  heatCell: {
    width: '14.28%',
    aspectRatio: 1,
    marginVertical: 2,
    padding: 2,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orangeMilestoneDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.burntOrange,
    shadowColor: colors.burntOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  inspectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
  },
  inspectBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(57, 255, 20, 0.12)',
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.mutedText,
    letterSpacing: 0.8,
  },
  legendScale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  legendLabelSmall: {
    fontSize: 10,
    color: colors.secondaryText,
    fontWeight: '700',
  },
  milestoneLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  orangeMilestoneDotDemo: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.burntOrange,
  },
});
