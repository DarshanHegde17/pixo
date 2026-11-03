/**
 * Automated Test Suite for PIXO STREAK REWARDS STORE (7 TO 500 DAYS)
 * 
 * Verifies all 12 test points specified in Master Prompt Section 12:
 * 1. A player with 24 days cannot redeem the 25-day reward.
 * 2. A player with 25 days and 999 coins cannot redeem the 25-day reward.
 * 3. A player with 25 days and 1,000 coins can redeem the 25-day reward.
 * 4. A player cannot redeem the same reward twice (one-time unique redemption constraint).
 * 5. A player cannot redeem a 100-day reward with only a 50-day streak.
 * 6. Coin deduction happens exactly once (atomic balance adjustment).
 * 7. Missing a day updates the streak correctly (resets current to 0, marks broken).
 * 8. Multiple activities on the same calendar day do not increase the streak more than once.
 * 9. The longest streak is preserved and never decreases.
 * 10. The next milestone progress updates correctly (e.g., 42/50d, remaining days, coins needed).
 * 11. All 13 milestones display correctly with required streak and coin prices.
 * 12. Existing PIXO games and coin store XP exchange packages continue working.
 */

import {
  StreakRewardsService,
  DEFAULT_STREAK_REWARDS,
  STREAK_REWARDS_STORAGE_KEYS,
} from '../src/services/streakRewardsService.js';
import {
  GamingActivityService,
  STREAK_MILESTONES,
  toDateKey,
  getOffsetDateKey,
  getAppTimezone,
} from '../src/services/gamingActivityService.js';
import { AuthService, STORAGE_KEYS } from '../src/services/authService.js';
import { SessionStorage } from '../src/services/sessionStorage.js';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m - ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m - ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🏆 PIXO STREAK REWARDS STORE (7 TO 500 DAYS) TEST SUITE');
  console.log('================================================================\n');

  const timezone = getAppTimezone();
  const testUserId = 'usr_test_streak_rewards_' + Date.now();

  // Initialize test player with 0 XP and 0 Coins in persistent storage
  const userRecord = {
    id: testUserId,
    name: 'Streak Slayer',
    email: `${testUserId}@pixo.gg`,
    password: 'Password123!',
    gamerTag: 'STREAK_SLAYER#2099',
    xp: 0,
    coins: 0,
    streak: 0,
    badge: 'Novice Adventurer',
    createdAt: new Date().toISOString(),
  };

  const usersList = (await SessionStorage.getItem(STORAGE_KEYS.USERS_REGISTRY)) || [];
  usersList.push(userRecord);
  await SessionStorage.setItem(STORAGE_KEYS.USERS_REGISTRY, usersList);

  // Helper to set test player streak & coins cleanly
  const setTestPlayerState = async ({ streak, coins, longestStreak }) => {
    // 1. Update user coins & streak
    await AuthService.updateUserProfile(testUserId, { streak, coins });
    // 2. Set persistent streak state
    const todayKey = toDateKey(new Date(), timezone);
    const state = {
      currentStreak: streak,
      longestStreak: longestStreak || streak,
      lastActivityDate: todayKey,
      streakStatus: streak > 0 ? 'active' : 'none',
      missedDays: 0,
      previousStreak: streak,
    };
    await SessionStorage.setItem(`@soloplay_user_streak_state_${testUserId}`, state);
    if (longestStreak) {
      await SessionStorage.setItem(`@soloplay_longest_streak_${testUserId}`, longestStreak);
    }
  };

  // Helper to clear user redemptions
  const clearTestRedemptions = async () => {
    await SessionStorage.removeItem(`@pixo_user_redeemed_rewards_${testUserId}`);
  };

  // -------------------------------------------------------------------------
  // TEST 11: All 13 Milestones Display Correctly
  // -------------------------------------------------------------------------
  console.log('--- TEST 11: All 13 Milestones Catalog Integrity ---');
  const catalog = await StreakRewardsService.getCatalog();
  assert(catalog.length === 13, 'Catalog contains exactly 13 reward milestones', `Found: ${catalog.length}`);

  const expectedMilestones = [
    { streak: 7, cost: 250, title: 'PIXO Achievement Badge' },
    { streak: 14, cost: 500, title: 'Premium Profile Frame' },
    { streak: 25, cost: 1000, title: 'PIXO Water Bottle' },
    { streak: 50, cost: 1000, title: 'PIXO Coffee Cup' },
    { streak: 75, cost: 3000, title: 'PIXO Gaming Cap' },
    { streak: 100, cost: 5000, title: 'PIXO T-Shirt' },
    { streak: 150, cost: 6000, title: 'Premium Coffee Mug' },
    { streak: 200, cost: 8000, title: 'PIXO Gaming Hoodie' },
    { streak: 250, cost: 10000, title: 'PIXO Backpack' },
    { streak: 300, cost: 12000, title: 'Premium Gaming Jacket' },
    { streak: 365, cost: 15000, title: 'PIXO Anniversary Trophy' },
    { streak: 400, cost: 18000, title: 'Elite Gaming Kit' },
    { streak: 500, cost: 25000, title: 'Ultimate PIXO Champion Award' },
  ];

  let allMilestonesMatch = true;
  expectedMilestones.forEach((exp, idx) => {
    const item = catalog[idx];
    if (
      !item ||
      item.requiredStreak !== exp.streak ||
      item.coinCost !== exp.cost ||
      item.title !== exp.title
    ) {
      allMilestonesMatch = false;
      console.error(`Milestone mismatch at index ${idx}: expected ${JSON.stringify(exp)}, got ${JSON.stringify(item)}`);
    }
  });
  assert(allMilestonesMatch, 'All 13 milestones strictly match required streak, coin cost, and item title');

  // Verify exclusive badges
  const item100 = catalog.find((r) => r.requiredStreak === 100);
  const item365 = catalog.find((r) => r.requiredStreak === 365);
  const item500 = catalog.find((r) => r.requiredStreak === 500);
  assert(item100?.isExclusive && item365?.isExclusive && item500?.isExclusive, '100-day, 365-day, and 500-day rewards marked exclusive');

  // -------------------------------------------------------------------------
  // TEST 1: Player with 24 days cannot redeem the 25-day reward
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 1: Insufficient Streak Blocks Redemption ---');
  await clearTestRedemptions();
  await setTestPlayerState({ streak: 24, coins: 5000 });

  const status1 = StreakRewardsService.getRewardStatus(catalog[2], 24, 5000, false);
  assert(status1 === 'LOCKED', 'Status is LOCKED when current streak (24) < required streak (25)');

  let error1Caught = false;
  try {
    await StreakRewardsService.redeemReward(testUserId, 'reward_25d');
  } catch (err) {
    error1Caught = true;
    assert(
      err.message.includes('Streak requirement not met'),
      'Throws clear error stating streak requirement not met',
      err.message
    );
  }
  assert(error1Caught, 'Redemption strictly rejected for 24-day player attempting 25-day reward');

  // -------------------------------------------------------------------------
  // TEST 2: Player with 25 days and 999 coins cannot redeem 25-day reward
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Insufficient Coins Blocks Redemption ---');
  await setTestPlayerState({ streak: 25, coins: 999 });

  const status2 = StreakRewardsService.getRewardStatus(catalog[2], 25, 999, false);
  assert(status2 === 'INSUFFICIENT_COINS', 'Status is INSUFFICIENT_COINS when coins (999) < price (1,000)');

  let error2Caught = false;
  try {
    await StreakRewardsService.redeemReward(testUserId, 'reward_25d');
  } catch (err) {
    error2Caught = true;
    assert(
      err.message.includes('Not Enough Coins'),
      'Throws clear error stating not enough coins',
      err.message
    );
  }
  assert(error2Caught, 'Redemption strictly rejected for 25-day player with only 999 coins');

  // -------------------------------------------------------------------------
  // TEST 3 & TEST 6: Player with 25 days & 1,000 coins CAN redeem (Deducts once)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3 & 6: Successful Redemption & Atomic Coin Deduction ---');
  await setTestPlayerState({ streak: 25, coins: 1500 });

  const status3 = StreakRewardsService.getRewardStatus(catalog[2], 25, 1500, false);
  assert(status3 === 'AVAILABLE', 'Status is AVAILABLE when streak (25) >= 25 and coins (1,500) >= 1,000');

  const redeemRes = await StreakRewardsService.redeemReward(testUserId, 'reward_25d');
  assert(redeemRes.success, 'Redemption succeeds for player with 25 days and sufficient coins');
  assert(redeemRes.remainingCoins === 500, 'Exact 1,000 coins deducted once: 1,500 - 1,000 = 500 Coins', `Actual: ${redeemRes.remainingCoins}`);

  // Verify updated balance in database
  const updatedUser = await AuthService.findUserById(testUserId);
  assert(updatedUser.coins === 500, 'Database confirms remaining balance is exactly 500 Coins');

  // Verify added to collection
  const redemptions = await StreakRewardsService.getRedeemedRewards(testUserId);
  assert(redemptions.length === 1 && redemptions[0].rewardId === 'reward_25d', 'PIXO Water Bottle archived in player collection');

  // -------------------------------------------------------------------------
  // TEST 4: Player cannot redeem the same reward twice
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Duplicate Redemption Prevention ---');
  // Give extra coins to ensure coins are not the blocker
  await AuthService.updateUserProfile(testUserId, { coins: 3000 });

  const hasRedeemed = await StreakRewardsService.hasUserRedeemed(testUserId, 'reward_25d');
  assert(hasRedeemed === true, 'System recognizes reward_25d as already redeemed');

  const status4 = StreakRewardsService.getRewardStatus(catalog[2], 25, 3000, true);
  assert(status4 === 'REDEEMED', 'Status changes to REDEEMED once claimed');

  let error4Caught = false;
  try {
    await StreakRewardsService.redeemReward(testUserId, 'reward_25d');
  } catch (err) {
    error4Caught = true;
    assert(
      err.message.includes('already redeemed'),
      'Throws error stating reward has already been redeemed',
      err.message
    );
  }
  assert(error4Caught, 'Duplicate redemption strictly prevented');

  // Verify coins were NOT deducted again
  const userAfterDup = await AuthService.findUserById(testUserId);
  assert(userAfterDup.coins === 3000, 'Zero coins deducted on duplicate attempt; balance remains intact at 3,000');

  // -------------------------------------------------------------------------
  // TEST 5: Player cannot redeem a 100-day reward with only a 50-day streak
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Cannot Jump Ahead to 100-Day Reward with 50-Day Streak ---');
  await setTestPlayerState({ streak: 50, coins: 20000 });

  const item100d = catalog.find((r) => r.requiredStreak === 100);
  const status5 = StreakRewardsService.getRewardStatus(item100d, 50, 20000, false);
  assert(status5 === 'LOCKED', 'Status for 100-day T-Shirt is LOCKED for 50-day streak player');

  let error5Caught = false;
  try {
    await StreakRewardsService.redeemReward(testUserId, item100d.id);
  } catch (err) {
    error5Caught = true;
    assert(
      err.message.includes('Streak requirement not met'),
      'Throws error: streak requirement not met (needs 100 days, has 50 days)',
      err.message
    );
  }
  assert(error5Caught, 'Player with 50 days strictly barred from 100-day reward');

  // -------------------------------------------------------------------------
  // TEST 7: Missing a day updates the streak correctly
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: Missing a Day Resets Streak & Preserves Previous ---');
  // Simulate 1 missed day using GamingActivityService simulation helper
  const brokenState = await GamingActivityService.simulateMissedDays(testUserId, 1);
  assert(brokenState.currentStreak === 0, 'Current streak resets to 0 when calendar day is missed');
  assert(brokenState.streakStatus === 'broken', 'Streak status is marked as broken');
  assert(brokenState.previousStreak >= 25, 'Previous streak count is preserved for coin restoration');

  // -------------------------------------------------------------------------
  // TEST 8: Multiple activities on same day do not increase streak more than once
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 8: Daily Completion Deduplication ---');
  // Complete activity #1 today
  const sess1 = await GamingActivityService.startSession(testUserId, {
    id: 'game_sess_1',
    title: 'Cyber Strike: 2099',
    category: 'Cyber Arcade',
  });
  await GamingActivityService.completeSession(testUserId, sess1.id, {
    score: 1000,
    durationSeconds: 60,
    result: 'Victory',
  });

  const streakAfterFirst = await GamingActivityService.getUserStreakState(testUserId, timezone);
  const countAfterFirst = streakAfterFirst.currentStreak;

  // Complete activity #2 today
  const sess2 = await GamingActivityService.startSession(testUserId, {
    id: 'game_sess_2',
    title: 'Target Number',
    category: 'Speed Math',
  });
  await GamingActivityService.completeSession(testUserId, sess2.id, {
    score: 2000,
    durationSeconds: 45,
    result: 'Victory',
  });

  const streakAfterSecond = await GamingActivityService.getUserStreakState(testUserId, timezone);
  assert(
    streakAfterSecond.currentStreak === countAfterFirst,
    `Multiple games on same calendar day maintain 1 streak day (Streak stayed at ${countAfterFirst})`
  );

  // -------------------------------------------------------------------------
  // TEST 9: Longest streak is preserved
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 9: Longest Streak Preservation ---');
  await setTestPlayerState({ streak: 12, coins: 1000, longestStreak: 75 });
  const streakData = await GamingActivityService.getUserStreakState(testUserId, timezone);
  assert(streakData.longestStreak === 75, 'Historical longest streak (75d) is preserved despite current streak (12d)');

  // -------------------------------------------------------------------------
  // TEST 10: Next Milestone Progress Updates Correctly
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 10: Next Milestone Progress Tracking ---');
  // Player at 42-day streak (as requested in prompt example: Current 42 -> Next 50-day Coffee Cup, 8 days remaining)
  const progress42 = await StreakRewardsService.getStreakMilestoneProgress(testUserId, 42, 75);
  assert(progress42.currentStreak === 42, 'Progress reports Current Streak: 42 Days');
  assert(progress42.nextReward.requiredStreak === 50, 'Identifies Next Reward: 50-Day milestone');
  assert(progress42.nextReward.title === 'PIXO Coffee Cup', 'Identifies Next Reward Title: PIXO Coffee Cup');
  assert(progress42.daysRemaining === 8, 'Calculates exact days remaining: 50 - 42 = 8 Days');
  assert(progress42.coinsNeeded === 1000, 'Calculates required coins: 1,000 Coins');
  assert(progress42.progressPercent === 84, 'Calculates progress percentage: 42/50 = 84%');

  // -------------------------------------------------------------------------
  // TEST 12: Existing PIXO Games & Coin Store XP Exchange Continue Working
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 12: Existing Economy & XP-to-Coin Exchange Intact ---');
  // Give user 200 XP and 0 Coins
  await AuthService.updateUserProfile(testUserId, { xp: 200, coins: 0 });

  // Exchange Package #1 (50 XP -> 5 Coins)
  const exchangeRes1 = await GamingActivityService.exchangeXpForCoins(testUserId, 1);
  assert(exchangeRes1.success, 'XP-to-Coin package exchange succeeds seamlessly');
  assert(exchangeRes1.newXp === 150, 'XP balance decreased by 50: 200 -> 150');
  assert(exchangeRes1.newCoins === 5, 'Coin balance increased by 5: 0 -> 5');

  // Verify digital cosmetic equipping
  console.log('\n--- BONUS: Digital Cosmetic Equipping Integration ---');
  await StreakRewardsService.equipCosmetic(testUserId, 'badge', 'PIXO 7-Day Striker');
  const cosmetics = await StreakRewardsService.getEquippedCosmetics(testUserId);
  assert(cosmetics.badge === 'PIXO 7-Day Striker', 'Cosmetic badge equipped successfully to player profile');

  // Verify configurable catalog
  console.log('\n--- BONUS: Configurable Catalog Validation ---');
  const customCatalog = [...DEFAULT_STREAK_REWARDS];
  customCatalog[0] = { ...customCatalog[0], title: 'Modified Custom Badge' };
  await StreakRewardsService.updateCatalog(customCatalog);
  const fetchedCat = await StreakRewardsService.getCatalog();
  assert(fetchedCat[0].title === 'Modified Custom Badge', 'Custom reward catalog saved & retrieved successfully');
  await StreakRewardsService.resetCatalog();
  const resetCat = await StreakRewardsService.getCatalog();
  assert(resetCat[0].title === 'PIXO Achievement Badge', 'Catalog resets back to default specifications');

  // Cleanup test user
  await clearTestRedemptions();

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});

