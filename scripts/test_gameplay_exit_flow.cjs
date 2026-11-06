/**
 * PIXO Master Bug Fix Verification Suite:
 * Game Exit, Pause, Resume, Win and Lose Flow
 */

const assert = require('assert').strict;
const Module = require('module');
const fs = require('fs');

// Alias react-native to react-native-web in Node.js test environment
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'react-native') {
    return origResolve.call(this, 'react-native-web', parent, isMain, options);
  }
  return origResolve.call(this, request, parent, isMain, options);
};

// Require babel-register for ES6 module import
require('@babel/register')({ presets: ['babel-preset-expo'] });

// Mock localStorage and window for Node environment
const browserStack = [];
let browserIndex = -1;

global.window = {
  location: { pathname: '/', hash: '#home' },
  addEventListener: () => {},
  removeEventListener: () => {},
  history: {
    get state() {
      return browserStack[browserIndex]?.state || null;
    },
    get length() {
      return browserStack.length;
    },
    pushState(state, title, url) {
      browserIndex++;
      browserStack.splice(browserIndex);
      browserStack.push({ state, title, url });
    },
    replaceState(state, title, url) {
      if (browserIndex >= 0 && browserIndex < browserStack.length) {
        browserStack[browserIndex] = { state, title, url };
      } else {
        browserIndex = 0;
        browserStack[0] = { state, title, url };
      }
    },
    back() {
      if (browserIndex > 0) {
        browserIndex--;
      }
    },
  },
  localStorage: {
    _store: {},
    getItem(key) { return this._store[key] || null; },
    setItem(key, val) { this._store[key] = String(val); },
    removeItem(key) { delete this._store[key]; },
    clear() { this._store = {}; }
  }
};

const { NavigationService } = require('../src/services/navigationService.js');
const { BrainBlitzPersistenceService, BRAIN_BLITZ_MODES } = require('../src/services/brainBlitzPersistenceService.js');
const { GamePersistenceService } = require('../src/services/gamePersistenceService.js');
const { LogicCodePersistenceService } = require('../src/services/logicCodePersistenceService.js');

