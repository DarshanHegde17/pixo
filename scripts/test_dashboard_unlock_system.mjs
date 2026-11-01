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
      homeScreenContent.includes('topRewardSummaryBar'),
      'HomeScreen must contain topRewardSummaryBar'
    );

    assert.ok(
      homeScreenContent.includes('userCoins.toLocaleString()') &&
      homeScreenContent.includes('COINS') &&
      homeScreenContent.includes('userStreak') &&
      homeScreenContent.includes('userXp.toLocaleString()') &&
      homeScreenContent.includes('XP'),
      'Top Reward Summary must display live Coins, Streak Days, and XP'
    );

    pass('Test 2: Top Reward Summary renders live Coins, Streak Days, and XP format');
  } catch (e) {
    fail('Test 2: Top Reward Summary', e);
  }

  // -------------------------------------------------------------
  // Test 3: Daily Quest Section Structure & Live Tracking
  // -------------------------------------------------------------
  try {
    const testUserId = `test_quest_user_${Date.now()}`;
    const initialQuests = await GamingActivityService.getDailyQuests(testUserId);

    assert.strictEqual(initialQuests.quests.length, 3, 'Must have exactly 3 Daily Quests');
    assert.strictEqual(initialQuests.quests[0].title, 'Win 2 Sprint Duels in a Row');
    assert.strictEqual(initialQuests.quests[1].title, 'Play Any 2 Duels');
    assert.strictEqual(initialQuests.quests[2].title, 'Win 2 Ken-Ken Duels in a Row');

    // Simulate 1 game win
    await GamingActivityService.recordQuestActivity(testUserId, { won: true, difficulty: 1 });
    const after1Win = await GamingActivityService.getDailyQuests(testUserId);

    // Played duels should be 1
    const quest2 = after1Win.quests.find((q) => q.id === 'quest_2');
    assert.strictEqual(quest2.current, 1, 'Quest 2 (Play Any 2 Duels) should have progress 1');

    // Consecutive wins should be 1
    const quest1 = after1Win.quests.find((q) => q.id === 'quest_1');
    assert.strictEqual(quest1.current, 1, 'Quest 1 (Win 2 in a Row) should have progress 1');

    // Simulate 2nd consecutive win
    await GamingActivityService.recordQuestActivity(testUserId, { won: true, difficulty: 2 });
    const after2Wins = await GamingActivityService.getDailyQuests(testUserId);

    const q1After = after2Wins.quests.find((q) => q.id === 'quest_1');
    const q2After = after2Wins.quests.find((q) => q.id === 'quest_2');
    assert.strictEqual(q1After.current, 2, 'Quest 1 reached target 2');
    assert.strictEqual(q1After.isCompleted, true, 'Quest 1 marked completed');
    assert.strictEqual(q2After.current, 2, 'Quest 2 reached target 2');
    assert.strictEqual(q2After.isCompleted, true, 'Quest 2 marked completed');

    pass('Test 3: Daily Quests track live in-game completions and consecutive wins');
  } catch (e) {
    fail('Test 3: Daily Quest Tracking', e);
  }

  // -------------------------------------------------------------
  // Test 4: Daily Quest Claiming & Duplicate Prevention
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

    // Complete 2 wins
    await GamingActivityService.recordQuestActivity(user.id, { won: true });
    await GamingActivityService.recordQuestActivity(user.id, { won: true });

    // Claim Quest 1 (+25 XP, +5 Coins)
    const claimRes1 = await GamingActivityService.claimQuestReward(user.id, 'quest_1');
    assert.strictEqual(claimRes1.success, true);
    assert.strictEqual(claimRes1.xpAwarded, 25);
    assert.strictEqual(claimRes1.coinsAwarded, 5);

    // Verify user received XP and Coins
    const updatedUser = await AuthService.findUserById(user.id);
    assert.strictEqual(updatedUser.xp, 25);
    assert.strictEqual(updatedUser.coins, 5);

    // Duplicate claim attempt must be rejected
    const dupRes = await GamingActivityService.claimQuestReward(user.id, 'quest_1');
    assert.strictEqual(dupRes.success, false, 'Duplicate claim must fail');
    assert.ok(
      (dupRes.error || dupRes.message || '').includes('already collected') ||
      (dupRes.error || dupRes.message || '').includes('already claimed')
    );

    // Balances must remain untouched after duplicate attempt
    const afterDupUser = await AuthService.findUserById(user.id);
    assert.strictEqual(afterDupUser.xp, 25);
    assert.strictEqual(afterDupUser.coins, 5);

    pass('Test 4: Daily Quest reward claiming awards XP & Coins and prevents duplicates');
  } catch (e) {
    fail('Test 4: Quest Claiming', e);
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
