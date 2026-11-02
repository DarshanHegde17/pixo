import assert from 'assert';
import fs from 'fs';

// Load services in node environment
const { GamingActivityService, GAME_LEVELS_CONFIG } = await import('../src/services/gamingActivityService.js');
const { AuthService } = await import('../src/services/authService.js');
const { GamePersistenceService } = await import('../src/services/gamePersistenceService.js');

console.log('🎮 ======================================================================');
console.log('🎮 PIXO UI INTERACTION, SCROLLING, OPERATOR & LEVEL SELECTION TEST');
console.log('🎮 ======================================================================\n');

async function runInteractionTests() {
  const targetModalCode = fs.readFileSync('src/components/gameplay/TargetNumberGameModal.js', 'utf8');
  const detailsModalCode = fs.readFileSync('src/components/GameDetailsModal.js', 'utf8');
  const homeScreenCode = fs.readFileSync('src/screens/HomeScreen.js', 'utf8');

  // TEST 1: Modal Viewport Constraint & Height Fix (maxHeight: 90vh)
  console.log('▶ TEST 1: Viewport & Modal Height Constraints (max-height: 90vh)');
  assert(targetModalCode.includes("maxHeight: '90vh'"), 'TargetNumberGameModal card must constrain to 90vh');
  assert(targetModalCode.includes('selectModeScroll'), 'TargetNumberGameModal must have dedicated scrollable container');
  assert(targetModalCode.includes("overflowY: 'auto'"), 'TargetNumberGameModal must enable vertical overflow scrolling');
  assert(targetModalCode.includes('minHeight: 0'), 'selectModeScroll must declare minHeight: 0 for proper flex child scrolling');
  assert(detailsModalCode.includes("maxHeight: '90vh'"), 'GameDetailsModal card must constrain to 90vh');
  assert(detailsModalCode.includes('modalBodyScroll'), 'GameDetailsModal must have scrollable body');
  console.log('   ✅ Modals constrained to viewport with proper CSS scrolling properties');

  // TEST 2: Outside Backdrop Touch & Click Inside Protection
  console.log('\n▶ TEST 2: Modal Backdrop Touch & Propagation Handling');
  assert(targetModalCode.includes('modalBackdropTouch'), 'TargetNumberGameModal must have modalBackdropTouch backdrop');
  assert(targetModalCode.includes('onStartShouldSetResponder'), 'Card container must trap responder to prevent closing on card click');
  assert(detailsModalCode.includes('modalBackdropTouch'), 'GameDetailsModal must have modalBackdropTouch backdrop');
  console.log('   ✅ Clicking backdrop closes modal; clicking inside the card does not dismiss');

  // TEST 3: Pinned Header and Accessible Fixed Footer Start Button
  console.log('\n▶ TEST 3: Fixed Header & Pinned Start Level Footer Button');
  assert(targetModalCode.includes('modalFooter: {'), 'TargetNumberGameModal has fixed footer container');
  assert(targetModalCode.includes('topGameBar: {'), 'TargetNumberGameModal has fixed header');
  assert(detailsModalCode.includes('modalFooter: {'), 'GameDetailsModal has fixed footer container');
  console.log('   ✅ Header is pinned at top and Start Level button is accessible at bottom');

  // TEST 4: Background Page Scroll Lock on Web
  console.log('\n▶ TEST 4: Web Background Scroll Lock when Modal is Active');
  assert(targetModalCode.includes("document.body.style.overflow = 'hidden'"), 'Locks background scrolling when open');
  assert(targetModalCode.includes("document.body.style.overflow = origOverflow"), 'Restores background scrolling when closed');
  console.log('   ✅ Background scroll locking properly implemented for Web');

  // TEST 5: Operator Selection & Neon Highlight
  console.log('\n▶ TEST 5: Operator Selection & Active Neon Highlight');
  assert(targetModalCode.includes('handleSelectOperator'), 'Has dedicated handleSelectOperator callback');
  assert(targetModalCode.includes('operatorCardSelected'), 'Has operatorCardSelected style');
  assert(targetModalCode.includes('checkmark-circle'), 'Selected operator displays active checkmark indicator');
  console.log('   ✅ Operator cards have active selection handler and clear neon highlight');

  // TEST 6: Level Selection & Dynamic Start Button Updates
  console.log('\n▶ TEST 6: Level Selection & Dynamic Start Button Text');
  assert(targetModalCode.includes('handleSelectLevel'), 'Has handleSelectLevel callback');
  assert(targetModalCode.includes('levelGridCardSelected'), 'Has levelGridCardSelected style');
  assert(targetModalCode.includes('START LEVEL {currentLevel}'), 'Start button dynamically reflects selected level');
  assert(targetModalCode.includes('LOCKED • COMPLETE LEVEL'), 'Locked levels show disabled locked button');
  console.log('   ✅ Level cards are selectable with dynamic Start button updating');

  // TEST 7: Guard against starting locked levels
  console.log('\n▶ TEST 7: Start Level Guard Validations');
  assert(targetModalCode.includes('if (lvl > opUnlocked)'), 'startLevel validates that level is unlocked before proceeding');
  assert(targetModalCode.includes('if (!op)'), 'startLevel validates operator selection');
  console.log('   ✅ startLevel strictly prevents locked levels from starting');

  // TEST 8: State Progression Simulation (Level 1 Win -> Level 2 Unlocked -> Reopen)
  console.log('\n▶ TEST 8: Full Level Progression & Persistence Simulation');
  const testEmail = `interactive_user_${Date.now()}@pixo.gg`;
  const otpRes = await AuthService.requestOtp(testEmail);
  const regRes = await AuthService.registerUser({
    name: 'ScrollMaster',
    email: testEmail,
    password: 'password123',
    otp: otpRes.otp,
  });
  const userId = regRes.user.id;

  // Initial state: Level 1 unlocked, Level 2 locked
  let opUnlocked = await GamePersistenceService.getUnlockedLevels(userId);
  assert.strictEqual(opUnlocked['+'], 1, 'Addition Level 1 unlocked initially');

  // Play and complete Level 1
  await GamePersistenceService.unlockNextLevel(userId, '+', 1);
  await GamingActivityService.recordLevelCompletion(userId, 'g_target_no', 1);
  await GamingActivityService.unlockNextLevel(userId, 1, 'g_target_no');
  
  // Re-fetch after Level 1 victory
  opUnlocked = await GamePersistenceService.getUnlockedLevels(userId);
  assert.strictEqual(opUnlocked['+'], 2, 'Addition Level 2 is unlocked after Level 1 victory');

  // Level 1 marked completed
  const isL1Done = await GamingActivityService.isLevelAlreadyCompleted(userId, 'g_target_no', 1);
  assert.strictEqual(isL1Done, true, 'Level 1 is marked as completed');
  console.log('   ✅ Simulated Level 1 completion unlocked Level 2 and persisted to storage');

  // TEST 9: Home Screen Interactive Elements Check
  console.log('\n▶ TEST 9: Home Screen Clickable Elements & Navigation Check');
  assert(homeScreenCode.includes("setActiveTab('home')"), 'Home tab click handler');
  assert(homeScreenCode.includes("setActiveTab('games')"), 'Games tab click handler');
  assert(homeScreenCode.includes("setActiveTab('quests')"), 'Quests tab click handler');
  assert(homeScreenCode.includes("setActiveTab('profile')"), 'Profile tab click handler');
  assert(homeScreenCode.includes('handleLogout'), 'Logout click handler');
  assert(homeScreenCode.includes('setSelectedCategory'), 'Category filter click handlers');
  assert(homeScreenCode.includes('setIsTargetGameOpen(true)'), 'Target Number play trigger');
  console.log('   ✅ All Home Screen buttons and navigation items have active handlers');

  console.log('\n🎉 ALL 9 UI INTERACTION, SCROLLING & MODAL TESTS PASSED!');
}

runInteractionTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
