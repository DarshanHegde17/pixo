/**
 * PIXO BRAIN BLITZ — Procedural Game Engine & Challenge Generator
 * 
 * Provides generators, rules, and validation logic for all 3 modes:
 * - Mode 1: Memory Match (Card pair generator, layout configurations, shuffling)
 * - Mode 2: Sequence Recall (Simon sequence generator, symbols, speed scales)
 * - Mode 3: Pattern Recall (Grid matrix geometry, unique coordinate generator)
 */

// 24 Curated Cyberpunk Symbols for Memory Match
export const MEMORY_MATCH_SYMBOLS = [
  { id: 'sym_shield', name: 'Firewall Shield', icon: 'shield-checkmark', color: '#39FF14' },
  { id: 'sym_flash', name: 'Plasma Arc', icon: 'flash', color: '#00E5FF' },
  { id: 'sym_planet', name: 'Cyber Orbit', icon: 'planet', color: '#A855F7' },
  { id: 'sym_rocket', name: 'Warp Drive', icon: 'rocket', color: '#FF6A00' },
  { id: 'sym_crystal', name: 'Data Crystal', icon: 'diamond', color: '#FFD700' },
  { id: 'sym_skull', name: 'Glitch Core', icon: 'skull', color: '#FF3B30' },
  { id: 'sym_flame', name: 'Hyper Burn', icon: 'flame', color: '#FB923C' },
  { id: 'sym_chip', name: 'Neural Chip', icon: 'hardware-chip', color: '#10B981' },
  { id: 'sym_cube', name: 'Tesseract', icon: 'cube', color: '#EC4899' },
  { id: 'sym_nuclear', name: 'Fusion Cell', icon: 'nuclear', color: '#84CC16' },
  { id: 'sym_key', name: 'Cipher Key', icon: 'key', color: '#FBBF24' },
  { id: 'sym_eye', name: 'Cyber Optic', icon: 'eye', color: '#6366F1' },
  { id: 'sym_finger', name: 'Biometrics', icon: 'finger-print', color: '#E879F9' },
  { id: 'sym_pulse', name: 'Heartbeat', icon: 'pulse', color: '#F43F5E' },
  { id: 'sym_wifi', name: 'Quantum Link', icon: 'wifi', color: '#38BDF8' },
  { id: 'sym_battery', name: 'Overcharge', icon: 'battery-charging', color: '#22C55E' },
  { id: 'sym_infinite', name: 'Loop Node', icon: 'infinite', color: '#F97316' },
  { id: 'sym_compass', name: 'Nav Array', icon: 'compass', color: '#14B8A6' },
  { id: 'sym_aperture', name: 'Matrix Cam', icon: 'aperture', color: '#8B5CF6' },
  { id: 'sym_magnet', name: 'Mag Field', icon: 'magnet', color: '#FB7185' },
  { id: 'sym_lock', name: 'Decryption', icon: 'lock-open', color: '#FACC15' },
  { id: 'sym_game', name: 'Arcade Bit', icon: 'game-controller', color: '#34D399' },
  { id: 'sym_disc', name: 'Holo Disc', icon: 'disc', color: '#06B6D4' },
  { id: 'sym_radio', name: 'Sat Radar', icon: 'radio', color: '#60A5FA' },
];

// Memory Match Level Configurations (Levels 1–10)
export const MEMORY_MATCH_LEVELS = {
  1: { pairs: 3, totalCards: 6, timeLimit: 45, columns: 3 },
  2: { pairs: 4, totalCards: 8, timeLimit: 50, columns: 4 },
  3: { pairs: 6, totalCards: 12, timeLimit: 60, columns: 4 },
  4: { pairs: 8, totalCards: 16, timeLimit: 75, columns: 4 },
  5: { pairs: 10, totalCards: 20, timeLimit: 90, columns: 5 },
  6: { pairs: 12, totalCards: 24, timeLimit: 110, columns: 6 },
  7: { pairs: 15, totalCards: 30, timeLimit: 130, columns: 6 },
  8: { pairs: 18, totalCards: 36, timeLimit: 150, columns: 6 },
  9: { pairs: 20, totalCards: 40, timeLimit: 170, columns: 8 },
  10: { pairs: 24, totalCards: 48, timeLimit: 190, columns: 8 },
};

