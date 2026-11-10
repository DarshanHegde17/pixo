/**
 * PIXO PATH FINDER - Persistence & Economy Integration Service
 *
 * Handles:
 * - Sequential Stage Unlocking (Stage 1 default, Stages 2-10 unlocked sequentially).
 * - Cloud / Local Save and Resume for unfinished puzzles.
 * - Integration with PIXO XP and Coin Economy (10 XP + 2 Coins up to 100 XP + 20 Coins).
 * - Daily Streak and Objective progression via GamingActivityService.
 */

import { SessionStorage } from './sessionStorage.js';
import { GamingActivityService } from './gamingActivityService.js';
import { PATH_FINDER_STAGES } from './pathFinderService.js';

const STORAGE_KEYS = {
  ACTIVE_SESSION_PREFIX: '@pixo_path_finder_active_session_',
  PROGRESS_PREFIX: '@pixo_path_finder_progress_',
  STATS_PREFIX: '@pixo_path_finder_stats_',
};

export class PathFinderPersistenceService {
  /**
   * Get maximum unlocked stage for user (1..10)
   */
  static async getUnlockedStage(userId) {
    if (!userId) return 1;
    try {
      const key = `${STORAGE_KEYS.PROGRESS_PREFIX}${userId}`;
      const saved = await SessionStorage.getItem(key);
      if (saved) {
        const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
        return Math.max(1, Math.min(10, Number(parsed.unlockedStage) || 1));
      }
      return 1;
    } catch (e) {
      console.warn('Error fetching unlocked stage:', e);
      return 1;
    }
  }

  /**
   * Get array of completed stage IDs for user
   */
  static async getCompletedStages(userId) {
    if (!userId) return [];
    try {
      const key = `${STORAGE_KEYS.PROGRESS_PREFIX}${userId}`;
      const saved = await SessionStorage.getItem(key);
      if (saved) {
        const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
        return Array.isArray(parsed.completedStages) ? parsed.completedStages : [];
      }
      return [];
    } catch (e) {
      console.warn('Error fetching completed stages:', e);
      return [];
    }
  }

  /**
   * Unlock next sequential stage upon completion
   */
  static async unlockNextStage(userId, completedStageId) {
    if (!userId) return 1;
    try {
      const key = `${STORAGE_KEYS.PROGRESS_PREFIX}${userId}`;
      const currentUnlocked = await this.getUnlockedStage(userId);
      const completedList = await this.getCompletedStages(userId);

      const updatedCompleted = Array.from(new Set([...completedList, Number(completedStageId)]));
      const nextStage = Math.max(currentUnlocked, Math.min(10, Number(completedStageId) + 1));

      const payload = {
        unlockedStage: nextStage,
        completedStages: updatedCompleted,
        lastUpdated: new Date().toISOString()
      };

      await SessionStorage.setItem(key, JSON.stringify(payload));
      return nextStage;
    } catch (e) {
      console.warn('Error updating stage progression:', e);
      return completedStageId + 1;
    }
  }

  /**
   * Save unfinished active game session
   */
  static async saveActiveSession(userId, sessionData) {
    if (!userId) return null;
    try {
      const key = `${STORAGE_KEYS.ACTIVE_SESSION_PREFIX}${userId}`;
      const payload = {
        ...sessionData,
        userId,
        timestamp: Date.now(),
        updatedAt: new Date().toISOString()
      };
      await SessionStorage.setItem(key, JSON.stringify(payload));
      return payload;
    } catch (e) {
      console.warn('Error saving active Path Finder session:', e);
      return null;
    }
  }

  /**
   * Get unfinished active game session
   */
  static async getActiveSession(userId) {
    if (!userId) return null;
    try {
      const key = `${STORAGE_KEYS.ACTIVE_SESSION_PREFIX}${userId}`;
      const saved = await SessionStorage.getItem(key);
      if (saved) {
        const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
        // Only consider active if it has a valid stageId
        if (parsed && parsed.stageId) {
          return parsed;
        }
      }
      return null;
    } catch (e) {
      console.warn('Error loading active Path Finder session:', e);
      return null;
    }
  }

