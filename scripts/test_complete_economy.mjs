/**
 * PIXO Master Test Suite: Complete Game Reward, Coin Store & Streak Economy Update
 * Verifies all 17 requirements specified in Master Prompt Section 12
 */

import { GamingActivityService, GAME_DIFFICULTY_REWARDS, XP_TO_COIN_PACKAGES, getAppTimezone } from '../src/services/gamingActivityService.js';
import { AuthService, STORAGE_KEYS } from '../src/services/authService.js';
import { SessionStorage } from '../src/services/sessionStorage.js';
import fs from 'fs';
import path from 'path';

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
  console.log('\n================================================================');
  console.log('🚀 PIXO COMPREHENSIVE ECONOMY & REWARD VERIFICATION (17 TESTS)');
  console.log('================================================================\n');

  // Step 0: Reset DB to clean state
  await GamingActivityService.resetDevelopmentDatabase();

  // Test 1: New user starts with 0 XP and 0 Coins
  console.log('[Test 1] New User Initialization');
  const testEmail = `tester_${Date.now()}@pixo.gg`;
  const otpRes = await AuthService.requestOtp(testEmail);
  const regRes = await AuthService.registerUser({
    name: 'Economy Tester',
    email: testEmail,
    password: 'Password123!',
    otp: otpRes.otp,
  });
  const testUser = regRes.user;
  const testUserId = testUser.id;
  assert(
    regRes.success && testUser.xp === 0 && testUser.coins === 0 && testUser.streak === 0,
    'New user starts with exactly 0 XP, 0 Coins, and 0 Streak',
    `Got xp: ${testUser?.xp}, coins: ${testUser?.coins}, streak: ${testUser?.streak}`
  );

  // Test 2: Winning Level 1 game gives 10 XP and 2 Coins
  console.log('\n[Test 2] Level 1 Game Victory Reward');
  const sess1 = await GamingActivityService.startSession(testUserId, {
    id: 'g_target_1',
    title: 'Target Number',
    category: 'Speed Math Rush',
  });
  const res1 = await GamingActivityService.completeSession(testUserId, sess1.id, {
    difficulty: 1,
    result: 'Victory - Target Reached',
    score: 100,
  });
  const u1 = await AuthService.findUserById(testUserId);
  assert(
    res1.xpAwarded === 10 && res1.coinsAwarded === 2 && u1.xp === 10 && u1.coins === 2,
    'Winning Level 1 gives exactly 10 XP and 2 Coins',
    `xpAwarded: ${res1.xpAwarded}, coinsAwarded: ${res1.coinsAwarded}, u.xp: ${u1.xp}, u.coins: ${u1.coins}`
  );

  // Test 3: Winning Level 5 game gives 50 XP and 10 Coins
  console.log('\n[Test 3] Level 5 Game Victory Reward');
  const sess5 = await GamingActivityService.startSession(testUserId, {
    id: 'g_target_5',
    title: 'Target Number',
    category: 'Speed Math Rush',
  });
  const res5 = await GamingActivityService.completeSession(testUserId, sess5.id, {
    difficulty: 5,
    result: 'Victory - Target Reached',
    score: 500,
  });
  const u5 = await AuthService.findUserById(testUserId);
  assert(
    res5.xpAwarded === 50 && res5.coinsAwarded === 10 && u5.xp === 60 && u5.coins === 12,
    'Winning Level 5 gives exactly 50 XP and 10 Coins (Total now 60 XP, 12 Coins)',
    `xpAwarded: ${res5.xpAwarded}, coinsAwarded: ${res5.coinsAwarded}, totalXp: ${u5.xp}, totalCoins: ${u5.coins}`
  );

  // Test 4: Losing a game gives 0 XP and 0 Coins
  console.log('\n[Test 4] Defeat / Incomplete Gives Zero Reward');
  const sessLoss = await GamingActivityService.startSession(testUserId, {
    id: 'g_target_loss',
    title: 'Target Number',
    category: 'Speed Math Rush',
  });
  const resLoss = await GamingActivityService.completeSession(testUserId, sessLoss.id, {
    difficulty: 5,
    result: 'Defeat - Time Expired',
    score: 10,
  });
  const uLoss = await AuthService.findUserById(testUserId);
  assert(
    resLoss.xpAwarded === 0 && resLoss.coinsAwarded === 0 && uLoss.xp === 60 && uLoss.coins === 12,
    'Losing game yields 0 XP and 0 Coins; balances remain untouched',
    `xpAwarded: ${resLoss.xpAwarded}, coinsAwarded: ${resLoss.coinsAwarded}`
  );

  // Test 5: Duplicate submission gives no duplicate reward
  console.log('\n[Test 5] Duplicate Submission Prevention');
  const resDup = await GamingActivityService.completeSession(testUserId, sess5.id, {
    difficulty: 5,
    result: 'Victory - Target Reached',
    score: 500,
  });
  const uDup = await AuthService.findUserById(testUserId);
  assert(
    resDup.xpAwarded === 0 && resDup.coinsAwarded === 0 && uDup.xp === 60 && uDup.coins === 12,
    'Duplicate completion returns 0 reward and does not double-credit',
    `xpAwarded: ${resDup.xpAwarded}, coinsAwarded: ${resDup.coinsAwarded}`
  );

  // Test 6: Exchanging 50 XP gives 5 Coins
  console.log('\n[Test 6] XP to Coin Exchange: Package 1 (50 XP -> 5 Coins)');
  const ex1 = await GamingActivityService.exchangeXpForCoins(testUserId, 1); // 50 XP -> 5 Coins
  const uEx1 = await AuthService.findUserById(testUserId);
  assert(
    ex1.success === true && ex1.deductedXp === 50 && ex1.addedCoins === 5 && uEx1.xp === 10 && uEx1.coins === 17,
    'Exchanging 50 XP deducts 50 XP and adds 5 Coins (balance: 10 XP, 17 Coins)',
    `newXp: ${ex1.newXp}, newCoins: ${ex1.newCoins}`
  );

  // Grant verified game XP for subsequent packages
  // Win Level 10 (100 XP, 20 Coins) twice = +200 XP, +40 Coins -> 210 XP, 57 Coins
  for (let i = 0; i < 2; i++) {
    const s = await GamingActivityService.startSession(testUserId, { id: `g_target_top_${i}` });
    await GamingActivityService.completeSession(testUserId, s.id, {
      difficulty: 10,
      result: 'Victory - Target Reached',
    });
  }

  // Test 7: Exchanging 200 XP gives 25 Coins
  console.log('\n[Test 7] XP to Coin Exchange: Package 3 (200 XP -> 25 Coins)');
  const ex3 = await GamingActivityService.exchangeXpForCoins(testUserId, 3); // 200 XP -> 25 Coins
  const uEx3 = await AuthService.findUserById(testUserId);
  assert(
    ex3.success === true && ex3.deductedXp === 200 && ex3.addedCoins === 25 && uEx3.xp === 10 && uEx3.coins === 82,
    'Exchanging 200 XP deducts 200 XP and adds 25 Coins (balance: 10 XP, 82 Coins)',
    `newXp: ${ex3.newXp}, newCoins: ${ex3.newCoins}`
  );

  // Test 8: Exchanging 1000 XP gives 120 Coins
  console.log('\n[Test 8] XP to Coin Exchange: Package 10 (1000 XP -> 120 Coins)');
  // Earn 1000 XP (10 Level 10 wins = 1000 XP, 200 Coins)
  for (let i = 0; i < 10; i++) {
    const s = await GamingActivityService.startSession(testUserId, { id: `g_target_1k_${i}` });
    await GamingActivityService.completeSession(testUserId, s.id, {
      difficulty: 10,
      result: 'Victory - Target Reached',
    });
  }
  const pre1k = await AuthService.findUserById(testUserId);
  const ex10 = await GamingActivityService.exchangeXpForCoins(testUserId, 10); // 1000 XP -> 120 Coins
  const post1k = await AuthService.findUserById(testUserId);
  assert(
    ex10.success === true &&
    ex10.deductedXp === 1000 &&
    ex10.addedCoins === 120 &&
    post1k.xp === pre1k.xp - 1000 &&
    post1k.coins === pre1k.coins + 120,
    'Exchanging 1000 XP deducts 1000 XP and awards 120 Coins',
    `deductedXp: ${ex10.deductedXp}, addedCoins: ${ex10.addedCoins}`
  );

  // Test 9: Insufficient XP prevents exchange
  console.log('\n[Test 9] Insufficient XP Blocks Exchange');
  const exFail = await GamingActivityService.exchangeXpForCoins(testUserId, 10); // Needs 1000 XP, user has 10 XP
  assert(
    exFail.success === false && (exFail.insufficientXp || exFail.error?.includes('XP')),
    'Exchange fails gracefully when user has insufficient XP',
    `Error returned: ${exFail.error}`
  );

  // Test 10: Restoring 1 missed day costs 100 Coins
  console.log('\n[Test 10] Restoring 1 Missed Day (100 Coins)');
  await GamingActivityService.simulateMissedDays(testUserId, 1);
  const userCoinsBeforeRestore = (await AuthService.findUserById(testUserId)).coins;
  const restoreRes1 = await GamingActivityService.restoreStreak(testUserId, 1);
  const userCoinsAfterRestore = (await AuthService.findUserById(testUserId)).coins;
  assert(
    restoreRes1.success === true &&
    restoreRes1.costInCoins === 100 &&
    userCoinsAfterRestore === userCoinsBeforeRestore - 100,
    'Restoring 1 missed day costs exactly 100 Coins and preserves streak count',
    `costInCoins: ${restoreRes1.costInCoins}, coinsBefore: ${userCoinsBeforeRestore}, coinsAfter: ${userCoinsAfterRestore}`
  );

  // Test 11: Restoring 3 missed days costs 300 Coins
  console.log('\n[Test 11] Restoring 3 Missed Days (300 Coins)');
  // Ensure user has at least 300 Coins by winning Level 10 games (20 Coins each)
  for (let i = 0; i < 15; i++) {
    const s = await GamingActivityService.startSession(testUserId, { id: `g_target_t11_${i}` });
    await GamingActivityService.completeSession(testUserId, s.id, {
      difficulty: 10,
      result: 'Victory - Target Reached',
    });
  }
  await GamingActivityService.simulateMissedDays(testUserId, 3);
  const coinsBefore3 = (await AuthService.findUserById(testUserId)).coins;
  const restoreRes3 = await GamingActivityService.restoreStreak(testUserId, 3);
  const coinsAfter3 = (await AuthService.findUserById(testUserId)).coins;
  assert(
    restoreRes3.success === true &&
    restoreRes3.costInCoins === 300 &&
    coinsAfter3 === coinsBefore3 - 300,
    'Restoring 3 missed days costs exactly 300 Coins (100 Coins/day)',
    `costInCoins: ${restoreRes3.costInCoins}, coinsBefore: ${coinsBefore3}, coinsAfter: ${coinsAfter3}`
  );

  // Test 12: Insufficient Coins prevent restoration with exact prompt message
  console.log('\n[Test 12] Insufficient Coins Error Message');
  const poorEmail = `poor_${Date.now()}@pixo.gg`;
  const poorOtp = await AuthService.requestOtp(poorEmail);
  const poorReg = await AuthService.registerUser({
    name: 'Poor Gamer',
    email: poorEmail,
    password: 'Password123!',
    otp: poorOtp.otp,
  });
  const poorUserId = poorReg.user.id;
  await GamingActivityService.simulateMissedDays(poorUserId, 1); // costs 100 Coins, user has 0
  const poorRestore = await GamingActivityService.restoreStreak(poorUserId, 1);
  assert(
    poorRestore.success === false &&
    poorRestore.error === 'Not Enough Coins! Win more games or exchange your XP for Coins.',
    'Returns exact error: "Not Enough Coins! Win more games or exchange your XP for Coins."',
    `Error returned: "${poorRestore.error}"`
  );

  // Test 13: Multiple concurrent clicks do not deduct Coins twice (mutex concurrency check)
  console.log('\n[Test 13] Concurrent Click Protection (Mutex Lock)');
  await GamingActivityService.simulateMissedDays(testUserId, 1);
  const coinsBeforeMulti = (await AuthService.findUserById(testUserId)).coins;
  // Fire 3 simultaneous restoration calls
  const [call1, call2, call3] = await Promise.all([
    GamingActivityService.restoreStreak(testUserId, 1),
    GamingActivityService.restoreStreak(testUserId, 1),
    GamingActivityService.restoreStreak(testUserId, 1),
  ]);
  const coinsAfterMulti = (await AuthService.findUserById(testUserId)).coins;
  const successfulCalls = [call1, call2, call3].filter(c => c.success).length;
  assert(
    successfulCalls === 1 && coinsAfterMulti === coinsBeforeMulti - 100,
    'Only 1 restoration succeeds under concurrent fire; exactly 100 Coins deducted once',
    `Successful calls: ${successfulCalls}, coins deducted: ${coinsBeforeMulti - coinsAfterMulti}`
  );

  // Test 14: App close / reopen preserves balances
  console.log('\n[Test 14] Persistence Across App Close/Reopen');
  const userBeforeClose = await AuthService.findUserById(testUserId);
  // Re-read directly from persistent session storage
  const rawRegistry = (await SessionStorage.getItem(STORAGE_KEYS.USERS_REGISTRY)) || [];
  const storedUser = rawRegistry.find(u => u.id === testUserId);
  assert(
    storedUser && storedUser.xp === userBeforeClose.xp && storedUser.coins === userBeforeClose.coins,
    'User balances preserved in persistent database exactly as expected',
    `Stored xp: ${storedUser?.xp}, coins: ${storedUser?.coins}`
  );

  // Test 15: Cross-device login preserves balances
  console.log('\n[Test 15] Cross-Device Session Authentication');
  const loginRes = await AuthService.loginUser(userBeforeClose.email, 'Password123!');
  assert(
    loginRes.success &&
    loginRes.user.xp === userBeforeClose.xp &&
    loginRes.user.coins === userBeforeClose.coins,
    'Logging in fresh retrieves verified database XP and Coin balances',
    `Login xp: ${loginRes.user?.xp}, coins: ${loginRes.user?.coins}`
  );

  // Test 16: Verify no test buttons or free reward buttons remain in codebase
  console.log('\n[Test 16] Codebase Audit: Zero Free/Test Reward Buttons');
  const homeCode = fs.readFileSync(path.resolve('src/screens/HomeScreen.js'), 'utf8');
  const has1000TestBtn = homeCode.includes('+1,000 XP (Test)');
  const hasBreakStreakTestBtn = homeCode.includes('Break Streak (Test)');
  const hasResetClaimTestBtn = homeCode.includes('↺ Reset Claim (Test)');
  const hasDaily20ClaimBtn = homeCode.includes('CLAIM +20 XP');
  const noTestButtons = !has1000TestBtn && !hasBreakStreakTestBtn && !hasResetClaimTestBtn && !hasDaily20ClaimBtn;
  assert(
    noTestButtons,
    'Zero test buttons or free claim buttons in HomeScreen (+1000 XP, Break Streak, Reset Claim, Claim +20 XP all removed)',
    `has1000Test: ${has1000TestBtn}, hasBreakTest: ${hasBreakStreakTestBtn}, hasResetClaim: ${hasResetClaimTestBtn}, hasDaily20Claim: ${hasDaily20ClaimBtn}`
  );

  // Test 17: Verify no player-level progression UI or calculations remain
  console.log('\n[Test 17] Codebase Audit: Zero Player-Level Progression UI');
  const hasSeasonPass = homeCode.includes('SEASON PASS // PLAYER PROGRESSION');
  const hasLevel01Card = homeCode.includes('LEVEL 01') || homeCode.includes('LEVEL 02');
  const hasNextTier = homeCode.includes('Next Tier: Level');
  const noLevelUI = !hasSeasonPass && !hasLevel01Card && !hasNextTier;
  assert(
    noLevelUI,
    'Player-level progression cards, Season Pass progress bars, and Level milestones completely removed',
    `hasSeasonPass: ${hasSeasonPass}, hasLevelCard: ${hasLevel01Card}, hasNextTier: ${hasNextTier}`
  );

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