// 8 Glowing Cyber Symbols for Sequence Recall (Prompt Section 6)
export const SEQUENCE_RECALL_SYMBOLS = [
  { id: 'circle', name: 'Circle', icon: 'ellipse', color: '#39FF14', bgGradient: ['#0B2B11', '#06170A'] },
  { id: 'triangle', name: 'Triangle', icon: 'triangle', color: '#00E5FF', bgGradient: ['#07202B', '#041017'] },
  { id: 'square', name: 'Square', icon: 'square', color: '#FFD700', bgGradient: ['#2B2407', '#171404'] },
  { id: 'star', name: 'Star', icon: 'star', color: '#FF6A00', bgGradient: ['#2B1407', '#170B04'] },
  { id: 'diamond', name: 'Diamond', icon: 'diamond', color: '#D946EF', bgGradient: ['#28072B', '#160417'] },
  { id: 'lightning', name: 'Lightning', icon: 'flash', color: '#00FFA3', bgGradient: ['#072B1E', '#041710'] },
  { id: 'moon', name: 'Moon', icon: 'moon', color: '#818CF8', bgGradient: ['#12102B', '#090817'] },
  { id: 'heart', name: 'Heart', icon: 'heart', color: '#FF3B30', bgGradient: ['#2B0808', '#170404'] },
];

// Sequence Recall Level Configurations (Levels 1–10, 3 to 12 symbols)
export const SEQUENCE_RECALL_LEVELS = {
  1: { length: 3, stepDurationMs: 550, pauseMs: 200, timeLimit: 45 },
  2: { length: 4, stepDurationMs: 520, pauseMs: 190, timeLimit: 50 },
  3: { length: 5, stepDurationMs: 480, pauseMs: 180, timeLimit: 55 },
  4: { length: 6, stepDurationMs: 450, pauseMs: 170, timeLimit: 60 },
  5: { length: 7, stepDurationMs: 420, pauseMs: 160, timeLimit: 65 },
  6: { length: 8, stepDurationMs: 400, pauseMs: 150, timeLimit: 70 },
  7: { length: 9, stepDurationMs: 380, pauseMs: 140, timeLimit: 75 },
  8: { length: 10, stepDurationMs: 360, pauseMs: 130, timeLimit: 80 },
  9: { length: 11, stepDurationMs: 340, pauseMs: 120, timeLimit: 85 },
  10: { length: 12, stepDurationMs: 320, pauseMs: 110, timeLimit: 90 },
};

// Pattern Recall Level Configurations (Prompt Section 7)
export const PATTERN_RECALL_LEVELS = {
  1: { gridSize: 3, totalCells: 9, highlightedCount: 3, displayDurationSeconds: 3.0, timeLimit: 45 },
  2: { gridSize: 3, totalCells: 9, highlightedCount: 4, displayDurationSeconds: 3.0, timeLimit: 45 },
  3: { gridSize: 4, totalCells: 16, highlightedCount: 5, displayDurationSeconds: 3.5, timeLimit: 50 },
  4: { gridSize: 4, totalCells: 16, highlightedCount: 7, displayDurationSeconds: 3.5, timeLimit: 50 },
  5: { gridSize: 5, totalCells: 25, highlightedCount: 8, displayDurationSeconds: 4.0, timeLimit: 55 },
  6: { gridSize: 5, totalCells: 25, highlightedCount: 10, displayDurationSeconds: 4.0, timeLimit: 55 },
  7: { gridSize: 5, totalCells: 25, highlightedCount: 12, displayDurationSeconds: 4.5, timeLimit: 60 },
  8: { gridSize: 6, totalCells: 36, highlightedCount: 14, displayDurationSeconds: 5.0, timeLimit: 65 },
  9: { gridSize: 6, totalCells: 36, highlightedCount: 17, displayDurationSeconds: 5.0, timeLimit: 70 },
  10: { gridSize: 6, totalCells: 36, highlightedCount: 20, displayDurationSeconds: 5.5, timeLimit: 75 },
};

