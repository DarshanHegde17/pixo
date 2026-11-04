import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { XP_TO_COIN_PACKAGES, getAppTimezone } from '../services/gamingActivityService';
import {
  StreakRewardsService,
  DEFAULT_STREAK_REWARDS,
} from '../services/streakRewardsService';
import { NavigationService } from '../services/navigationService';
import { PixoBackButton } from '../components/common/PixoBackButton';
import { colors, spacing, borderRadius } from '../theme';

/**
 * PIXO Coin & Streak Rewards Store Screen
 * 
 * Master Prompt Requirements:
 * 1. Streak Rewards Store with 13 configurable milestones (7 to 500 Days).
 * 2. 10 XP-to-Coin exchange packages (50 XP to 1,000 XP) preserved.
 * 3. Top streak progress HUD: Current streak, longest streak, next reward, days remaining, coins needed, and timeline.
 * 4. 4 Statuses: AVAILABLE, LOCKED, INSUFFICIENT COINS, REDEEMED.
 * 5. Atomic, mutex-locked redemption with balance deduction and persistent transaction logging.
 * 6. "My Rewards" collection tab with equipable cosmetics and virtual physical rewards disclaimer.
 * 7. Store filters (All, Available, Locked, Redeemed, Upcoming) + Search + 4 Sort options.
 * 8. Exclusive visual treatment for 100-day, 365-day, and 500-day milestones.
 */
