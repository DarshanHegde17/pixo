/**
 * PIXO: 8-BIT PIXEL KINGDOM ADVENTURE VERIFICATION SUITE
 * 
 * Comprehensive automated verification for Master Prompt – Pixel Kingdom Adventure:
 * 1. 10 Mission Levels with Metadata & Progressive Difficulties
 * 2. 4 Epic Boss Battles (Shadow Knight, Fire Drake, Crystal Behemoth, Ancient Red Dragon)
 * 3. Sequential Level Unlocking (Levels 1 to 10 progression, locked levels check)
 * 4. Economy & Difficulty-Based Rewards Integration (XP & Coin balance credit, anti-farming)
 * 5. Daily Streak & Gaming Activity Registration
 * 6. Cloud Save & Game Resume (player position, health, coins, progress)
 * 7. 2D Side-Scrolling Physics & Collision Engine (AABB, platforms, hazards, enemies, collectibles)
 * 8. Centralized Global Navigation (pixel_kingdom, pixel_kingdom_levels, pixel_kingdom_gameplay)
 * 9. Audio Synthesizer SFX Engine (8-bit square/sawtooth tones, mute toggle)
 * 10. HomeScreen & Component Integration
 */

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const Module = require('module');

// Alias react-native to react-native-web in Node.js test environment
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'react-native') {
    return origResolve.call(this, 'react-native-web', parent, isMain, options);
  }
  return origResolve.call(this, request, parent, isMain, options);
};

// In-memory localStorage mock for AsyncStorage in Node test environment
const mockStorage = new Map();
global.window = {
  localStorage: {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
  },
};
global.localStorage = global.window.localStorage;

require('@babel/register')({ presets: ['babel-preset-expo'] });

const {
  PIXEL_KINGDOM_LEVELS,
  PixelKingdomPersistenceService,
} = require('../src/services/pixelKingdomPersistenceService.js');

const { PixelKingdomAudio } = require('../src/services/pixelKingdomAudioService.js');
const { NavigationService } = require('../src/services/navigationService.js');
const {
  generateLevelData,
  checkAABB,
  LEVEL_WIDTH,
  LEVEL_HEIGHT,
} = require('../src/components/gameplay/pixelKingdom/PixelKingdomEngine.js');
const { AuthService } = require('../src/services/authService.js');
const { GamingActivityService } = require('../src/services/gamingActivityService.js');

console.log('\n================================================================');
console.log('⚔️  PIXO: 8-BIT PIXEL KINGDOM ADVENTURE VERIFICATION SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function pass(name) {
  totalTests++;
  passedTests++;
  console.log(`  \x1b[32m✔ PASS\x1b[0m - ${name}`);
}

function fail(name, err) {
  totalTests++;
  console.error(`  \x1b[31m✖ FAIL\x1b[0m - ${name}`);
  console.error(err);
}

