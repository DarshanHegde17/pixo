/**
 * PIXO BRAIN BLITZ
 * Persistence, Independent Level Progression & Economy Integration Service
 * 
 * Manages:
 * 1. Independent 10-level progression for all 3 modes:
 *    - Memory Match (Levels 1–10)
 *    - Sequence Recall (Levels 1–10)
 *    - Pattern Recall (Levels 1–10)
 * 2. Unfinished game state save & resume.
 * 3. Atomic reward claims and deduplication via AuthService & GamingActivityService.
 * 4. Comprehensive statistics tracking for Brain Blitz player dashboard.
 * 5. Sound effects preference storage.
 */

import { SessionStorage } from './sessionStorage.js';
import { AuthService } from './authService.js';
import { GamingActivityService } from './gamingActivityService.js';

export const BRAIN_BLITZ_MODES = {
  MEMORY_MATCH: 'memory_match',
  SEQUENCE_RECALL: 'sequence_recall',
  PATTERN_RECALL: 'pattern_recall',
};

export const BRAIN_BLITZ_MODE_METADATA = {
  [BRAIN_BLITZ_MODES.MEMORY_MATCH]: {
    id: BRAIN_BLITZ_MODES.MEMORY_MATCH,
    title: 'Memory Match',
    subtitle: 'Card Pairs Matrix',
    desc: 'Flip hidden cyber cards and locate identical matching pairs with speed and minimal moves.',
    icon: 'albums-outline',
    color: '#39FF14',
    secondaryColor: '#00E5FF',
    accentGradient: ['#0B2B11', '#06170A'],
    totalLevels: 10,
  },
  [BRAIN_BLITZ_MODES.SEQUENCE_RECALL]: {
    id: BRAIN_BLITZ_MODES.SEQUENCE_RECALL,
    title: 'Sequence Recall',
    subtitle: 'Neural Simon Sequence',
    desc: 'Memorize high-speed lighting sequences across glowing cyber symbols and repeat them without flaw.',
    icon: 'git-commit-outline',
    color: '#00E5FF',
    secondaryColor: '#FFD700',
    accentGradient: ['#07202B', '#041017'],
    totalLevels: 10,
  },
  [BRAIN_BLITZ_MODES.PATTERN_RECALL]: {
    id: BRAIN_BLITZ_MODES.PATTERN_RECALL,
    title: 'Pattern Recall',
    subtitle: 'Matrix Grid Reproduction',
    desc: 'Analyze flashing grid coordinates and reproduce the exact hidden cell geometry from memory.',
    icon: 'apps-outline',
    color: '#FFD700',
    secondaryColor: '#FF6A00',
    accentGradient: ['#2A2408', '#141104'],
    totalLevels: 10,
  },
};

export const BRAIN_BLITZ_STORAGE_KEYS = {
  UNLOCKED_LEVEL: '@pixo_bb_unlocked_', // + `${mode}_${userId}`
  COMPLETED_LEVELS: '@pixo_bb_completed_', // + `${mode}_${userId}`
  ACTIVE_SESSION: '@pixo_bb_active_session_', // + userId
  PLAYER_STATS: '@pixo_bb_player_stats_', // + userId
  SOUND_ENABLED: '@pixo_bb_sound_enabled',
};

// Base Rewards Scale per Level (prompt section 9)
export const BRAIN_BLITZ_LEVEL_REWARDS = {
  1: { xp: 10, coins: 2 },
  2: { xp: 20, coins: 4 },
  3: { xp: 30, coins: 6 },
  4: { xp: 40, coins: 8 },
  5: { xp: 50, coins: 10 },
  6: { xp: 60, coins: 12 },
  7: { xp: 70, coins: 14 },
  8: { xp: 80, coins: 16 },
  9: { xp: 90, coins: 18 },
  10: { xp: 100, coins: 20 },
};

