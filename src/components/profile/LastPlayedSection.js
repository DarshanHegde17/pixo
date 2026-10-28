import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { formatDuration } from '../../services/gamingActivityService';

const PAGE_SIZE = 5;

/**
 * Returns visual badge styling for session status
 */
function getStatusBadgeConfig(status) {
  switch (status) {
    case 'completed':
      return {
        label: 'COMPLETED',
        color: colors.primary,
        bgColor: 'rgba(57, 255, 20, 0.12)',
        borderColor: 'rgba(57, 255, 20, 0.4)',
        icon: 'checkmark-circle',
      };
    case 'in_progress':
      return {
        label: 'IN PROGRESS',
        color: colors.cyan,
        bgColor: 'rgba(0, 229, 255, 0.12)',
        borderColor: 'rgba(0, 229, 255, 0.4)',
        icon: 'time',
      };
    case 'failed':
      return {
        label: 'FAILED',
        color: colors.error,
        bgColor: 'rgba(255, 77, 77, 0.12)',
        borderColor: 'rgba(255, 77, 77, 0.4)',
        icon: 'close-circle',
      };
    case 'abandoned':
      return {
        label: 'ABANDONED',
        color: colors.warmOrange,
        bgColor: 'rgba(255, 159, 67, 0.12)',
        borderColor: 'rgba(255, 159, 67, 0.35)',
        icon: 'exit-outline',
      };
    default:
      return {
        label: 'UNKNOWN',
        color: colors.mutedText,
        bgColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        icon: 'help-circle-outline',
      };
  }
}

