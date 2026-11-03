/**
 * PIXO CYBER STRIKE: 2099 — LOGIC CODE
 * Question Generation & Mathematical Validation Service
 * 
 * Provides mathematically rigorous question generation for all 40 levels
 * across 4 core educational categories:
 * 1. Pattern Recognition (Levels 1–10)
 * 2. Number Intelligence (Levels 11–20)
 * 3. Root & Power Challenge (Levels 21–30)
 * 4. Missing Operator Challenge (Levels 31–40)
 */

export const LOGIC_CODE_CATEGORIES = [
  {
    id: 'pattern_recognition',
    title: 'PATTERN RECOGNITION',
    subtitle: 'Sequence & Logic Discovery',
    levelRange: [1, 10],
    icon: 'git-commit-outline',
    color: '#39FF14', // Neon Green
    gradient: ['#0A2A14', '#041408'],
    desc: 'Identify arithmetic, geometric, square, cube, and Fibonacci sequence patterns.',
  },
  {
    id: 'number_intelligence',
    title: 'NUMBER INTELLIGENCE',
    subtitle: 'Properties & Classifications',
    levelRange: [11, 20],
    icon: 'finger-print-outline',
    color: '#00E5FF', // Electric Blue
    gradient: ['#051F2A', '#020F16'],
    desc: 'Master Prime, Composite, Natural, Whole, Even, Odd, Square & Cube number classifications.',
  },
  {
    id: 'root_power',
    title: 'ROOT & POWER CHALLENGE',
    subtitle: 'Exponents & Radicals',
    levelRange: [21, 30],
    icon: 'flash-outline',
    color: '#FFD700', // Gold/Yellow
    gradient: ['#2A2405', '#141102'],
    desc: 'Calculate squares (x²), cubes (x³), square roots (√x), and cube roots (∛x).',
  },
  {
    id: 'missing_operator',
    title: 'MISSING OPERATOR',
    subtitle: 'BODMAS Equation Solver',
    levelRange: [31, 40],
    icon: 'calculator-outline',
    color: '#FF6A00', // Neon Orange
    gradient: ['#2B1405', '#160902'],
    desc: 'Fit the correct mathematical operators (+, −, ×, ÷) to match the target using BODMAS.',
  },
];

// Helper: Shuffle array
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper: Pick random item
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: Check if number is prime (1 is strictly neither prime nor composite)
export function isPrime(n) {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

// Helper: Check if number is composite (1 is strictly neither prime nor composite)
export function isComposite(n) {
  if (n <= 3) return false;
  return !isPrime(n);
}

// Helper: Generate distinct multiple-choice options including correct answer
function generateOptions(correctAnswer, generatorFn, count = 4) {
  const optionsSet = new Set([correctAnswer]);
  let attempts = 0;
  while (optionsSet.size < count && attempts < 50) {
    const candidate = generatorFn();
    if (candidate !== undefined && candidate !== null && !isNaN(candidate)) {
      optionsSet.add(candidate);
    }
    attempts++;
  }
  // Fallback if generator failed to produce 4
  let offset = 1;
  while (optionsSet.size < count) {
    const fake = typeof correctAnswer === 'number' ? correctAnswer + (offset % 2 === 0 ? offset : -offset) : `${correctAnswer}_${offset}`;
    optionsSet.add(fake);
    offset++;
  }
  return shuffle(Array.from(optionsSet));
}

// =========================================================================
// BODMAS MATHEMATICAL EVALUATOR
// Evaluates operators [+, -, *, /] adhering to standard operator precedence
// =========================================================================
export function evaluateBODMAS(numbers, operators) {
  if (!Array.isArray(numbers) || !Array.isArray(operators)) return null;
  if (numbers.length !== operators.length + 1) return null;

  // Step 1: Process Multiplication (*) and Division (/) from left to right
  const nums = [numbers[0]];
  const ops = [];

  for (let i = 0; i < operators.length; i++) {
    const op = operators[i];
    const nextNum = numbers[i + 1];

    if (op === '*' || op === '×') {
      const prev = nums[nums.length - 1];
      nums[nums.length - 1] = prev * nextNum;
    } else if (op === '/' || op === '÷') {
      if (nextNum === 0) return null; // Division by zero forbidden
      const prev = nums[nums.length - 1];
      nums[nums.length - 1] = prev / nextNum;
    } else {
      nums.push(nextNum);
      ops.push(op);
    }
  }

  // Step 2: Process Addition (+) and Subtraction (-) from left to right
  let result = nums[0];
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    const nextNum = nums[i + 1];

    if (op === '+') {
      result += nextNum;
    } else if (op === '-' || op === '−') {
      result -= nextNum;
    }
  }

  return result;
}