export const BrainBlitzPersistenceService = {
  getCleanId(userId = 'guest') {
    return String(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
  },

  /**
   * Sound preferences
   */
  async isSoundEnabled() {
    const val = await SessionStorage.getItem(BRAIN_BLITZ_STORAGE_KEYS.SOUND_ENABLED);
    return val !== false && val !== 'false';
  },

  async setSoundEnabled(enabled) {
    await SessionStorage.setItem(BRAIN_BLITZ_STORAGE_KEYS.SOUND_ENABLED, Boolean(enabled));
    return Boolean(enabled);
  },

  /**
   * Retrieves the current highest unlocked level for a specific mode (1–10).
   * Level 1 is always unlocked by default in all modes.
   */
  async getUnlockedLevel(userId = 'guest', mode = BRAIN_BLITZ_MODES.MEMORY_MATCH) {
    const key = `${BRAIN_BLITZ_STORAGE_KEYS.UNLOCKED_LEVEL}${mode}_${this.getCleanId(userId)}`;
    const stored = await SessionStorage.getItem(key);
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : Math.min(10, parsed);
  },

  /**
   * Unlocks level completedLevel + 1 sequentially up to 10 for a specific mode.
   */
  async unlockNextLevel(userId = 'guest', mode = BRAIN_BLITZ_MODES.MEMORY_MATCH, completedLevel = 1) {
    const current = await this.getUnlockedLevel(userId, mode);
    const nextLevel = Math.min(10, Math.max(current, completedLevel + 1));
    const key = `${BRAIN_BLITZ_STORAGE_KEYS.UNLOCKED_LEVEL}${mode}_${this.getCleanId(userId)}`;
    await SessionStorage.setItem(key, nextLevel);
    return nextLevel;
  },

  /**
   * Retrieves list of completed levels for a specific mode.
   */
  async getCompletedLevels(userId = 'guest', mode = BRAIN_BLITZ_MODES.MEMORY_MATCH) {
    const key = `${BRAIN_BLITZ_STORAGE_KEYS.COMPLETED_LEVELS}${mode}_${this.getCleanId(userId)}`;
    const stored = await SessionStorage.getItem(key);
    return Array.isArray(stored) ? stored : [];
  },

  /**
   * Checks whether a specific level has already been completed in a given mode.
   */
  async isLevelCompleted(userId = 'guest', mode = BRAIN_BLITZ_MODES.MEMORY_MATCH, level = 1) {
    const list = await this.getCompletedLevels(userId, mode);
    return list.includes(Number(level));
  },

  /**
   * Records successful completion of a level for a mode.
   */
  async recordLevelCompletion(userId = 'guest', mode = BRAIN_BLITZ_MODES.MEMORY_MATCH, level = 1) {
    const list = await this.getCompletedLevels(userId, mode);
    const num = Number(level);
    if (!list.includes(num)) {
      list.push(num);
      list.sort((a, b) => a - b);
      const key = `${BRAIN_BLITZ_STORAGE_KEYS.COMPLETED_LEVELS}${mode}_${this.getCleanId(userId)}`;
      await SessionStorage.setItem(key, list);
    }
    return list;
  },

  /**
   * Saves an unfinished game session (for Save & Resume upon pause or exit).
   */
  async saveActiveSession(userId = 'guest', sessionData) {
    const key = `${BRAIN_BLITZ_STORAGE_KEYS.ACTIVE_SESSION}${this.getCleanId(userId)}`;
    const payload = {
      ...sessionData,
      savedAt: new Date().toISOString(),
    };
    await SessionStorage.setItem(key, payload);
    return payload;
  },

  /**
   * Retrieves an active saved session if one exists.
   */
  async getActiveSession(userId = 'guest') {
    const key = `${BRAIN_BLITZ_STORAGE_KEYS.ACTIVE_SESSION}${this.getCleanId(userId)}`;
    const session = await SessionStorage.getItem(key);
    if (session && (session.status === 'in_progress' || session.status === 'SAVED' || session.level)) {
      return session;
    }
    return null;
  },

  /**
   * Clears active session once finished or dismissed.
   */
  async clearActiveSession(userId = 'guest') {
    const key = `${BRAIN_BLITZ_STORAGE_KEYS.ACTIVE_SESSION}${this.getCleanId(userId)}`;
    await SessionStorage.removeItem(key);
  },

  /**
   * Retrieves overall player statistics for the Brain Blitz Dashboard.
   */
  async getStats(userId = 'guest') {
    const cleanId = this.getCleanId(userId);
    const key = `${BRAIN_BLITZ_STORAGE_KEYS.PLAYER_STATS}${cleanId}`;
    const stored = (await SessionStorage.getItem(key)) || {};

    const [unlockedMM, unlockedSR, unlockedPR] = await Promise.all([
      this.getUnlockedLevel(userId, BRAIN_BLITZ_MODES.MEMORY_MATCH),
      this.getUnlockedLevel(userId, BRAIN_BLITZ_MODES.SEQUENCE_RECALL),
      this.getUnlockedLevel(userId, BRAIN_BLITZ_MODES.PATTERN_RECALL),
    ]);

    const [completedMM, completedSR, completedPR] = await Promise.all([
      this.getCompletedLevels(userId, BRAIN_BLITZ_MODES.MEMORY_MATCH),
      this.getCompletedLevels(userId, BRAIN_BLITZ_MODES.SEQUENCE_RECALL),
      this.getCompletedLevels(userId, BRAIN_BLITZ_MODES.PATTERN_RECALL),
    ]);

    const totalCompletedLevels = completedMM.length + completedSR.length + completedPR.length;
    const totalXp = stored.totalXp || 0;
    const totalCoins = stored.totalCoins || 0;
    const bestScore = stored.bestScore || 0;
    const gamesPlayed = stored.gamesPlayed || 0;
    const gamesWon = stored.gamesWon || 0;

    return {
      totalCompletedLevels,
      totalXp,
      totalCoins,
      bestScore,
      gamesPlayed,
      gamesWon,
      winRate: gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 100,
      modeProgress: {
        [BRAIN_BLITZ_MODES.MEMORY_MATCH]: {
          unlockedLevel: unlockedMM,
          completedCount: completedMM.length,
          completedLevels: completedMM,
          bestScore: stored.bestScores?.[BRAIN_BLITZ_MODES.MEMORY_MATCH] || 0,
        },
        [BRAIN_BLITZ_MODES.SEQUENCE_RECALL]: {
          unlockedLevel: unlockedSR,
          completedCount: completedSR.length,
          completedLevels: completedSR,
          bestScore: stored.bestScores?.[BRAIN_BLITZ_MODES.SEQUENCE_RECALL] || 0,
        },
        [BRAIN_BLITZ_MODES.PATTERN_RECALL]: {
          unlockedLevel: unlockedPR,
          completedCount: completedPR.length,
          completedLevels: completedPR,
          bestScore: stored.bestScores?.[BRAIN_BLITZ_MODES.PATTERN_RECALL] || 0,
        },
      },
    };
  },

  /**
   * Completes a level in Brain Blitz:
   * 1. Verifies non-duplicate completion.
   * 2. Calculates base XP and Coins according to prompt Section 9.
   * 3. Calculates mistake-free & speed bonuses.
   * 4. Unlocks Level N + 1 for that mode.
   * 5. Atomically credits user wallet in AuthService.
   * 6. Records transaction in GamingActivityService.
   */
  async completeLevel(userId, mode, level, {
    score = 0,
    durationSeconds = 30,
    moves = 0,
    mistakes = 0,
    isPerfect = false,
    isFast = false,
  } = {}) {
    if (!userId) throw new Error('User authentication required.');

    const numLevel = Math.max(1, Math.min(10, Number(level) || 1));
    const alreadyCompleted = await this.isLevelCompleted(userId, mode, numLevel);

    const baseReward = BRAIN_BLITZ_LEVEL_REWARDS[numLevel] || { xp: 10, coins: 2 };
    let earnedXp = 0;
    let earnedCoins = 0;

    if (!alreadyCompleted) {
      earnedXp = baseReward.xp;
      earnedCoins = baseReward.coins;

      // Perfect completion bonus (0 mistakes)
      if (isPerfect || mistakes === 0) {
        earnedXp += 10;
        earnedCoins += 2;
      }

      // Fast completion bonus
      if (isFast) {
        earnedXp += 10;
        earnedCoins += 1;
      }

      // Mode Grandmaster Bonus (Clearing Level 10 of a mode)
      if (numLevel === 10) {
        earnedXp += 50;
        earnedCoins += 10;
      }
    }

    // Persist level completion
    await this.recordLevelCompletion(userId, mode, numLevel);

    // Unlock next level sequentially
    const newUnlocked = await this.unlockNextLevel(userId, mode, numLevel);

    // Clear active resume session
    await this.clearActiveSession(userId);

    // Update persistent player stats
    const key = `${BRAIN_BLITZ_STORAGE_KEYS.PLAYER_STATS}${this.getCleanId(userId)}`;
    const currentStats = (await SessionStorage.getItem(key)) || {
      totalXp: 0,
      totalCoins: 0,
      bestScore: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      bestScores: {},
    };

    currentStats.totalXp += earnedXp;
    currentStats.totalCoins += earnedCoins;
    currentStats.gamesPlayed += 1;
    currentStats.gamesWon += 1;
    currentStats.bestScore = Math.max(currentStats.bestScore, score);

    if (!currentStats.bestScores) currentStats.bestScores = {};
    currentStats.bestScores[mode] = Math.max(currentStats.bestScores[mode] || 0, score);

    await SessionStorage.setItem(key, currentStats);

    // Atomically credit user balance in AuthService
    let updatedUser = null;
    if (earnedXp > 0 || earnedCoins > 0) {
      try {
        updatedUser = await AuthService.updateUserBalances(userId, {
          xpDelta: earnedXp,
          coinsDelta: earnedCoins,
        });

        // Record reward transaction
        const transaction = {
          id: `tx_bb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId,
          transactionType: 'GAME_WIN',
          xpAmount: earnedXp,
          coinAmount: earnedCoins,
          gameDifficulty: numLevel,
          gameId: `brain_blitz_${mode}`,
          transactionDate: new Date().toISOString(),
          transactionStatus: 'COMPLETED',
        };
        await GamingActivityService.recordTransaction(userId, transaction);
      } catch (err) {
        console.warn('Failed to update PIXO balances for Brain Blitz:', err);
      }
    }

    // Update daily objectives tracking for completed game
    try {
      const completionEventId = `bb_${mode}_lvl${numLevel}_${Date.now()}`;
      await GamingActivityService.recordGameCompletion(userId, {
        gameId: `brain_blitz_${mode}`,
        eventId: completionEventId,
        won: true,
      });
    } catch (e) {
      console.warn('Failed to update daily objectives from Brain Blitz:', e);
    }

    return {
      mode,
      level: numLevel,
      alreadyCompleted,
      xpAwarded: earnedXp,
      coinsAwarded: earnedCoins,
      baseXp: baseReward.xp,
      baseCoins: baseReward.coins,
      isPerfect,
      newUnlockedLevel: newUnlocked,
      score,
      durationSeconds,
      updatedUser,
    };
  },
};

export default BrainBlitzPersistenceService;

