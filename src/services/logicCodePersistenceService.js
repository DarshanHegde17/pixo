/**
 * PIXO CYBER STRIKE: 2099 — LOGIC CODE
 * Persistence, Level Progression & Economy Integration Service
 * 
 * Manages:
 * 1. 40-Level sequential progression & category unlocks.
 * 2. Unfinished game state save & resume.
 * 3. Atomic reward claims and deduplication via AuthService & GamingActivityService.
 * 4. Comprehensive statistics tracking for Progress Dashboard.
 */

import { SessionStorage } from './sessionStorage.js';
import { AuthService } from './authService.js';
import { GamingActivityService } from './gamingActivityService.js';
import { isValidOperatorSolution } from './logicCodeQuestionService.js';

export const LOGIC_CODE_STORAGE_KEYS = {
  UNLOCKED_LEVEL: '@pixo_logic_code_unlocked_level_',
  COMPLETED_LEVELS: '@pixo_logic_code_completed_levels_',
  ACTIVE_SESSION: '@pixo_logic_code_active_session_',
  PLAYER_STATS: '@pixo_logic_code_player_stats_',
  QUIZ_RESULTS: '@pixo_logic_code_quiz_results_',
};

export const LOGIC_CODE_BADGES = {
  PATTERN_MASTER: {
    id: 'badge_pattern_master',
    title: 'Pattern Hacker',
    desc: 'Conquered all 10 Pattern Recognition sequence levels.',
    icon: 'git-commit',
    color: '#39FF14',
    levelRequirement: 10,
  },
  NUMBER_MASTER: {
    id: 'badge_number_master',
    title: 'Number Sleuth',
    desc: 'Mastered all 10 Number Intelligence classification levels.',
    icon: 'finger-print',
    color: '#00E5FF',
    levelRequirement: 20,
  },
  ROOT_MASTER: {
    id: 'badge_root_master',
    title: 'Quantum Rooter',
    desc: 'Cleared all 10 Root & Power calculation levels.',
    icon: 'flash',
    color: '#FFD700',
    levelRequirement: 30,
  },
  OPERATOR_MASTER: {
    id: 'badge_operator_master',
    title: 'Operator Architect',
    desc: 'Solved all 10 Missing Operator BODMAS challenges.',
    icon: 'calculator',
    color: '#FF6A00',
    levelRequirement: 40,
  },
  LOGIC_MASTER: {
    id: 'badge_logic_master',
    title: 'LOGIC MASTER',
    desc: 'Ultimate Champion: Conquered all 40 levels of Logic Code!',
    icon: 'trophy',
    color: '#FF3B30',
    levelRequirement: 40,
  },
};

