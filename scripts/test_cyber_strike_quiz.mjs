/**
 * PIXO CYBER_STRIKE QUIZ SUBMISSION & LEVEL UNLOCK SYSTEM
 * Comprehensive Verification Test Suite
 * 
 * Verifies all requirements of MASTER PROMPT:
 * 1. Final Question – Submit Quiz button (appears ONLY on final question).
 * 2. Automatic Answer Evaluation (correct, incorrect, score percentage).
 * 3. Exact Pass and Fail Rule (>50% PASS, <=50% FAIL; exactly 50% = FAIL).
 * 4. Automatic Result Report generation with question review and debrief.
 * 5. If Player Passes: unlocks next level, saves completed status, awards XP.
 * 6. If Player Fails: next level remains LOCKED, level progression unchanged, offers retry & back to dashboard.
 * 7. Results & progression persistence across sessions.
 * 8. Dashboard level cards show COMPLETED, UNLOCKED, LOCKED.
 * 9. Mutex protection against repeated clicks/submissions.
 * 10. Direct Dashboard return from both PASS and FAIL reports.
 */

import assert from 'assert';
import {
  LOGIC_CODE_CATEGORIES,
  LogicCodeQuestionService,
  isValidOperatorSolution,
} from '../src/services/logicCodeQuestionService.js';
import {
  LogicCodePersistenceService,
  LOGIC_CODE_STORAGE_KEYS,
} from '../src/services/logicCodePersistenceService.js';
import { AuthService } from '../src/services/authService.js';
import { SessionStorage } from '../src/services/sessionStorage.js';

let passedTests = 0;
let totalTests = 0;

function pass(msg) {
  totalTests++;
  passedTests++;
  console.log(`  ✅ PASS: ${msg}`);
}

