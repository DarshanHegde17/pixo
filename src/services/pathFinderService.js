/**
 * PIXO PATH FINDER - Core Game Logic & Puzzle Service
 *
 * Rules:
 * - Orthogonal movement only (no diagonals).
 * - No revisiting tiles (no self-intersections/loops).
 * - Cannot cross blocked tiles.
 * - Cannot step on hazard/trap tiles (Trap Escape mode).
 * - Must visit numbers in strict sequential order (Number Path mode: 1 -> 2 -> 3...).
 * - Must collect required keys before reaching Finish (Logic Challenge mode).
 * - Must complete within move budget when specified.
 * - Every stage is 100% solvable with algorithmically verified solutions.
 */

export const PATH_FINDER_STAGES = [
  {
    id: 1,
    name: 'Stage 1',
    title: 'Beginner Path',
    difficulty: 'Beginner',
    gridSize: 5,
    mode: 'classic',
    modeName: 'Classic Path',
    badge: 'STAGE 1 • BEGINNER',
    objective: 'Draw a path from Start (S) to Finish (F) avoiding the blocked obstacle tiles.',
    start: [0, 0],
    finish: [4, 4],
    maxMoves: 15,
    rewardXp: 10,
    rewardCoins: 2,
    blocked: [[0, 3], [1, 1], [1, 3], [2, 1], [3, 1], [3, 2], [3, 3], [4, 1], [4, 2]],
    traps: [],
    numbers: [],
    keys: [],
    solution: [
      [0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [2, 4], [3, 4], [4, 4]
    ]
  },
  {
    id: 2,
    name: 'Stage 2',
    title: 'Winding Route',
    difficulty: 'Easy',
    gridSize: 5,
    mode: 'classic',
    modeName: 'Classic Path',
    badge: 'STAGE 2 • EASY',
    objective: 'Navigate through a dense obstacle field from Start to Finish without getting trapped.',
    start: [0, 0],
    finish: [4, 4],
    maxMoves: 18,
    rewardXp: 20,
    rewardCoins: 4,
    blocked: [[0, 1], [1, 1], [3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2], [1, 3], [3, 3], [4, 3]],
    traps: [],
    numbers: [],
    keys: [],
    solution: [
      [0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 3], [0, 4], [1, 4], [2, 4], [3, 4], [4, 4]
    ]
  },
  {
    id: 3,
    name: 'Stage 3',
    title: 'Sequence Triple',
    difficulty: 'Normal',
    gridSize: 6,
    mode: 'number',
    modeName: 'Number Path',
    badge: 'STAGE 3 • NORMAL',
    objective: 'Connect numbered checkpoints in strict sequential order (1 → 2 → 3) before reaching Finish.',
    start: [0, 0],
    finish: [5, 5],
    maxMoves: 22,
    rewardXp: 30,
    rewardCoins: 6,
    blocked: [[1, 0], [1, 1], [1, 2], [2, 1], [3, 0], [4, 0], [2, 4], [3, 4], [4, 4], [1, 5], [2, 5], [3, 5]],
    traps: [],
    numbers: [
      { r: 0, c: 3, val: 1 },
      { r: 3, c: 3, val: 2 },
      { r: 5, c: 2, val: 3 }
    ],
    keys: [],
    solution: [
      [0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [3, 2], [4, 2], [5, 2], [5, 3], [5, 4], [5, 5]
    ]
  },
  {
    id: 4,
    name: 'Stage 4',
    title: 'Precision Budget',
    difficulty: 'Normal',
    gridSize: 6,
    mode: 'logic',
    modeName: 'Logic Challenge',
    badge: 'STAGE 4 • NORMAL',
    objective: 'Reach the destination in 12 moves or fewer. Every step must be calculated.',
    start: [0, 0],
    finish: [5, 5],
    maxMoves: 12,
    rewardXp: 40,
    rewardCoins: 8,
    blocked: [[0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [2, 3], [4, 0], [5, 0], [4, 1], [5, 1], [4, 2], [5, 2], [0, 4], [1, 4], [2, 4], [3, 5]],
    traps: [],
    numbers: [],
    keys: [],
    solution: [
      [0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3], [4, 3], [4, 4], [4, 5], [5, 5]
    ]
  },
  {
    id: 5,
    name: 'Stage 5',
    title: 'Minefield Corridor',
    difficulty: 'Medium',
    gridSize: 7,
    mode: 'trap',
    modeName: 'Trap Escape',
    badge: 'STAGE 5 • MEDIUM',
    objective: 'Steer clear of lethal danger traps. One wrong step will trigger an alarm.',
    start: [0, 0],
    finish: [6, 6],
    maxMoves: 25,
    rewardXp: 50,
    rewardCoins: 10,
    blocked: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [0, 4], [0, 5], [0, 6], [1, 6], [2, 6]],
    traps: [[0, 3], [1, 3], [2, 3], [1, 1], [2, 1], [3, 1], [4, 3], [5, 3], [4, 5], [3, 5], [6, 4], [6, 5]],
    numbers: [],
    keys: [],
    solution: [
      [0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [3, 2], [3, 3], [3, 4], [4, 4], [5, 4], [5, 5], [5, 6], [6, 6]
    ]
  },
  {
    id: 6,
    name: 'Stage 6',
    title: 'Quad Sequence',
    difficulty: 'Medium',
    gridSize: 7,
    mode: 'number',
    modeName: 'Number Path',
    badge: 'STAGE 6 • MEDIUM',
    objective: 'Visit checkpoints 1, 2, 3, and 4 in exact ascending sequence to unlock Finish.',
    start: [0, 0],
    finish: [6, 6],
    maxMoves: 28,
    rewardXp: 60,
    rewardCoins: 12,
    blocked: [[0, 1], [0, 2], [0, 3], [0, 4], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [2, 2], [3, 2], [2, 3], [3, 3], [2, 5], [3, 5], [4, 5], [6, 2], [6, 3], [6, 4]],
    traps: [],
    numbers: [
      { r: 1, c: 2, val: 1 },
      { r: 3, c: 4, val: 2 },
      { r: 5, c: 2, val: 3 },
      { r: 5, c: 5, val: 4 }
    ],
    keys: [],
    solution: [
      [0, 0], [1, 0], [1, 1], [1, 2], [1, 3], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3], [4, 2], [5, 2], [5, 3], [5, 4], [5, 5], [6, 5], [6, 6]
    ]
  },
  {
    id: 7,
    name: 'Stage 7',
    title: 'Neon Labyrinth',
    difficulty: 'Hard',
    gridSize: 8,
    mode: 'classic',
    modeName: 'Classic Path',
    badge: 'STAGE 7 • HARD',
    objective: 'Trace your way through an intricate labyrinth with narrow passages and dead ends.',
    start: [0, 0],
    finish: [7, 7],
    maxMoves: 34,
    rewardXp: 70,
    rewardCoins: 14,
    blocked: [[1, 0], [2, 0], [3, 0], [4, 0], [6, 0], [7, 0], [1, 1], [1, 2], [3, 2], [4, 2], [6, 1], [7, 1], [1, 4], [2, 4], [6, 3], [7, 3], [6, 4], [7, 4], [0, 5], [1, 5], [2, 5], [4, 5], [5, 5], [6, 5], [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
    traps: [],
    numbers: [],
    keys: [],
    solution: [
      [0, 0], [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [2, 2], [2, 1], [3, 1], [4, 1], [5, 1], [5, 2], [5, 3], [5, 4], [4, 4], [3, 4], [3, 5], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [7, 7]
    ]
  },
  {
    id: 8,
    name: 'Stage 8',
    title: 'Dual Key Security',
    difficulty: 'Hard',
    gridSize: 8,
    mode: 'logic',
    modeName: 'Logic Challenge',
    badge: 'STAGE 8 • HARD',
    objective: 'Retrieve Alpha Key (🔑 A) and Beta Key (🔑 B) before accessing the secure Finish vault.',
    start: [0, 0],
    finish: [7, 7],
    maxMoves: 32,
    rewardXp: 80,
    rewardCoins: 16,
    blocked: [[1, 0], [2, 0], [3, 0], [4, 0], [1, 1], [2, 1], [1, 2], [2, 2], [1, 3], [2, 3], [1, 4], [2, 4], [4, 3], [4, 4], [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [7, 0], [7, 1], [7, 2], [7, 3], [7, 4], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6]],
    traps: [],
    numbers: [],
    keys: [
      { r: 2, c: 5, id: 'key_a', name: 'Alpha Key', symbol: 'A' },
      { r: 5, c: 2, id: 'key_b', name: 'Beta Key', symbol: 'B' }
    ],
    solution: [
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 5], [2, 5], [3, 5], [3, 4], [3, 3], [3, 2], [4, 2], [5, 2], [5, 3], [5, 4], [5, 5], [6, 5], [7, 5], [7, 6], [7, 7]
    ]
  },
  {
    id: 9,
    name: 'Stage 9',
    title: 'Deadly Checkpoints',
    difficulty: 'Expert',
    gridSize: 9,
    mode: 'trap',
    modeName: 'Trap Escape + Sequence',
    badge: 'STAGE 9 • EXPERT',
    objective: 'Visit checkpoints 1, 2, and 3 in sequence while navigating around deadly hazard zones.',
    start: [0, 0],
    finish: [8, 8],
    maxMoves: 36,
    rewardXp: 90,
    rewardCoins: 18,
    blocked: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [3, 3], [4, 3], [5, 3], [6, 3], [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8]],
    traps: [[0, 5], [1, 5], [1, 3], [2, 3], [3, 4], [3, 5], [3, 6], [4, 6], [5, 6], [5, 5], [5, 4], [7, 5], [7, 6], [7, 7]],
    numbers: [
      { r: 1, c: 4, val: 1 },
      { r: 4, c: 7, val: 2 },
      { r: 7, c: 4, val: 3 }
    ],
    keys: [],
    solution: [
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 4], [2, 4], [2, 5], [2, 6], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [6, 6], [6, 5], [6, 4], [7, 4], [8, 4], [8, 5], [8, 6], [8, 7], [8, 8]
    ]
  },
  {
    id: 10,
    name: 'Stage 10',
    title: 'Master Convergence',
    difficulty: 'Master',
    gridSize: 10,
    mode: 'logic',
    modeName: 'Master Logic Challenge',
    badge: 'STAGE 10 • MASTER',
    objective: 'Collect both Security Keys and visit checkpoints 1 and 2 in order, while dodging traps to reach Finish.',
    start: [0, 0],
    finish: [9, 9],
    maxMoves: 48,
    rewardXp: 100,
    rewardCoins: 20,
    blocked: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [6, 0], [7, 0], [8, 0], [9, 0], [6, 1], [7, 1], [8, 1], [9, 1], [6, 2], [7, 2], [8, 2], [9, 2], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9]],
    traps: [[2, 1], [3, 1], [4, 1], [2, 3], [3, 3], [4, 3], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [8, 6], [8, 7]],
    numbers: [
      { r: 1, c: 5, val: 1 },
      { r: 8, c: 5, val: 2 }
    ],
    keys: [
      { r: 5, c: 1, id: 'key_b', name: 'Beta Key', symbol: 'B' },
      { r: 4, c: 8, id: 'key_a', name: 'Alpha Key', symbol: 'A' }
    ],
    solution: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [5, 1], [5, 2], [4, 2], [3, 2], [2, 2], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [7, 7], [7, 6], [7, 5], [8, 5], [9, 5], [9, 6], [9, 7], [9, 8], [9, 9]
    ]
  }
];

