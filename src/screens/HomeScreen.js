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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlowingBackground } from '../components/GlowingBackground';
import { GameDetailsModal } from '../components/GameDetailsModal';
import { ProfileScreen } from './ProfileScreen';
import { GameSessionRunnerModal } from '../components/gameplay/GameSessionRunnerModal';
import { TargetNumberGameModal } from '../components/gameplay/TargetNumberGameModal';
import { LogicCodeGameModal } from '../components/gameplay/LogicCodeGameModal';
import { RestoreStreakModal } from '../components/profile/RestoreStreakModal';
import { CoinStoreScreen } from './CoinStoreScreen';
import {
  GamingActivityService,
  DEFAULT_DAILY_QUESTS,
} from '../services/gamingActivityService';
import { GamePersistenceService } from '../services/gamePersistenceService';
import { NavigationService } from '../services/navigationService';
import { PixoBackButton, PixoExitConfirmModal } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';
import { DASHBOARD_ART } from '../utils/dashboardArt';

const { width } = Dimensions.get('window');

// 6 Filter Categories
const CATEGORIES = [
  { id: 'all', label: 'All Games', icon: 'flash' },
  { id: 'puzzle', label: 'Logic & Puzzle', icon: 'cube' },
  { id: 'rpg', label: 'Action RPG', icon: 'shield' },
  { id: 'scifi', label: 'Sci-Fi Worlds', icon: 'planet' },
  { id: 'retro', label: 'Retro 8-Bit', icon: 'game-controller' },
  { id: 'racing', label: 'Neon Racing', icon: 'car-sport' },
];

// All Games in PIXO Catalog with Curated High-Resolution Internet Artwork
export const ALL_GAMES = [
  {
    id: 'g_cyber_strike',
    title: 'Cyber Strike: 2099',
    category: 'Logic Code / Brain Training',
    catId: 'puzzle',
    rating: '5.0',
    reviews: '18.4k',
    badge: '40 LEVELS',
    badgeColor: '#00E5FF',
    accentColor: '#00E5FF',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    fallbackArt: DASHBOARD_ART.cyberStrike,
    desc: 'Think Smart. Solve Fast. Strike Strong. Master Pattern Recognition, Number Intelligence, Root & Power, and Missing BODMAS Operators across 40 tactical levels.',
    tags: ['Logic Code', '40 Levels', 'BODMAS', 'Brain Training'],
    rewardXp: 105,
    rewardCoins: 5,
    isCyberStrike: true,
  },
  {
    id: 'g_target_no',
    title: 'Target Number (Target No.)',
    category: 'Speed Math Rush',
    catId: 'puzzle',
    rating: '4.9',
    reviews: '12.8k',
    badge: 'SPEED MATH',
    badgeColor: '#39FF14',
    accentColor: '#39FF14',
    imageUrl: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=600&q=80',
    fallbackArt: DASHBOARD_ART.cyberPuzzle,
    desc: 'Solve fast math values in 30 seconds! Choose +, -, *, % operators and beat Level 1 (5 values), Level 2 (7 values), and Level 3 (10 values).',
    tags: ['30s Rush', '+, -, *, %', 'Levels 1–3', 'XP Rewards'],
    rewardXp: 50,
    rewardCoins: 10,
    isTargetGame: true,
  },
  {
    id: 'g_retro_adv',
    title: 'Retro Adventure',
    category: 'Retro 8-Bit Pixel Quest',
    catId: 'retro',
    rating: '4.8',
    reviews: '9.2k',
    badge: '8-BIT CLASSIC',
    badgeColor: '#FFD700',
    accentColor: '#FFD700',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    fallbackArt: DASHBOARD_ART.retroAdventure,
    desc: 'Embark on an epic 8-bit quest across crumbling pixel kingdoms, royal castles, and forgotten dungeons.',
    tags: ['Retro 8-Bit', 'Castle Quest', 'Pixel Art'],
    rewardXp: 60,
    rewardCoins: 15,
  },
  {
    id: 'g_neon_runner',
    title: 'Neon Runner: 2099',
    category: 'Cyber Arcade Parkour',
    catId: 'scifi',
    rating: '4.9',
    reviews: '15.1k',
    badge: 'TRENDING',
    badgeColor: '#39FF14',
    accentColor: '#39FF14',
    imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
    fallbackArt: DASHBOARD_ART.cyberStrike,
    desc: 'High-speed parkour across neo-Tokyo rooftops with custom synthwave soundtrack and combo multiplier mechanics.',
    tags: ['Trending', 'Single Player', 'Cloud Saved'],
    rewardXp: 70,
    rewardCoins: 20,
  },
  {
    id: 'g_shadow_blade',
    title: 'Shadow Blade Reborn',
    category: 'Dark Action RPG',
    catId: 'rpg',
    rating: '4.8',
    reviews: '11.6k',
    badge: 'SOLO QUEST',
    badgeColor: '#FF6A00',
    accentColor: '#FF6A00',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    fallbackArt: DASHBOARD_ART.cyberStrike,
    desc: 'Wield dual plasma katanas against rogue corporate legions. Craft cyber augmentations and conquer boss arenas.',
    tags: ['Action RPG', 'Deep Combat', 'Offline Mode'],
    rewardXp: 80,
    rewardCoins: 25,
  },
  {
    id: 'g_astro_odyssey',
    title: 'Astro Odyssey Zero',
    category: 'Space Exploration',
    catId: 'scifi',
    rating: '4.7',
    reviews: '8.4k',
    badge: 'POPULAR',
    badgeColor: '#00E5FF',
    accentColor: '#00E5FF',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    fallbackArt: DASHBOARD_ART.cyberPuzzle,
    desc: 'Pilot an interstellar scout craft through uncharted wormholes. Discover alien ruins and cosmic puzzles.',
    tags: ['Sci-Fi', 'Space', 'Atmospheric'],
    rewardXp: 65,
    rewardCoins: 15,
  },
  {
    id: 'g_neon_racing',
    title: 'Neon Racing: Grid Run',
    category: 'Hyper Speed Racing',
    catId: 'racing',
    rating: '4.9',
    reviews: '14.7k',
    badge: 'HOT SPEED',
    badgeColor: '#39FF14',
    accentColor: '#39FF14',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    fallbackArt: DASHBOARD_ART.neonRacing,
    desc: 'Outrun police drones down infinite neon highways. Features authentic analog synthesizer audio tracks.',
    tags: ['Neon Racing', 'Arcade Physics', 'Controller Ready'],
    rewardXp: 75,
    rewardCoins: 20,
  },
  {
    id: 'g_cyber_puzzle',
    title: 'Cyber Puzzle Matrix',
    category: '3D Isometric Puzzle',
    catId: 'puzzle',
    rating: '4.6',
    reviews: '7.8k',
    badge: 'BRAIN TEASER',
    badgeColor: '#00E5FF',
    accentColor: '#00E5FF',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    fallbackArt: DASHBOARD_ART.cyberPuzzle,
    desc: 'Rewire neural logic gates to liberate sentient AI nodes before corporate counter-measures breach your firewall.',
    tags: ['Brain Teaser', 'Cyberpunk', 'Original Soundtrack'],
    rewardXp: 55,
    rewardCoins: 12,
  },
  {
    id: 'g_quantum_fracture',
    title: 'Quantum Fracture',
    category: 'Sci-Fi Roguelike',
    catId: 'scifi',
    rating: '4.9',
    reviews: '6.5k',
    badge: 'NEW RELEASE',
    badgeColor: '#00FFA3',
    accentColor: '#00FFA3',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    fallbackArt: DASHBOARD_ART.cyberPuzzle,
    desc: 'Collapse temporal dimensions to outmaneuver anomaly guardians in high-stakes procedurally generated vaults.',
    tags: ['New Release', 'Roguelike', 'Ray Tracing'],
    rewardXp: 90,
    rewardCoins: 30,
  },
  {
    id: 'g_chrono_glitch',
    title: 'Chrono Glitch Tactics',
    category: 'Turn-Based Strategy',
    catId: 'puzzle',
    rating: '4.7',
    reviews: '5.9k',
    badge: 'TACTICAL',
    badgeColor: '#FFD700',
    accentColor: '#FFD700',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    fallbackArt: DASHBOARD_ART.cyberPuzzle,
    desc: 'Rewind battlefield rounds up to three times. Master chess-like positioning against rogue cyber syndicates.',
    tags: ['Hidden Gem', 'Tactical', 'Turn-Based'],
    rewardXp: 70,
    rewardCoins: 18,
  },
  {
    id: 'g_voidwalker',
    title: 'Voidwalker: Origins',
    category: 'Dark Fantasy RPG',
    catId: 'rpg',
    rating: '4.9',
    reviews: '21.3k',
    badge: 'TOP RATED',
    badgeColor: '#FF453A',
    accentColor: '#FF453A',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    fallbackArt: DASHBOARD_ART.cyberStrike,
    desc: 'Explore a ruined gothic kingdom with no internet connection required. Over 40 hours of rich lore and branch choices.',
    tags: ['Offline Exclusive', 'Action RPG', 'Full Story'],
    rewardXp: 100,
    rewardCoins: 35,
  },
  {
    id: 'g_synthwave_84',
    title: 'Synthwave Highway 84',
    category: 'Retro Arcade Racer',
    catId: 'racing',
    rating: '4.8',
    reviews: '10.2k',
    badge: '80S SYNTH',
    badgeColor: '#FF6A00',
    accentColor: '#FF6A00',
    imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80',
    fallbackArt: DASHBOARD_ART.neonRacing,
    desc: 'Cruise along the neon sunset coast with authentic 1984 synthesizer vibes and arcade drifting mechanics.',
    tags: ['Synthwave', 'Retro Racing', 'Drift Mode'],
    rewardXp: 60,
    rewardCoins: 15,
  },
];