export const BrainBlitzGameService = {
  /**
   * Generates a shuffled deck of card pairs for Memory Match Level N.
   */
  generateMemoryMatchDeck(level = 1) {
    const lvlConfig = MEMORY_MATCH_LEVELS[level] || MEMORY_MATCH_LEVELS[1];
    const { pairs } = lvlConfig;

    // Shuffle symbol pool and pick required number of pairs
    const shuffledSymbols = [...MEMORY_MATCH_SYMBOLS].sort(() => Math.random() - 0.5);
    const selectedSymbols = shuffledSymbols.slice(0, pairs);

    // Create 2 cards per selected symbol
    const cards = [];
    selectedSymbols.forEach((sym, pairIdx) => {
      // First card of pair
      cards.push({
        uid: `card_${pairIdx}_a_${Math.random().toString(36).substring(2, 6)}`,
        pairId: sym.id,
        name: sym.name,
        icon: sym.icon,
        color: sym.color,
      });
      // Second card of pair
      cards.push({
        uid: `card_${pairIdx}_b_${Math.random().toString(36).substring(2, 6)}`,
        pairId: sym.id,
        name: sym.name,
        icon: sym.icon,
        color: sym.color,
      });
    });

    // Shuffle the combined cards thoroughly (Fisher-Yates)
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return {
      level,
      pairsCount: pairs,
      totalCards: cards.length,
      timeLimit: lvlConfig.timeLimit,
      columns: lvlConfig.columns,
      cards,
    };
  },

  /**
   * Generates a random sequence of symbol indices for Sequence Recall Level N.
   */
  generateSequence(level = 1) {
    const lvlConfig = SEQUENCE_RECALL_LEVELS[level] || SEQUENCE_RECALL_LEVELS[1];
    const { length } = lvlConfig;

    const sequence = [];
    let lastIndex = -1;

    for (let i = 0; i < length; i++) {
      // Pick a random symbol (avoid repeating the exact same symbol 3 times consecutively)
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * SEQUENCE_RECALL_SYMBOLS.length);
      } while (i > 1 && nextIndex === lastIndex && nextIndex === sequence[i - 2]);

      sequence.push(nextIndex);
      lastIndex = nextIndex;
    }

    return {
      level,
      sequenceLength: length,
      stepDurationMs: lvlConfig.stepDurationMs,
      pauseMs: lvlConfig.pauseMs,
      timeLimit: lvlConfig.timeLimit,
      sequence,
    };
  },

  /**
   * Generates a random pattern of highlighted cell indices for Pattern Recall Level N.
   */
  generatePattern(level = 1) {
    const lvlConfig = PATTERN_RECALL_LEVELS[level] || PATTERN_RECALL_LEVELS[1];
    const { gridSize, totalCells, highlightedCount, displayDurationSeconds } = lvlConfig;

    // Pick 'highlightedCount' unique cell indices from 0 to totalCells - 1
    const allIndices = Array.from({ length: totalCells }, (_, i) => i);
    for (let i = allIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
    }

    const patternIndices = allIndices.slice(0, highlightedCount).sort((a, b) => a - b);
    const patternSet = new Set(patternIndices);

    return {
      level,
      gridSize,
      totalCells,
      highlightedCount,
      displayDurationSeconds,
      timeLimit: lvlConfig.timeLimit,
      patternIndices,
      patternSet,
    };
  },

  /**
   * Validates player selected cells against target pattern in Pattern Recall.
   */
  evaluatePatternSubmission(patternIndices, playerSelectedIndices) {
    const targetSet = new Set(patternIndices);
    const selectedSet = new Set(playerSelectedIndices);

    const correctSelections = playerSelectedIndices.filter((idx) => targetSet.has(idx));
    const incorrectSelections = playerSelectedIndices.filter((idx) => !targetSet.has(idx));
    const missedCells = patternIndices.filter((idx) => !selectedSet.has(idx));

    const isPerfect =
      correctSelections.length === patternIndices.length &&
      incorrectSelections.length === 0;

    return {
      isPerfect,
      correctCount: correctSelections.length,
      targetCount: patternIndices.length,
      incorrectCount: incorrectSelections.length,
      missedCount: missedCells.length,
      correctSelections,
      incorrectSelections,
      missedCells,
    };
  },
};

export default BrainBlitzGameService;

