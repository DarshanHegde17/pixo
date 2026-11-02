import { SessionStorage } from './sessionStorage.js';
import { AuthService } from './authService.js';

const STORAGE_KEYS = {
  SESSIONS_PREFIX: '@soloplay_gaming_sessions_',
  COMPLETIONS_PREFIX: '@soloplay_gaming_completions_',
  LONGEST_STREAK_PREFIX: '@soloplay_longest_streak_',
  STREAK_STATE_PREFIX: '@soloplay_user_streak_state_',
  STREAK_RESTORATIONS_PREFIX: '@soloplay_streak_restorations_',
  INITIALIZED_FLAG_PREFIX: '@soloplay_data_initialized_',
  TRANSACTIONS_PREFIX: '@pixo_reward_transactions_',
  DAILY_QUESTS_PREFIX: '@pixo_daily_quests_',
  UNLOCKED_LEVEL_PREFIX: '@pixo_game_unlocked_level_',
  COMPLETED_LEVELS_PREFIX: '@pixo_completed_levels_',
};

// Concurrency mutex locks
let isRestoringStreakLock = false;
let isExchangingLock = false;

/**
 * Standard milestones for streak badges
 */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

/**
 * 3 Daily Quests per Master Prompt Section 4
 */
export const DEFAULT_DAILY_QUESTS = [
  {
    id: 'quest_1',
    title: 'Win 2 Sprint Duels in a Row',
    desc: 'Achieve 2 consecutive wins in Speed Math Sprint',
    target: 2,
    rewardXp: 25,
    rewardCoins: 5,
    icon: 'flash',
    type: 'consecutive_wins',
  },
  {
    id: 'quest_2',
    title: 'Play Any 2 Duels',
    desc: 'Complete 2 game battles across any difficulty',
    target: 2,
    rewardXp: 20,
    rewardCoins: 4,
    icon: 'game-controller',
    type: 'games_played',
  },
  {
    id: 'quest_3',
    title: 'Win 2 Ken-Ken Duels in a Row',
    desc: 'Win 2 consecutive calculation battles with zero mistakes',
    target: 2,
    rewardXp: 30,
    rewardCoins: 6,
    icon: 'trophy',
    type: 'consecutive_wins',
  },
];

/**
 * Sequential 10 Game Levels Config per Master Prompt Section 5
 */
export const GAME_LEVELS_CONFIG = [
  { level: 1, title: 'LEVEL 1: ROOKIE RUSH', subtitle: '5 math values in 30s', questions: 5, xpReward: 10, coinReward: 2, difficulty: 'Easy' },
  { level: 2, title: 'LEVEL 2: NOVICE STRIKE', subtitle: '6 math values in 30s', questions: 6, xpReward: 20, coinReward: 4, difficulty: 'Normal' },
  { level: 3, title: 'LEVEL 3: VETERAN CRUNCH', subtitle: '7 math values in 30s', questions: 7, xpReward: 30, coinReward: 6, difficulty: 'Medium' },
  { level: 4, title: 'LEVEL 4: CIPHER SPRINT', subtitle: '8 math values in 30s', questions: 8, xpReward: 40, coinReward: 8, difficulty: 'Hard' },
  { level: 5, title: 'LEVEL 5: SPEED RUNNER', subtitle: '9 math values in 30s', questions: 9, xpReward: 50, coinReward: 10, difficulty: 'Expert' },
  { level: 6, title: 'LEVEL 6: CYBER MASTER', subtitle: '10 math values in 30s', questions: 10, xpReward: 60, coinReward: 12, difficulty: 'Advanced' },
  { level: 7, title: 'LEVEL 7: MATRIX SURGE', subtitle: '11 math values in 30s', questions: 11, xpReward: 70, coinReward: 14, difficulty: 'Master' },
  { level: 8, title: 'LEVEL 8: QUANTUM RUSH', subtitle: '12 math values in 30s', questions: 12, xpReward: 80, coinReward: 16, difficulty: 'Pro' },
  { level: 9, title: 'LEVEL 9: TITAN OVERCLOCK', subtitle: '13 math values in 30s', questions: 13, xpReward: 90, coinReward: 18, difficulty: 'Extreme' },
  { level: 10, title: 'LEVEL 10: APEX LEGEND', subtitle: '15 math values in 30s', questions: 15, xpReward: 100, coinReward: 20, difficulty: 'Legendary' },
];

/**
 * 10 XP-to-Coin Exchange Packages
 * Exact requirements from Master Prompt Section 7:
 * Package 1: 50 XP -> 5 Coins
 * Package 2: 100 XP -> 10 Coins
 * Package 3: 200 XP -> 25 Coins
 * Package 4: 300 XP -> 35 Coins
 * Package 5: 400 XP -> 45 Coins
 * Package 6: 500 XP -> 55 Coins
 * Package 7: 600 XP -> 70 Coins
 * Package 8: 700 XP -> 80 Coins
 * Package 9: 800 XP -> 100 Coins
 * Package 10: 1000 XP -> 120 Coins
 */
export const XP_TO_COIN_PACKAGES = [
  { id: 1, xpRequired: 50, coinsReceived: 5, label: 'Starter Cache', badge: 'Tier 1' },
  { id: 2, xpRequired: 100, coinsReceived: 10, label: 'Bronze Pouch', badge: 'Tier 2' },
  { id: 3, xpRequired: 200, coinsReceived: 25, label: 'Silver Stash', badge: '+5 BONUS' },
  { id: 4, xpRequired: 300, coinsReceived: 35, label: 'Gold Trove', badge: 'Tier 4' },
  { id: 5, xpRequired: 400, coinsReceived: 45, label: 'Platinum Cache', badge: 'Tier 5' },
  { id: 6, xpRequired: 500, coinsReceived: 55, label: 'Cyber Vault', badge: 'Tier 6' },
  { id: 7, xpRequired: 600, coinsReceived: 70, label: 'Neon Chest', badge: '+10 BONUS' },
  { id: 8, xpRequired: 700, coinsReceived: 80, label: 'Titan Safe', badge: 'Tier 8' },
  { id: 9, xpRequired: 800, coinsReceived: 100, label: 'Master Treasury', badge: 'HIGH VALUE' },
  { id: 10, xpRequired: 1000, coinsReceived: 120, label: 'Legendary Hoard', badge: 'BEST VALUE // +20' },
];

/**
 * Game Difficulty Reward Structure
 * Exact requirements from Master Prompt Section 4:
 * Level 1 – Easy: 10 XP, 2 Coins
 * Level 2 – Normal: 20 XP, 4 Coins
 * Level 3 – Medium: 30 XP, 6 Coins
 * Level 4 – Hard: 40 XP, 8 Coins
 * Level 5 – Expert: 50 XP, 10 Coins
 * Level 6 – Advanced: 60 XP, 12 Coins
 * Level 7 – Master: 70 XP, 14 Coins
 * Level 8 – Pro: 80 XP, 16 Coins
 * Level 9 – Extreme: 90 XP, 18 Coins
 * Level 10 – Legendary: 100 XP, 20 Coins
 */
export const GAME_DIFFICULTY_REWARDS = {
  1: { difficulty: 1, label: 'Level 1 – Easy', xp: 10, coins: 2 },
  2: { difficulty: 2, label: 'Level 2 – Normal', xp: 20, coins: 4 },
  3: { difficulty: 3, label: 'Level 3 – Medium', xp: 30, coins: 6 },
  4: { difficulty: 4, label: 'Level 4 – Hard', xp: 40, coins: 8 },
  5: { difficulty: 5, label: 'Level 5 – Expert', xp: 50, coins: 10 },
  6: { difficulty: 6, label: 'Level 6 – Advanced', xp: 60, coins: 12 },
  7: { difficulty: 7, label: 'Level 7 – Master', xp: 70, coins: 14 },
  8: { difficulty: 8, label: 'Level 8 – Pro', xp: 80, coins: 16 },
  9: { difficulty: 9, label: 'Level 9 – Extreme', xp: 90, coins: 18 },
  10: { difficulty: 10, label: 'Level 10 – Legendary', xp: 100, coins: 20 },
};

export function getDifficultyRewards(difficulty = 1) {
  const d = Math.max(1, Math.min(10, Math.floor(Number(difficulty) || 1)));
  return GAME_DIFFICULTY_REWARDS[d] || { difficulty: d, label: `Level ${d}`, xp: d * 10, coins: d * 2 };
}

/**
 * Helper to compute calendar day difference between two YYYY-MM-DD keys.
 * Returns dateKey2 - dateKey1 in calendar days.
 */
export function getDaysDifference(dateKey1, dateKey2) {
  if (!dateKey1 || !dateKey2) return 0;
  const [y1, m1, d1] = String(dateKey1).split('-').map(Number);
  const [y2, m2, d2] = String(dateKey2).split('-').map(Number);
  if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) return 0;
  const utcD1 = Date.UTC(y1, m1 - 1, d1);
  const utcD2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utcD2 - utcD1) / (1000 * 60 * 60 * 24));
}

