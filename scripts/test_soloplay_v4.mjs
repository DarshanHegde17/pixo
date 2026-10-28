/**
 * SOLOPLAY V4 — Automated Verification Suite (ES Module)
 * Tests strict completion-only daily streaks, session tracking,
 * secure image upload validations, monthly reports, and CSV sanitization.
 */

import {
  toDateKey,
  getOffsetDateKey,
  formatDuration,
  sanitizeCsvField,
  GamingActivityService,
} from '../src/services/gamingActivityService.js';

import {
  validateImageContent,
  getSafeStorageKey,
} from '../src/services/imageUploadService.js';

import {
  ChatService,
  sanitizeChatText,
  formatChatTime,
} from '../src/services/chatService.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passedTests++;
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('=====================================================');
console.log('🎮 SOLOPLAY V4 COMPREHENSIVE BUSINESS LOGIC VERIFICATION');
console.log('=====================================================\n');

// -------------------------------------------------------------------
// TEST SUITE 1: STRICT COMPLETION-ONLY DAILY STREAK RULES
// -------------------------------------------------------------------
console.log('--- TEST SUITE 1: Strict Daily Streak Rules ---');

const tz = 'UTC';
const now = new Date();
const todayKey = toDateKey(now, tz);
const yesterdayKey = getOffsetDateKey(-1, now, tz);
const dayMinus2Key = getOffsetDateKey(-2, now, tz);
const dayMinus3Key = getOffsetDateKey(-3, now, tz);

// Scenario 1: Uncompleted sessions (launched, in_progress, failed, abandoned) MUST NOT qualify
const uncompletedSessions = [
  {
    id: 's1',
    status: 'in_progress',
    startedAt: '2026-10-10T10:00:00Z',
    completedAt: null,
  },
  {
    id: 's2',
    status: 'failed',
    startedAt: '2026-10-10T10:15:00Z',
    endedAt: '2026-10-10T10:30:00Z',
    completedAt: null,
  },
  {
    id: 's3',
    status: 'abandoned',
    startedAt: '2026-10-10T11:00:00Z',
    endedAt: '2026-10-10T11:05:00Z',
    completedAt: null,
  },
];

const streakResult1 = GamingActivityService.calculateStreakFromCompletions(
  uncompletedSessions,
  tz,
  0
);
assert(
  streakResult1.currentStreak === 0,
  'Launched, in-progress, failed, and abandoned sessions yield 0 streak'
);
assert(
  streakResult1.qualifyingDates.size === 0,
  'Uncompleted sessions do NOT turn any calendar dates green'
);

// Scenario 2: Successful completion today yields 1-day streak
const completedTodaySession = [
  {
    id: 's_win_1',
    status: 'completed',
    startedAt: `${todayKey}T10:30:00Z`,
    completedAt: `${todayKey}T10:30:00Z`,
    score: 18000,
    xpAwarded: 300,
  },
];

const streakResult2 = GamingActivityService.calculateStreakFromCompletions(
  completedTodaySession,
  tz,
  0
);
assert(
  streakResult2.currentStreak === 1,
  'Single verified completion today gives currentStreak = 1'
);
assert(
  streakResult2.qualifyingDates.has(todayKey),
  'Today is a verified qualifying green date'
);

// Scenario 3: Multiple completions on the SAME day count as ONE qualifying date
const multiCompletionsSameDay = [
  {
    id: 's_win_1',
    status: 'completed',
    completedAt: `${todayKey}T10:30:00Z`,
  },
  {
    id: 's_win_2',
    status: 'completed',
    completedAt: `${todayKey}T14:15:00Z`,
  },
  {
    id: 's_win_3',
    status: 'completed',
    completedAt: `${todayKey}T18:00:00Z`,
  },
];

const streakResult3 = GamingActivityService.calculateStreakFromCompletions(
  multiCompletionsSameDay,
  tz,
  0
);
assert(
  streakResult3.currentStreak === 1,
  'Multiple completions on same day count as 1 qualifying date'
);
assert(
  streakResult3.qualifyingDates.size === 1,
  'Calendar records exactly 1 active day for today'
);
assert(
  streakResult3.completionCountsByDate[todayKey] === 3,
  'Heatmap correctly reflects 3 completions intensity for today'
);