export const LastPlayedSection = ({
  sessions = [],
  onSelectSession,
  onResumeSession,
  onBrowseGames,
}) => {
  // Filter state: 'all' | 'completed' | 'active'
  const [activeFilter, setActiveFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (activeFilter === 'completed') return s.status === 'completed';
      if (activeFilter === 'active') return s.status === 'in_progress';
      return true;
    });
  }, [sessions, activeFilter]);

  const displayedSessions = filteredSessions.slice(0, visibleCount);
  const hasMore = visibleCount < filteredSessions.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header Block */}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <View style={styles.titleIconRow}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="game-controller" size={16} color={colors.primary} />
              </View>
              <Text style={styles.titleEyebrow}>SESSION ARCHIVE</Text>
            </View>
            <Text style={styles.titleText}>LAST PLAYED</Text>
            <Text style={styles.subtitleText}>
              Your latest adventures, all in one place.
            </Text>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterPills}>
            <TouchableOpacity
              style={[styles.filterPill, activeFilter === 'all' && styles.filterPillActive]}
              onPress={() => {
                setActiveFilter('all');
                setVisibleCount(PAGE_SIZE);
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'all' && styles.filterPillTextActive,
                ]}
              >
                All ({sessions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                activeFilter === 'completed' && styles.filterPillActive,
              ]}
              onPress={() => {
                setActiveFilter('completed');
                setVisibleCount(PAGE_SIZE);
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'completed' && styles.filterPillTextActive,
                ]}
              >
                Completed ({sessions.filter((s) => s.status === 'completed').length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                activeFilter === 'active' && styles.filterPillActive,
              ]}
              onPress={() => {
                setActiveFilter('active');
                setVisibleCount(PAGE_SIZE);
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === 'active' && styles.filterPillTextActive,
                ]}
              >
                Active ({sessions.filter((s) => s.status === 'in_progress').length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sessions List */}
        {displayedSessions.length > 0 ? (
          <View style={styles.sessionsList}>
            {displayedSessions.map((item) => {
              const badge = getStatusBadgeConfig(item.status);
              const durationFormatted = formatDuration(item.durationSeconds);
              const startDate = item.startedAt
                ? new Date(item.startedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : 'Unknown';

              const isCompleted = item.status === 'completed';
              const isInProgress = item.status === 'in_progress';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.sessionCard,
                    isCompleted && styles.sessionCardCompleted,
                  ]}
                  activeOpacity={isCompleted ? 0.8 : 0.95}
                  onPress={() => {
                    if (isCompleted && onSelectSession) {
                      onSelectSession(item);
                    }
                  }}
                >
                  {/* Left Game Artwork / Icon */}
                  <View style={styles.sessionIconBlock}>
                    <Ionicons
                      name={item.icon || 'game-controller-outline'}
                      size={24}
                      color={isCompleted ? colors.primary : colors.warmOrange}
                    />
                  </View>

                  {/* Middle Content */}
                  <View style={styles.sessionMainContent}>
                    <View style={styles.sessionTopRow}>
                      <Text style={styles.gameTitleText} numberOfLines={1}>
                        {item.gameTitle}
                      </Text>
                      {/* Status Badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: badge.bgColor,
                            borderColor: badge.borderColor,
                          },
                        ]}
                      >
                        <Ionicons
                          name={badge.icon}
                          size={12}
                          color={badge.color}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>

                    {/* Meta info */}
                    <View style={styles.sessionMetaRow}>
                      <Text style={styles.sessionMetaItem}>
                        <Ionicons name="calendar-outline" size={11} color={colors.mutedText} />{' '}
                        {startDate}
                      </Text>
                      <Text style={styles.sessionMetaDot}>•</Text>
                      <Text style={styles.sessionMetaItem}>
                        <Ionicons name="time-outline" size={11} color={colors.mutedText} />{' '}
                        {durationFormatted}
                      </Text>
                      {item.xpAwarded > 0 && (
                        <>
                          <Text style={styles.sessionMetaDot}>•</Text>
                          <Text style={styles.sessionMetaXp}>+{item.xpAwarded} XP</Text>
                        </>
                      )}
                    </View>

                    {/* Result or Mode note */}
                    <Text style={styles.sessionResultText} numberOfLines={1}>
                      {item.result || item.gameMode || 'Solo Mission'}
                    </Text>
                  </View>

                  {/* Right Actions: Continue Playing or View Report */}
                  <View style={styles.sessionActions}>
                    {isInProgress && onResumeSession ? (
                      <TouchableOpacity
                        style={styles.continueBtn}
                        onPress={() => onResumeSession(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="play" size={13} color="#050705" style={{ marginRight: 4 }} />
                        <Text style={styles.continueBtnText}>RESUME</Text>
                      </TouchableOpacity>
                    ) : isCompleted ? (
                      <View style={styles.viewReportAction}>
                        <Text style={styles.viewReportActionText}>REPORT ›</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Load More Button */}
            {hasMore && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={handleLoadMore}
                activeOpacity={0.8}
              >
                <Text style={styles.loadMoreBtnText}>LOAD MORE SESSIONS</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          // Informative Empty State
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="game-controller-outline" size={32} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Sessions Recorded</Text>
            <Text style={styles.emptyDesc}>
              {activeFilter === 'completed'
                ? 'You have not completed any challenges in this view. Complete a game or mission to earn XP and turn calendar dates green!'
                : 'Activity tracking begins when you launch and complete your first mission.'}
            </Text>
            {onBrowseGames && (
              <TouchableOpacity style={styles.browseGamesBtn} onPress={onBrowseGames}>
                <Ionicons name="flash" size={15} color="#050705" style={{ marginRight: 6 }} />
                <Text style={styles.browseGamesBtnText}>EXPLORE GAME CATALOGUE</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  sectionIconWrap: {
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
  filterPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.elevatedSurface,
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  filterPillActive: {
    backgroundColor: 'rgba(57, 255, 20, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryText,
  },
  filterPillTextActive: {
    color: colors.primary,
  },
  sessionsList: {
    gap: 10,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevatedSurface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sessionCardCompleted: {
    borderColor: 'rgba(57, 255, 20, 0.22)',
  },
  sessionIconBlock: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0A130C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
  },
  sessionMainContent: {
    flex: 1,
  },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  gameTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryText,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 3,
  },
  sessionMetaItem: {
    fontSize: 11,
    color: colors.mutedText,
  },
  sessionMetaDot: {
    fontSize: 11,
    color: colors.mutedText,
  },
  sessionMetaXp: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.warmOrange,
  },
  sessionResultText: {
    fontSize: 11,
    color: colors.secondaryText,
    fontStyle: 'italic',
  },
  sessionActions: {
    marginLeft: 10,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cyan,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  continueBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#050705',
  },
  viewReportAction: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  viewReportActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  loadMoreBtn: {
    backgroundColor: colors.elevatedSurface,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
    marginTop: 6,
  },
  loadMoreBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.elevatedSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryText,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 380,
    marginBottom: 18,
  },
  browseGamesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseGamesBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 0.5,
  },
});