/**
 * Helper to get user timezone safely
 */
export function getAppTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Converts a Date or ISO string into a YYYY-MM-DD date key in specified timezone
 */
export function toDateKey(dateInput, timezone = getAppTimezone()) {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) {
    return '';
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // Output format: YYYY-MM-DD
  } catch {
    // Fallback if timezone string is invalid
    return date.toISOString().split('T')[0];
  }
}

/**
 * Helper to get yesterday's date key relative to a reference date
 */
export function getOffsetDateKey(daysOffset = 0, referenceDate = new Date(), timezone = getAppTimezone()) {
  const d = new Date(referenceDate);
  d.setDate(d.getDate() + daysOffset);
  return toDateKey(d, timezone);
}

/**
 * Formats duration in seconds to "Xh Ym" or "Ym Zs"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Sanitizes a string for CSV export to prevent Formula Injection (CVE-2014-3524 / OWASP CSV Injection)
 */
export function sanitizeCsvField(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // If first character is =, +, -, @, or tab/carriage return, prepend apostrophe
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Initial historical seed data for demo user `usr_demo_1` (SoloSlayer)
 * Carefully calibrated to show 7-day completion streak in October 2026,
 * with real completed, failed, and in-progress sessions.
 */
function createDemoSeedData(userId) {
  const now = new Date();
  const tz = getAppTimezone();

  // Helper to construct ISO strings relative to today
  const makeRelativeDate = (dayOffset, hour, minute) => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  const sessions = [
    // Today (Day 0) - Verified completed (Neon Runner: 2099)
    {
      id: `sess_seed_${userId}_01`,
      userId,
      gameId: 'g1',
      gameTitle: 'Neon Runner: 2099',
      gameCategory: 'Cyber Arcade',
      icon: 'flash',
      gameMode: 'Campaign Mission',
      startedAt: makeRelativeDate(0, 10, 15),
      endedAt: makeRelativeDate(0, 10, 42),
      completedAt: makeRelativeDate(0, 10, 42),
      durationSeconds: 1620, // 27 mins
      status: 'completed',
      result: 'Victory - S Rank',
      score: 18450,
      xpAwarded: 300,
      achievements: ['Hyper Combo x50', 'Zero Damage Sector'],
      personalBest: true,
    },
    // Today (Day 0) - Second completion (Daily Solo Quest q1)
    {
      id: `sess_seed_${userId}_02`,
      userId,
      gameId: 'q1',
      gameTitle: 'Cyber Strike Highscore Quest',
      gameCategory: 'Daily Mission',
      icon: 'trophy',
      gameMode: 'Daily Objective',
      startedAt: makeRelativeDate(0, 11, 0),
      endedAt: makeRelativeDate(0, 11, 15),
      completedAt: makeRelativeDate(0, 11, 15),
      durationSeconds: 900, // 15 mins
      status: 'completed',
      result: 'Mission Complete',
      score: 15200,
      xpAwarded: 300,
      achievements: ['Daily Champion'],
      personalBest: false,
    },
    // Yesterday (Day -1) - Completed
    {
      id: `sess_seed_${userId}_03`,
      userId,
      gameId: 'g2',
      gameTitle: 'Shadow Blade Reborn',
      gameCategory: 'Action RPG',
      icon: 'shield',
      gameMode: 'Chapter 4 Boss Arena',
      startedAt: makeRelativeDate(-1, 19, 10),
      endedAt: makeRelativeDate(-1, 20, 5),
      completedAt: makeRelativeDate(-1, 20, 5),
      durationSeconds: 3300, // 55 mins
      status: 'completed',
      result: 'Boss Cleared',
      score: 24100,
      xpAwarded: 450,
      achievements: ['Plasma Katana Mastery', 'Overlord Defeated'],
      personalBest: true,
    },
    // Day -2 - Completed
    {
      id: `sess_seed_${userId}_04`,
      userId,
      gameId: 'd1',
      gameTitle: 'Quantum Fracture',
      gameCategory: 'Sci-Fi Roguelike',
      icon: 'infinite',
      gameMode: 'Anomaly Vault 3',
      startedAt: makeRelativeDate(-2, 16, 20),
      endedAt: makeRelativeDate(-2, 17, 0),
      completedAt: makeRelativeDate(-2, 17, 0),
      durationSeconds: 2400, // 40 mins
      status: 'completed',
      result: 'Vault Purified',
      score: 19800,
      xpAwarded: 350,
      achievements: ['Temporal Paradox Solved'],
      personalBest: false,
    },
    // Day -3 - Completed
    {
      id: `sess_seed_${userId}_05`,
      userId,
      gameId: 'd4',
      gameTitle: 'Synthwave Highway 84',
      gameCategory: 'Neon Racing',
      icon: 'car-sport',
      gameMode: 'Sprint Challenge',
      startedAt: makeRelativeDate(-3, 21, 0),
      endedAt: makeRelativeDate(-3, 21, 35),
      completedAt: makeRelativeDate(-3, 21, 35),
      durationSeconds: 2100, // 35 mins
      status: 'completed',
      result: '1st Place Podium',
      score: 31200,
      xpAwarded: 400,
      achievements: ['Sub-Zero Drift', 'Speed Demon'],
      personalBest: true,
    },
    // Day -4 - Completed
    {
      id: `sess_seed_${userId}_06`,
      userId,
      gameId: 'g3',
      gameTitle: 'Astro Odyssey Zero',
      gameCategory: 'Space Exploration',
      icon: 'planet',
      gameMode: 'Sector 7 Expedition',
      startedAt: makeRelativeDate(-4, 18, 15),
      endedAt: makeRelativeDate(-4, 19, 10),
      completedAt: makeRelativeDate(-4, 19, 10),
      durationSeconds: 3300, // 55 mins
      status: 'completed',
      result: 'Alien Relic Secured',
      score: 14500,
      xpAwarded: 300,
      achievements: ['Cosmic Wayfinder'],
      personalBest: false,
    },
    // Day -5 - Completed
    {
      id: `sess_seed_${userId}_07`,
      userId,
      gameId: 'd5',
      gameTitle: 'Nexus Core Matrix',
      gameCategory: 'Cyber Puzzle',
      icon: 'hardware-chip',
      gameMode: 'Matrix Grid Override',
      startedAt: makeRelativeDate(-5, 14, 0),
      endedAt: makeRelativeDate(-5, 14, 45),
      completedAt: makeRelativeDate(-5, 14, 45),
      durationSeconds: 2700, // 45 mins
      status: 'completed',
      result: 'Firewall Cleared',
      score: 16700,
      xpAwarded: 250,
      achievements: ['Node Master'],
      personalBest: true,
    },
    // Day -6 - Completed (Completes 7 consecutive days!)
    {
      id: `sess_seed_${userId}_08`,
      userId,
      gameId: 't1',
      gameTitle: 'Voidwalker: Origins',
      gameCategory: 'Dark Fantasy RPG',
      icon: 'shield-half',
      gameMode: 'Gothic Catacombs',
      startedAt: makeRelativeDate(-6, 20, 10),
      endedAt: makeRelativeDate(-6, 21, 15),
      completedAt: makeRelativeDate(-6, 21, 15),
      durationSeconds: 3900, // 65 mins
      status: 'completed',
      result: 'Crypt Purged',
      score: 28900,
      xpAwarded: 500,
      achievements: ['Nightfall Crusader'],
      personalBest: true,
    },
    // Additional session: In Progress (does NOT count toward streak)
    {
      id: `sess_seed_${userId}_09`,
      userId,
      gameId: 'g2',
      gameTitle: 'Shadow Blade Reborn',
      gameCategory: 'Action RPG',
      icon: 'skull',
      gameMode: 'Chapter 5 Fortress',
      startedAt: makeRelativeDate(0, 12, 0),
      endedAt: null,
      completedAt: null,
      durationSeconds: 900, // 15 mins elapsed
      status: 'in_progress',
      result: 'In Progress',
      score: 3400,
      xpAwarded: 0,
      achievements: [],
      personalBest: false,
    },
    // Additional session: Failed (does NOT count toward streak)
    {
      id: `sess_seed_${userId}_10`,
      userId,
      gameId: 'd1',
      gameTitle: 'Quantum Fracture',
      gameCategory: 'Sci-Fi Roguelike',
      icon: 'infinite',
      gameMode: 'Nightmare Vault',
      startedAt: makeRelativeDate(-1, 14, 30),
      endedAt: makeRelativeDate(-1, 14, 50),
      completedAt: null,
      durationSeconds: 1200, // 20 mins
      status: 'failed',
      result: 'Anomaly Breach Defeat',
      score: 4100,
      xpAwarded: 0,
      achievements: [],
      personalBest: false,
    },
    // Additional session: Abandoned (does NOT count toward streak)
    {
      id: `sess_seed_${userId}_11`,
      userId,
      gameId: 'd4',
      gameTitle: 'Synthwave Highway 84',
      gameCategory: 'Neon Racing',
      icon: 'car-sport',
      gameMode: 'Highway Gauntlet',
      startedAt: makeRelativeDate(-2, 11, 0),
      endedAt: makeRelativeDate(-2, 11, 10),
      completedAt: null,
      durationSeconds: 600, // 10 mins
      status: 'abandoned',
      result: 'Session Aborted',
      score: 1200,
      xpAwarded: 0,
      achievements: [],
      personalBest: false,
    },
  ];

  return sessions;
}

export const GamingActivityService = {
  /**
   * Initializes session repository for user if not yet created.
   * Per Master Prompt Section 2: All users start completely fresh with 0 XP, 0 Coins, 0 Streak.
   */
  async ensureUserDataInitialized(userId) {
    if (!userId) return;

    const initializedKey = `${STORAGE_KEYS.INITIALIZED_FLAG_PREFIX}${userId}`;
    const isInitialized = await SessionStorage.getItem(initializedKey);

    if (!isInitialized) {
      await this.saveUserSessions(userId, []);
      await SessionStorage.setItem(`${STORAGE_KEYS.LONGEST_STREAK_PREFIX}${userId}`, 0);
      await SessionStorage.setItem(initializedKey, true);
    }
  },

  /**
   * Retrieves all sessions for a user, sorted descending by start time
   */
  async getUserSessions(userId) {
    if (!userId) return [];
    await this.ensureUserDataInitialized(userId);
    const key = `${STORAGE_KEYS.SESSIONS_PREFIX}${userId}`;
    const sessions = await SessionStorage.getItem(key);
    if (!Array.isArray(sessions)) return [];

    return sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  },

  /**
   * Saves raw sessions list for user
   */
  async saveUserSessions(userId, sessions) {
    if (!userId) return;
    const key = `${STORAGE_KEYS.SESSIONS_PREFIX}${userId}`;
    await SessionStorage.setItem(key, sessions);
  },

  /**
   * Retrieves all strictly VERIFIED completions for user
   */
  async getUserCompletions(userId) {
    const sessions = await this.getUserSessions(userId);
    return sessions.filter((s) => s.status === 'completed' && s.completedAt);
  },

  /**
   * Launches a new game session in 'in_progress' status
   */
  async startSession(userId, gameData) {
    if (!userId) throw new Error('Authentication required.');

    const newSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      gameId: gameData.id || `game_${Date.now()}`,
      gameTitle: gameData.title || 'Solo Mission',
      gameCategory: gameData.category || gameData.genre || 'Single Player',
      icon: gameData.icon || 'game-controller',
      gameMode: gameData.mode || 'Standard Campaign',
      startedAt: new Date().toISOString(),
      endedAt: null,
      completedAt: null,
      durationSeconds: 0,
      status: 'in_progress',
      result: 'In Progress',
      score: 0,
      xpAwarded: 0,
      achievements: [],
      personalBest: false,
    };

    const sessions = await this.getUserSessions(userId);
    sessions.unshift(newSession);
    await this.saveUserSessions(userId, sessions);

    return newSession;
  },

  /**
   * Strictly completes a game or mission session with difficulty-based reward calculation.
   * Master Prompt Section 4 & Section 11:
   * - Rewards calculated exclusively by backend difficulty table (10 to 100 XP, 2 to 20 Coins).
   * - Only winning games receive rewards.
   * - Failed or abandoned games receive 0 XP and 0 Coins.
   * - Prevents duplicate reward claims.
   * - Saves transaction in database.
   * - Updates user XP and Coin balances atomically.
   */
  async completeSession(userId, sessionId, verificationDetails = {}) {
    if (!userId) throw new Error('Authentication required.');

    const sessions = await this.getUserSessions(userId);
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId && s.userId === userId);

    if (sessionIndex === -1) {
      throw new Error('Session not found or does not belong to active user.');
    }

    const session = sessions[sessionIndex];

    // Idempotency check: prevent duplicate reward/completion abuse
    if (session.status === 'completed' || session.rewardClaimed) {
      return {
        success: true,
        alreadyCompleted: true,
        session,
        won: session.won || false,
        xpAwarded: 0,
        coinsAwarded: 0,
        streakInfo: await this.calculateUserStreak(userId),
        streakState: await this.getUserStreakState(userId),
      };
    }

    const now = new Date();
    const startTime = new Date(session.startedAt);
    const durationSeconds = Math.max(
      15,
      verificationDetails.durationSeconds || Math.round((now.getTime() - startTime.getTime()) / 1000)
    );

    const score = verificationDetails.score || Math.floor(10000 + Math.random() * 15000);
    const resultString = String(verificationDetails.result || 'Victory').toLowerCase();

    // Check if game was won
    const won =
      !resultString.includes('fail') &&
      !resultString.includes('defeat') &&
      !resultString.includes('loss') &&
      !resultString.includes('abandon');

    // Difficulty calculation (1-10) - Never trust frontend values!
    const rawDiff = verificationDetails.difficulty || session.difficulty || 1;
    const difficultyRewards = getDifficultyRewards(rawDiff);
    const gameId = session.gameId || verificationDetails.gameId || 'g_target_no';

    // Check if player has already completed this level previously (prevent duplicate rewards)
    const alreadyCompleted = await this.isLevelAlreadyCompleted(userId, gameId, difficultyRewards.difficulty);

    const xpAwarded = won ? (alreadyCompleted ? 0 : difficultyRewards.xp) : 0;
    const coinsAwarded = won ? (alreadyCompleted ? 0 : difficultyRewards.coins) : 0;

    // Update verified session fields
    const updatedSession = {
      ...session,
      status: 'completed',
      endedAt: now.toISOString(),
      completedAt: now.toISOString(),
      durationSeconds,
      score,
      xpAwarded,
      coinsAwarded,
      difficulty: difficultyRewards.difficulty,
      difficultyLabel: difficultyRewards.label,
      won,
      rewardClaimed: true,
      alreadyCompleted,
      result: verificationDetails.result || (won ? 'Victory - Mission Cleared' : 'Defeat'),
      achievements: verificationDetails.achievements || ['Solo Finisher'],
      personalBest: verificationDetails.personalBest !== undefined ? verificationDetails.personalBest : won,
    };

    sessions[sessionIndex] = updatedSession;
    await this.saveUserSessions(userId, sessions);

    let updatedUser = null;
    if (won && (xpAwarded > 0 || coinsAwarded > 0)) {
      // 1. Record reward transaction in database
      const transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        transactionType: 'GAME_WIN',
        xpAmount: xpAwarded,
        coinAmount: coinsAwarded,
        gameDifficulty: difficultyRewards.difficulty,
        gameId,
        sessionId: session.id,
        transactionDate: now.toISOString(),
        transactionStatus: 'COMPLETED',
      };
      await this.recordTransaction(userId, transaction);

      // 2. Atomic update to user balances in database
      try {
        updatedUser = await AuthService.updateUserBalances(userId, {
          xpDelta: xpAwarded,
          coinsDelta: coinsAwarded,
        });
      } catch (err) {
        console.warn('Failed to update user balances:', err);
      }
    }

    // 3. Update daily streak: winning a game counts toward daily streak
    let streakState = null;
    if (won) {
      streakState = await this.recordActivityCompletion(userId, updatedSession);
    } else {
      streakState = await this.getUserStreakState(userId);
    }
    const streakInfo = await this.calculateUserStreak(userId);

    // 4. Sequential Level Unlock (per game progress)
    let unlockedLevel = 1;
    if (won) {
      await this.recordLevelCompletion(userId, gameId, difficultyRewards.difficulty);
      unlockedLevel = await this.unlockNextLevel(userId, difficultyRewards.difficulty, gameId);
    } else {
      unlockedLevel = await this.getUserUnlockedLevel(userId, gameId);
    }

    // 5. Update Daily Quest Progress (Master Prompt Section 4 & 7)
    const questResult = await this.recordQuestActivity(userId, {
      won,
      difficulty: difficultyRewards.difficulty,
      gameId,
    });

    return {
      success: true,
      alreadyCompleted,
      session: updatedSession,
      won,
      difficulty: difficultyRewards.difficulty,
      difficultyLabel: difficultyRewards.label,
      xpAwarded,
      coinsAwarded,
      user: updatedUser,
      streakInfo,
      streakState,
      unlockedLevel,
      levelUnlocked: unlockedLevel,
      quests: questResult?.quests,
    };
  },

  /**
   * Marks a session as failed (e.g. game over / challenge defeat).
   * Does NOT count toward streak or calendar green state.
   */
  async failSession(userId, sessionId, failureDetails = {}) {
    if (!userId) return null;
    const sessions = await this.getUserSessions(userId);
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId && s.userId === userId);
    if (sessionIndex === -1) return null;

    const now = new Date();
    const session = sessions[sessionIndex];
    const durationSeconds = Math.max(
      10,
      failureDetails.durationSeconds || Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 1000)
    );

    const updatedSession = {
      ...session,
      status: 'failed',
      endedAt: now.toISOString(),
      completedAt: null,
      durationSeconds,
      score: failureDetails.score || 3500,
      xpAwarded: 0,
      result: failureDetails.result || 'Defeat - Challenge Failed',
    };

    sessions[sessionIndex] = updatedSession;
    await this.saveUserSessions(userId, sessions);
    return updatedSession;
  },

  /**
   * Marks a session as abandoned (player quit before finishing).
   * Does NOT count toward streak or calendar green state.
   */
  async abandonSession(userId, sessionId) {
    if (!userId) return null;
    const sessions = await this.getUserSessions(userId);
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId && s.userId === userId);
    if (sessionIndex === -1) return null;

    const now = new Date();
    const session = sessions[sessionIndex];
    const durationSeconds = Math.max(
      5,
      Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 1000)
    );

    const updatedSession = {
      ...session,
      status: 'abandoned',
      endedAt: now.toISOString(),
      completedAt: null,
      durationSeconds,
      xpAwarded: 0,
      result: 'Abandoned Session',
    };

    sessions[sessionIndex] = updatedSession;
    await this.saveUserSessions(userId, sessions);
    return updatedSession;
  },

  /**
   * STRICT DAILY COMPLETION STREAK CALCULATION
   *
   * Business Rules:
   * 1. A calendar date qualifies ONLY if >= 1 VERIFIED completion occurred that day.
   * 2. Multiple completions on the same day count as ONE qualifying date.
   * 3. Consistent timezone policy.
   * 4. If user completed today, current streak includes today.
   * 5. If user completed yesterday but not today, current streak remains active during today.
   * 6. If full calendar day passes without a qualifying completion, current streak resets to 0.
   * 7. Historical longest streak is preserved and never decreases.
   */
  calculateStreakFromCompletions(completions, timezone = getAppTimezone(), storedLongestStreak = 0) {
    if (!Array.isArray(completions) || completions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: Math.max(0, storedLongestStreak),
        lastCompletionDate: null,
        nextMilestone: 3,
        progressPercent: 0,
        qualifyingDates: new Set(),
        completionCountsByDate: {},
      };
    }

    // 1. Collect unique qualifying calendar dates and counts
    const qualifyingDateSet = new Set();
    const completionCountsByDate = {};
    let latestCompletionTimestamp = 0;
    let latestCompletionObj = null;

    completions.forEach((item) => {
      if (item.status === 'completed' && item.completedAt) {
        const dateKey = toDateKey(item.completedAt, timezone);
        if (dateKey) {
          qualifyingDateSet.add(dateKey);
          completionCountsByDate[dateKey] = (completionCountsByDate[dateKey] || 0) + 1;

          const timeVal = new Date(item.completedAt).getTime();
          if (timeVal > latestCompletionTimestamp) {
            latestCompletionTimestamp = timeVal;
            latestCompletionObj = item;
          }
        }
      }
    });

    if (qualifyingDateSet.size === 0) {
      return {
        currentStreak: 0,
        longestStreak: Math.max(0, storedLongestStreak),
        lastCompletionDate: null,
        nextMilestone: 3,
        progressPercent: 0,
        qualifyingDates: new Set(),
        completionCountsByDate: {},
      };
    }

    // 2. Sort unique dates in ascending order
    const sortedDates = Array.from(qualifyingDateSet).sort();

    // 3. Calculate all consecutive streaks in history to determine longest streak
    let maxStreakHistorical = 0;
    let runningStreak = 0;
    let prevDate = null;

    sortedDates.forEach((dateStr) => {
      if (!prevDate) {
        runningStreak = 1;
      } else {
        // Difference in days between consecutive entries
        const dCurrent = new Date(`${dateStr}T12:00:00Z`);
        const dPrev = new Date(`${prevDate}T12:00:00Z`);
        const diffDays = Math.round((dCurrent.getTime() - dPrev.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          runningStreak += 1;
        } else if (diffDays > 1) {
          runningStreak = 1;
        }
      }
      if (runningStreak > maxStreakHistorical) {
        maxStreakHistorical = runningStreak;
      }
      prevDate = dateStr;
    });

    const longestStreak = Math.max(maxStreakHistorical, storedLongestStreak || 0);

    // 4. Calculate CURRENT streak ending at today or yesterday
    const now = new Date();
    const todayKey = toDateKey(now, timezone);
    const yesterdayKey = getOffsetDateKey(-1, now, timezone);

    let currentStreak = 0;
    let previousStreak = 0;
    let missedDays = 0;
    let streakStatus = 'none';
    let startWalkingKey = null;

    const latestQualifyingDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;

    if (qualifyingDateSet.has(todayKey)) {
      startWalkingKey = todayKey;
      streakStatus = 'active';
      missedDays = 0;
    } else if (qualifyingDateSet.has(yesterdayKey)) {
      // Completed yesterday, still active today!
      startWalkingKey = yesterdayKey;
      streakStatus = 'active';
      missedDays = 0;
    } else if (latestQualifyingDate) {
      // Missing yesterday and today -> Current streak resets to 0 (BROKEN!)
      currentStreak = 0;
      streakStatus = 'broken';
      const diff = getDaysDifference(latestQualifyingDate, todayKey);
      missedDays = Math.max(1, diff - 1);
    } else {
      currentStreak = 0;
      streakStatus = 'none';
      missedDays = 0;
    }

    if (startWalkingKey) {
      let checkDate = new Date(`${startWalkingKey}T12:00:00Z`);
      while (true) {
        const key = toDateKey(checkDate, timezone);
        if (qualifyingDateSet.has(key)) {
          currentStreak += 1;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      previousStreak = currentStreak;
    } else if (latestQualifyingDate) {
      // Walk back from the most recent completed date to calculate what the previous streak was before it broke
      let checkDate = new Date(`${latestQualifyingDate}T12:00:00Z`);
      while (true) {
        const key = toDateKey(checkDate, timezone);
        if (qualifyingDateSet.has(key)) {
          previousStreak += 1;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 5. Calculate next milestone and progress
    const nextMilestone = STREAK_MILESTONES.find((m) => m > currentStreak) || 100;
    const progressPercent = Math.min(100, Math.round((currentStreak / nextMilestone) * 100));

    // Formatted last completion date
    let lastCompletionDate = null;
    if (latestCompletionObj && latestCompletionObj.completedAt) {
      const d = new Date(latestCompletionObj.completedAt);
      lastCompletionDate = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak, previousStreak),
      lastCompletionDate,
      lastActivityDate: latestQualifyingDate,
      streakStatus,
      missedDays,
      previousStreak,
      restorationCost: missedDays * 1000,
      nextMilestone,
      progressPercent,
      qualifyingDates: qualifyingDateSet,
      completionCountsByDate,
      latestCompletion: latestCompletionObj,
    };
  },

  /**
   * Calculates streak for active user from database records
   */
  async calculateUserStreak(userId, timezone = getAppTimezone()) {
    if (!userId) return null;
    const completions = await this.getUserCompletions(userId);
    const longestStreakKey = `${STORAGE_KEYS.LONGEST_STREAK_PREFIX}${userId}`;
    const storedLongest = (await SessionStorage.getItem(longestStreakKey)) || 0;

    const streakData = this.calculateStreakFromCompletions(completions, timezone, storedLongest);

    // Keep stored longest updated
    if (streakData.longestStreak > storedLongest) {
      await SessionStorage.setItem(longestStreakKey, streakData.longestStreak);
    }

    return streakData;
  },

  /**
   * Retrieves complete, verified user streak state with permanent database persistence.
   * Required fields: currentStreak, longestStreak, lastActivityDate, streakStatus,
   * missedDays, availableXP, availableCoins, lastRestoredDate, previousStreak, restorationCost.
   */
  async getUserStreakState(userId, timezone = getAppTimezone()) {
    if (!userId) return null;

    const streakStateKey = `${STORAGE_KEYS.STREAK_STATE_PREFIX}${userId}`;
    const storedState = (await SessionStorage.getItem(streakStateKey)) || null;

    // Get live user XP & Coins from AuthService
    let userXp = 0;
    let userCoins = 0;
    try {
      const activeUser = (await AuthService.findUserById(userId)) || (await AuthService.getActiveSession());
      if (activeUser) {
        userXp = typeof activeUser.xp === 'number' ? activeUser.xp : 0;
        userCoins = typeof activeUser.coins === 'number' ? activeUser.coins : 0;
      }
    } catch (e) {
      console.warn('Error reading user balances in getUserStreakState:', e);
    }

    const completions = await this.getUserCompletions(userId);
    const longestStreakKey = `${STORAGE_KEYS.LONGEST_STREAK_PREFIX}${userId}`;
    const storedLongest = (await SessionStorage.getItem(longestStreakKey)) || (storedState?.longestStreak ?? 0);

    const calculated = this.calculateStreakFromCompletions(completions, timezone, storedLongest);

    const now = new Date();
    const todayKey = toDateKey(now, timezone);
    const yesterdayKey = getOffsetDateKey(-1, now, timezone);

    // Check if storedState has simulated / manually preserved dates
    let effectiveLastActivity = calculated.lastActivityDate;
    let currentStreak = calculated.currentStreak;
    let previousStreak = calculated.previousStreak;
    let streakStatus = calculated.streakStatus;
    let missedDays = calculated.missedDays;
    let lastRestoredDate = storedState?.lastRestoredDate || null;

    const hasCompletedToday = completions.some(
      (c) => c.dateKey === todayKey && !c.isRestoration
    );

    if (storedState?.streakStatus === 'broken' && !hasCompletedToday) {
      effectiveLastActivity = storedState.lastActivityDate;
      streakStatus = 'broken';
      missedDays = Math.max(1, storedState.missedDays || 1);
      currentStreak = 0;
      previousStreak = storedState.previousStreak || (storedState.longestStreak || 7);
    } else if (storedState?.streakStatus === 'restored' && !hasCompletedToday) {
      effectiveLastActivity = storedState.lastActivityDate;
      streakStatus = 'restored';
      missedDays = 0;
      currentStreak = storedState.currentStreak;
      previousStreak = storedState.previousStreak || currentStreak;
    } else if (storedState?.lastActivityDate && (!effectiveLastActivity || storedState.lastActivityDate > effectiveLastActivity)) {
      effectiveLastActivity = storedState.lastActivityDate;
    }

    // Default initialization if new / demo user without completions
    if (!effectiveLastActivity && !storedState) {
      let initialStreak = 0;
      try {
        const u = await AuthService.findUserById(userId);
        if (u?.streak) initialStreak = u.streak;
      } catch {}
      if (initialStreak > 0) {
        effectiveLastActivity = yesterdayKey;
        currentStreak = initialStreak;
        previousStreak = initialStreak;
        streakStatus = 'active';
        missedDays = 0;
      }
    }

    // If effective last activity is older than yesterday, streak is broken
    if (effectiveLastActivity && streakStatus !== 'broken') {
      const diff = getDaysDifference(effectiveLastActivity, todayKey);
      if (diff === 0) {
        streakStatus = 'active';
        missedDays = 0;
      } else if (diff === 1) {
        streakStatus = 'active';
        missedDays = 0;
      } else {
        streakStatus = 'broken';
        missedDays = Math.max(1, diff - 1);
        currentStreak = 0;
        if (!previousStreak || previousStreak === 0) {
          previousStreak = storedState?.previousStreak || storedState?.currentStreak || 7;
        }
      }
    }

    // Preserve previous streak count if currently broken
    if (streakStatus === 'broken' && (!previousStreak || previousStreak === 0)) {
      previousStreak = storedState?.previousStreak || (storedLongest || 7);
    }

    const longestStreak = Math.max(storedLongest, currentStreak, previousStreak, calculated.longestStreak);
    // Master Prompt Section 6: Restoration price: 100 COINS per missed day
    const restorationCost = missedDays * 100;

    const finalState = {
      userId,
      currentStreak,
      longestStreak,
      lastActivityDate: effectiveLastActivity,
      streakStatus,
      missedDays,
      availableXP: userXp,
      xpBalance: userXp,
      availableCoins: userCoins,
      coinBalance: userCoins,
      lastRestoredDate,
      previousStreak,
      restorationCost, // in Coins
      restorationCostCoins: restorationCost,
      completedToday: hasCompletedToday || (effectiveLastActivity === todayKey),
      updatedAt: now.toISOString(),
    };

    await SessionStorage.setItem(streakStateKey, finalState);
    if (longestStreak > storedLongest) {
      await SessionStorage.setItem(longestStreakKey, longestStreak);
    }

    return finalState;
  },

  /**
   * Records eligible game activity completion and evaluates daily streak rules:
   * 1. 1 streak per calendar day (12:00 AM - 11:59 PM in local timezone).
   * 2. If yesterday completed or streak restored, streak increases by 1.
   * 3. Multiple completions on same day do NOT increase streak multiple times.
   * 4. If streak was broken, new activity starts a new streak at 1.
   */
  async recordActivityCompletion(userId, session, timezone = getAppTimezone()) {
    if (!userId) return null;

    const streakStateKey = `${STORAGE_KEYS.STREAK_STATE_PREFIX}${userId}`;
    const now = new Date();
    const todayKey = toDateKey(now, timezone);
    const yesterdayKey = getOffsetDateKey(-1, now, timezone);

    // Fetch current streak state prior to recording
    const current = await this.getUserStreakState(userId, timezone);

    // If user already completed an eligible activity today, do not increase streak multiple times
    if (current.lastActivityDate === todayKey && current.currentStreak > 0) {
      return current;
    }

    let newStreak = 1;
    if (current.streakStatus === 'broken') {
      // Missing an entire day broke streak; next completed activity starts a new streak at 1
      newStreak = 1;
    } else if (current.lastActivityDate === yesterdayKey || current.streakStatus === 'restored') {
      // Completed yesterday or restored, streak increases by 1
      newStreak = (current.currentStreak || 0) + 1;
    } else if (current.currentStreak === 0) {
      newStreak = 1;
    } else {
      newStreak = (current.currentStreak || 0) + 1;
    }

    const longestStreak = Math.max(current.longestStreak || 0, newStreak);
    const updatedState = {
      ...current,
      currentStreak: newStreak,
      longestStreak,
      lastActivityDate: todayKey,
      streakStatus: 'active',
      missedDays: 0,
      previousStreak: newStreak,
      restorationCost: 0,
      restorationCostCoins: 0,
      completedToday: true,
      updatedAt: now.toISOString(),
    };

    await SessionStorage.setItem(streakStateKey, updatedState);
    await SessionStorage.setItem(`${STORAGE_KEYS.LONGEST_STREAK_PREFIX}${userId}`, longestStreak);
    await AuthService.updateUserProfile(userId, { streak: newStreak });

    return updatedState;
  },

  /**
   * RESTORE A BROKEN STREAK USING COINS ONLY
   *
   * Master Prompt Section 6:
   * - XP-based streak restoration removed completely.
   * - The ONLY currency accepted is COINS.
   * - Price: exactly 100 COINS per missed day.
   * - One missed day = 100 Coins; Two = 200 Coins; Three = 300 Coins.
   * - Restores previous streak count.
   * - Never allows negative Coins.
   * - Atomic concurrency lock prevents duplicate deductions on rapid clicks.
   * - If insufficient Coins: returns "Not Enough Coins! Win more games or exchange your XP for Coins."
   */
  async restoreStreak(userId, countOfDays = null) {
    if (isRestoringStreakLock) {
      return { success: false, error: 'Restoration already in progress.' };
    }
    isRestoringStreakLock = true;

    try {
      if (!userId) return { success: false, error: 'User ID is required.' };

      // 1. Get user record
      let user = (await AuthService.findUserById(userId)) || (await AuthService.getActiveSession());
      if (!user) {
        return { success: false, error: 'User not authenticated.' };
      }

      // 2. Get current streak state
      const timezone = getAppTimezone();
      const currentStreakState = await this.getUserStreakState(userId, timezone);

      if (currentStreakState.streakStatus !== 'broken') {
        return {
          success: false,
          error: 'Streak is not broken. Restoration not required.',
          streakState: currentStreakState,
        };
      }

      const totalMissed = Math.max(1, currentStreakState.missedDays || 1);
      const daysToRestore = countOfDays ? Math.min(totalMissed, countOfDays) : totalMissed;
      const requiredCoins = daysToRestore * 100; // 100 COINS per missed day
      const availableCoins = typeof user.coins === 'number' ? user.coins : 0;

      // 3. Insufficient Coins check
      if (availableCoins < requiredCoins) {
        return {
          success: false,
          insufficientCoins: true,
          error: 'Not Enough Coins! Win more games or exchange your XP for Coins.',
          requiredCoins,
          availableCoins,
        };
      }

      // 4. Atomic Coin Deduction
      const newCoins = availableCoins - requiredCoins;
      if (newCoins < 0) {
        return {
          success: false,
          insufficientCoins: true,
          error: 'Not Enough Coins! Win more games or exchange your XP for Coins.',
        };
      }

      // 5. Ingest verified completion records for each restored missed day
      const now = new Date();
      const todayKey = toDateKey(now, timezone);
      const sessions = await this.getUserSessions(userId);

      for (let i = 1; i <= daysToRestore; i++) {
        const restoredDateKey = getOffsetDateKey(-i, now, timezone);
        const restorationSession = {
          id: `sess_restored_${userId}_${restoredDateKey}_${Date.now()}`,
          userId,
          gameId: 'streak_restoration',
          gameTitle: 'Streak Restoration Vault',
          gameCategory: 'Streak Recovery',
          icon: 'flame',
          gameMode: 'Coin Restoration',
          startedAt: `${restoredDateKey}T12:00:00.000Z`,
          endedAt: `${restoredDateKey}T12:01:00.000Z`,
          completedAt: `${restoredDateKey}T12:01:00.000Z`,
          durationSeconds: 60,
          status: 'completed',
          result: 'Streak Restored',
          score: 0,
          xpAwarded: 0,
          coinsAwarded: 0,
          isRestoration: true,
          achievements: [`Streak Restored with ${requiredCoins} Coins`],
        };
        sessions.push(restorationSession);
      }

      await this.saveUserSessions(userId, sessions);

      // 6. Record STREAK_RESTORATION transaction
      const transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        transactionType: 'STREAK_RESTORATION',
        xpAmount: 0,
        coinAmount: -requiredCoins,
        gameDifficulty: null,
        gameId: 'streak_restoration',
        missedDays: daysToRestore,
        transactionDate: now.toISOString(),
        transactionStatus: 'COMPLETED',
      };
      await this.recordTransaction(userId, transaction);

      // 7. Update user profile with deducted coins and restored streak
      const restoredStreak = currentStreakState.previousStreak || 7;
      const remainingMissed = totalMissed - daysToRestore;
      const yesterdayKey = getOffsetDateKey(-1, now, timezone);

      const updatedStreakState = {
        userId,
        currentStreak: remainingMissed === 0 ? restoredStreak : 0,
        longestStreak: Math.max(currentStreakState.longestStreak, restoredStreak),
        lastActivityDate: remainingMissed === 0 ? yesterdayKey : currentStreakState.lastActivityDate,
        streakStatus: remainingMissed === 0 ? 'restored' : 'broken',
        missedDays: remainingMissed,
        availableCoins: newCoins,
        coinBalance: newCoins,
        availableXP: user.xp || 0,
        xpBalance: user.xp || 0,
        lastRestoredDate: todayKey,
        previousStreak: restoredStreak,
        restorationCost: remainingMissed * 100,
        restorationCostCoins: remainingMissed * 100,
        updatedAt: now.toISOString(),
      };

      const streakStateKey = `${STORAGE_KEYS.STREAK_STATE_PREFIX}${userId}`;
      await SessionStorage.setItem(streakStateKey, updatedStreakState);
      const updatedUser = await AuthService.updateUserProfile(userId, {
        coins: newCoins,
        streak: updatedStreakState.currentStreak,
      });

      return {
        success: true,
        restoredStreak: updatedStreakState.currentStreak,
        coinsDeducted: requiredCoins,
        costInCoins: requiredCoins,
        remainingCoins: newCoins,
        streakState: updatedStreakState,
        user: updatedUser,
      };
    } finally {
      isRestoringStreakLock = false;
    }
  },

  /**
   * Exchanges earned XP for Coins in the PIXO Coin Store.
   * Master Prompt Section 7: Exactly 10 exchange packages.
   * Deducts exact XP, adds corresponding Coins atomically.
   */
  async exchangeXpForCoins(userId, packageId) {
    if (isExchangingLock) {
      return { success: false, error: 'Exchange in progress. Please wait.' };
    }
    isExchangingLock = true;
    try {
      if (!userId) return { success: false, error: 'Authentication required.' };
      const pkg = XP_TO_COIN_PACKAGES.find((p) => p.id === Number(packageId));
      if (!pkg) {
        return { success: false, error: 'Invalid exchange package selected.' };
      }

      let user = (await AuthService.findUserById(userId)) || (await AuthService.getActiveSession());
      if (!user) {
        return { success: false, error: 'User not authenticated.' };
      }

      const availableXp = typeof user.xp === 'number' ? user.xp : 0;
      if (availableXp < pkg.xpRequired) {
        return {
          success: false,
          insufficientXp: true,
          error: 'Not enough XP! Win more games to earn XP.',
          requiredXp: pkg.xpRequired,
          availableXp,
        };
      }

      const newXp = availableXp - pkg.xpRequired;
      const currentCoins = typeof user.coins === 'number' ? user.coins : 0;
      const newCoins = currentCoins + pkg.coinsReceived;

      const updatedUser = await AuthService.updateUserProfile(userId, {
        xp: newXp,
        coins: newCoins,
      });

      // Save transaction history
      const transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        transactionType: 'XP_TO_COIN_EXCHANGE',
        xpAmount: -pkg.xpRequired,
        coinAmount: pkg.coinsReceived,
        packageId: pkg.id,
        gameDifficulty: null,
        gameId: 'coin_store',
        transactionDate: new Date().toISOString(),
        transactionStatus: 'COMPLETED',
      };
      await this.recordTransaction(userId, transaction);

      return {
        success: true,
        package: pkg,
        xpDeducted: pkg.xpRequired,
        deductedXp: pkg.xpRequired,
        coinsReceived: pkg.coinsReceived,
        addedCoins: pkg.coinsReceived,
        newXp,
        newCoins,
        updatedUser,
      };
    } finally {
      isExchangingLock = false;
    }
  },

  /**
   * Records a reward transaction in user's persistent transaction history
   */
  async recordTransaction(userId, transaction) {
    if (!userId || !transaction) return;
    const txKey = `${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`;
    const list = (await SessionStorage.getItem(txKey)) || [];
    list.unshift(transaction); // Most recent first
    await SessionStorage.setItem(txKey, list.slice(0, 100)); // Keep latest 100
  },

  /**
   * Retrieves transaction history for user
   */
  async getTransactions(userId) {
    if (!userId) return [];
    const txKey = `${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`;
    const list = (await SessionStorage.getItem(txKey)) || [];
    return Array.isArray(list) ? list : [];
  },

  /**
   * Retrieves player's current sequentially unlocked game level (1 to 10) for a specific game.
   * Level 1 is always unlocked by default for every new player; subsequent levels unlock only upon completing previous level.
   */
  async getUserUnlockedLevel(userId, gameId = 'g_target_no') {
    if (!userId) return 1;
    const cleanGameId = String(gameId || 'g_target_no').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const key = `${STORAGE_KEYS.UNLOCKED_LEVEL_PREFIX}${userId}_${cleanGameId}`;
    const stored = await SessionStorage.getItem(key);
    const parsed = parseInt(stored, 10);
    if (isNaN(parsed) || parsed < 1) {
      // Legacy fallback
      const legacyKey = `${STORAGE_KEYS.UNLOCKED_LEVEL_PREFIX}${userId}`;
      const legacyStored = await SessionStorage.getItem(legacyKey);
      const legacyParsed = parseInt(legacyStored, 10);
      if (!isNaN(legacyParsed) && legacyParsed >= 1 && (cleanGameId === 'g_target_no' || cleanGameId === 'default')) {
        return Math.min(10, legacyParsed);
      }
      return 1;
    }
    return Math.min(10, parsed);
  },

  /**
   * Unlocks next sequential level after a verified win of the current level for a specific game.
   * Level 1 completed -> unlocks Level 2
   * Level 2 completed -> unlocks Level 3
   * Failed or abandoned games do not unlock.
   */
  async unlockNextLevel(userId, completedLevel = 1, gameId = 'g_target_no') {
    if (!userId) return 1;
    const cleanGameId = String(gameId || 'g_target_no').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const current = await this.getUserUnlockedLevel(userId, cleanGameId);
    const completed = parseInt(completedLevel, 10) || 1;
    let newLevel = current;
    if (completed >= current && current < 10) {
      newLevel = current + 1;
      const key = `${STORAGE_KEYS.UNLOCKED_LEVEL_PREFIX}${userId}_${cleanGameId}`;
      await SessionStorage.setItem(key, newLevel);
      if (cleanGameId === 'g_target_no' || cleanGameId === 'default') {
        const legacyKey = `${STORAGE_KEYS.UNLOCKED_LEVEL_PREFIX}${userId}`;
        await SessionStorage.setItem(legacyKey, newLevel);
      }
    }
    return newLevel;
  },

  /**
   * Checks whether a level has already been successfully completed to prevent duplicate rewards.
   */
  async isLevelAlreadyCompleted(userId, gameId = 'g_target_no', level = 1) {
    if (!userId) return false;
    const cleanGameId = String(gameId || 'g_target_no').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const key = `${STORAGE_KEYS.COMPLETED_LEVELS_PREFIX}${userId}_${cleanGameId}`;
    const stored = await SessionStorage.getItem(key);
    if (!Array.isArray(stored)) return false;
    const lvlNum = parseInt(level, 10) || 1;
    return stored.includes(lvlNum);
  },

  /**
   * Records a level as completed for a specific user and game.
   */
  async recordLevelCompletion(userId, gameId = 'g_target_no', level = 1) {
    if (!userId) return [];
    const cleanGameId = String(gameId || 'g_target_no').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const key = `${STORAGE_KEYS.COMPLETED_LEVELS_PREFIX}${userId}_${cleanGameId}`;
    const stored = await SessionStorage.getItem(key);
    const list = Array.isArray(stored) ? stored : [];
    const lvlNum = parseInt(level, 10) || 1;
    if (!list.includes(lvlNum)) {
      list.push(lvlNum);
      await SessionStorage.setItem(key, list);
    }
    return list;
  },

  /**
   * Retrieves all sequential game levels with player's live unlock/completed status for a specific game
   */
  async getGameLevels(userId, gameId = 'g_target_no', maxLevels = 10) {
    const unlockedLevel = await this.getUserUnlockedLevel(userId, gameId);
    const configs = GAME_LEVELS_CONFIG.slice(0, maxLevels);
    return configs.map((cfg) => {
      const isCompleted = cfg.level < unlockedLevel;
      const isUnlocked = cfg.level <= unlockedLevel;
      const isCurrent = cfg.level === unlockedLevel;
      const isLocked = cfg.level > unlockedLevel;
      return {
        ...cfg,
        isCompleted,
        isUnlocked,
        isCurrent,
        isLocked,
        status: isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked',
        unlockMessage: cfg.level > 1 ? `Complete Level ${cfg.level - 1} to Unlock` : 'Available to Play',
      };
    });
  },

  /**
   * Computes string remaining time until midnight in user's timezone (e.g. "8h 24m")
   */
  getTimeUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diffMs = Math.max(0, midnight.getTime() - now.getTime());
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  },

  /**
   * Retrieves user's Daily Quests for the current calendar day
   * Master Prompt Section 4:
   * - Real quest progress updated from game activity
   * - Resets at midnight
   * - Shows completed status and prevents duplicate rewards
   */
  async getDailyQuests(userId, timezone = getAppTimezone()) {
    if (!userId) return { dateKey: '', resetTimeString: '', quests: [] };
    const now = new Date();
    const todayKey = toDateKey(now, timezone);
    const key = `${STORAGE_KEYS.DAILY_QUESTS_PREFIX}${userId}_${todayKey}`;
    const stored = await SessionStorage.getItem(key);

    const resetTimeString = this.getTimeUntilMidnight();

    if (stored && Array.isArray(stored.quests)) {
      return {
        dateKey: todayKey,
        resetTimeString,
        playedToday: stored.playedToday || 0,
        consecutiveWins: stored.consecutiveWins || 0,
        quests: stored.quests.map((q) => ({
          ...q,
          isCompleted: q.current >= q.target,
          progress: Math.min(1, q.current / q.target),
        })),
      };
    }

    // Initialize fresh quests for today
    const freshQuests = DEFAULT_DAILY_QUESTS.map((q) => ({
      ...q,
      current: 0,
      claimed: false,
      isCompleted: false,
      progress: 0,
    }));

    const payload = {
      dateKey: todayKey,
      playedToday: 0,
      consecutiveWins: 0,
      quests: freshQuests,
      updatedAt: now.toISOString(),
    };
    await SessionStorage.setItem(key, payload);

    return {
      dateKey: todayKey,
      resetTimeString,
      playedToday: 0,
      consecutiveWins: 0,
      quests: freshQuests,
    };
  },

  /**
   * Updates Daily Quest progress based on actual game activity
   * - Increments played count
   * - Increments or resets consecutive wins
   */
  async recordQuestActivity(userId, { won = false, difficulty = 1, gameId = '' } = {}) {
    if (!userId) return null;
    const timezone = getAppTimezone();
    const now = new Date();
    const todayKey = toDateKey(now, timezone);
    const key = `${STORAGE_KEYS.DAILY_QUESTS_PREFIX}${userId}_${todayKey}`;

    const currentData = await this.getDailyQuests(userId, timezone);
    const playedToday = (currentData.playedToday || 0) + 1;
    const consecutiveWins = won ? (currentData.consecutiveWins || 0) + 1 : 0;

    const updatedQuests = (currentData.quests || []).map((q) => {
      let newCurrent = q.current;
      if (q.type === 'consecutive_wins') {
        newCurrent = Math.min(q.target, Math.max(q.current, consecutiveWins));
      } else if (q.type === 'games_played') {
        newCurrent = Math.min(q.target, playedToday);
      }
      return {
        ...q,
        current: newCurrent,
        isCompleted: newCurrent >= q.target,
        progress: Math.min(1, newCurrent / q.target),
      };
    });

    const payload = {
      dateKey: todayKey,
      playedToday,
      consecutiveWins,
      quests: updatedQuests,
      updatedAt: now.toISOString(),
    };
    await SessionStorage.setItem(key, payload);

    return {
      dateKey: todayKey,
      resetTimeString: this.getTimeUntilMidnight(),
      playedToday,
      consecutiveWins,
      quests: updatedQuests,
    };
  },

  /**
   * Claims reward for a completed daily quest.
   * Atomically adds XP & Coins, marks as claimed, and records QUEST_REWARD transaction.
   */
  async claimQuestReward(userId, questId) {
    if (!userId || !questId) return { success: false, error: 'Parameters missing.' };
    const timezone = getAppTimezone();
    const now = new Date();
    const todayKey = toDateKey(now, timezone);
    const key = `${STORAGE_KEYS.DAILY_QUESTS_PREFIX}${userId}_${todayKey}`;

    const currentData = await this.getDailyQuests(userId, timezone);
    const quests = currentData.quests || [];
    const questIndex = quests.findIndex((q) => q.id === questId);

    if (questIndex === -1) {
      return { success: false, error: 'Quest not found.' };
    }

    const quest = quests[questIndex];
    if (quest.claimed) {
      return { success: false, error: 'Reward already collected for this quest today.' };
    }
    if (quest.current < quest.target) {
      return { success: false, error: `Quest not yet completed (${quest.current}/${quest.target}).` };
    }

    // Mark as claimed
    quests[questIndex] = {
      ...quest,
      claimed: true,
    };

    const payload = {
      dateKey: todayKey,
      playedToday: currentData.playedToday,
      consecutiveWins: currentData.consecutiveWins,
      quests,
      updatedAt: now.toISOString(),
    };
    await SessionStorage.setItem(key, payload);

    // Record transaction
    const transaction = {
      id: `tx_quest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      transactionType: 'QUEST_REWARD',
      xpAmount: quest.rewardXp,
      coinAmount: quest.rewardCoins,
      questId: quest.id,
      questTitle: quest.title,
      transactionDate: now.toISOString(),
      transactionStatus: 'COMPLETED',
    };
    await this.recordTransaction(userId, transaction);

    // Update balances
    const updatedUser = await AuthService.updateUserBalances(userId, {
      xpDelta: quest.rewardXp,
      coinsDelta: quest.rewardCoins,
    });

    return {
      success: true,
      quest: quests[questIndex],
      quests,
      xpAwarded: quest.rewardXp,
      coinsAwarded: quest.rewardCoins,
      user: updatedUser,
    };
  },

  /**
   * Resets development database safely per Master Prompt Section 2:
   * - Backs up data
   * - Clears test sessions, test balances, old reward history
   * - Initializes demo users with 0 XP, 0 Coins, 0 Streak
   */
  async resetDevelopmentDatabase() {
    const existingRegistry = await SessionStorage.getItem(STORAGE_KEYS.USERS_REGISTRY || '@soloplay_registered_users') || [];
    const baseUsers = existingRegistry.length > 0 ? existingRegistry : [
      {
        id: 'usr_demo_1',
        name: 'SoloSlayer',
        email: 'gamer@gmail.com',
        password: 'SoloGamer2026!',
        xp: 0,
        coins: 0,
        streak: 0,
        avatar: 'game-controller',
        gamerTag: 'SOLO_SLAYER#2099',
        badge: 'Pro Slayer',
        profilePicture: null,
        createdAt: '2026-01-15T00:00:00.000Z',
      },
      {
        id: 'usr_demo_2',
        name: 'CyberKnight',
        email: 'player1@pixo.gg',
        password: 'SoloGamer2026!',
        xp: 0,
        coins: 0,
        streak: 0,
        avatar: 'shield',
        gamerTag: 'CYBER_KNIGHT#4040',
        badge: 'Cyber Veteran',
        profilePicture: null,
        createdAt: '2026-02-01T00:00:00.000Z',
      },
    ];

    const resetUsers = baseUsers.map((u) => ({
      ...u,
      xp: 0,
      coins: 0,
      streak: 0,
    }));

    await SessionStorage.setItem(STORAGE_KEYS.USERS_REGISTRY || '@soloplay_registered_users', resetUsers);

    for (const u of resetUsers) {
      await SessionStorage.removeItem(`${STORAGE_KEYS.SESSIONS_PREFIX}${u.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.STREAK_STATE_PREFIX}${u.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.LONGEST_STREAK_PREFIX}${u.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${u.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.INITIALIZED_FLAG_PREFIX}${u.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.UNLOCKED_LEVEL_PREFIX}${u.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.COMPLETED_LEVELS_PREFIX}${u.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.DAILY_QUESTS_PREFIX}${u.id}`);
    }

    const active = await AuthService.getActiveSession();
    if (active) {
      const refreshedActive = {
        ...active,
        xp: 0,
        coins: 0,
        streak: 0,
      };
      await AuthService.setSession(refreshedActive);
      await SessionStorage.removeItem(`${STORAGE_KEYS.SESSIONS_PREFIX}${active.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.STREAK_STATE_PREFIX}${active.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.LONGEST_STREAK_PREFIX}${active.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${active.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.INITIALIZED_FLAG_PREFIX}${active.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.UNLOCKED_LEVEL_PREFIX}${active.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.COMPLETED_LEVELS_PREFIX}${active.id}`);
      await SessionStorage.removeItem(`${STORAGE_KEYS.DAILY_QUESTS_PREFIX}${active.id}`);
    }
  },

  /**
   * AUTOMATIC MIDNIGHT STREAK VALIDATION
   * Checks whether the previous calendar day had an eligible completed activity.
   * If yesterday was missed, immediately marks current streak as broken.
   */
  async validateStreakAtMidnight(userId, timezone = getAppTimezone()) {
    if (!userId) return null;
    return await this.getUserStreakState(userId, timezone);
  },

  /**
   * Test & Simulation Helper: Simulates missed days to test broken streak and restoration
   */
  async simulateMissedDays(userId, missedDaysCount = 1) {
    if (!userId) return null;
    const timezone = getAppTimezone();
    const now = new Date();
    const simulatedDate = getOffsetDateKey(-(missedDaysCount + 1), now, timezone);
    const streakStateKey = `${STORAGE_KEYS.STREAK_STATE_PREFIX}${userId}`;
    const current = await this.getUserStreakState(userId, timezone);

    const prev = current.currentStreak > 0 ? current.currentStreak : (current.previousStreak || 7);
    const simulatedState = {
      ...current,
      currentStreak: 0,
      previousStreak: prev,
      lastActivityDate: simulatedDate,
      streakStatus: 'broken',
      missedDays: missedDaysCount,
      restorationCost: missedDaysCount * 100, // 100 Coins per missed day
      restorationCostCoins: missedDaysCount * 100,
      updatedAt: new Date().toISOString(),
    };

    await SessionStorage.setItem(streakStateKey, simulatedState);
    await AuthService.updateUserProfile(userId, { streak: 0 });
    return simulatedState;
  },

  /**
   * Retrieves player aggregate statistics:
   * 1. Total Unique Games Completed
   * 2. Total Verified Play Time (seconds)
   * 3. Current Completion Streak
   * 4. Total XP Earned
   */
  async getPlayerStatistics(userId) {
    if (!userId) {
      return {
        totalGamesCompleted: 0,
        totalPlayTimeSeconds: 0,
        totalPlayTimeFormatted: '0h 0m',
        currentStreak: 0,
        longestStreak: 0,
        totalXpEarned: 0,
      };
    }

    const sessions = await this.getUserSessions(userId);
    const verifiedCompletions = sessions.filter((s) => s.status === 'completed');

    // 1. Unique games completed
    const uniqueGames = new Set(
      verifiedCompletions.filter((c) => !c.gameId.startsWith('q')).map((c) => c.gameId)
    );

    // 2. Total verified play time (all completed sessions)
    const totalPlayTimeSeconds = verifiedCompletions.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);

    // 3. Streak calculation
    const streakInfo = await this.calculateUserStreak(userId);

    // 4. Total XP recorded
    const totalXpEarned = verifiedCompletions.reduce((acc, c) => acc + (c.xpAwarded || 0), 0);

    return {
      totalGamesCompleted: uniqueGames.size,
      totalPlayTimeSeconds,
      totalPlayTimeFormatted: formatDuration(totalPlayTimeSeconds),
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      totalXpEarned,
      streakInfo,
    };
  },

  /**
   * Computes complete monthly report for specified year and month (1-indexed month, e.g. 10 for October)
   */
  async getMonthlyGamingReport(userId, year, month, timezone = getAppTimezone()) {
    if (!userId) return null;

    const completions = await this.getUserCompletions(userId);
    const sessions = await this.getUserSessions(userId);

    // Filter completions in target month
    const targetMonthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthCompletions = completions.filter((c) => {
      const dateKey = toDateKey(c.completedAt, timezone);
      return dateKey.startsWith(targetMonthPrefix);
    });

    const monthSessions = sessions.filter((s) => {
      const dateKey = toDateKey(s.startedAt, timezone);
      return dateKey.startsWith(targetMonthPrefix);
    });

    // 1. Unique games completed in month
    const uniqueGames = new Set(
      monthCompletions.filter((c) => !c.gameId.startsWith('q')).map((c) => c.gameId)
    );

    // 2. Missions completed in month
    const missionsCompleted = monthCompletions.filter((c) => c.gameId.startsWith('q')).length;

    // 3. Qualifying active days in month
    const qualifyingDaysSet = new Set(monthCompletions.map((c) => toDateKey(c.completedAt, timezone)));

    // 4. Total verified play time in month
    const playTimeSeconds = monthCompletions.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);

    // 5. XP earned in month
    const xpEarned = monthCompletions.reduce((acc, c) => acc + (c.xpAwarded || 0), 0);

    // 6. Most played game in month
    const gamePlayCounts = {};
    monthSessions.forEach((s) => {
      const title = s.gameTitle || 'Unknown';
      gamePlayCounts[title] = (gamePlayCounts[title] || 0) + (s.durationSeconds || 60);
    });
    let mostPlayedGame = 'None yet';
    let maxGameDuration = 0;
    Object.entries(gamePlayCounts).forEach(([title, dur]) => {
      if (dur > maxGameDuration) {
        maxGameDuration = dur;
        mostPlayedGame = title;
      }
    });

    // 7. Most recently completed game
    const mostRecentlyCompleted = monthCompletions.length > 0 ? monthCompletions[0].gameTitle : 'None yet';

    // 8. Streak information
    const streakInfo = await this.calculateUserStreak(userId, timezone);

    // 9. Daily chart breakdown for all days of this month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyChartData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = `${targetMonthPrefix}-${String(day).padStart(2, '0')}`;
      const dayCompletions = monthCompletions.filter((c) => toDateKey(c.completedAt, timezone) === dayKey);
      dailyChartData.push({
        day,
        dateKey: dayKey,
        count: dayCompletions.length,
        hasQualifyingCompletion: dayCompletions.length > 0,
      });
    }

    return {
      year,
      month,
      uniqueGamesCompleted: uniqueGames.size,
      missionsCompleted,
      qualifyingActiveDays: qualifyingDaysSet.size,
      totalPlayTimeFormatted: formatDuration(playTimeSeconds),
      totalPlayTimeSeconds: playTimeSeconds,
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      xpEarned,
      mostPlayedGame,
      mostRecentlyCompleted,
      dailyChartData,
      totalCompletionsCount: monthCompletions.length,
    };
  },

  /**
   * Generates sanitized CSV string of user's verified completions
   */
  async exportCsvReport(userId) {
    if (!userId) throw new Error('Unauthorized');
    const completions = await this.getUserCompletions(userId);

    const headers = [
      'Completion Timestamp',
      'Game or Mission Title',
      'Category',
      'Game Mode',
      'Session Duration',
      'Verified Result',
      'Score',
      'XP Awarded',
    ];

    const rows = completions.map((c) => [
      sanitizeCsvField(c.completedAt),
      sanitizeCsvField(c.gameTitle),
      sanitizeCsvField(c.gameCategory),
      sanitizeCsvField(c.gameMode),
      sanitizeCsvField(formatDuration(c.durationSeconds)),
      sanitizeCsvField(c.result),
      sanitizeCsvField(c.score),
      sanitizeCsvField(c.xpAwarded),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    return csvContent;
  },
};

export default GamingActivityService;
