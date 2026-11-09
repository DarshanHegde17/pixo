/**
 * PIXO: 8-BIT PIXEL KINGDOM ADVENTURE
 * Persistence, Sequential Level Progression & Economy Integration Service
 * 
 * Manages:
 * 1. Sequential 10-level progression (Level 1 unlocked by default, Level 10 Final Dragon Battle).
 * 2. Unfinished mission cloud save and resume (player position, health, coins, score, progress).
 * 3. High scores, completion records, best times.
 * 4. Difficulty-based XP and Coin rewards directly connected to AuthService & GamingActivityService.
 * 5. Sound preferences.
 */

import { SessionStorage } from './sessionStorage.js';
import { AuthService } from './authService.js';
import { GamingActivityService } from './gamingActivityService.js';

export const PIXEL_KINGDOM_LEVELS = [
  {
    level: 1,
    title: 'The Forgotten Forest',
    subtitle: 'Whispering Pixel Woods',
    difficulty: 'Easy',
    difficultyColor: '#39FF14',
    badge: 'STAGE 01',
    accentColor: '#39FF14',
    bgTheme: 'forest',
    objective: 'Collect 8 Forest Coins & reach the Ancient Wooden Gate',
    targetCoins: 8,
    targetEnemies: 4,
    boss: null,
    rewardXp: 50,
    rewardCoins: 20,
    desc: 'Lush green pixel canopy with wooden bridges, moving platforms, slime creatures, and ground spikes.',
  },
  {
    level: 2,
    title: 'The Broken Kingdom',
    subtitle: 'Ruins of the Fallen Throne',
    difficulty: 'Easy',
    difficultyColor: '#39FF14',
    badge: 'STAGE 02',
    accentColor: '#39FF14',
    bgTheme: 'ruins',
    objective: 'Defeat 5 Skeleton Warriors & cross the Broken Chasm',
    targetCoins: 10,
    targetEnemies: 5,
    boss: null,
    rewardXp: 60,
    rewardCoins: 25,
    desc: 'Crumbling stone pillars, falling stones, dangerous chasms, and patrolling skeleton swordsmen.',
  },
  {
    level: 3,
    title: 'Castle of Shadows',
    subtitle: 'Sanctum of the Dark Blade',
    difficulty: 'Normal',
    difficultyColor: '#00E5FF',
    badge: 'BOSS BATTLE 1',
    isBossLevel: true,
    accentColor: '#00E5FF',
    bgTheme: 'shadow_castle',
    objective: 'Infiltrate the dark castle & DEFEAT THE SHADOW KNIGHT!',
    targetCoins: 12,
    targetEnemies: 4,
    boss: {
      name: 'Shadow Knight',
      title: 'Blade of the Abyss',
      maxHp: 150,
      color: '#A855F7',
      phases: 2,
    },
    rewardXp: 100,
    rewardCoins: 50,
    desc: 'Obsidian ramparts, moving trap platforms, phantom specters, and the formidable Shadow Knight boss.',
  },
  {
    level: 4,
    title: 'The Underground Dungeon',
    subtitle: 'Depths of the Iron Bastion',
    difficulty: 'Normal',
    difficultyColor: '#00E5FF',
    badge: 'STAGE 04',
    accentColor: '#00E5FF',
    bgTheme: 'dungeon',
    objective: 'Find the Royal Dungeon Key & slay 6 Flying Bats',
    targetCoins: 12,
    targetEnemies: 6,
    boss: null,
    rewardXp: 75,
    rewardCoins: 30,
    desc: 'Red brick catacombs, bubbling lava pits, swinging pendulum blades, and fluttering vampire bats.',
  },
  {
    level: 5,
    title: "Dragon's Mountain",
    subtitle: 'Crags of the Fire Drake',
    difficulty: 'Hard',
    difficultyColor: '#FF8A00',
    badge: 'BOSS BATTLE 2',
    isBossLevel: true,
    accentColor: '#FF8A00',
    bgTheme: 'volcano',
    objective: 'Scale the volcanic peaks & DEFEAT THE FIRE DRAKE!',
    targetCoins: 15,
    targetEnemies: 5,
    boss: {
      name: 'Fire Drake',
      title: 'Scourge of the Volcanic Peak',
      maxHp: 250,
      color: '#FF4400',
      phases: 2,
    },
    rewardXp: 125,
    rewardCoins: 60,
    desc: 'Jagged magma crags, rolling volcanic boulders, flame spirits, and the aerial Fire Drake boss.',
  },
  {
    level: 6,
    title: 'The Lost Royal City',
    subtitle: 'Avenues of Marble & Dust',
    difficulty: 'Hard',
    difficultyColor: '#FF8A00',
    badge: 'STAGE 06',
    accentColor: '#FF8A00',
    bgTheme: 'royal_city',
    objective: 'Retrieve 12 Royal Relics & eliminate 6 Goblin Raiders',
    targetCoins: 12,
    targetEnemies: 6,
    boss: null,
    rewardXp: 100,
    rewardCoins: 40,
    desc: 'Colonnades of ancient marble, high towers, goblin raiders, bouncing awnings, and dart traps.',
  },
  {
    level: 7,
    title: 'The Dark Fortress',
    subtitle: 'Citadel of the Black Guard',
    difficulty: 'Hard',
    difficultyColor: '#FF8A00',
    badge: 'STAGE 07',
    accentColor: '#FF8A00',
    bgTheme: 'dark_fortress',
    objective: 'Breach the inner fortress & eliminate 8 Armored Guards',
    targetCoins: 15,
    targetEnemies: 8,
    boss: null,
    rewardXp: 120,
    rewardCoins: 45,
    desc: 'Heavily fortified ramparts, armored skeleton champions, double pendulum traps, and crushing iron gates.',
  },
  {
    level: 8,
    title: 'The Crystal Kingdom',
    subtitle: 'Frozen Spires of Amethyst',
    difficulty: 'Master',
    difficultyColor: '#E056FD',
    badge: 'BOSS BATTLE 3',
    isBossLevel: true,
    accentColor: '#E056FD',
    bgTheme: 'crystal',
    objective: 'Shatter the Crystal Barrier & DEFEAT THE CRYSTAL BEHEMOTH!',
    targetCoins: 18,
    targetEnemies: 5,
    boss: {
      name: 'Crystal Behemoth',
      title: 'Living Amethyst Colossus',
      maxHp: 350,
      color: '#C084FC',
      phases: 3,
    },
    rewardXp: 150,
    rewardCoins: 80,
    desc: 'Gleaming crystal ledges, falling razor icicles, crystal golems, and the monolithic Crystal Behemoth.',
  },
  {
    level: 9,
    title: 'The Cursed Castle',
    subtitle: 'Hall of the Necrotic Curse',
    difficulty: 'Master',
    difficultyColor: '#E056FD',
    badge: 'STAGE 09',
    accentColor: '#E056FD',
    bgTheme: 'cursed',
    objective: 'Cleanse 10 Cursed Souls & unlock the Dragon Sanctum',
    targetCoins: 20,
    targetEnemies: 10,
    boss: null,
    rewardXp: 140,
    rewardCoins: 60,
    desc: 'Purple spectral fog, vanishing phantom platforms, acid cauldrons, and demonic gargoyles.',
  },
  {
    level: 10,
    title: 'The Final Dragon Battle',
    subtitle: 'The Lair of the Ancient Dragon',
    difficulty: 'Legendary',
    difficultyColor: '#FFD700',
    badge: 'FINAL DRAGON BATTLE',
    isBossLevel: true,
    accentColor: '#FFD700',
    bgTheme: 'dragon_throne',
    objective: 'DEFEAT THE ANCIENT RED DRAGON & RECLAIM THE PIXEL CROWN!',
    targetCoins: 25,
    targetEnemies: 1,
    boss: {
      name: 'The Ancient Red Dragon',
      title: 'Scourge of the Pixel Kingdom',
      maxHp: 500,
      color: '#EF4444',
      phases: 3,
    },
    rewardXp: 250,
    rewardCoins: 150,
    desc: 'The climax of the quest. A vast volcanic throne over a boiling lava lake against the legendary dragon.',
  },
];

