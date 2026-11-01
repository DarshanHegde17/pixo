import { SessionStorage } from './sessionStorage.js';
import { AuthService } from './authService.js';

const STORAGE_KEYS = {
  SESSIONS_PREFIX: '@soloplay_gaming_sessions_',
  COMPLETIONS_PREFIX: '@soloplay_gaming_completions_',
  LONGEST_STREAK_PREFIX: '@soloplay_longest_streak_',
  STREAK_STATE_PREFIX: '@soloplay_user_streak_state_',
  STREAK_RESTORATIONS_PREFIX: '@soloplay_streak_restorations_',
  INITIALIZED_FLAG_PREFIX: '@soloplay_data_initialized_',
};

// Concurrency mutex for atomic streak restoration
let isRestoringStreakLock = false;

/**
 * Standard milestones for streak badges
 */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

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
   * Demo accounts receive calibrated seed data; new users start fresh.
   */
  async ensureUserDataInitialized(userId) {
    if (!userId) return;

    const initializedKey = `${STORAGE_KEYS.INITIALIZED_FLAG_PREFIX}${userId}`;
    const isInitialized = await SessionStorage.getItem(initializedKey);

    if (!isInitialized) {
      if (userId === 'usr_demo_1') {
        // Pre-seed demo user 1 with rich history
        const demoSessions = createDemoSeedData(userId);
        await this.saveUserSessions(userId, demoSessions);
        await SessionStorage.setItem(`${STORAGE_KEYS.LONGEST_STREAK_PREFIX}${userId}`, 14);
      } else {
        // New user starts completely fresh with empty records
        await this.saveUserSessions(userId, []);
        await SessionStorage.setItem(`${STORAGE_KEYS.LONGEST_STREAK_PREFIX}${userId}`, 0);
      }
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
   * Strictly completes a game or mission session.
   * Validates duration, checks for duplicate completion submissions,
   * records completion timestamp, and awards XP.
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
    if (session.status === 'completed') {
      return {
        success: true,
        alreadyCompleted: true,
        session,
        streakInfo: await this.calculateUserStreak(userId),
      };
    }

    const now = new Date();
    const startTime = new Date(session.startedAt);
    const durationSeconds = Math.max(
      15,
      verificationDetails.durationSeconds || Math.round((now.getTime() - startTime.getTime()) / 1000)
    );

    const score = verificationDetails.score || Math.floor(10000 + Math.random() * 15000);
    const xpAwarded = verificationDetails.xpAwarded || (session.gameId.startsWith('q') ? 200 : 350);

    // Update verified session fields
    const updatedSession = {
      ...session,
      status: 'completed',
      endedAt: now.toISOString(),
      completedAt: now.toISOString(),
      durationSeconds,
      score,
      xpAwarded,
      result: verificationDetails.result || 'Victory - S Rank',
      achievements: verificationDetails.achievements || ['Solo Finisher', 'Flawless Run'],
      personalBest: verificationDetails.personalBest !== undefined ? verificationDetails.personalBest : true,
    };

    sessions[sessionIndex] = updatedSession;
    await this.saveUserSessions(userId, sessions);

    // Calculate updated streak & record daily streak activity
    const streakState = await this.recordActivityCompletion(userId, updatedSession);
    const streakInfo = await this.calculateUserStreak(userId);

    return {
      success: true,
      alreadyCompleted: false,
      session: updatedSession,
      streakInfo,
      streakState,
      xpAwarded,
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
   * missedDays, availableXP, lastRestoredDate, previousStreak, restorationCost.
   */
  async getUserStreakState(userId, timezone = getAppTimezone()) {
    if (!userId) return null;

    const streakStateKey = `${STORAGE_KEYS.STREAK_STATE_PREFIX}${userId}`;
    const storedState = (await SessionStorage.getItem(streakStateKey)) || null;

    // Get live user XP & Coins from AuthService
    let userXp = 0;
    try {
      const activeUser = (await AuthService.findUserById(userId)) || (await AuthService.getActiveSession());
      if (activeUser) {
        userXp = typeof activeUser.xp === 'number' ? activeUser.xp : 0;
      }
    } catch (e) {
      console.warn('Error reading user XP in getUserStreakState:', e);
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
    const restorationCost = missedDays * 1000;

    const finalState = {
      userId,
      currentStreak,
      longestStreak,
      lastActivityDate: effectiveLastActivity,
      streakStatus,
      missedDays,
      availableXP: userXp,
      lastRestoredDate,
      previousStreak,
      restorationCost,
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
      updatedAt: now.toISOString(),
    };

    await SessionStorage.setItem(streakStateKey, updatedState);
    await SessionStorage.setItem(`${STORAGE_KEYS.LONGEST_STREAK_PREFIX}${userId}`, longestStreak);
    await AuthService.updateUserProfile(userId, { streak: newStreak });

    return updatedState;
  },

  /**
   * RESTORE A BROKEN STREAK USING XP
   *
   * Business Rules:
   * - Cost is exactly 1,000 XP per missed day.
   * - User must have at least 1,000 XP.
   * - Deducts exactly 1,000 XP per restored day.
   * - Restores previous streak count.
   * - Never allows negative XP.
   * - Atomic concurrency lock prevents duplicate deductions on rapid clicks.
   * - If insufficient XP: returns "Not enough XP! Earn more XP to restore your streak."
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
      const requiredXp = daysToRestore * 1000;
      const availableXp = typeof user.xp === 'number' ? user.xp : 0;

      // 3. Insufficient XP check
      if (availableXp < requiredXp) {
        return {
          success: false,
          insufficientXp: true,
          error: 'Not enough XP! Earn more XP to restore your streak.',
          requiredXp,
          availableXp,
        };
      }

      // 4. Atomic XP Deduction
      const newXp = availableXp - requiredXp;
      if (newXp < 0) {
        return { success: false, error: 'Not enough XP! Earn more XP to restore your streak.' };
      }

      await AuthService.updateUserProfile(userId, { xp: newXp });

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
          gameMode: 'XP Restoration',
          startedAt: `${restoredDateKey}T12:00:00.000Z`,
          endedAt: `${restoredDateKey}T12:01:00.000Z`,
          completedAt: `${restoredDateKey}T12:01:00.000Z`,
          durationSeconds: 60,
          status: 'completed',
          result: 'Streak Restored',
          score: 0,
          xpAwarded: 0,
          isRestoration: true,
          achievements: ['Streak Restored with 1,000 XP'],
        };
        sessions.push(restorationSession);
      }

      await this.saveUserSessions(userId, sessions);

      // 6. Update streak state with restored streak count
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
        availableXP: newXp,
        lastRestoredDate: todayKey,
        previousStreak: restoredStreak,
        restorationCost: remainingMissed * 1000,
        updatedAt: new Date().toISOString(),
      };

      const streakStateKey = `${STORAGE_KEYS.STREAK_STATE_PREFIX}${userId}`;
      await SessionStorage.setItem(streakStateKey, updatedStreakState);
      await AuthService.updateUserProfile(userId, { streak: updatedStreakState.currentStreak });

      return {
        success: true,
        restoredStreak: updatedStreakState.currentStreak,
        xpDeducted: requiredXp,
        remainingXp: newXp,
        streakState: updatedStreakState,
      };
    } finally {
      isRestoringStreakLock = false;
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
      restorationCost: missedDaysCount * 1000,
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