export const HomeScreen = ({ onNavigateToLogin }) => {
  const {
    user,
    streakState,
    logout,
    addXp,
    restoreStreak,
    refreshStreak,
  } = useAuth();

  // Dynamic user stats state with real session persistence
  const [userXp, setUserXp] = useState(user?.xp ?? 750);
  const [userCoins, setUserCoins] = useState(user?.coins ?? 1250);
  const [userStreak, setUserStreak] = useState(streakState?.currentStreak ?? (user?.streak ?? 1));
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Search & Filter states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameModal, setSelectedGameModal] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [liveSessionGame, setLiveSessionGame] = useState(null);
  const [isTargetGameOpen, setIsTargetGameOpen] = useState(false);
  const [isLogicCodeOpen, setIsLogicCodeOpen] = useState(false);
  const [hasActiveTargetSession, setHasActiveTargetSession] = useState(false);
  const [targetLevelToPlay, setTargetLevelToPlay] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [isExitConfirmVisible, setIsExitConfirmVisible] = useState(false);

  // Centralized Navigation Service Subscriptions
  useEffect(() => {
    const unsubRoute = NavigationService.subscribe((route) => {
      if (route && route.id) {
        if (['home', 'games', 'quests', 'store', 'profile'].includes(route.id)) {
          setActiveTab(route.id);
          setIsTargetGameOpen(false);
          setIsLogicCodeOpen(false);
          setSelectedGameModal(null);
        } else if (['target_number', 'target_level_select', 'target_gameplay'].includes(route.id)) {
          setActiveTab('games');
          setIsTargetGameOpen(true);
        } else if (['cyber_strike', 'cyber_strike_levels', 'cyber_strike_gameplay'].includes(route.id)) {
          setActiveTab('games');
          setIsLogicCodeOpen(true);
        } else if (route.id === 'game_details') {
          setActiveTab('games');
          setSelectedGameModal(route.params?.game || ALL_GAMES[0]);
        }
      }
    });

    const unsubExit = NavigationService.onExitRequest(() => {
      setIsExitConfirmVisible(true);
    });

    return () => {
      unsubRoute();
      unsubExit();
    };
  }, []);

  const handleNavigate = (routeId, params = {}) => {
    NavigationService.navigate(routeId, params);
  };

  // Daily Quests state
  const [dailyQuests, setDailyQuests] = useState([]);
  const [resetCountdown, setResetCountdown] = useState('8h 00m');

  const playerName = user?.name || 'SoloSlayer';

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
        if (active && isMounted && active.status === 'in_progress') {
          setHasActiveTargetSession(true);
          setIsTargetGameOpen(true);
        }
      } catch (e) {
        console.warn('Error checking saved game session:', e);
      }
    };
    checkSavedGame();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Load levels and quests from database
  const loadLevelsAndQuests = async () => {
    if (!user?.id) return;
    try {
      const [unlocked, qData] = await Promise.all([
        GamingActivityService.getUserUnlockedLevel(user.id),
        GamingActivityService.getDailyQuests(user.id),
      ]);
      setUnlockedLevel(unlocked || 1);
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

  // Streak state
  const isStreakBroken = streakState?.streakStatus === 'broken' || (streakState?.missedDays > 0 && userStreak === 0);
  const missedDays = Math.max(1, streakState?.missedDays || 1);
  const previousStreak = streakState?.previousStreak || (userStreak > 0 ? userStreak : 1);
  const restorationCostCoins = missedDays * 100;
  const hasEnoughCoins = userCoins >= restorationCostCoins;

  // Refresh data after transactions
  const handleTransactionsChanged = async () => {
    if (refreshStreak) await refreshStreak();
    await loadRecentTransactions();
    await loadLevelsAndQuests();
  };

  // Claim Daily Quest Reward
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

  // Launch Game Handler
  const handleStartGame = (game) => {
    setSelectedGameModal(null);
    if (
      game?.id === 'g_cyber_strike' ||
      game?.id === 'cyber_strike' ||
      game?.isCyberStrike ||
      game?.title?.toLowerCase().includes('cyber strike') ||
      game?.title?.toLowerCase().includes('logic code')
    ) {
      NavigationService.navigate('cyber_strike');
      return;
    }
    if (
      game?.id === 'g_target_no' ||
      game?.isTargetGame ||
      game?.title?.toLowerCase().includes('target')
    ) {
      NavigationService.navigate('target_number');
      return;
    }
    NavigationService.navigate('game_details', { game });
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
            if (logout) await logout();
            if (onNavigateToLogin) onNavigateToLogin();
          },
        },
      ]
    );
  };

  // Filtered Games in Grid
  const filteredGames = useMemo(() => {
    return ALL_GAMES.filter((g) => {
      const matchesCategory = selectedCategory === 'all' || g.catId === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.desc.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Daily Objectives
  const displayQuests = useMemo(() => {
    const q1 = dailyQuests.find((q) => q.id === 'dq1') || {
      id: 'dq1',
      title: 'Complete a Game',
      desc: 'Play any game once',
      rewardXp: 50,
      rewardCoins: 100,
      current: 1,
      target: 1,
      claimed: true,
      icon: 'trophy',
    };
    const q2 = dailyQuests.find((q) => q.id === 'dq2') || {
      id: 'dq2',
      title: 'Play 3 Games',
      desc: 'Play 3 different games',
      rewardXp: 100,
      rewardCoins: 200,
      current: 1,
      target: 3,
      claimed: false,
      icon: 'trending-up',
    };
    const q3 = dailyQuests.find((q) => q.id === 'dq3') || {
      id: 'dq3',
      title: 'Win a Challenge',
      desc: 'Win any challenge',
      rewardXp: 150,
      rewardCoins: 300,
      current: 0,
      target: 1,
      claimed: false,
      icon: 'ribbon',
    };
    return [q1, q2, q3];
  }, [dailyQuests]);

  return (
    <GlowingBackground>
      <View style={styles.appShell}>
        <View style={styles.centerViewport}>
          {/* ========================================================= */}
          {/* 1. TOP HEADER APP BAR                                     */}
          {/* ========================================================= */}
          <View style={styles.header}>
            {/* Left: Neon Lightning + PIXO Logo + Online status */}
            <View style={styles.brandRow}>
              <Ionicons name="flash" size={24} color="#39FF14" style={{ marginRight: 6 }} />
              <Text style={styles.brandTitle}>PIXO</Text>
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>

            {/* Right: Avatar + Coins + Streak + XP + Bell + Logout */}
            <View style={styles.headerRightRow}>
              {/* Profile Avatar */}
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => handleNavigate('profile')}
                activeOpacity={0.8}
                accessibilityLabel="Player Profile"
              >
                <Image
                  source={{ uri: user?.profilePicture || DASHBOARD_ART.avatar }}
                  style={styles.avatarImg}
                />
              </TouchableOpacity>

              {/* Coins Pill: 1,250 + */}
              <TouchableOpacity
                style={styles.headerCoinPill}
                onPress={() => handleNavigate('store')}
                activeOpacity={0.8}
              >
                <Ionicons name="cash" size={13} color="#FFD700" style={{ marginRight: 4 }} />
                <Text style={styles.headerCoinText}>{userCoins.toLocaleString()}</Text>
                <Text style={styles.headerPlusSign}>+</Text>
              </TouchableOpacity>

              {/* Streak Pill: 1 Day */}
              <TouchableOpacity
                style={[styles.headerStreakPill, isStreakBroken && styles.headerStreakPillBroken]}
                onPress={() => {
                  if (isStreakBroken) setIsRestoreModalOpen(true);
                  else handleNavigate('store');
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isStreakBroken ? 'alert-circle' : 'flame'}
                  size={13}
                  color={isStreakBroken ? '#FF453A' : '#FF6A00'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.headerStreakText,
                    isStreakBroken && styles.headerStreakTextBroken,
                  ]}
                >
                  {isStreakBroken ? 'Broken' : `${userStreak} Day`}
                </Text>
              </TouchableOpacity>

              {/* XP Pill: XP 750 */}
              <TouchableOpacity
                style={styles.headerXpPill}
                onPress={() => handleNavigate('store')}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={12} color="#00E5FF" style={{ marginRight: 3 }} />
                <Text style={styles.headerXpText}>XP {userXp.toLocaleString()}</Text>
              </TouchableOpacity>

              {/* Bell Icon with badge '2' */}
              <TouchableOpacity
                style={styles.headerBellBtn}
                onPress={() =>
                  Alert.alert(
                    'PIXO Notifications',
                    `1. Daily quest bonus is ready to claim!\n2. Streak bonus: Reach 7 Days to unlock exclusive Badge reward!`
                  )
                }
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={17} color="#FFFFFF" />
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>2</Text>
                </View>
              </TouchableOpacity>

              {/* Logout Icon */}
              <TouchableOpacity
                style={styles.headerLogoutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="exit-outline" size={18} color="#99A89A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Views Routing */}
          {activeTab === 'profile' ? (
            <ProfileScreen
              onNavigateHome={() => handleNavigate('home')}
              onNavigateGames={() => handleNavigate('games')}
              onNavigateQuests={() => handleNavigate('quests')}
            />
          ) : activeTab === 'store' ? (
            <CoinStoreScreen
              onNavigateHome={() => handleNavigate('home')}
            />
          ) : activeTab === 'games' ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.dashboardContainer}>
                {/* Header Bar with Back Button */}
                <View style={styles.tabSubHeaderRow}>
                  <PixoBackButton
                    onPress={() => NavigationService.goBack()}
                    label="BACK"
                    variant="pill"
                    size={14}
                    accessibilityLabel="Back to previous page"
                  />
                  <View style={styles.tabBadge}>
                    <Ionicons name="game-controller" size={14} color="#39FF14" style={{ marginRight: 6 }} />
                    <Text style={styles.tabBadgeText}>PIXO // GAMES DIRECTORY</Text>
                  </View>
                </View>

                <Text style={styles.pageHeadingText}>ALL GAMES DIRECTORY</Text>
                <Text style={styles.pageSubHeadingText}>
                  Explore every single-player game, logic puzzle, and speed math challenge. Win matches to progress your daily streak and earn PIXO Coins!
                </Text>

                {/* Futuristic Pill Search Bar */}
                <View style={styles.searchBarPill}>
                  <Ionicons name="search" size={18} color="#39FF14" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.searchInputPill}
                    placeholder="Search all games, genres, or keywords..."
                    placeholderTextColor="#4E7056"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#8A9E8D" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Category Pills Filter */}
                <View style={styles.categoriesWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContent}
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
                            color={isSelected ? '#050705' : '#8A9E8D'}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.categoryPillText,
                              isSelected && styles.categoryPillTextSelected,
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* All Games Grid */}
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionTitleLeft}>
                      <Ionicons name="grid" size={18} color="#39FF14" style={{ marginRight: 7 }} />
                      <Text style={styles.sectionTitleText}>All Games Catalog</Text>
                      <View style={styles.gameCountBadge}>
                        <Text style={styles.gameCountBadgeText}>{filteredGames.length} AVAILABLE</Text>
                      </View>
                    </View>
                    <Text style={styles.swipeExploreText}>Tap card to play</Text>
                  </View>

                  <View style={styles.gamesGrid}>
                    {filteredGames.map((game) => (
                      <TouchableOpacity
                        key={game.id}
                        style={styles.gridGameCard}
                        onPress={() => handleStartGame(game)}
                        activeOpacity={0.88}
                      >
                        <Image
                          source={{ uri: game.imageUrl }}
                          style={styles.gridCardImage}
                          resizeMode="cover"
                        />
                        <LinearGradient
                          colors={['rgba(0,0,0,0.25)', 'rgba(4, 12, 7, 0.65)', 'rgba(4, 7, 5, 0.98)']}
                          locations={[0, 0.42, 1]}
                          style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.gridCardTopRow}>
                          <View
                            style={[
                              styles.gridBadgePill,
                              { borderColor: game.badgeColor || '#39FF14' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.gridBadgeText,
                                { color: game.badgeColor || '#39FF14' },
                              ]}
                            >
                              {game.badge}
                            </Text>
                          </View>
                          <View style={styles.gridRatingPill}>
                            <Ionicons name="star" size={11} color="#FFD700" style={{ marginRight: 3 }} />
                            <Text style={styles.gridRatingText}>{game.rating}</Text>
                          </View>
                        </View>

                        <View style={styles.gridCardBottomContent}>
                          <Text style={styles.gridGameTitle} numberOfLines={1}>
                            {game.title}
                          </Text>
                          <Text style={styles.gridGameCategory} numberOfLines={1}>
                            {game.category}
                          </Text>

                          <View style={styles.gridCardFooterRow}>
                            <View style={styles.gridRewardChip}>
                              <Text style={styles.gridRewardChipText}>
                                +{game.rewardXp} XP
                              </Text>
                            </View>

                            <TouchableOpacity
                              style={styles.gridPlayBtn}
                              onPress={() => handleStartGame(game)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="play" size={11} color="#39FF14" style={{ marginRight: 3 }} />
                              <Text style={styles.gridPlayBtnText}>PLAY</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          ) : activeTab === 'quests' ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.dashboardContainer}>
                {/* Header Bar with Back Button */}
                <View style={styles.tabSubHeaderRow}>
                  <PixoBackButton
                    onPress={() => NavigationService.goBack()}
                    label="BACK"
                    variant="pill"
                    size={14}
                    accessibilityLabel="Back to previous page"
                  />
                  <View style={styles.tabBadge}>
                    <Ionicons name="locate" size={14} color="#00E5FF" style={{ marginRight: 6 }} />
                    <Text style={[styles.tabBadgeText, { color: '#00E5FF' }]}>PIXO // DAILY QUESTS</Text>
                  </View>
                </View>

                <Text style={styles.pageHeadingText}>DAILY OBJECTIVES & REWARDS</Text>
                <Text style={styles.pageSubHeadingText}>
                  Complete all daily missions to earn bonus XP and PIXO Coins. Streaks reset every 24 hours at midnight UTC.
                </Text>

                {/* Reset Banner */}
                <View style={styles.questResetCard}>
                  <Ionicons name="timer-outline" size={20} color="#FFD700" style={{ marginRight: 8 }} />
                  <Text style={styles.questResetCardText}>
                    Daily Objectives refresh in: <Text style={{ color: '#FFD700', fontWeight: '800' }}>{resetCountdown}</Text>
                  </Text>
                </View>

                {/* Quests Detailed List */}
                <View style={styles.questsDetailedList}>
                  {displayQuests.map((quest) => {
                    const isComplete = quest.current >= quest.target;
                    const isClaimed = quest.claimed;
                    const progressPercent = Math.min(100, Math.round((quest.current / quest.target) * 100));

                    return (
                      <View key={quest.id} style={styles.questDetailedCard}>
                        <View style={styles.questTopLine}>
                          <View style={styles.questIconBadge}>
                            <Ionicons
                              name={quest.icon === 'trophy' ? 'trophy' : quest.icon === 'trending-up' ? 'trending-up' : 'ribbon'}
                              size={20}
                              color="#FFD700"
                            />
                          </View>
                          <View style={styles.questInfoCol}>
                            <Text style={styles.questCardTitle}>{quest.title}</Text>
                            <Text style={styles.questCardDesc}>{quest.desc}</Text>
                          </View>
                          <View style={styles.questBountyCol}>
                            <Text style={styles.questXpBadge}>+{quest.rewardXp} XP</Text>
                            <Text style={styles.questCoinBadge}>+{quest.rewardCoins} Coins</Text>
                          </View>
                        </View>

                        <View style={styles.questProgressRow}>
                          <View style={styles.questProgressBar}>
                            <View style={[styles.questProgressFill, { width: `${progressPercent}%` }]} />
                          </View>
                          <Text style={styles.questProgressText}>{quest.current}/{quest.target}</Text>
                        </View>

                        <View style={styles.questActionRow}>
                          {isClaimed ? (
                            <View style={styles.objectiveClaimedBtn}>
                              <Ionicons name="checkmark-circle" size={14} color="#39FF14" style={{ marginRight: 5 }} />
                              <Text style={styles.objectiveClaimedText}>CLAIMED</Text>
                            </View>
                          ) : isComplete ? (
                            <TouchableOpacity
                              style={styles.objectiveClaimReadyBtn}
                              onPress={() => handleClaimDailyQuestReward(quest.id)}
                              activeOpacity={0.8}
                            >
                              <LinearGradient
                                colors={['#39FF14', '#00E5FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.objectiveClaimGradient}
                              >
                                <Ionicons name="gift" size={14} color="#050705" style={{ marginRight: 5 }} />
                                <Text style={styles.objectiveClaimReadyText}>CLAIM REWARD</Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.objectiveLockedClaimBtn}
                              onPress={() => {
                                Alert.alert(
                                  'Quest In Progress',
                                  `Progress: ${quest.current}/${quest.target}. Play matches to complete!`
                                );
                              }}
                              activeOpacity={0.85}
                            >
                              <Text style={styles.objectiveLockedClaimText}>IN PROGRESS</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.dashboardContainer}>
                {/* ========================================================= */}
                {/* 2. HERO CURRENT STREAK BANNER                             */}
                {/* ========================================================= */}
                <View style={styles.streakHeroCard}>
                  <LinearGradient
                    colors={
                      isStreakBroken
                        ? ['#200B0B', '#120505', '#0A0303']
                        : ['#0E2A17', '#08170D', '#030805']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.streakHeroGradient}
                  >
                    {/* Left: Flame badge */}
                    <View style={styles.streakBadgeWrapper}>
                      <View
                        style={[
                          styles.streakOuterRing,
                          isStreakBroken && styles.streakOuterRingBroken,
                        ]}
                      />
                      <View
                        style={[
                          styles.streakInnerCircle,
                          isStreakBroken && styles.streakInnerCircleBroken,
                        ]}
                      >
                        <Ionicons
                          name={isStreakBroken ? 'alert-circle' : 'flame'}
                          size={32}
                          color={isStreakBroken ? '#FF453A' : '#FFA000'}
                        />
                      </View>
                    </View>

                    {/* Center: Info + 7-Day Stepper */}
                    <View style={styles.streakCenterCol}>
                      <Text style={styles.streakEyebrow}>CURRENT STREAK</Text>
                      <Text
                        style={[
                          styles.streakCountNumber,
                          isStreakBroken && styles.streakCountNumberBroken,
                        ]}
                      >
                        {isStreakBroken ? 'STREAK BROKEN' : `${userStreak} DAY`}
                      </Text>
                      <Text style={styles.streakMilestoneText}>
                        {isStreakBroken
                          ? `Restore for ${restorationCostCoins} Coins`
                          : 'Next Milestone: 7 Days'}
                      </Text>

                      {/* Stepper Dots Track */}
                      <View style={styles.stepperTrackRow}>
                        {[1, 2, 3, 4, 5, 6, 7].map((dayNum, idx) => {
                          const isPassed = !isStreakBroken && userStreak >= dayNum;
                          const isCurrent = !isStreakBroken && userStreak === dayNum;
                          return (
                            <React.Fragment key={dayNum}>
                              <View
                                style={[
                                  styles.stepperDot,
                                  isPassed && styles.stepperDotActive,
                                  isCurrent && styles.stepperDotCurrent,
                                ]}
                              />
                              {idx < 6 && (
                                <View
                                  style={[
                                    styles.stepperLine,
                                    !isStreakBroken && userStreak > dayNum && styles.stepperLineActive,
                                  ]}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </View>
                    </View>

                    {/* Right: 3D Gift Box */}
                    <TouchableOpacity
                      style={styles.streakRewardCol}
                      onPress={() => {
                        if (isStreakBroken) setIsRestoreModalOpen(true);
                        else handleNavigate('store');
                      }}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: DASHBOARD_ART.giftBox }}
                        style={styles.giftBoxImg}
                        resizeMode="contain"
                      />
                      <Text style={styles.giftRewardLabel}>Next Reward</Text>
                      <Text style={styles.giftRewardValue}>+100 XP</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>

                {/* ========================================================= */}
                {/* 3. DUAL QUICK-ACTION BUTTONS                              */}
                {/* ========================================================= */}
                <View style={styles.quickButtonsRow}>
                  {/* PLAY GAME BUTTON */}
                  <TouchableOpacity
                    style={styles.quickPlayButton}
                    onPress={() => handleNavigate('games')}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#39FF14', '#00E5FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.quickBtnGradient}
                    >
                      <View style={styles.quickBtnLeft}>
                        <Ionicons
                          name="game-controller"
                          size={19}
                          color="#050705"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.quickPlayText}>PLAY GAME</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={17} color="#050705" />
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* COIN STORE BUTTON */}
                  <TouchableOpacity
                    style={styles.quickStoreButton}
                    onPress={() => handleNavigate('store')}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FF8C00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.quickBtnGradient}
                    >
                      <View style={styles.quickBtnLeft}>
                        <Ionicons
                          name="cash"
                          size={19}
                          color="#050705"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.quickStoreText}>COIN STORE</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={17} color="#050705" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* ========================================================= */}
                {/* 4. FUTURISTIC PILL SEARCH BAR                             */}
                {/* ========================================================= */}
                <View style={styles.searchBarPill}>
                  <Ionicons name="search" size={18} color="#39FF14" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.searchInputPill}
                    placeholder="Search all games, genres, or keywords..."
                    placeholderTextColor="#4E7056"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#8A9E8D" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert('Filter Games', 'Use the pills below to filter by Logic, RPG, Sci-Fi, Retro, or Racing.')
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons name="options-outline" size={20} color="#8A9E8D" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* ========================================================= */}
                {/* 5. CATEGORY FILTER PILLS                                  */}
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
                            color={isSelected ? '#050705' : '#8A9E8D'}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.categoryPillText,
                              isSelected && styles.categoryPillTextSelected,
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
                {/* 6. DAILY OBJECTIVES & REWARDS (3 CARDS)                   */}
                {/* ========================================================= */}
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionTitleLeft}>
                      <Ionicons name="star" size={18} color="#39FF14" style={{ marginRight: 7 }} />
                      <Text style={styles.sectionTitleText}>Daily Objectives & Rewards</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleNavigate('quests')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.viewAllText}>View All →</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dailyObjectivesRow}>
                    {displayQuests.map((quest, index) => {
                      const isComplete = quest.current >= quest.target;
                      const progressRatio = Math.min(1, quest.target > 0 ? quest.current / quest.target : 0);
                      const progressPercent = Math.round(progressRatio * 100);

                      return (
                        <View key={quest.id || index} style={styles.objectiveCard}>
                          {/* Card Icon */}
                          <View style={styles.objectiveIconRow}>
                            <Ionicons
                              name={quest.icon || (index === 0 ? 'trophy' : index === 1 ? 'trending-up' : 'ribbon')}
                              size={24}
                              color={index === 1 ? '#39FF14' : '#FFD700'}
                            />
                          </View>

                          {/* Titles */}
                          <Text style={styles.objectiveTitle} numberOfLines={1}>
                            {quest.title}
                          </Text>
                          <Text style={styles.objectiveSub} numberOfLines={1}>
                            {quest.desc}
                          </Text>

                          {/* Reward Badges */}
                          <View style={styles.rewardBadgesRow}>
                            <View style={styles.xpRewardBadge}>
                              <Text style={styles.xpRewardText}>+{quest.rewardXp} XP</Text>
                            </View>
                            <View style={styles.coinRewardBadge}>
                              <Ionicons name="cash" size={10} color="#FFD700" style={{ marginRight: 2 }} />
                              <Text style={styles.coinRewardText}>+{quest.rewardCoins}</Text>
                            </View>
                          </View>

                          {/* Progress Bar */}
                          <View style={styles.objectiveProgressContainer}>
                            <View style={styles.objectiveProgressBar}>
                              <View
                                style={[
                                  styles.objectiveProgressFill,
                                  {
                                    width: `${progressPercent}%`,
                                    backgroundColor: isComplete ? '#39FF14' : '#00E5FF',
                                  },
                                ]}
                              />
                            </View>
                            <Text style={styles.objectiveProgressFraction}>
                              {quest.current}/{quest.target}
                            </Text>
                          </View>

                          {/* Action Button */}
                          <View style={styles.objectiveButtonWrap}>
                            {quest.claimed ? (
                              <View style={styles.objectiveClaimedBtn}>
                                <Ionicons name="checkmark-sharp" size={13} color="#050705" style={{ marginRight: 4 }} />
                                <Text style={styles.objectiveClaimedText}>CLAIMED</Text>
                              </View>
                            ) : isComplete ? (
                              <TouchableOpacity
                                style={styles.objectiveActiveClaimBtn}
                                onPress={() => handleClaimDailyQuestReward(quest.id)}
                                activeOpacity={0.85}
                              >
                                <LinearGradient
                                  colors={['#39FF14', '#00E5FF']}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.objectiveActiveGradient}
                                >
                                  <Text style={styles.objectiveActiveClaimText}>CLAIM</Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={styles.objectiveLockedClaimBtn}
                                onPress={() => {
                                  setTargetLevelToPlay(unlockedLevel);
                                  setIsTargetGameOpen(true);
                                }}
                                activeOpacity={0.85}
                              >
                                <Text style={styles.objectiveLockedClaimText}>CLAIM</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* ========================================================= */}
                {/* 7. RECENT ACTIVITY BANNER                                 */}
                {/* ========================================================= */}
                <TouchableOpacity
                  style={styles.recentActivityBanner}
                  onPress={() =>
                    Alert.alert(
                      'Recent Activity Summary',
                      `Player: ${playerName}\nRecent Victory: +50 XP & +100 Coins\nCurrent Streak: ${userStreak} Days\nTotal Coins: ${userCoins.toLocaleString()}`
                    )
                  }
                  activeOpacity={0.85}
                >
                  <View style={styles.recentActivityLeft}>
                    <View style={styles.recentActivityTrophyBadge}>
                      <Ionicons name="trophy" size={17} color="#FFD700" />
                    </View>
                    <View style={styles.recentActivityTextCol}>
                      <Text style={styles.recentActivityHeading}>Recent Activity</Text>
                      <View style={styles.recentActivitySubRow}>
                        <Text style={styles.recentActivitySubText}>You won a game! </Text>
                        <Text style={styles.activityXpGreen}>+50 XP </Text>
                        <Ionicons name="cash" size={11} color="#FFD700" style={{ marginRight: 2 }} />
                        <Text style={styles.activityCoinGold}>+100</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.recentActivityRight}>
                    <Text style={styles.recentActivityTime}>2h ago</Text>
                    <Ionicons name="chevron-forward" size={16} color="#39FF14" />
                  </View>
                </TouchableOpacity>

                {/* ========================================================= */}
                {/* 8. MAIN ATTRACTION: ALL GAMES IN A PROMINENT GRID         */}
                {/* ========================================================= */}
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionTitleLeft}>
                      <Ionicons name="grid" size={18} color="#39FF14" style={{ marginRight: 7 }} />
                      <Text style={styles.sectionTitleText}>All Games Vault</Text>
                      <View style={styles.gameCountBadge}>
                        <Text style={styles.gameCountBadgeText}>{filteredGames.length} AVAILABLE</Text>
                      </View>
                    </View>
                    <Text style={styles.swipeExploreText}>Tap card to play</Text>
                  </View>

                  {/* 2-Column Responsive Game Grid */}
                  <View style={styles.gamesGrid}>
                    {filteredGames.map((game) => (
                      <TouchableOpacity
                        key={game.id}
                        style={styles.gridGameCard}
                        onPress={() => handleStartGame(game)}
                        activeOpacity={0.88}
                      >
                        {/* High-Resolution Internet Artwork */}
                        <Image
                          source={{ uri: game.imageUrl }}
                          style={styles.gridCardImage}
                          resizeMode="cover"
                        />

                        {/* Contrast Vignette Gradient */}
                        <LinearGradient
                          colors={['rgba(0,0,0,0.25)', 'rgba(4, 12, 7, 0.65)', 'rgba(4, 7, 5, 0.98)']}
                          locations={[0, 0.42, 1]}
                          style={StyleSheet.absoluteFillObject}
                        />

                        {/* Top Badges (Category / Status & Rating) */}
                        <View style={styles.gridCardTopRow}>
                          <View
                            style={[
                              styles.gridBadgePill,
                              { borderColor: game.badgeColor || '#39FF14' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.gridBadgeText,
                                { color: game.badgeColor || '#39FF14' },
                              ]}
                            >
                              {game.badge}
                            </Text>
                          </View>
                          <View style={styles.gridRatingPill}>
                            <Ionicons name="star" size={11} color="#FFD700" style={{ marginRight: 3 }} />
                            <Text style={styles.gridRatingText}>{game.rating}</Text>
                          </View>
                        </View>

                        {/* Bottom Content: Title, Category, Rewards & Play Button */}
                        <View style={styles.gridCardBottomContent}>
                          <Text style={styles.gridGameTitle} numberOfLines={1}>
                            {game.title}
                          </Text>
                          <Text style={styles.gridGameCategory} numberOfLines={1}>
                            {game.category}
                          </Text>

                          <View style={styles.gridCardFooterRow}>
                            <View style={styles.gridRewardChip}>
                              <Text style={styles.gridRewardChipText}>
                                +{game.rewardXp} XP
                              </Text>
                            </View>

                            <TouchableOpacity
                              style={styles.gridPlayBtn}
                              onPress={() => handleStartGame(game)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="play" size={11} color="#39FF14" style={{ marginRight: 3 }} />
                              <Text style={styles.gridPlayBtnText}>PLAY</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* ========================================================= */}
                {/* 9. CONTINUE PLAYING BANNER                                */}
                {/* ========================================================= */}
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionTitleLeft}>
                    <Ionicons name="play-circle" size={18} color="#39FF14" style={{ marginRight: 7 }} />
                    <Text style={styles.sectionTitleText}>Continue Playing</Text>
                  </View>

                  <View style={styles.continuePlayingCard}>
                    {/* Thumbnail */}
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80' }}
                      style={styles.continueThumbnail}
                      resizeMode="cover"
                    />

                    {/* Middle Info */}
                    <View style={styles.continueInfoCol}>
                      <Text style={styles.continueGameTitle}>Neon Racing: Grid Run</Text>
                      <Text style={styles.continueLastPlayed}>Last played: 2h ago</Text>
                      <View style={styles.continueProgressRow}>
                        <View style={styles.continueProgressBar}>
                          <View style={[styles.continueProgressFill, { width: '67%' }]} />
                        </View>
                        <Text style={styles.continuePercentText}>67%</Text>
                      </View>
                    </View>

                    {/* Resume Button */}
                    <TouchableOpacity
                      style={styles.continueResumeBtn}
                      onPress={() => handleStartGame({ title: 'Neon Racing: Grid Run', id: 'g_neon_racing' })}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="play" size={13} color="#050705" style={{ marginRight: 4 }} />
                      <Text style={styles.continueResumeText}>RESUME</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ========================================================= */}
                {/* 10. TRENDING SOLO ADVENTURES BANNER                       */}
                {/* ========================================================= */}
                <TouchableOpacity
                  style={styles.trendingBannerCard}
                  onPress={() => handleStartGame({ title: 'Trending Solo Adventures', id: 'g_trending' })}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#091D11', '#051109', '#020704']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.trendingBannerGradient}
                  >
                    <View style={styles.trendingBannerLeft}>
                      <View style={styles.trendingFlameBadge}>
                        <Ionicons name="flame" size={20} color="#FF6A00" />
                      </View>
                      <View style={styles.trendingTextCol}>
                        <Text style={styles.trendingBannerHeading}>Trending Solo Adventures</Text>
                        <Text style={styles.trendingBannerSub}>150k+ players competing worldwide this week</Text>
                      </View>
                    </View>

                    <View style={styles.trendingBannerRight}>
                      <Image
                        source={{ uri: DASHBOARD_ART.trendingGamepad }}
                        style={styles.trendingGamepadImg}
                        resizeMode="contain"
                      />
                      <Ionicons name="chevron-forward" size={18} color="#39FF14" style={{ marginLeft: 6 }} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* ========================================================= */}
          {/* 11. BOTTOM FLOATING DOCK NAVIGATION                       */}
          {/* ========================================================= */}
          <View style={styles.bottomNavDock}>
            {/* Home Tab */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigate('home')}
              activeOpacity={0.75}
            >
              <Ionicons
                name={activeTab === 'home' ? 'home' : 'home-outline'}
                size={21}
                color={activeTab === 'home' ? '#39FF14' : '#8A9E8D'}
              />
              <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>
                Home
              </Text>
              {activeTab === 'home' && <View style={styles.activePillIndicator} />}
            </TouchableOpacity>

            {/* Games Tab */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigate('games')}
              activeOpacity={0.75}
            >
              <Ionicons
                name={activeTab === 'games' ? 'game-controller' : 'game-controller-outline'}
                size={21}
                color={activeTab === 'games' ? '#39FF14' : '#8A9E8D'}
              />
              <Text style={[styles.navText, activeTab === 'games' && styles.navTextActive]}>
                Games
              </Text>
              {activeTab === 'games' && <View style={styles.activePillIndicator} />}
            </TouchableOpacity>

            {/* Quests Tab */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigate('quests')}
              activeOpacity={0.75}
            >
              <Ionicons
                name={activeTab === 'quests' ? 'locate' : 'locate-outline'}
                size={21}
                color={activeTab === 'quests' ? '#39FF14' : '#8A9E8D'}
              />
              <Text style={[styles.navText, activeTab === 'quests' && styles.navTextActive]}>
                Quests
              </Text>
              {activeTab === 'quests' && <View style={styles.activePillIndicator} />}
            </TouchableOpacity>

            {/* Store Tab */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigate('store')}
              activeOpacity={0.75}
            >
              <Ionicons
                name={activeTab === 'store' ? 'flame' : 'flame-outline'}
                size={21}
                color={activeTab === 'store' ? '#FFD700' : '#8A9E8D'}
              />
              <Text style={[styles.navText, activeTab === 'store' && styles.navTextActive]}>
                Store
              </Text>
              {activeTab === 'store' && <View style={styles.activePillIndicator} />}
            </TouchableOpacity>

            {/* Profile Tab */}
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigate('profile')}
              activeOpacity={0.75}
            >
              <Ionicons
                name={activeTab === 'profile' ? 'person' : 'person-outline'}
                size={21}
                color={activeTab === 'profile' ? '#39FF14' : '#8A9E8D'}
              />
              <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>
                Profile
              </Text>
              {activeTab === 'profile' && <View style={styles.activePillIndicator} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Cinematic Game Details Modal */}
      <GameDetailsModal
        visible={!!selectedGameModal}
        game={selectedGameModal}
        onClose={() => NavigationService.goBack()}
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

      {/* Target Number Interactive Game Modal */}
      <TargetNumberGameModal
        visible={isTargetGameOpen}
        initialLevel={targetLevelToPlay}
        onClose={() => setIsTargetGameOpen(false)}
        onSessionComplete={handleTransactionsChanged}
      />

      {/* Cyber Strike: 2099 - Logic Code Brain-Training Game Modal (40 Levels) */}
      <LogicCodeGameModal
        visible={isLogicCodeOpen}
        onClose={() => setIsLogicCodeOpen(false)}
        onSessionComplete={handleTransactionsChanged}
      />

      {/* PIXO Restore Streak Confirmation Modal */}
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
      {/* Root Dashboard Application Exit Confirmation Modal */}
      <PixoExitConfirmModal
        visible={isExitConfirmVisible}
        onDismiss={() => setIsExitConfirmVisible(false)}
        onConfirmExit={() => {
          setIsExitConfirmVisible(false);
          NavigationService.exitApp();
        }}
      />
    </GlowingBackground>
  );
};

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
  scrollContent: {
    paddingBottom: 95,
  },
  dashboardContainer: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
  },

  tabSubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingTop: 4,
  },
  tabBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
  },
  tabBadgeText: {
    color: '#39FF14',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pageHeadingText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
    marginBottom: 4,
    ...(Platform.OS === 'web' ? { fontFamily: "'Space Grotesk', sans-serif" } : {}),
  },
  pageSubHeadingText: {
    fontSize: 12,
    color: '#8A9E8D',
    lineHeight: 17,
    marginBottom: 16,
  },
  questResetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  questResetCardText: {
    fontSize: 12,
    color: '#F0F6F0',
    fontWeight: '600',
  },
  questsDetailedList: {
    gap: 12,
    marginBottom: 24,
  },
  questDetailedCard: {
    backgroundColor: 'rgba(10, 20, 14, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.18)',
    padding: 14,
  },
  questTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  questIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  questInfoCol: {
    flex: 1,
  },
  questCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  questCardDesc: {
    fontSize: 11,
    color: '#8A9E8D',
  },
  questBountyCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  questXpBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  questCoinBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  questProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  questProgressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    backgroundColor: '#39FF14',
    borderRadius: 3,
  },
  questProgressText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A9E8D',
  },
  questActionRow: {
    alignItems: 'flex-end',
  },

  // 1. TOP HEADER APP BAR
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 24 : 10,
    paddingBottom: 10,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginRight: 8,
    ...(Platform.OS === 'web' ? { fontFamily: "'Space Grotesk', sans-serif" } : {}),
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#39FF14',
    marginRight: 4,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 6px #39FF14' } : {}),
  },
  onlineText: {
    color: '#39FF14',
    fontSize: 11,
    fontWeight: '700',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.8,
    borderColor: '#39FF14',
    overflow: 'hidden',
    backgroundColor: '#0A140C',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', boxShadow: '0 0 8px rgba(57, 255, 20, 0.4)' } : {}),
  },
  avatarImg: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  headerCoinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F170F',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  headerCoinText: {
    color: '#FFD700',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerPlusSign: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 3,
  },
  headerStreakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F170F',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  headerStreakPillBroken: {
    borderColor: 'rgba(255, 69, 58, 0.5)',
    backgroundColor: '#1E0B0B',
  },
  headerStreakText: {
    color: '#FFA154',
    fontSize: 11.5,
    fontWeight: '800',
  },
  headerStreakTextBroken: {
    color: '#FF453A',
  },
  headerXpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F170F',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  headerXpText: {
    color: '#00E5FF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  headerBellBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  headerLogoutBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },

  // 2. HERO CURRENT STREAK BANNER
  streakHeroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#39FF14',
    marginBottom: 12,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 20px rgba(57, 255, 20, 0.22), 0 8px 24px rgba(0, 0, 0, 0.7)',
        }
      : {}),
  },
  streakHeroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  streakBadgeWrapper: {
    position: 'relative',
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  streakOuterRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.8,
    borderColor: '#39FF14',
    opacity: 0.8,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 12px rgba(57, 255, 20, 0.45)' } : {}),
  },
  streakOuterRingBroken: {
    borderColor: '#FF453A',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 12px rgba(255, 69, 58, 0.45)' } : {}),
  },
  streakInnerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakInnerCircleBroken: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
  },
  streakCenterCol: {
    flex: 1,
    justifyContent: 'center',
  },
  streakEyebrow: {
    color: '#8A9E8D',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  streakCountNumber: {
    color: '#39FF14',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginVertical: 1,
    ...(Platform.OS === 'web' ? { fontFamily: "'Space Grotesk', sans-serif" } : {}),
  },
  streakCountNumberBroken: {
    color: '#FF453A',
    fontSize: 20,
  },
  streakMilestoneText: {
    color: '#9EC8A5',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  stepperTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 160,
  },
  stepperDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepperDotActive: {
    backgroundColor: '#39FF14',
  },
  stepperDotCurrent: {
    backgroundColor: '#39FF14',
    width: 8,
    height: 8,
    borderRadius: 4,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 6px #39FF14' } : {}),
  },
  stepperLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 2,
  },
  stepperLineActive: {
    backgroundColor: '#39FF14',
  },
  streakRewardCol: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  giftBoxImg: {
    width: 46,
    height: 46,
    marginBottom: 2,
  },
  giftRewardLabel: {
    color: '#8A9E8D',
    fontSize: 9,
    fontWeight: '700',
  },
  giftRewardValue: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '900',
  },

  // 3. DUAL QUICK-ACTION BUTTONS
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  quickPlayButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(57, 255, 20, 0.28)',
          transition: 'transform 0.15s ease',
        }
      : {}),
  },
  quickStoreButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(255, 215, 0, 0.28)',
          transition: 'transform 0.15s ease',
        }
      : {}),
  },
  quickBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  quickBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickPlayText: {
    color: '#050705',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  quickStoreText: {
    color: '#050705',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // 4. FUTURISTIC PILL SEARCH BAR
  searchBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#081009',
    borderWidth: 1.5,
    borderColor: '#39FF14',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    marginBottom: 12,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 12px rgba(57, 255, 20, 0.12)',
        }
      : {}),
  },
  searchInputPill: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none',
          fontFamily: "'Inter', sans-serif",
        }
      : {}),
  },

  // 5. CATEGORY FILTER PILLS
  categoriesWrapper: {
    marginBottom: 14,
  },
  categoriesScroll: {
    paddingRight: 10,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A130C',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  categoryPillSelected: {
    backgroundColor: '#39FF14',
    borderColor: '#39FF14',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 10px rgba(57, 255, 20, 0.4)' } : {}),
  },
  categoryPillText: {
    color: '#8A9E8D',
    fontSize: 11.5,
    fontWeight: '800',
  },
  categoryPillTextSelected: {
    color: '#050705',
    fontWeight: '900',
  },

  // SECTION BLOCKS & HEADERS
  sectionBlock: {
    marginBottom: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  gameCountBadge: {
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  gameCountBadgeText: {
    color: '#39FF14',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  viewAllText: {
    color: '#39FF14',
    fontSize: 12,
    fontWeight: '800',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  swipeExploreText: {
    color: '#7A8E7E',
    fontSize: 10.5,
    fontWeight: '600',
  },

  // 6. DAILY OBJECTIVES (3 CARDS ROW)
  dailyObjectivesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  objectiveCard: {
    flex: 1,
    backgroundColor: '#0A130C',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    borderRadius: 14,
    padding: 10,
    justifyContent: 'space-between',
  },
  objectiveIconRow: {
    marginBottom: 5,
  },
  objectiveTitle: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '900',
    marginBottom: 2,
  },
  objectiveSub: {
    color: '#7A8E7E',
    fontSize: 9.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  rewardBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  xpRewardBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
  },
  xpRewardText: {
    color: '#00E5FF',
    fontSize: 9,
    fontWeight: '900',
  },
  coinRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
  },
  coinRewardText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '900',
  },
  objectiveProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  objectiveProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  objectiveProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  objectiveProgressFraction: {
    color: '#7A8E7E',
    fontSize: 9,
    fontWeight: '700',
  },
  objectiveButtonWrap: {
    width: '100%',
  },
  objectiveClaimedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#39FF14',
    paddingVertical: 6,
    borderRadius: 8,
  },
  objectiveClaimedText: {
    color: '#050705',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  objectiveActiveClaimBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  objectiveActiveGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  objectiveActiveClaimText: {
    color: '#050705',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  objectiveLockedClaimBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.35)',
    paddingVertical: 5,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  objectiveLockedClaimText: {
    color: '#39FF14',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  // 7. RECENT ACTIVITY BANNER
  recentActivityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#09130B',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  recentActivityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recentActivityTrophyBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentActivityTextCol: {
    justifyContent: 'center',
  },
  recentActivityHeading: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  recentActivitySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentActivitySubText: {
    color: '#7A8E7E',
    fontSize: 10.5,
  },
  activityXpGreen: {
    color: '#39FF14',
    fontSize: 10.5,
    fontWeight: '800',
  },
  activityCoinGold: {
    color: '#FFD700',
    fontSize: 10.5,
    fontWeight: '800',
  },
  recentActivityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentActivityTime: {
    color: '#7A8E7E',
    fontSize: 10.5,
  },

  // 8. ALL GAMES GRID
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  gridGameCard: {
    width: '48.5%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#07120A',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 2,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.7)',
          transition: 'transform 0.2s ease, border-color 0.2s ease',
        }
      : {}),
  },
  gridCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gridCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  gridBadgePill: {
    backgroundColor: 'rgba(5, 10, 6, 0.82)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gridBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gridRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 10, 6, 0.82)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gridRatingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  gridCardBottomContent: {
    zIndex: 2,
  },
  gridGameTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gridGameCategory: {
    color: '#8A9E8D',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
  },
  gridCardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridRewardChip: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.28)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridRewardChipText: {
    color: '#00E5FF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  gridPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  gridPlayBtnText: {
    color: '#39FF14',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // 9. CONTINUE PLAYING CARD
  continuePlayingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09130B',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    borderRadius: 14,
    padding: 10,
    gap: 12,
  },
  continueThumbnail: {
    width: 66,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#12091A',
  },
  continueInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  continueGameTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  continueLastPlayed: {
    color: '#7A8E7E',
    fontSize: 10,
    marginBottom: 6,
  },
  continueProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  continueProgressFill: {
    height: '100%',
    backgroundColor: '#39FF14',
    borderRadius: 2,
  },
  continuePercentText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  continueResumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#39FF14',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  continueResumeText: {
    color: '#050705',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // 10. TRENDING SOLO ADVENTURES BANNER
  trendingBannerCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.28)',
    marginBottom: 20,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  trendingBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  trendingBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendingFlameBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingTextCol: {
    justifyContent: 'center',
  },
  trendingBannerHeading: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 1,
  },
  trendingBannerSub: {
    color: '#7A8E7E',
    fontSize: 10,
    fontWeight: '600',
  },
  trendingBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingGamepadImg: {
    width: 60,
    height: 36,
  },

  // 11. BOTTOM FLOATING DOCK NAVIGATION
  bottomNavDock: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 12,
    left: 14,
    right: 14,
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: 'rgba(10, 16, 11, 0.95)',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    zIndex: 999,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.85), 0 0 20px rgba(57, 255, 20, 0.15)',
        }
      : {
          elevation: 12,
        }),
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 2,
    position: 'relative',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  navText: {
    color: '#7A8E7E',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  navTextActive: {
    color: '#39FF14',
    fontWeight: '900',
  },
  activePillIndicator: {
    position: 'absolute',
    bottom: -5,
    width: 14,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#39FF14',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 6px #39FF14' } : {}),
  },
});

export default HomeScreen;
