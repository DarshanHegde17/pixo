import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  GamingActivityService,
  STREAK_ACHIEVEMENT_MILESTONES,
  toDateKey,
  getAppTimezone,
} from '../src/services/gamingActivityService.js';
import { AuthService } from '../src/services/authService.js';

console.log('\n================================================================');
console.log('⚡ PIXO GITHUB-HEATMAP & PLAYER INSIGHTS DASHBOARD VERIFICATION');
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
  const testUserId = `usr_insights_${Date.now()}`;
  const testEmail = `insights_${Date.now()}@pixo.gg`;
  const timezone = getAppTimezone();

  // Register fresh test user
  const otpRes = await AuthService.requestOtp(testEmail);
  const regRes = await AuthService.registerUser({
    name: 'TacticalOverlord',
    email: testEmail,
    password: 'PixoPassword2026!',
    otp: otpRes.otp,
  });
  const user = regRes.user;

  // -------------------------------------------------------------
  // Test 1: Verified Game Sessions Creation & Database Storage
  // -------------------------------------------------------------
  try {
    const today = new Date();
    const todayKey = toDateKey(today, timezone);

    // 1. Cyber Strike session
    const s1 = await GamingActivityService.startSession(user.id, {
      id: 'g_cyber_strike',
      title: 'Cyber Strike 2099',
      category: 'Action RPG',
    });
    await GamingActivityService.completeSession(user.id, s1.id, {
      difficulty: 3,
      won: true,
      result: 'Victory - Target Reached',
      score: 98,
    });

    // 2. Brain Blitz session
    const s2 = await GamingActivityService.startSession(user.id, {
      id: 'g_brain_blitz',
      title: 'Brain Blitz: Memory Match',
      category: 'Memory & Logic',
    });
    await GamingActivityService.completeSession(user.id, s2.id, {
      difficulty: 2,
      won: true,
      result: 'Victory - Cleared',
      score: 88,
    });

    // 3. Target Number session
    const s3 = await GamingActivityService.startSession(user.id, {
      id: 'g_target_number',
      title: 'Target Number: Speed Math',
      category: 'Math Puzzle',
    });
    await GamingActivityService.completeSession(user.id, s3.id, {
      difficulty: 2,
      won: true,
      result: 'Victory - Exact Math',
      score: 92,
    });

    const completions = await GamingActivityService.getUserCompletions(user.id);
    const sessions = await GamingActivityService.getUserSessions(user.id);
    assert.strictEqual(completions.length, 3, 'User must have exactly 3 verified completions');
    assert.strictEqual(sessions.length, 3, 'User must have exactly 3 recorded sessions');

    pass('Test 1: Multi-game activity created and verified in database');
  } catch (e) {
    fail('Test 1: Game Activity Storage', e);
  }

  // -------------------------------------------------------------
  // Test 2: GitHub-Style 1-Year Continuous Heatmap Component Check
  // -------------------------------------------------------------
  try {
    const fileContent = fs.readFileSync(
      path.resolve('src/components/profile/ActivityHeatmap.js'),
      'utf8'
    );

    // Ensure 3-month split is removed
    assert.ok(
      !fileContent.includes("viewMode === 'last3'"),
      'ActivityHeatmap must not have a separate 3-month split mode'
    );

    // Ensure continuous year stretch features are present
    assert.ok(
      fileContent.includes('contributions in {selectedYear}'),
      'ActivityHeatmap displays dynamic "{X} contributions in {year}" header matching Image 1'
    );
    assert.ok(
      fileContent.includes('monthHeaders'),
      'ActivityHeatmap computes monthHeaders for the continuous columns'
    );
    assert.ok(
      fileContent.includes('Mon') && fileContent.includes('Wed') && fileContent.includes('Fri'),
      'ActivityHeatmap includes Mon, Wed, Fri weekday labels on the left'
    );
    assert.ok(
      fileContent.includes('day streak'),
      'ActivityHeatmap displays day streak in footer matching Image 1'
    );
    assert.ok(
      fileContent.includes('cellTodayActive'),
      'ActivityHeatmap highlights active target day with distinct glowing neon border'
    );
    assert.ok(
      fileContent.includes('ScrollView') && fileContent.includes('horizontal'),
      'ActivityHeatmap uses continuous horizontal scroll for 53-week stretch'
    );

    pass('Test 2: ActivityHeatmap implements GitHub 1-year continuous contribution matrix');
  } catch (e) {
    fail('Test 2: ActivityHeatmap Verification', e);
  }

  // -------------------------------------------------------------
  // Test 3: Fiery Dual-Ring Elemental Visual Component Check
  // -------------------------------------------------------------
  try {
    const dualRingFile = fs.readFileSync(
      path.resolve('src/components/profile/FieryDualRing.js'),
      'utf8'
    );

    // Verify dual elemental arcs (Left Emerald + Right Solar Flame)
    assert.ok(
      dualRingFile.includes('#39FF14') && dualRingFile.includes('#00E5FF'),
      'FieryDualRing includes crystalline neon green & cyan emerald arc on left'
    );
    assert.ok(
      dualRingFile.includes('#FF8A00') && dualRingFile.includes('#FF3D00'),
      'FieryDualRing includes blazing orange & fiery red flame arc on right'
    );
    assert.ok(
      dualRingFile.includes('topNotch') && dualRingFile.includes('bottomNotch'),
      'FieryDualRing includes 12 o\'clock and 6 o\'clock notch accent gaps matching Image 3'
    );
    assert.ok(
      dualRingFile.includes('centerCavity'),
      'FieryDualRing includes dark center cavity for stats'
    );

    // Verify integration in StreakSummaryCard
    const streakCardFile = fs.readFileSync(
      path.resolve('src/components/profile/StreakSummaryCard.js'),
      'utf8'
    );
    assert.ok(
      streakCardFile.includes('FieryDualRing'),
      'StreakSummaryCard imports and renders FieryDualRing'
    );

    pass('Test 3: FieryDualRing component matches Image 3 and is integrated into StreakSummaryCard');
  } catch (e) {
    fail('Test 3: Fiery Dual-Ring Verification', e);
  }

  // -------------------------------------------------------------
  // Test 4: Player Insights Dashboard Component Check (Image 2)
  // -------------------------------------------------------------
  try {
    const reportFile = fs.readFileSync(
      path.resolve('src/components/profile/MonthlyGamingReport.js'),
      'utf8'
    );

    // Header & Section Title
    assert.ok(
      reportFile.includes('PLAYER INSIGHTS'),
      'MonthlyGamingReport features PLAYER INSIGHTS title matching Image 2'
    );

    // Top 4 Stat Cards
    assert.ok(
      reportFile.includes('TOTAL GAMES PLAYED'),
      'Top card 1: TOTAL GAMES PLAYED with trend badge'
    );
    assert.ok(
      reportFile.includes('AVG. WIN RATE'),
      'Top card 2: AVG. WIN RATE with progress mini-track'
    );
    assert.ok(
      reportFile.includes('ECONOMY YIELD'),
      'Top card 3: ECONOMY YIELD with XP & Coin collection'
    );
    assert.ok(
      reportFile.includes('COMPETITIVE STANDING') && reportFile.includes('MMR'),
      'Top card 4: COMPETITIVE STANDING with MMR Points and Tier badge'
    );

    // Hero Dual-Ring Banner
    assert.ok(
      reportFile.includes('dualRingHeroBanner') && reportFile.includes('FieryDualRing'),
      'Features Fiery Dual-Ring Hero MMR Card integrating Image 3'
    );

    // Win Rate Over Time Line Chart
    assert.ok(
      reportFile.includes('WIN RATE OVER TIME'),
      'Features WIN RATE OVER TIME curve chart matching Image 2'
    );
    assert.ok(
      reportFile.includes('lineNodeDot') && reportFile.includes('100%'),
      'Features 6-level Y-axis and glowing interactive line chart nodes'
    );

    // Skill Distribution Circular Gauges (Image 2)
    assert.ok(
      reportFile.includes('SKILL DISTRIBUTION'),
      'Features SKILL DISTRIBUTION section matching Image 2'
    );
    assert.ok(
      reportFile.includes('STRATEGY') &&
      reportFile.includes('REFLEXES') &&
      reportFile.includes('ACCURACY'),
      'Features Strategy, Reflexes, and Accuracy skill categories matching Image 2'
    );

    // Recent Match Performance Table (Image 2)
    assert.ok(
      reportFile.includes('RECENT MATCH PERFORMANCE'),
      'Features RECENT MATCH PERFORMANCE table matching Image 2'
    );
    assert.ok(
      reportFile.includes('outcomePillWin') && reportFile.includes('outcomePillLoss'),
      'Features WIN (green) and LOSS (red) outcome badges in match table'
    );

    // Recent Achievements Cards (Image 2)
    assert.ok(
      reportFile.includes('RECENT ACHIEVEMENTS'),
      'Features RECENT ACHIEVEMENTS section matching Image 2'
    );
    assert.ok(
      reportFile.includes('Apex Predator') &&
      reportFile.includes('MVP Champion') &&
      reportFile.includes('Sniper Elite'),
      'Includes Apex Predator, MVP Champion, and Sniper Elite accolade cards matching Image 2'
    );

    // Full CSV Export & Dual Bar Chart preserved
    assert.ok(
      reportFile.includes('EXPORT CSV') && reportFile.includes('handleExportCsv'),
      'Preserves verified CSV export functionality'
    );
    assert.ok(
      reportFile.includes('DAILY GAMING ACTIVITY'),
      'Preserves daily activity dual-bar chart'
    );

    pass('Test 4: MonthlyGamingReport accurately implements Player Insights Modern UI matching Image 2');
  } catch (e) {
    fail('Test 4: Player Insights Dashboard Verification', e);
  }

  // -------------------------------------------------------------
  // Test 5: ProfileScreen Wiring
  // -------------------------------------------------------------
  try {
    const profileFile = fs.readFileSync(
      path.resolve('src/screens/ProfileScreen.js'),
      'utf8'
    );

    assert.ok(
      profileFile.includes('ActivityHeatmap') && profileFile.includes('streakInfo={streakInfo}'),
      'ProfileScreen wires streakInfo into ActivityHeatmap'
    );
    assert.ok(
      profileFile.includes('MonthlyGamingReport') &&
      profileFile.includes('userCoins={user?.coins}') &&
      profileFile.includes('userXp={user?.xp}'),
      'ProfileScreen wires userCoins and userXp into MonthlyGamingReport'
    );

    pass('Test 5: ProfileScreen properly connects and wires props to updated components');
  } catch (e) {
    fail('Test 5: ProfileScreen Wiring', e);
  }

  // Summary
  console.log('\n================================================================');
  console.log(`TOTAL: ${passedTests + failedTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

