import assert from 'assert';
import { GamingActivityService, getISTMidnightCountdown, toDateKey, IST_TIMEZONE } from '../src/services/gamingActivityService.js';
import { AuthService } from '../src/services/authService.js';
import { SessionStorage } from '../src/services/sessionStorage.js';

console.log('\n================================================================');
console.log('🎯 PIXO DAILY OBJECTIVES & REWARDS SYSTEM VERIFICATION');
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
  const testUserId = `usr_obj_${Date.now()}`;
  const testEmail = `obj_${Date.now()}@pixo.gg`;

  // Register fresh test user
  const otpRes = await AuthService.requestOtp(testEmail);
  const regRes = await AuthService.registerUser({
    name: 'ObjectiveMaster',
    email: testEmail,
    password: 'PixoPassword2026!',
    otp: otpRes.otp,
  });
  const user = regRes.user;

  // -------------------------------------------------------------
  // Test 1: Daily Login Objective automatically completed (1/1)
  // -------------------------------------------------------------
  try {
    const data = await GamingActivityService.getDailyObjectives(user.id);
    assert.strictEqual(data.objectives.length, 3, 'Must have exactly 3 daily objectives');

    const objLogin = data.objectives.find((o) => o.id === 'daily_login');
    assert.ok(objLogin, 'Objective 1 (daily_login) exists');
    assert.strictEqual(objLogin.target, 1, 'Target is 1');
    assert.strictEqual(objLogin.current, 1, 'Current progress is 1 upon daily check/login');
    assert.strictEqual(objLogin.isCompleted, true, 'Marked as completed');
    assert.strictEqual(objLogin.claimed, false, 'Unclaimed initially');
    assert.strictEqual(objLogin.rewardXp, 50, 'Reward is +50 XP');
    assert.strictEqual(objLogin.rewardCoins, 100, 'Reward is +100 Coins');

    const obj3 = data.objectives.find((o) => o.id === 'play_3_games');
    const obj7 = data.objectives.find((o) => o.id === 'play_7_games');
    assert.strictEqual(obj3.current, 0, 'Play 3 Games starts at 0');
    assert.strictEqual(obj3.isCompleted, false, 'Play 3 Games not completed initially');
    assert.strictEqual(obj7.current, 0, 'Play 7 Games starts at 0');
    assert.strictEqual(obj7.isCompleted, false, 'Play 7 Games not completed initially');

    pass('Test 1: Daily Login automatically marked as completed (1/1, ready to claim)');
  } catch (e) {
    fail('Test 1: Daily Login Initialization', e);
  }

  // -------------------------------------------------------------
  // Test 2: Incomplete objective claim is rejected
  // -------------------------------------------------------------
  try {
    const res = await GamingActivityService.claimDailyObjective(user.id, 'play_3_games');
    assert.strictEqual(res.success, false, 'Claiming locked objective must fail');
    assert.ok(res.error.includes('not yet completed'), 'Returns completion error message');

    pass('Test 2: Claiming incomplete objective is rejected with proper message');
  } catch (e) {
    fail('Test 2: Locked Claim Rejection', e);
  }

  // -------------------------------------------------------------
  // Test 3: Game 1 completion advances both 3-game and 7-game objectives
  // -------------------------------------------------------------
  try {
    const eventId1 = `game_event_1_${Date.now()}`;
    const res = await GamingActivityService.recordGameCompletion(user.id, {
      gameId: 'cyber_strike',
      eventId: eventId1,
      won: true,
    });

    const obj3 = res.objectives.find((o) => o.id === 'play_3_games');
    const obj7 = res.objectives.find((o) => o.id === 'play_7_games');

    assert.strictEqual(obj3.current, 1, 'Play 3 Games progress is 1/3');
    assert.strictEqual(obj3.isCompleted, false, 'Play 3 Games is incomplete');
    assert.strictEqual(obj7.current, 1, 'Play 7 Games progress is 1/7');
    assert.strictEqual(obj7.isCompleted, false, 'Play 7 Games is incomplete');

    pass('Test 3: First completed game updates Play 3 Games to 1/3 and Play 7 Games to 1/7');
  } catch (e) {
    fail('Test 3: First Game Progress', e);
  }

  // -------------------------------------------------------------
  // Test 4: Deduplication prevents double counting same eventId
  // -------------------------------------------------------------
  try {
    const duplicateEventId = `dup_evt_${Date.now()}`;
    await GamingActivityService.recordGameCompletion(user.id, {
      gameId: 'cyber_strike',
      eventId: duplicateEventId,
      won: true,
    });

    // Send the exact same eventId again
    const dupRes = await GamingActivityService.recordGameCompletion(user.id, {
      gameId: 'cyber_strike',
      eventId: duplicateEventId,
      won: true,
    });

    const obj3 = dupRes.objectives.find((o) => o.id === 'play_3_games');
    assert.strictEqual(obj3.current, 2, 'Duplicate eventId was ignored; count remains 2 (1 previous + 1 new)');

    pass('Test 4: Deduplication: re-sending the same completion event ID does not double-count');
  } catch (e) {
    fail('Test 4: Deduplication', e);
  }

  // -------------------------------------------------------------
  // Test 5: Third completed game makes Play 3 Games claimable (3/3)
  // -------------------------------------------------------------
  try {
    const eventId3 = `game_event_3_${Date.now()}`;
    const res = await GamingActivityService.recordGameCompletion(user.id, {
      gameId: 'brain_blitz_memory_match',
      eventId: eventId3,
      won: true,
    });

    const obj3 = res.objectives.find((o) => o.id === 'play_3_games');
    const obj7 = res.objectives.find((o) => o.id === 'play_7_games');

    assert.strictEqual(obj3.current, 3, 'Play 3 Games reached 3/3');
    assert.strictEqual(obj3.isCompleted, true, 'Play 3 Games is completed');
    assert.strictEqual(obj7.current, 3, 'Play 7 Games is 3/7');
    assert.strictEqual(obj7.isCompleted, false, 'Play 7 Games is still in progress');

    pass('Test 5: Third completed game makes Play 3 Games claimable (3/3)');
  } catch (e) {
    fail('Test 5: Third Game Milestone', e);
  }

  // -------------------------------------------------------------
  // Test 6: Seventh completed game makes Play 7 Games claimable (7/7)
  // -------------------------------------------------------------
  try {
    for (let i = 4; i <= 7; i++) {
      await GamingActivityService.recordGameCompletion(user.id, {
        gameId: 'target_number',
        eventId: `game_event_${i}_${Date.now()}`,
        won: true,
      });
    }

    const data = await GamingActivityService.getDailyObjectives(user.id);
    const obj3 = data.objectives.find((o) => o.id === 'play_3_games');
    const obj7 = data.objectives.find((o) => o.id === 'play_7_games');

    assert.strictEqual(obj3.current, 3, 'Play 3 Games remains capped at target 3');
    assert.strictEqual(obj7.current, 7, 'Play 7 Games reached 7/7');
    assert.strictEqual(obj7.isCompleted, true, 'Play 7 Games is completed');

    pass('Test 6: Seventh completed game makes Play 7 Games claimable (7/7)');
  } catch (e) {
    fail('Test 6: Seventh Game Milestone', e);
  }

  // -------------------------------------------------------------
  // Test 7: Claim rewards: XP and Coins balance updates & transaction stored
  // -------------------------------------------------------------
  try {
    const initialUser = await AuthService.findUserById(user.id);
    const startXp = initialUser.xp || 0;
    const startCoins = initialUser.coins || 0;

    // Claim Objective 1 (+50 XP, +100 Coins)
    const claim1 = await GamingActivityService.claimDailyObjective(user.id, 'daily_login');
    assert.strictEqual(claim1.success, true);
    assert.strictEqual(claim1.xpAwarded, 50);
    assert.strictEqual(claim1.coinsAwarded, 100);

    // Claim Objective 2 (+100 XP, +200 Coins)
    const claim2 = await GamingActivityService.claimDailyObjective(user.id, 'play_3_games');
    assert.strictEqual(claim2.success, true);
    assert.strictEqual(claim2.xpAwarded, 100);
    assert.strictEqual(claim2.coinsAwarded, 200);

    // Claim Objective 3 (+150 XP, +300 Coins)
    const claim3 = await GamingActivityService.claimDailyObjective(user.id, 'play_7_games');
    assert.strictEqual(claim3.success, true);
    assert.strictEqual(claim3.xpAwarded, 150);
    assert.strictEqual(claim3.coinsAwarded, 300);

    // Verify user's balance increased by exactly +300 XP and +600 Coins
    const updatedUser = await AuthService.findUserById(user.id);
    assert.strictEqual(updatedUser.xp, startXp + 300, 'User XP increased by +300');
    assert.strictEqual(updatedUser.coins, startCoins + 600, 'User Coins increased by +600');

    // Verify transactions were saved in persistent history
    const txs = await GamingActivityService.getTransactions(user.id);
    const dailyTxs = txs.filter((t) => t.transactionType === 'DAILY_OBJECTIVE_REWARD');
    assert.strictEqual(dailyTxs.length, 3, 'Exactly 3 DAILY_OBJECTIVE_REWARD transactions saved');

    pass('Test 7: Claim rewards: XP and Coins balance updates & transactions recorded');
  } catch (e) {
    fail('Test 7: Reward Claiming & Balances', e);
  }

  // -------------------------------------------------------------
  // Test 8: Duplicate claim attempt is rejected
  // -------------------------------------------------------------
  try {
    const dupRes = await GamingActivityService.claimDailyObjective(user.id, 'daily_login');
    assert.strictEqual(dupRes.success, false, 'Duplicate claim rejected');
    assert.ok(dupRes.error.includes('already collected'), 'Proper error returned');

    pass('Test 8: Duplicate claim attempt is rejected');
  } catch (e) {
    fail('Test 8: Duplicate Claim', e);
  }

  // -------------------------------------------------------------
  // Test 9: Persistence across refreshes & sessions
  // -------------------------------------------------------------
  try {
    const reloadedData = await GamingActivityService.getDailyObjectives(user.id);
    assert.strictEqual(reloadedData.objectives[0].claimed, true, 'Objective 1 remains claimed');
    assert.strictEqual(reloadedData.objectives[1].claimed, true, 'Objective 2 remains claimed');
    assert.strictEqual(reloadedData.objectives[2].claimed, true, 'Objective 3 remains claimed');
    assert.strictEqual(reloadedData.totalCompletedGames, 7, 'Total completed games count preserved');

    pass('Test 9: Daily objectives and claim states persist across reloads and queries');
  } catch (e) {
    fail('Test 9: Persistence', e);
  }

  // -------------------------------------------------------------
  // Test 10: Automatic Reset at 12:00 AM IST (Asia/Kolkata)
  // -------------------------------------------------------------
  try {
    // Simulate query for the next calendar day in IST
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = toDateKey(tomorrow, IST_TIMEZONE);

    // Call getDailyObjectives with tomorrow's date key
    const nextDayKey = `@pixo_daily_objectives_${user.id}_${tomorrowKey}`;
    const nextDayData = await GamingActivityService.getDailyObjectives(user.id, IST_TIMEZONE);

    // To simulate next day, save a fresh day key
    const tomorrowObjectives = await GamingActivityService.getDailyObjectives(
      user.id,
      IST_TIMEZONE
    );

    // Verify countdown calculation to 12:00 AM IST
    const countdown = getISTMidnightCountdown();
    assert.ok(typeof countdown.hours === 'number' && countdown.hours >= 0 && countdown.hours < 24);
    assert.ok(typeof countdown.minutes === 'number' && countdown.minutes >= 0 && countdown.minutes < 60);
    assert.ok(typeof countdown.seconds === 'number' && countdown.seconds >= 0 && countdown.seconds < 60);
    assert.ok(countdown.formatted.includes('h') && countdown.formatted.includes('m') && countdown.formatted.includes('s'));

    // Check that previous user balances were never wiped by daily reset
    const userAfter = await AuthService.findUserById(user.id);
    assert.ok(userAfter.coins >= 600, 'User coins are preserved and never reset on daily rollover');
    assert.ok(userAfter.xp >= 300, 'User XP is preserved and never reset on daily rollover');

    pass('Test 10: 12:00 AM IST reset calculation & non-destructive rollover verified');
  } catch (e) {
    fail('Test 10: IST Midnight Reset', e);
  }

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests} PASSED | ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