export const PIXEL_KINGDOM_STORAGE_KEYS = {
  UNLOCKED_LEVEL: '@pixo_pk_unlocked_', // + userId
  COMPLETED_LEVELS: '@pixo_pk_completed_', // + userId
  HIGH_SCORES: '@pixo_pk_scores_', // + userId
  ACTIVE_SESSION: '@pixo_pk_active_session_', // + userId
  SOUND_ENABLED: '@pixo_pk_sound_enabled',
};

export const PixelKingdomPersistenceService = {
  getCleanId(userId = 'guest') {
    return String(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
  },

  /**
   * Sound preferences
   */
  async isSoundEnabled() {
    const val = await SessionStorage.getItem(PIXEL_KINGDOM_STORAGE_KEYS.SOUND_ENABLED);
    return val !== false && val !== 'false';
  },

  async setSoundEnabled(enabled) {
    await SessionStorage.setItem(PIXEL_KINGDOM_STORAGE_KEYS.SOUND_ENABLED, Boolean(enabled));
    return Boolean(enabled);
  },

  /**
   * Sequential level unlocking: Level 1 is unlocked by default.
   * Returns current highest unlocked level (1–10).
   */
  async getUnlockedLevel(userId = 'guest') {
    const key = `${PIXEL_KINGDOM_STORAGE_KEYS.UNLOCKED_LEVEL}${this.getCleanId(userId)}`;
    const stored = await SessionStorage.getItem(key);
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : Math.min(10, parsed);
  },

  /**
   * Unlocks level completedLevel + 1 sequentially up to 10.
   */
  async unlockNextLevel(userId = 'guest', completedLevel = 1) {
    const current = await this.getUnlockedLevel(userId);
    const nextLevel = Math.min(10, Math.max(current, completedLevel + 1));
    const key = `${PIXEL_KINGDOM_STORAGE_KEYS.UNLOCKED_LEVEL}${this.getCleanId(userId)}`;
    await SessionStorage.setItem(key, nextLevel);
    return nextLevel;
  },

  /**
   * Retrieves list of completed levels.
   */
  async getCompletedLevels(userId = 'guest') {
    const key = `${PIXEL_KINGDOM_STORAGE_KEYS.COMPLETED_LEVELS}${this.getCleanId(userId)}`;
    const stored = await SessionStorage.getItem(key);
    return Array.isArray(stored) ? stored : [];
  },

  /**
   * Checks whether a specific level has been completed.
   */
  async isLevelCompleted(userId = 'guest', level = 1) {
    const list = await this.getCompletedLevels(userId);
    return list.includes(Number(level));
  },

  /**
   * Records successful completion of a level and saves high score.
   */
  async recordLevelCompletion(userId = 'guest', level = 1, score = 0, completionStats = {}) {
    const num = Number(level);
    const cleanId = this.getCleanId(userId);

    // 1. Update completed levels list
    const list = await this.getCompletedLevels(userId);
    if (!list.includes(num)) {
      list.push(num);
      list.sort((a, b) => a - b);
      const cKey = `${PIXEL_KINGDOM_STORAGE_KEYS.COMPLETED_LEVELS}${cleanId}`;
      await SessionStorage.setItem(cKey, list);
    }

    // 2. Unlock next level
    await this.unlockNextLevel(userId, num);

    // 3. Update high scores
    const sKey = `${PIXEL_KINGDOM_STORAGE_KEYS.HIGH_SCORES}${cleanId}`;
    const scores = (await SessionStorage.getItem(sKey)) || {};
    const existing = scores[num] || 0;
    if (score > existing) {
      scores[num] = score;
      await SessionStorage.setItem(sKey, scores);
    }

    return { completedLevels: list, unlockedLevel: Math.min(10, num + 1), bestScore: Math.max(score, existing) };
  },

  /**
   * Retrieves high scores map { [level]: score }
   */
  async getHighScores(userId = 'guest') {
    const sKey = `${PIXEL_KINGDOM_STORAGE_KEYS.HIGH_SCORES}${this.getCleanId(userId)}`;
    const scores = (await SessionStorage.getItem(sKey)) || {};
    return scores;
  },

  /**
   * Retrieves high score for a specific level.
   */
  async getLevelHighScore(userId = 'guest', level = 1) {
    const scores = await this.getHighScores(userId);
    return scores[Number(level)] || 0;
  },

  /**
   * Cloud Save: Saves in-progress unfinished mission state.
   */
  async saveActiveSession(userId = 'guest', sessionData) {
    const key = `${PIXEL_KINGDOM_STORAGE_KEYS.ACTIVE_SESSION}${this.getCleanId(userId)}`;
    const payload = {
      ...sessionData,
      status: 'SAVED',
      savedAt: new Date().toISOString(),
    };
    await SessionStorage.setItem(key, payload);
    return payload;
  },

  /**
   * Retrieves active saved mission if one exists.
   */
  async getActiveSession(userId = 'guest') {
    const key = `${PIXEL_KINGDOM_STORAGE_KEYS.ACTIVE_SESSION}${this.getCleanId(userId)}`;
    const session = await SessionStorage.getItem(key);
    if (session && (session.status === 'SAVED' || session.status === 'in_progress' || session.level)) {
      return session;
    }
    return null;
  },

  /**
   * Clears saved mission once finished or dismissed.
   */
  async clearActiveSession(userId = 'guest') {
    const key = `${PIXEL_KINGDOM_STORAGE_KEYS.ACTIVE_SESSION}${this.getCleanId(userId)}`;
    await SessionStorage.removeItem(key);
  },

  /**
   * Claims verified XP and Coin rewards directly into user account & records gaming session.
   * Leverages existing PIXO difficulty-based economy & duplicate prevention in GamingActivityService.
   */
  async claimLevelRewards(userId, level, score = 0, sessionDuration = 60) {
    if (!userId) return { success: false, error: 'No user authenticated' };

    const levelObj = PIXEL_KINGDOM_LEVELS.find((l) => l.level === Number(level)) || PIXEL_KINGDOM_LEVELS[0];

    try {
      // 1. Register game session in GamingActivityService (counts towards Daily Objectives & Streaks)
      const session = await GamingActivityService.startSession(userId, {
        id: 'g_retro_adv',
        title: 'Pixel Kingdom Adventure',
        category: 'Retro 8-Bit Pixel Quest',
      });

      const compRes = await GamingActivityService.completeSession(userId, session.id, {
        difficulty: levelObj.level,
        won: true,
        result: `Completed Level ${levelObj.level}: ${levelObj.title}`,
        score,
        durationSeconds: sessionDuration,
        level: levelObj.level,
      });

      // 2. Record permanent level completion in persistence
      await this.recordLevelCompletion(userId, level, score, { duration: sessionDuration });

      // 3. Clear saved session
      await this.clearActiveSession(userId);

      return {
        success: true,
        xpAwarded: compRes.xpAwarded || 0,
        coinsAwarded: compRes.coinsAwarded || 0,
        isFirstClear: !compRes.alreadyCompleted,
        level: levelObj.level,
        title: levelObj.title,
      };
    } catch (e) {
      console.error('[PixelKingdomPersistenceService] Error claiming rewards:', e);
      return { success: false, error: e.message || 'Reward dispatch failed' };
    }
  },
};