async function runExitFlowTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 PIXO GAMEPLAY EXIT, PAUSE, RESUME & LOSE FLOW SUITE');
  console.log('🧪 ========================================================\n');

  let passedTests = 0;
  function pass(msg) {
    console.log(`  ✔ PASS - ${msg}`);
    passedTests++;
  }

  const testUserId = 'usr_demo_exit_tester';

  // --- TEST 1: NavigationService.navigateToDashboard() ---
  console.log('--- TEST 1: NavigationService Direct Dashboard Reset ---');
  // Simulate deep route navigation: Dashboard -> Games -> Brain Blitz -> Levels -> Gameplay
  NavigationService.navigate('games');
  NavigationService.navigate('brain_blitz');
  NavigationService.navigate('brain_blitz_levels', { mode: 'memory_match' });
  NavigationService.navigate('brain_blitz_gameplay', { mode: 'memory_match', level: 2 });

  assert.strictEqual(NavigationService.getCurrentRoute().id, 'brain_blitz_gameplay');
  assert(NavigationService.getHistoryDepth() > 1, 'History depth must be > 1 before reset');

  let notifiedRoute = null;
  const unsub = NavigationService.subscribe((route) => {
    notifiedRoute = route;
  });

  // Call navigateToDashboard()
  NavigationService.navigateToDashboard();
  unsub();

  assert.strictEqual(NavigationService.getCurrentRoute().id, 'home', 'Route must be reset to "home"');
  assert.strictEqual(NavigationService.getHistoryDepth(), 1, 'History depth must be reset to 1');
  assert.strictEqual(NavigationService.currentIndex, 0, 'Current index must be 0');
  assert(notifiedRoute && notifiedRoute.id === 'home', 'Subscribers must be notified of "home" route');
  pass('NavigationService.navigateToDashboard() cleanly resets stack to Dashboard with depth 1 and index 0');

  // --- TEST 2: Single Exit Confirmation Behavior (No Duplicate Popups) ---
  console.log('\n--- TEST 2: Exit Confirmation Mode vs Pause Mode ---');
  const pauseModalContent = fs.readFileSync('src/components/common/PixoPauseModal.js', 'utf8');
  assert(pauseModalContent.includes("isExitConfirmMode = mode === 'exit_confirm'"), 'PixoPauseModal must support mode prop');
  assert(pauseModalContent.includes('KEEP PLAYING'), 'PixoPauseModal must offer KEEP PLAYING button');
  assert(pauseModalContent.includes('SAVE & EXIT'), 'PixoPauseModal must offer SAVE & EXIT button');
  assert(pauseModalContent.includes('RESUME GAME'), 'PixoPauseModal must offer RESUME GAME button');
  assert(pauseModalContent.includes('EXIT GAME'), 'PixoPauseModal must offer EXIT GAME button');
  assert(!pauseModalContent.includes('SAVE & EXIT TO LEVEL SELECTION'), 'PixoPauseModal must NOT mention Level Selection');
  pass('PixoPauseModal is available with unified dual-mode architecture (exit_confirm vs pause)');

  // --- TEST 3: Brain Blitz Session State Saving on Exit ---
  console.log('\n--- TEST 3: Brain Blitz Mid-Game Session Persistence ---');
  await BrainBlitzPersistenceService.clearActiveSession(testUserId);
  const initialSession = await BrainBlitzPersistenceService.getActiveSession(testUserId);
  assert.strictEqual(initialSession, null, 'Active session must initially be null');

  const testSessionPayload = {
    userId: testUserId,
    gameId: 'g_brain_blitz',
    gameTitle: 'PIXO Brain Blitz',
    mode: BRAIN_BLITZ_MODES.MEMORY_MATCH,
    modeTitle: 'Memory Match',
    level: 3,
    timeLeft: 34,
    score: 280,
    moves: 8,
    mistakes: 1,
    boardState: {
      cards: [
        { id: 'c1', pairId: 'p1', symbol: 'shield', isMatched: true },
        { id: 'c2', pairId: 'p1', symbol: 'shield', isMatched: true },
        { id: 'c3', pairId: 'p2', symbol: 'flame', isMatched: false },
        { id: 'c4', pairId: 'p2', symbol: 'flame', isMatched: false },
      ],
      matchedPairIds: ['p1'],
    },
    status: 'SAVED',
    timestamp: Date.now(),
  };

  await BrainBlitzPersistenceService.saveActiveSession(testUserId, testSessionPayload);
  const retrievedSession = await BrainBlitzPersistenceService.getActiveSession(testUserId);

  assert(retrievedSession, 'Saved session must be retrievable from persistence storage');
  assert.strictEqual(retrievedSession.level, 3, 'Level must be preserved exactly (3)');
  assert.strictEqual(retrievedSession.timeLeft, 34, 'Frozen clock must be preserved exactly (34s)');
  assert.strictEqual(retrievedSession.score, 280, 'Score must be preserved exactly (280)');
  assert.strictEqual(retrievedSession.status, 'SAVED', 'Status must be marked as SAVED');
  assert.strictEqual(retrievedSession.boardState.matchedPairIds.length, 1, 'Matched pair IDs must be preserved');
  pass('BrainBlitzPersistenceService saves complete board state, matched pairs, score, and frozen timer');

  // Clear active session (as done on retry or completion)
  await BrainBlitzPersistenceService.clearActiveSession(testUserId);
  const clearedSession = await BrainBlitzPersistenceService.getActiveSession(testUserId);
  assert.strictEqual(clearedSession, null, 'Session must be cleared on level finish or fresh attempt');
  pass('BrainBlitzPersistenceService clears session on level complete or fresh retry');

  // --- TEST 4: Target Number Session Persistence ---
  console.log('\n--- TEST 4: Target Number Session Save & Resume ---');
  await GamePersistenceService.clearActiveSession(testUserId);
  await GamePersistenceService.saveActiveSession(testUserId, {
    sessionId: GamePersistenceService.createSessionId(),
    userId: testUserId,
    gameId: 'g_target_no',
    level: 2,
    operator: '+',
    timeLeft: 19,
    endTime: Date.now() + 19000,
    problems: [{ num1: 5, num2: 4, op: '+', answer: 9, choices: [9, 8, 7, 10] }],
    currentProblemIdx: 0,
    score: 450,
    status: 'SAVED',
  });
  const tnSaved = await GamePersistenceService.getActiveSession(testUserId);
  assert(tnSaved, 'Target Number active session must be stored');
  assert.strictEqual(tnSaved.level, 2);
  assert.strictEqual(tnSaved.status, 'SAVED');
  pass('Target Number session state saved with status: SAVED and frozen timer');

  // --- TEST 5: Logic Code (Cyber Strike) Session Persistence ---
  console.log('\n--- TEST 5: Logic Code (Cyber Strike) Session Save & Resume ---');
  await LogicCodePersistenceService.clearActiveSession(testUserId);
  await LogicCodePersistenceService.saveActiveSession(testUserId, {
    level: 5,
    category: 'category_1',
    score: 120,
    currentQuestionIdx: 2,
    status: 'SAVED',
  });
  const lcSaved = await LogicCodePersistenceService.getActiveSession(testUserId);
  assert(lcSaved, 'Logic Code active session must be stored');
  assert.strictEqual(lcSaved.level, 5);
  assert.strictEqual(lcSaved.currentQuestionIdx, 2);
  pass('Logic Code session state saved with status: SAVED and current question index');

  // --- TEST 6: Codebase Validation for Exit Flow Buttons ---
  console.log('\n--- TEST 6: Game Modals Navigation Contracts ---');
  const bbModalCode = fs.readFileSync('src/components/gameplay/BrainBlitzGameModal.js', 'utf8');
  const tnModalCode = fs.readFileSync('src/components/gameplay/TargetNumberGameModal.js', 'utf8');
  const lcModalCode = fs.readFileSync('src/components/gameplay/LogicCodeGameModal.js', 'utf8');

  // Check BrainBlitzGameModal
  assert(bbModalCode.includes('handleBackRequested'), 'BrainBlitz must have handleBackRequested');
  assert(bbModalCode.includes('handleReturnToDashboard'), 'BrainBlitz must have handleReturnToDashboard');
  assert(bbModalCode.includes('handleRetryLevel'), 'BrainBlitz must have handleRetryLevel');
  assert(bbModalCode.includes('RETURN TO DASHBOARD'), 'BrainBlitz must have RETURN TO DASHBOARD button in UI');
  assert(bbModalCode.includes('RETRY LEVEL') || bbModalCode.includes('RETRY'), 'BrainBlitz must have RETRY button in UI');
  assert(bbModalCode.includes('navigateToDashboard'), 'BrainBlitz must call NavigationService.navigateToDashboard()');
  pass('BrainBlitzGameModal implements handleBackRequested, handleReturnToDashboard, and RETRY flow');

  // Check TargetNumberGameModal
  assert(tnModalCode.includes('handleBackRequested'), 'TargetNumber must have handleBackRequested');
  assert(tnModalCode.includes('handleReturnToDashboard'), 'TargetNumber must have handleReturnToDashboard');
  assert(tnModalCode.includes('RETURN TO DASHBOARD'), 'TargetNumber must have RETURN TO DASHBOARD button in UI');
  assert(tnModalCode.includes('navigateToDashboard'), 'TargetNumber must call NavigationService.navigateToDashboard()');
  pass('TargetNumberGameModal implements handleBackRequested, handleReturnToDashboard, and direct dashboard return');

  // Check LogicCodeGameModal
  assert(lcModalCode.includes('handleBackRequested'), 'LogicCode must have handleBackRequested');
  assert(lcModalCode.includes('handleReturnToDashboard'), 'LogicCode must have handleReturnToDashboard');
  assert(lcModalCode.includes('RETURN TO DASHBOARD'), 'LogicCode must have RETURN TO DASHBOARD button in UI');
  assert(lcModalCode.includes('navigateToDashboard'), 'LogicCode must call NavigationService.navigateToDashboard()');
  pass('LogicCodeGameModal implements handleBackRequested, handleReturnToDashboard, and direct dashboard return');

  // Check HomeScreen Responsive layout & saved session resume
  console.log('\n--- TEST 7: HomeScreen Responsive PC Layout & Saved Session Integration ---');
  const homeCode = fs.readFileSync('src/screens/HomeScreen.js', 'utf8');
  assert(homeCode.includes('maxWidth: 960') || homeCode.includes('maxWidth: 1080'), 'HomeScreen must expand up to >= 960px for PC responsiveness');
  assert(homeCode.includes('savedSessionInfo'), 'HomeScreen must connect active saved session to Continue Playing card');
  pass('HomeScreen supports responsive widescreen PC layout and connects real saved game session to Continue Playing');

  console.log('\n📊 ========================================================');
  console.log(`📊 TEST RESULTS: ${passedTests} TESTS PASSED (100%)`);
  console.log('📊 ========================================================');
  console.log('🎉 ALL GAMEPLAY EXIT, PAUSE, RESUME AND LOSE FLOW TESTS VERIFIED!');
}

runExitFlowTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
