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
import { LeftChatPanel, RightChatPanel } from '../components/chat';
import { GamingActivityService } from '../services/gamingActivityService';
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

// Daily Quests Data
const INITIAL_DAILY_QUESTS = [
  {
    id: 'q1',
    title: 'Cyber Strike Highscore',
    desc: 'Score over 15,000 points in Neon Runner: 2099',
    reward: '+300 XP',
    rewardXp: 300,
    current: 15000,
    target: 15000,
    claimed: false,
    icon: 'trophy-outline',
  },
  {
    id: 'q2',
    title: 'Daily Solo Training',
    desc: 'Complete 3 single-player dungeon runs in Shadow Blade',
    reward: '+200 XP',
    rewardXp: 200,
    current: 2,
    target: 3,
    claimed: false,
    icon: 'flame-outline',
  },
  {
    id: 'q3',
    title: 'Combo Master',
    desc: 'Execute 50 critical hits in any campaign mission',
    reward: '+150 XP',
    rewardXp: 150,
    current: 50,
    target: 50,
    claimed: true,
    icon: 'shield-checkmark-outline',
  },
];

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
  const [userXp, setUserXp] = useState(user?.xp ?? 3450);
  const [userMaxXp, setUserMaxXp] = useState(user?.maxXp ?? 5000);
  const [userCoins, setUserCoins] = useState(user?.coins ?? 850);
  const [userStreak, setUserStreak] = useState(streakState?.currentStreak ?? (user?.streak ?? 7));
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  // Daily 20 XP Claim states
  const [daily20XpClaimed, setDaily20XpClaimed] = useState(false);
  const [claimToastMessage, setClaimToastMessage] = useState(null);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Interaction states
  const [streakClaimed, setStreakClaimed] = useState(false);
  const [selectedGameModal, setSelectedGameModal] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [quests, setQuests] = useState(INITIAL_DAILY_QUESTS);
  const [liveSessionGame, setLiveSessionGame] = useState(null);
  const [isTargetGameOpen, setIsTargetGameOpen] = useState(false);
  const [hasActiveTargetSession, setHasActiveTargetSession] = useState(false);

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

  // Responsive Dual Chat UI states
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 1024;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isMobileLayout = windowWidth < 768;
  const chatPanelWidth = isDesktop ? (windowWidth >= 1280 ? 260 : 235) : 220;

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [activeMobileChat, setActiveMobileChat] = useState(null); // null | 'left' | 'right'

  const playerName = user?.name || 'SoloSlayer';
  const xpPercent = `${Math.min(100, Math.round((userXp / userMaxXp) * 100))}%`;

  // Sync state when user session or streak updates
  useEffect(() => {
    if (user) {
      if (typeof user.xp === 'number') setUserXp(user.xp);
      if (typeof user.maxXp === 'number') setUserMaxXp(user.maxXp);
      if (typeof user.coins === 'number') setUserCoins(user.coins);
      if (typeof user.streak === 'number' && !streakState) setUserStreak(user.streak);
    }
  }, [user]);

  useEffect(() => {
    if (streakState && typeof streakState.currentStreak === 'number') {
      setUserStreak(streakState.currentStreak);
    }
  }, [streakState]);

  // Derived streak variables
  const isStreakBroken = streakState?.streakStatus === 'broken' || (streakState?.missedDays > 0 && userStreak === 0);
  const missedDays = Math.max(1, streakState?.missedDays || 1);
  const previousStreak = streakState?.previousStreak || (userStreak > 0 ? userStreak : 7);
  const restorationCost = streakState?.restorationCost || missedDays * 1000;
  const canRestoreWithXp = userXp >= restorationCost;

  // Check if daily 20 XP was already collected today
  useEffect(() => {
    const checkClaimStatus = async () => {
      if (user?.id) {
        try {
          const isClaimed = await AuthService.checkDailyClaimStatus(user.id);
          setDaily20XpClaimed(!!isClaimed);
        } catch (e) {
          console.warn('Error checking daily claim status:', e);
        }
      }
    };
    checkClaimStatus();
  }, [user?.id]);

  // Claim Daily 20 XP Handler
  const handleClaimDaily20Xp = async () => {
    if (daily20XpClaimed) return;
    const bonusXp = 20;
    const bonusCoins = 10;
    const updatedXp = userXp + bonusXp;
    const updatedCoins = userCoins + bonusCoins;

    setUserXp(updatedXp);
    setUserCoins(updatedCoins);
    setDaily20XpClaimed(true);

    // Persist via AuthContext / AuthService
    if (claimDailyReward && user?.id) {
      try {
        await claimDailyReward(bonusXp, bonusCoins);
      } catch (e) {
        console.warn('Error claiming daily reward:', e);
      }
    } else if (addXp) {
      await addXp(bonusXp);
    }

    setClaimToastMessage(`🎉 +20 XP Claimed! Total XP: ${updatedXp.toLocaleString()} XP`);
    setTimeout(() => setClaimToastMessage(null), 4000);

    Alert.alert(
      '🎁 +20 XP Daily Bonus Claimed!',
      `Success! +20 XP and +10 Coins have been added to your account.\n\nTotal XP: ${updatedXp.toLocaleString()} XP\nCoins: ${updatedCoins.toLocaleString()}\nDaily Streak: ${userStreak} Days Active!`
    );
  };

  // Reset Daily Claim (Useful for Demo / Testing)
  const handleResetDaily20Xp = async () => {
    if (user?.id) {
      try {
        await AuthService.resetDailyClaimStatus(user.id);
      } catch (e) {
        console.warn('Error resetting daily claim:', e);
      }
    }
    setDaily20XpClaimed(false);
    Alert.alert('Daily Claim Reset', 'Daily claim has been reset. You can now claim +20 XP again!');
  };

  // Claim Daily Streak (+150 XP)
  const handleClaimStreak = () => {
    if (!streakClaimed) {
      setStreakClaimed(true);
      const updatedXp = userXp + 150;
      setUserXp(updatedXp);
      if (addXp) addXp(150);

      Alert.alert(
        '🔥 Daily Solo Streak Claimed!',
        '+150 XP added to your Season Pass progression! Keep your streak active tomorrow.'
      );
    }
  };

  // Claim Quest Reward
  const handleClaimQuest = async (questId, rewardXp) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q))
    );

    const bonus = rewardXp || 150;
    const updatedXp = userXp + bonus;
    setUserXp(updatedXp);
    if (addXp) addXp(bonus);

    // Record verified quest completion in GamingActivityService
    if (user?.id) {
      try {
        const qObj = quests.find((q) => q.id === questId);
        const sess = await GamingActivityService.startSession(user.id, {
          id: questId,
          title: qObj?.title || 'Daily Solo Mission',
          category: 'Daily Quest',
          icon: 'trophy',
          mode: 'Daily Objective',
        });
        await GamingActivityService.completeSession(user.id, sess.id, {
          score: 15000,
          result: 'Mission Complete',
          xpAwarded: bonus,
          achievements: ['Daily Solo Finisher'],
        });
      } catch (err) {
        console.warn('Failed to record quest completion:', err);
      }
    }

    Alert.alert('Quest Reward Claimed! 🏆', `+${bonus} XP recorded and qualifying daily streak updated!`);
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
        {/* LEFT CHAT PANEL: SMART COMPACT AI CO-PILOT               */}
        {/* ========================================================= */}
        {!isMobileLayout && (
          <LeftChatPanel
            user={user}
            width={chatPanelWidth}
            isCollapsed={leftCollapsed}
            onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
          />
        )}

        {/* ========================================================= */}
        {/* CENTRAL VIEWPORT: DASHBOARD / PROFILE / MOBILE VIEW       */}
        {/* ========================================================= */}
        <View style={styles.centerViewport}>
          {/* ========================================================= */}
          {/* 4. PLAYER HEADER — ROUND AVATAR + STREAK / XP / COIN / LEVEL */}
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

              {/* Stats Bar: Sequence: 1. Streak -> 2. XP -> 3. Coin (Level removed) */}
              <View style={styles.topStatsBar}>
                {/* 1. STREAK */}
                <TouchableOpacity
                  style={[
                    styles.statChipStreak,
                    isStreakBroken && styles.statChipStreakBroken,
                  ]}
                  onPress={() => {
                    if (isStreakBroken) {
                      setIsRestoreModalOpen(true);
                    } else {
                      Alert.alert(
                        '🔥 Daily Streak Active',
                        `Current Streak: ${userStreak} Days\nKeep your streak active tomorrow by completing at least 1 game activity (12:00 AM – 11:59 PM)!`
                      );
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      isStreakBroken
                        ? ['rgba(255, 69, 58, 0.35)', 'rgba(255, 69, 58, 0.15)']
                        : ['rgba(255, 106, 0, 0.22)', 'rgba(255, 60, 0, 0.08)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statChipGradient}
                  >
                    <View
                      style={[
                        styles.statIconBadgeStreak,
                        isStreakBroken && styles.statIconBadgeStreakBroken,
                      ]}
                    >
                      <Ionicons
                        name={isStreakBroken ? 'alert-circle' : 'flame'}
                        size={15}
                        color={isStreakBroken ? '#FF453A' : '#FF6A00'}
                      />
                    </View>
                    <View style={styles.statContentWrap}>
                      <Text
                        style={[
                          styles.statLabelStreak,
                          isStreakBroken && styles.statLabelStreakBroken,
                        ]}
                      >
                        {isStreakBroken ? 'STREAK BROKEN' : 'STREAK'}
                      </Text>
                      <Text
                        style={[
                          styles.statValueStreak,
                          isStreakBroken && styles.statValueStreakBroken,
                        ]}
                      >
                        {isStreakBroken ? 'RESTORE ⚡' : `${userStreak} Days`}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* 2. XP */}
                <TouchableOpacity
                  style={styles.statChipXp}
                  onPress={() =>
                    Alert.alert(
                      '⚡ Player XP Progress',
                      `Current XP: ${userXp.toLocaleString()} / ${userMaxXp.toLocaleString()} XP\nSeason Progress: ${xpPercent}\n\nClaim your Daily 20 XP below to boost your rank!`
                    )
                  }
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(0, 229, 255, 0.22)', 'rgba(0, 160, 255, 0.08)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statChipGradient}
                  >
                    <View style={styles.statIconBadgeXp}>
                      <Ionicons name="flash" size={15} color="#00E5FF" />
                    </View>
                    <View style={styles.statContentWrap}>
                      <Text style={styles.statLabelXp}>XP</Text>
                      <Text style={styles.statValueXp}>{userXp.toLocaleString()}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* 3. COIN */}
                <TouchableOpacity
                  style={styles.statChipCoin}
                  onPress={() =>
                    Alert.alert(
                      '🪙 Coins Balance',
                      `Coins Balance: ${userCoins.toLocaleString()} Coins\nEarn more coins from missions and daily claims!`
                    )
                  }
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255, 215, 0, 0.22)', 'rgba(255, 170, 0, 0.08)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statChipGradient}
                  >
                    <View style={styles.statIconBadgeCoin}>
                      <Ionicons name="cash" size={14} color="#FFD700" />
                    </View>
                    <View style={styles.statContentWrap}>
                      <Text style={styles.statLabelCoin}>COIN</Text>
                      <Text style={styles.statValueCoin}>{userCoins.toLocaleString()}</Text>
                    </View>
                  </LinearGradient>
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
                    `Player: ${playerName}\nStreak: ${isStreakBroken ? 'Broken' : `${userStreak} Days`}\nXP: ${userXp.toLocaleString()} / ${userMaxXp.toLocaleString()}\nCoins: ${userCoins.toLocaleString()}\nDaily 20 XP: ${
                      daily20XpClaimed ? 'Claimed ✓' : 'Available Now (+20 XP)'
                    }`
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

          {/* MOBILE COMPACT CHAT SWITCHER (Only visible on screens < 768px) */}
          {isMobileLayout && (
            <View style={styles.mobileSegmentBar}>
              <TouchableOpacity
                style={[styles.mobileSegmentBtn, !activeMobileChat && styles.mobileSegmentBtnActive]}
                onPress={() => setActiveMobileChat(null)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="game-controller"
                  size={13}
                  color={!activeMobileChat ? '#050705' : colors.textSecondary}
                />
                <Text style={[styles.mobileSegmentText, !activeMobileChat && styles.mobileSegmentTextActive]}>
                  Dashboard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mobileSegmentBtn, activeMobileChat === 'left' && styles.mobileSegmentBtnActive]}
                onPress={() => setActiveMobileChat('left')}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="hardware-chip"
                  size={13}
                  color={activeMobileChat === 'left' ? '#050705' : colors.primary}
                />
                <Text style={[styles.mobileSegmentText, activeMobileChat === 'left' && styles.mobileSegmentTextActive]}>
                  AI Co-Pilot
                </Text>
                <View style={styles.mobileGreenDot} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mobileSegmentBtn, activeMobileChat === 'right' && styles.mobileSegmentBtnActive]}
                onPress={() => setActiveMobileChat('right')}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="radio"
                  size={13}
                  color={activeMobileChat === 'right' ? '#050705' : colors.orangeAccent}
                />
                <Text style={[styles.mobileSegmentText, activeMobileChat === 'right' && styles.mobileSegmentTextActive]}>
                  Global Comms
                </Text>
                <View style={styles.mobileOrangeDot} />
              </TouchableOpacity>
            </View>
          )}

          {/* Main Content Area / Mobile Chat Switching */}
          {isMobileLayout && activeMobileChat === 'left' ? (
            <View style={styles.mobileChatContainer}>
              <LeftChatPanel
                user={user}
                isMobile
                onCloseMobile={() => setActiveMobileChat(null)}
              />
            </View>
          ) : isMobileLayout && activeMobileChat === 'right' ? (
            <View style={styles.mobileChatContainer}>
              <RightChatPanel
                user={user}
                isMobile
                onCloseMobile={() => setActiveMobileChat(null)}
              />
            </View>
          ) : activeTab === 'profile' ? (
            <ProfileScreen
              onNavigateHome={() => setActiveTab('home')}
              onNavigateGames={() => setActiveTab('games')}
              onNavigateQuests={() => setActiveTab('quests')}
            />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
          <View style={styles.dashboardInner}>
          {/* Animated Celebration Toast Banner for +20 XP Claim */}
          {claimToastMessage && (
            <View style={styles.celebrationToast}>
              <Ionicons name="sparkles" size={16} color="#39FF14" style={{ marginRight: 8 }} />
              <Text style={styles.celebrationToastText}>{claimToastMessage}</Text>
            </View>
          )}

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
                  : ['rgba(255, 106, 0, 0.20)', 'rgba(57, 255, 20, 0.06)', '#08120A']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainStreakGradient}
            >
              <View style={styles.mainStreakTopRow}>
                <View style={styles.mainStreakLeftCol}>
                  <View style={[styles.mainStreakFireBadge, isStreakBroken && styles.mainStreakFireBadgeBroken]}>
                    <Ionicons
                      name="flame"
                      size={26}
                      color={isStreakBroken ? '#FF453A' : '#FF6A00'}
                    />
                  </View>
                  <View style={styles.mainStreakTitleWrap}>
                    <Text style={[styles.mainStreakHeading, isStreakBroken && styles.mainStreakHeadingBroken]}>
                      {isStreakBroken ? 'STREAK BROKEN' : `${userStreak} DAYS STREAK`}
                    </Text>
                    <Text style={styles.mainStreakDesc}>
                      {isStreakBroken
                        ? `Missed ${missedDays} calendar day(s). Previous streak: ${previousStreak} Days.`
                        : `Complete 1 game activity daily (12:00 AM – 11:59 PM) to maintain consecutive days.`}
                    </Text>
                  </View>
                </View>

                {/* Available XP Balance */}
                <View style={styles.mainStreakXpWrap}>
                  <Text style={styles.mainStreakXpLabel}>AVAILABLE BALANCE</Text>
                  <View style={styles.mainStreakXpValueRow}>
                    <Ionicons name="flash" size={14} color="#00E5FF" style={{ marginRight: 4 }} />
                    <Text style={styles.mainStreakXpValueText}>{userXp.toLocaleString()} XP</Text>
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
                        !canRestoreWithXp && styles.restoreStreakButtonDisabled,
                      ]}
                      onPress={() => setIsRestoreModalOpen(true)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={
                          canRestoreWithXp
                            ? ['#FF6A00', '#FF3B30']
                            : ['#2E1C1A', '#1C100E']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.restoreStreakBtnGradient}
                      >
                        <Ionicons
                          name="refresh-circle"
                          size={18}
                          color={canRestoreWithXp ? '#FFFFFF' : '#888888'}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={[
                            styles.restoreStreakButtonText,
                            !canRestoreWithXp && styles.restoreStreakButtonTextDisabled,
                          ]}
                        >
                          RESTORE STREAK – {restorationCost.toLocaleString()} XP
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {!canRestoreWithXp && (
                      <Text style={styles.insufficientXpNotice}>
                        Not enough XP! Earn more XP to restore your streak.
                      </Text>
                    )}
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

                {/* Developer Testing Controls */}
                <View style={styles.streakDevControls}>
                  {isStreakBroken ? (
                    <TouchableOpacity
                      style={styles.streakDevBtn}
                      onPress={async () => {
                        if (addXp) await addXp(1000);
                        Alert.alert('+1,000 XP Added', 'Added 1,000 XP for testing streak restoration.');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.streakDevBtnText}>+1,000 XP (Test)</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.streakDevBtn}
                      onPress={async () => {
                        if (simulateMissedDays) {
                          await simulateMissedDays(1);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.streakDevBtnText}>Break Streak (Test)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* ========================================================= */}
          {/* 5. XP PROGRESS — GAMING HUD                              */}
          {/* ========================================================= */}
          <View style={styles.xpCard}>
            <View style={styles.xpHeader}>
              <View style={styles.xpTitleWrap}>
                <Ionicons name="flash" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.xpHeading}>SEASON PASS // PLAYER PROGRESSION</Text>
              </View>
              <Text style={styles.xpNumbers}>
                {userXp.toLocaleString()} / {userMaxXp.toLocaleString()} XP
              </Text>
            </View>

            <Text style={styles.xpSupportingText}>
              Every mission moves you forward.
            </Text>

            {/* Futuristic Progress Track */}
            <View style={styles.xpTrack}>
              <LinearGradient
                colors={['#00E5FF', '#39FF14']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.xpFill, { width: xpPercent }]}
              />
              <View style={[styles.xpLeadingSpark, { left: xpPercent }]} />
            </View>

            <View style={styles.xpFooterRow}>
              <Text style={styles.xpPercentageText}>{xpPercent} Completed</Text>
              <Text style={styles.xpNextTierText}>{Math.max(0, userMaxXp - userXp).toLocaleString()} XP to Next Milestone</Text>
            </View>
          </View>

          {/* ========================================================= */}
          {/* 6. GAME SEARCH — FUTURISTIC COMMAND BAR                  */}
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
          {/* 7. DAILY 20 XP REWARD — CLAIM CARD                       */}
          {/* ========================================================= */}
          <View style={styles.dailyClaimCard}>
            <LinearGradient
              colors={['rgba(255, 106, 0, 0.22)', 'rgba(57, 255, 20, 0.08)', 'rgba(9, 17, 11, 0.96)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dailyClaimGradient}
            >
              {/* Daily Claim Icon Badge with Glow */}
              <View style={styles.dailyClaimIconWrap}>
                <Ionicons name="gift" size={24} color="#FFD700" />
              </View>

              <View style={styles.dailyClaimContent}>
                <View style={styles.dailyClaimTitleRow}>
                  <Text style={styles.dailyClaimTitle}>🎁 DAILY XP REWARD</Text>
                  <View style={styles.dailyClaimAmountTag}>
                    <Ionicons name="flash" size={11} color="#050705" />
                    <Text style={styles.dailyClaimAmountText}>+20 XP</Text>
                  </View>
                </View>
                <Text style={styles.dailyClaimSubtitle}>
                  {daily20XpClaimed
                    ? '✓ Daily 20 XP collected! Next reward available tomorrow.'
                    : 'Claim your daily 20 XP reward to advance your player tier & streak!'}
                </Text>
                <View style={styles.dailyClaimMetaRow}>
                  <View style={styles.dailyClaimMetaTag}>
                    <Text style={styles.dailyClaimMetaTagText}>🔥 {userStreak}-DAY STREAK ACTIVE</Text>
                  </View>
                  <View style={[styles.dailyClaimMetaTag, styles.dailyClaimMetaTagTier]}>
                    <Text style={styles.dailyClaimMetaTagTierText}>⚡ {userXp.toLocaleString()} XP EARNED</Text>
                  </View>
                </View>
              </View>

              {/* Claim Button */}
              <View style={styles.dailyClaimActionCol}>
                <TouchableOpacity
                  style={[
                    styles.dailyClaimBtn,
                    daily20XpClaimed && styles.dailyClaimBtnClaimed,
                  ]}
                  onPress={handleClaimDaily20Xp}
                  disabled={daily20XpClaimed}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      daily20XpClaimed
                        ? ['#1A241D', '#121914']
                        : ['#39FF14', '#00E5FF']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.dailyClaimBtnGradient}
                  >
                    <Ionicons
                      name={daily20XpClaimed ? 'checkmark-circle' : 'flash'}
                      size={15}
                      color={daily20XpClaimed ? '#39FF14' : '#050705'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.dailyClaimBtnText,
                        daily20XpClaimed && styles.dailyClaimBtnTextClaimed,
                      ]}
                    >
                      {daily20XpClaimed ? '20 XP CLAIMED ✓' : 'CLAIM +20 XP'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {daily20XpClaimed && (
                  <TouchableOpacity
                    onPress={handleResetDaily20Xp}
                    style={styles.resetClaimBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resetClaimText}>↺ Reset Claim (Test)</Text>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
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
          {/* 12. DAILY MISSION PANEL — TODAY'S SOLO QUEST             */}
          {/* ========================================================= */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionEyebrow}>DAILY OBJECTIVES</Text>
                <Text style={styles.sectionTitle}>TODAY'S SOLO QUEST</Text>
                <Text style={styles.sectionSubtitle}>
                  One challenge. One reward. Your next achievement.
                </Text>
              </View>
              <Text style={styles.resetTimerText}>Resets in 6h 24m</Text>
            </View>

            {quests.map((quest) => {
              const isCompleted = quest.current >= quest.target;
              return (
                <View key={quest.id} style={styles.questCard}>
                  <View style={styles.questIconContainer}>
                    <Ionicons
                      name={quest.icon}
                      size={22}
                      color={quest.claimed ? colors.textMuted : colors.primary}
                    />
                  </View>

                  <View style={styles.questInfo}>
                    <Text
                      style={[
                        styles.questTitle,
                        quest.claimed && styles.questTitleClaimed,
                      ]}
                    >
                      {quest.title}
                    </Text>
                    <Text style={styles.questDesc}>{quest.desc}</Text>

                    {/* Progress track */}
                    <View style={styles.questProgressContainer}>
                      <View style={styles.questProgressBar}>
                        <View
                          style={[
                            styles.questProgressFill,
                            {
                              width: `${Math.min(
                                100,
                                (quest.current / quest.target) * 100
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.questProgressText}>
                        {quest.current}/{quest.target}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.questRewardBtn,
                      isCompleted && !quest.claimed && styles.questRewardBtnReady,
                      quest.claimed && styles.questRewardBtnClaimed,
                    ]}
                    disabled={!isCompleted || quest.claimed}
                    onPress={() => handleClaimQuest(quest.id, quest.rewardXp)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.questRewardText,
                        isCompleted && !quest.claimed && styles.questRewardTextReady,
                      ]}
                    >
                      {quest.claimed ? '✓ Done' : quest.reward}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
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

          {/* 13. BOTTOM NAVIGATION — FLOATING GAMING DOCK */}
          {(!isMobileLayout || !activeMobileChat) && (
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
                onPress={() => {
                  setActiveTab('games');
                }}
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
                onPress={() => {
                  setActiveTab('quests');
                }}
                activeOpacity={0.75}
              >
                <View style={styles.questNavIconWrap}>
                  <Ionicons
                    name={activeTab === 'quests' ? 'trophy' : 'trophy-outline'}
                    size={20}
                    color={activeTab === 'quests' ? colors.primary : colors.textSecondary}
                  />
                  {/* Orange alert indicator for active quests */}
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

              {/* 4. PLAYER PROFILE TAB */}
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
          )}
        </View>

        {/* ========================================================= */}
        {/* RIGHT CHAT PANEL: SMART COMPACT GLOBAL SQUAD COMMS       */}
        {/* ========================================================= */}
        {!isMobileLayout && (
          <RightChatPanel
            user={user}
            width={chatPanelWidth}
            isCollapsed={rightCollapsed}
            onToggleCollapse={() => setRightCollapsed(!rightCollapsed)}
          />
        )}
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
          onSessionUpdated={async () => {
            if (refreshStreak) await refreshStreak();
            if (user?.xp) setUserXp(user.xp);
          }}
        />
      )}

      {/* Target Number Interactive Game Modal */}
      <TargetNumberGameModal
        visible={isTargetGameOpen}
        onClose={() => setIsTargetGameOpen(false)}
        onSessionComplete={async () => {
          if (refreshStreak) await refreshStreak();
          if (user?.xp) setUserXp(user.xp);
        }}
      />

      {/* PIXO Restore Streak Confirmation Modal */}
      <RestoreStreakModal
        visible={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        streakState={streakState}
        availableXp={userXp}
        onConfirmRestore={async () => {
          if (restoreStreak) {
            const res = await restoreStreak();
            if (res && res.success) {
              Alert.alert(
                '🔥 Streak Restored!',
                `Your ${res.restoredStreak}-day streak has been restored!\n\n1,000 XP deducted.\nRemaining XP: ${res.remainingXp.toLocaleString()} XP.`
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
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  centerViewport: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  mobileSegmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#070C08',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 255, 20, 0.12)',
    gap: 8,
  },
  mobileSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mobileSegmentBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  mobileSegmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: 5,
  },
  mobileSegmentTextActive: {
    color: '#050705',
    fontWeight: '900',
  },
  mobileGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    marginLeft: 5,
  },
  mobileOrangeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.orangeAccent,
    marginLeft: 5,
  },
  mobileChatContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  xpCard: {
    backgroundColor: '#111923',
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
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  xpTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpHeading: {
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
  xpNumbers: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  xpSupportingText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 8,
  },
  xpTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpLeadingSpark: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: '100%',
    backgroundColor: colors.orangeWarm,
  },
  xpFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xpPercentageText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  xpNextTierText: {
    color: colors.orangeWarm,
    fontSize: 11,
    fontWeight: '700',
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
  celebrationToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 28, 14, 0.95)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 18px rgba(57, 255, 20, 0.35)',
          animation: 'fadeIn 0.3s ease',
        }
      : {}),
  },
  celebrationToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dailyClaimCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 106, 0, 0.45)',
    marginBottom: spacing.md,
    backgroundColor: '#0E1610',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 6px 24px rgba(255, 106, 0, 0.16), 0 0 16px rgba(57, 255, 20, 0.08)',
        }
      : {}),
  },
  dailyClaimGradient: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center',
    padding: isMobile ? 14 : spacing.md + 2,
    gap: 12,
  },
  dailyClaimIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 12px rgba(255, 215, 0, 0.25)' } : {}),
  },
  dailyClaimContent: {
    flex: 1,
  },
  dailyClaimTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 3,
  },
  dailyClaimTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', sans-serif",
        }
      : {}),
  },
  dailyClaimAmountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 8px rgba(57, 255, 20, 0.4)' } : {}),
  },
  dailyClaimAmountText: {
    color: '#050705',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginLeft: 3,
  },
  dailyClaimSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  dailyClaimMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dailyClaimMetaTag: {
    backgroundColor: 'rgba(255, 106, 0, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dailyClaimMetaTagText: {
    color: colors.orangeWarm,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  dailyClaimMetaTagTier: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  dailyClaimMetaTagTierText: {
    color: colors.primary,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  dailyClaimActionCol: {
    alignItems: isMobile ? 'stretch' : 'flex-end',
    width: isMobile ? '100%' : 'auto',
    gap: 4,
  },
  dailyClaimBtn: {
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
  dailyClaimBtnClaimed: {
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: 'none',
        }
      : {}),
  },
  dailyClaimBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dailyClaimBtnText: {
    color: '#050705',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  dailyClaimBtnTextClaimed: {
    color: colors.primary,
  },
  resetClaimBtn: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignSelf: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  resetClaimText: {
    color: colors.textSecondary,
    fontSize: 10,
    textDecorationLine: 'underline',
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
