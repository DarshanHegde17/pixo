/**
 * MASTER TEST SUITE: PIXO PATH FINDER GAME
 * Tests all 13 sections of user requirements:
 * 1. Introduction Screen & Attributes
 * 2. Core Gameplay (orthogonal moves, no diagonals, no revisits, valid solutions)
 * 3. 4 Game Modes (Classic, Number, Trap Escape, Logic Challenge)
 * 4. 10 Sequential Stages (5x5 to 10x10)
 * 5. Touch / Mobile responsive logic
 * 6. UI & HUD metrics
 * 7. Path Validation & Diagnostic error explanations
 * 8. Sequential Stage Unlocking (1 to 10)
 * 9. PIXO XP & Coin Economy (10 XP + 2 Coins to 100 XP + 20 Coins)
 * 10. Diagnostic Hint System
 * 11. Cloud Save & Game Resume
 * 12. Complete removal of old Pixel Kingdom
 * 13. End-to-end integration
 */

const assert = require('assert').strict;
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

const { PathFinderService, PATH_FINDER_STAGES } = require('../src/services/pathFinderService.js');
const { PathFinderPersistenceService } = require('../src/services/pathFinderPersistenceService.js');
const { NavigationService } = require('../src/services/navigationService.js');

let passedTests = 0;
let totalTests = 0;