export const CoinStoreScreen = ({ onNavigateHome }) => {
  const {
    user,
    streakState,
    exchangeXpForCoins,
    redeemStreakReward,
    equipCosmetic,
    refreshStreak,
  } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const userXp = typeof user?.xp === 'number' ? user.xp : 0;
  const userCoins = typeof user?.coins === 'number' ? user.coins : 0;

  // Active Store Tab: 'streak_rewards' | 'xp_packages' | 'my_rewards'
  const [activeTab, setActiveTab] = useState('streak_rewards');

  // Streak data
  const currentStreak = typeof streakState?.currentStreak === 'number'
    ? streakState.currentStreak
    : (user?.streak || 0);
  const longestStreak = typeof streakState?.longestStreak === 'number'
    ? streakState.longestStreak
    : (user?.longestStreak || currentStreak);

  // Catalog and User Redemptions
  const [catalog, setCatalog] = useState(DEFAULT_STREAK_REWARDS);
  const [redeemedRewards, setRedeemedRewards] = useState([]);
  const [equippedCosmetics, setEquippedCosmetics] = useState({ badge: null, frame: null });
  const [isLoadingStore, setIsLoadingStore] = useState(true);

  // Filters, Search & Sort
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'available' | 'locked' | 'redeemed' | 'upcoming'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('streak_asc'); // 'streak_asc' | 'streak_desc' | 'cost_asc' | 'cost_desc'

  // XP Package Exchange states
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isSubmittingXp, setIsSubmittingXp] = useState(false);
  const [successExchange, setSuccessExchange] = useState(null);
  const [xpErrorMessage, setXpErrorMessage] = useState(null);

  // Streak Reward Redemption states
  const [rewardToRedeem, setRewardToRedeem] = useState(null);
  const [isRedeemingStreak, setIsRedeemingStreak] = useState(false);
  const [redeemSuccessData, setRedeemSuccessData] = useState(null);
  const [streakErrorMessage, setStreakErrorMessage] = useState(null);

  // Milestone Progress Info
  const [milestoneProgress, setMilestoneProgress] = useState(null);

  // Handle Back interception for any open store modals
  useEffect(() => {
    const isAnyModalOpen = Boolean(selectedPackage || rewardToRedeem || successExchange || redeemSuccessData);
    if (isAnyModalOpen) {
      const unregister = NavigationService.registerBackHandler(
        'coin_store_modals',
        () => {
          if (successExchange) {
            setSuccessExchange(null);
            return true;
          }
          if (redeemSuccessData) {
            setRedeemSuccessData(null);
            return true;
          }
          if (selectedPackage) {
            setSelectedPackage(null);
            return true;
          }
          if (rewardToRedeem) {
            setRewardToRedeem(null);
            return true;
          }
          return false;
        },
        55
      );
      return unregister;
    }
  }, [selectedPackage, rewardToRedeem, successExchange, redeemSuccessData]);

  // Load store catalog, user redemptions, and equipped cosmetics
  const loadStoreData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoadingStore(true);
      const [cat, redemptions, cosmetics, progress] = await Promise.all([
        StreakRewardsService.getCatalog(),
        StreakRewardsService.getRedeemedRewards(user.id),
        StreakRewardsService.getEquippedCosmetics(user.id),
        StreakRewardsService.getStreakMilestoneProgress(user.id, currentStreak, longestStreak),
      ]);
      setCatalog(cat);
      setRedeemedRewards(redemptions || []);
      setEquippedCosmetics(cosmetics || { badge: null, frame: null });
      setMilestoneProgress(progress);
    } catch (err) {
      console.warn('Error loading streak rewards store data:', err);
    } finally {
      setIsLoadingStore(false);
    }
  }, [user?.id, currentStreak, longestStreak]);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Set of redeemed reward IDs for fast status lookup
  const redeemedIdsSet = useMemo(() => {
    return new Set(redeemedRewards.map((r) => r.rewardId || r.id));
  }, [redeemedRewards]);

  // Compute status for all rewards in catalog
  const catalogWithStatus = useMemo(() => {
    return catalog.map((reward) => {
      const isRedeemed = redeemedIdsSet.has(reward.id);
      const status = StreakRewardsService.getRewardStatus(
        reward,
        currentStreak,
        userCoins,
        isRedeemed
      );
      return {
        ...reward,
        isRedeemed,
        status, // 'AVAILABLE' | 'LOCKED' | 'INSUFFICIENT_COINS' | 'REDEEMED'
      };
    });
  }, [catalog, currentStreak, userCoins, redeemedIdsSet]);

  // Filtered & Sorted Streak Rewards
  const processedRewards = useMemo(() => {
    let result = [...catalogWithStatus];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }

    // Category / State filter
    if (selectedFilter === 'available') {
      result = result.filter((r) => r.status === 'AVAILABLE');
    } else if (selectedFilter === 'locked') {
      result = result.filter((r) => r.status === 'LOCKED');
    } else if (selectedFilter === 'redeemed') {
      result = result.filter((r) => r.status === 'REDEEMED');
    } else if (selectedFilter === 'upcoming') {
      // Find the next 3 unreached milestones
      const unreached = result.filter((r) => !r.isRedeemed && currentStreak < r.requiredStreak);
      result = unreached.slice(0, 3);
    }

    // Sort order
    result.sort((a, b) => {
      if (sortBy === 'streak_asc') return a.requiredStreak - b.requiredStreak;
      if (sortBy === 'streak_desc') return b.requiredStreak - a.requiredStreak;
      if (sortBy === 'cost_asc') return a.coinCost - b.coinCost;
      if (sortBy === 'cost_desc') return b.coinCost - a.coinCost;
      return 0;
    });

    return result;
  }, [catalogWithStatus, searchQuery, selectedFilter, sortBy, currentStreak]);

  // =========================================================================
  // HANDLERS: STREAK REWARD REDEMPTION
  // =========================================================================
  const handleOpenRedeemModal = (reward) => {
    if (reward.status === 'REDEEMED') {
      Alert.alert('Already Redeemed', `You already have the ${reward.title} in your collection!`);
      return;
    }
    if (reward.status === 'LOCKED') {
      const daysNeeded = reward.requiredStreak - currentStreak;
      Alert.alert(
        '🔒 Milestone Locked',
        `You need a ${reward.requiredStreak}-day streak to unlock ${reward.title}.\n\nYour current streak: ${currentStreak} days (${daysNeeded} more day${daysNeeded > 1 ? 's' : ''} needed)!\nKeep playing daily to reach it!`
      );
      return;
    }
    if (reward.status === 'INSUFFICIENT_COINS') {
      const coinsNeeded = reward.coinCost - userCoins;
      Alert.alert(
        '🪙 Not Enough Coins',
        `You have the required ${reward.requiredStreak}-day streak, but need ${coinsNeeded.toLocaleString()} more Coins to redeem this item.\n\nExchange battle XP for Coins in the XP Store or win more games!`
      );
      return;
    }
    setStreakErrorMessage(null);
    setRewardToRedeem(reward);
  };

  const handleConfirmRedeemReward = async () => {
    if (!rewardToRedeem || isRedeemingStreak || !user?.id) return;

    setIsRedeemingStreak(true);
    setStreakErrorMessage(null);

    try {
      const res = await redeemStreakReward(rewardToRedeem.id);
      setIsRedeemingStreak(false);

      if (res && res.success) {
        const redeemed = rewardToRedeem;
        setRewardToRedeem(null);
        setRedeemSuccessData({
          reward: redeemed,
          remainingCoins: res.remainingCoins,
          redeemedItem: res.redeemedItem,
        });
        // Refresh local store data
        loadStoreData();
      } else {
        setStreakErrorMessage(res?.error || 'Redemption failed. Please try again.');
      }
    } catch (err) {
      setIsRedeemingStreak(false);
      setStreakErrorMessage(err.message || 'Transaction failed.');
    }
  };

  // Handle Equipping digital cosmetic
  const handleToggleEquipCosmetic = async (item) => {
    if (!item.cosmeticType || !item.cosmeticValue || !user?.id) return;
    try {
      const isEquipped = equippedCosmetics[item.cosmeticType] === item.cosmeticValue;
      const targetVal = isEquipped ? null : item.cosmeticValue;
      await equipCosmetic(item.cosmeticType, targetVal);
      setEquippedCosmetics((prev) => ({
        ...prev,
        [item.cosmeticType]: targetVal,
      }));
    } catch (err) {
      Alert.alert('Cosmetic Update', 'Failed to equip cosmetic: ' + err.message);
    }
  };

  // =========================================================================
  // HANDLERS: XP TO COIN EXCHANGE (Existing functionality preserved)
  // =========================================================================
  const handleSelectPackage = (pkg) => {
    if (userXp < pkg.xpRequired) {
      Alert.alert(
        'Not Enough XP!',
        `You need ${pkg.xpRequired} XP to exchange for ${pkg.coinsReceived} Coins.\nYour current balance: ${userXp} XP.\n\nWin games to earn more XP!`
      );
      return;
    }
    setXpErrorMessage(null);
    setSelectedPackage(pkg);
  };

  const handleConfirmExchange = async () => {
    if (!selectedPackage || isSubmittingXp) return;

    if (userXp < selectedPackage.xpRequired) {
      setXpErrorMessage('Not enough XP! Win more games to earn XP.');
      return;
    }

    setIsSubmittingXp(true);
    setXpErrorMessage(null);

    try {
      const res = await exchangeXpForCoins(selectedPackage.id);
      setIsSubmittingXp(false);

      if (res && res.success) {
        const exchangedPkg = selectedPackage;
        setSelectedPackage(null);
        setSuccessExchange({
          pkg: exchangedPkg,
          newXp: res.newXp,
          newCoins: res.newCoins,
        });
        loadStoreData();
      } else {
        setXpErrorMessage(res?.error || 'Exchange failed. Please try again.');
      }
    } catch (err) {
      setIsSubmittingXp(false);
      setXpErrorMessage(err.message || 'Transaction failed.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <PixoBackButton
              onPress={() => NavigationService.goBack()}
              label="BACK"
              variant="pill"
              size={15}
              accessibilityLabel="Navigate back to previous page"
            />

            <View style={styles.titleBadge}>
              <Ionicons name="flame" size={15} color="#FF6A00" style={{ marginRight: 6 }} />
              <Text style={styles.titleBadgeText}>PIXO REWARDS // STREAK & COINS</Text>
            </View>
          </View>

          <Text style={styles.mainTitle}>REWARDS & COIN STORE</Text>
          <Text style={styles.subtitle}>
            Conquer consecutive days to unlock exclusive milestone rewards up to 500 days! Exchange battle XP for Coins to claim your trophies.
          </Text>
        </View>

        {/* Live Balances & Streak Banner */}
        <View style={styles.balanceBanner}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.14)', 'rgba(57, 255, 20, 0.08)', '#09100B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            {/* Coin Balance */}
            <View style={styles.balanceCol}>
              <View style={styles.balanceLabelRow}>
                <Ionicons name="cash" size={16} color="#FFD700" style={{ marginRight: 6 }} />
                <Text style={styles.balanceLabelCoin}>AVAILABLE COINS</Text>
              </View>
              <Text style={styles.balanceValueCoin}>{userCoins.toLocaleString()}</Text>
              <Text style={styles.balanceHint}>Used to redeem rewards</Text>
            </View>

            <View style={styles.balanceDivider} />

            {/* Current Streak */}
            <View style={styles.balanceCol}>
              <View style={styles.balanceLabelRow}>
                <Ionicons name="flame" size={16} color="#FF6A00" style={{ marginRight: 6 }} />
                <Text style={styles.balanceLabelStreak}>CURRENT STREAK</Text>
              </View>
              <Text style={styles.balanceValueStreak}>{currentStreak} Days</Text>
              <Text style={styles.balanceHint}>Longest: {longestStreak} Days</Text>
            </View>

            <View style={styles.balanceDivider} />

            {/* XP Balance */}
            <View style={styles.balanceCol}>
              <View style={styles.balanceLabelRow}>
                <Ionicons name="flash" size={16} color="#00E5FF" style={{ marginRight: 6 }} />
                <Text style={styles.balanceLabelXp}>BATTLE XP</Text>
              </View>
              <Text style={styles.balanceValueXp}>{userXp.toLocaleString()}</Text>
              <Text style={styles.balanceHint}>Convert to Coins</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Store Tabs Navigation */}
        <View style={styles.tabNavRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'streak_rewards' && styles.tabButtonActive]}
            onPress={() => setActiveTab('streak_rewards')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flame"
              size={16}
              color={activeTab === 'streak_rewards' ? '#39FF14' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabButtonText, activeTab === 'streak_rewards' && styles.tabButtonTextActive]}>
              STREAK REWARDS (7–500d)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'xp_packages' && styles.tabButtonActive]}
            onPress={() => setActiveTab('xp_packages')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="swap-horizontal"
              size={16}
              color={activeTab === 'xp_packages' ? '#FFD700' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabButtonText, activeTab === 'xp_packages' && styles.tabButtonTextActive]}>
              XP TO COINS (10 PACKS)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'my_rewards' && styles.tabButtonActive]}
            onPress={() => setActiveTab('my_rewards')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="trophy"
              size={16}
              color={activeTab === 'my_rewards' ? '#00E5FF' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabButtonText, activeTab === 'my_rewards' && styles.tabButtonTextActive]}>
              MY REWARDS ({redeemedRewards.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================================================================= */}
        {/* TAB 1: STREAK REWARDS STORE (7 TO 500 DAYS)                      */}
        {/* ================================================================= */}
        {activeTab === 'streak_rewards' && (
          <View>
            {/* Top Streak Milestone Progress Section (Master Prompt Section 8) */}
            {milestoneProgress && (
              <View style={styles.milestoneSection}>
                <LinearGradient
                  colors={['rgba(255, 106, 0, 0.16)', 'rgba(57, 255, 20, 0.08)', '#0A120D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.milestoneGradient}
                >
                  {/* Top Row: Current vs Target */}
                  <View style={styles.milestoneTopRow}>
                    <View>
                      <Text style={styles.milestoneEyebrow}>STREAK MILESTONE PROGRESSION</Text>
                      <View style={styles.milestoneHeaderRow}>
                        <Ionicons name="flame" size={24} color="#FF6A00" style={{ marginRight: 6 }} />
                        <Text style={styles.milestoneCurrentStreakText}>
                          CURRENT STREAK: {currentStreak} DAYS
                        </Text>
                      </View>
                    </View>

                    <View style={styles.longestStreakBadge}>
                      <Ionicons name="ribbon-outline" size={14} color="#FFD700" style={{ marginRight: 4 }} />
                      <Text style={styles.longestStreakBadgeText}>RECORD: {longestStreak}d</Text>
                    </View>
                  </View>

                  {/* Next Milestone Showcase Card */}
                  <View style={styles.nextMilestoneCard}>
                    <View style={styles.nextMilestoneLeft}>
                      <View style={styles.nextMilestoneIconWrap}>
                        <Ionicons
                          name={milestoneProgress.nextReward.icon || 'trophy'}
                          size={28}
                          color={milestoneProgress.nextReward.accentColor || '#39FF14'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nextMilestoneLabel}>NEXT REWARD MILESTONE</Text>
                        <Text style={styles.nextMilestoneTitle}>
                          {milestoneProgress.nextReward.requiredStreak}-Day {milestoneProgress.nextReward.title}
                        </Text>
                        <View style={styles.nextMilestoneReqRow}>
                          <Text style={styles.nextMilestoneReqText}>
                            Days Remaining: <Text style={{ color: '#39FF14', fontWeight: '900' }}>{milestoneProgress.daysRemaining}</Text>
                          </Text>
                          <Text style={styles.nextMilestoneReqDivider}>•</Text>
                          <Text style={styles.nextMilestoneReqText}>
                            Cost: <Text style={{ color: '#FFD700', fontWeight: '900' }}>{milestoneProgress.coinsNeeded.toLocaleString()} Coins</Text>
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Progress Percentage Circle */}
                    <View style={styles.progressPercentPill}>
                      <Text style={styles.progressPercentPillText}>
                        {currentStreak} / {milestoneProgress.nextReward.requiredStreak}
                      </Text>
                      <Text style={styles.progressPercentSub}>
                        {milestoneProgress.progressPercent}%
                      </Text>
                    </View>
                  </View>

                  {/* Horizontal Progress Bar */}
                  <View style={styles.progressBarTrack}>
                    <LinearGradient
                      colors={['#39FF14', '#00E5FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.min(100, Math.max(4, milestoneProgress.progressPercent))}%` },
                      ]}
                    />
                  </View>

                  {/* Milestone Timeline Strip (7 to 500 Days) */}
                  <View style={styles.timelineContainer}>
                    <Text style={styles.timelineTitle}>MILESTONE TIMELINE (7d → 500d)</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.timelineScrollContent}
                    >
                      {milestoneProgress.timeline.map((node) => {
                        const isRedeemed = redeemedIdsSet.has(node.id);
                        return (
                          <View
                            key={node.id}
                            style={[
                              styles.timelineNode,
                              node.isPassed && styles.timelineNodePassed,
                              node.isNextTarget && styles.timelineNodeNextTarget,
                              isRedeemed && styles.timelineNodeRedeemed,
                            ]}
                          >
                            <View
                              style={[
                                styles.timelineNodeIconWrap,
                                node.isPassed && styles.timelineNodeIconWrapPassed,
                                node.isNextTarget && styles.timelineNodeIconWrapNext,
                              ]}
                            >
                              <Ionicons
                                name={
                                  isRedeemed
                                    ? 'checkmark-circle'
                                    : node.isPassed
                                    ? 'checkmark'
                                    : node.isNextTarget
                                    ? 'flame'
                                    : 'lock-closed'
                                }
                                size={14}
                                color={
                                  isRedeemed
                                    ? '#39FF14'
                                    : node.isPassed
                                    ? '#00E5FF'
                                    : node.isNextTarget
                                    ? '#FF6A00'
                                    : 'rgba(255, 255, 255, 0.4)'
                                }
                              />
                            </View>
                            <Text
                              style={[
                                styles.timelineNodeDaysText,
                                (node.isPassed || node.isNextTarget) && styles.timelineNodeDaysTextActive,
                              ]}
                            >
                              {node.requiredStreak}d
                            </Text>
                            <Text style={styles.timelineNodeCostText}>
                              {node.coinCost >= 1000 ? `${node.coinCost / 1000}k` : node.coinCost}
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Filter Pills, Search Bar & Sort Row (Master Prompt Section 7) */}
            <View style={styles.filterSection}>
              {/* Search Box */}
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search rewards by name, gear, apparel..."
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Pills Row */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterPillsScroll}
              >
                {[
                  { id: 'all', label: `All Rewards (${catalog.length})` },
                  { id: 'available', label: 'Available' },
                  { id: 'locked', label: 'Locked' },
                  { id: 'redeemed', label: `Redeemed (${redeemedRewards.length})` },
                  { id: 'upcoming', label: 'Upcoming Milestones' },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.filterPill, selectedFilter === f.id && styles.filterPillActive]}
                    onPress={() => setSelectedFilter(f.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        selectedFilter === f.id && styles.filterPillTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Sort Selector Row */}
              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>SORT BY:</Text>
                {[
                  { id: 'streak_asc', label: 'Lowest Streak' },
                  { id: 'streak_desc', label: 'Highest Streak' },
                  { id: 'cost_asc', label: 'Lowest Cost' },
                  { id: 'cost_desc', label: 'Highest Cost' },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.sortChip, sortBy === s.id && styles.sortChipActive]}
                    onPress={() => setSortBy(s.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.sortChipText, sortBy === s.id && styles.sortChipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reward Cards Grid (Master Prompt Section 4 & 9) */}
            {processedRewards.length === 0 ? (
              <View style={styles.emptyResultsBox}>
                <Ionicons name="search-outline" size={40} color={colors.textTertiary} />
                <Text style={styles.emptyResultsTitle}>No Rewards Match Your Filter</Text>
                <Text style={styles.emptyResultsSub}>Try clearing your search query or choosing another filter pill.</Text>
                <TouchableOpacity
                  style={styles.clearFilterBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                >
                  <Text style={styles.clearFilterBtnText}>RESET ALL FILTERS</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.rewardGrid, isMobile && styles.rewardGridMobile]}>
                {processedRewards.map((reward) => {
                  const is100d = reward.requiredStreak === 100;
                  const is365d = reward.requiredStreak === 365;
                  const is500d = reward.requiredStreak === 500;
                  const isExclusiveTier = is100d || is365d || is500d;

                  const isAvailable = reward.status === 'AVAILABLE';
                  const isRedeemed = reward.status === 'REDEEMED';
                  const isInsufficientCoins = reward.status === 'INSUFFICIENT_COINS';
                  const isLocked = reward.status === 'LOCKED';

                  return (
                    <View
                      key={reward.id}
                      style={[
                        styles.rewardCard,
                        isMobile && styles.rewardCardMobile,
                        isExclusiveTier && styles.rewardCardExclusive,
                        is100d && styles.rewardCard100d,
                        is365d && styles.rewardCard365d,
                        is500d && styles.rewardCard500d,
                        isAvailable && styles.rewardCardAvailable,
                      ]}
                    >
                      <LinearGradient
                        colors={
                          is500d
                            ? ['rgba(255, 0, 85, 0.22)', 'rgba(57, 255, 20, 0.05)', '#0B0609']
                            : is365d
                            ? ['rgba(255, 215, 0, 0.22)', 'rgba(255, 106, 0, 0.08)', '#0C0A07']
                            : is100d
                            ? ['rgba(255, 215, 0, 0.18)', 'rgba(57, 255, 20, 0.06)', '#0A0E0B']
                            : isAvailable
                            ? ['rgba(57, 255, 20, 0.14)', 'rgba(0, 229, 255, 0.05)', '#0A110D']
                            : ['rgba(255, 255, 255, 0.04)', 'rgba(0, 0, 0, 0.2)', '#070A08']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.rewardCardGradient}
                      >
                        {/* Top Badge Strip */}
                        <View style={styles.rewardCardTopRow}>
                          {/* Rarity & Exclusive Tag */}
                          <View
                            style={[
                              styles.rarityPill,
                              isExclusiveTier && styles.rarityPillExclusive,
                              is500d && { borderColor: '#FF0055' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.rarityPillText,
                                isExclusiveTier && { color: '#FFD700' },
                                is500d && { color: '#FF0055' },
                              ]}
                            >
                              {is500d
                                ? '👑 APEX CHAMPION'
                                : is365d
                                ? '★ 1-YEAR PRESTIGE'
                                : is100d
                                ? '★ CENTURY CLUB'
                                : reward.rarity.toUpperCase()}
                            </Text>
                          </View>

                          {/* Streak Milestone Pill */}
                          <View style={styles.milestonePill}>
                            <Ionicons name="flame" size={12} color="#FF6A00" style={{ marginRight: 3 }} />
                            <Text style={styles.milestonePillText}>{reward.requiredStreak} DAYS</Text>
                          </View>
                        </View>

                        {/* Hero Icon Graphic */}
                        <View style={styles.rewardHeroWrap}>
                          <View
                            style={[
                              styles.rewardIconGlowCircle,
                              { borderColor: `${reward.accentColor}55` },
                              isAvailable && { backgroundColor: `${reward.accentColor}20` },
                            ]}
                          >
                            <Ionicons
                              name={reward.icon}
                              size={38}
                              color={reward.accentColor}
                            />
                          </View>
                          <Text style={styles.rewardTitleText}>{reward.title}</Text>
                          <Text style={styles.rewardCategoryText}>{reward.category}</Text>
                          <Text style={styles.rewardDescText} numberOfLines={2}>
                            {reward.description}
                          </Text>
                        </View>

                        {/* Price & Requirement Indicators */}
                        <View style={styles.rewardReqBox}>
                          <View style={styles.rewardReqItem}>
                            <Text style={styles.rewardReqLabel}>REQUIRED STREAK</Text>
                            <View style={styles.rewardReqValueRow}>
                              <Ionicons name="flame" size={14} color="#FF6A00" style={{ marginRight: 4 }} />
                              <Text style={styles.rewardReqValueText}>{reward.requiredStreak} Days</Text>
                            </View>
                          </View>

                          <View style={styles.rewardReqDivider} />

                          <View style={styles.rewardReqItem}>
                            <Text style={styles.rewardReqLabel}>COIN COST</Text>
                            <View style={styles.rewardReqValueRow}>
                              <Ionicons name="cash" size={14} color="#FFD700" style={{ marginRight: 4 }} />
                              <Text style={styles.rewardReqCostText}>{reward.coinCost.toLocaleString()}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Player Streak Comparison Indicator */}
                        <View style={styles.playerProgressRow}>
                          <Text style={styles.playerProgressLabel}>Your Streak:</Text>
                          <Text
                            style={[
                              styles.playerProgressValue,
                              currentStreak >= reward.requiredStreak ? { color: '#39FF14' } : { color: '#FF3B30' },
                            ]}
                          >
                            {currentStreak} / {reward.requiredStreak} Days
                            {currentStreak >= reward.requiredStreak ? ' ✓' : ''}
                          </Text>
                        </View>

                        {/* Dynamic Action / Status Button (Master Prompt Section 4) */}
                        <TouchableOpacity
                          style={[
                            styles.redeemBtn,
                            isRedeemed && styles.redeemBtnRedeemed,
                            isAvailable && styles.redeemBtnAvailable,
                            (isLocked || isInsufficientCoins) && styles.redeemBtnDisabled,
                          ]}
                          onPress={() => handleOpenRedeemModal(reward)}
                          disabled={isRedeemed || isLocked || isInsufficientCoins}
                          activeOpacity={0.85}
                        >
                          <LinearGradient
                            colors={
                              isRedeemed
                                ? ['rgba(57, 255, 20, 0.2)', 'rgba(57, 255, 20, 0.08)']
                                : isAvailable
                                ? isExclusiveTier
                                  ? ['#FFD700', '#FF9500']
                                  : ['#39FF14', '#00E5FF']
                                : isInsufficientCoins
                                ? ['rgba(255, 149, 0, 0.15)', 'rgba(255, 149, 0, 0.05)']
                                : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.redeemBtnGradient}
                          >
                            <Ionicons
                              name={
                                isRedeemed
                                  ? 'checkmark-done'
                                  : isAvailable
                                  ? 'gift'
                                  : isInsufficientCoins
                                  ? 'cash-outline'
                                  : 'lock-closed'
                              }
                              size={15}
                              color={
                                isRedeemed
                                  ? '#39FF14'
                                  : isAvailable
                                  ? '#050705'
                                  : isInsufficientCoins
                                  ? '#FF9500'
                                  : 'rgba(255, 255, 255, 0.35)'
                              }
                              style={{ marginRight: 6 }}
                            />
                            <Text
                              style={[
                                styles.redeemBtnText,
                                isRedeemed && styles.redeemBtnTextRedeemed,
                                isAvailable && styles.redeemBtnTextAvailable,
                                isInsufficientCoins && styles.redeemBtnTextWarning,
                                isLocked && styles.redeemBtnTextLocked,
                              ]}
                            >
                              {isRedeemed
                                ? 'REDEEMED ✓'
                                : isAvailable
                                ? `REDEEM FOR ${reward.coinCost.toLocaleString()} COINS`
                                : isInsufficientCoins
                                ? `NEED ${(reward.coinCost - userCoins).toLocaleString()} MORE COINS`
                                : `LOCKED (NEED ${reward.requiredStreak - currentStreak} DAYS)`}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ================================================================= */}
        {/* TAB 2: XP TO COIN PACKAGES (Master Prompt: Preserved Existing)   */}
        {/* ================================================================= */}
        {activeTab === 'xp_packages' && (
          <View>
            <View style={styles.sectionHeadingRow}>
              <View>
                <Text style={styles.sectionHeading}>EXCHANGE PACKAGES (10 PACKS)</Text>
                <Text style={styles.sectionSub}>No real money • 100% In-game rewards</Text>
              </View>
              <View style={styles.currentXpPill}>
                <Ionicons name="flash" size={13} color="#00E5FF" style={{ marginRight: 4 }} />
                <Text style={styles.currentXpPillText}>{userXp.toLocaleString()} XP Available</Text>
              </View>
            </View>

            {/* 10 Exchange Package Cards Grid */}
            <View style={[styles.packageGrid, isMobile && styles.packageGridMobile]}>
              {XP_TO_COIN_PACKAGES.map((pkg) => {
                const canAfford = userXp >= pkg.xpRequired;
                const isTopTier = pkg.id >= 9;

                return (
                  <View
                    key={pkg.id}
                    style={[
                      styles.packageCard,
                      isTopTier && styles.packageCardTopTier,
                      isMobile && styles.packageCardMobile,
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isTopTier
                          ? ['rgba(255, 215, 0, 0.22)', 'rgba(255, 106, 0, 0.08)', '#0D120E']
                          : ['rgba(57, 255, 20, 0.12)', 'rgba(255, 215, 0, 0.05)', '#0A0F0C']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.packageCardGradient}
                    >
                      {/* Top Row: Package ID & Badge */}
                      <View style={styles.pkgTopRow}>
                        <Text style={styles.pkgNumberText}>PACK #{pkg.id}</Text>
                        {pkg.badge && (
                          <View style={[styles.pkgBadge, isTopTier && styles.pkgBadgeTopTier]}>
                            <Text style={styles.pkgBadgeText}>{pkg.badge}</Text>
                          </View>
                        )}
                      </View>

                      {/* Coin Reward Hero */}
                      <View style={styles.pkgHeroWrap}>
                        <View style={styles.pkgCoinIconGlow}>
                          <Ionicons name="cash" size={28} color="#FFD700" />
                        </View>
                        <Text style={styles.pkgCoinsText}>+{pkg.coinsReceived} COINS</Text>
                        <Text style={styles.pkgLabelText}>{pkg.label}</Text>
                      </View>

                      {/* Cost Pill */}
                      <View style={styles.costPill}>
                        <Ionicons name="flash" size={13} color="#00E5FF" style={{ marginRight: 4 }} />
                        <Text style={styles.costPillText}>COST: {pkg.xpRequired} XP</Text>
                      </View>

                      {/* Exchange Button */}
                      <TouchableOpacity
                        style={[
                          styles.exchangeBtn,
                          !canAfford && styles.exchangeBtnDisabled,
                          isTopTier && canAfford && styles.exchangeBtnTopTier,
                        ]}
                        onPress={() => handleSelectPackage(pkg)}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={
                            canAfford
                              ? isTopTier
                                ? ['#FFD700', '#FF9500']
                                : ['#39FF14', '#00E5FF']
                              : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)']
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.exchangeBtnGradient}
                        >
                          <Ionicons
                            name={canAfford ? 'swap-horizontal' : 'lock-closed'}
                            size={15}
                            color={canAfford ? '#050705' : 'rgba(255, 255, 255, 0.35)'}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.exchangeBtnText,
                              !canAfford && styles.exchangeBtnTextDisabled,
                            ]}
                          >
                            {canAfford ? `EXCHANGE ${pkg.xpRequired} XP` : `NEED ${pkg.xpRequired - userXp} XP`}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* TAB 3: MY REWARDS COLLECTION (Master Prompt Section 6)           */}
        {/* ================================================================= */}
        {activeTab === 'my_rewards' && (
          <View style={styles.myRewardsContainer}>
            {/* Virtual Physical Rewards Policy Notice */}
            <View style={styles.disclaimerBox}>
              <Ionicons name="information-circle-outline" size={20} color="#00E5FF" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.disclaimerHeading}>VIRTUAL COLLECTION REWARDS NOTICE</Text>
                <Text style={styles.disclaimerText}>
                  All physical-style items (Water Bottles, Coffee Cups, T-Shirts, Hoodies, Backpacks, Jackets) are prestigious digital collector relics displayed in your PIXO Hall of Fame. Digital cosmetics (Badges and Frames) can be equipped to your public profile immediately.
                </Text>
              </View>
            </View>

            {redeemedRewards.length === 0 ? (
              <View style={styles.emptyCollectionBox}>
                <Ionicons name="trophy-outline" size={54} color="rgba(255, 215, 0, 0.3)" />
                <Text style={styles.emptyCollectionTitle}>Your Trophy Room is Empty</Text>
                <Text style={styles.emptyCollectionSub}>
                  Maintain your daily streak and earn coins to redeem exclusive commemorative trophies and gear!
                </Text>
                <TouchableOpacity
                  style={styles.browseStoreBtn}
                  onPress={() => setActiveTab('streak_rewards')}
                >
                  <LinearGradient
                    colors={['#39FF14', '#00E5FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.browseStoreGradient}
                  >
                    <Ionicons name="flame" size={16} color="#050705" style={{ marginRight: 6 }} />
                    <Text style={styles.browseStoreText}>EXPLORE STREAK MILESTONES</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.collectionGrid, isMobile && styles.collectionGridMobile]}>
                {redeemedRewards.map((item) => {
                  const isCosmetic = item.type === 'digital' && item.cosmeticType;
                  const isEquipped = isCosmetic && equippedCosmetics[item.cosmeticType] === item.cosmeticValue;

                  return (
                    <View key={item.id} style={[styles.collectionCard, isMobile && styles.collectionCardMobile]}>
                      <LinearGradient
                        colors={['rgba(255, 215, 0, 0.12)', 'rgba(57, 255, 20, 0.05)', '#0B0F0C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.collectionCardGradient}
                      >
                        <View style={styles.collectionCardHeader}>
                          <View style={styles.milestonePill}>
                            <Ionicons name="flame" size={11} color="#FF6A00" style={{ marginRight: 3 }} />
                            <Text style={styles.milestonePillText}>{item.requiredStreak}d Milestone</Text>
                          </View>
                          <View style={styles.verifiedClaimPill}>
                            <Ionicons name="checkmark-done" size={12} color="#39FF14" style={{ marginRight: 3 }} />
                            <Text style={styles.verifiedClaimPillText}>VERIFIED CLAIM</Text>
                          </View>
                        </View>

                        <View style={styles.collectionHeroWrap}>
                          <View style={styles.collectionIconWrap}>
                            <Ionicons name={item.icon || 'trophy'} size={32} color="#FFD700" />
                          </View>
                          <Text style={styles.collectionTitleText}>{item.rewardTitle || item.title}</Text>
                          <Text style={styles.collectionCategoryText}>{item.category}</Text>
                          <Text style={styles.collectionDateText}>Redeemed on {item.formattedDate || 'Verified'}</Text>
                        </View>

                        {/* Equip Button if Cosmetic */}
                        {isCosmetic && (
                          <TouchableOpacity
                            style={[styles.equipBtn, isEquipped && styles.equipBtnActive]}
                            onPress={() => handleToggleEquipCosmetic(item)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name={isEquipped ? 'checkmark-circle' : 'shirt-outline'}
                              size={14}
                              color={isEquipped ? '#050705' : colors.primary}
                              style={{ marginRight: 5 }}
                            />
                            <Text style={[styles.equipBtnText, isEquipped && styles.equipBtnTextActive]}>
                              {isEquipped ? 'EQUIPPED TO PROFILE' : 'EQUIP TO PROFILE'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </LinearGradient>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ================================================================= */}
      {/* MODAL 1: CONFIRM STREAK REWARD REDEMPTION                        */}
      {/* ================================================================= */}
      {rewardToRedeem && (
        <Modal
          visible={!!rewardToRedeem}
          transparent
          animationType="fade"
          onRequestClose={() => !isRedeemingStreak && setRewardToRedeem(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
              <LinearGradient
                colors={['#17120B', '#0E0C09', '#080A08']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalGradient}
              >
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <View style={styles.modalIconWrapStreak}>
                      <Ionicons name={rewardToRedeem.icon} size={22} color="#FFD700" />
                    </View>
                    <View>
                      <Text style={styles.modalHeading}>CONFIRM REDEMPTION</Text>
                      <Text style={styles.modalSubheading}>
                        {rewardToRedeem.requiredStreak}-Day Milestone • {rewardToRedeem.category}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setRewardToRedeem(null)}
                    disabled={isRedeemingStreak}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Offer Summary Banner */}
                <View style={styles.offerBanner}>
                  <View style={styles.offerItem}>
                    <Text style={styles.offerLabel}>DEDUCT COINS</Text>
                    <Text style={styles.offerValueCoin}>-{rewardToRedeem.coinCost.toLocaleString()} Coins</Text>
                  </View>

                  <Ionicons name="arrow-forward" size={20} color="#39FF14" />

                  <View style={styles.offerItem}>
                    <Text style={styles.offerLabel}>UNLOCK REWARD</Text>
                    <Text style={styles.offerValueReward}>{rewardToRedeem.title}</Text>
                  </View>
                </View>

                {/* Balance Impact Breakdown */}
                <View style={styles.impactCard}>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Required Consecutive Streak:</Text>
                    <Text style={[styles.impactValue, { color: '#39FF14' }]}>
                      {rewardToRedeem.requiredStreak} Days (Current: {currentStreak} Days ✓)
                    </Text>
                  </View>

                  <View style={styles.impactDivider} />

                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Current Coin Balance:</Text>
                    <Text style={styles.impactValue}>{userCoins.toLocaleString()} Coins</Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Coins After Deduction:</Text>
                    <Text style={[styles.impactValue, { color: '#FFD700' }]}>
                      {(userCoins - rewardToRedeem.coinCost).toLocaleString()} Coins
                    </Text>
                  </View>
                </View>

                <View style={styles.modalNoticeBox}>
                  <Ionicons name="shield-checkmark" size={15} color="#00E5FF" style={{ marginRight: 6 }} />
                  <Text style={styles.modalNoticeText}>
                    One-time milestone redemption. Item will be permanently archived in your player collection.
                  </Text>
                </View>

                {streakErrorMessage && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#FF3B30" style={{ marginRight: 6 }} />
                    <Text style={styles.errorText}>{streakErrorMessage}</Text>
                  </View>
                )}

                {/* Modal Action Buttons */}
                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setRewardToRedeem(null)}
                    disabled={isRedeemingStreak}
                  >
                    <Text style={styles.modalCancelText}>CANCEL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, isRedeemingStreak && styles.modalConfirmBtnDisabled]}
                    onPress={handleConfirmRedeemReward}
                    disabled={isRedeemingStreak}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FF9500']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalConfirmGradient}
                    >
                      {isRedeemingStreak ? (
                        <ActivityIndicator size="small" color="#050705" />
                      ) : (
                        <>
                          <Ionicons name="gift" size={16} color="#050705" style={{ marginRight: 6 }} />
                          <Text style={styles.modalConfirmText}>CONFIRM & REDEEM</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: STREAK REWARD SUCCESS CELEBRATION                        */}
      {/* ================================================================= */}
      {redeemSuccessData && (
        <Modal
          visible={!!redeemSuccessData}
          transparent
          animationType="fade"
          onRequestClose={() => setRedeemSuccessData(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successCard}>
              <LinearGradient
                colors={['#102213', '#08140B', '#040B06']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.successGradient}
              >
                <View style={styles.successIconGlow}>
                  <Ionicons name={redeemSuccessData.reward.icon || 'trophy'} size={38} color="#FFD700" />
                </View>

                <Text style={styles.successTitle}>REWARD UNLOCKED! 🏆</Text>
                <Text style={styles.successSubtitle}>
                  Congratulations on maintaining your {redeemSuccessData.reward.requiredStreak}-day streak!
                </Text>

                <View style={styles.successRewardBox}>
                  <Text style={styles.successRewardTitle}>{redeemSuccessData.reward.title}</Text>
                  <Text style={styles.successRewardSub}>
                    Archived in My Rewards • Remaining Coins: {redeemSuccessData.remainingCoins.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.successActionsRow}>
                  <TouchableOpacity
                    style={styles.successSecondaryBtn}
                    onPress={() => setRedeemSuccessData(null)}
                  >
                    <Text style={styles.successSecondaryBtnText}>CONTINUE SHOPPING</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.successPrimaryBtn}
                    onPress={() => {
                      setRedeemSuccessData(null);
                      setActiveTab('my_rewards');
                    }}
                  >
                    <LinearGradient
                      colors={['#39FF14', '#00E5FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.successDoneGradient}
                    >
                      <Text style={styles.successDoneText}>VIEW IN MY REWARDS</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: XP TO COIN CONFIRMATION (Existing preserved)             */}
      {/* ================================================================= */}
      {selectedPackage && (
        <Modal
          visible={!!selectedPackage}
          transparent
          animationType="fade"
          onRequestClose={() => !isSubmittingXp && setSelectedPackage(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
              <LinearGradient
                colors={['#17120B', '#0E0C09', '#080A08']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <View style={styles.modalIconWrap}>
                      <Ionicons name="swap-horizontal" size={20} color="#FFD700" />
                    </View>
                    <View>
                      <Text style={styles.modalHeading}>CONFIRM EXCHANGE</Text>
                      <Text style={styles.modalSubheading}>
                        Package #{selectedPackage.id} • {selectedPackage.label}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setSelectedPackage(null)}
                    disabled={isSubmittingXp}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.offerBanner}>
                  <View style={styles.offerItem}>
                    <Text style={styles.offerLabel}>DEDUCT</Text>
                    <Text style={styles.offerValueXp}>-{selectedPackage.xpRequired} XP</Text>
                  </View>

                  <Ionicons name="arrow-forward" size={20} color="#39FF14" />

                  <View style={styles.offerItem}>
                    <Text style={styles.offerLabel}>RECEIVE</Text>
                    <Text style={styles.offerValueCoin}>+{selectedPackage.coinsReceived} COINS</Text>
                  </View>
                </View>

                <View style={styles.impactCard}>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Current XP Balance:</Text>
                    <Text style={styles.impactValue}>{userXp.toLocaleString()} XP</Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>XP After Exchange:</Text>
                    <Text style={[styles.impactValue, { color: '#00E5FF' }]}>
                      {(userXp - selectedPackage.xpRequired).toLocaleString()} XP
                    </Text>
                  </View>

                  <View style={styles.impactDivider} />

                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Current Coin Balance:</Text>
                    <Text style={styles.impactValue}>{userCoins.toLocaleString()} Coins</Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Coins After Exchange:</Text>
                    <Text style={[styles.impactValue, { color: '#FFD700' }]}>
                      {(userCoins + selectedPackage.coinsReceived).toLocaleString()} Coins
                    </Text>
                  </View>
                </View>

                {xpErrorMessage && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#FF3B30" style={{ marginRight: 6 }} />
                    <Text style={styles.errorText}>{xpErrorMessage}</Text>
                  </View>
                )}

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setSelectedPackage(null)}
                    disabled={isSubmittingXp}
                  >
                    <Text style={styles.modalCancelText}>CANCEL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, isSubmittingXp && styles.modalConfirmBtnDisabled]}
                    onPress={handleConfirmExchange}
                    disabled={isSubmittingXp}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FF9500']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalConfirmGradient}
                    >
                      {isSubmittingXp ? (
                        <ActivityIndicator size="small" color="#050705" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={16} color="#050705" style={{ marginRight: 6 }} />
                          <Text style={styles.modalConfirmText}>CONFIRM & EXCHANGE</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      )}

      {/* ================================================================= */}
      {/* MODAL 4: XP TO COIN SUCCESS (Existing preserved)                 */}
      {/* ================================================================= */}
      {successExchange && (
        <Modal
          visible={!!successExchange}
          transparent
          animationType="fade"
          onRequestClose={() => setSuccessExchange(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successCard}>
              <LinearGradient
                colors={['#102213', '#08140B', '#040B06']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.successGradient}
              >
                <View style={styles.successIconGlow}>
                  <Ionicons name="checkmark-done" size={36} color="#39FF14" />
                </View>

                <Text style={styles.successTitle}>EXCHANGE SUCCESSFUL! 🪙</Text>
                <Text style={styles.successSubtitle}>
                  +{successExchange.pkg.coinsReceived} Coins have been added to your vault.
                </Text>

                <View style={styles.successBalancesBox}>
                  <Text style={styles.successBalanceText}>
                    ⚡ XP Remaining: {successExchange.newXp.toLocaleString()} XP
                  </Text>
                  <Text style={styles.successBalanceCoinText}>
                    🪙 Total Coins: {successExchange.newCoins.toLocaleString()} Coins
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.successDoneBtn}
                  onPress={() => setSuccessExchange(null)}
                >
                  <LinearGradient
                    colors={['#39FF14', '#00E5FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.successDoneGradient}
                  >
                    <Text style={styles.successDoneText}>CONTINUE PLAYING</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050705',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  backBtnText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 106, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.3)',
  },
  titleBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FF9500',
    letterSpacing: 0.8,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },

  // Live Balances Banner
  balanceBanner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    overflow: 'hidden',
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 14px rgba(255, 215, 0, 0.1)',
        }
      : {}),
  },
  balanceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  balanceCol: {
    flex: 1,
  },
  balanceDivider: {
    width: 1,
    height: '75%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceLabelCoin: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFE066',
    letterSpacing: 0.8,
  },
  balanceLabelStreak: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FF9500',
    letterSpacing: 0.8,
  },
  balanceLabelXp: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#5CE1E6',
    letterSpacing: 0.8,
  },
  balanceValueCoin: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  balanceValueStreak: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FF6A00',
    letterSpacing: 0.5,
  },
  balanceValueXp: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  balanceHint: {
    fontSize: 9.5,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // Store Tabs Navigation
  tabNavRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // Milestone Progress Section
  milestoneSection: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#090F0C',
  },
  milestoneGradient: {
    padding: 16,
  },
  milestoneTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  milestoneEyebrow: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FF9500',
    letterSpacing: 0.8,
  },
  milestoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  milestoneCurrentStreakText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  longestStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  longestStreakBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD700',
  },
  nextMilestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  nextMilestoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nextMilestoneIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  nextMilestoneLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  nextMilestoneTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 1,
  },
  nextMilestoneReqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  nextMilestoneReqText: {
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  nextMilestoneReqDivider: {
    color: colors.textTertiary,
    marginHorizontal: 6,
  },
  progressPercentPill: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  progressPercentPillText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#39FF14',
  },
  progressPercentSub: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textTertiary,
    marginTop: 1,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Timeline
  timelineContainer: {
    marginTop: 4,
  },
  timelineTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  timelineScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  timelineNode: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 50,
  },
  timelineNodePassed: {
    borderColor: 'rgba(0, 229, 255, 0.4)',
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
  },
  timelineNodeNextTarget: {
    borderColor: '#FF6A00',
    backgroundColor: 'rgba(255, 106, 0, 0.12)',
  },
  timelineNodeRedeemed: {
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
  },
  timelineNodeIconWrap: {
    marginBottom: 3,
  },
  timelineNodeIconWrapPassed: {},
  timelineNodeIconWrapNext: {},
  timelineNodeDaysText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  timelineNodeDaysTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  timelineNodeCostText: {
    fontSize: 9,
    color: '#FFD700',
    fontWeight: '700',
    marginTop: 1,
  },

  // Filter Section
  filterSection: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
  },
  filterPillsScroll: {
    gap: 6,
    paddingBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  filterPillActive: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderColor: '#39FF14',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#39FF14',
    fontWeight: '900',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  sortLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginRight: 4,
  },
  sortChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  sortChipActive: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
  },
  sortChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sortChipTextActive: {
    color: '#FFD700',
    fontWeight: '900',
  },

  // Reward Cards Grid
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rewardGridMobile: {
    flexDirection: 'column',
  },
  rewardCard: {
    flex: 1,
    minWidth: 280,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    backgroundColor: '#090D0A',
    ...(Platform.OS === 'web'
      ? {
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
        }
      : {}),
  },
  rewardCardMobile: {
    width: '100%',
  },
  rewardCardAvailable: {
    borderColor: 'rgba(57, 255, 20, 0.45)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.6), 0 0 12px rgba(57, 255, 20, 0.15)',
        }
      : {}),
  },
  rewardCardExclusive: {
    borderWidth: 1.5,
  },
  rewardCard100d: {
    borderColor: 'rgba(255, 215, 0, 0.5)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 16px rgba(255, 215, 0, 0.2)',
        }
      : {}),
  },
  rewardCard365d: {
    borderColor: 'rgba(255, 149, 0, 0.6)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 149, 0, 0.25)',
        }
      : {}),
  },
  rewardCard500d: {
    borderColor: 'rgba(255, 0, 85, 0.7)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8), 0 0 24px rgba(255, 0, 85, 0.3)',
        }
      : {}),
  },
  rewardCardGradient: {
    padding: 16,
  },
  rewardCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rarityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  rarityPillExclusive: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
  },
  rarityPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  milestonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
  },
  milestonePillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FF6A00',
    letterSpacing: 0.5,
  },
  rewardHeroWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  rewardIconGlowCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 10,
  },
  rewardTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  rewardCategoryText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textTertiary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  rewardDescText: {
    fontSize: 10.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  rewardReqBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  rewardReqItem: {
    flex: 1,
    alignItems: 'center',
  },
  rewardReqDivider: {
    width: 1,
    height: '75%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  rewardReqLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  rewardReqValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardReqValueText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  rewardReqCostText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFD700',
  },
  playerProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 2,
  },
  playerProgressLabel: {
    fontSize: 10.5,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  playerProgressValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  redeemBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  redeemBtnAvailable: {
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.6)',
  },
  redeemBtnRedeemed: {
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
  },
  redeemBtnDisabled: {
    opacity: 0.55,
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : {}),
  },
  redeemBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  redeemBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  redeemBtnTextAvailable: {
    color: '#050705',
  },
  redeemBtnTextRedeemed: {
    color: '#39FF14',
  },
  redeemBtnTextWarning: {
    color: '#FF9500',
  },
  redeemBtnTextLocked: {
    color: 'rgba(255, 255, 255, 0.45)',
  },

  // Empty Results
  emptyResultsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyResultsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptyResultsSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  clearFilterBtn: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  clearFilterBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: colors.primary,
  },

  // My Rewards Tab
  myRewardsContainer: {},
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  disclaimerHeading: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#00E5FF',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  disclaimerText: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  emptyCollectionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyCollectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 14,
  },
  emptyCollectionSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 380,
    marginTop: 6,
    lineHeight: 16,
  },
  browseStoreBtn: {
    marginTop: 18,
    borderRadius: 8,
    overflow: 'hidden',
  },
  browseStoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  browseStoreText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 0.8,
  },
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  collectionGridMobile: {
    flexDirection: 'column',
  },
  collectionCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    overflow: 'hidden',
    backgroundColor: '#090E0B',
  },
  collectionCardMobile: {
    width: '100%',
  },
  collectionCardGradient: {
    padding: 16,
  },
  collectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  verifiedClaimPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedClaimPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#39FF14',
  },
  collectionHeroWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  collectionIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 8,
  },
  collectionTitleText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  collectionCategoryText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#00E5FF',
    marginTop: 2,
  },
  collectionDateText: {
    fontSize: 9.5,
    color: colors.textTertiary,
    marginTop: 4,
  },
  equipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.35)',
    marginTop: 12,
  },
  equipBtnActive: {
    backgroundColor: '#39FF14',
    borderColor: '#39FF14',
  },
  equipBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  equipBtnTextActive: {
    color: '#050705',
  },

  // XP Packages Section (Preserved)
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 10.5,
    color: colors.textTertiary,
  },
  currentXpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  currentXpPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E5FF',
  },
  packageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  packageGridMobile: {
    flexDirection: 'column',
  },
  packageCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    overflow: 'hidden',
    backgroundColor: '#0A0F0C',
  },
  packageCardTopTier: {
    borderColor: 'rgba(255, 215, 0, 0.45)',
  },
  packageCardMobile: {
    width: '100%',
  },
  packageCardGradient: {
    padding: 16,
  },
  pkgTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pkgNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  pkgBadge: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.35)',
  },
  pkgBadgeTopTier: {
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    borderColor: 'rgba(255, 215, 0, 0.45)',
  },
  pkgBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#39FF14',
    letterSpacing: 0.5,
  },
  pkgHeroWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  pkgCoinIconGlow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 8,
  },
  pkgCoinsText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  pkgLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  costPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderRadius: 6,
    paddingVertical: 5,
    marginVertical: 12,
  },
  costPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 0.5,
  },
  exchangeBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  exchangeBtnDisabled: {
    opacity: 0.5,
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : {}),
  },
  exchangeBtnTopTier: {
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  exchangeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  exchangeBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 0.6,
  },
  exchangeBtnTextDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    overflow: 'hidden',
    backgroundColor: '#0C0A07',
  },
  modalCardMobile: {
    maxWidth: '100%',
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalIconWrapStreak: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.3)',
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalSubheading: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 16,
  },
  offerItem: {
    alignItems: 'center',
  },
  offerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  offerValueXp: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF6961',
  },
  offerValueCoin: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFD700',
  },
  offerValueReward: {
    fontSize: 14,
    fontWeight: '900',
    color: '#39FF14',
    maxWidth: 160,
    textAlign: 'center',
  },
  impactCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  impactLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  impactValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  impactDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginVertical: 6,
  },
  modalNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 14,
  },
  modalNoticeText: {
    fontSize: 9.5,
    color: '#5CE1E6',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.35)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#FF6961',
    fontSize: 11,
    fontWeight: '700',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  modalConfirmBtn: {
    flex: 2,
    height: 42,
    borderRadius: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  modalConfirmBtnDisabled: {
    opacity: 0.7,
  },
  modalConfirmGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#050705',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Success Celebration Modal
  successCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    overflow: 'hidden',
  },
  successGradient: {
    padding: 24,
    alignItems: 'center',
  },
  successIconGlow: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  successRewardBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  successRewardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#39FF14',
    marginBottom: 4,
  },
  successRewardSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  successActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  successSecondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  successSecondaryBtnText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  successPrimaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  successDoneBtn: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  successDoneGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDoneText: {
    color: '#050705',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  successBalancesBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },
  successBalanceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00E5FF',
    marginBottom: 4,
  },
  successBalanceCoinText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFD700',
  },
});