async function run() {
  const testUserId = `usr_pk_${Date.now()}`;
  const testEmail = `pk_${Date.now()}@pixo.gg`;

  // Register test user
  const otpRes = await AuthService.requestOtp(testEmail);
  const regRes = await AuthService.registerUser({
    name: 'PixelKnightHero',
    email: testEmail,
    password: 'KnightPassword2026!',
    otp: otpRes.otp,
  });
  const user = regRes.user;

  // -------------------------------------------------------------
  // Test 1: Level Metadata & 10 Missions Configuration
  // -------------------------------------------------------------
  try {
    assert.strictEqual(PIXEL_KINGDOM_LEVELS.length, 10, 'Must have exactly 10 levels');

    const expectedTitles = [
      'The Forgotten Forest',
      'The Broken Kingdom',
      'Castle of Shadows',
      'The Underground Dungeon',
      "Dragon's Mountain",
      'The Lost Royal City',
      'The Dark Fortress',
      'The Crystal Kingdom',
      'The Cursed Castle',
      'The Final Dragon Battle',
    ];

    PIXEL_KINGDOM_LEVELS.forEach((lvl, idx) => {
      assert.strictEqual(lvl.level, idx + 1, `Level index ${idx + 1} matches`);
      assert.strictEqual(lvl.title, expectedTitles[idx], `Title for level ${idx + 1} matches specification`);
      assert.ok(lvl.rewardXp > 0, `Level ${idx + 1} has XP reward`);
      assert.ok(lvl.rewardCoins > 0, `Level ${idx + 1} has Coin reward`);
      assert.ok(lvl.objective, `Level ${idx + 1} has a clear objective`);
    });

    // Check Boss Levels (3, 5, 8, 10)
    assert.ok(PIXEL_KINGDOM_LEVELS[2].isBossLevel && PIXEL_KINGDOM_LEVELS[2].boss.name === 'Shadow Knight', 'Level 3 has Shadow Knight boss');
    assert.ok(PIXEL_KINGDOM_LEVELS[4].isBossLevel && PIXEL_KINGDOM_LEVELS[4].boss.name === 'Fire Drake', 'Level 5 has Fire Drake boss');
    assert.ok(PIXEL_KINGDOM_LEVELS[7].isBossLevel && PIXEL_KINGDOM_LEVELS[7].boss.name === 'Crystal Behemoth', 'Level 8 has Crystal Behemoth boss');
    assert.ok(PIXEL_KINGDOM_LEVELS[9].isBossLevel && PIXEL_KINGDOM_LEVELS[9].boss.name === 'The Ancient Red Dragon', 'Level 10 has The Ancient Red Dragon boss');

    pass('Test 1: 10 Missions configured with complete metadata & 4 Boss Battles');
  } catch (e) {
    fail('Test 1: Level Metadata Configuration', e);
  }

  // -------------------------------------------------------------
  // Test 2: Sequential Level Unlocking (Levels 1 to 10)
  // -------------------------------------------------------------
  try {
    // Fresh player starts with Level 1 unlocked
    const initialUnlocked = await PixelKingdomPersistenceService.getUnlockedLevel(user.id);
    assert.strictEqual(initialUnlocked, 1, 'New player must start with Level 1 unlocked');

    const completedInitial = await PixelKingdomPersistenceService.getCompletedLevels(user.id);
    assert.strictEqual(completedInitial.length, 0, 'No levels completed initially');

    // Completing Level 1 unlocks Level 2
    await PixelKingdomPersistenceService.recordLevelCompletion(user.id, 1, 850);
    const unlockedAfter1 = await PixelKingdomPersistenceService.getUnlockedLevel(user.id);
    assert.strictEqual(unlockedAfter1, 2, 'Completing Level 1 must unlock Level 2');
    assert.ok(await PixelKingdomPersistenceService.isLevelCompleted(user.id, 1), 'Level 1 marked as completed');

    // Completing Level 2 unlocks Level 3
    await PixelKingdomPersistenceService.recordLevelCompletion(user.id, 2, 920);
    const unlockedAfter2 = await PixelKingdomPersistenceService.getUnlockedLevel(user.id);
    assert.strictEqual(unlockedAfter2, 3, 'Completing Level 2 must unlock Level 3');

    // Replaying Level 1 does not regress unlocked level
    await PixelKingdomPersistenceService.recordLevelCompletion(user.id, 1, 1050);
    const unlockedAfterReplay = await PixelKingdomPersistenceService.getUnlockedLevel(user.id);
    assert.strictEqual(unlockedAfterReplay, 3, 'Replaying Level 1 preserves highest unlocked level 3');

    // Check high score update
    const highScoreLvl1 = await PixelKingdomPersistenceService.getLevelHighScore(user.id, 1);
    assert.strictEqual(highScoreLvl1, 1050, 'High score reflects highest score achieved');

    pass('Test 2: Sequential Level Unlocking (1 -> 2 -> 3) and High Score recording');
  } catch (e) {
    fail('Test 2: Sequential Level Unlocking', e);
  }

  // -------------------------------------------------------------
  // Test 3: Economy & Reward Integration (XP, Coins, Anti-Farming)
  // -------------------------------------------------------------
  try {
    const userBefore = await AuthService.findUserById(user.id);
    const xpBefore = userBefore.xp || 0;
    const coinsBefore = userBefore.coins || 0;

    // Complete Level 3 (Boss Battle)
    const rewardRes = await PixelKingdomPersistenceService.claimLevelRewards(
      user.id,
      3,
      1200,
      75
    );

    assert.ok(rewardRes.success, 'Level 3 reward claim must succeed');
    assert.strictEqual(rewardRes.xpAwarded, 30, 'Level 3 awards 30 XP according to difficulty reward system');
    assert.strictEqual(rewardRes.coinsAwarded, 6, 'Level 3 awards 6 Coins according to difficulty reward system');

    const userAfter = await AuthService.findUserById(user.id);
    assert.strictEqual(userAfter.xp, xpBefore + 30, 'User XP balance credited in database');
    assert.strictEqual(userAfter.coins, coinsBefore + 6, 'User Coin balance credited in database');

    // Replaying Level 3 applies anti-farming (0 duplicate rewards for same level)
    const repeatRes = await PixelKingdomPersistenceService.claimLevelRewards(
      user.id,
      3,
      1400,
      60
    );
    assert.strictEqual(repeatRes.xpAwarded, 0, 'Repeat clear rejects duplicate XP abuse (0 XP)');
    assert.strictEqual(repeatRes.coinsAwarded, 0, 'Repeat clear rejects duplicate Coins abuse (0 Coins)');

    pass('Test 3: Economy rewards correctly credit user balance with anti-farming logic');
  } catch (e) {
    fail('Test 3: Economy Rewards Integration', e);
  }

  // -------------------------------------------------------------
  // Test 4: Daily Streak & Gaming Activity Registration
  // -------------------------------------------------------------
  try {
    const completions = await GamingActivityService.getUserCompletions(user.id);
    const pkCompletions = completions.filter((c) => c.gameId === 'g_retro_adv');
    assert.ok(pkCompletions.length >= 2, 'Pixel Kingdom sessions registered in verified gaming activity log');

    const streakState = await GamingActivityService.getUserStreakState(user.id);
    assert.ok(streakState.currentStreak >= 1, 'Pixel Kingdom completions increment and sustain daily streak');

    pass('Test 4: Daily streak and gaming activity logs registered successfully');
  } catch (e) {
    fail('Test 4: Daily Streak Integration', e);
  }

  // -------------------------------------------------------------
  // Test 5: Cloud Save & Unfinished Mission Resume
  // -------------------------------------------------------------
  try {
    // Save mid-game state on Level 4
    await PixelKingdomPersistenceService.saveActiveSession(user.id, {
      level: 4,
      playerX: 680,
      playerY: 260,
      health: 80,
      score: 450,
      coinsCollected: 6,
      enemiesDefeated: 3,
      elapsedSeconds: 42,
    });

    const activeSession = await PixelKingdomPersistenceService.getActiveSession(user.id);
    assert.ok(activeSession, 'Active session successfully saved and retrieved');
    assert.strictEqual(activeSession.level, 4, 'Saved level is 4');
    assert.strictEqual(activeSession.health, 80, 'Saved health is 80');
    assert.strictEqual(activeSession.coinsCollected, 6, 'Saved coins count is 6');

    // Clearing session removes it
    await PixelKingdomPersistenceService.clearActiveSession(user.id);
    const cleared = await PixelKingdomPersistenceService.getActiveSession(user.id);
    assert.strictEqual(cleared, null, 'Active session is cleanly cleared upon completion or reset');

    pass('Test 5: Cloud Save and Game Resume session persistence verified');
  } catch (e) {
    fail('Test 5: Cloud Save & Resume', e);
  }

  // -------------------------------------------------------------
  // Test 6: 2D Side-Scrolling Physics & Collision Engine
  // -------------------------------------------------------------
  try {
    // Generate Level 1 (Forest)
    const level1Data = generateLevelData(1);
    assert.ok(level1Data.platforms.length >= 10, 'Level 1 contains multiple platforms');
    assert.ok(level1Data.coins.length >= 8, 'Level 1 contains at least 8 coins');
    assert.ok(level1Data.enemies.length >= 4, 'Level 1 contains at least 4 enemies');
    assert.ok(level1Data.exitPortal, 'Level 1 contains exit portal');

    // Generate Level 10 (Final Dragon Battle)
    const level10Data = generateLevelData(10);
    assert.ok(level10Data.boss && level10Data.boss.type === 'dragon', 'Level 10 contains Ancient Red Dragon boss');
    assert.strictEqual(level10Data.boss.maxHp, 500, 'Dragon boss has 500 HP');

    // AABB collision check
    const box1 = { x: 50, y: 50, width: 20, height: 20 };
    const box2 = { x: 60, y: 60, width: 20, height: 20 };
    const box3 = { x: 100, y: 100, width: 20, height: 20 };
    assert.ok(checkAABB(box1, box2), 'Overlapping boxes collide');
    assert.ok(!checkAABB(box1, box3), 'Separated boxes do not collide');

    pass('Test 6: 2D Side-scrolling physics geometry, levels, and AABB collision engine verified');
  } catch (e) {
    fail('Test 6: Physics Engine Verification', e);
  }

  // -------------------------------------------------------------
  // Test 7: Centralized Navigation Integration
  // -------------------------------------------------------------
  try {
    assert.ok(NavigationService.isValidRoute('pixel_kingdom'), 'Route pixel_kingdom is valid');
    assert.ok(NavigationService.isValidRoute('pixel_kingdom_levels'), 'Route pixel_kingdom_levels is valid');
    assert.ok(NavigationService.isValidRoute('pixel_kingdom_gameplay'), 'Route pixel_kingdom_gameplay is valid');

    assert.strictEqual(NavigationService.getRouteTitle('pixel_kingdom'), 'Pixel Kingdom Adventure');
    assert.strictEqual(NavigationService.getRouteTitle('pixel_kingdom_levels'), 'Pixel Kingdom • Mission Level Selection');
    assert.strictEqual(NavigationService.getRouteTitle('pixel_kingdom_gameplay'), 'Pixel Kingdom • Active Mission');

    pass('Test 7: Centralized navigation routes and titles registered properly');
  } catch (e) {
    fail('Test 7: Navigation Integration', e);
  }

  // -------------------------------------------------------------
  // Test 8: Audio Synthesizer Engine
  // -------------------------------------------------------------
  try {
    assert.ok(typeof PixelKingdomAudio.playJump === 'function', 'Audio has playJump');
    assert.ok(typeof PixelKingdomAudio.playSlash === 'function', 'Audio has playSlash');
    assert.ok(typeof PixelKingdomAudio.playShield === 'function', 'Audio has playShield');
    assert.ok(typeof PixelKingdomAudio.playCoin === 'function', 'Audio has playCoin');
    assert.ok(typeof PixelKingdomAudio.playHit === 'function', 'Audio has playHit');
    assert.ok(typeof PixelKingdomAudio.playEnemyDefeat === 'function', 'Audio has playEnemyDefeat');
    assert.ok(typeof PixelKingdomAudio.playBossRoar === 'function', 'Audio has playBossRoar');
    assert.ok(typeof PixelKingdomAudio.playVictory === 'function', 'Audio has playVictory');
    assert.ok(typeof PixelKingdomAudio.playGameOver === 'function', 'Audio has playGameOver');

    // Test mute toggle
    const muted = await PixelKingdomAudio.toggleMute();
    assert.strictEqual(typeof muted, 'boolean', 'toggleMute returns boolean state');
    await PixelKingdomAudio.toggleMute(); // toggle back

    pass('Test 8: 8-Bit Audio Synthesizer SFX engine verified');
  } catch (e) {
    fail('Test 8: Audio Synthesizer', e);
  }

  // -------------------------------------------------------------
  // Test 9: Component Files & HomeScreen Registration Verification
  // -------------------------------------------------------------
  try {
    assert.ok(fs.existsSync(path.resolve('src/components/gameplay/PixelKingdomGameModal.js')), 'PixelKingdomGameModal.js exists');
    assert.ok(fs.existsSync(path.resolve('src/components/gameplay/pixelKingdom/PixelKingdomIntroScreen.js')), 'PixelKingdomIntroScreen.js exists');
    assert.ok(fs.existsSync(path.resolve('src/components/gameplay/pixelKingdom/PixelKingdomLevelSelect.js')), 'PixelKingdomLevelSelect.js exists');
    assert.ok(fs.existsSync(path.resolve('src/components/gameplay/pixelKingdom/PixelKingdomGameScreen.js')), 'PixelKingdomGameScreen.js exists');
    assert.ok(fs.existsSync(path.resolve('src/components/gameplay/pixelKingdom/PixelKingdomSprites.js')), 'PixelKingdomSprites.js exists');
    assert.ok(fs.existsSync(path.resolve('src/components/gameplay/pixelKingdom/PixelKingdomEngine.js')), 'PixelKingdomEngine.js exists');

    const homeFile = fs.readFileSync(path.resolve('src/screens/HomeScreen.js'), 'utf8');
    assert.ok(homeFile.includes('PixelKingdomGameModal'), 'HomeScreen renders PixelKingdomGameModal');
    assert.ok(homeFile.includes('PixelKingdomPersistenceService'), 'HomeScreen imports PixelKingdomPersistenceService');
    assert.ok(homeFile.includes('isPixelKingdom'), 'HomeScreen ALL_GAMES includes Pixel Kingdom game entry');

    pass('Test 9: All Pixel Kingdom components created and integrated into HomeScreen');
  } catch (e) {
    fail('Test 9: Component Files & HomeScreen Registration', e);
  }

  // Summary
  console.log('\n================================================================');
  console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log('================================================================\n');

  if (totalTests - passedTests > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error in Pixel Kingdom test runner:', err);
  process.exit(1);
});