// Validates whether chosen operators produce the target number under BODMAS
export function isValidOperatorSolution(numbers, operators, target) {
  const evaluated = evaluateBODMAS(numbers, operators);
  if (evaluated === null) return false;
  return Math.abs(evaluated - target) < 1e-7;
}

// Explains BODMAS step-by-step
export function generateBODMASExplanation(numbers, operators, target) {
  let expr = `${numbers[0]}`;
  for (let i = 0; i < operators.length; i++) {
    expr += ` ${operators[i]} ${numbers[i + 1]}`;
  }
  const result = evaluateBODMAS(numbers, operators);
  return `By standard BODMAS order of operations: Multiplication and Division are computed first from left to right, followed by Addition and Subtraction. Thus, ${expr} = ${result}.`;
}

// =========================================================================
// QUESTION GENERATORS PER CATEGORY & LEVEL
// =========================================================================

export const LogicCodeQuestionService = {
  /**
   * Generates 5 verified questions for the specified level (1–40).
   * @param {number} level - 1 to 40
   * @returns {Array<object>} Array of 5 question objects
   */
  getQuestionsForLevel(level = 1) {
    return this.generateLevelQuestions(level);
  },

  generateLevelQuestions(level = 1) {
    const safeLevel = Math.max(1, Math.min(40, Number(level) || 1));
    const questions = [];

    for (let i = 0; i < 5; i++) {
      let q = null;
      if (safeLevel >= 1 && safeLevel <= 10) {
        q = this.generatePatternQuestion(safeLevel, i);
      } else if (safeLevel >= 11 && safeLevel <= 20) {
        q = this.generateNumberIntelligenceQuestion(safeLevel, i);
      } else if (safeLevel >= 21 && safeLevel <= 30) {
        q = this.generateRootPowerQuestion(safeLevel, i);
      } else {
        q = this.generateMissingOperatorQuestion(safeLevel, i);
      }
      questions.push({
        id: `q_lvl${safeLevel}_${i + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        level: safeLevel,
        index: i + 1,
        questionText: q.prompt || q.title || '',
        ...q,
      });
    }

    return questions;
  },

  // -----------------------------------------------------------------------
  // 1. PATTERN RECOGNITION (Levels 1–10)
  // -----------------------------------------------------------------------
  generatePatternQuestion(level, seed = 0) {
    let sequence = [];
    let answer = 0;
    let hint = '';
    let explanation = '';

    if (level === 1) {
      // Level 1: Easy Addition Pattern (+2, +3, +4, +5, +10)
      const diff = pick([2, 3, 4, 5, 10]);
      const start = Math.floor(Math.random() * 15) + 1;
      sequence = [start, start + diff, start + diff * 2, start + diff * 3];
      answer = start + diff * 4;
      hint = `Notice the difference between consecutive numbers. Each step increases by a constant amount.`;
      explanation = `Each number in the sequence increases by ${diff} (${sequence.join(', ')}, ${answer}). Therefore, ${sequence[3]} + ${diff} = ${answer}.`;
    } else if (level === 2) {
      // Level 2: Easy Subtraction Pattern (-2, -5, -10, -15)
      const diff = pick([2, 4, 5, 10, 15]);
      const start = 50 + Math.floor(Math.random() * 40);
      sequence = [start, start - diff, start - diff * 2, start - diff * 3];
      answer = start - diff * 4;
      hint = `The sequence is counting down steadily by the same value.`;
      explanation = `Each term decreases by ${diff}. Therefore, ${sequence[3]} − ${diff} = ${answer}.`;
    } else if (level === 3) {
      // Level 3: Multiplication Pattern (*2, *3)
      const mult = pick([2, 3]);
      const start = mult === 2 ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 3) + 1;
      sequence = [start, start * mult, start * mult * mult, start * mult * mult * mult];
      answer = sequence[3] * mult;
      hint = `Look at the ratio between numbers: each number is multiplied by a fixed factor.`;
      explanation = `Each number is multiplied by ${mult} (${sequence.join(' × ')}...). Thus, ${sequence[3]} × ${mult} = ${answer}.`;
    } else if (level === 4) {
      // Level 4: Increasing differences (+1, +2, +3, +4...) or Division (/2)
      if (seed % 2 === 0) {
        const start = Math.floor(Math.random() * 8) + 2;
        sequence = [start, start + 2, start + 5, start + 9]; // +2, +3, +4, +5
        answer = sequence[3] + 5;
        hint = `The step size grows larger by 1 with each consecutive jump.`;
        explanation = `The difference between numbers grows: +2, +3, +4, +5. Therefore, ${sequence[3]} + 5 = ${answer}.`;
      } else {
        const factor = 2;
        const base = Math.floor(Math.random() * 5) + 3;
        const start = base * 16;
        sequence = [start, start / factor, start / 4, start / 8];
        answer = start / 16;
        hint = `Each term is halved to find the next value.`;
        explanation = `Each number is divided by 2: ${sequence.join(' ÷ 2 = ')} ÷ 2 = ${answer}.`;
      }
    } else if (level === 5) {
      // Level 5: Square number patterns (1, 4, 9, 16, 25, 36...)
      const offset = Math.floor(Math.random() * 4) + 1;
      const n1 = offset;
      const n2 = offset + 1;
      const n3 = offset + 2;
      const n4 = offset + 3;
      sequence = [n1 * n1, n2 * n2, n3 * n3, n4 * n4];
      const nextN = offset + 4;
      answer = nextN * nextN;
      hint = `These are consecutive perfect square numbers (${n1}², ${n2}², ${n3}²...).`;
      explanation = `The sequence follows consecutive squares: ${n1}²=${sequence[0]}, ${n2}²=${sequence[1]}, ${n3}²=${sequence[2]}, ${n4}²=${sequence[3]}. The next square is ${nextN}² = ${answer}.`;
    } else if (level === 6) {
      // Level 6: Cube number patterns (1, 8, 27, 64, 125, 216...)
      const offset = Math.floor(Math.random() * 3) + 1;
      const n1 = offset;
      const n2 = offset + 1;
      const n3 = offset + 2;
      const n4 = offset + 3;
      sequence = [n1 * n1 * n1, n2 * n2 * n2, n3 * n3 * n3, n4 * n4 * n4];
      const nextN = offset + 4;
      answer = nextN * nextN * nextN;
      hint = `Each number is formed by cubing an integer (n³ = n × n × n).`;
      explanation = `The sequence is consecutive cubes: ${n1}³=${sequence[0]}, ${n2}³=${sequence[1]}, ${n3}³=${sequence[2]}, ${n4}³=${sequence[3]}. Next is ${nextN}³ = ${answer}.`;
    } else if (level === 7) {
      // Level 7: Fibonacci sequences (e.g. 1, 1, 2, 3, 5, 8 or 2, 3, 5, 8, 13)
      const a = pick([1, 2, 3]);
      const b = pick([1, 2, 4]);
      const c = a + b;
      const d = b + c;
      const e = c + d;
      sequence = [a, b, c, d];
      answer = e;
      hint = `Each number is the sum of the previous two numbers in the sequence.`;
      explanation = `Fibonacci rule (each term = sum of previous two): ${a}+${b}=${c}, ${b}+${c}=${d}, ${c}+${d}=${answer}.`;
    } else if (level === 8) {
      // Level 8: Alternating operations (+3, *2 or *2, -1)
      const start = Math.floor(Math.random() * 5) + 2;
      const step1 = start + 3;
      const step2 = step1 * 2;
      const step3 = step2 + 3;
      sequence = [start, step1, step2, step3];
      answer = step3 * 2;
      hint = `Two alternating operations are at work: first add, then multiply.`;
      explanation = `The pattern alternates: +3, ×2, +3, ×2. Thus, ${step3} × 2 = ${answer}.`;
    } else if (level === 9) {
      // Level 9: Double & Add 1 (x * 2 + 1)
      const start = Math.floor(Math.random() * 4) + 1;
      const t1 = start;
      const t2 = t1 * 2 + 1;
      const t3 = t2 * 2 + 1;
      const t4 = t3 * 2 + 1;
      sequence = [t1, t2, t3, t4];
      answer = t4 * 2 + 1;
      hint = `Each step doubles the previous number and then adds 1.`;
      explanation = `Rule: (Current × 2) + 1. Therefore, (${t4} × 2) + 1 = ${answer}.`;
    } else {
      // Level 10: Boss Level — Triple alternating or Geometric Fibonacci mix
      const start = Math.floor(Math.random() * 6) + 3;
      const t1 = start;
      const t2 = t1 * 2 - 2;
      const t3 = t2 * 2 - 2;
      const t4 = t3 * 2 - 2;
      sequence = [t1, t2, t3, t4];
      answer = t4 * 2 - 2;
      hint = `Examine: multiply the term by 2, then subtract 2 to produce the next.`;
      explanation = `Rule: (n × 2) − 2. Thus, (${t4} × 2) − 2 = ${answer}.`;
    }

    const options = generateOptions(answer, () => {
      const delta = pick([-4, -3, -2, -1, 1, 2, 3, 4, 5, 10]);
      return answer + delta;
    });

    return {
      type: 'pattern',
      category: 'Pattern Recognition',
      title: 'Complete the Number Sequence',
      prompt: `${sequence.join(',   ')},   ?`,
      sequence,
      correctAnswer: answer,
      options,
      hint,
      explanation,
    };
  },

  // -----------------------------------------------------------------------
  // 2. NUMBER INTELLIGENCE (Levels 11–20)
  // -----------------------------------------------------------------------
  generateNumberIntelligenceQuestion(level, seed = 0) {
    if (level === 11) {
      // Level 11: Even & Odd Numbers
      const isLookingForEven = seed % 2 === 0;
      const targetType = isLookingForEven ? 'EVEN' : 'ODD';
      let correct = 0;
      let options = [];

      if (isLookingForEven) {
        correct = (Math.floor(Math.random() * 20) + 1) * 2;
        options = generateOptions(correct, () => (Math.floor(Math.random() * 20) + 1) * 2 + 1);
      } else {
        correct = (Math.floor(Math.random() * 20) + 1) * 2 + 1;
        options = generateOptions(correct, () => (Math.floor(Math.random() * 20) + 1) * 2);
      }

      return {
        type: 'number_intelligence',
        category: 'Number Intelligence',
        title: `Identify ${targetType} Number`,
        prompt: `Which of the following numbers is an ${targetType} number?`,
        correctAnswer: correct,
        options,
        hint: isLookingForEven ? `An even number is perfectly divisible by 2 (ends in 0, 2, 4, 6, 8).` : `An odd number leaves a remainder of 1 when divided by 2 (ends in 1, 3, 5, 7, 9).`,
        explanation: `${correct} is an ${targetType} number because it ${isLookingForEven ? 'is divisible by 2 with no remainder' : 'leaves a remainder of 1 when divided by 2'}.`,
      };
    } else if (level === 12) {
      // Level 12: Natural Numbers (N = {1, 2, 3, ...})
      const naturalCandidates = [1, 2, 3, 4, 7, 12, 19, 25, 42];
      const nonNaturalCandidates = [0, -1, -5, -12, '0', -8];
      const correct = pick(naturalCandidates);
      const options = shuffle([
        correct,
        pick([0, -2]),
        pick([-3, -7]),
        pick([-4, -10]),
      ]);

      return {
        type: 'number_intelligence',
        category: 'Number Intelligence',
        title: 'Natural Number Identification',
        prompt: `Which of the following belongs to the set of Natural Numbers (ℕ)?`,
        correctAnswer: correct,
        options,
        hint: `Natural numbers are positive counting numbers (1, 2, 3, ...). Zero and negative numbers are not natural numbers.`,
        explanation: `Natural numbers ℕ are strictly positive integers starting from 1 (1, 2, 3...). Therefore, ${correct} is a natural number, whereas 0 and negative integers are not.`,
      };
    } else if (level === 13) {
      // Level 13: Whole Numbers (W = {0, 1, 2, 3, ...} includes zero)
      const wholeCandidates = [0, 1, 5, 8, 14, 20];
      const nonWhole = [-3, -7, -12, -25];
      const isZeroTest = seed % 2 === 0;
      const correct = isZeroTest ? 0 : pick(wholeCandidates);
      const options = shuffle([
        correct,
        pick([-2, -5]),
        pick([-6, -11]),
        pick([-8, -19]),
      ]);

      return {
        type: 'number_intelligence',
        category: 'Number Intelligence',
        title: 'Whole Number Properties',
        prompt: `Which of the following is a Whole Number (𝕎)?`,
        correctAnswer: correct,
        options,
        hint: `Whole numbers are non-negative integers: 0, 1, 2, 3, 4... Zero is a whole number, but negative integers are not.`,
        explanation: `The set of Whole Numbers consists of all natural numbers plus zero ({0, 1, 2, 3...}). Hence, ${correct} is a whole number.`,
      };
    } else if (level === 14) {
      // Level 14: Prime Numbers (Numbers > 1 with exactly two factors)
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
      const compositesAndOne = [1, 4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 25, 27];
      const correct = pick(primes);
      const options = generateOptions(correct, () => pick(compositesAndOne));

      return {
        type: 'number_intelligence',
        category: 'Number Intelligence',
        title: 'Prime Number Identification',
        prompt: `Which of the following numbers is a Prime Number?`,
        correctAnswer: correct,
        options,
        hint: `A prime number is greater than 1 and has exactly two distinct factors: 1 and itself. Note: 1 is NOT a prime number.`,
        explanation: `${correct} is prime because its only positive divisors are 1 and ${correct}. Numbers with more divisors are composite, and 1 is neither prime nor composite.`,
      };
    } else if (level === 15) {
      // Level 15: Composite Numbers (Numbers > 1 with more than two factors)
      const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 25, 27, 28, 33];
      const primesAndOne = [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
      const correct = pick(composites);
      const options = generateOptions(correct, () => pick(primesAndOne));

      return {
        type: 'number_intelligence',
        category: 'Number Intelligence',
        title: 'Composite Number Identification',
        prompt: `Which of the following numbers is a Composite Number?`,
        correctAnswer: correct,
        options,
        hint: `A composite number is an integer greater than 1 that has at least one divisor other than 1 and itself. Note: 1 is neither prime nor composite.`,
        explanation: `${correct} is composite because it can be divided evenly by numbers other than 1 and itself. (1 is neither prime nor composite).`,
      };
    } else if (level === 16) {
      // Level 16: Classification Challenge: Is N Prime or Composite?
      const testCases = [
        { num: 17, isP: true, factors: '1 and 17' },
        { num: 21, isP: false, factors: '1, 3, 7, 21' },
        { num: 29, isP: true, factors: '1 and 29' },
        { num: 39, isP: false, factors: '1, 3, 13, 39' },
        { num: 41, isP: true, factors: '1 and 41' },
        { num: 51, isP: false, factors: '1, 3, 17, 51' },
        { num: 91, isP: false, factors: '1, 7, 13, 91' },
        { num: 1, isP: null, factors: 'only 1' },
      ];
      const item = pick(testCases);
      const correct = item.isP === true ? 'Prime' : item.isP === false ? 'Composite' : 'Neither Prime nor Composite';
      const options = ['Prime', 'Composite', 'Neither Prime nor Composite', 'Both Prime and Composite'];

      return {
        type: 'number_intelligence',
        category: 'Number Intelligence',
        title: 'Classify Number',
        prompt: `Classify the number ${item.num}: Is it Prime, Composite, or Neither?`,
        correctAnswer: correct,
        options,
        hint: item.num === 1 ? `1 has only one divisor, so it cannot be prime (needs 2) or composite (needs >2).` : `Check if ${item.num} can be divided by small primes like 2, 3, 5, 7...`,
        explanation: item.num === 1 ? `1 is strictly NEITHER prime nor composite by fundamental mathematical definition.` : `${item.num} has factors (${item.factors}), making it ${correct}.`,
      };
    } else if (level === 17) {
      // Level 17: Perfect Squares
      const squares = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169];
      const nonSquares = [2, 3, 5, 7, 8, 10, 12, 15, 18, 20, 24, 30, 40, 50, 70];
      const correct = pick(squares);
      const root = Math.round(Math.sqrt(correct));
      const options = generateOptions(correct, () => pick(nonSquares));

      return {
        type: 'number_intelligence',
        category: 'Number Intelligence',
        title: 'Perfect Square Number',
        prompt: `Which of the following is a Perfect Square number?`,
        correctAnswer: correct,
        options,
        hint: `A perfect square is the product of an integer multiplied by itself (n × n).`,
        explanation: `${correct} is a perfect square because ${root} × ${root} = ${correct}.`,
      };
    } else if (level === 18) {
      // Level 18: Perfect Cubes
      const cubes = [1, 8, 27, 64, 125, 216, 343, 512, 729, 1000];
      const nonCubes = [4, 9, 12, 16, 25, 30, 36, 49, 81, 100, 150, 200];
      const correct = pick(cubes);
      const croot = Math.round(Math.cbrt(correct));
      const options = generateOptions(correct, () => pick(nonCubes));

      return {
        type: 'number_intelligence',
        category: 'Number Intelligence',
        title: 'Perfect Cube Number',
        prompt: `Which of the following is a Perfect Cube number?`,
        correctAnswer: correct,
        options,
        hint: `A perfect cube is obtained by multiplying an integer three times by itself (n × n × n).`,
        explanation: `${correct} is a perfect cube because ${croot}³ = ${croot} × ${croot} × ${croot} = ${correct}.`,
      };
    } else if (level === 19) {
      // Level 19: Dual criteria: Odd & Composite
      const oddComposites = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49];
      const distractors = [2, 3, 5, 7, 11, 13, 17, 4, 6, 8, 12]; // even composites or odd primes
      const correct = pick(oddComposites);
      const options = generateOptions(correct, () => pick(distractors));

      return {
        type: 'number_intelligence',
        category: 'Number Intelligence',
        title: 'Dual Criteria Challenge',
        prompt: `Find the number that is BOTH Odd and Composite:`,
        correctAnswer: correct,
        options,
        hint: `Look for a number that ends in 1, 3, 5, 7, 9, BUT is not a prime number (has divisors other than 1 and itself).`,
        explanation: `${correct} is odd (not divisible by 2) AND composite (has factors beyond 1 and itself).`,
      };
    } else {
      // Level 20: Boss Level — Prime count in range
      const range = pick([
        { from: 1, to: 10, primes: [2, 3, 5, 7], count: 4 },
        { from: 10, to: 20, primes: [11, 13, 17, 19], count: 4 },
        { from: 20, to: 30, primes: [23, 29], count: 2 },
        { from: 30, to: 40, primes: [31, 37], count: 2 },
        { from: 40, to: 50, primes: [41, 43, 47], count: 3 },
      ]);
      const options = generateOptions(range.count, () => pick([1, 2, 3, 4, 5, 6]));

      return {
        type: 'number_intelligence',
        category: 'Number Intelligence',
        title: 'Prime Count Intelligence',
        prompt: `How many Prime Numbers exist between ${range.from} and ${range.to}?`,
        correctAnswer: range.count,
        options,
        hint: `Test each number between ${range.from} and ${range.to} for divisors. Note: 1 is not prime.`,
        explanation: `There are ${range.count} prime numbers between ${range.from} and ${range.to}: ${range.primes.join(', ')}.`,
      };
    }
  },

  // -----------------------------------------------------------------------
  // 3. ROOT & POWER CHALLENGE (Levels 21–30)
  // -----------------------------------------------------------------------
  generateRootPowerQuestion(level, seed = 0) {
    if (level === 21) {
      // Level 21: Basic Squares (2² to 10²)
      const base = Math.floor(Math.random() * 9) + 2; // 2 to 10
      const answer = base * base;
      const options = generateOptions(answer, () => {
        const offset = pick([-5, -3, -1, 1, 3, 5]);
        return answer + offset;
      });

      return {
        type: 'root_power',
        category: 'Root & Power Challenge',
        title: 'Square Calculation',
        prompt: `${base}² = ?`,
        correctAnswer: answer,
        options,
        hint: `Squaring a number means multiplying it by itself: ${base} × ${base}.`,
        explanation: `${base}² = ${base} × ${base} = ${answer}.`,
      };
    } else if (level === 22) {
      // Level 22: Basic Square Roots (√4 to √100)
      const root = Math.floor(Math.random() * 9) + 2; // 2 to 10
      const square = root * root;
      const options = generateOptions(root, () => {
        const offset = pick([-2, -1, 1, 2, 3]);
        return Math.max(1, root + offset);
      });

      return {
        type: 'root_power',
        category: 'Root & Power Challenge',
        title: 'Square Root Evaluation',
        prompt: `√${square} = ?`,
        correctAnswer: root,
        options,
        hint: `What positive number multiplied by itself equals ${square}?`,
        explanation: `√${square} = ${root} because ${root} × ${root} = ${square}.`,
      };
    } else if (level === 23) {
      // Level 23: Basic Cubes (1³ to 6³)
      const base = Math.floor(Math.random() * 6) + 1; // 1 to 6
      const answer = base * base * base;
      const options = generateOptions(answer, () => {
        const offset = pick([-10, -5, 5, 10, 15]);
        return Math.max(1, answer + offset);
      });

      return {
        type: 'root_power',
        category: 'Root & Power Challenge',
        title: 'Cube Calculation',
        prompt: `${base}³ = ?`,
        correctAnswer: answer,
        options,
        hint: `Cubing a number means multiplying it three times: ${base} × ${base} × ${base}.`,
        explanation: `${base}³ = ${base} × ${base} × ${base} = ${answer}.`,
      };
    } else if (level === 24) {
      // Level 24: Basic Cube Roots (∛8 to ∛343)
      const croot = Math.floor(Math.random() * 6) + 2; // 2 to 7
      const cube = croot * croot * croot;
      const options = generateOptions(croot, () => {
        const offset = pick([-2, -1, 1, 2, 3]);
        return Math.max(1, croot + offset);
      });

      return {
        type: 'root_power',
        category: 'Root & Power Challenge',
        title: 'Cube Root Evaluation',
        prompt: `∛${cube} = ?`,
        correctAnswer: croot,
        options,
        hint: `What number multiplied by itself three times equals ${cube}?`,
        explanation: `∛${cube} = ${croot} because ${croot} × ${croot} × ${croot} = ${cube}.`,
      };
    } else if (level === 25) {
      // Level 25: Intermediate Squares (11² to 20²)
      const base = Math.floor(Math.random() * 10) + 11; // 11 to 20
      const answer = base * base;
      const options = generateOptions(answer, () => {
        const offset = pick([-20, -10, 10, 20]);
        return answer + offset;
      });

      return {
        type: 'root_power',
        category: 'Root & Power Challenge',
        title: 'Intermediate Square',
        prompt: `${base}² = ?`,
        correctAnswer: answer,
        options,
        hint: `Multiply ${base} by ${base}. You can use (${base - 1})² or mental breakdown.`,
        explanation: `${base}² = ${base} × ${base} = ${answer}.`,
      };
    } else if (level === 26) {
      // Level 26: Intermediate Square Roots (√121 to √400)
      const root = Math.floor(Math.random() * 10) + 11; // 11 to 20
      const square = root * root;
      const options = generateOptions(root, () => {
        const offset = pick([-3, -2, -1, 1, 2, 3]);
        return root + offset;
      });

      return {
        type: 'root_power',
        category: 'Root & Power Challenge',
        title: 'Intermediate Square Root',
        prompt: `√${square} = ?`,
        correctAnswer: root,
        options,
        hint: `Which two-digit number when squared produces ${square}? (Between 10 and 20).`,
        explanation: `√${square} = ${root} because ${root} × ${root} = ${square}.`,
      };
    } else if (level === 27) {
      // Level 27: Missing Power Base or Exponent
      if (seed % 2 === 0) {
        const base = pick([2, 3, 4, 5, 10]);
        const exp = pick([2, 3, 4]);
        const result = Math.pow(base, exp);
        const options = generateOptions(exp, () => pick([1, 2, 3, 4, 5]));

        return {
          type: 'root_power',
          category: 'Root & Power Challenge',
          title: 'Find Missing Exponent',
          prompt: `${base}ⁿ = ${result},   n = ?`,
          correctAnswer: exp,
          options,
          hint: `How many times must ${base} be multiplied by itself to reach ${result}?`,
          explanation: `${base} to the power of ${exp} equals ${result} (${Array(exp).fill(base).join(' × ')} = ${result}).`,
        };
      } else {
        const base = pick([3, 4, 5, 6, 7, 8, 9]);
        const square = base * base;
        const options = generateOptions(base, () => pick([2, 3, 4, 5, 6, 7, 8, 9, 10]));

        return {
          type: 'root_power',
          category: 'Root & Power Challenge',
          title: 'Find Missing Base',
          prompt: `x² = ${square},   x = ? (x > 0)`,
          correctAnswer: base,
          options,
          hint: `Take the positive square root of ${square}.`,
          explanation: `Since x² = ${square}, taking square roots on both sides gives x = √${square} = ${base}.`,
        };
      }
    } else if (level === 28) {
      // Level 28: Power sequences (e.g. 2, 4, 8, 16, 32 or 3, 9, 27, 81)
      const base = pick([2, 3, 4]);
      const seq = [base, Math.pow(base, 2), Math.pow(base, 3), Math.pow(base, 4)];
      const answer = Math.pow(base, 5);
      const options = generateOptions(answer, () => {
        const offset = pick([-16, -8, 8, 16, 32]);
        return answer + offset;
      });

      return {
        type: 'root_power',
        category: 'Root & Power Challenge',
        title: 'Power Sequence Challenge',
        prompt: `${seq.join(',  ')},  ?`,
        correctAnswer: answer,
        options,
        hint: `Each term multiplies the previous value by base ${base} (consecutive powers: ${base}¹, ${base}², ${base}³...).`,
        explanation: `Sequence follows powers of ${base}: ${base}⁴ = ${seq[3]}. Next term is ${base}⁵ = ${answer}.`,
      };
    } else if (level === 29) {
      // Level 29: Arithmetic Expressions with Radicals and Powers
      const r1 = pick([4, 9, 16, 25, 36, 49, 64, 81]);
      const p1 = pick([2, 3, 4, 5]);
      const val1 = Math.round(Math.sqrt(r1));
      const val2 = p1 * p1;
      const answer = val1 + val2;
      const options = generateOptions(answer, () => {
        const offset = pick([-4, -2, 2, 4, 6]);
        return answer + offset;
      });

      return {
        type: 'root_power',
        category: 'Root & Power Challenge',
        title: 'Radical & Power Expression',
        prompt: `√${r1} + ${p1}² = ?`,
        correctAnswer: answer,
        options,
        hint: `First evaluate √${r1}, then compute ${p1}², then add the results together.`,
        explanation: `√${r1} = ${val1} and ${p1}² = ${val2}. Then ${val1} + ${val2} = ${answer}.`,
      };
    } else {
      // Level 30: Boss Level — Cube root combined with square root
      const croot = pick([2, 3, 4, 5]);
      const cube = croot * croot * croot;
      const sroot = pick([3, 4, 5, 6, 7, 8]);
      const square = sroot * sroot;
      const answer = croot * sroot;
      const options = generateOptions(answer, () => {
        const offset = pick([-6, -3, 3, 6, 9]);
        return Math.max(1, answer + offset);
      });

      return {
        type: 'root_power',
        category: 'Root & Power Challenge',
        title: 'Combined Radical Mastery',
        prompt: `∛${cube} × √${square} = ?`,
        correctAnswer: answer,
        options,
        hint: `Find the cube root of ${cube} and the square root of ${square}, then multiply them.`,
        explanation: `∛${cube} = ${croot} and √${square} = ${sroot}. Therefore, ${croot} × ${sroot} = ${answer}.`,
      };
    }
  },

  // -----------------------------------------------------------------------
  // 4. MISSING OPERATOR CHALLENGE (Levels 31–40)
  // -----------------------------------------------------------------------
  generateMissingOperatorQuestion(level, seed = 0) {
    const ALL_OPS = ['+', '−', '×', '÷'];
    const OP_MAP = { '+': '+', '−': '-', '×': '*', '÷': '/' };

    // Helper: Find all valid operator assignments for given numbers and target
    const findValidSolutions = (numbers, target, opCount) => {
      const solutions = [];
      const opChoices = ['+', '−', '×', '÷'];

      if (opCount === 2) {
        for (const op1 of opChoices) {
          for (const op2 of opChoices) {
            const mathOps = [OP_MAP[op1], OP_MAP[op2]];
            if (isValidOperatorSolution(numbers, mathOps, target)) {
              solutions.push([op1, op2]);
            }
          }
        }
      } else if (opCount === 3) {
        for (const op1 of opChoices) {
          for (const op2 of opChoices) {
            for (const op3 of opChoices) {
              const mathOps = [OP_MAP[op1], OP_MAP[op2], OP_MAP[op3]];
              if (isValidOperatorSolution(numbers, mathOps, target)) {
                solutions.push([op1, op2, op3]);
              }
            }
          }
        }
      }

      return solutions;
    };

    let numbers = [];
    let target = 0;
    let opCount = 2;
    let solutions = [];

    if (level <= 34) {
      // 2 Operators
      opCount = 2;
      const presets = [
        { nums: [20, 5, 1], target: 100 }, // 20 * 5 * 1 or 20 * 5 / 1
        { nums: [10, 5, 2], target: 20 },  // 10 + 5 * 2
        { nums: [15, 3, 2], target: 21 },  // 15 + 3 * 2
        { nums: [24, 6, 2], target: 6 },   // 24 / 6 + 2
        { nums: [30, 5, 3], target: 9 },   // 30 / 5 + 3
        { nums: [8, 4, 2], target: 16 },   // 8 * 4 / 2 or 8 + 4 * 2
        { nums: [12, 4, 3], target: 0 },   // 12 - 4 * 3
        { nums: [50, 10, 2], target: 7 },  // 50 / 10 + 2
        { nums: [16, 4, 2], target: 8 },   // 16 / 4 * 2
        { nums: [7, 3, 2], target: 13 },   // 7 + 3 * 2
      ];
      const selectedPreset = presets[(seed + level) % presets.length];
      numbers = selectedPreset.nums;
      target = selectedPreset.target;
      solutions = findValidSolutions(numbers, target, 2);
    } else {
      // 3 Operators (Levels 35–40)
      opCount = 3;
      const presets3 = [
        { nums: [10, 2, 5, 1], target: 25 }, // 10 * 2 + 5 * 1
        { nums: [20, 4, 2, 3], target: 11 }, // 20 / 4 + 2 * 3
        { nums: [18, 3, 2, 4], target: 16 }, // 18 / 3 * 2 + 4
        { nums: [15, 5, 4, 2], target: 11 }, // 15 / 5 + 4 * 2
        { nums: [12, 3, 2, 5], target: 13 }, // 12 + 3 * 2 - 5
        { nums: [30, 6, 3, 2], target: 11 }, // 30 / 6 + 3 * 2
        { nums: [8, 2, 4, 1], target: 8 },   // 8 / 2 + 4 * 1
        { nums: [25, 5, 3, 2], target: 11 }, // 25 / 5 + 3 * 2
      ];
      const selectedPreset = presets3[(seed + level) % presets3.length];
      numbers = selectedPreset.nums;
      target = selectedPreset.target;
      solutions = findValidSolutions(numbers, target, 3);
    }

    // Safety fallback: if no solution found, inject guaranteed solvable puzzle
    if (solutions.length === 0) {
      numbers = [10, 5, 2];
      target = 20;
      opCount = 2;
      solutions = findValidSolutions(numbers, target, 2);
    }

    const sampleSolution = solutions[0];
    const hint = `Remember BODMAS precedence: Multiplication (×) and Division (÷) evaluate first before Addition (+) and Subtraction (−). Try fitting × or ÷ where large jumps are needed.`;
    const explanation = generateBODMASExplanation(
      numbers,
      sampleSolution.map((op) => OP_MAP[op]),
      target
    );

    return {
      type: 'missing_operator',
      isOperatorPuzzle: true,
      category: 'Missing Operator Challenge',
      title: `Match Target: ${target}`,
      prompt: `Place the correct operators in the boxes so the equation equals ${target}:`,
      numbers,
      target,
      targetNumber: target,
      opCount,
      validSolutions: solutions, // All mathematically valid operator combinations
      availableOperators: ALL_OPS,
      hint,
      explanation,
    };
  },
};
