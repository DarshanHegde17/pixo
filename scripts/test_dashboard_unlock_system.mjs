import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { GamingActivityService } from '../src/services/gamingActivityService.js';
import { SessionStorage } from '../src/services/sessionStorage.js';
import { AuthService } from '../src/services/authService.js';

console.log('\n================================================================');
console.log('🚀 PIXO DASHBOARD REDESIGN & SEQUENTIAL LEVEL UNLOCK VERIFICATION');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function pass(testName) {
  console.log(`  ✔ PASS - ${testName}`);
  passedTests++;
}

function fail(testName, error) {
  console.error(`  ❌ FAIL - ${testName}:`, error.message || error);
  failedTests++;
}

async function runTests() {
  // -------------------------------------------------------------
  // Test 1: Codebase Audit - Removal of Left & Right Side Panels
  // -------------------------------------------------------------
  try {
    const homeScreenContent = fs.readFileSync(path.resolve('src/screens/HomeScreen.js'), 'utf-8');

    assert.ok(
      !homeScreenContent.includes('<LeftChatPanel') &&
      !homeScreenContent.includes('<RightChatPanel') &&
      !homeScreenContent.includes('from \'../components/chat\''),
      'LeftChatPanel and RightChatPanel must be completely removed from HomeScreen'
    );

    assert.ok(
      !homeScreenContent.includes('mobileSegmentBar') &&
      !homeScreenContent.includes('activeMobileChat'),
      'Mobile chat segment bar must be completely removed'
    );

    pass('Test 1: Side panels (AI Co-Pilot & Global Comms) completely removed from HomeScreen');
  } catch (e) {
    fail('Test 1: Side panels removal', e);
  }

  // -------------------------------------------------------------
  // Test 2: Top Reward Summary Verification
  // -------------------------------------------------------------
  try {
    const homeScreenContent = fs.readFileSync(path.resolve('src/screens/HomeScreen.js'), 'utf-8');

    assert.ok(
      homeScreenContent.includes('headerRightRow') || homeScreenContent.includes('topRewardSummaryBar'),
      'HomeScreen must contain top header reward summary'
    );

    assert.ok(
      homeScreenContent.includes('userCoins.toLocaleString()') &&
      homeScreenContent.includes('userStreak') &&
      homeScreenContent.includes('userXp.toLocaleString()'),
      'Top Reward Summary must display live Coins, Streak Days, and XP'
    );

    pass('Test 2: Top Reward Summary renders live Coins, Streak Days, and XP format');
  } catch (e) {
    fail('Test 2: Top Reward Summary', e);
  }

  // -------------------------------------------------------------
  // Test 3: Daily Objectives Structure & Live Tracking
  // -------------------------------------------------------------
  try {
    const testUserId = `test_quest_user_${Date.now()}`;
    const initialQuests = await GamingActivityService.getDailyObjectives(testUserId);

    assert.strictEqual(initialQuests.objectives.length, 3, 'Must have exactly 3 Daily Objectives');
    assert.strictEqual(initialQuests.objectives[0].id, 'daily_login');
    assert.strictEqual(initialQuests.objectives[0].isCompleted, true, 'Daily login automatically completed');
    assert.strictEqual(initialQuests.objectives[1].id, 'play_3_games');
    assert.strictEqual(initialQuests.objectives[2].id, 'play_7_games');

    // Simulate 1 game completion
    await GamingActivityService.recordGameCompletion(testUserId, { won: true, eventId: `evt_1_${Date.now()}` });
    const after1Win = await GamingActivityService.getDailyObjectives(testUserId);

    // Play 3 Games should be 1/3, Play 7 Games should be 1/7
    const q2 = after1Win.objectives.find((q) => q.id === 'play_3_games');
    const q3 = after1Win.objectives.find((q) => q.id === 'play_7_games');
    assert.strictEqual(q2.current, 1, 'play_3_games should have progress 1');
    assert.strictEqual(q3.current, 1, 'play_7_games should have progress 1');

    // Simulate 2 more game completions (total 3)
    await GamingActivityService.recordGameCompletion(testUserId, { won: true, eventId: `evt_2_${Date.now()}` });
    await GamingActivityService.recordGameCompletion(testUserId, { won: true, eventId: `evt_3_${Date.now()}` });
    const after3Wins = await GamingActivityService.getDailyObjectives(testUserId);

    const q2After = after3Wins.objectives.find((q) => q.id === 'play_3_games');
    const q3After = after3Wins.objectives.find((q) => q.id === 'play_7_games');
    assert.strictEqual(q2After.current, 3, 'play_3_games reached target 3');
    assert.strictEqual(q2After.isCompleted, true, 'play_3_games marked completed');
    assert.strictEqual(q3After.current, 3, 'play_7_games reached progress 3');
    assert.strictEqual(q3After.isCompleted, false, 'play_7_games not yet completed (3/7)');

    pass('Test 3: Daily Objectives track live in-game completions');
  } catch (e) {
    fail('Test 3: Daily Objectives Tracking', e);
  }

  // -------------------------------------------------------------
  // Test 4: Daily Objective Claiming & Duplicate Prevention
  // -------------------------------------------------------------
  try {
    const testEmail = `quest_${Date.now()}@pixo.gg`;
    const otpRes = await AuthService.requestOtp(testEmail);
    const regRes = await AuthService.registerUser({
      name: 'QuestClaimer',
      email: testEmail,
      password: 'Password123!',
      otp: otpRes.otp,
    });
    const user = regRes.user;

    // Check initial user balances
    const initialUser = await AuthService.findUserById(user.id);
    const initialXp = initialUser.xp || 0;
    const initialCoins = initialUser.coins || 0;

    // Claim Daily Login (+50 XP, +100 Coins)
    const claimRes1 = await GamingActivityService.claimDailyObjective(user.id, 'daily_login');
    assert.strictEqual(claimRes1.success, true);
    assert.strictEqual(claimRes1.xpAwarded, 50);
    assert.strictEqual(claimRes1.coinsAwarded, 100);

    // Verify user received XP and Coins
    const updatedUser = await AuthService.findUserById(user.id);
    assert.strictEqual(updatedUser.xp, initialXp + 50);
    assert.strictEqual(updatedUser.coins, initialCoins + 100);

    // Duplicate claim attempt must be rejected
    const dupRes = await GamingActivityService.claimDailyObjective(user.id, 'daily_login');
    assert.strictEqual(dupRes.success, false);
    assert.ok(dupRes.error.includes('already collected') || dupRes.error.includes('already claimed'));

    pass('Test 4: Daily Objective reward claiming & duplicate prevention');
  } catch (e) {
    fail('Test 4: Daily Objective Claiming', e);
  }

  // -------------------------------------------------------------
  // Test 5: Sequential Level Unlocking - New Player Starts at Level 1
  // -------------------------------------------------------------
  try {
    const testUserId = `test_player_lvl_${Date.now()}`;
    const unlockedLevel = await GamingActivityService.getUserUnlockedLevel(testUserId);
    assert.strictEqual(unlockedLevel, 1, 'New player must start with Level 1 unlocked');

    const allLevels = await GamingActivityService.getGameLevels(testUserId);
    assert.strictEqual(allLevels.length, 10, 'Must have exactly 10 game levels');
    assert.strictEqual(allLevels[0].isUnlocked, true, 'Level 1 is unlocked');
    assert.strictEqual(allLevels[0].isCurrent, true, 'Level 1 is current');
    assert.strictEqual(allLevels[0].isCompleted, false, 'Level 1 is not yet completed');

    for (let i = 1; i < 10; i++) {
      assert.strictEqual(allLevels[i].isLocked, true, `Level ${i + 1} must be locked initially`);
      assert.strictEqual(allLevels[i].isUnlocked, false, `Level ${i + 1} is not unlocked`);
    }

    pass('Test 5: New player starts with Level 1 unlocked and Levels 2–10 locked');
  } catch (e) {
    fail('Test 5: Sequential Level Initial State', e);
  }

  // -------------------------------------------------------------
  // Test 6: Completing Level 1 Unlocks Level 2 Sequentially
  // -------------------------------------------------------------
  try {
    const testEmail = `prog_${Date.now()}@pixo.gg`;
    const otpRes = await AuthService.requestOtp(testEmail);
    const regRes = await AuthService.registerUser({
      name: 'LevelProgressor',
      email: testEmail,
      password: 'Password123!',
      otp: otpRes.otp,
    });
    const testUserId = regRes.user.id;

    const sess = await GamingActivityService.startSession(testUserId, {
      id: 'g_target_no',
      title: 'Target Number',
      category: 'Speed Math',
    });

    // Complete Level 1 with a WIN
    const compRes = await GamingActivityService.completeSession(testUserId, sess.id, {
      score: 500,
      result: 'Victory',
      completedLevel: 1,
      won: true,
      gameDifficulty: 1,
    });

    assert.strictEqual(compRes.unlockedLevel, 2, 'Completing Level 1 must unlock Level 2');

    const updatedLevels = await GamingActivityService.getGameLevels(testUserId);
    assert.strictEqual(updatedLevels[0].isCompleted, true, 'Level 1 is now marked completed');
    assert.strictEqual(updatedLevels[1].isUnlocked, true, 'Level 2 is now unlocked');
    assert.strictEqual(updatedLevels[1].isCurrent, true, 'Level 2 is now current');
    assert.strictEqual(updatedLevels[2].isLocked, true, 'Level 3 remains locked');

    pass('Test 6: Completing Level 1 successfully unlocks Level 2');
  } catch (e) {
    fail('Test 6: Level 1 Completion Unlock', e);
  }

  // -------------------------------------------------------------
  // Test 7: Defeat or Incomplete Game Does NOT Unlock Next Level
  // -------------------------------------------------------------
  try {
    const testUserId = `test_defeat_lvl_${Date.now()}`;
    // User is at Level 1
    const sess = await GamingActivityService.startSession(testUserId, {
      id: 'g_target_no',
      title: 'Target Number',
    });

    // Lost / Defeat
    const compRes = await GamingActivityService.completeSession(testUserId, sess.id, {
      score: 100,
      result: 'Defeat',
      completedLevel: 1,
      won: false,
    });

    const levelAfterDefeat = await GamingActivityService.getUserUnlockedLevel(testUserId);
    assert.strictEqual(levelAfterDefeat, 1, 'Defeat must NOT advance unlocked level');

    pass('Test 7: Game defeat or abandoned round does NOT unlock the next level');
  } catch (e) {
    fail('Test 7: Defeat Prevents Level Advancement', e);
  }

  // -------------------------------------------------------------
  // Test 8: Sequential Advancement from Level 2 to Level 10 Cap
  // -------------------------------------------------------------
  try {
    const testUserId = `test_cap_${Date.now()}`;

    // Sequentially advance through all 10 levels
    for (let lvl = 1; lvl <= 9; lvl++) {
      const newLvl = await GamingActivityService.unlockNextLevel(testUserId, lvl);
      assert.strictEqual(newLvl, lvl + 1, `Level ${lvl} win must unlock Level ${lvl + 1}`);
    }

    const maxUnlocked = await GamingActivityService.getUserUnlockedLevel(testUserId);
    assert.strictEqual(maxUnlocked, 10, 'Unlocked level must be at Level 10');

    // Winning Level 10 does not exceed 10
    const cappedLvl = await GamingActivityService.unlockNextLevel(testUserId, 10);
    assert.strictEqual(cappedLvl, 10, 'Unlocked level must not exceed 10');

    pass('Test 8: Sequential advancement through all 10 levels correctly caps at Level 10');
  } catch (e) {
    fail('Test 8: Level 10 Cap', e);
  }

  // -------------------------------------------------------------
  // Test 9: Replaying Lower Level Does Not Regress Unlocked Level
  // -------------------------------------------------------------
  try {
    const testUserId = `test_replay_${Date.now()}`;
    // Advance to Level 4
    await GamingActivityService.unlockNextLevel(testUserId, 1);
    await GamingActivityService.unlockNextLevel(testUserId, 2);
    await GamingActivityService.unlockNextLevel(testUserId, 3);
    const beforeReplay = await GamingActivityService.getUserUnlockedLevel(testUserId);
    assert.strictEqual(beforeReplay, 4);

    // Replay Level 1
    const afterReplay = await GamingActivityService.unlockNextLevel(testUserId, 1);
    assert.strictEqual(afterReplay, 4, 'Replaying Level 1 must not change unlocked Level 4');

    pass('Test 9: Replaying earlier levels does not regress unlocked level progression');
  } catch (e) {
    fail('Test 9: Replay Lower Level', e);
  }

  // -------------------------------------------------------------
  // Test 10: TargetNumberGameModal Passes initialLevel
  // -------------------------------------------------------------
  try {
    const modalContent = fs.readFileSync(path.resolve('src/components/gameplay/TargetNumberGameModal.js'), 'utf-8');
    assert.ok(
      modalContent.includes('initialLevel = 1') &&
      modalContent.includes('setCurrentLevel(initialLevel)'),
      'TargetNumberGameModal must accept and sync with initialLevel'
    );

    const homeContent = fs.readFileSync(path.resolve('src/screens/HomeScreen.js'), 'utf-8');
    assert.ok(
      homeContent.includes('initialLevel={targetLevelToPlay}'),
      'HomeScreen must pass targetLevelToPlay as initialLevel to TargetNumberGameModal'
    );

    pass('Test 10: TargetNumberGameModal correctly accepts and syncs initialLevel prop');
  } catch (e) {
    fail('Test 10: initialLevel Modal Sync', e);
  }

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests} PASSED | ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) process.exit(1);
}

runTests();