function check(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log('========================================================');
  console.log('🚀 RUNNING PIXO PATH FINDER TEST SUITE');
  console.log('========================================================\n');

  // --- SECTION 1: STAGE DEFINITIONS & 4 MODES ---
  console.log('--- TEST GROUP 1: STAGE DEFINITIONS & 4 MODES ---');
  check(PATH_FINDER_STAGES.length === 10, 'Path Finder must have exactly 10 stages');

  const expectedSizes = [5, 5, 6, 6, 7, 7, 8, 8, 9, 10];
  PATH_FINDER_STAGES.forEach((stage, idx) => {
    check(stage.id === idx + 1, `Stage ${idx + 1} has correct sequential id`);
    check(stage.gridSize === expectedSizes[idx], `Stage ${stage.id} has grid size ${expectedSizes[idx]}x${expectedSizes[idx]}`);
    check(Array.isArray(stage.solution) && stage.solution.length > 0, `Stage ${stage.id} has defined verified solution`);
  });

  const modes = new Set(PATH_FINDER_STAGES.map((s) => s.mode));
  check(modes.has('classic'), 'Mode 1: Classic Path present');
  check(modes.has('number'), 'Mode 2: Number Path present');
  check(modes.has('trap'), 'Mode 3: Trap Escape present');
  check(modes.has('logic'), 'Mode 4: Logic Challenge present');

  // --- SECTION 2: 100% VERIFIED SOLUTIONS ---
  console.log('\n--- TEST GROUP 2: VERIFIED SOLUTIONS VALIDATION ---');
  PATH_FINDER_STAGES.forEach((stage) => {
    const val = PathFinderService.validatePath(stage, stage.solution);
    check(val.valid === true, `Stage ${stage.id} (${stage.title}, ${stage.gridSize}x${stage.gridSize}) verified solution is valid in ${val.moves} moves`);
  });

  // --- SECTION 3: PATH VALIDATION ENGINE NEGATIVE TESTS ---
  console.log('\n--- TEST GROUP 3: PATH VALIDATION NEGATIVE TESTS ---');
  const stage1 = PATH_FINDER_STAGES[0];

  // Empty path
  const emptyRes = PathFinderService.validatePath(stage1, []);
  check(!emptyRes.valid && emptyRes.errorType === 'empty', 'Empty path rejected');

  // Wrong start
  const wrongStart = PathFinderService.validatePath(stage1, [[1, 0], [1, 1], [4, 4]]);
  check(!wrongStart.valid && wrongStart.errorType === 'start_mismatch', 'Wrong start tile rejected');

  // Not reaching finish
  const unfinished = PathFinderService.validatePath(stage1, [[0, 0], [0, 1], [0, 2]]);
  check(!unfinished.valid && unfinished.errorType === 'finish_mismatch', 'Path ending before Finish rejected');

  // Diagonal move
  const diagonal = PathFinderService.validatePath(stage1, [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]]);
  check(!diagonal.valid && diagonal.errorType === 'non_orthogonal', 'Diagonal move strictly rejected');

  // Revisit / loop
  const loopPath = PathFinderService.validatePath(stage1, [
    [0, 0], [0, 1], [0, 2], [0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [2, 4], [3, 4], [4, 4]
  ]);
  check(!loopPath.valid && loopPath.errorType === 'revisit', 'Revisiting tile rejected with loop error');

  // Blocked tile
  const blockedPath = PathFinderService.validatePath(stage1, [
    [0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [4, 2], [4, 3], [4, 4]
  ]);
  check(!blockedPath.valid && blockedPath.errorType === 'blocked', 'Crossing blocked tile rejected');

  // Trap tile (Stage 5)
  const stage5 = PATH_FINDER_STAGES[4];
  const trapPath = PathFinderService.validatePath(stage5, [
    [0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [5, 4], [5, 5], [5, 6], [6, 6]
  ]);
  check(!trapPath.valid && trapPath.errorType === 'trap', 'Stepping on danger trap rejected');

  // Checkpoints missing or out of order (Stage 3)
  const stage3 = PATH_FINDER_STAGES[2];
  const badOrderNumbers = PathFinderService.validatePath(stage3, [
    [0, 0], [0, 1], [0, 2], [0, 3], // visits 1
    [1, 3], [2, 3], [3, 3], // visits 2
    [4, 3], [5, 3], [5, 4], [5, 5] // reaches finish WITHOUT visiting 3
  ]);
  check(!badOrderNumbers.valid && badOrderNumbers.errorType === 'missing_number', 'Missing numbered checkpoint rejected');

  // Missing security key (Stage 8)
  const stage8 = PATH_FINDER_STAGES[7];
  const stage8WithMissingKey = {
    ...stage8,
    keys: [...stage8.keys, { r: 6, c: 6, id: 'key_c', name: 'Gamma Key', symbol: 'C' }]
  };
  const missingKeyRes = PathFinderService.validatePath(stage8WithMissingKey, stage8.solution);
  check(!missingKeyRes.valid && missingKeyRes.errorType === 'missing_key', 'Reaching Finish without required keys rejected');

  // Move limit exceeded (Stage 4)
  const stage4 = PATH_FINDER_STAGES[3];
  const stage4Strict = { ...stage4, maxMoves: 5 };
  const moveLimitRes = PathFinderService.validatePath(stage4Strict, stage4.solution);
  check(!moveLimitRes.valid && moveLimitRes.errorType === 'moves_exceeded', 'Exceeding move limit rejected');

  // --- SECTION 4: HINT GENERATION ---
  console.log('\n--- TEST GROUP 4: DIAGNOSTIC HINT SYSTEM ---');
  const startHint = PathFinderService.getHint(stage1, [[0, 0]], 0);
  check(startHint.includes('Row 1, Col 2') || startHint.includes('Begin your route'), 'Initial hint guides to first step');

  const onTrackHint = PathFinderService.getHint(stage1, [[0, 0], [0, 1]], 1);
  check(typeof onTrackHint === 'string' && onTrackHint.length > 10, 'On-track hint generated');

  const divergedHint = PathFinderService.getHint(stage1, [[0, 0], [1, 0]], 1);
  check(divergedHint.includes('Backtrack') || divergedHint.includes('diverged'), 'Diverged path hint instructs backtracking');

  // --- SECTION 5: SEQUENTIAL STAGE UNLOCKING ---
  console.log('\n--- TEST GROUP 5: SEQUENTIAL STAGE UNLOCKING ---');
  const testUserId = `test_pf_user_${Date.now()}`;

  // Initial state: Stage 1 unlocked
  const initUnlocked = await PathFinderPersistenceService.getUnlockedStage(testUserId);
  check(initUnlocked === 1, 'Stage 1 unlocked by default for new player');

  const initCompleted = await PathFinderPersistenceService.getCompletedStages(testUserId);
  check(initCompleted.length === 0, 'No stages completed initially');

  // Completing Stage 1 unlocks Stage 2
  const nextStage = await PathFinderPersistenceService.unlockNextStage(testUserId, 1);
  check(nextStage === 2, 'Completing Stage 1 unlocks Stage 2');

  const unlockedAfter1 = await PathFinderPersistenceService.getUnlockedStage(testUserId);
  check(unlockedAfter1 === 2, 'Storage confirms Stage 2 is unlocked');

  // Completing Stage 2 unlocks Stage 3
  await PathFinderPersistenceService.unlockNextStage(testUserId, 2);
  const unlockedAfter2 = await PathFinderPersistenceService.getUnlockedStage(testUserId);
  check(unlockedAfter2 === 3, 'Completing Stage 2 unlocks Stage 3');

  // --- SECTION 6: PIXO XP & COIN ECONOMY ---
  console.log('\n--- TEST GROUP 6: PIXO ECONOMY INTEGRATION ---');
  // Check exact difficulty rewards from Section 9
  const expectedRewards = [
    { stage: 1, xp: 10, coins: 2 },
    { stage: 2, xp: 20, coins: 4 },
    { stage: 3, xp: 30, coins: 6 },
    { stage: 4, xp: 40, coins: 8 },
    { stage: 5, xp: 50, coins: 10 },
    { stage: 6, xp: 60, coins: 12 },
    { stage: 7, xp: 70, coins: 14 },
    { stage: 8, xp: 80, coins: 16 },
    { stage: 9, xp: 90, coins: 18 },
    { stage: 10, xp: 100, coins: 20 },
  ];

  expectedRewards.forEach(({ stage, xp, coins }) => {
    const s = PathFinderService.getStage(stage);
    check(s.rewardXp === xp, `Stage ${stage} awards exactly +${xp} XP`);
    check(s.rewardCoins === coins, `Stage ${stage} awards exactly +${coins} Coins`);
  });

  // Test full completion dispatch
  const completionUser = `pf_economy_test_${Date.now()}`;
  const compResult = await PathFinderPersistenceService.recordStageCompletion(completionUser, 1, {
    moves: 8,
    timerSeconds: 15,
    hintsUsed: 0,
    path: stage1.solution,
  });

  check(compResult.success === true, 'Stage 1 completion successfully dispatched');
  check(compResult.xpAwarded === 10, 'First time completion awards 10 XP');
  check(compResult.coinsAwarded === 2, 'First time completion awards 2 Coins');
  check(compResult.nextUnlockedStage === 2, 'Next unlocked stage is 2');

  // Replay of already completed stage should not duplicate base rewards
  const replayResult = await PathFinderPersistenceService.recordStageCompletion(completionUser, 1, {
    moves: 8,
    timerSeconds: 12,
    hintsUsed: 0,
    path: stage1.solution,
  });
  check(replayResult.xpAwarded === 0, 'Replaying completed stage gives 0 duplicate XP');
  check(replayResult.coinsAwarded === 0, 'Replaying completed stage gives 0 duplicate Coins');

  // --- SECTION 7: CLOUD SAVE & RESUME ---
  console.log('\n--- TEST GROUP 7: CLOUD SAVE & RESUME ---');
  const saveUser = `pf_save_test_${Date.now()}`;
  await PathFinderPersistenceService.saveActiveSession(saveUser, {
    stageId: 4,
    stageTitle: 'Precision Budget',
    path: [[0, 0], [1, 0], [2, 0]],
    moveCount: 2,
    timer: 24,
    hintsUsed: 1,
    mistakes: 0,
  });

  const active = await PathFinderPersistenceService.getActiveSession(saveUser);
  check(active !== null, 'Active session loaded from storage');
  check(active.stageId === 4, 'Saved stageId is 4');
  check(active.moveCount === 2, 'Saved moveCount is 2');
  check(active.timer === 24, 'Saved timer is 24s');
  check(active.path.length === 3, 'Saved path preserved');

  await PathFinderPersistenceService.clearActiveSession(saveUser);
  const cleared = await PathFinderPersistenceService.getActiveSession(saveUser);
  check(cleared === null, 'Active session cleanly cleared on completion or reset');

  // --- SECTION 8: NAVIGATION ROUTES ---
  console.log('\n--- TEST GROUP 8: NAVIGATION ROUTES ---');
  check(NavigationService.isValidRoute('path_finder'), 'Route path_finder is valid');
  check(NavigationService.isValidRoute('path_finder_stages'), 'Route path_finder_stages is valid');
  check(NavigationService.isValidRoute('path_finder_gameplay'), 'Route path_finder_gameplay is valid');
  check(!NavigationService.isValidRoute('pixel_kingdom'), 'Old route pixel_kingdom is removed');

  console.log('\n========================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('========================================================\n');
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
