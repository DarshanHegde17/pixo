import assert from 'assert';
import fs from 'fs';
import path from 'path';

// Load services in node environment
const { GamingActivityService, GAME_LEVELS_CONFIG } = await import('../src/services/gamingActivityService.js');
const { AuthService } = await import('../src/services/authService.js');
const { GamePersistenceService } = await import('../src/services/gamePersistenceService.js');

console.log('🎮 ====================================================');
console.log('🎮 PIXO SEQUENTIAL LEVEL PROGRESSION & UNLOCK SYSTEM TEST');
console.log('🎮 ====================================================\n');

async function runLevelLockingTests() {
  const testUserId = `test_player_${Date.now()}`;
  const testEmail = `player_${Date.now()}@pixo.gg`;

  console.log('▶ STEP 1: Register fresh test player');
  const otpRes = await AuthService.requestOtp(testEmail);
  const regRes = await AuthService.registerUser({
    name: 'LevelSlayer',
    email: testEmail,
    password: 'password123',
    otp: otpRes.otp,
  });
  if (!regRes.success) {
    throw new Error(`Registration failed: ${regRes.error}`);
  }
  const userId = regRes.user.id;
  console.log(`   User registered: ${userId} (${regRes.user.name})`);

  // SCENARIO 1: First time open — Level 1 unlocked, Levels 2+ locked
  console.log('\n▶ SCENARIO 1: First-time open default state');
  const initialUnlockedNeon = await GamingActivityService.getUserUnlockedLevel(userId, 'g1');
  assert.strictEqual(initialUnlockedNeon, 1, 'Neon Runner should start with Level 1 unlocked');
  
  const initialUnlockedTarget = await GamingActivityService.getUserUnlockedLevel(userId, 'g_target_no');
  assert.strictEqual(initialUnlockedTarget, 1, 'Target Number should start with Level 1 unlocked');

  const neonLevels = await GamingActivityService.getGameLevels(userId, 'g1', 6);
  assert.strictEqual(neonLevels[0].isUnlocked, true, 'Level 1 is unlocked');
  assert.strictEqual(neonLevels[0].isLocked, false, 'Level 1 is not locked');
  assert.strictEqual(neonLevels[1].isUnlocked, false, 'Level 2 is locked');
  assert.strictEqual(neonLevels[1].isLocked, true, 'Level 2 is locked');
  assert.strictEqual(neonLevels[1].unlockMessage, 'Complete Level 1 to Unlock', 'Level 2 shows correct lock requirement');
  assert.strictEqual(neonLevels[5].isLocked, true, 'Level 6 is locked');
  console.log('   ✅ Level 1 unlocked by default; Levels 2–6 locked with "Complete Level N-1 to Unlock" message');

  // SCENARIO 2: Complete Level 1 victory on Neon Runner (g1)
  console.log('\n▶ SCENARIO 2: Victory on Level 1 -> Unlocks Level 2');
  const sess1 = await GamingActivityService.startSession(userId, { id: 'g1', title: 'Neon Runner: 2099' });
  const comp1 = await GamingActivityService.completeSession(userId, sess1.id, {
    difficulty: 1,
    score: 9500,
    durationSeconds: 45,
    result: 'Victory - Level 1 Cleared',
  });

  assert.strictEqual(comp1.success, true, 'Session completed successfully');
  assert.strictEqual(comp1.levelUnlocked, 2, 'Should unlock Level 2 on Level 1 victory');
  assert.strictEqual(comp1.alreadyCompleted, false, 'First time victory should not be marked already completed');
  assert.strictEqual(comp1.xpAwarded, 10, 'Awards Level 1 XP');
  assert.strictEqual(comp1.coinsAwarded, 2, 'Awards Level 1 Coins');

  const unlockedAfterL1 = await GamingActivityService.getUserUnlockedLevel(userId, 'g1');
  assert.strictEqual(unlockedAfterL1, 2, 'Database unlocked level for g1 is now 2');

  const isL1Done = await GamingActivityService.isLevelAlreadyCompleted(userId, 'g1', 1);
  assert.strictEqual(isL1Done, true, 'Level 1 recorded as completed in database');
  console.log('   ✅ Level 1 victory recorded, Level 2 unlocked automatically, rewards credited');

  // SCENARIO 3: Persistent progress check (across restart/re-fetch)
  console.log('\n▶ SCENARIO 3: Persistent progress across app reload/sessions');
  const reloadedLevels = await GamingActivityService.getGameLevels(userId, 'g1', 6);
  assert.strictEqual(reloadedLevels[0].isCompleted, true, 'Level 1 remains completed');
  assert.strictEqual(reloadedLevels[0].isUnlocked, true, 'Level 1 remains unlocked');
  assert.strictEqual(reloadedLevels[1].isUnlocked, true, 'Level 2 is unlocked');
  assert.strictEqual(reloadedLevels[1].isCurrent, true, 'Level 2 is current active level');
  assert.strictEqual(reloadedLevels[2].isLocked, true, 'Level 3 remains locked');
  console.log('   ✅ Level progress accurately persisted in storage');

  // SCENARIO 4: Defeat / Failure on Level 2 -> Level 3 must NOT unlock
  console.log('\n▶ SCENARIO 4: Defeat on Level 2 -> Next level remains LOCKED');
  const sessFail = await GamingActivityService.startSession(userId, { id: 'g1', title: 'Neon Runner: 2099' });
  const compFail = await GamingActivityService.completeSession(userId, sessFail.id, {
    difficulty: 2,
    score: 2100,
    durationSeconds: 15,
    result: 'Defeat - Collided with obstacle',
  });

  assert.strictEqual(compFail.success, true, 'Session processed');
  assert.strictEqual(compFail.xpAwarded, 0, 'No XP for defeat');
  assert.strictEqual(compFail.coinsAwarded, 0, 'No Coins for defeat');
  
  const unlockedAfterFail = await GamingActivityService.getUserUnlockedLevel(userId, 'g1');
  assert.strictEqual(unlockedAfterFail, 2, 'Unlocked level must remain 2 after defeat');
  
  const isL2DoneAfterFail = await GamingActivityService.isLevelAlreadyCompleted(userId, 'g1', 2);
  assert.strictEqual(isL2DoneAfterFail, false, 'Level 2 is not completed after defeat');
  console.log('   ✅ Defeat awards 0 XP/Coins and strictly keeps Level 3 locked');

  // SCENARIO 5: Victory on Level 2 -> Unlocks Level 3
  console.log('\n▶ SCENARIO 5: Successful completion of Level 2 -> Unlocks Level 3');
  const sess2 = await GamingActivityService.startSession(userId, { id: 'g1', title: 'Neon Runner: 2099' });
  const comp2 = await GamingActivityService.completeSession(userId, sess2.id, {
    difficulty: 2,
    score: 12000,
    durationSeconds: 50,
    result: 'Victory - Level 2 Cleared',
  });

  assert.strictEqual(comp2.levelUnlocked, 3, 'Level 3 is unlocked');
  const unlockedAfterL2 = await GamingActivityService.getUserUnlockedLevel(userId, 'g1');
  assert.strictEqual(unlockedAfterL2, 3, 'Database unlocked level for g1 is now 3');
  console.log('   ✅ Level 2 victory unlocked Level 3');

  // SCENARIO 6: Replaying completed Level 1 -> NO duplicate XP or Coins
  console.log('\n▶ SCENARIO 6: Replaying completed Level 1 -> Prevents duplicate rewards');
  const allUsersBefore = await AuthService.getAllUsers();
  const userBeforeReplay = allUsersBefore.find((u) => u.id === userId);
  const xpBefore = userBeforeReplay.xp;
  const coinsBefore = userBeforeReplay.coins;

  const sessReplay = await GamingActivityService.startSession(userId, { id: 'g1', title: 'Neon Runner: 2099' });
  const compReplay = await GamingActivityService.completeSession(userId, sessReplay.id, {
    difficulty: 1,
    score: 10000,
    durationSeconds: 40,
    result: 'Victory - Replay Level 1 Cleared',
  });

  assert.strictEqual(compReplay.alreadyCompleted, true, 'Replay recognized as already completed');
  assert.strictEqual(compReplay.xpAwarded, 0, 'No duplicate XP awarded for completed level');
  assert.strictEqual(compReplay.coinsAwarded, 0, 'No duplicate Coins awarded for completed level');

  const allUsersAfter = await AuthService.getAllUsers();
  const userAfterReplay = allUsersAfter.find((u) => u.id === userId);
  assert.strictEqual(userAfterReplay.xp, xpBefore, 'Player XP unchanged on replay victory');
  assert.strictEqual(userAfterReplay.coins, coinsBefore, 'Player Coins unchanged on replay victory');

  const unlockedAfterReplay = await GamingActivityService.getUserUnlockedLevel(userId, 'g1');
  assert.strictEqual(unlockedAfterReplay, 3, 'Unlocked level preserved at 3');
  console.log('   ✅ Replaying completed levels awards 0 XP/Coins, preventing farming exploits');

  // SCENARIO 7: Game independence -> Shadow Blade (g2) and Target Number (g_target_no) unaffected
  console.log('\n▶ SCENARIO 7: Game independence check');
  const shadowBladeUnlocked = await GamingActivityService.getUserUnlockedLevel(userId, 'g2');
  assert.strictEqual(shadowBladeUnlocked, 1, 'Shadow Blade Level 1 unlocked by default (not affected by Neon Runner)');
  
  const targetUnlocked = await GamingActivityService.getUserUnlockedLevel(userId, 'g_target_no');
  assert.strictEqual(targetUnlocked, 1, 'Target Number Level 1 unlocked by default (not affected by Neon Runner)');
  console.log('   ✅ Each game maintains completely independent level progression');

  // SCENARIO 8: Home screen game cards remain openable and normal
  console.log('\n▶ SCENARIO 8: Home screen game cards integrity check');
  const homeCode = fs.readFileSync('src/screens/HomeScreen.js', 'utf8');
  assert.strictEqual(homeCode.includes('styles.levelTrackSection'), false, 'Level track section removed from Home screen');
  assert.strictEqual(homeCode.includes('RECENT_GAMES'), true, 'Continue Playing games present on Home screen');
  assert.strictEqual(homeCode.includes('DISCOVERY_GAMES'), true, 'Discovery games present on Home screen');
  assert.strictEqual(homeCode.includes('TRENDING_GAMES'), true, 'Trending games present on Home screen');
  assert.strictEqual(homeCode.includes('targetGameBanner'), true, 'Target Number game banner present and playable');
  assert.strictEqual(homeCode.includes('LeftChatPanel'), false, 'Left Co-pilot panel removed from Home screen');
  assert.strictEqual(homeCode.includes('RightChatPanel'), false, 'Right Comms panel removed from Home screen');
  console.log('   ✅ Home screen displays all game cards normally, unlocked, and without level restrictions');

  // SCENARIO 9: Modal UI Components integrity check
  console.log('\n▶ SCENARIO 9: Game modals level selection UI integrity');
  const targetModalCode = fs.readFileSync('src/components/gameplay/TargetNumberGameModal.js', 'utf8');
  assert(targetModalCode.includes('levelGridContainer'), 'Target Number modal contains 10-level grid container');
  assert(targetModalCode.includes('startGameBtnLocked'), 'Target Number modal contains locked button styling');
  assert(targetModalCode.includes('Complete Level ${lvl - 1} to Unlock'), 'Target Number shows sequential requirement');

  const detailsModalCode = fs.readFileSync('src/components/GameDetailsModal.js', 'utf8');
  assert(detailsModalCode.includes('MISSION LEVEL SELECTION'), 'GameDetailsModal contains mission level selector');
  assert(detailsModalCode.includes('launchButtonLocked'), 'GameDetailsModal contains locked start button');
  assert(detailsModalCode.includes('[1, 2, 3, 4, 5, 6]'), 'GameDetailsModal supports sequential Levels 1 to 6');
  console.log('   ✅ In-game modals feature clean sequential level selection with lock indicators');

  console.log('\n🎉 ALL 9 SEQUENTIAL LEVEL UNLOCKING & GAME INTEGRITY TESTS PASSED!');
}

runLevelLockingTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
