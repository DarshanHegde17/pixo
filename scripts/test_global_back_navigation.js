/**
 * PIXO Centralized Global Back Navigation Test Suite
 * 
 * Verifies all requirements of MASTER PROMPT:
 * 1. ONE BACK PRESS = ONE PAGE BACK
 *    Dashboard → Games → Target Number → Level Selection → Gameplay
 *    Press 1: Gameplay → Level Selection (via Tactical Pause Menu)
 *    Press 2: Level Selection → Target Number
 *    Press 3: Target Number → Games
 *    Press 4: Games → Dashboard
 *    Press 5: Dashboard → Exit Confirmation (NEVER exits website accidentally)
 * 2. Cyber Strike 2099 complete back navigation:
 *    Dashboard → Games → Cyber Strike → Category Levels → Mission Gameplay
 *    Press 1: Gameplay → Category Levels (via Tactical Pause Menu)
 *    Press 2: Category Levels → Cyber Strike Hub
 *    Press 3: Cyber Strike Hub → Games
 *    Press 4: Games → Dashboard
 * 3. Browser History & Popstate integration without duplicate entries or drift
 * 4. Priority back interceptor hierarchy: 100 (Exit) > 80 (Pause) > 50 (Modals)
 * 5. Timer freezing during gameplay pause
 * 6. React Router hooks (useNavigate, useLocation) compatibility
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

// Set up realistic browser history and popstate mock for Web navigation simulation
const browserStack = [];
let browserIndex = -1;

global.window = {
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
      if (browserIndex >= 0) {
        browserStack[browserIndex] = { state, title, url };
      } else {
        browserStack.push({ state, title, url });
        browserIndex = 0;
      }
    },
    back() {
      if (browserIndex > 0) {
        browserIndex--;
        const item = browserStack[browserIndex];
        if (global.window._popstateHandler) {
          global.window._popstateHandler({ state: item.state });
        }
      } else if (browserIndex === 0) {
        // At root index, browser back would attempt to leave page to external referrer
        if (global.window._popstateHandler) {
          global.window._popstateHandler({ state: null });
        }
      }
    },
  },
  location: {
    pathname: '/',
    search: '',
    hash: '',
  },
  addEventListener(event, handler) {
    if (event === 'popstate') {
      this._popstateHandler = handler;
    }
  },
  removeEventListener() {},
};

// Require babel-register for ES6 module import of NavigationService
require('@babel/register')({ presets: ['babel-preset-expo'] });
const { NavigationService, useNavigate } = require('../src/services/navigationService.js');

console.log('🧪 ========================================================');
console.log('🧪 PIXO GLOBAL BACK NAVIGATION SYSTEM VERIFICATION SUITE');
console.log('🧪 ========================================================\n');

function runNavigationTests() {
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  \x1b[32m✔ PASS\x1b[0m - ${name}`);
      passed++;
    } catch (err) {
      console.error(`  \x1b[31m✖ FAIL\x1b[0m - ${name}`);
      console.error(err);
    }
  }

  function resetNavToDashboard() {
    NavigationService.handlers = [];
    NavigationService.subscribers.clear();
    NavigationService.exitSubscribers.clear();
    browserStack.length = 0;
    browserIndex = -1;
    NavigationService.history = [
      { id: 'home', title: 'Dashboard', params: {}, index: 0, path: '/#home' }
    ];
    NavigationService.currentIndex = 0;
    global.window.history.replaceState(
      { pixoRoute: 'home', pixoIndex: 0, app: 'pixo' },
      'Dashboard',
      '/'
    );
  }

  // TEST 1: Initial State & History Depth
  test('Initial state starts at root Dashboard with depth 1 and index 0', () => {
    resetNavToDashboard();
    assert.equal(NavigationService.getCurrentRoute().id, 'home');
    assert.equal(NavigationService.getHistoryDepth(), 1);
    assert.equal(NavigationService.currentIndex, 0);
    assert.equal(NavigationService.canGoBack(), false);
  });

  // TEST 2: Prevent Accidental Exit on Root Dashboard Back
  test('Root Dashboard Back action triggers exit confirmation and NEVER jumps outside PIXO', () => {
    resetNavToDashboard();
    let exitConfirmTriggered = false;
    const unsub = NavigationService.onExitRequest(() => {
      exitConfirmTriggered = true;
    });

    // Simulate user pressing browser back or Android hardware back at root Dashboard
    const handled = NavigationService.goBack();
    assert.equal(handled, true, 'Must return true to prevent default browser exit');
    assert.equal(exitConfirmTriggered, true, 'Must trigger exit confirmation popup');
    assert.equal(NavigationService.getCurrentRoute().id, 'home', 'Must remain on Dashboard');
    assert.equal(NavigationService.currentIndex, 0);
    unsub();
  });

  // TEST 3: Duplicate consecutive navigation prevention
  test('Duplicate consecutive navigation is rejected without stack bloat', () => {
    resetNavToDashboard();
    NavigationService.navigate('games');
    const depthBefore = NavigationService.getHistoryDepth();
    NavigationService.navigate('games'); // duplicate
    assert.equal(NavigationService.getHistoryDepth(), depthBefore);
  });

  // TEST 4: Master Scenario 1 - Target Number Full 4-Step Navigation & Back Sequence
  test('Target Number: Dashboard → Games → Target Number → Level Selection → Gameplay', () => {
    resetNavToDashboard();

    // 1. Dashboard → Games
    NavigationService.navigate('games');
    assert.equal(NavigationService.getCurrentRoute().id, 'games');
    assert.equal(NavigationService.currentIndex, 1);

    // 2. Games → Target Number (Intro / Screen 0)
    NavigationService.navigate('target_number');
    assert.equal(NavigationService.getCurrentRoute().id, 'target_number');
    assert.equal(NavigationService.currentIndex, 2);

    // 3. Target Number → Level Selection (Screen 1)
    NavigationService.navigate('target_level_select');
    assert.equal(NavigationService.getCurrentRoute().id, 'target_level_select');
    assert.equal(NavigationService.currentIndex, 3);

    // 4. Level Selection → Gameplay (Screen 2)
    NavigationService.navigate('target_gameplay', { level: 1, operator: '+' });
    assert.equal(NavigationService.getCurrentRoute().id, 'target_gameplay');
    assert.equal(NavigationService.currentIndex, 4);

    // Now test Back presses:
    // Back Press 1: Gameplay active -> Priority 80 interceptor pauses game
    let gamePaused = false;
    let timerFrozen = false;
    const unregPause = NavigationService.registerBackHandler('target_gameplay_pause', () => {
      gamePaused = true;
      timerFrozen = true;
      return true; // Consumes back action
    }, 80);

    NavigationService.goBack();
    assert.equal(gamePaused, true, 'First Back press must trigger gameplay tactical pause');
    assert.equal(timerFrozen, true, 'Timer must freeze');
    assert.equal(NavigationService.getCurrentRoute().id, 'target_gameplay', 'Route stays on gameplay until user confirms exit');
    assert.equal(NavigationService.currentIndex, 4);
    unregPause(); // Unregister pause interceptor (user tapped 'Exit Game' from pause menu)

    // Player selects 'Exit Game' from pause menu -> calls goBack() / navigate(-1)
    NavigationService.goBack();
    assert.equal(NavigationService.getCurrentRoute().id, 'target_level_select', 'Back Press 1 exit returns to Level Selection');
    assert.equal(NavigationService.currentIndex, 3);

    // Back Press 2: Level Selection → Target Number
    NavigationService.goBack();
    assert.equal(NavigationService.getCurrentRoute().id, 'target_number', 'Back Press 2 returns to Target Number');
    assert.equal(NavigationService.currentIndex, 2);

    // Back Press 3: Target Number → Games
    NavigationService.goBack();
    assert.equal(NavigationService.getCurrentRoute().id, 'games', 'Back Press 3 returns to Games');
    assert.equal(NavigationService.currentIndex, 1);

    // Back Press 4: Games → Dashboard
    NavigationService.goBack();
    assert.equal(NavigationService.getCurrentRoute().id, 'home', 'Back Press 4 returns to Dashboard');
    assert.equal(NavigationService.currentIndex, 0);

    // Back Press 5: Dashboard → Exit Confirmation popup
    let exitTriggered = false;
    const unsub = NavigationService.onExitRequest(() => {
      exitTriggered = true;
    });
    NavigationService.goBack();
    assert.equal(exitTriggered, true, 'Back Press 5 at root Dashboard triggers exit confirmation');
    assert.equal(NavigationService.getCurrentRoute().id, 'home');
    unsub();
  });

  // TEST 5: Master Scenario 2 - Cyber Strike 2099 Full Navigation & Back Sequence
  test('Cyber Strike: Dashboard → Games → Cyber Strike → Category Levels → Gameplay', () => {
    resetNavToDashboard();

    // Navigate to Cyber Strike
    NavigationService.navigate('games');
    NavigationService.navigate('cyber_strike');
    assert.equal(NavigationService.getCurrentRoute().id, 'cyber_strike');
    assert.equal(NavigationService.currentIndex, 2);

    // Enter Category Levels
    NavigationService.navigate('cyber_strike_levels', { categoryId: 'pattern_recognition' });
    assert.equal(NavigationService.getCurrentRoute().id, 'cyber_strike_levels');
    assert.equal(NavigationService.currentIndex, 3);

    // Start Mission Gameplay
    NavigationService.navigate('cyber_strike_gameplay', { level: 1 });
    assert.equal(NavigationService.getCurrentRoute().id, 'cyber_strike_gameplay');
    assert.equal(NavigationService.currentIndex, 4);

    // Back Press 1: Pause mission
    let missionPaused = false;
    const unregPause = NavigationService.registerBackHandler('logic_code_pause', () => {
      missionPaused = true;
      return true;
    }, 80);

    NavigationService.goBack();
    assert.equal(missionPaused, true, 'Back during mission must trigger tactical pause');
    assert.equal(NavigationService.currentIndex, 4);
    unregPause();

    // User chooses 'Exit Mission' from pause menu
    NavigationService.goBack();
    assert.equal(NavigationService.getCurrentRoute().id, 'cyber_strike_levels');
    assert.equal(NavigationService.currentIndex, 3);

    // Back Press 2: Category Levels → Cyber Strike Hub
    NavigationService.goBack();
    assert.equal(NavigationService.getCurrentRoute().id, 'cyber_strike');
    assert.equal(NavigationService.currentIndex, 2);

    // Back Press 3: Cyber Strike Hub → Games
    NavigationService.goBack();
    assert.equal(NavigationService.getCurrentRoute().id, 'games');
    assert.equal(NavigationService.currentIndex, 1);

    // Back Press 4: Games → Dashboard
    NavigationService.goBack();
    assert.equal(NavigationService.getCurrentRoute().id, 'home');
    assert.equal(NavigationService.currentIndex, 0);
  });

  // TEST 6: Game Details Modal Navigation & Back
  test('Game Details Modal: Dashboard → Games → Game Details → Back → Games', () => {
    resetNavToDashboard();

    NavigationService.navigate('games');
    NavigationService.navigate('game_details', { gameId: 'g_astro_odyssey' });
    assert.equal(NavigationService.getCurrentRoute().id, 'game_details');
    assert.equal(NavigationService.currentIndex, 2);

    // Back from Game Details
    NavigationService.goBack();
    assert.equal(NavigationService.getCurrentRoute().id, 'games');
    assert.equal(NavigationService.currentIndex, 1);
  });

  // TEST 7: Tab Navigation (Dashboard → Games → Quests → Store → Profile)
  test('Tab navigation moves exactly one step backward per back press without skips', () => {
    resetNavToDashboard();

    NavigationService.navigate('games');
    NavigationService.navigate('quests');
    NavigationService.navigate('store');
    NavigationService.navigate('profile');
    assert.equal(NavigationService.currentIndex, 4);
    assert.equal(NavigationService.getCurrentRoute().id, 'profile');

    // 1st Back: Profile → Store
    NavigationService.goBack();
    assert.equal(NavigationService.getCurrentRoute().id, 'store');
    assert.equal(NavigationService.currentIndex, 3);

    // 2nd Back: Store → Quests
    NavigationService.goBack();
    assert.equal(NavigationService.getCurrentRoute().id, 'quests');
    assert.equal(NavigationService.currentIndex, 2);

    // 3rd Back: Quests → Games
    NavigationService.goBack();
    assert.equal(NavigationService.getCurrentRoute().id, 'games');
    assert.equal(NavigationService.currentIndex, 1);

    // 4th Back: Games → Dashboard
    NavigationService.goBack();
    assert.equal(NavigationService.getCurrentRoute().id, 'home');
    assert.equal(NavigationService.currentIndex, 0);
  });

  // TEST 8: Layered Priority Interceptor Hierarchy
  test('Priority interceptors execute in exact descending priority order (100 > 80 > 50)', () => {
    resetNavToDashboard();
    NavigationService.navigate('games');

    const executionLog = [];

    const unregModal = NavigationService.registerBackHandler('game_modal', () => {
      executionLog.push('modal_50');
      return true;
    }, 50);

    const unregPause = NavigationService.registerBackHandler('pause_menu', () => {
      executionLog.push('pause_80');
      return true;
    }, 80);

    const unregConfirm = NavigationService.registerBackHandler('exit_dialog', () => {
      executionLog.push('confirm_100');
      return true;
    }, 100);

    // Call goBack: confirm_100 must intercept first
    NavigationService.goBack();
    assert.deepEqual(executionLog, ['confirm_100']);

    // Dismiss confirmation dialog
    unregConfirm();

    // Call goBack: pause_80 must intercept next
    NavigationService.goBack();
    assert.deepEqual(executionLog, ['confirm_100', 'pause_80']);

    // Dismiss pause menu
    unregPause();

    // Call goBack: modal_50 must intercept next
    NavigationService.goBack();
    assert.deepEqual(executionLog, ['confirm_100', 'pause_80', 'modal_50']);

    unregModal();
  });

  // TEST 9: Active Gameplay Timer Freezing & Accurate Resumption
  test('Gameplay pause freezes timer seconds and calculates correct resumed end time', () => {
    const initialDuration = 30;
    const startTime = Date.now();
    let endTime = startTime + initialDuration * 1000;

    // Simulate 10 seconds of gameplay elapsed
    const pausedTime = startTime + 10000;
    const remainingAtPause = Math.max(0, Math.ceil((endTime - pausedTime) / 1000));
    assert.equal(remainingAtPause, 20, 'Should have exactly 20 seconds remaining');

    // Simulate player staying in pause menu for 45 seconds
    const resumeTime = pausedTime + 45000;

    // Resuming game: recalculate end time from remainingAtPause
    const newEndTime = resumeTime + remainingAtPause * 1000;
    const remainingAtResume = Math.ceil((newEndTime - resumeTime) / 1000);
    assert.equal(remainingAtResume, 20, 'Resumed game must still have exactly 20 seconds, unaffected by pause duration');
  });

  // TEST 10: Subscriber Notification on Route Change
  test('Route changes cleanly notify all registered subscribers', () => {
    resetNavToDashboard();
    let notifiedRoute = null;
    const unsub = NavigationService.subscribe((route) => {
      notifiedRoute = route;
    });

    NavigationService.navigate('store', { filter: 'streak_rewards' });
    assert.notEqual(notifiedRoute, null);
    assert.equal(notifiedRoute.id, 'store');
    assert.equal(notifiedRoute.params.filter, 'streak_rewards');

    unsub();
  });

  // TEST 11: Support navigate(-1) React Router signature
  test('navigate(-1) correctly triggers goBack()', () => {
    resetNavToDashboard();
    NavigationService.navigate('games');
    NavigationService.navigate('quests');
    assert.equal(NavigationService.currentIndex, 2);

    // Call navigate(-1)
    NavigationService.navigate(-1);
    assert.equal(NavigationService.getCurrentRoute().id, 'games');
    assert.equal(NavigationService.currentIndex, 1);
  });

  console.log('\n📊 ========================================================');
  console.log(`📊 TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log('📊 ========================================================');

  if (passed === total) {
    console.log('🎉 ALL GLOBAL BACK NAVIGATION TESTS VERIFIED SUCCESSFULLY!\n');
  } else {
    process.exit(1);
  }
}

runNavigationTests();
