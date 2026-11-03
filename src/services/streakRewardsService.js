/**
 * PIXO STREAK REWARDS STORE SERVICE (7 TO 500 DAYS)
 * 
 * Provides:
 * 1. Configurable 13-tier streak reward catalog (7 to 500 days).
 * 2. Atomic, mutex-locked coin deduction & redemption engine.
 * 3. Prevention of duplicate claims, double-clicks, and negative balances.
 * 4. Milestone progress calculations & timeline tracking.
 * 5. Player reward collection ("My Rewards") & cosmetic equipping.
 * 6. Server-consistent timezone integration (Asia/Kolkata).
 */

import { SessionStorage } from './sessionStorage.js';
import { AuthService } from './authService.js';
import { GamingActivityService, getAppTimezone } from './gamingActivityService.js';

export const STREAK_REWARDS_STORAGE_KEYS = {
  CATALOG: '@pixo_streak_rewards_catalog',
  USER_REDEMPTIONS_PREFIX: '@pixo_user_redeemed_rewards_',
  EQUIPPED_COSMETICS_PREFIX: '@pixo_user_equipped_cosmetics_',
};

/**
 * Standard 13-Tier Reward Milestones specified in Master Prompt Section 2
 */
export const DEFAULT_STREAK_REWARDS = [
  {
    id: 'reward_7d',
    requiredStreak: 7,
    coinCost: 250,
    title: 'PIXO Achievement Badge',
    category: 'Digital Badge',
    type: 'digital',
    cosmeticType: 'badge',
    cosmeticValue: 'PIXO 7-Day Striker',
    icon: 'ribbon-outline',
    description: 'Exclusive commemorative player badge awarded for maintaining a 7-day tactical streak.',
    rarity: 'Common',
    isExclusive: false,
    accentColor: '#39FF14', // Neon Green
    gradient: ['#0A2A14', '#041408'],
    physicalClaimable: false,
  },
  {
    id: 'reward_14d',
    requiredStreak: 14,
    coinCost: 500,
    title: 'Premium Profile Frame',
    category: 'Avatar Cosmetic',
    type: 'digital',
    cosmeticType: 'frame',
    cosmeticValue: 'Neon Pulse Cyber Frame',
    icon: 'scan-outline',
    description: 'Luminescent neon avatar border to showcase your dedication across the PIXO community.',
    rarity: 'Uncommon',
    isExclusive: false,
    accentColor: '#00E5FF', // Electric Blue
    gradient: ['#051F2A', '#020F16'],
    physicalClaimable: false,
  },
  {
    id: 'reward_25d',
    requiredStreak: 25,
    coinCost: 1000,
    title: 'PIXO Water Bottle',
    category: 'Gear & Swag',
    type: 'virtual_physical',
    icon: 'water-outline',
    description: 'Matte black double-insulated gaming flask with engraved neon PIXO insignia.',
    rarity: 'Rare',
    isExclusive: false,
    accentColor: '#00E5FF',
    gradient: ['#07242B', '#021217'],
    physicalClaimable: false,
  },
  {
    id: 'reward_50d',
    requiredStreak: 50,
    coinCost: 1000,
    title: 'PIXO Coffee Cup',
    category: 'Drinkware',
    type: 'virtual_physical',
    icon: 'cafe-outline',
    description: 'Ceramic cyberpunk brew mug with thermal color-changing grid pattern.',
    rarity: 'Rare',
    isExclusive: false,
    accentColor: '#39FF14',
    gradient: ['#0D2B14', '#041508'],
    physicalClaimable: false,
  },
  {
    id: 'reward_75d',
    requiredStreak: 75,
    coinCost: 3000,
    title: 'PIXO Gaming Cap',
    category: 'Headwear',
    type: 'virtual_physical',
    icon: 'baseball-outline',
    description: 'Structured snapback cap with 3D rubberized PIXO patch and reflective neon underbill.',
    rarity: 'Epic',
    isExclusive: false,
    accentColor: '#FF9500',
    gradient: ['#2B1A05', '#140D02'],
    physicalClaimable: false,
  },
  {
    id: 'reward_100d',
    requiredStreak: 100,
    coinCost: 5000,
    title: 'PIXO T-Shirt',
    category: 'Apparel',
    type: 'virtual_physical',
    icon: 'shirt-outline',
    description: 'Century Club premium cotton t-shirt with holographic geometric circuitry graphics.',
    rarity: 'Legendary',
    isExclusive: true, // Master Prompt Section 9: 100-day exclusive visual treatment
    accentColor: '#FFD700', // Gold
    gradient: ['#2A2405', '#141102'],
    physicalClaimable: false,
  },
  {
    id: 'reward_150d',
    requiredStreak: 150,
    coinCost: 6000,
    title: 'Premium Coffee Mug',
    category: 'Drinkware',
    type: 'virtual_physical',
    icon: 'cafe-outline',
    description: 'Heavyweight stainless steel travel mug designed for extended marathon gaming sessions.',
    rarity: 'Epic',
    isExclusive: false,
    accentColor: '#00E5FF',
    gradient: ['#082730', '#031217'],
    physicalClaimable: false,
  },
  {
    id: 'reward_200d',
    requiredStreak: 200,
    coinCost: 8000,
    title: 'PIXO Gaming Hoodie',
    category: 'Apparel',
    type: 'virtual_physical',
    icon: 'shirt-outline',
    description: 'Fleece cyberpunk pullover featuring hidden tech pockets and neon drawstrings.',
    rarity: 'Epic',
    isExclusive: false,
    accentColor: '#9D00FF', // Neon Purple
    gradient: ['#25052B', '#120214'],
    physicalClaimable: false,
  },
  {
    id: 'reward_250d',
    requiredStreak: 250,
    coinCost: 10000,
    title: 'PIXO Backpack',
    category: 'Gear & Luggage',
    type: 'virtual_physical',
    icon: 'bag-handle-outline',
    description: 'Waterproof tactical esports backpack with padded laptop and console compartments.',
    rarity: 'Legendary',
    isExclusive: false,
    accentColor: '#39FF14',
    gradient: ['#0A2A14', '#041408'],
    physicalClaimable: false,
  },
  {
    id: 'reward_300d',
    requiredStreak: 300,
    coinCost: 12000,
    title: 'Premium Gaming Jacket',
    category: 'Outerwear',
    type: 'virtual_physical',
    icon: 'shield-checkmark-outline',
    description: 'All-weather bomber jacket lined with custom cybernetic mesh and reflective striping.',
    rarity: 'Legendary',
    isExclusive: false,
    accentColor: '#00E5FF',
    gradient: ['#0A2E38', '#03141A'],
    physicalClaimable: false,
  },
  {
    id: 'reward_365d',
    requiredStreak: 365,
    coinCost: 15000,
    title: 'PIXO Anniversary Trophy',
    category: 'Trophy & Relic',
    type: 'virtual_physical',
    icon: 'trophy-outline',
    description: 'One full calendar year of unyielding devotion. Crystal prism trophy engraved with gamer tag.',
    rarity: 'Mythic',
    isExclusive: true, // Master Prompt Section 9: 365-day exclusive visual treatment
    accentColor: '#FFD700',
    gradient: ['#2E2605', '#141002'],
    physicalClaimable: false,
  },
  {
    id: 'reward_400d',
    requiredStreak: 400,
    coinCost: 18000,
    title: 'Elite Gaming Kit',
    category: 'Battlestation Gear',
    type: 'virtual_physical',
    icon: 'headset-outline',
    description: 'Titanium-finish mechanical peripheral kit with ambient neon lighting profile.',
    rarity: 'Mythic',
    isExclusive: false,
    accentColor: '#FF3B30', // Neon Crimson
    gradient: ['#2E0A0A', '#140303'],
    physicalClaimable: false,
  },
  {
    id: 'reward_500d',
    requiredStreak: 500,
    coinCost: 25000,
    title: 'Ultimate PIXO Champion Award',
    category: 'Grand Champion Laurels',
    type: 'virtual_physical',
    icon: 'diamond-outline',
    description: 'The pinnacle of PIXO mastery. 500 consecutive days of battle-tested tactical excellence.',
    rarity: 'Apex Champion',
    isExclusive: true, // Master Prompt Section 9: 500-day apex exclusive visual treatment
    accentColor: '#FF0055', // Radiant Rose / Magenta
    gradient: ['#33051B', '#17020C'],
    physicalClaimable: false,
  },
];