// Scenario 4: Consecutive days (today, yesterday, day -2, day -3)
const consecutiveCompletions = [
  { id: 'c0', status: 'completed', completedAt: `${todayKey}T12:00:00Z` },
  { id: 'c1', status: 'completed', completedAt: `${yesterdayKey}T12:00:00Z` },
  { id: 'c2', status: 'completed', completedAt: `${dayMinus2Key}T12:00:00Z` },
  { id: 'c3', status: 'completed', completedAt: `${dayMinus3Key}T12:00:00Z` },
];

const streakResult4 = GamingActivityService.calculateStreakFromCompletions(
  consecutiveCompletions,
  tz,
  0
);
assert(
  streakResult4.currentStreak === 4,
  'Four consecutive qualifying days yield currentStreak = 4'
);
assert(
  streakResult4.nextMilestone === 7,
  'Next milestone after 4 days is 7 days'
);
assert(
  streakResult4.progressPercent === Math.round((4 / 7) * 100),
  `Progress to milestone is ${Math.round((4 / 7) * 100)}%`
);

// Scenario 5: User completed yesterday, but NOT today -> Streak remains active during today
const completedYesterdayOnly = [
  { id: 'c1', status: 'completed', completedAt: `${yesterdayKey}T12:00:00Z` },
  { id: 'c2', status: 'completed', completedAt: `${dayMinus2Key}T12:00:00Z` },
];

const streakResult5 = GamingActivityService.calculateStreakFromCompletions(
  completedYesterdayOnly,
  tz,
  0
);
assert(
  streakResult5.currentStreak === 2,
  'Completed yesterday but not yet today maintains active streak (2 days)'
);

// Scenario 6: Full calendar day skipped (completed day -2, but neither yesterday nor today) -> Streak resets to 0
const skippedYesterday = [
  { id: 'c2', status: 'completed', completedAt: `${dayMinus2Key}T12:00:00Z` },
  { id: 'c3', status: 'completed', completedAt: `${dayMinus3Key}T12:00:00Z` },
];

const streakResult6 = GamingActivityService.calculateStreakFromCompletions(
  skippedYesterday,
  tz,
  10 // Historical longest was 10
);
assert(
  streakResult6.currentStreak === 0,
  'Missing full calendar day resets currentStreak to 0'
);
assert(
  streakResult6.longestStreak === 10,
  'Historical longest streak (10) is preserved and NEVER decreases'
);

// -------------------------------------------------------------------
// TEST SUITE 2: IMAGE UPLOAD SECURITY & SIGNATURE VALIDATION
// -------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: Image Upload Security ---');

// Valid JPEG base64 (begins with /9j/)
const validJpegDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const jpegValidation = validateImageContent(validJpegDataUrl, 'image/jpeg');
assert(jpegValidation.isValid === true, 'Valid JPEG base64 passes validation');
assert(jpegValidation.extension === 'jpg', 'Extension correctly detected as jpg');

// Valid PNG base64 (begins with iVBORw0KGgo)
const validPngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngValidation = validateImageContent(validPngDataUrl, 'image/png');
assert(pngValidation.isValid === true, 'Valid PNG base64 passes validation');
assert(pngValidation.extension === 'png', 'Extension correctly detected as png');

// Valid WebP base64 (begins with UklGR)
const validWebpDataUrl = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
const webpValidation = validateImageContent(validWebpDataUrl, 'image/webp');
assert(webpValidation.isValid === true, 'Valid WebP base64 passes validation');
assert(webpValidation.extension === 'webp', 'Extension correctly detected as webp');

// Invalid format / Spoofed executable masquerading as PNG
const fakeExecutablePng = 'data:image/png;base64,TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAAaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const fakePngValidation = validateImageContent(fakeExecutablePng, 'image/png');
assert(fakePngValidation.isValid === false, 'Spoofed executable header masquerading as PNG is REJECTED');

// HTML / Script masquerading as image
const fakeHtmlImage = 'data:image/jpeg;base64,PGh0bWw+PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0PjwvaHRtbD4=';
const htmlValidation = validateImageContent(fakeHtmlImage, 'image/jpeg');
assert(htmlValidation.isValid === false, 'HTML/Script injection attempt is REJECTED');

// Sanitized safe storage keys
const safeKey = getSafeStorageKey('usr_demo_1');
assert(safeKey === '@soloplay_avatar_usr_demo_1', 'Safe storage key correctly scoped to user ID');

