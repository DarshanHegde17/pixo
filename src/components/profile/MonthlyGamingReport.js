import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { GamingActivityService, getAppTimezone } from '../../services/gamingActivityService';

export const MonthlyGamingReport = ({ userId }) => {
  const timezone = getAppTimezone();
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed (1-12)
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedBar, setSelectedBar] = useState(null);

  const fetchReport = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await GamingActivityService.getMonthlyGamingReport(
        userId,
        currentYear,
        currentMonth,
        timezone
      );
      setReportData(data);
    } catch (err) {
      console.error('Failed to load monthly gaming report:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentYear, currentMonth, timezone]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
    setSelectedBar(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
    setSelectedBar(null);
  };

  const monthName = new Date(currentYear, currentMonth - 1, 1)
    .toLocaleString('en-US', { month: 'long' })
    .toUpperCase();

  // Export CSV Handler
  const handleExportCsv = async () => {
    if (!userId) return;
    setIsExporting(true);

    try {
      const csvString = await GamingActivityService.exportCsvReport(userId);

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute(
          'download',
          `soloplay_report_${currentYear}_${String(currentMonth).padStart(2, '0')}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        Alert.alert(
          'CSV Report Generated',
          `Export ready with ${reportData?.totalCompletionsCount || 0} verified completion rows.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Failed to export CSV report:', err);
      Alert.alert('Export Error', 'Could not generate CSV report.');
    } finally {
      setIsExporting(false);
    }
  };

  // Find max daily count for chart scaling
  const maxDayCount = reportData?.dailyChartData
    ? Math.max(3, ...reportData.dailyChartData.map((d) => d.count))
    : 3;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header Block */}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <View style={styles.titleIconRow}>
              <View style={styles.reportIconWrap}>
                <Ionicons name="bar-chart" size={16} color={colors.primary} />
              </View>
              <Text style={styles.titleEyebrow}>ANALYTICS & METRICS</Text>
            </View>
            <Text style={styles.titleText}>YOUR GAMING REPORT</Text>
            <Text style={styles.subtitleText}>
              Comprehensive audit of your monthly progression.
            </Text>
          </View>

          {/* Month Selector Controls & Export */}
          <View style={styles.headerRight}>
            <View style={styles.monthNav}>
              <TouchableOpacity
                style={styles.monthNavBtn}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={16} color={colors.primaryText} />
              </TouchableOpacity>
              <View style={styles.monthNameWrap}>
                <Text style={styles.monthNameText}>{`${monthName} ${currentYear}`}</Text>
              </View>
              <TouchableOpacity
                style={styles.monthNavBtn}
                onPress={handleNextMonth}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={16} color={colors.primaryText} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExportCsv}
              disabled={isExporting}
              activeOpacity={0.8}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#050705" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={15} color="#050705" style={{ marginRight: 6 }} />
                  <Text style={styles.exportBtnText}>EXPORT CSV</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Compiling verified monthly records...</Text>
          </View>
        ) : (
          <>
            {/* 8-Metric Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>UNIQUE GAMES COMPLETED</Text>
                <Text style={styles.metricValue}>{reportData?.uniqueGamesCompleted ?? 0}</Text>
                <Text style={styles.metricSub}>Campaign Titles</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>MISSIONS COMPLETED</Text>
                <Text style={styles.metricValue}>{reportData?.missionsCompleted ?? 0}</Text>
                <Text style={styles.metricSub}>Quests & Raids</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>ACTIVE QUALIFYING DAYS</Text>
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  {reportData?.qualifyingActiveDays ?? 0}
                </Text>
                <Text style={styles.metricSub}>Green Calendar Days</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>TOTAL PLAY TIME</Text>
                <Text style={[styles.metricValue, { color: colors.cyan }]}>
                  {reportData?.totalPlayTimeFormatted ?? '0m'}
                </Text>
                <Text style={styles.metricSub}>Verified Duration</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>CURRENT / LONGEST STREAK</Text>
                <Text style={[styles.metricValue, { color: colors.warmOrange }]}>
                  {reportData?.currentStreak ?? 0} / {reportData?.longestStreak ?? 0}d
                </Text>
                <Text style={styles.metricSub}>Consecutive Days</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>XP EARNED THIS MONTH</Text>
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  +{reportData?.xpEarned?.toLocaleString() ?? 0} XP
                </Text>
                <Text style={styles.metricSub}>Season Progression</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>MOST-PLAYED TITLE</Text>
                <Text style={[styles.metricValue, { fontSize: 13 }]} numberOfLines={1}>
                  {reportData?.mostPlayedGame || 'None yet'}
                </Text>
                <Text style={styles.metricSub}>Time Investment</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>LATEST COMPLETION</Text>
                <Text style={[styles.metricValue, { fontSize: 13 }]} numberOfLines={1}>
                  {reportData?.mostRecentlyCompleted || 'None yet'}
                </Text>
                <Text style={styles.metricSub}>Most Recent Event</Text>
              </View>
            </View>

            {/* Daily Activity Compact Chart */}
            <View style={styles.chartSection}>
              <View style={styles.chartHeaderRow}>
                <Text style={styles.chartTitle}>DAILY COMPLETIONS OVERVIEW</Text>
                <Text style={styles.chartSubtitle}>
                  {monthName} • Peak: {Math.max(0, ...(reportData?.dailyChartData?.map((d) => d.count) || [0]))} challenges
                </Text>
              </View>

              {/* Bar Container */}
              <View style={styles.barsContainer}>
                {reportData?.dailyChartData?.map((item) => {
                  const heightPercent =
                    item.count > 0 ? Math.max(16, (item.count / maxDayCount) * 100) : 4;
                  const isHovered = selectedBar?.day === item.day;

                  return (
                    <TouchableOpacity
                      key={item.day}
                      style={styles.barColumn}
                      activeOpacity={0.7}
                      onPress={() => setSelectedBar(item)}
                    >
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${heightPercent}%`,
                              backgroundColor:
                                item.count === 0
                                  ? '#111712'
                                  : item.count >= 3
                                  ? colors.burntOrange
                                  : colors.primary,
                            },
                            isHovered && styles.barFillHovered,
                          ]}
                        />
                      </View>
                      {item.day % 5 === 0 || item.day === 1 ? (
                        <Text style={styles.barDayLabel}>{item.day}</Text>
                      ) : (
                        <Text style={styles.barDayLabelHidden}>·</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Selected bar detail popup */}
              {selectedBar && (
                <View style={styles.chartInspectCallout}>
                  <Text style={styles.chartInspectText}>
                    Day {selectedBar.day} ({selectedBar.dateKey}): {selectedBar.count}{' '}
                    {selectedBar.count === 1 ? 'verified challenge' : 'verified challenges'} completed
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedBar(null)}>
                    <Ionicons name="close" size={15} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 40,
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
    marginBottom: 20,
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
  reportIconWrap: {
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevatedSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  monthNavBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  monthNameWrap: {
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  monthNameText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: 0.5,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  exportBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 0.5,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  loadingText: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricItem: {
    flexGrow: 1,
    flexBasis: '23%',
    minWidth: 140,
    backgroundColor: colors.elevatedSurface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.mutedText,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.primaryText,
    marginBottom: 2,
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : undefined,
  },
  metricSub: {
    fontSize: 10,
    color: colors.mutedText,
  },
  chartSection: {
    backgroundColor: 'rgba(17, 23, 18, 0.85)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 6,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  chartSubtitle: {
    fontSize: 11,
    color: colors.secondaryText,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 90,
    gap: 3,
    paddingBottom: 4,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    height: 74,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 3,
  },
  barFill: {
    width: '80%',
    minHeight: 3,
    borderRadius: 3,
  },
  barFillHovered: {
    borderWidth: 1,
    borderColor: '#FFF',
  },
  barDayLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.mutedText,
    marginTop: 4,
  },
  barDayLabelHidden: {
    fontSize: 8,
    color: colors.mutedText,
    marginTop: 4,
  },
  chartInspectCallout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
  },
  chartInspectText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryText,
  },
});
