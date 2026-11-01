/**
 * PIXO Game Persistence Service
 * 
 * Provides robust cross-platform session persistence, resume functionality,
 * and ground-truth wall-clock timer synchronization for 30-second games in PIXO.
 */

import { SessionStorage } from './sessionStorage.js';

export const GAME_PERSISTENCE_KEYS = {
  ACTIVE_TARGET_GAME_PREFIX: '@pixo_target_game_active_',
  ARCHIVED_GAMES_PREFIX: '@pixo_target_game_archive_',
  UNLOCKED_LEVELS_PREFIX: '@pixo_target_game_unlocked_levels_',
};

export const DEFAULT_TARGET_UNLOCKED_LEVELS = {
  '+': 1,
  '-': 1,
  '*': 1,
  '%': 1,
};

export const GamePersistenceService = {
  /**
   * Generates a safe storage key scoped to the active player ID
   * @param {string} userId
   * @returns {string}
   */
  getStorageKey(userId = 'guest') {
    const cleanId = String(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${GAME_PERSISTENCE_KEYS.ACTIVE_TARGET_GAME_PREFIX}${cleanId}`;
  },

  /**
   * Generates a unique, collision-resistant game session ID
   * @returns {string}
   */
  createSessionId() {
    return `sess_tn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  },

  /**
   * Calculates ground-truth remaining seconds from an absolute endTime timestamp.
   * Prevents timer extension or negative values.
   * 
   * @param {number} endTime - Absolute epoch timestamp in milliseconds
   * @param {number} maxLimit - Upper bound for time limit (e.g. 30 seconds)
   * @returns {number} Seconds remaining (0 to maxLimit)
   */
  calculateRemainingSeconds(endTime, maxLimit = 30) {
    if (!endTime || typeof endTime !== 'number' || isNaN(endTime)) return 0;
    const now = Date.now();
    const diffMs = endTime - now;
    if (diffMs <= 0) return 0;
    const seconds = Math.ceil(diffMs / 1000);
    return Math.max(0, Math.min(maxLimit, seconds));
  },

  /**
   * Checks whether the session's 30-second window has completely elapsed.
   * @param {number} endTime
   * @returns {boolean}
   */
  isSessionExpired(endTime) {
    if (!endTime || typeof endTime !== 'number') return true;
    return Date.now() >= endTime;
  },

  /**
   * Validates integrity of saved game session object
   * @param {any} session
   * @returns {boolean}
   */
  isValidSession(session) {
    if (!session || typeof session !== 'object') return false;
    if (typeof session.sessionId !== 'string' || !session.sessionId) return false;
    if (typeof session.endTime !== 'number' || isNaN(session.endTime)) return false;
    if (!Array.isArray(session.problems) || session.problems.length === 0) return false;
    if (typeof session.currentProblemIdx !== 'number' || session.currentProblemIdx < 0) return false;
    if (typeof session.score !== 'number') return false;
    return true;
  },

  /**
   * Saves an active 30-second game session to persistent storage
   * @param {string} userId
   * @param {object} sessionData
   * @returns {Promise<object>}
   */
  async saveActiveSession(userId, sessionData) {
    const key = this.getStorageKey(userId);
    const payload = {
      ...sessionData,
      updatedAt: new Date().toISOString(),
    };
    await SessionStorage.setItem(key, payload);
    return payload;
  },

  /**
   * Retrieves active game session from persistent storage
   * @param {string} userId
   * @returns {Promise<object | null>}
   */
  async getActiveSession(userId) {
    try {
      const key = this.getStorageKey(userId);
      const data = await SessionStorage.getItem(key);
      if (!data) return null;
      if (!this.isValidSession(data)) {
        // Clean up corrupted or invalid session data
        await this.clearActiveSession(userId);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('GamePersistenceService.getActiveSession error:', err);
      return null;
    }
  },

  /**
   * Updates fields of the active session without overwriting unchanged state
   * @param {string} userId
   * @param {object} partialUpdates
   * @returns {Promise<object | null>}
   */
  async updateActiveSession(userId, partialUpdates) {
    try {
      const current = await this.getActiveSession(userId);
      if (!current) return null;
      const merged = {
        ...current,
        ...partialUpdates,
        updatedAt: new Date().toISOString(),
      };
      await this.saveActiveSession(userId, merged);
      return merged;
    } catch (err) {
      console.warn('GamePersistenceService.updateActiveSession error:', err);
      return null;
    }
  },

  /**
   * Removes active game session upon user completion, reset, or explicit new game
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async clearActiveSession(userId) {
    try {
      const key = this.getStorageKey(userId);
      await SessionStorage.removeItem(key);
    } catch (err) {
      console.warn('GamePersistenceService.clearActiveSession error:', err);
    }
  },

  /**
   * Archives a completed or expired session for history tracking
   * @param {string} userId
   * @param {object} session
   * @returns {Promise<void>}
   */
  async archiveSession(userId, session) {
    try {
      const cleanId = String(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
      const archiveKey = `${GAME_PERSISTENCE_KEYS.ARCHIVED_GAMES_PREFIX}${cleanId}`;
      const existing = (await SessionStorage.getItem(archiveKey)) || [];
      const history = Array.isArray(existing) ? existing : [];
      history.unshift({
        ...session,
        archivedAt: new Date().toISOString(),
      });
      // Retain the 20 most recent sessions
      await SessionStorage.setItem(archiveKey, history.slice(0, 20));
      await this.clearActiveSession(userId);
    } catch (err) {
      console.warn('GamePersistenceService.archiveSession error:', err);
      await this.clearActiveSession(userId);
    }
  },

  /**
   * Generates storage key for unlocked levels scoped to user
   * @param {string} userId
   * @returns {string}
   */
  getUnlockedLevelsKey(userId = 'guest') {
    const cleanId = String(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${GAME_PERSISTENCE_KEYS.UNLOCKED_LEVELS_PREFIX}${cleanId}`;
  },

  /**
   * Retrieves unlocked level progress for each operator for this user.
   * Default is level 1 unlocked; levels 2-10 are locked until preceding level is cleared.
   * @param {string} userId
   * @returns {Promise<object>} e.g. { '+': 1, '-': 1, '*': 1, '%': 1 }
   */
  async getUnlockedLevels(userId = 'guest') {
    try {
      const key = this.getUnlockedLevelsKey(userId);
      const data = await SessionStorage.getItem(key);
      if (!data || typeof data !== 'object') {
        return { ...DEFAULT_TARGET_UNLOCKED_LEVELS };
      }
      return {
        '+': Math.max(1, Math.min(11, parseInt(data['+'], 10) || 1)),
        '-': Math.max(1, Math.min(11, parseInt(data['-'], 10) || 1)),
        '*': Math.max(1, Math.min(11, parseInt(data['*'], 10) || 1)),
        '%': Math.max(1, Math.min(11, parseInt(data['%'], 10) || 1)),
      };
    } catch (err) {
      console.warn('GamePersistenceService.getUnlockedLevels error:', err);
      return { ...DEFAULT_TARGET_UNLOCKED_LEVELS };
    }
  },

  /**
   * Unlocks the subsequent level (up to 10) for the specified operator upon completion.
   * Level 1 completed unlocks Level 2, Level 2 unlocks Level 3, etc.
   * @param {string} userId
   * @param {string} operator ('+', '-', '*', '%')
   * @param {number} completedLevel (1 to 10)
   * @returns {Promise<object>} updated unlocked levels map
   */
  async unlockNextLevel(userId = 'guest', operator = '+', completedLevel = 1) {
    try {
      const current = await this.getUnlockedLevels(userId);
      const op = ['+', '-', '*', '%'].includes(operator) ? operator : '+';
      const nextLevel = Math.min(11, Math.max(1, completedLevel + 1));
      const currentUnlocked = current[op] || 1;
      const updatedUnlocked = Math.max(currentUnlocked, nextLevel);

      const updated = {
        ...current,
        [op]: updatedUnlocked,
      };

      const key = this.getUnlockedLevelsKey(userId);
      await SessionStorage.setItem(key, updated);
      return updated;
    } catch (err) {
      console.warn('GamePersistenceService.unlockNextLevel error:', err);
      return { ...DEFAULT_TARGET_UNLOCKED_LEVELS };
    }
  },
};

export default GamePersistenceService;
