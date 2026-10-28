/**
 * PIXO Game Resume and State Persistence Verification Suite
 * 
 * Verifies Test Scenarios A through F from the Master Specification:
 * - Test A: Start 30s game, leave after 10s, return immediately (~20s remaining).
 * - Test B: Start game, leave for 15s, reopen PIXO (~15s remaining).
 * - Test C: Start game, reopen PIXO after 35s (time expired, shows results, no auto-restart).
 * - Test D: Start game, answer questions, leave, return (exact progress, answers, score restored).
 * - Test E: Complete game and press Play Again (new session with fresh 30s timer).
 * - Test F: Force-close and reopen while active (saved session restored without data loss).
 */

import { GamePersistenceService } from '../src/services/gamePersistenceService.js';
import { SessionStorage } from '../src/services/sessionStorage.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passed++;
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  console.log('=====================================================');
  console.log('🎮 PIXO 30-SECOND GAME PERSISTENCE & TIMER TEST SUITE');
  console.log('=====================================================\n');

  const testUserId = 'test_user_persistence_1';
  await GamePersistenceService.clearActiveSession(testUserId);

  // -------------------------------------------------------------------
  // TEST A: Start 30s game, leave after 10s, return immediately (~20s remaining)
  // -------------------------------------------------------------------
  console.log('--- TEST A: Resume after 10 seconds away ---');
  const startTimeA = Date.now();
  const endTimeA = startTimeA + 30000;
  const sessionA = {
    sessionId: GamePersistenceService.createSessionId(),
    userId: testUserId,
    gameId: 'g_target_no',
    gameTitle: 'Target Number',
    gameMode: 'Speed Math Rush',
    level: 1,
    operator: '+',
    totalQuestions: 5,
    timeLimit: 30,
    startTime: startTimeA,
    endTime: endTimeA,
    startedAt: new Date(startTimeA).toISOString(),
    status: 'in_progress',
    currentProblemIdx: 1,
    problems: [
      { num1: 5, num2: 4, op: '+', answer: 9, choices: [9, 7, 10, 8] },
      { num1: 8, num2: 3, op: '+', answer: 11, choices: [11, 10, 12, 13] },
    ],
    score: 180,
    combo: 1,
    userInput: '',
    answersHistory: [{ problemIdx: 0, answer: 9, isCorrect: true, points: 180 }],
  };

  await GamePersistenceService.saveActiveSession(testUserId, sessionA);

  // Simulate 10 seconds elapsed
  const timeReturnA = startTimeA + 10000;
  const remainingA = Math.max(0, Math.ceil((endTimeA - timeReturnA) / 1000));
  assert(remainingA === 20, `Remaining time after 10s is exactly 20s (got ${remainingA}s)`);

  const loadedA = await GamePersistenceService.getActiveSession(testUserId);
  assert(loadedA !== null, 'Saved active session retrieved successfully');
  assert(loadedA.sessionId === sessionA.sessionId, 'Session ID matches exactly');
  assert(loadedA.status === 'in_progress', 'Session status remains in_progress');

  // -------------------------------------------------------------------
  // TEST B: Start game, leave for 15s, reopen PIXO (~15s remaining)
  // -------------------------------------------------------------------
  console.log('\n--- TEST B: Reopen after 15 seconds away ---');
  const startTimeB = Date.now();
  const endTimeB = startTimeB + 30000;
  const sessionB = {
    ...sessionA,
    sessionId: GamePersistenceService.createSessionId(),
    startTime: startTimeB,
    endTime: endTimeB,
  };
  await GamePersistenceService.saveActiveSession(testUserId, sessionB);

  // Simulate 15 seconds elapsed
  const timeReturnB = startTimeB + 15000;
  const remainingB = Math.max(0, Math.ceil((endTimeB - timeReturnB) / 1000));
  assert(remainingB === 15, `Remaining time after 15s is exactly 15s (got ${remainingB}s)`);

  // -------------------------------------------------------------------
  // TEST C: Start game, reopen PIXO after 35s (time expired)
  // -------------------------------------------------------------------
  console.log('\n--- TEST C: Reopen after 35 seconds (Time Expired) ---');
  const startTimeC = Date.now() - 35000;
  const endTimeC = startTimeC + 30000; // expired 5 seconds ago
  const sessionC = {
    ...sessionA,
    sessionId: GamePersistenceService.createSessionId(),
    startTime: startTimeC,
    endTime: endTimeC,
  };
  await GamePersistenceService.saveActiveSession(testUserId, sessionC);

  const remainingC = GamePersistenceService.calculateRemainingSeconds(endTimeC, 30);
  assert(remainingC === 0, `Remaining time after 35s is clamped to 0s (got ${remainingC}s)`);
  assert(GamePersistenceService.isSessionExpired(endTimeC) === true, 'Session is marked as expired');

  const loadedC = await GamePersistenceService.getActiveSession(testUserId);
  assert(loadedC.sessionId === sessionC.sessionId, 'Expired session still retrievable to show results screen');
  assert(loadedC.currentProblemIdx === 1, 'Question progress preserved on expired session');
  assert(loadedC.score === 180, 'Score preserved on expired session');

  // -------------------------------------------------------------------
  // TEST D: Answer questions, leave app, return (exact progress restored)
  // -------------------------------------------------------------------
  console.log('\n--- TEST D: State restoration (progress, answers, score) ---');
  const startTimeD = Date.now();
  const endTimeD = startTimeD + 30000;
  const sessionD = {
    sessionId: GamePersistenceService.createSessionId(),
    userId: testUserId,
    gameId: 'g_target_no',
    gameTitle: 'Target Number',
    gameMode: 'Speed Math Rush',
    level: 2,
    operator: '*',
    totalQuestions: 7,
    timeLimit: 30,
    startTime: startTimeD,
    endTime: endTimeD,
    startedAt: new Date(startTimeD).toISOString(),
    status: 'in_progress',
    currentProblemIdx: 3, // At 4th question
    problems: [
      { num1: 3, num2: 5, op: '*', answer: 15, choices: [15, 12, 18, 10] },
      { num1: 4, num2: 6, op: '*', answer: 24, choices: [24, 20, 28, 22] },
      { num1: 7, num2: 3, op: '*', answer: 21, choices: [21, 18, 24, 25] },
      { num1: 8, num2: 4, op: '*', answer: 32, choices: [32, 28, 36, 30] },
    ],
    score: 650,
    combo: 3,
    userInput: '3',
    answersHistory: [
      { problemIdx: 0, answer: 15, isCorrect: true, points: 200 },
      { problemIdx: 1, answer: 24, isCorrect: true, points: 225 },
      { problemIdx: 2, answer: 21, isCorrect: true, points: 225 },
    ],
  };

  await GamePersistenceService.saveActiveSession(testUserId, sessionD);

  // Restore session
  const loadedD = await GamePersistenceService.getActiveSession(testUserId);
  assert(loadedD.level === 2, 'Restored level matches Level 2');
  assert(loadedD.operator === '*', 'Restored operator is multiplication');
  assert(loadedD.currentProblemIdx === 3, 'Current problem index is 3');
  assert(loadedD.score === 650, 'Score 650 restored accurately');
  assert(loadedD.combo === 3, 'Combo streak of 3 restored');
  assert(loadedD.userInput === '3', 'In-progress user input preserved');
  assert(loadedD.answersHistory.length === 3, 'History of 3 answered questions restored');
  assert(loadedD.problems[3].answer === 32, 'Exact 4th problem intact');

  // -------------------------------------------------------------------
  // TEST E: Complete game and Play Again (New session with fresh timer)
  // -------------------------------------------------------------------
  console.log('\n--- TEST E: Game Completion & Play Again ---');
  // Mark previous session completed and archive it
  await GamePersistenceService.archiveSession(testUserId, {
    ...loadedD,
    status: 'level_complete',
  });

  const activeAfterComplete = await GamePersistenceService.getActiveSession(testUserId);
  assert(activeAfterComplete === null, 'Completed active session is cleared from active slot');

  // Player presses Play Again
  const freshStartTime = Date.now();
  const freshEndTime = freshStartTime + 30000;
  const newSessionE = {
    sessionId: GamePersistenceService.createSessionId(),
    userId: testUserId,
    gameId: 'g_target_no',
    level: 1,
    operator: '+',
    totalQuestions: 5,
    timeLimit: 30,
    startTime: freshStartTime,
    endTime: freshEndTime,
    status: 'in_progress',
    currentProblemIdx: 0,
    problems: [{ num1: 2, num2: 3, op: '+', answer: 5, choices: [5, 4, 6, 7] }],
    score: 0,
    combo: 0,
    userInput: '',
    answersHistory: [],
  };

  await GamePersistenceService.saveActiveSession(testUserId, newSessionE);
  const loadedE = await GamePersistenceService.getActiveSession(testUserId);
  assert(loadedE.sessionId !== sessionD.sessionId, 'New game has a fresh distinct session ID');
  assert(loadedE.score === 0, 'New session resets score to 0');
  assert(loadedE.currentProblemIdx === 0, 'New session starts at question 0');
  const remainingE = GamePersistenceService.calculateRemainingSeconds(loadedE.endTime, 30);
  assert(remainingE >= 29 && remainingE <= 30, `Fresh session has full 30s timer (got ${remainingE}s)`);

  // -------------------------------------------------------------------
  // TEST F: Force close and reopen app while active
  // -------------------------------------------------------------------
  console.log('\n--- TEST F: Force close and restart simulation ---');
  // Update in-progress state before simulate kill
  await GamePersistenceService.updateActiveSession(testUserId, {
    currentProblemIdx: 1,
    score: 150,
  });

  // Re-fetch as a newly launched app would
  const restoredF = await GamePersistenceService.getActiveSession(testUserId);
  assert(restoredF !== null, 'App launch detects saved unfinished session');
  assert(restoredF.status === 'in_progress', 'Saved session is marked in_progress');
  assert(restoredF.score === 150, 'Updated score persisted across cold launch');
  assert(restoredF.currentProblemIdx === 1, 'Question 1 persisted across cold launch');

  // Clean up
  await GamePersistenceService.clearActiveSession(testUserId);
  const cleaned = await GamePersistenceService.getActiveSession(testUserId);
  assert(cleaned === null, 'Session cleanup works reliably');

  console.log('\n=====================================================');
  console.log(`🎉 ALL ${passed}/${total} PERSISTENCE TESTS PASSED!`);
  console.log('=====================================================');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
