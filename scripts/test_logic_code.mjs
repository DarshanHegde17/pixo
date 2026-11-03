/**
 * Automated Verification Test Suite for PIXO Cyber Strike: 2099 - LOGIC CODE
 * 
 * Verifies:
 * 1. Category definitions (Pattern Recognition, Number Intelligence, Root & Power, Missing Operators).
 * 2. Question generation across all 40 levels (5 questions per level, 200 questions total).
 * 3. Strict mathematical definitions:
 *    - isPrime (1 is neither prime nor composite)
 *    - isComposite (1 is neither prime nor composite)
 *    - Natural numbers vs Whole numbers (0 is whole, not natural)
 * 4. BODMAS evaluator and flexible solution validator.
 * 5. Sequential level unlocking & category gating.
 * 6. Save & Resume mid-level session state.
 * 7. Reward economy & anti-farming protection.
 * 8. Player stats and badge unlocks.
 */

import {
  LOGIC_CODE_CATEGORIES,
  LogicCodeQuestionService,
  isPrime,
  isComposite,
  evaluateBODMAS,
  isValidOperatorSolution,
  generateBODMASExplanation,
} from '../src/services/logicCodeQuestionService.js';

import {
  LogicCodePersistenceService,
  LOGIC_CODE_BADGES,
} from '../src/services/logicCodePersistenceService.js';
import { AuthService } from '../src/services/authService.js';
import { SessionStorage } from '../src/services/sessionStorage.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🤖 PIXO: CYBER STRIKE: 2099 (LOGIC CODE) TEST SUITE');
  console.log('====================================================\n');

  // TEST SUITE 1: Category Structure
  console.log('--- TEST 1: Category Architecture & Level Mapping ---');
  assert(LOGIC_CODE_CATEGORIES.length === 4, 'Exactly 4 categories defined');
  assert(LOGIC_CODE_CATEGORIES[0].id === 'pattern_recognition', 'Category 1 is Pattern Recognition');
  assert(LOGIC_CODE_CATEGORIES[1].id === 'number_intelligence', 'Category 2 is Number Intelligence');
  assert(LOGIC_CODE_CATEGORIES[2].id === 'root_power', 'Category 3 is Root & Power Challenge');
  assert(LOGIC_CODE_CATEGORIES[3].id === 'missing_operator', 'Category 4 is Missing Operator Challenge');

  assert(LOGIC_CODE_CATEGORIES[0].levelRange[0] === 1 && LOGIC_CODE_CATEGORIES[0].levelRange[1] === 10, 'Category 1 covers Levels 1–10');
  assert(LOGIC_CODE_CATEGORIES[1].levelRange[0] === 11 && LOGIC_CODE_CATEGORIES[1].levelRange[1] === 20, 'Category 2 covers Levels 11–20');
  assert(LOGIC_CODE_CATEGORIES[2].levelRange[0] === 21 && LOGIC_CODE_CATEGORIES[2].levelRange[1] === 30, 'Category 3 covers Levels 21–30');
  assert(LOGIC_CODE_CATEGORIES[3].levelRange[0] === 31 && LOGIC_CODE_CATEGORIES[3].levelRange[1] === 40, 'Category 4 covers Levels 31–40');

  // TEST SUITE 2: Strict Mathematical Helper Validation
  console.log('\n--- TEST 2: Strict Mathematical Logic (Primes, Composites, 1) ---');
  assert(!isPrime(1), '1 is NOT prime');
  assert(!isComposite(1), '1 is NOT composite (1 is strictly neither prime nor composite)');
  assert(!isPrime(0), '0 is NOT prime');
  assert(!isComposite(0), '0 is NOT composite');
  assert(!isPrime(-5), '-5 is NOT prime');
  assert(!isComposite(-4), '-4 is NOT composite');

  assert(isPrime(2), '2 is prime');
  assert(isPrime(3), '3 is prime');
  assert(isPrime(13), '13 is prime');
  assert(isPrime(97), '97 is prime');

  assert(isComposite(4), '4 is composite');
  assert(isComposite(9), '9 is composite');
  assert(isComposite(15), '15 is composite');
  assert(isComposite(100), '100 is composite');
  assert(!isComposite(13), '13 is NOT composite');

  // TEST SUITE 3: BODMAS Operator Evaluator & Validation
  console.log('\n--- TEST 3: Strict BODMAS Precedence & Solver ---');
  // 10 + 5 * 2 = 10 + 10 = 20 (not (10+5)*2 = 30)
  const bodmas1 = evaluateBODMAS([10, 5, 2], ['+', '×']);
  assert(bodmas1 === 20, `BODMAS evaluates 10 + 5 × 2 = 20 (actual: ${bodmas1})`);

  // 20 - 6 / 2 = 20 - 3 = 17 (not (20-6)/2 = 7)
  const bodmas2 = evaluateBODMAS([20, 6, 2], ['-', '÷']);
  assert(bodmas2 === 17, `BODMAS evaluates 20 - 6 ÷ 2 = 17 (actual: ${bodmas2})`);

  // 8 / 2 * 4 = 4 * 4 = 16 (left-to-right for same precedence)
  const bodmas3 = evaluateBODMAS([8, 2, 4], ['÷', '×']);
  assert(bodmas3 === 16, `BODMAS evaluates 8 ÷ 2 × 4 = 16 (actual: ${bodmas3})`);

  // Division by zero
  const bodmasDivZero = evaluateBODMAS([10, 0], ['÷']);
  assert(bodmasDivZero === null, 'Division by zero is safely rejected as null');

  // Multi-operator BODMAS: 5 + 4 * 3 - 6 / 2 = 5 + 12 - 3 = 14
  const bodmas4 = evaluateBODMAS([5, 4, 3, 6, 2], ['+', '×', '-', '÷']);
  assert(bodmas4 === 14, `BODMAS evaluates 5 + 4 × 3 - 6 ÷ 2 = 14 (actual: ${bodmas4})`);

  // Flexible validation of user operator choices
  const isValid1 = isValidOperatorSolution([4, 4, 4], ['+', '+'], 12);
  assert(isValid1, 'isValidOperatorSolution: 4 + 4 + 4 = 12 is valid');

  const isValid2 = isValidOperatorSolution([4, 4, 4], ['×', '-'], 12);
  assert(isValid2, 'isValidOperatorSolution: 4 × 4 - 4 = 12 is valid (alternative solution accepted!)');

  const explanation = generateBODMASExplanation([4, 4, 4], ['×', '-'], 12);
  assert(typeof explanation === 'string' && explanation.length > 10, 'generateBODMASExplanation produces detailed step breakdown');

  // TEST SUITE 4: Question Generation for All 40 Levels
  console.log('\n--- TEST 4: Question Generation across all 40 Levels (200 Questions) ---');
  let allQuestionsValid = true;
  let levelQuestionCounts = [];

  for (let lvl = 1; lvl <= 40; lvl++) {
    const questions = LogicCodeQuestionService.getQuestionsForLevel(lvl);
    levelQuestionCounts.push(questions.length);

    if (questions.length !== 5) {
      allQuestionsValid = false;
      console.error(`Level ${lvl} has ${questions.length} questions, expected 5`);
    }

    questions.forEach((q, idx) => {
      if (!q.id || !q.questionText || !q.explanation || !q.hint) {
        allQuestionsValid = false;
        console.error(`Level ${lvl} Q${idx + 1} is missing required fields`);
      }
      if (q.isOperatorPuzzle) {
        if (!Array.isArray(q.numbers) || q.targetNumber === undefined) {
          allQuestionsValid = false;
          console.error(`Level ${lvl} Q${idx + 1} operator puzzle missing numbers/target`);
        }
      } else {
        if (!Array.isArray(q.options) || q.options.length < 2 || q.correctAnswer === undefined) {
          allQuestionsValid = false;
          console.error(`Level ${lvl} Q${idx + 1} multiple choice invalid`);
        }
      }
    });
  }

  assert(allQuestionsValid, 'All 40 levels generate 5 complete, mathematically valid questions (200 total)');

  // TEST SUITE 5: Sequential Level Unlocking & Category Gating
  console.log('\n--- TEST 5: Sequential Progression & Gating ---');
  const testUserId = 'usr_demo_2';
  await SessionStorage.removeItem(`@pixo_logic_code_unlocked_lvl_${testUserId}`);
  await SessionStorage.removeItem(`@pixo_logic_code_completed_lvls_${testUserId}`);
  await SessionStorage.removeItem(`@pixo_logic_code_active_session_${testUserId}`);
  await SessionStorage.removeItem(`@pixo_logic_code_player_stats_${testUserId}`);

  const initialUnlocked = await LogicCodePersistenceService.getUnlockedLevel(testUserId);
  assert(initialUnlocked === 1, `Level 1 is initially unlocked (actual: ${initialUnlocked})`);

  const initialCatGate = await LogicCodePersistenceService.isCategoryUnlocked(testUserId, 'category_2');
  assert(initialCatGate === false, 'Category 2 is initially locked (requires completing Level 10)');

  // Record Level 1 completion via completeLevel
  const resLvl1 = await LogicCodePersistenceService.completeLevel(testUserId, 1, {
    correctCount: 5,
    totalQuestions: 5,
    score: 50,
    durationSeconds: 35,
    earnedQuestionXp: 75, // 50 base + 25 no-hint
  });

  assert(resLvl1.success, 'Level 1 completion recorded successfully');
  assert(resLvl1.unlockedLevel === 2, `Next unlocked level is now 2 (actual: ${resLvl1.unlockedLevel})`);
  assert(resLvl1.xpAwarded === 105, `Rewards granted on first completion: 75 question XP + 20 level complete + 10 perfect bonus = 105 XP (actual: ${resLvl1.xpAwarded})`);
  assert(resLvl1.coinsAwarded === 5, `Flawless level completion grants 5 Coins (actual: ${resLvl1.coinsAwarded})`);

  // Anti-duplicate farming protection
  const resLvl1Replay = await LogicCodePersistenceService.completeLevel(testUserId, 1, {
    correctCount: 5,
    totalQuestions: 5,
    score: 50,
    durationSeconds: 30,
    earnedQuestionXp: 75,
  });

  assert(resLvl1Replay.xpAwarded === 0, `Anti-farming: Replaying completed Level 1 yields 0 duplicate XP (actual: ${resLvl1Replay.xpAwarded})`);
  assert(resLvl1Replay.alreadyCompleted === true, 'Response marks session as alreadyCompleted');

  // Fast forward unlock to Level 10
  for (let l = 2; l <= 10; l++) {
    await LogicCodePersistenceService.completeLevel(testUserId, l, {
      correctCount: 5,
      totalQuestions: 5,
      score: 50,
      durationSeconds: 20,
      earnedQuestionXp: 75,
    });
  }

  const cat2Unlocked = await LogicCodePersistenceService.isCategoryUnlocked(testUserId, 'category_2');
  assert(cat2Unlocked === true, 'Category 2 unlocked after Level 10 is completed!');

  const cat3Unlocked = await LogicCodePersistenceService.isCategoryUnlocked(testUserId, 'category_3');
  assert(cat3Unlocked === false, 'Category 3 remains locked until Level 20 is completed');

  // TEST SUITE 6: Mid-Level Save & Resume Persistence
  console.log('\n--- TEST 6: Mid-Level Save & Resume System ---');
  await LogicCodePersistenceService.saveActiveSession(testUserId, {
    level: 11,
    currentQuestionIndex: 3,
    answers: [true, true, false],
    score: 20,
    hintsUsedCount: 0,
    secondsElapsed: 45,
    isPracticeMode: false,
  });

  const activeSession = await LogicCodePersistenceService.getActiveSession(testUserId);
  assert(activeSession !== null, 'Active session retrieved successfully');
  assert(activeSession.level === 11, 'Active session level is 11');
  assert(activeSession.currentQuestionIndex === 3, 'Active session resumed at Question Index 3');

  await LogicCodePersistenceService.clearActiveSession(testUserId);
  const clearedSession = await LogicCodePersistenceService.getActiveSession(testUserId);
  assert(clearedSession === null, 'Active session cleared after level finish or abandonment');

  // TEST SUITE 7: Player Statistics & Badges
  console.log('\n--- TEST 7: Badges and Performance Analytics ---');
  const stats = await LogicCodePersistenceService.getPlayerStats(testUserId);
  assert(stats.completedLevelsCount === 10, `Completed levels count is 10 (actual: ${stats.completedLevelsCount})`);
  const hasPatternBadge = stats.badges.some(b => b.id === 'badge_pattern_master');
  assert(hasPatternBadge, 'Earned Pattern Hacker badge for clearing Category 1 (10 levels)');
  assert(Object.keys(LOGIC_CODE_BADGES).length === 5, '5 Badges configured in the system');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
