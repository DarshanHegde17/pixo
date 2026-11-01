import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  Alert,
  Image,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlowingBackground } from '../components/GlowingBackground';
import { FeaturedHeroCard } from '../components/FeaturedHeroCard';
import { GameDetailsModal } from '../components/GameDetailsModal';
import { ProfileScreen } from './ProfileScreen';
import { GameSessionRunnerModal } from '../components/gameplay/GameSessionRunnerModal';
import { TargetNumberGameModal } from '../components/gameplay/TargetNumberGameModal';
import { RestoreStreakModal } from '../components/profile/RestoreStreakModal';
import { CoinStoreScreen } from './CoinStoreScreen';
import {
  GamingActivityService,
  GAME_LEVELS_CONFIG,
  DEFAULT_DAILY_QUESTS,
} from '../services/gamingActivityService';
import { AuthService } from '../services/authService';
import { GamePersistenceService } from '../services/gamePersistenceService';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

// Category Pills
const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'flash' },
  { id: 'rpg', label: 'Action RPG', icon: 'shield' },
  { id: 'scifi', label: 'Sci-Fi', icon: 'planet' },
  { id: 'retro', label: 'Retro 8-Bit', icon: 'game-controller' },
  { id: 'puzzle', label: 'Cyber Puzzle', icon: 'cube' },
  { id: 'racing', label: 'Neon Racing', icon: 'car-sport' },
];

// Continue Playing Games
const RECENT_GAMES = [
  {
    id: 'g_target_no',
    title: 'Target Number (Target No.)',
    category: 'Speed Math Rush',
    catId: 'puzzle',
    progress: 1.0,
    progressText: 'Levels 1–3 Ready',
    lastPlayed: 'Live Now',
    rating: 5.0,
    accentColor: '#39FF14',
    gradient: ['#0A2A14', '#041408'],
    icon: 'calculator-outline',
    badge: 'NEW GAME',
    desc: 'Solve fast math values in 30 seconds! Choose +, -, *, % operators and beat Level 1 (5 values), Level 2 (7 values), and Level 3 (10 values).',
    tags: ['New Game', '+, -, *, %', '30s Rush', 'Levels 1–3', 'XP Rewards'],
    isTargetGame: true,
  },
  {
    id: 'g1',
    title: 'Neon Runner: 2099',
    category: 'Cyber Arcade',
    catId: 'scifi',
    progress: 0.78,
    progressText: '78% completed',
    lastPlayed: '2 hours ago',
    rating: 4.9,
    accentColor: colors.primary,
    gradient: ['#0A2514', '#06160D'],
    icon: 'flash-outline',
    badge: 'Trending',
    desc: 'High-speed parkour across neo-Tokyo rooftops with custom synthwave soundtrack and combo multiplier mechanics.',
    tags: ['Trending', 'Single Player', 'Cloud Saved', 'Gamepad Ready'],
  },
  {
    id: 'g2',
    title: 'Shadow Blade Reborn',
    category: 'Action RPG',
    catId: 'rpg',
    progress: 0.55,
    progressText: 'Chapter 4 / 8',
    lastPlayed: 'Yesterday',
    rating: 4.8,
    accentColor: colors.orangeAccent,
    gradient: ['#2B1405', '#160902'],
    icon: 'skull-outline',
    badge: 'Solo Quest',
    desc: 'Wield dual plasma katanas against rogue corporate legions. Craft cyber augmentations and conquer unforgiving boss arenas.',
    tags: ['Solo Quest', 'Action RPG', 'Deep Combat', 'Offline Mode'],
  },
  {
    id: 'g3',
    title: 'Astro Odyssey Zero',
    category: 'Space Exploration',
    catId: 'scifi',
    progress: 0.35,
    progressText: 'Sector 7',
    lastPlayed: '3 days ago',
    rating: 4.7,
    accentColor: colors.cyan,
    gradient: ['#051F2A', '#020F16'],
    icon: 'planet-outline',
    badge: 'Popular',
    desc: 'Pilot an interstellar scout craft through uncharted wormholes. Discover alien ruins and solve cosmic gravitational puzzles.',
    tags: ['Popular', 'Sci-Fi', 'Atmospheric', 'Cloud Sync'],
  },
];

// Extra Premium Section: Discover Something Epic
const DISCOVERY_GAMES = [
  {
    id: 'd1',
    title: 'Quantum Fracture',
    label: 'NEW RELEASES',
    genre: 'Sci-Fi Roguelike',
    catId: 'scifi',
    rating: '4.9 ★',
    desc: 'Collapse temporal dimensions to outmaneuver anomaly guardians in high-stakes procedurally generated vaults.',
    accent: colors.primary,
    icon: 'infinite-outline',
    tags: ['New Release', 'Roguelike', 'Ray Tracing'],
  },
  {
    id: 'd2',
    title: 'Chrono Glitch Tactics',
    label: 'HIDDEN GEMS',
    genre: 'Turn-Based Strategy',
    catId: 'puzzle',
    rating: '4.9 ★',
    desc: 'Rewind battlefield rounds up to three times. Master chess-like positioning against rogue cyber syndicates.',
    accent: colors.orangeAccent,
    icon: 'time-outline',
    tags: ['Hidden Gem', 'Tactical', 'Single Player'],
  },
  {
    id: 'd3',
    title: 'Voidwalker: Origins',
    label: 'OFFLINE ADVENTURES',
    genre: 'Dark Fantasy RPG',
    catId: 'rpg',
    rating: '4.9 ★',
    desc: 'Explore a ruined gothic kingdom with no internet connection required. Over 40 hours of rich lore and branch choices.',
    accent: colors.emerald,
    icon: 'shield-outline',
    tags: ['Offline Exclusive', 'Action RPG', 'Full Story'],
  },
  {
    id: 'd4',
    title: 'Synthwave Highway 84',
    label: 'SPEED CHALLENGES',
    genre: 'Neon Racing',
    catId: 'racing',
    rating: '4.8 ★',
    desc: 'Outrun police drones down infinite neon highways. Features authentic 1980s analog synthesizer audio tracks.',
    accent: colors.cyan,
    icon: 'car-sport-outline',
    tags: ['High Speed', 'Arcade Physics', 'Controller Ready'],
  },
  {
    id: 'd5',
    title: 'Nexus Core Matrix',
    label: 'CHALLENGING PUZZLES',
    genre: 'Cyber Puzzle',
    catId: 'puzzle',
    rating: '4.7 ★',
    desc: 'Rewire neural logic gates to liberate sentient AI nodes before corporate counter-measures breach your firewall.',
    accent: colors.orangeWarm,
    icon: 'hardware-chip-outline',
    tags: ['Brain Teaser', 'Cyberpunk', 'Original Soundtrack'],
  },
];

// Daily Quests Data - Default state from Master Prompt Section 4
const INITIAL_DAILY_QUESTS = DEFAULT_DAILY_QUESTS.map((q) => ({
  ...q,
  current: 0,
  claimed: false,
  isCompleted: false,
  progress: 0,
}));

// Trending Games
const TRENDING_GAMES = [
  {
    id: 't1',
    title: 'Voidwalker: Origins',
    genre: 'Dark Fantasy Action RPG',
    rating: '4.9 ★',
    downloads: '150k players',
    description: 'Immerse into a rich solo storyline with deep character skill trees, weapon craft, and unforgiving boss encounters.',
    color: colors.primary,
  },
  {
    id: 't2',
    title: 'Synthwave Highway 84',
    genre: 'Hyper Speed Neon Racer',
    rating: '4.8 ★',
    downloads: '85k players',
    description: 'Outrun the grid soundtrack with high-speed retro arcade driving physics and customizable aerodynamic hovercrafts.',
    color: colors.orangeAccent,
  },
];