// Concurrency mutex lock to prevent double-clicks & race conditions during redemption
let isRedeemingLock = false;

export const StreakRewardsService = {
  /**
   * Helper to format a userId safely for storage keys
   */
  getCleanId(userId = 'guest') {
    return String(userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
  },

  /**
   * Retrieves the current reward catalog.
   * Allows dynamic administrative updates while falling back to DEFAULT_STREAK_REWARDS.
   * @returns {Promise<Array<object>>}
   */
  async getCatalog() {
    try {
      const stored = await SessionStorage.getItem(STREAK_REWARDS_STORAGE_KEYS.CATALOG);
      if (Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
    } catch (e) {
      console.warn('Error reading stored streak catalog, using defaults:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STREAK_REWARDS));
  },

  /**
   * Saves or customizes the reward catalog (for administrator / configuration).
   * @param {Array<object>} newCatalog
   */
  async updateCatalog(newCatalog) {
    if (!Array.isArray(newCatalog) || newCatalog.length === 0) {
      throw new Error('Invalid catalog configuration.');
    }
    await SessionStorage.setItem(STREAK_REWARDS_STORAGE_KEYS.CATALOG, newCatalog);
    return newCatalog;
  },

  /**
   * Resets the catalog to default specifications.
   */
  async resetCatalog() {
    await SessionStorage.setItem(STREAK_REWARDS_STORAGE_KEYS.CATALOG, DEFAULT_STREAK_REWARDS);
    return DEFAULT_STREAK_REWARDS;
  },

  /**
   * Retrieves all redeemed rewards for a specific user.
   * @param {string} userId
   * @returns {Promise<Array<object>>}
   */
  async getRedeemedRewards(userId = 'guest') {
    const key = `${STREAK_REWARDS_STORAGE_KEYS.USER_REDEMPTIONS_PREFIX}${this.getCleanId(userId)}`;
    const stored = await SessionStorage.getItem(key);
    return Array.isArray(stored) ? stored : [];
  },

  /**
   * Checks whether a specific reward has already been redeemed by this user.
   * @param {string} userId
   * @param {string} rewardId
   * @returns {Promise<boolean>}
   */
  async hasUserRedeemed(userId = 'guest', rewardId) {
    const redeemedList = await this.getRedeemedRewards(userId);
    return redeemedList.some((item) => item.rewardId === rewardId || item.id === rewardId);
  },

  /**
   * Computes the status of a reward card for a player.
   * Statuses per Master Prompt Section 4:
   * - REDEEMED: Already redeemed
   * - LOCKED: Current streak < required streak
   * - INSUFFICIENT_COINS: Reached streak, but user coins < coin cost
   * - AVAILABLE: Reached streak and has enough coins
   */
  getRewardStatus(reward, userStreak = 0, userCoins = 0, isRedeemed = false) {
    if (isRedeemed) return 'REDEEMED';
    if (userStreak < reward.requiredStreak) return 'LOCKED';
    if (userCoins < reward.coinCost) return 'INSUFFICIENT_COINS';
    return 'AVAILABLE';
  },

  /**
   * Retrieves player streak info from GamingActivityService
   * @param {string} userId
   * @returns {Promise<{ currentStreak: number, longestStreak: number, streakStatus: string }>}
   */
  async getPlayerStreakData(userId = 'guest') {
    try {
      const tz = getAppTimezone();
      const state = await GamingActivityService.getUserStreakState(userId, tz);
      return {
        currentStreak: state.currentStreak || 0,
        longestStreak: state.longestStreak || 0,
        streakStatus: state.streakStatus || 'none',
        missedDays: state.missedDays || 0,
      };
    } catch (e) {
      console.warn('Error fetching player streak data for store:', e);
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakStatus: 'none',
        missedDays: 0,
      };
    }
  },

  /**
   * Computes progress toward the next milestone.
   * Per Master Prompt Section 8:
   * Displays Current streak, Longest streak, Next reward, Days remaining, Coins needed, Progress ratio.
   * Also builds milestone timeline from 7 days to 500 days.
   */
  async getStreakMilestoneProgress(userId = 'guest', currentStreak = 0, longestStreak = 0) {
    const catalog = await this.getCatalog();
    const sorted = [...catalog].sort((a, b) => a.requiredStreak - b.requiredStreak);

    // Find next unreached milestone
    const nextReward = sorted.find((r) => r.requiredStreak > currentStreak) || sorted[sorted.length - 1];
    const isMaxed = currentStreak >= sorted[sorted.length - 1].requiredStreak;

    const daysRemaining = isMaxed ? 0 : Math.max(0, nextReward.requiredStreak - currentStreak);
    const coinsNeeded = nextReward.coinCost;
    const targetStreak = nextReward.requiredStreak;

    // Calculate progress ratio (e.g. 42 / 50 = 84%)
    const progressPercent = isMaxed
      ? 100
      : Math.min(100, Math.max(0, Math.round((currentStreak / targetStreak) * 100)));

    // Timeline nodes
    const timeline = sorted.map((item) => {
      const isPassed = currentStreak >= item.requiredStreak;
      const isNextTarget = item.id === nextReward.id && !isPassed;
      return {
        ...item,
        isPassed,
        isNextTarget,
      };
    });

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      nextReward,
      daysRemaining,
      coinsNeeded,
      progressPercent,
      isMaxed,
      timeline,
    };
  },

  /**
   * Atomically redeems a streak milestone reward.
   * Enforces all checks specified in Master Prompt Section 5:
   * 1. Mutex lock against concurrent / double clicks.
   * 2. Verify player exists and get verified server balances.
   3. Verify current streak meets milestone.
   * 4. Verify coin balance meets price.
   * 5. Verify reward has NOT already been redeemed.
   * 6. Deduct exact coins atomically.
   * 7. Save redemption transaction.
   * 8. Add reward to player's collection.
   * 9. Update UI / user state immediately.
   *
   * @param {string} userId
   * @param {string} rewardId
   * @returns {Promise<{ success: boolean, reward: object, remainingCoins: number, redeemedItem: object, error?: string }>}
   */
  async redeemReward(userId, rewardId) {
    if (!userId) {
      throw new Error('Player authentication required to redeem streak rewards.');
    }

    if (isRedeemingLock) {
      return {
        success: false,
        error: 'Redemption in progress. Please wait a moment.',
      };
    }

    isRedeemingLock = true;

    try {
      // 1. Fetch user profile from database
      const user = await AuthService.findUserById(userId);
      if (!user) {
        throw new Error('Player profile not found in database.');
      }

      const userCoins = typeof user.coins === 'number' ? user.coins : 0;

      // 2. Fetch verified streak state
      const tz = getAppTimezone();
      const streakState = await GamingActivityService.getUserStreakState(userId, tz);
      const currentStreak = typeof streakState.currentStreak === 'number' ? streakState.currentStreak : (user.streak || 0);

      // 3. Find reward in catalog
      const catalog = await this.getCatalog();
      const reward = catalog.find((r) => r.id === rewardId);
      if (!reward) {
        throw new Error(`Reward with ID "${rewardId}" does not exist in catalog.`);
      }

      // 4. Verify NOT already redeemed (unique constraint per player and reward)
      const alreadyRedeemed = await this.hasUserRedeemed(userId, reward.id);
      if (alreadyRedeemed) {
        throw new Error(`You have already redeemed the ${reward.title}. Each milestone reward can only be claimed once.`);
      }

      // 5. Verify streak requirement
      if (currentStreak < reward.requiredStreak) {
        throw new Error(
          `Streak requirement not met! You need a ${reward.requiredStreak}-day streak to unlock ${reward.title} (Your current streak: ${currentStreak} days).`
        );
      }

      // 6. Verify coin balance
      if (userCoins < reward.coinCost) {
        throw new Error(
          `Not Enough Coins! Win more games or exchange your XP for Coins.\nRequired: ${reward.coinCost.toLocaleString()} Coins\nAvailable: ${userCoins.toLocaleString()} Coins`
        );
      }

      // 7. Atomic deduction of coins via AuthService
      const updatedUser = await AuthService.updateUserBalances(userId, {
        coinsDelta: -reward.coinCost,
        xpDelta: 0,
      });

      // 8. Create redemption record
      const redemptionDate = new Date();
      const redeemedItem = {
        id: `redemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        rewardId: reward.id,
        rewardTitle: reward.title,
        requiredStreak: reward.requiredStreak,
        coinCost: reward.coinCost,
        category: reward.category,
        type: reward.type,
        icon: reward.icon,
        rarity: reward.rarity,
        cosmeticType: reward.cosmeticType || null,
        cosmeticValue: reward.cosmeticValue || null,
        redeemedAt: redemptionDate.toISOString(),
        formattedDate: redemptionDate.toLocaleDateString('en-IN', {
          timeZone: tz,
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: 'CLAIMED',
      };

      // 9. Persist to player's reward collection
      const existingRedemptions = await this.getRedeemedRewards(userId);
      existingRedemptions.push(redeemedItem);
      const userKey = `${STREAK_REWARDS_STORAGE_KEYS.USER_REDEMPTIONS_PREFIX}${this.getCleanId(userId)}`;
      await SessionStorage.setItem(userKey, existingRedemptions);

      // 10. Record redemption transaction in database log
      try {
        const transaction = {
          id: `tx_streak_redeem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId,
          transactionType: 'STREAK_REWARD_REDEMPTION',
          xpAmount: 0,
          coinAmount: -reward.coinCost,
          gameId: 'streak_rewards_store',
          rewardId: reward.id,
          rewardTitle: reward.title,
          requiredStreak: reward.requiredStreak,
          transactionDate: redemptionDate.toISOString(),
          transactionStatus: 'COMPLETED',
        };
        await GamingActivityService.recordTransaction(userId, transaction);
      } catch (txErr) {
        console.warn('Warning: Failed to log redemption transaction:', txErr);
      }

      // 11. If digital cosmetic, auto-equip or make ready
      if (reward.type === 'digital' && reward.cosmeticType) {
        try {
          await this.equipCosmetic(userId, reward.cosmeticType, reward.cosmeticValue);
        } catch (cosmeticErr) {
          console.warn('Warning: Failed to auto-equip cosmetic:', cosmeticErr);
        }
      }

      return {
        success: true,
        reward,
        remainingCoins: updatedUser.coins,
        redeemedItem,
        user: updatedUser,
      };
    } finally {
      isRedeemingLock = false;
    }
  },

  /**
   * Equips a digital cosmetic (Profile Frame, Badge)
   * @param {string} userId
   * @param {string} cosmeticType 'badge' | 'frame'
   * @param {string} cosmeticValue
   */
  async equipCosmetic(userId, cosmeticType, cosmeticValue) {
    if (!userId || !cosmeticType) return null;
    const key = `${STREAK_REWARDS_STORAGE_KEYS.EQUIPPED_COSMETICS_PREFIX}${this.getCleanId(userId)}`;
    const current = (await SessionStorage.getItem(key)) || {};
    current[cosmeticType] = cosmeticValue;
    await SessionStorage.setItem(key, current);

    // Sync to user profile if badge
    if (cosmeticType === 'badge') {
      try {
        await AuthService.updateUserProfile(userId, { badge: cosmeticValue });
      } catch (e) {
        console.warn('Failed to sync badge to user profile:', e);
      }
    }
    return current;
  },

  /**
   * Retrieves equipped cosmetics for user
   */
  async getEquippedCosmetics(userId = 'guest') {
    const key = `${STREAK_REWARDS_STORAGE_KEYS.EQUIPPED_COSMETICS_PREFIX}${this.getCleanId(userId)}`;
    const stored = (await SessionStorage.getItem(key)) || {};
    return {
      badge: stored.badge || 'Novice Adventurer',
      frame: stored.frame || null,
    };
  },
};