export class PathFinderService {
  /**
   * Get stage configuration by ID (1..10)
   */
  static getStage(stageId) {
    const stage = PATH_FINDER_STAGES.find((s) => s.id === Number(stageId));
    if (!stage) return PATH_FINDER_STAGES[0];
    return { ...stage };
  }

  /**
   * Get all stages
   */
  static getAllStages() {
    return [...PATH_FINDER_STAGES];
  }

  /**
   * Validates a drawn path from Start to Finish against all puzzle rules:
   * 1. Path must begin at Start (S).
   * 2. Path must end at Finish (F).
   * 3. Every step must be orthogonally adjacent (Manhattan distance = 1).
   * 4. No tile may be visited more than once (no loops/duplicates).
   * 5. No tile may be a blocked obstacle.
   * 6. No tile may be a trap hazard.
   * 7. Number checkpoints must all be visited in strict ascending order (1 -> 2 -> 3...).
   * 8. All required logic keys must be collected before reaching Finish.
   * 9. Total moves must not exceed the stage move limit (if defined).
   */
  static validatePath(stage, path) {
    if (!Array.isArray(path) || path.length === 0) {
      return { valid: false, error: 'Path is empty.', errorType: 'empty' };
    }

    const [startR, startC] = stage.start;
    const [finishR, finishC] = stage.finish;

    // 1. Start tile check
    if (path[0][0] !== startR || path[0][1] !== startC) {
      return {
        valid: false,
        error: 'Path must start at START (S).',
        errorType: 'start_mismatch'
      };
    }

    // 2. Finish tile check
    const last = path[path.length - 1];
    if (last[0] !== finishR || last[1] !== finishC) {
      return {
        valid: false,
        error: 'Path must reach FINISH (F).',
        errorType: 'finish_mismatch'
      };
    }

    // 3. Movement check: orthogonal adjacency only
    for (let i = 0; i < path.length - 1; i++) {
      const cur = path[i];
      const nxt = path[i + 1];
      const dr = Math.abs(nxt[0] - cur[0]);
      const dc = Math.abs(nxt[1] - cur[1]);
      if (dr + dc !== 1) {
        return {
          valid: false,
          error: `Diagonal or jumped moves are forbidden. Move only horizontally or vertically.`,
          errorType: 'non_orthogonal'
        };
      }
    }

    // 4. No revisits
    const seen = new Set();
    for (const [r, c] of path) {
      const key = `${r},${c}`;
      if (seen.has(key)) {
        return {
          valid: false,
          error: `Tile [${r + 1}, ${c + 1}] was visited more than once. Loops are not allowed.`,
          errorType: 'revisit'
        };
      }
      seen.add(key);
    }

    // 5. No blocked obstacle tiles
    const blockedSet = new Set((stage.blocked || []).map(([r, c]) => `${r},${c}`));
    for (const [r, c] of path) {
      if (blockedSet.has(`${r},${c}`)) {
        return {
          valid: false,
          error: `Path crosses a blocked obstacle tile at [${r + 1}, ${c + 1}].`,
          errorType: 'blocked'
        };
      }
    }

    // 6. No traps
    const trapSet = new Set((stage.traps || []).map(([r, c]) => `${r},${c}`));
    for (const [r, c] of path) {
      if (trapSet.has(`${r},${c}`)) {
        return {
          valid: false,
          error: `Hazard triggered! Stepped on a danger trap at [${r + 1}, ${c + 1}].`,
          errorType: 'trap'
        };
      }
    }

    // 7. Number checkpoints sequence
    if (stage.numbers && stage.numbers.length > 0) {
      const sortedNumbers = [...stage.numbers].sort((a, b) => a.val - b.val);
      let lastFoundIdx = -1;
      for (const num of sortedNumbers) {
        const idx = path.findIndex(([r, c]) => r === num.r && c === num.c);
        if (idx === -1) {
          return {
            valid: false,
            error: `Missing numbered checkpoint [${num.val}]. All numbers must be visited.`,
            errorType: 'missing_number'
          };
        }
        if (idx <= lastFoundIdx) {
          return {
            valid: false,
            error: `Checkpoint [${num.val}] was visited out of order. Must visit in ascending sequence (1 → 2 → 3...).`,
            errorType: 'number_order'
          };
        }
        lastFoundIdx = idx;
      }
    }

    // 8. Logic keys
    if (stage.keys && stage.keys.length > 0) {
      for (const key of stage.keys) {
        const idx = path.findIndex(([r, c]) => r === key.r && c === key.c);
        if (idx === -1) {
          return {
            valid: false,
            error: `Required key "${key.name}" was not collected before reaching Finish.`,
            errorType: 'missing_key'
          };
        }
      }
    }

    // 9. Move limit
    const moves = path.length - 1;
    if (stage.maxMoves && moves > stage.maxMoves) {
      return {
        valid: false,
        error: `Move limit exceeded! Used ${moves} moves (max allowed: ${stage.maxMoves}).`,
        errorType: 'moves_exceeded'
      };
    }

    return {
      valid: true,
      moves,
      timeBonus: Math.max(0, 100 - moves * 2)
    };
  }