export const LogicCodePersistenceService = {
  // Helper to normalize user ID
  getCleanId(userId = 'guest') {
    return String(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
  },

  /**
   * Retrieves the current highest unlocked level for the user (1–40).
   * Level 1 is always unlocked by default.
   */
  async getUnlockedLevel(userId = 'guest') {
    const key = `${LOGIC_CODE_STORAGE_KEYS.UNLOCKED_LEVEL}${this.getCleanId(userId)}`;
    const stored = await SessionStorage.getItem(key);
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : Math.min(40, parsed);
  },

  /**
   * Unlocks level completedLevel + 1 sequentially up to 40.
   */
  async unlockNextLevel(userId = 'guest', completedLevel = 1) {
    const current = await this.getUnlockedLevel(userId);
    const nextLevel = Math.min(40, Math.max(current, completedLevel + 1));
    const key = `${LOGIC_CODE_STORAGE_KEYS.UNLOCKED_LEVEL}${this.getCleanId(userId)}`;
    await SessionStorage.setItem(key, nextLevel);
    return nextLevel;
  },

  /**
   * Retrieves list/set of all completed levels.
   */
  async getCompletedLevels(userId = 'guest') {
    const key = `${LOGIC_CODE_STORAGE_KEYS.COMPLETED_LEVELS}${this.getCleanId(userId)}`;
    const stored = await SessionStorage.getItem(key);
    return Array.isArray(stored) ? stored : [];
  },

  /**
   * Checks whether a specific category is unlocked for this user.
   */
  async isCategoryUnlocked(userId = 'guest', categoryIdOrIndex) {
    const unlockedLevel = await this.getUnlockedLevel(userId);
    if (typeof categoryIdOrIndex === 'number') {
      const minLevels = [1, 11, 21, 31];
      const targetMin = minLevels[categoryIdOrIndex] || 1;
      return unlockedLevel >= targetMin;
    }
    const gateMap = {
      pattern_recognition: 1,
      category_1: 1,
      number_intelligence: 11,
      category_2: 11,
      root_power: 21,
      root_and_power: 21,
      category_3: 21,
      missing_operator: 31,
      category_4: 31,
    };
    const required = gateMap[categoryIdOrIndex] || 1;
    return unlockedLevel >= required;
  },

  /**
   * Checks whether a specific level has already been cleared by this user.
   */
  async isLevelCompleted(userId = 'guest', level = 1) {
    const list = await this.getCompletedLevels(userId);
    return list.includes(Number(level));
  },

  /**
   * Records successful completion of a level.
   */
  async recordLevelCompletion(userId = 'guest', level = 1) {
    const list = await this.getCompletedLevels(userId);
    const num = Number(level);
    if (!list.includes(num)) {
      list.push(num);
      const key = `${LOGIC_CODE_STORAGE_KEYS.COMPLETED_LEVELS}${this.getCleanId(userId)}`;
      await SessionStorage.setItem(key, list);
    }
    return list;
  },

  /**
   * Saves an unfinished game session (for Save & Resume).
   */
  async saveActiveSession(userId = 'guest', sessionData) {
    const key = `${LOGIC_CODE_STORAGE_KEYS.ACTIVE_SESSION}${this.getCleanId(userId)}`;
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
    const key = `${LOGIC_CODE_STORAGE_KEYS.ACTIVE_SESSION}${this.getCleanId(userId)}`;
    const session = await SessionStorage.getItem(key);
    if (session && (session.status === 'in_progress' || session.level)) {
      return session;
    }
    return null;
  },

  /**
   * Clears active session once completed, abandoned, or dismissed.
   */
  async clearActiveSession(userId = 'guest') {
    const key = `${LOGIC_CODE_STORAGE_KEYS.ACTIVE_SESSION}${this.getCleanId(userId)}`;
    await SessionStorage.removeItem(key);
  },

  /**
   * Alias for getStats
   */
  async getPlayerStats(userId = 'guest') {
    return this.getStats(userId);
  },

  /**
   * Retrieves overall player statistics for the Progress Dashboard.
   */
  async getStats(userId = 'guest') {
    const key = `${LOGIC_CODE_STORAGE_KEYS.PLAYER_STATS}${this.getCleanId(userId)}`;
    const stored = (await SessionStorage.getItem(key)) || {};
    const unlockedLevel = await this.getUnlockedLevel(userId);
    const completedLevels = await this.getCompletedLevels(userId);

    const totalQuestions = stored.totalQuestions || 0;
    const totalCorrect = stored.totalCorrect || 0;
    const totalIncorrect = stored.totalIncorrect || 0;
    const totalXp = stored.totalXp || 0;
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 100;
    const totalSolvingTime = stored.totalSolvingTimeSeconds || 0;
    const avgTime = totalQuestions > 0 ? Math.round(totalSolvingTime / totalQuestions) : 0;

    // Calculate category breakdown
    const cat1Completed = completedLevels.filter((lvl) => lvl >= 1 && lvl <= 10).length;
    const cat2Completed = completedLevels.filter((lvl) => lvl >= 11 && lvl <= 20).length;
    const cat3Completed = completedLevels.filter((lvl) => lvl >= 21 && lvl <= 30).length;
    const cat4Completed = completedLevels.filter((lvl) => lvl >= 31 && lvl <= 40).length;

    // Determine earned badges
    const badges = [];
    if (cat1Completed >= 10) badges.push(LOGIC_CODE_BADGES.PATTERN_MASTER);
    if (cat2Completed >= 10) badges.push(LOGIC_CODE_BADGES.NUMBER_MASTER);
    if (cat3Completed >= 10) badges.push(LOGIC_CODE_BADGES.ROOT_MASTER);
    if (cat4Completed >= 10) badges.push(LOGIC_CODE_BADGES.OPERATOR_MASTER);
    if (completedLevels.length >= 40) badges.push(LOGIC_CODE_BADGES.LOGIC_MASTER);

    return {
      unlockedLevel,
      completedLevelsCount: completedLevels.length,
      completedLevels,
      totalQuestions,
      totalCorrect,
      totalIncorrect,
      accuracy,
      averageSolvingTimeSeconds: avgTime,
      totalXp,
      categoryProgress: {
        pattern_recognition: cat1Completed,
        number_intelligence: cat2Completed,
        root_power: cat3Completed,
        missing_operator: cat4Completed,
      },
      badges,
    };
  },

  /**
   * Updates player stats after answering questions or finishing a level.
   */
  async recordQuestionAttempt(userId = 'guest', { isCorrect, timeSeconds = 5, xpEarned = 0 }) {
    const key = `${LOGIC_CODE_STORAGE_KEYS.PLAYER_STATS}${this.getCleanId(userId)}`;
    const current = (await SessionStorage.getItem(key)) || {
      totalQuestions: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      totalXp: 0,
      totalSolvingTimeSeconds: 0,
    };

    current.totalQuestions = (current.totalQuestions || 0) + 1;
    if (isCorrect) {
      current.totalCorrect = (current.totalCorrect || 0) + 1;
    } else {
      current.totalIncorrect = (current.totalIncorrect || 0) + 1;
    }
    current.totalXp = (current.totalXp || 0) + (xpEarned || 0);
    current.totalSolvingTimeSeconds = (current.totalSolvingTimeSeconds || 0) + (timeSeconds || 5);

    await SessionStorage.setItem(key, current);
    return current;
  },

  /**
   * Finalizes a completed Logic Code Level:
   * - Validates whether already completed (deduplication)
   * - Calculates rewards:
   *    * Base: 20 XP on level completion
   *    * Perfect bonus: +10 XP + 5 Coins if 5/5 correct
   *    * Question XP already accumulated during play
   * - Unlocks Level N + 1
   * - Updates PIXO user balances & saves database transaction
   */
  async completeLevel(userId, level, { correctCount, totalQuestions, score, durationSeconds, earnedQuestionXp = 0 }) {
    if (!userId) throw new Error('User authentication required.');

    const numLevel = Number(level);
    const alreadyCompleted = await this.isLevelCompleted(userId, numLevel);

    // Compute completion rewards
    let completionXp = 0;
    let completionCoins = 0;
    const isPerfect = correctCount === totalQuestions;

    if (!alreadyCompleted) {
      completionXp = 20; // 20 XP on completing level
      if (isPerfect) {
        completionXp += 10; // Perfect bonus
        completionCoins += 5; // Perfect coin bonus
      }

      // Check category completion bonus
      if (numLevel === 10 || numLevel === 20 || numLevel === 30) {
        completionXp += 50;
        completionCoins += 10;
      } else if (numLevel === 40) {
        completionXp += 200; // Grandmaster Logic Code bonus!
        completionCoins += 50;
      }
    }

    const totalXpAwarded = alreadyCompleted ? 0 : earnedQuestionXp + completionXp;
    const totalCoinsAwarded = alreadyCompleted ? 0 : completionCoins;

    // Record persistent level completion
    await this.recordLevelCompletion(userId, numLevel);

    // Unlock next level sequentially
    const newUnlocked = await this.unlockNextLevel(userId, numLevel);

    // Clear active resume session
    await this.clearActiveSession(userId);

    // Update PIXO user wallet & balances atomically
    let updatedUser = null;
    if (totalXpAwarded > 0 || totalCoinsAwarded > 0) {
      try {
        updatedUser = await AuthService.updateUserBalances(userId, {
          xpDelta: totalXpAwarded,
          coinsDelta: totalCoinsAwarded,
        });

        // Record reward transaction in database
        const transaction = {
          id: `tx_logic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId,
          transactionType: 'GAME_WIN',
          xpAmount: totalXpAwarded,
          coinAmount: totalCoinsAwarded,
          gameDifficulty: Math.ceil(numLevel / 4),
          gameId: 'cyber_strike_logic_code',
          transactionDate: new Date().toISOString(),
          transactionStatus: 'COMPLETED',
        };
        await GamingActivityService.recordTransaction(userId, transaction);
      } catch (err) {
        console.warn('Failed to update PIXO balances for Logic Code:', err);
      }
    }

    // Record activity in general GamingActivityService to advance daily streak!
    try {
      const sess = await GamingActivityService.startSession(userId, {
        id: `cs_logic_lvl${numLevel}`,
        title: `Cyber Strike: 2099 — Logic Code Level ${numLevel}`,
        category: 'Logic Code Challenge',
        icon: 'calculator',
      });
      await GamingActivityService.completeSession(userId, sess.id, {
        difficulty: Math.ceil(numLevel / 4),
        score: score || 5000,
        durationSeconds: durationSeconds || 60,
        result: isPerfect ? 'Flawless Victory — Level Cleared' : 'Victory — Level Cleared',
        achievements: isPerfect ? ['Logic Code Flawless'] : ['Logic Code Finisher'],
      });
    } catch (e) {
      console.warn('Failed to record GamingActivity session for Logic Code:', e);
    }

    // Refresh overall stats
    const stats = await this.getStats(userId);

    return {
      success: true,
      level: numLevel,
      alreadyCompleted,
      unlockedLevel: newUnlocked,
      xpAwarded: totalXpAwarded,
      coinsAwarded: totalCoinsAwarded,
      isPerfect,
      user: updatedUser,
      stats,
    };
  },

  /**
   * Saves a quiz result report for a specific level.
   * Maintains history of level results while allowing re-attempts.
   */
  async saveQuizResult(userId = 'guest', level = 1, resultData) {
    const key = `${LOGIC_CODE_STORAGE_KEYS.QUIZ_RESULTS}${this.getCleanId(userId)}`;
    const allResults = (await SessionStorage.getItem(key)) || {};
    allResults[Number(level)] = {
      ...resultData,
      level: Number(level),
      updatedAt: new Date().toISOString(),
    };
    await SessionStorage.setItem(key, allResults);
    return allResults[Number(level)];
  },

  /**
   * Retrieves the saved quiz result report for a specific level.
   */
  async getLevelQuizResult(userId = 'guest', level = 1) {
    const key = `${LOGIC_CODE_STORAGE_KEYS.QUIZ_RESULTS}${this.getCleanId(userId)}`;
    const allResults = (await SessionStorage.getItem(key)) || {};
    return allResults[Number(level)] || null;
  },

  /**
   * Retrieves all saved quiz results for the user.
   */
  async getAllQuizResults(userId = 'guest') {
    const key = `${LOGIC_CODE_STORAGE_KEYS.QUIZ_RESULTS}${this.getCleanId(userId)}`;
    return (await SessionStorage.getItem(key)) || {};
  },

  /**
   * Evaluates a full quiz submission for Cyber Strike: 2099.
   * 
   * Strict MASTER PROMPT Evaluation Rules:
   * 1. Evaluates all questions in the level.
   * 2. Empty or unanswered questions strictly count as incorrect.
   * 3. Score Percentage = (Correct Answers / Total Questions) × 100.
   * 4. Pass/Fail Rule:
   *    - Score Percentage > 50%: PASS (Level completed, next level unlocked).
   *    - Score Percentage <= 50%: FAIL (Next level remains LOCKED, level progression unchanged).
   * 5. Saves independent quiz report with question-wise answer debrief.
   */
  async processQuizSubmission(userId = 'guest', level = 1, {
    questions = [],
    selectedAnswers = {},
    placedOperatorsByQ = {},
    durationSeconds = 60,
  }) {
    if (!userId) throw new Error('User authentication required.');
    const numLevel = Number(level);
    const totalQuestions = questions.length;
    if (totalQuestions === 0) {
      throw new Error('Cannot evaluate empty quiz.');
    }

    const answersReview = [];
    let correctCount = 0;

    for (let i = 0; i < totalQuestions; i++) {
      const q = questions[i];
      let isCorrect = false;
      let givenAnswer = null;
      let correctAnswerStr = '';

      if (q.type === 'missing_operator' || q.isOperatorPuzzle) {
        const ops = placedOperatorsByQ[i] || [];
        const expectedCount = q.opCount || (q.numbers ? q.numbers.length - 1 : 0);
        const hasMissing = ops.length < expectedCount || ops.slice(0, expectedCount).some((o) => !o);

        correctAnswerStr = q.correctAnswer || (Array.isArray(q.validSolutions) && q.validSolutions[0] ? q.validSolutions[0].join('  ') : 'Valid Operator Combination');

        if (hasMissing) {
          isCorrect = false;
          givenAnswer = ops.filter(Boolean).length > 0 ? ops.map((o) => o || '?').join('  ') : '(No Answer)';
        } else {
          const opMap = { '+': '+', '−': '-', '×': '*', '÷': '/' };
          const mathOps = ops.slice(0, expectedCount).map((op) => opMap[op] || op);
          isCorrect = isValidOperatorSolution(q.numbers, mathOps, q.targetNumber || q.target);
          givenAnswer = ops.slice(0, expectedCount).join('  ');
        }
      } else {
        const choice = selectedAnswers[i];
        correctAnswerStr = String(q.correctAnswer ?? '');

        if (choice === null || choice === undefined || String(choice).trim() === '') {
          isCorrect = false;
          givenAnswer = '(No Answer)';
        } else {
          isCorrect = String(choice).trim() === String(q.correctAnswer).trim();
          givenAnswer = String(choice);
        }
      }

      if (isCorrect) correctCount++;

      answersReview.push({
        questionIdx: i,
        index: i + 1,
        prompt: q.questionText || q.prompt || q.title || `Question ${i + 1}`,
        givenAnswer,
        correctAnswer: correctAnswerStr,
        isCorrect,
        explanation: q.explanation || 'Review the mathematical rules for this problem.',
        hint: q.hint || '',
      });
    }

    const incorrectCount = totalQuestions - correctCount;
    // Score Percentage = (Correct Answers / Total Questions) × 100
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    // Exact Rule: MORE THAN 50% = PASS, 50% or below = FAIL
    const isPass = scorePercentage > 50;
    const isFail = !isPass;
    const status = isPass ? 'PASS' : 'FAIL';

    // Base score calculation
    const baseScore = correctCount * 1000;
    const timeBonus = Math.max(0, 150 - Number(durationSeconds || 60)) * 10;
    const score = isPass ? baseScore + timeBonus : baseScore;

    let unlockedLevel = await this.getUnlockedLevel(userId);
    let xpAwarded = 0;
    let coinsAwarded = 0;
    let completionDetails = null;

    if (isPass) {
      // PASS: Level cleared! Unlock next level and record level completion
      completionDetails = await this.completeLevel(userId, numLevel, {
        correctCount,
        totalQuestions,
        score,
        durationSeconds: durationSeconds || 60,
        earnedQuestionXp: correctCount * 15,
      });
      unlockedLevel = completionDetails.unlockedLevel;
      xpAwarded = completionDetails.xpAwarded;
      coinsAwarded = completionDetails.coinsAwarded;
    } else {
      // FAIL: Next level remains LOCKED! Do NOT increase progression.
      await this.clearActiveSession(userId);
      // Record question attempts for stats
      for (const item of answersReview) {
        await this.recordQuestionAttempt(userId, {
          isCorrect: item.isCorrect,
          timeSeconds: Math.max(1, Math.round((durationSeconds || 60) / totalQuestions)),
          xpEarned: 0,
        });
      }
    }

    const quizReport = {
      level: numLevel,
      scorePercentage,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      totalQuestions,
      status,
      isPass,
      isFail,
      score,
      xpAwarded,
      coinsAwarded,
      unlockedLevel,
      submittedAt: new Date().toISOString(),
      answersReview,
    };

    // Save independent quiz result for this level
    await this.saveQuizResult(userId, numLevel, quizReport);

    return quizReport;
  },
};