  /**
   * Clear unfinished active session
   */
  static async clearActiveSession(userId) {
    if (!userId) return;
    try {
      const key = `${STORAGE_KEYS.ACTIVE_SESSION_PREFIX}${userId}`;
      await SessionStorage.removeItem(key);
    } catch (e) {
      console.warn('Error clearing active Path Finder session:', e);
    }
  }

  /**
   * Get stats for all stages or a specific stage
   */
  static async getStageStats(userId, stageId = null) {
    if (!userId) return stageId ? null : {};
    try {
      const key = `${STORAGE_KEYS.STATS_PREFIX}${userId}`;
      const saved = await SessionStorage.getItem(key);
      const stats = saved ? (typeof saved === 'string' ? JSON.parse(saved) : saved) : {};
      return stageId ? (stats[stageId] || null) : stats;
    } catch (e) {
      console.warn('Error loading stage stats:', e);
      return stageId ? null : {};
    }
  }

  /**
   * Record Stage Completion & Process PIXO Economy Rewards:
   * - Connects to GamingActivityService to award XP & Coins based on exact prompt values.
   * - Unlocks next sequential stage.
   * - Records personal best moves & time.
   * - Clears saved unfinished session.
   */
  static async recordStageCompletion(userId, stageId, { moves, timerSeconds, hintsUsed, path }) {
    if (!userId) throw new Error('User authentication required.');

    const stageConfig = PATH_FINDER_STAGES.find((s) => s.id === Number(stageId)) || PATH_FINDER_STAGES[0];
    const completedStages = await this.getCompletedStages(userId);
    const isFirstTime = !completedStages.includes(Number(stageId));

    // 1. Dispatch through GamingActivityService for full backend integration
    let sessionResult = null;
    try {
      const gamingSession = await GamingActivityService.startSession(userId, {
        id: 'g_path_finder',
        title: 'Path Finder',
        category: 'Brain Training • Logical Path Puzzle',
        mode: stageConfig.modeName,
        icon: 'git-merge',
        difficulty: stageConfig.id
      });

      sessionResult = await GamingActivityService.completeSession(userId, gamingSession.id, {
        result: 'Victory - Stage Cleared',
        difficulty: stageConfig.id,
        durationSeconds: Math.max(5, timerSeconds),
        score: Math.max(500, 5000 - moves * 50 - timerSeconds * 10),
        won: true,
        achievements: [
          `Cleared ${stageConfig.name}: ${stageConfig.title}`,
          moves <= stageConfig.maxMoves ? 'Master Path' : 'Path Completed'
        ]
      });
    } catch (gamingErr) {
      console.warn('GamingActivityService completion error:', gamingErr);
    }

    // 2. Unlock next stage sequentially
    const nextUnlockedStage = await this.unlockNextStage(userId, stageId);

    // 3. Update personal best stats
    try {
      const statsKey = `${STORAGE_KEYS.STATS_PREFIX}${userId}`;
      const existingStats = await this.getStageStats(userId);
      const prev = existingStats[stageId] || null;

      const stars = moves <= (stageConfig.maxMoves - 2) ? 3 : (moves <= stageConfig.maxMoves ? 2 : 1);
      const updatedStageStat = {
        stageId: Number(stageId),
        stars: prev ? Math.max(prev.stars, stars) : stars,
        bestMoves: prev ? Math.min(prev.bestMoves, moves) : moves,
        bestTime: prev ? Math.min(prev.bestTime, timerSeconds) : timerSeconds,
        hintsUsed: Math.min(hintsUsed || 0, prev ? prev.hintsUsed : (hintsUsed || 0)),
        completedAt: new Date().toISOString()
      };

      existingStats[stageId] = updatedStageStat;
      await SessionStorage.setItem(statsKey, JSON.stringify(existingStats));
    } catch (statsErr) {
      console.warn('Stats persistence error:', statsErr);
    }

    // 4. Clear active session since puzzle is solved
    await this.clearActiveSession(userId);

    // 5. Compute rewarded XP & Coins
    const xpAwarded = isFirstTime ? stageConfig.rewardXp : 0;
    const coinsAwarded = isFirstTime ? stageConfig.rewardCoins : 0;

    return {
      success: true,
      stageId: Number(stageId),
      nextUnlockedStage,
      isFirstTime,
      xpAwarded,
      coinsAwarded,
      moves,
      timerSeconds,
      sessionResult
    };
  }
}