const unsafeKey = getSafeStorageKey('../../etc/passwd/hack');
assert(!unsafeKey.includes('..') && !unsafeKey.includes('/'), 'Unsafe path traversal characters stripped from storage key');

// -------------------------------------------------------------------
// TEST SUITE 3: CSV EXPORT FORMULA INJECTION SANITIZATION
// -------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: CSV Formula Injection Prevention ---');

assert(sanitizeCsvField('=1+2') === `"'=1+2"`, 'Formula injection with = is neutralized with apostrophe');
assert(sanitizeCsvField('+SUM(A1:A10)') === `"'+SUM(A1:A10)"`, 'Formula injection with + is neutralized');
assert(sanitizeCsvField('-5+10') === `"'-5+10"`, 'Formula injection with - is neutralized');
assert(sanitizeCsvField('@import') === `"'@import"`, 'Formula injection with @ is neutralized');
assert(sanitizeCsvField('Neon Runner: 2099') === `"Neon Runner: 2099"`, 'Standard safe string wrapped in quotes');

// -------------------------------------------------------------------
// TEST SUITE 4: DURATION FORMATTING
// -------------------------------------------------------------------
console.log('\n--- TEST SUITE 4: Duration Formatting ---');

assert(formatDuration(45) === '45s', '45 seconds formatted as 45s');
assert(formatDuration(150) === '2m 30s', '150 seconds formatted as 2m 30s');
assert(formatDuration(3665) === '1h 1m', '3665 seconds formatted as 1h 1m');
assert(formatDuration(7200) === '2h 0m', '7200 seconds formatted as 2h 0m');

// -------------------------------------------------------------------
// TEST SUITE 5: SMART DUAL CHAT SECURITY & TACTICAL CO-PILOT
// -------------------------------------------------------------------
console.log('\n--- TEST SUITE 5: Smart Dual Chat UI & Security ---');

// Chat input sanitization
const maliciousChatInput = '<script>alert("hacked")</script>Hello World!';
const cleanChatInput = sanitizeChatText(maliciousChatInput);
assert(!cleanChatInput.includes('<script>') && cleanChatInput.includes('Hello World!'), 'Malicious HTML script tags stripped from chat input');

const longChatInput = 'A'.repeat(600);
assert(sanitizeChatText(longChatInput).length === 500, 'Chat input capped at maximum safe 500 characters');

assert(sanitizeChatText(null) === '', 'Null chat input handled safely as empty string');

// Timestamp formatting
const formattedTime = formatChatTime(new Date('2026-10-10T14:30:00Z'));
assert(typeof formattedTime === 'string' && (formattedTime.includes('AM') || formattedTime.includes('PM')), 'Chat timestamp formatted with AM/PM');

// Co-Pilot context-aware intelligent tactical response matching
const neonTip = ChatService.generateCoPilotResponse('Tips for Neon Runner 2099', { name: 'SoloSlayer', level: 42 });
assert(neonTip.includes('Neon Runner 2099') && neonTip.includes('combo'), 'Co-Pilot gives accurate game combos for Neon Runner');

const bladeTip = ChatService.generateCoPilotResponse('How to beat Shadow Blade boss?', { name: 'SoloSlayer', level: 42 });
assert(bladeTip.includes('Shadow Blade') && bladeTip.includes('parry'), 'Co-Pilot gives tactical parry tips for Shadow Blade');

const streakTip = ChatService.generateCoPilotResponse('How does my daily streak work?', { name: 'SoloSlayer', level: 42 });
assert(streakTip.includes('verified') && streakTip.includes('Streak Rule'), 'Co-Pilot reinforces strict verified completion streak rules');

const xpTip = ChatService.generateCoPilotResponse('How do I rank up my XP?', { name: 'SoloSlayer', level: 42 });
assert(xpTip.includes('Level 42') && xpTip.includes('Season Pass'), 'Co-Pilot includes real authenticated player level in XP guidance');

// Rate limiting debounce
const rateLimitedUser = 'test_usr_rate_limit';
const isFirstSendLimited = ChatService.isRateLimited(rateLimitedUser);
assert(isFirstSendLimited === false, 'First transmission permitted through rate limiter');

const isImmediateSendLimited = ChatService.isRateLimited(rateLimitedUser);
assert(isImmediateSendLimited === true, 'Rapid duplicate transmission debounced by rate limiter');

console.log('\n=====================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('=====================================================');