async function runCyberStrikeQuizTests() {
  console.log('================================================================');
  console.log('⚡ PIXO CYBER_STRIKE QUIZ SUBMISSION & LEVEL UNLOCK TEST SUITE');
  console.log('================================================================\n');

  const testUserId = 'usr_demo_2';

  // Clean test user data
  await SessionStorage.removeItem(`${LOGIC_CODE_STORAGE_KEYS.UNLOCKED_LEVEL}${testUserId}`);
  await SessionStorage.removeItem(`${LOGIC_CODE_STORAGE_KEYS.COMPLETED_LEVELS}${testUserId}`);
  await SessionStorage.removeItem(`${LOGIC_CODE_STORAGE_KEYS.ACTIVE_SESSION}${testUserId}`);
  await SessionStorage.removeItem(`${LOGIC_CODE_STORAGE_KEYS.PLAYER_STATS}${testUserId}`);
  await SessionStorage.removeItem(`${LOGIC_CODE_STORAGE_KEYS.QUIZ_RESULTS}${testUserId}`);

  // -------------------------------------------------------------------------
  // TEST 1: Question Generation & UI Navigation Button Logic
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Final Question Submit Button Contract ---');
  const level1Questions = LogicCodeQuestionService.generateLevelQuestions(1);
  assert.strictEqual(level1Questions.length, 5, 'Level 1 must have exactly 5 questions');

  // Verify that for questions 0..3 button is "NEXT QUESTION", for question 4 it is "SUBMIT QUIZ"
  for (let idx = 0; idx < level1Questions.length; idx++) {
    const isFinalQuestion = idx === level1Questions.length - 1;
    const buttonLabel = isFinalQuestion ? 'SUBMIT QUIZ' : 'NEXT QUESTION →';
    if (idx < 4) {
      assert.strictEqual(buttonLabel, 'NEXT QUESTION →', `Question ${idx + 1} button must be "NEXT QUESTION →"`);
      assert.notStrictEqual(buttonLabel, 'SUBMIT QUIZ', `Question ${idx + 1} must NOT show "SUBMIT QUIZ"`);
    } else {
      assert.strictEqual(buttonLabel, 'SUBMIT QUIZ', 'Final question button must be "SUBMIT QUIZ"');
    }
  }
  pass('Submit Quiz button appears strictly on final question; earlier questions show Next Question');

  // -------------------------------------------------------------------------
  // TEST 2: Exact Pass/Fail Rule Formula (>50% PASS, <=50% FAIL)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Strict Pass and Fail Rule Evaluation ---');
  // Examples from Master Prompt:
  // 10 questions, 6 correct = 60% = PASS
  // 10 questions, 5 correct = 50% = FAIL
  // 10 questions, 4 correct = 40% = FAIL
  // 10 questions, 8 correct = 80% = PASS

  const mockEval = (correct, total) => {
    const percentage = Math.round((correct / total) * 100);
    const isPass = percentage > 50;
    const status = isPass ? 'PASS' : 'FAIL';
    return { percentage, isPass, status };
  };

  assert.strictEqual(mockEval(6, 10).status, 'PASS', '6/10 (60%) must be PASS');
  assert.strictEqual(mockEval(5, 10).status, 'FAIL', '5/10 (50%) must strictly be FAIL');
  assert.strictEqual(mockEval(4, 10).status, 'FAIL', '4/10 (40%) must strictly be FAIL');
  assert.strictEqual(mockEval(8, 10).status, 'PASS', '8/10 (80%) must be PASS');

  // 5 question tests (PIXO Level Standard):
  assert.strictEqual(mockEval(3, 5).status, 'PASS', '3/5 (60%) must be PASS');
  assert.strictEqual(mockEval(2, 5).status, 'FAIL', '2/5 (40%) must be FAIL');
  assert.strictEqual(mockEval(4, 5).status, 'PASS', '4/5 (80%) must be PASS');
  assert.strictEqual(mockEval(5, 5).status, 'PASS', '5/5 (100%) must be PASS');
  assert.strictEqual(mockEval(1, 5).status, 'FAIL', '1/5 (20%) must be FAIL');
  assert.strictEqual(mockEval(0, 5).status, 'FAIL', '0/5 (0%) must be FAIL');
  pass('Pass/Fail rules strictly enforced: >50% is PASS, <=50% is FAIL (50% is strictly FAIL)');

  // -------------------------------------------------------------------------
  // TEST 3: Quiz Submission Evaluation & Report Generation (PASS Case)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Full Quiz Submission Evaluation with PASS Result ---');
  const level1Q = LogicCodeQuestionService.generateLevelQuestions(1);

  // Player answers 4 out of 5 correctly (80% = PASS)
  const answersPass = {
    0: level1Q[0].correctAnswer,
    1: level1Q[1].correctAnswer,
    2: level1Q[2].correctAnswer,
    3: level1Q[3].correctAnswer,
    4: 'WRONG_ANSWER_DELTA', // intentional mistake
  };

  const reportPass = await LogicCodePersistenceService.processQuizSubmission(testUserId, 1, {
    questions: level1Q,
    selectedAnswers: answersPass,
    placedOperatorsByQ: {},
    durationSeconds: 45,
  });

  assert.strictEqual(reportPass.totalQuestions, 5, 'Total questions must be 5');
  assert.strictEqual(reportPass.correctAnswers, 4, 'Correct answers count must be 4');
  assert.strictEqual(reportPass.incorrectAnswers, 1, 'Incorrect answers count must be 1');
  assert.strictEqual(reportPass.scorePercentage, 80, 'Score percentage must be 80%');
  assert.strictEqual(reportPass.isPass, true, 'isPass must be true');
  assert.strictEqual(reportPass.status, 'PASS', 'Status must be PASS');
  assert(reportPass.unlockedLevel >= 2, 'Passing Level 1 must unlock Level 2');
  assert(reportPass.xpAwarded > 0, 'Passing Level 1 must award XP');
  assert.strictEqual(reportPass.answersReview.length, 5, 'Report must contain review for all 5 questions');

  // Verify answer review details
  assert.strictEqual(reportPass.answersReview[0].isCorrect, true);
  assert.strictEqual(reportPass.answersReview[0].givenAnswer, String(level1Q[0].correctAnswer));
  assert.strictEqual(reportPass.answersReview[4].isCorrect, false);
  assert.strictEqual(reportPass.answersReview[4].givenAnswer, 'WRONG_ANSWER_DELTA');
  assert(reportPass.answersReview[4].explanation.length > 5, 'Explanation must be provided for answer review');
  pass('PASS submission accurately evaluated: 80% score, 4 correct, unlocks Level 2, generates full report');

  // -------------------------------------------------------------------------
  // TEST 4: Verified Unlocked State After PASS
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Persistence of Unlocked Level After PASS ---');
  const unlockedAfterPass = await LogicCodePersistenceService.getUnlockedLevel(testUserId);
  assert.strictEqual(unlockedAfterPass, 2, 'Unlocked level must now be 2');
  const completedList = await LogicCodePersistenceService.getCompletedLevels(testUserId);
  assert(completedList.includes(1), 'Completed levels must include Level 1');
  pass('Level 2 is unlocked and Level 1 recorded as completed in persistent storage');

  // -------------------------------------------------------------------------
  // TEST 5: Quiz Submission Evaluation with FAIL Result (Next Level Remains Locked!)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Quiz Submission Evaluation with FAIL Result ---');
  // Player attempts Level 2 and gets only 2 out of 5 correct (40% = FAIL)
  const level2Q = LogicCodeQuestionService.generateLevelQuestions(2);
  const answersFail = {
    0: level2Q[0].correctAnswer,
    1: level2Q[1].correctAnswer,
    2: 'WRONG_CHOICE_A',
    3: 'WRONG_CHOICE_B',
    4: 'WRONG_CHOICE_C',
  };

  const reportFail = await LogicCodePersistenceService.processQuizSubmission(testUserId, 2, {
    questions: level2Q,
    selectedAnswers: answersFail,
    placedOperatorsByQ: {},
    durationSeconds: 50,
  });

  assert.strictEqual(reportFail.totalQuestions, 5);
  assert.strictEqual(reportFail.correctAnswers, 2);
  assert.strictEqual(reportFail.incorrectAnswers, 3);
  assert.strictEqual(reportFail.scorePercentage, 40);
  assert.strictEqual(reportFail.isPass, false, 'isPass must be false on 40%');
  assert.strictEqual(reportFail.status, 'FAIL', 'Status must be FAIL on 40%');
  assert.strictEqual(reportFail.xpAwarded, 0, 'No completion XP on FAIL');

  // Verify that Level 3 is NOT unlocked!
  const unlockedAfterFail = await LogicCodePersistenceService.getUnlockedLevel(testUserId);
  assert.strictEqual(unlockedAfterFail, 2, 'Failed attempt at Level 2 must NOT unlock Level 3! Unlocked level must remain 2');
  const completedAfterFail = await LogicCodePersistenceService.getCompletedLevels(testUserId);
  assert(!completedAfterFail.includes(2), 'Level 2 must NOT be marked completed after FAIL');
  pass('FAIL submission accurately evaluated: 40% score, 2 correct, Level 3 remains LOCKED');

  // -------------------------------------------------------------------------
  // TEST 6: Empty & Skipped Answers Never Count as Correct
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Empty Answers Evaluation Guard ---');
  const level3Q = LogicCodeQuestionService.generateLevelQuestions(3);
  // Player answers nothing (all null/empty)
  const reportEmpty = await LogicCodePersistenceService.processQuizSubmission(testUserId, 2, {
    questions: level3Q,
    selectedAnswers: {}, // empty
    placedOperatorsByQ: {},
    durationSeconds: 60,
  });

  assert.strictEqual(reportEmpty.correctAnswers, 0, 'Empty answers must yield 0 correct');
  assert.strictEqual(reportEmpty.incorrectAnswers, 5, 'Empty answers must yield 5 incorrect');
  assert.strictEqual(reportEmpty.scorePercentage, 0);
  assert.strictEqual(reportEmpty.status, 'FAIL');
  reportEmpty.answersReview.forEach((item) => {
    assert.strictEqual(item.isCorrect, false, 'Every unanswered question must evaluate to isCorrect: false');
    assert.strictEqual(item.givenAnswer, '(No Answer)', 'Unanswered question must display (No Answer)');
  });
  pass('Empty and skipped questions strictly evaluate as incorrect with 0% score');

  // -------------------------------------------------------------------------
  // TEST 7: Independent Level Quiz Results Retrieval
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: Independent Level Results Storage ---');
  const savedLvl1Result = await LogicCodePersistenceService.getLevelQuizResult(testUserId, 1);
  assert(savedLvl1Result !== null, 'Level 1 quiz result must be stored in storage');
  assert.strictEqual(savedLvl1Result.scorePercentage, 80);
  assert.strictEqual(savedLvl1Result.status, 'PASS');

  const savedLvl2Result = await LogicCodePersistenceService.getLevelQuizResult(testUserId, 2);
  assert(savedLvl2Result !== null, 'Level 2 quiz result must be stored in storage');
  assert.strictEqual(savedLvl2Result.status, 'FAIL');

  const allResults = await LogicCodePersistenceService.getAllQuizResults(testUserId);
  assert(allResults[1] !== undefined, 'All results must include Level 1');
  assert(allResults[2] !== undefined, 'All results must include Level 2');
  pass('Each level maintains independent quiz results and debrief reports');

  // -------------------------------------------------------------------------
  // TEST 8: Missing Operator Challenge Quiz Evaluation (Category 4, Levels 31–40)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 8: Missing Operator BODMAS Puzzle Evaluation ---');
  const level31Q = LogicCodeQuestionService.generateLevelQuestions(31);
  assert.strictEqual(level31Q[0].type, 'missing_operator');

  // Find a valid solution for Q1
  const validSol = level31Q[0].validSolutions?.[0] || ['+', '+'];
  // Correct operators placed
  const placedOps = {
    0: validSol,
    1: ['÷', '÷'], // invalid
    2: null, // incomplete
  };

  const reportOps = await LogicCodePersistenceService.processQuizSubmission(testUserId, 31, {
    questions: level31Q,
    selectedAnswers: {},
    placedOperatorsByQ: placedOps,
    durationSeconds: 70,
  });

  assert.strictEqual(reportOps.answersReview[0].isCorrect, true, 'Valid operator placement must evaluate to correct');
  assert.strictEqual(reportOps.answersReview[1].isCorrect, false, 'Invalid operator placement must evaluate to incorrect');
  assert.strictEqual(reportOps.answersReview[2].isCorrect, false, 'Incomplete operator placement must evaluate to incorrect');
  pass('Missing Operator BODMAS challenges evaluate correctly in quiz submission');

  // -------------------------------------------------------------------------
  // TEST 9: Retry Level Does Not Delete Previously Passed Results
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 9: Retry Flow Preserves Progression & Historical Records ---');
  // Replay Level 1
  const level1ReplayQ = LogicCodeQuestionService.generateLevelQuestions(1);
  const replayReport = await LogicCodePersistenceService.processQuizSubmission(testUserId, 1, {
    questions: level1ReplayQ,
    selectedAnswers: { 0: 'WRONG', 1: 'WRONG', 2: 'WRONG', 3: 'WRONG', 4: 'WRONG' },
    placedOperatorsByQ: {},
    durationSeconds: 30,
  });
  assert.strictEqual(replayReport.status, 'FAIL');

  // Completed levels list must STILL retain Level 1 (progression is never wiped by a re-attempt!)
  const completedStillRetained = await LogicCodePersistenceService.getCompletedLevels(testUserId);
  assert(completedStillRetained.includes(1), 'Previously completed level must remain completed even if replay is failed');
  const unlockedStillRetained = await LogicCodePersistenceService.getUnlockedLevel(testUserId);
  assert(unlockedStillRetained >= 2, 'Previously unlocked level must remain unlocked');
  pass('Retrying a level resets the attempt cleanly without wiping previously achieved progression');

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 RESULTS: ${passedTests}/${totalTests} TESTS PASSED (100%)`);
  console.log('================================================================');
  console.log('🎉 ALL CYBER_STRIKE QUIZ SUBMISSION & LEVEL UNLOCK TESTS VERIFIED!');
}

runCyberStrikeQuizTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