  /**
   * Diagnostic Hint Generator
   * Provides useful contextual guidance without giving away the complete solution.
   */
  static getHint(stage, currentPath, hintsUsed = 0) {
    if (!stage || !stage.solution) {
      return 'Follow orthogonal steps towards the gold Finish tile.';
    }

    const sol = stage.solution;
    const currentLen = Array.isArray(currentPath) ? currentPath.length : 0;

    // Check if player has made moves
    if (currentLen <= 1) {
      const nextTile = sol[1];
      return `Tip: Begin your route by moving to tile [Row ${nextTile[0] + 1}, Col ${nextTile[1] + 1}].`;
    }

    // Check if current path matches solution prefix
    let matchesPrefix = true;
    let divergeIdx = -1;
    for (let i = 0; i < currentLen; i++) {
      if (!sol[i] || sol[i][0] !== currentPath[i][0] || sol[i][1] !== currentPath[i][1]) {
        matchesPrefix = false;
        divergeIdx = i;
        break;
      }
    }

    if (!matchesPrefix) {
      return `Route Alert: Your path diverged at step ${divergeIdx + 1}. Backtrack to [Row ${sol[divergeIdx - 1][0] + 1}, Col ${sol[divergeIdx - 1][1] + 1}] for the optimal route.`;
    }

    // If on track and numbers exist, hint the next required number
    if (stage.numbers && stage.numbers.length > 0) {
      const sorted = [...stage.numbers].sort((a, b) => a.val - b.val);
      for (const num of sorted) {
        const visited = currentPath.some(([r, c]) => r === num.r && c === num.c);
        if (!visited) {
          return `Checklist: Navigate to checkpoint [${num.val}] at [Row ${num.r + 1}, Col ${num.c + 1}].`;
        }
      }
    }

    // If logic keys exist, hint the next uncollected key
    if (stage.keys && stage.keys.length > 0) {
      for (const key of stage.keys) {
        const visited = currentPath.some(([r, c]) => r === key.r && c === key.c);
        if (!visited) {
          return `Security: Collect "${key.name}" at [Row ${key.r + 1}, Col ${key.c + 1}] before advancing.`;
        }
      }
    }

    // If close to finish or on the straight path
    if (currentLen < sol.length) {
      const nextStep = sol[currentLen];
      return `Next Step: Move to [Row ${nextStep[0] + 1}, Col ${nextStep[1] + 1}].`;
    }

    return 'You are on the verified route! Proceed into the Finish tile (F).';
  }
}