export const HomeScreen = ({ onNavigateToLogin }) => {
  const {
    user,
    streakState,
    logout,
    addXp,
    claimDailyReward,
    restoreStreak,
    refreshStreak,
    simulateMissedDays,
  } = useAuth();

  // Dynamic user stats state with real session persistence
  const [userXp, setUserXp] = useState(user?.xp ?? 0);
  const [userCoins, setUserCoins] = useState(user?.coins ?? 0);
  const [userStreak, setUserStreak] = useState(streakState?.currentStreak ?? (user?.streak ?? 0));
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Interaction states
  const [selectedGameModal, setSelectedGameModal] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [quests, setQuests] = useState(INITIAL_DAILY_QUESTS);
  const [liveSessionGame, setLiveSessionGame] = useState(null);
  const [isTargetGameOpen, setIsTargetGameOpen] = useState(false);
  const [hasActiveTargetSession, setHasActiveTargetSession] = useState(false);

  // Load verified user reward transactions
  const loadRecentTransactions = async () => {
    if (!user?.id) return;
    try {
      const txs = await GamingActivityService.getTransactions(user.id);
      setRecentTransactions(txs || []);
    } catch (e) {
      console.warn('Error loading recent transactions:', e);
    }
  };

  useEffect(() => {
    loadRecentTransactions();
  }, [user?.id]);

  // Check for unfinished active 30-second game on app launch / mount
  useEffect(() => {
    let isMounted = true;
    const checkSavedGame = async () => {
      if (!user?.id) return;
      try {
        const active = await GamePersistenceService.getActiveSession(user.id);
        if (active && isMounted) {
          if (active.status === 'in_progress') {
            setHasActiveTargetSession(true);
            setIsTargetGameOpen(true);
          }
        }
      } catch (e) {
        console.warn('Error checking saved game session on launch:', e);
      }
    };
    checkSavedGame();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Refresh active session status when modal opens or closes
  useEffect(() => {
    const refreshActiveSessionStatus = async () => {
      if (!user?.id) return;
      try {
        const active = await GamePersistenceService.getActiveSession(user.id);
        setHasActiveTargetSession(!!active && active.status === 'in_progress');
      } catch {
        setHasActiveTargetSession(false);
      }
    };
    refreshActiveSessionStatus();
  }, [isTargetGameOpen, user?.id]);

  // Sequential Level & Daily Quest states (Master Prompt Sections 4 & 5)
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [gameLevels, setGameLevels] = useState([]);
  const [dailyQuests, setDailyQuests] = useState([]);
  const [resetCountdown, setResetCountdown] = useState('8h 00m');
  const [targetLevelToPlay, setTargetLevelToPlay] = useState(1);

  const playerName = user?.name || 'SoloSlayer';

  // Load levels and quests from database
  const loadLevelsAndQuests = async () => {
    if (!user?.id) return;
    try {
      const [unlocked, levels, qData] = await Promise.all([
        GamingActivityService.getUserUnlockedLevel(user.id),
        GamingActivityService.getGameLevels(user.id),
        GamingActivityService.getDailyQuests(user.id),
      ]);
      setUnlockedLevel(unlocked || 1);
      setGameLevels(levels || []);
      if (qData) {
        setDailyQuests(qData.quests || []);
        setResetCountdown(qData.resetTimeString || GamingActivityService.getTimeUntilMidnight());
      }
    } catch (e) {
      console.warn('Error loading game levels or daily quests:', e);
    }
  };

  useEffect(() => {
    loadLevelsAndQuests();
  }, [user?.id]);

  // Sync state when user session or streak updates
  useEffect(() => {
    if (user) {
      if (typeof user.xp === 'number') setUserXp(user.xp);
      if (typeof user.coins === 'number') setUserCoins(user.coins);
      if (typeof user.streak === 'number' && !streakState) setUserStreak(user.streak);
    }
  }, [user]);

  useEffect(() => {
    if (streakState && typeof streakState.currentStreak === 'number') {
      setUserStreak(streakState.currentStreak);
    }
  }, [streakState]);

  // Derived streak variables (COINS ONLY at 100 Coins per missed day)
  const isStreakBroken = streakState?.streakStatus === 'broken' || (streakState?.missedDays > 0 && userStreak === 0);
  const missedDays = Math.max(1, streakState?.missedDays || 1);
  const previousStreak = streakState?.previousStreak || (userStreak > 0 ? userStreak : 0);
  const restorationCostCoins = missedDays * 100;
  const hasEnoughCoins = userCoins >= restorationCostCoins;

  // Refresh data after transactions (game completions, exchanges, restorations)
  const handleTransactionsChanged = async () => {
    if (refreshStreak) await refreshStreak();
    await loadRecentTransactions();
    await loadLevelsAndQuests();
  };

  // Claim Daily Quest Reward (Section 4)
  const handleClaimDailyQuestReward = async (questId) => {
    if (!user?.id) return;
    try {
      const res = await GamingActivityService.claimQuestReward(user.id, questId);
      if (res && res.success) {
        if (addXp && res.xpAwarded) addXp(res.xpAwarded);
        setUserXp((prev) => prev + res.xpAwarded);
        setUserCoins((prev) => prev + res.coinsAwarded);
        await handleTransactionsChanged();
        Alert.alert(
          'Quest Reward Claimed! 🏆',
          `+${res.xpAwarded} XP and +${res.coinsAwarded} Coins added to your balance!`
        );
      } else {
        Alert.alert('Notice', res?.message || 'Quest not completed or already claimed.');
      }
    } catch (err) {
      console.warn('Error claiming quest reward:', err);
      Alert.alert('Error', 'Unable to claim quest reward. Please try again.');
    }
  };

  // Launch Target Number for specific sequential level (Section 5)
  const handlePlayLevel = (levelNum) => {
    if (levelNum > unlockedLevel) {
      Alert.alert(
        '🔒 Level Locked',
        `Complete Level ${levelNum - 1} first to unlock Level ${levelNum}!`
      );
      return;
    }
    setTargetLevelToPlay(levelNum);
    setIsTargetGameOpen(true);
  };

  // Launch Game Handler — opens interactive gameplay simulator
  const handleStartGame = (game) => {
    setSelectedGameModal(null);
    if (
      game?.id === 'g_target_no' ||
      game?.isTargetGame ||
      game?.title?.toLowerCase().includes('target')
    ) {
      setIsTargetGameOpen(true);
      return;
    }
    setLiveSessionGame(game);
  };

  // Logout Handler
  const handleLogout = () => {
    Alert.alert(
      'End Player Session',
      'Are you sure you want to sign out of your PIXO session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            if (logout) {
              await logout();
            }
            if (onNavigateToLogin) {
              onNavigateToLogin();
            }
          },
        },
      ]
    );
  };

  // Filter Continue Playing Games by Category and Search Query
  const filteredRecentGames = useMemo(() => {
    return RECENT_GAMES.filter((game) => {
      const matchesCategory =
        selectedCategory === 'all' || game.catId === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Filter Discovery Games by Category and Search Query
  const filteredDiscoveryGames = useMemo(() => {
    return DISCOVERY_GAMES.filter((game) => {
      const matchesCategory =
        selectedCategory === 'all' || game.catId === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.genre.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <GlowingBackground>
      <View style={styles.appShell}>
        {/* ========================================================= */}
        {/* CENTRAL FULL-WIDTH VIEWPORT                               */}
        {/* ========================================================= */}
        <View style={styles.centerViewport}>
          {/* ========================================================= */}
          {/* TOP PLAYER HEADER + COMPACT REWARD SUMMARY (SECTION 3)    */}
          {/* ========================================================= */}
          <View style={styles.header}>
            <View style={styles.headerLeftAndStats}>
              {/* Circular Round Profile Picture */}
              <TouchableOpacity
                style={styles.roundProfileContainer}
                onPress={() => setActiveTab('profile')}
                activeOpacity={0.85}
                accessibilityLabel="Open Player Profile"
              >
                <View style={styles.roundAvatarWrapper}>
                  <View style={styles.roundAvatarGlow} />
                  <View style={styles.roundAvatarCircle}>
                    {user?.profilePicture ? (
                      <Image
                        source={{ uri: user.profilePicture }}
                        style={styles.roundAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={['#102A16', '#08140B']}
                        style={styles.roundAvatarFallback}
                      >
                        <Ionicons
                          name={user?.avatar || 'game-controller'}
                          size={24}
                          color={colors.primary}
                        />
                      </LinearGradient>
                    )}
                  </View>
                  <View style={styles.onlineStatusDot} />
                </View>

                {/* Profile Identity */}
                <View style={styles.profileIdentityWrap}>
                  <View style={styles.profileStatusRow}>
                    <View style={styles.profilePulseDot} />
                    <Text style={styles.profileStatusLabel}>ONLINE</Text>
                  </View>
                  <Text style={styles.profileUsername} numberOfLines={1}>
                    {playerName}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Master Prompt Section 3: TOP REWARD SUMMARY */}
              {/* Example: 200 COINS | 96 DAYS | 60 XP */}
              <View style={styles.topRewardSummaryBar}>
                {/* 1. COINS */}
                <TouchableOpacity
                  style={styles.rewardSummarySegment}
                  onPress={() => setActiveTab('store')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cash" size={16} color="#FFD700" style={{ marginRight: 6 }} />
                  <Text style={styles.rewardSummaryValueGold}>{userCoins.toLocaleString()}</Text>
                  <Text style={styles.rewardSummaryUnit}>COINS</Text>
                </TouchableOpacity>

                <View style={styles.rewardSummaryDivider} />

                {/* 2. CURRENT STREAK */}
                <TouchableOpacity
                  style={styles.rewardSummarySegment}
                  onPress={() => {
                    if (isStreakBroken) {
                      setIsRestoreModalOpen(true);
                    } else {
                      Alert.alert(
                        '🔥 Daily Streak Active',
                        `Current Streak: ${userStreak} Days\nMaintain consecutive calendar days by completing at least 1 game activity daily!`
                      );
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isStreakBroken ? 'alert-circle' : 'flame'}
                    size={16}
                    color={isStreakBroken ? '#FF453A' : '#FF6A00'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.rewardSummaryValueOrange,
                      isStreakBroken && styles.rewardSummaryValueBroken,
                    ]}
                  >
                    {isStreakBroken ? 'BROKEN' : userStreak}
                  </Text>
                  <Text style={styles.rewardSummaryUnit}>{isStreakBroken ? 'RESTORE' : 'DAYS'}</Text>
                </TouchableOpacity>

                <View style={styles.rewardSummaryDivider} />

                {/* 3. XP */}
                <TouchableOpacity
                  style={styles.rewardSummarySegment}
                  onPress={() =>
                    Alert.alert(
                      '⚡ Player XP Balance',
                      `Current XP: ${userXp.toLocaleString()} XP\nEarn XP by winning games. You can exchange your XP for Coins in the Coin Store!`,
                      [
                        { text: 'Close', style: 'cancel' },
                        { text: 'Open Coin Store', onPress: () => setActiveTab('store') },
                      ]
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name="flash" size={16} color="#00E5FF" style={{ marginRight: 6 }} />
                  <Text style={styles.rewardSummaryValueCyan}>{userXp.toLocaleString()}</Text>
                  <Text style={styles.rewardSummaryUnit}>XP</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Header Action Buttons (Notification & Logout) */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() =>
                  Alert.alert(
                    'Player Hub // Status',
                    `Player: ${playerName}\nCoins: ${userCoins.toLocaleString()} Coins\nStreak: ${isStreakBroken ? 'Broken' : `${userStreak} Days`}\nXP: ${userXp.toLocaleString()} XP`
                  )
                }
                activeOpacity={0.75}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={19} color={colors.textPrimary} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.headerIconBtn, styles.logoutBtn]}
                onPress={handleLogout}
                activeOpacity={0.75}
                accessibilityLabel="End Player Session"
              >
                <Ionicons name="log-out-outline" size={19} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Full-Width Content Area */}
          {activeTab === 'profile' ? (
            <ProfileScreen
              onNavigateHome={() => setActiveTab('home')}
              onNavigateGames={() => setActiveTab('games')}
              onNavigateQuests={() => setActiveTab('quests')}
            />
          ) : activeTab === 'store' ? (
            <CoinStoreScreen
              onNavigateHome={() => setActiveTab('home')}
            />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.dashboardInner}>
          {/* Brand Taglines Banner */}
          <View style={styles.brandTaglineBar}>
            <View style={styles.brandTaglineDot} />
            <Text style={styles.brandTaglineMain}>PLAY SOLO. RULE YOUR WORLD.</Text>
            <Text style={styles.brandTaglineSub}>• Your next adventure begins here.</Text>
          </View>

          {/* ========================================================= */}
          {/* DAILY STREAK CARD & RESTORATION SYSTEM                    */}
          {/* ========================================================= */}
          <View style={[styles.mainStreakCard, isStreakBroken && styles.mainStreakCardBroken]}>
            <LinearGradient
              colors={
                isStreakBroken
                  ? ['rgba(255, 69, 58, 0.22)', 'rgba(255, 106, 0, 0.08)', '#0F0808']
                  : ['rgba(57, 255, 20, 0.16)', 'rgba(0, 229, 255, 0.06)', '#08120A']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainStreakGradient}
            >
              <View style={styles.mainStreakTopRow}>
                <View style={styles.mainStreakLeftCol}>
                  <View style={[styles.mainStreakFireBadge, isStreakBroken && styles.mainStreakFireBadgeBroken]}>
                    <Ionicons
                      name={isStreakBroken ? 'alert-circle' : 'flame'}
                      size={26}
                      color={isStreakBroken ? '#FF453A' : '#FF6A00'}
                    />
                  </View>
                  <View style={styles.mainStreakTitleWrap}>
                    <Text style={[styles.mainStreakHeading, isStreakBroken && styles.mainStreakHeadingBroken]}>
                      {isStreakBroken ? 'STREAK BROKEN' : `${userStreak} DAY${userStreak === 1 ? '' : 'S'} STREAK ACTIVE`}
                    </Text>
                    <Text style={styles.mainStreakDesc}>
                      {isStreakBroken
                        ? `Missed ${missedDays} calendar day(s). Previous streak: ${previousStreak} Days.`
                        : `Complete 1 game activity daily (12:00 AM – 11:59 PM) to maintain consecutive days.`}
                    </Text>
                  </View>
                </View>

                {/* Available Coins Balance */}
                <View style={styles.mainStreakXpWrap}>
                  <Text style={styles.mainStreakXpLabel}>COIN BALANCE</Text>
                  <View style={styles.mainStreakXpValueRow}>
                    <Ionicons name="cash" size={14} color="#FFD700" style={{ marginRight: 4 }} />
                    <Text style={styles.mainStreakXpValueText}>{userCoins.toLocaleString()} Coins</Text>
                  </View>
                </View>
              </View>

              {/* Status / Restore Action Row */}
              <View style={styles.mainStreakBottomRow}>
                {isStreakBroken ? (
                  <View style={styles.mainStreakRestoreWrap}>
                    <TouchableOpacity
                      style={[
                        styles.restoreStreakButton,
                        !hasEnoughCoins && styles.restoreStreakButtonDisabled,
                      ]}
                      onPress={() => setIsRestoreModalOpen(true)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={
                          hasEnoughCoins
                            ? ['#FFD700', '#FF6A00']
                            : ['#2E1C1A', '#1C100E']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.restoreStreakBtnGradient}
                      >
                        <Ionicons
                          name="refresh-circle"
                          size={18}
                          color={hasEnoughCoins ? '#050705' : '#888888'}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={[
                            styles.restoreStreakButtonText,
                            hasEnoughCoins && { color: '#050705' },
                            !hasEnoughCoins && styles.restoreStreakButtonTextDisabled,
                          ]}
                        >
                          RESTORE STREAK – {restorationCostCoins.toLocaleString()} COINS
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {!hasEnoughCoins ? (
                      <View style={styles.insufficientCoinsRow}>
                        <Text style={styles.insufficientXpNotice}>
                          Not Enough Coins! Win more games or exchange your XP for Coins.
                        </Text>
                        <TouchableOpacity
                          style={styles.exchangeShortcutBtn}
                          onPress={() => setActiveTab('store')}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="cash-outline" size={14} color="#FFD700" style={{ marginRight: 4 }} />
                          <Text style={styles.exchangeShortcutText}>GO TO COIN STORE ›</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.activeStreakInfoRow}>
                    <View style={styles.activeStreakBadge}>
                      <Ionicons
                        name={streakState?.completedToday ? 'checkmark-circle' : 'time-outline'}
                        size={15}
                        color={streakState?.completedToday ? '#39FF14' : '#FFA154'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.activeStreakBadgeText,
                          streakState?.completedToday && styles.activeStreakBadgeTextComplete,
                        ]}
                      >
                        {streakState?.completedToday
                          ? 'Activity completed today ✓'
                          : 'Play 1 activity today to keep streak active'}
                      </Text>
                    </View>
                    <Text style={styles.longestStreakLabel}>
                      Longest: {streakState?.longestStreak || userStreak} Days
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* ========================================================= */}
          {/* QUICK ACTIONS ROW: [PLAY GAME] & [COIN STORE]             */}
          {/* ========================================================= */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionPlayBtn}
              onPress={() => setIsTargetGameOpen(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#39FF14', '#00E5FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quickActionBtnGradient}
              >
                <Ionicons name="game-controller" size={18} color="#050705" style={{ marginRight: 8 }} />
                <Text style={styles.quickActionPlayText}>PLAY GAME</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionStoreBtn}
              onPress={() => setActiveTab('store')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FFD700', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quickActionBtnGradient}
              >
                <Ionicons name="cash" size={18} color="#050705" style={{ marginRight: 8 }} />
                <Text style={styles.quickActionStoreText}>COIN STORE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ========================================================= */}
          {/* GAME SEARCH — FUTURISTIC COMMAND BAR                     */}
          {/* ========================================================= */}
          <View
            style={[
              styles.searchContainer,
              isSearchFocused && styles.searchContainerFocused,
            ]}
          >
            <Ionicons
              name="search"
              size={18}
              color={isSearchFocused ? colors.primary : colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your next adventure..."
              placeholderTextColor={colors.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* ========================================================= */}
          {/* MASTER PROMPT SECTION 4: DAILY QUEST SECTION              */}
          {/* ========================================================= */}
          <View style={styles.dailyQuestSection}>
            <View style={styles.dailyQuestHeaderRow}>
              <View style={styles.dailyQuestTitleBlock}>
                <View style={styles.dailyQuestEyebrowRow}>
                  <Text style={styles.dailyQuestEyebrow}>DAILY QUEST</Text>
                  <View style={styles.dailyQuestCountdownBadge}>
                    <Ionicons name="time-outline" size={12} color="#FF9500" style={{ marginRight: 4 }} />
                    <Text style={styles.dailyQuestCountdownText}>Resets in {resetCountdown}</Text>
                  </View>
                </View>
                <Text style={styles.dailyQuestHeading}>Daily Objectives & Verified Rewards</Text>
              </View>
              <TouchableOpacity
                style={styles.dailyQuestViewAllBtn}
                onPress={() => setActiveTab('quests')}
                activeOpacity={0.8}
              >
                <Text style={styles.dailyQuestViewAllText}>VIEW ALL ›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dailyQuestCardsStack}>
              {dailyQuests.map((quest) => {
                const isComplete = quest.current >= quest.target;
                const progressRatio = Math.min(1, quest.target > 0 ? quest.current / quest.target : 0);
                const progressPercent = Math.round(progressRatio * 100);

                return (
                  <View key={quest.id} style={styles.questCardModern}>
                    <View style={styles.questCardLeftContent}>
                      <View
                        style={[
                          styles.questCardIconCircle,
                          isComplete && styles.questCardIconCircleComplete,
                        ]}
                      >
                        <Ionicons
                          name={quest.icon || 'trophy'}
                          size={22}
                          color={isComplete ? '#39FF14' : colors.primary}
                        />
                      </View>
                      <View style={styles.questCardTextWrap}>
                        <View style={styles.questCardTitleRow}>
                          <Text style={styles.questCardTitleText}>{quest.title}</Text>
                          <View style={styles.questRewardMiniBadge}>
                            <Text style={styles.questRewardMiniText}>
                              +{quest.rewardXp} XP • +{quest.rewardCoins} COINS
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.questCardDescText}>{quest.desc}</Text>

                        {/* Progress Bar & Counter */}
                        <View style={styles.questProgressContainerNew}>
                          <View style={styles.questProgressBarNew}>
                            <View
                              style={[
                                styles.questProgressFillNew,
                                {
                                  width: `${progressPercent}%`,
                                  backgroundColor: isComplete ? '#39FF14' : '#00E5FF',
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.questProgressFraction}>
                            {quest.current}/{quest.target}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Button: Play Now or Claim Reward or Completed */}
                    <View style={styles.questCardActionContainer}>
                      {quest.claimed ? (
                        <View style={styles.questClaimedPill}>
                          <Ionicons name="checkmark-circle" size={15} color="#39FF14" style={{ marginRight: 4 }} />
                          <Text style={styles.questClaimedPillText}>CLAIMED</Text>
                        </View>
                      ) : isComplete ? (
                        <TouchableOpacity
                          style={styles.questClaimRewardBtn}
                          onPress={() => handleClaimDailyQuestReward(quest.id)}
                          activeOpacity={0.85}
                        >
                          <LinearGradient
                            colors={['#39FF14', '#00E5FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.questClaimRewardGradient}
                          >
                            <Ionicons name="gift" size={15} color="#050705" style={{ marginRight: 5 }} />
                            <Text style={styles.questClaimRewardText}>CLAIM REWARD</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.questPlayNowBtn}
                          onPress={() => {
                            setTargetLevelToPlay(unlockedLevel);
                            setIsTargetGameOpen(true);
                          }}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="play" size={14} color="#050705" style={{ marginRight: 4 }} />
                          <Text style={styles.questPlayNowText}>PLAY NOW</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ========================================================= */}
          {/* MASTER PROMPT SECTION 5: SEQUENTIAL GAME LEVEL TRACK      */}
          {/* ========================================================= */}
          <View style={styles.gameLevelsSection}>
            <View style={styles.gameLevelsHeaderRow}>
              <View style={styles.gameLevelsTitleBlock}>
                <View style={styles.gameLevelsEyebrowRow}>
                  <Text style={styles.gameLevelsEyebrow}>SPEED MATH DUELS</Text>
                  <View style={styles.gameLevelsProgressBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#39FF14" style={{ marginRight: 4 }} />
                    <Text style={styles.gameLevelsProgressText}>
                      Level {unlockedLevel} / 10 Unlocked
                    </Text>
                  </View>
                </View>
                <Text style={styles.gameLevelsHeading}>Sequential Level Track (Levels 1–10)</Text>
                <Text style={styles.gameLevelsSubtitle}>
                  Solve all target math values within 30 seconds. Complete each level sequentially to unlock the next!
                </Text>
              </View>
            </View>

            <View style={styles.gameLevelsGrid}>
              {gameLevels.map((lvl) => {
                return (
                  <View
                    key={`track_lvl_${lvl.level}`}
                    style={[
                      styles.levelCard,
                      lvl.isCompleted && styles.levelCardCompleted,
                      lvl.isCurrent && styles.levelCardCurrent,
                      lvl.isLocked && styles.levelCardLocked,
                    ]}
                  >
                    {/* Top Row: Level Badge & Status Pill */}
                    <View style={styles.levelCardTopRow}>
                      <View
                        style={[
                          styles.levelNumberTag,
                          lvl.isCompleted && styles.levelNumberTagCompleted,
                          lvl.isCurrent && styles.levelNumberTagCurrent,
                          lvl.isLocked && styles.levelNumberTagLocked,
                        ]}
                      >
                        <Text
                          style={[
                            styles.levelNumberTagText,
                            lvl.isCurrent && styles.levelNumberTagTextCurrent,
                          ]}
                        >
                          LEVEL {lvl.level}
                        </Text>
                      </View>

                      {lvl.isCompleted ? (
                        <View style={styles.levelStatusBadgeCompleted}>
                          <Ionicons name="checkmark-circle" size={14} color="#39FF14" style={{ marginRight: 3 }} />
                          <Text style={styles.levelStatusTextCompleted}>COMPLETED</Text>
                        </View>
                      ) : lvl.isCurrent ? (
                        <View style={styles.levelStatusBadgeCurrent}>
                          <Ionicons name="flash" size={14} color="#39FF14" style={{ marginRight: 3 }} />
                          <Text style={styles.levelStatusTextCurrent}>READY TO PLAY</Text>
                        </View>
                      ) : (
                        <View style={styles.levelStatusBadgeLocked}>
                          <Ionicons name="lock-closed" size={13} color="#777777" style={{ marginRight: 3 }} />
                          <Text style={styles.levelStatusTextLocked}>LOCKED</Text>
                        </View>
                      )}
                    </View>

                    {/* Middle Info */}
                    <View style={styles.levelCardMiddle}>
                      <Text style={[styles.levelCardName, lvl.isLocked && styles.levelCardNameLocked]}>
                        {lvl.title}
                      </Text>
                      <Text style={styles.levelCardSub}>
                        {lvl.isLocked ? `Complete Level ${lvl.level - 1} to Unlock` : lvl.subtitle}
                      </Text>

                      {/* Rewards */}
                      <View style={styles.levelRewardPillsRow}>
                        <View style={styles.levelRewardXpPill}>
                          <Ionicons name="flash" size={11} color="#00E5FF" style={{ marginRight: 3 }} />
                          <Text style={styles.levelRewardXpText}>+{lvl.xpReward} XP</Text>
                        </View>
                        <View style={styles.levelRewardCoinPill}>
                          <Ionicons name="cash" size={11} color="#FFD700" style={{ marginRight: 3 }} />
                          <Text style={styles.levelRewardCoinText}>+{lvl.coinReward} Coins</Text>
                        </View>
                        <View style={styles.levelDiffTag}>
                          <Text style={styles.levelDiffTagText}>{lvl.difficulty}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Bottom Action Button */}
                    <View style={styles.levelCardBottom}>
                      {lvl.isLocked ? (
                        <TouchableOpacity
                          style={styles.levelLockedBtn}
                          disabled={true}
                          activeOpacity={1}
                        >
                          <Ionicons name="lock-closed" size={14} color="#777777" style={{ marginRight: 6 }} />
                          <Text style={styles.levelLockedBtnText}>LOCKED</Text>
                        </TouchableOpacity>
                      ) : lvl.isCurrent ? (
                        <TouchableOpacity
                          style={styles.levelPlayCurrentBtn}
                          onPress={() => handlePlayLevel(lvl.level)}
                          activeOpacity={0.85}
                        >
                          <LinearGradient
                            colors={['#39FF14', '#00E5FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.levelPlayCurrentGradient}
                          >
                            <Ionicons name="play" size={14} color="#050705" style={{ marginRight: 6 }} />
                            <Text style={styles.levelPlayCurrentText}>PLAY LEVEL {lvl.level}</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.levelReplayBtn}
                          onPress={() => handlePlayLevel(lvl.level)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="refresh" size={14} color="#39FF14" style={{ marginRight: 6 }} />
                          <Text style={styles.levelReplayText}>REPLAY LEVEL {lvl.level}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ========================================================= */}
          {/* RECENT REWARDS & TRANSACTIONS — AUDIT & ECONOMY LOG       */}
          {/* ========================================================= */}
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View style={styles.historyTitleWrap}>
                <Ionicons name="receipt-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.historyHeading}>RECENT REWARDS & TRANSACTIONS</Text>
              </View>
              <View style={styles.historyBadge}>
                <Text style={styles.historyBadgeText}>{recentTransactions.length} RECORDED</Text>
              </View>
            </View>

            {recentTransactions.length === 0 ? (
              <View style={styles.emptyHistoryWrap}>
                <Ionicons name="trophy-outline" size={26} color="#2A4030" style={{ marginBottom: 6 }} />
                <Text style={styles.emptyHistoryTitle}>No Reward Transactions Yet</Text>
                <Text style={styles.emptyHistorySubtitle}>
                  Win your first game or exchange XP in the Coin Store to earn verified rewards!
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {recentTransactions.slice(0, 5).map((tx) => {
                  const isGameWin = tx.transactionType === 'GAME_WIN';
                  const isExchange = tx.transactionType === 'XP_TO_COIN_EXCHANGE';
                  const isRestore = tx.transactionType === 'STREAK_RESTORATION';

                  const iconName = isGameWin ? 'trophy' : isExchange ? 'swap-horizontal' : 'flame';
                  const iconColor = isGameWin ? '#39FF14' : isExchange ? '#FFD700' : '#FF6A00';
                  const title = isGameWin
                    ? `Game Victory • Level ${tx.gameDifficulty || 1}`
                    : isExchange
                    ? 'XP to Coin Exchange'
                    : 'Streak Restoration';

                  const dateStr = tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : 'Today';

                  return (
                    <View key={tx.id || `${tx.transactionType}_${tx.transactionDate}`} style={styles.historyItem}>
                      <View style={[styles.historyIconWrap, { borderColor: `${iconColor}40` }]}>
                        <Ionicons name={iconName} size={15} color={iconColor} />
                      </View>

                      <View style={styles.historyItemContent}>
                        <Text style={styles.historyItemTitle}>{title}</Text>
                        <Text style={styles.historyItemDate}>{dateStr} • Status: {tx.transactionStatus || 'COMPLETED'}</Text>
                      </View>

                      <View style={styles.historyDeltas}>
                        {isGameWin && (
                          <View style={styles.historyBadgeRow}>
                            <Text style={styles.historyDeltaGreen}>+{tx.xpAmount} XP</Text>
                            <Text style={styles.historyDeltaGold}>+{tx.coinAmount} Coins</Text>
                          </View>
                        )}
                        {isExchange && (
                          <View style={styles.historyBadgeRow}>
                            <Text style={styles.historyDeltaRed}>-{tx.xpAmount} XP</Text>
                            <Text style={styles.historyDeltaGold}>+{tx.coinAmount} Coins</Text>
                          </View>
                        )}
                        {isRestore && (
                          <View style={styles.historyBadgeRow}>
                            <Text style={styles.historyDeltaRed}>-{tx.coinAmount} Coins</Text>
                            <Text style={styles.historyDeltaOrange}>Restored</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* ========================================================= */}
          {/* TARGET NUMBER (TARGET NO.) — FEATURED SPEED MATH GAME     */}
          {/* ========================================================= */}
          <View style={styles.targetGameBanner}>
            <LinearGradient
              colors={['rgba(57, 255, 20, 0.18)', 'rgba(0, 229, 255, 0.1)', 'rgba(6, 15, 9, 0.98)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.targetGameBannerGradient}
            >
              <View style={styles.targetGameLeft}>
                <View style={styles.targetGameIconWrap}>
                  <Ionicons name="calculator" size={26} color="#39FF14" />
                </View>
                <View style={styles.targetGameInfo}>
                  <View style={styles.targetGameTagRow}>
                    <View style={styles.targetGameNewTag}>
                      <Text style={styles.targetGameNewTagText}>NEW SPEED GAME</Text>
                    </View>
                    <View style={styles.targetGameTimerTag}>
                      <Ionicons name="timer-outline" size={12} color="#FF6A00" style={{ marginRight: 3 }} />
                      <Text style={styles.targetGameTimerTagText}>30s TIMER</Text>
                    </View>
                  </View>
                  <Text style={styles.targetGameTitle}>TARGET NUMBER (TARGET NO.)</Text>
                  <Text style={styles.targetGameSubtitle}>
                    Pick an operator (+, -, *, %) & solve 5, 7, or 10 values before the 30s clock runs out!
                  </Text>
                  <View style={styles.targetGameChipsRow}>
                    <View style={[styles.opMiniChip, { borderColor: '#39FF14' }]}>
                      <Text style={[styles.opMiniChipText, { color: '#39FF14' }]}>+ Add</Text>
                    </View>
                    <View style={[styles.opMiniChip, { borderColor: '#00E5FF' }]}>
                      <Text style={[styles.opMiniChipText, { color: '#00E5FF' }]}>- Sub</Text>
                    </View>
                    <View style={[styles.opMiniChip, { borderColor: '#FFD700' }]}>
                      <Text style={[styles.opMiniChipText, { color: '#FFD700' }]}>× Mult</Text>
                    </View>
                    <View style={[styles.opMiniChip, { borderColor: '#FF6A00' }]}>
                      <Text style={[styles.opMiniChipText, { color: '#FF6A00' }]}>% Mod</Text>
                    </View>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.playTargetBtn}
                onPress={() => setIsTargetGameOpen(true)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#39FF14', '#00E5FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.playTargetBtnGradient}
                >
                  <Ionicons
                    name={hasActiveTargetSession ? 'flash' : 'game-controller'}
                    size={17}
                    color="#050705"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.playTargetBtnText}>
                    {hasActiveTargetSession ? 'RESUME GAME ⚡' : 'PLAY GAME 🎮'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* ========================================================= */}
          {/* 8. CATEGORY FILTERS — POLISHED GAMING PILLS              */}
          {/* ========================================================= */}
          <View style={styles.categoriesWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryPill,
                      isSelected && styles.categoryPillSelected,
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={isSelected ? '#050705' : colors.textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ========================================================= */}
          {/* 9. FEATURED GAME — CINEMATIC HERO CARD                   */}
          {/* ========================================================= */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionEyebrow}>SPOTLIGHT SHOWCASE</Text>
              <Text style={styles.sectionTitle}>Featured Single-Player</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                setSelectedGameModal({
                  title: 'Cyber Strike: 2099',
                  category: 'Cyberpunk Action RPG',
                  rating: '4.9 ★ (18.2k Reviews)',
                  desc: 'Hack the mega-corporations as a lone cyber operative. Full campaign with 30+ hours of custom story missions, weapon crafting, and cybernetic augmentations.',
                  tags: ['Solo Exclusive', 'Offline Capable', 'RTX Mode', 'Gamepad Ready'],
                })
              }
            >
              <Text style={styles.seeAllText}>EXPLORE ALL ›</Text>
            </TouchableOpacity>
          </View>

          <FeaturedHeroCard
            onPlay={() => handleStartGame({ title: 'Cyber Strike: 2099' })}
            onViewDetails={() =>
              setSelectedGameModal({
                title: 'Cyber Strike: 2099',
                category: 'Cyberpunk Action RPG',
                rating: '4.9 ★ (18.2k Reviews)',
                desc: 'Hack the mega-corporations as a lone cyber operative. Full campaign with 30+ hours of custom story missions, weapon crafting, and cybernetic augmentations.',
                tags: ['Solo Exclusive', 'Offline Capable', 'RTX Mode', 'Single Player'],
              })
            }
          />

          {/* ========================================================= */}
          {/* 10. CONTINUE PLAYING — PREMIUM GAME COLLECTION           */}
          {/* ========================================================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionEyebrow}>YOUR NEXT ADVENTURE</Text>
                <Text style={styles.sectionTitle}>Continue Playing</Text>
                <Text style={styles.sectionSubtitle}>
                  Pick up where the action stopped.
                </Text>
              </View>
              <Text style={styles.sectionCountText}>
                {filteredRecentGames.length} in progress
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalGameList}
            >
              {filteredRecentGames.map((game) => (
                <TouchableOpacity
                  key={game.id}
                  style={styles.recentGameCard}
                  activeOpacity={0.88}
                  onPress={() =>
                    game.isTargetGame ? setIsTargetGameOpen(true) : setSelectedGameModal(game)
                  }
                >
                  {/* Card Artwork Header */}
                  <LinearGradient
                    colors={game.gradient}
                    style={styles.recentGameHeader}
                  >
                    <Ionicons name={game.icon} size={36} color={game.accentColor} />
                    <View style={styles.recentGameBadge}>
                      <Text style={styles.recentGameBadgeText}>{game.badge}</Text>
                    </View>
                  </LinearGradient>

                  {/* Card Content */}
                  <View style={styles.recentGameContent}>
                    <Text style={styles.recentGameTitle} numberOfLines={1}>
                      {game.title}
                    </Text>
                    <Text style={styles.recentGameCategory}>
                      {game.category} • {game.lastPlayed}
                    </Text>

                    {/* Progress Bar */}
                    <View style={styles.recentProgressBar}>
                      <View
                        style={[
                          styles.recentProgressFill,
                          {
                            width: `${game.progress * 100}%`,
                            backgroundColor: game.accentColor,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.recentProgressTextRow}>
                      <Text style={styles.recentProgressLabel}>
                        {game.progressText}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleStartGame(game)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.recentResumeText, { color: game.accentColor }]}>
                          RESUME ›
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ========================================================= */}
          {/* 11. DISCOVER SOMETHING EPIC — EXTRA PREMIUM SECTION      */}
          {/* ========================================================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionEyebrow}>CURATED CATALOG</Text>
                <Text style={styles.sectionTitle}>DISCOVER SOMETHING EPIC</Text>
                <Text style={styles.sectionSubtitle}>
                  Fresh worlds. New challenges. Zero distractions.
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalGameList}
            >
              {filteredDiscoveryGames.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.discoveryCard}
                  activeOpacity={0.88}
                  onPress={() => setSelectedGameModal(item)}
                >
                  <View style={styles.discoveryHeader}>
                    <View style={styles.discoveryLabelWrap}>
                      <Text style={styles.discoveryLabelText}>{item.label}</Text>
                    </View>
                    <Text style={styles.discoveryRating}>{item.rating}</Text>
                  </View>

                  <View style={styles.discoveryIconBlock}>
                    <Ionicons name={item.icon} size={30} color={item.accent} />
                  </View>

                  <Text style={styles.discoveryTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.discoveryGenre}>{item.genre}</Text>
                  <Text style={styles.discoveryDesc} numberOfLines={2}>
                    {item.desc}
                  </Text>

                  <TouchableOpacity
                    style={styles.discoveryActionBtn}
                    onPress={() => setSelectedGameModal(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.discoveryActionText}>EXPLORE WORLD ›</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>



          {/* ========================================================= */}
          {/* TRENDING ADVENTURES SECTION                              */}
          {/* ========================================================= */}
          <View style={[styles.sectionContainer, { marginBottom: 40 }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionEyebrow}>TOP RATED</Text>
                <Text style={styles.sectionTitle}>Trending Solo Adventures</Text>
              </View>
            </View>

            {TRENDING_GAMES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.trendingCard}
                activeOpacity={0.85}
                onPress={() =>
                  setSelectedGameModal({
                    title: item.title,
                    category: item.genre,
                    rating: item.rating,
                    desc: item.description,
                    tags: ['Top Ranked', item.downloads, 'Offline Ready'],
                  })
                }
              >
                <View style={[styles.trendingIconSquare, { borderColor: item.color }]}>
                  <Ionicons name="game-controller-outline" size={24} color={item.color} />
                </View>

                <View style={styles.trendingDetails}>
                  <Text style={styles.trendingTitle}>{item.title}</Text>
                  <Text style={styles.trendingGenre}>{item.genre}</Text>
                  <Text style={styles.trendingDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.trendingMetaRow}>
                    <Text style={styles.trendingRating}>{item.rating}</Text>
                    <Text style={styles.trendingDot}>•</Text>
                    <Text style={styles.trendingDownloads}>{item.downloads}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.trendingPlayBtn}
                  onPress={() => handleStartGame({ title: item.title })}
                  activeOpacity={0.7}
                >
                  <Ionicons name="play" size={16} color="#050705" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    )}

          {/* 13. BOTTOM NAVIGATION — CLEAN GAMING DOCK (SECTION 6) */}
          <View style={styles.bottomNavDock}>
            <TouchableOpacity
              style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
              onPress={() => setActiveTab('home')}
              activeOpacity={0.75}
            >
              <Ionicons
                name={activeTab === 'home' ? 'home' : 'home-outline'}
                size={20}
                color={activeTab === 'home' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.navText,
                  activeTab === 'home' && styles.navTextActive,
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, activeTab === 'games' && styles.navItemActive]}
              onPress={() => setActiveTab('games')}
              activeOpacity={0.75}
            >
              <Ionicons
                name={activeTab === 'games' ? 'grid' : 'grid-outline'}
                size={20}
                color={activeTab === 'games' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.navText,
                  activeTab === 'games' && styles.navTextActive,
                ]}
              >
                Games
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, activeTab === 'quests' && styles.navItemActive]}
              onPress={() => setActiveTab('quests')}
              activeOpacity={0.75}
            >
              <View style={styles.questNavIconWrap}>
                <Ionicons
                  name={activeTab === 'quests' ? 'trophy' : 'trophy-outline'}
                  size={20}
                  color={activeTab === 'quests' ? colors.primary : colors.textSecondary}
                />
                <View style={styles.questNavOrangeDot} />
              </View>
              <Text
                style={[
                  styles.navText,
                  activeTab === 'quests' && styles.navTextActive,
                ]}
              >
                Quests
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.75}
            >
              <Ionicons
                name={activeTab === 'profile' ? 'person' : 'person-outline'}
                size={20}
                color={activeTab === 'profile' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.navText,
                  activeTab === 'profile' && styles.navTextActive,
                ]}
              >
                Profile
              </Text>
            </TouchableOpacity>

            {onNavigateToLogin && (
              <TouchableOpacity
                style={styles.navItem}
                onPress={onNavigateToLogin}
                activeOpacity={0.75}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.navText}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Cinematic Game Details Modal */}
      <GameDetailsModal
        visible={!!selectedGameModal}
        game={selectedGameModal}
        onClose={() => setSelectedGameModal(null)}
        onLaunch={handleStartGame}
      />

      {/* Interactive Gameplay Simulation Runner Modal */}
      {liveSessionGame && (
        <GameSessionRunnerModal
          visible={!!liveSessionGame}
          game={liveSessionGame}
          onClose={() => setLiveSessionGame(null)}
          onSessionUpdated={handleTransactionsChanged}
        />
      )}

      {/* Target Number Interactive Game Modal with Sequential Level Support */}
      <TargetNumberGameModal
        visible={isTargetGameOpen}
        initialLevel={targetLevelToPlay}
        onClose={() => setIsTargetGameOpen(false)}
        onSessionComplete={handleTransactionsChanged}
      />

      {/* PIXO Restore Streak Confirmation Modal (COINS ONLY) */}
      <RestoreStreakModal
        visible={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        streakState={streakState}
        availableCoins={userCoins}
        availableXp={userXp}
        onOpenCoinStore={() => {
          setIsRestoreModalOpen(false);
          setActiveTab('store');
        }}
        onConfirmRestore={async () => {
          if (restoreStreak) {
            const res = await restoreStreak();
            if (res && res.success) {
              await handleTransactionsChanged();
              Alert.alert(
                '🔥 Streak Restored!',
                `Your ${res.restoredStreak}-day streak has been restored!\n\n${res.costInCoins} Coins deducted.\nRemaining Coins: ${(res.remainingCoins ?? userCoins).toLocaleString()} Coins.`
              );
            }
            return res;
          }
          return { success: false, error: 'Restore service unavailable' };
        }}
      />
    </GlowingBackground>
  );
};

const isMobile = width < 500;
const isSmallMobile = width < 380;

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#050705',
  },
  centerViewport: {
    flex: 1,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  topRewardSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D140F',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.28)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 14px rgba(57, 255, 20, 0.12)',
        }
      : {}),
  },
  rewardSummarySegment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  rewardSummaryValueGold: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  rewardSummaryValueOrange: {
    color: '#FF9500',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  rewardSummaryValueBroken: {
    color: '#FF453A',
  },
  rewardSummaryValueCyan: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  rewardSummaryUnit: {
    color: '#8A9E8D',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
    letterSpacing: 0.4,
  },
  rewardSummaryDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 4,
  },
  dailyQuestSection: {
    marginBottom: spacing.md,
  },
  dailyQuestHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dailyQuestTitleBlock: {
    flex: 1,
  },
  dailyQuestEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  dailyQuestEyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  dailyQuestCountdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dailyQuestCountdownText: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '700',
  },
  dailyQuestHeading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  dailyQuestViewAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  dailyQuestViewAllText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  dailyQuestCardsStack: {
    gap: 10,
  },
  questCardModern: {
    backgroundColor: '#0E150F',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        }
      : {}),
  },
  questCardLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 240,
  },
  questCardIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questCardIconCircleComplete: {
    backgroundColor: 'rgba(57, 255, 20, 0.22)',
    borderColor: '#39FF14',
  },
  questCardTextWrap: {
    flex: 1,
  },
  questCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  questCardTitleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  questRewardMiniBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  questRewardMiniText: {
    color: '#FFD700',
    fontSize: 9.5,
    fontWeight: '800',
  },
  questCardDescText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 6,
  },
  questProgressContainerNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questProgressBarNew: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  questProgressFillNew: {
    height: '100%',
    borderRadius: 3,
  },
  questProgressFraction: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  questCardActionContainer: {
    alignItems: 'flex-end',
    minWidth: 110,
  },
  questClaimedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  questClaimedPillText: {
    color: '#39FF14',
    fontSize: 11,
    fontWeight: '900',
  },
  questClaimRewardBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  questClaimRewardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  questClaimRewardText: {
    color: '#050705',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  questPlayNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  questPlayNowText: {
    color: '#050705',
    fontSize: 11,
    fontWeight: '900',
  },
  gameLevelsSection: {
    marginBottom: spacing.lg,
  },
  gameLevelsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameLevelsTitleBlock: {
    flex: 1,
  },
  gameLevelsEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  gameLevelsEyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  gameLevelsProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gameLevelsProgressText: {
    color: colors.primary,
    fontSize: 10.5,
    fontWeight: '800',
  },
  gameLevelsHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  gameLevelsSubtitle: {
    color: colors.textSecondary,
    fontSize: 11.5,
    marginTop: 2,
  },
  gameLevelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  levelCard: {
    width: '48.5%',
    minWidth: 280,
    backgroundColor: '#0B120C',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.18)',
    borderRadius: 14,
    padding: 12,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
        }
      : {}),
  },
  levelCardCompleted: {
    backgroundColor: '#07150A',
    borderColor: 'rgba(57, 255, 20, 0.45)',
  },
  levelCardCurrent: {
    backgroundColor: '#0F1E12',
    borderColor: '#39FF14',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 16px rgba(57, 255, 20, 0.25)',
        }
      : {}),
  },
  levelCardLocked: {
    backgroundColor: '#090D0A',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    opacity: 0.65,
  },
  levelCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelNumberTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  levelNumberTagCompleted: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
  },
  levelNumberTagCurrent: {
    backgroundColor: '#39FF14',
  },
  levelNumberTagLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  levelNumberTagText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
  },
  levelNumberTagTextCurrent: {
    color: '#050705',
    fontWeight: '900',
  },
  levelStatusBadgeCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelStatusTextCompleted: {
    color: '#39FF14',
    fontSize: 9.5,
    fontWeight: '900',
  },
  levelStatusBadgeCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelStatusTextCurrent: {
    color: '#39FF14',
    fontSize: 9.5,
    fontWeight: '900',
  },
  levelStatusBadgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelStatusTextLocked: {
    color: '#777777',
    fontSize: 9.5,
    fontWeight: '800',
  },
  levelCardMiddle: {
    marginBottom: 10,
  },
  levelCardName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  levelCardNameLocked: {
    color: '#888888',
  },
  levelCardSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 8,
  },
  levelRewardPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  levelRewardXpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelRewardXpText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '800',
  },
  levelRewardCoinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelRewardCoinText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
  },
  levelDiffTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelDiffTagText: {
    color: colors.textSecondary,
    fontSize: 9.5,
    fontWeight: '700',
  },
  levelCardBottom: {
    marginTop: 4,
  },
  levelLockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  levelLockedBtnText: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '800',
  },
  levelPlayCurrentBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  levelPlayCurrentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  levelPlayCurrentText: {
    color: '#050705',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  levelReplayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.35)',
    paddingVertical: 8,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  levelReplayText: {
    color: '#39FF14',
    fontSize: 11,
    fontWeight: '800',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 12 : spacing.lg,
    paddingTop: Platform.OS === 'android' ? 24 : spacing.sm + 4,
    paddingBottom: spacing.sm,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerLeftAndStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  roundProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  roundAvatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  roundAvatarGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(57, 255, 20, 0.28)',
    top: -1,
    left: -1,
    ...(Platform.OS === 'web' ? { filter: 'blur(8px)' } : {}),
  },
  roundAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0A120B',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 12px rgba(57, 255, 20, 0.45)',
        }
      : {}),
  },
  roundAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  roundAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#050705',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 6px #39FF14' } : {}),
  },
  profileIdentityWrap: {
    justifyContent: 'center',
    marginRight: 4,
  },
  profileStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  profilePulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    marginRight: 4,
  },
  profileStatusLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  profileUsername: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
    maxWidth: 130,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', sans-serif",
        }
      : {}),
  },
  topStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statChipStreak: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.45)',
    overflow: 'hidden',
    backgroundColor: 'rgba(16, 22, 16, 0.8)',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 0 8px rgba(255, 106, 0, 0.18)',
          transition: 'transform 0.15s ease',
        }
      : {}),
  },
  statChipStreakBroken: {
    borderColor: 'rgba(255, 69, 58, 0.7)',
    backgroundColor: 'rgba(35, 12, 12, 0.85)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 10px rgba(255, 69, 58, 0.35)',
        }
      : {}),
  },
  statChipXp: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.45)',
    overflow: 'hidden',
    backgroundColor: 'rgba(16, 22, 16, 0.8)',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 0 8px rgba(0, 229, 255, 0.18)',
          transition: 'transform 0.15s ease',
        }
      : {}),
  },
  statChipCoin: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.45)',
    overflow: 'hidden',
    backgroundColor: 'rgba(16, 22, 16, 0.8)',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 0 8px rgba(255, 215, 0, 0.18)',
          transition: 'transform 0.15s ease',
        }
      : {}),
  },
  statChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  statIconBadgeStreak: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  statIconBadgeStreakBroken: {
    backgroundColor: 'rgba(255, 69, 58, 0.25)',
  },
  statIconBadgeXp: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  statIconBadgeCoin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  statContentWrap: {
    flexDirection: 'column',
  },
  statLabelStreak: {
    color: '#FFA154',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statLabelStreakBroken: {
    color: '#FF6961',
  },
  statValueStreak: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
  },
  statValueStreakBroken: {
    color: '#FFD1D1',
  },
  statLabelXp: {
    color: '#5CE1E6',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statValueXp: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
  },
  statLabelCoin: {
    color: '#FFE066',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statValueCoin: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
  },
  // Main Streak Card & Restoration HUD
  mainStreakCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    overflow: 'hidden',
    backgroundColor: '#0A0F0B',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 12px rgba(255, 106, 0, 0.1)',
        }
      : {}),
  },
  mainStreakCardBroken: {
    borderColor: 'rgba(255, 69, 58, 0.5)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 69, 58, 0.25)',
        }
      : {}),
  },
  mainStreakGradient: {
    padding: 16,
  },
  mainStreakTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  mainStreakLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 220,
  },
  mainStreakFireBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mainStreakFireBadgeBroken: {
    backgroundColor: 'rgba(255, 69, 58, 0.22)',
    borderColor: 'rgba(255, 69, 58, 0.5)',
  },
  mainStreakTitleWrap: {
    flex: 1,
  },
  mainStreakHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF9500',
    letterSpacing: 0.5,
  },
  mainStreakHeadingBroken: {
    color: '#FF453A',
  },
  mainStreakDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  mainStreakXpWrap: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mainStreakXpLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#5CE1E6',
    letterSpacing: 0.5,
  },
  mainStreakXpValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  mainStreakXpValueText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  mainStreakBottomRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  mainStreakRestoreWrap: {
    flex: 1,
    minWidth: 260,
  },
  restoreStreakButton: {
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
        }
      : {}),
  },
  restoreStreakButtonDisabled: {
    opacity: 0.65,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'not-allowed',
        }
      : {}),
  },
  restoreStreakBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  restoreStreakButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  restoreStreakButtonTextDisabled: {
    color: '#AAAAAA',
  },
  insufficientXpNotice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6961',
    marginTop: 6,
  },
  activeStreakInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  activeStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  activeStreakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  activeStreakBadgeTextComplete: {
    color: '#39FF14',
  },
  longestStreakLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  streakDevControls: {
    flexDirection: 'row',
    gap: 6,
  },
  streakDevBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  streakDevBtnText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#101610',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.24)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    position: 'relative',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }
      : {}),
  },
  logoutBtn: {
    borderColor: 'rgba(255, 106, 0, 0.35)',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.orangeAccent,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 6px #FF6A00' } : {}),
  },
  scrollContent: {
    paddingBottom: isMobile ? 125 : 110,
  },
  dashboardInner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: isMobile ? 12 : spacing.lg,
  },
  brandTaglineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(9, 17, 11, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginVertical: spacing.sm,
  },
  brandTaglineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  brandTaglineMain: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandTaglineSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: 6,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  quickActionPlayBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(57, 255, 20, 0.28)',
          transition: 'all 0.2s ease',
        }
      : {}),
  },
  quickActionStoreBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(255, 215, 0, 0.28)',
          transition: 'all 0.2s ease',
        }
      : {}),
  },
  quickActionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  quickActionPlayText: {
    color: '#050705',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  quickActionStoreText: {
    color: '#050705',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  insufficientCoinsRow: {
    marginTop: 8,
    gap: 6,
  },
  exchangeShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  exchangeShortcutText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  historyCard: {
    backgroundColor: '#0E1610',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    marginBottom: spacing.md,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6), 0 0 16px rgba(57, 255, 20, 0.08)',
        }
      : {}),
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 255, 20, 0.12)',
  },
  historyTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyHeading: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', sans-serif",
        }
      : {}),
  },
  historyBadge: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.28)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyHistoryWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyHistoryTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyHistorySubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    maxWidth: 320,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121D15',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  historyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    color: colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '800',
  },
  historyItemDate: {
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: 2,
  },
  historyDeltas: {
    alignItems: 'flex-end',
  },
  historyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDeltaGreen: {
    color: '#39FF14',
    fontSize: 11,
    fontWeight: '800',
  },
  historyDeltaGold: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
  },
  historyDeltaRed: {
    color: '#FF6961',
    fontSize: 11,
    fontWeight: '800',
  },
  historyDeltaOrange: {
    color: '#FF8C00',
    fontSize: 11,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101610',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: spacing.md,
    ...(Platform.OS === 'web'
      ? {
          transition: 'all 0.2s ease',
        }
      : {}),
  },
  searchContainerFocused: {
    borderColor: colors.primary,
    borderRightColor: colors.orangeAccent,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 16px rgba(57, 255, 20, 0.25)',
        }
      : {}),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none',
          fontFamily: "'Inter', sans-serif",
        }
      : {}),
  },
  targetGameBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.45)',
    marginBottom: spacing.md,
    backgroundColor: '#07120A',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.7), 0 0 16px rgba(57, 255, 20, 0.15)',
        }
      : {}),
  },
  targetGameBannerGradient: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center',
    padding: isMobile ? 14 : spacing.md + 2,
    gap: 12,
  },
  targetGameLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  targetGameIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 12px rgba(57, 255, 20, 0.35)' } : {}),
  },
  targetGameInfo: {
    flex: 1,
  },
  targetGameTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  targetGameNewTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  targetGameNewTagText: {
    color: '#050705',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  targetGameTimerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 4,
  },
  targetGameTimerTagText: {
    color: colors.orangeWarm,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  targetGameTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 2,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', sans-serif",
        }
      : {}),
  },
  targetGameSubtitle: {
    color: colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 6,
  },
  targetGameChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  opMiniChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  opMiniChipText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  playTargetBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: isMobile ? 'stretch' : 'auto',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 0 16px rgba(57, 255, 20, 0.35)',
          transition: 'all 0.2s ease',
        }
      : {}),
  },
  playTargetBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  playTargetBtnText: {
    color: '#050705',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  categoriesWrapper: {
    marginBottom: spacing.md,
  },
  categoriesScroll: {
    paddingRight: 10,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101610',
    borderRadius: borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.24)',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }
      : {}),
  },
  categoryPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 14px rgba(57, 255, 20, 0.4)',
        }
      : {}),
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryTextSelected: {
    color: '#050705',
    fontWeight: '900',
  },
  sectionContainer: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm + 2,
  },
  sectionTitleBlock: {
    flex: 1,
  },
  sectionEyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', sans-serif",
        }
      : {}),
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  sectionCountText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  horizontalGameList: {
    paddingRight: 16,
    gap: 12,
  },
  recentGameCard: {
    width: 200,
    backgroundColor: '#111923',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    ...(Platform.OS === 'web'
      ? {
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          cursor: 'pointer',
        }
      : {}),
  },
  recentGameHeader: {
    height: 105,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  recentGameBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  recentGameBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  recentGameContent: {
    padding: 12,
  },
  recentGameTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  recentGameCategory: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 10,
  },
  recentProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  recentProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  recentProgressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentProgressLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  recentResumeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  discoveryCard: {
    width: 220,
    backgroundColor: '#111923',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
        }
      : {}),
  },
  discoveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  discoveryLabelWrap: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discoveryLabelText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  discoveryRating: {
    color: '#FFB547',
    fontSize: 11,
    fontWeight: '800',
  },
  discoveryIconBlock: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 22, 16, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  discoveryTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  discoveryGenre: {
    color: colors.orangeWarm,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  discoveryDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  discoveryActionBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  discoveryActionText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resetTimerText: {
    color: colors.orangeWarm,
    fontSize: 11,
    fontWeight: '700',
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111923',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.18)',
  },
  questIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  questTitleClaimed: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  questDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 6,
  },
  questProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questProgressBar: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  questProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  questProgressText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  questRewardBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginLeft: 8,
  },
  questRewardBtnReady: {
    backgroundColor: colors.primary,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 0 12px rgba(57, 255, 20, 0.4)',
        }
      : {}),
  },
  questRewardBtnClaimed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  questRewardText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  questRewardTextReady: {
    color: '#050705',
    fontWeight: '900',
  },
  trendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111923',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.18)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  trendingIconSquare: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#101610',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trendingDetails: {
    flex: 1,
  },
  trendingTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  trendingGenre: {
    color: colors.orangeWarm,
    fontSize: 11,
    fontWeight: '600',
    marginVertical: 2,
  },
  trendingDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  trendingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendingRating: {
    color: '#FFB547',
    fontSize: 11,
    fontWeight: '700',
  },
  trendingDot: {
    color: colors.textMuted,
    marginHorizontal: 6,
  },
  trendingDownloads: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  trendingPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  bottomNavDock: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 10,
    left: isMobile ? 12 : 20,
    right: isMobile ? 12 : 20,
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: 'rgba(16, 22, 16, 0.94)',
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: isMobile ? 8 : 10,
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.28)',
    zIndex: 999,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow:
            '0 12px 40px rgba(0, 0, 0, 0.85), 0 0 24px rgba(57, 255, 20, 0.15)',
        }
      : {
          elevation: 12,
        }),
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  navItemActive: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
  },
  questNavIconWrap: {
    position: 'relative',
  },
  questNavOrangeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.orangeAccent,
  },
  navText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  navTextActive: {
    color: colors.primary,
    fontWeight: '900',
  },
});

export default HomeScreen;
