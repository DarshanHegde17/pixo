import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Animated,
  useWindowDimensions,
  ScrollView,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { GamingActivityService } from '../../services/gamingActivityService';
import { GamePersistenceService } from '../../services/gamePersistenceService';

// Operator definitions
const OPERATORS = [
  { id: '+', label: 'ADDITION (+)', symbol: '+', color: '#39FF14', desc: 'Fast Sum Calculation' },
  { id: '-', label: 'SUBTRACTION (-)', symbol: '-', color: '#00E5FF', desc: 'Difference Rush' },
  { id: '*', label: 'MULTIPLICATION (*)', symbol: '×', color: '#FFD700', desc: 'Speed Multiplication' },
  { id: '%', label: 'MODULUS (%)', symbol: '%', color: '#FF6A00', desc: 'Remainder Solver' },
];

// Level configurations: 10 Levels for each operator in Target Number
// Level 1 must be completed to unlock Level 2, Level 2 to unlock Level 3, etc.
// Rewards match Master Prompt Section 4: Level 1 (10 XP, 2 Coins) to Level 10 (100 XP, 20 Coins)
const LEVEL_CONFIGS = {
  1: { level: 1, totalQuestions: 5, timeLimit: 30, title: 'LEVEL 1: ROOKIE RUSH', xpReward: 10, coinReward: 2 },
  2: { level: 2, totalQuestions: 6, timeLimit: 30, title: 'LEVEL 2: NOVICE STRIKE', xpReward: 20, coinReward: 4 },
  3: { level: 3, totalQuestions: 7, timeLimit: 30, title: 'LEVEL 3: VETERAN CRUNCH', xpReward: 30, coinReward: 6 },
  4: { level: 4, totalQuestions: 8, timeLimit: 30, title: 'LEVEL 4: CIPHER SPRINT', xpReward: 40, coinReward: 8 },
  5: { level: 5, totalQuestions: 9, timeLimit: 30, title: 'LEVEL 5: SPEED RUNNER', xpReward: 50, coinReward: 10 },
  6: { level: 6, totalQuestions: 10, timeLimit: 30, title: 'LEVEL 6: CYBER MASTER', xpReward: 60, coinReward: 12 },
  7: { level: 7, totalQuestions: 11, timeLimit: 30, title: 'LEVEL 7: MATRIX SURGE', xpReward: 70, coinReward: 14 },
  8: { level: 8, totalQuestions: 12, timeLimit: 30, title: 'LEVEL 8: QUANTUM RUSH', xpReward: 80, coinReward: 16 },
  9: { level: 9, totalQuestions: 13, timeLimit: 30, title: 'LEVEL 9: TITAN OVERCLOCK', xpReward: 90, coinReward: 18 },
  10: { level: 10, totalQuestions: 15, timeLimit: 30, title: 'LEVEL 10: APEX LEGEND', xpReward: 100, coinReward: 20 },
};

/**
 * Generate a single math problem based on operator and level (1 - 10)
 */
function generateProblem(op, level) {
  let num1 = 1;
  let num2 = 1;
  let answer = 0;

  if (op === '+') {
    if (level === 1) {
      num1 = Math.floor(Math.random() * 9) + 2; // 2 to 10
      num2 = Math.floor(Math.random() * 9) + 2;
    } else if (level === 2) {
      num1 = Math.floor(Math.random() * 12) + 4; // 4 to 15
      num2 = Math.floor(Math.random() * 12) + 4;
    } else if (level === 3) {
      num1 = Math.floor(Math.random() * 18) + 7; // 7 to 24
      num2 = Math.floor(Math.random() * 18) + 7;
    } else if (level === 4) {
      num1 = Math.floor(Math.random() * 22) + 10; // 10 to 31
      num2 = Math.floor(Math.random() * 22) + 10;
    } else if (level === 5) {
      num1 = Math.floor(Math.random() * 28) + 12; // 12 to 39
      num2 = Math.floor(Math.random() * 28) + 12;
    } else if (level === 6) {
      num1 = Math.floor(Math.random() * 35) + 15; // 15 to 49
      num2 = Math.floor(Math.random() * 35) + 15;
    } else if (level === 7) {
      num1 = Math.floor(Math.random() * 45) + 20; // 20 to 64
      num2 = Math.floor(Math.random() * 45) + 20;
    } else if (level === 8) {
      num1 = Math.floor(Math.random() * 60) + 25; // 25 to 84
      num2 = Math.floor(Math.random() * 60) + 25;
    } else if (level === 9) {
      num1 = Math.floor(Math.random() * 80) + 30; // 30 to 109
      num2 = Math.floor(Math.random() * 80) + 30;
    } else {
      // Level 10
      num1 = Math.floor(Math.random() * 100) + 40; // 40 to 139
      num2 = Math.floor(Math.random() * 100) + 40;
    }
    answer = num1 + num2;
  } else if (op === '-') {
    if (level === 1) {
      num2 = Math.floor(Math.random() * 8) + 2;
      num1 = num2 + Math.floor(Math.random() * 10) + 1; // ensure positive
    } else if (level === 2) {
      num2 = Math.floor(Math.random() * 12) + 3;
      num1 = num2 + Math.floor(Math.random() * 14) + 2;
    } else if (level === 3) {
      num2 = Math.floor(Math.random() * 18) + 5;
      num1 = num2 + Math.floor(Math.random() * 20) + 3;
    } else if (level === 4) {
      num2 = Math.floor(Math.random() * 22) + 6;
      num1 = num2 + Math.floor(Math.random() * 25) + 4;
    } else if (level === 5) {
      num2 = Math.floor(Math.random() * 26) + 8;
      num1 = num2 + Math.floor(Math.random() * 32) + 5;
    } else if (level === 6) {
      num2 = Math.floor(Math.random() * 30) + 10;
      num1 = num2 + Math.floor(Math.random() * 40) + 5;
    } else if (level === 7) {
      num2 = Math.floor(Math.random() * 38) + 12;
      num1 = num2 + Math.floor(Math.random() * 50) + 6;
    } else if (level === 8) {
      num2 = Math.floor(Math.random() * 48) + 15;
      num1 = num2 + Math.floor(Math.random() * 65) + 8;
    } else if (level === 9) {
      num2 = Math.floor(Math.random() * 60) + 18;
      num1 = num2 + Math.floor(Math.random() * 80) + 10;
    } else {
      // Level 10
      num2 = Math.floor(Math.random() * 75) + 25;
      num1 = num2 + Math.floor(Math.random() * 100) + 12;
    }
    answer = num1 - num2;
  } else if (op === '*') {
    if (level === 1) {
      num1 = Math.floor(Math.random() * 7) + 2; // 2 to 8
      num2 = Math.floor(Math.random() * 7) + 2;
    } else if (level === 2) {
      num1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
      num2 = Math.floor(Math.random() * 8) + 2;
    } else if (level === 3) {
      num1 = Math.floor(Math.random() * 9) + 3; // 3 to 11
      num2 = Math.floor(Math.random() * 9) + 3;
    } else if (level === 4) {
      num1 = Math.floor(Math.random() * 10) + 3; // 3 to 12
      num2 = Math.floor(Math.random() * 9) + 3;
    } else if (level === 5) {
      num1 = Math.floor(Math.random() * 11) + 4; // 4 to 14
      num2 = Math.floor(Math.random() * 9) + 3;
    } else if (level === 6) {
      num1 = Math.floor(Math.random() * 12) + 4; // 4 to 15
      num2 = Math.floor(Math.random() * 10) + 4;
    } else if (level === 7) {
      num1 = Math.floor(Math.random() * 14) + 5; // 5 to 18
      num2 = Math.floor(Math.random() * 11) + 4;
    } else if (level === 8) {
      num1 = Math.floor(Math.random() * 16) + 6; // 6 to 21
      num2 = Math.floor(Math.random() * 12) + 4;
    } else if (level === 9) {
      num1 = Math.floor(Math.random() * 18) + 7; // 7 to 24
      num2 = Math.floor(Math.random() * 13) + 5;
    } else {
      // Level 10
      num1 = Math.floor(Math.random() * 20) + 8; // 8 to 27
      num2 = Math.floor(Math.random() * 14) + 6;
    }
    answer = num1 * num2;
  } else if (op === '%') {
    if (level === 1) {
      num2 = Math.floor(Math.random() * 4) + 2; // 2 to 5
      num1 = Math.floor(Math.random() * 15) + 5; // 5 to 19
    } else if (level === 2) {
      num2 = Math.floor(Math.random() * 5) + 2; // 2 to 6
      num1 = Math.floor(Math.random() * 20) + 8;
    } else if (level === 3) {
      num2 = Math.floor(Math.random() * 6) + 3; // 3 to 8
      num1 = Math.floor(Math.random() * 25) + 10;
    } else if (level === 4) {
      num2 = Math.floor(Math.random() * 7) + 3; // 3 to 9
      num1 = Math.floor(Math.random() * 32) + 12;
    } else if (level === 5) {
      num2 = Math.floor(Math.random() * 8) + 4; // 4 to 11
      num1 = Math.floor(Math.random() * 40) + 15;
    } else if (level === 6) {
      num2 = Math.floor(Math.random() * 8) + 4;
      num1 = Math.floor(Math.random() * 50) + 18;
    } else if (level === 7) {
      num2 = Math.floor(Math.random() * 9) + 5;
      num1 = Math.floor(Math.random() * 65) + 22;
    } else if (level === 8) {
      num2 = Math.floor(Math.random() * 10) + 5;
      num1 = Math.floor(Math.random() * 80) + 25;
    } else if (level === 9) {
      num2 = Math.floor(Math.random() * 12) + 6;
      num1 = Math.floor(Math.random() * 100) + 30;
    } else {
      // Level 10
      num2 = Math.floor(Math.random() * 15) + 6;
      num1 = Math.floor(Math.random() * 120) + 35;
    }
    answer = num1 % num2;
  }

  // Generate 3 clever distractors for quick-tap mode
  const choicesSet = new Set([answer]);
  let offset = 1;
  while (choicesSet.size < 4) {
    const delta = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 4) + offset);
    const fake = answer + delta;
    if (fake >= 0) choicesSet.add(fake);
    offset++;
  }
  const choices = Array.from(choicesSet).sort(() => Math.random() - 0.5);

  return { num1, num2, op, answer, choices };
}

export const TargetNumberGameModal = ({
  visible,
  onClose,
  onSessionComplete,
}) => {
  const { user, addXp } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  // Game flow states: 'select_mode' | 'playing' | 'level_complete' | 'game_over'
  const [gameState, setGameState] = useState('select_mode');
  const [selectedOperator, setSelectedOperator] = useState('+');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [unlockedLevels, setUnlockedLevels] = useState({ '+': 1, '-': 1, '*': 1, '%': 1 });

  // Active round state
  const [sessionId, setSessionId] = useState(null);
  const [problems, setProblems] = useState([]);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState(null); // { type: 'correct' | 'wrong', text: string }
  const [answersHistory, setAnswersHistory] = useState([]);

  // Ground-truth timer & session tracking refs
  const timerRef = useRef(null);
  const endTimeRef = useRef(null);
  const sessionIdRef = useRef(null);
  const answersHistoryRef = useRef([]);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const userInputRef = useRef('');
  const isProcessingRef = useRef(false);

  // Sync ref and release processing lock whenever problem advances
  useEffect(() => {
    isProcessingRef.current = false;
  }, [currentProblemIdx]);

  const currentLevelConfig = LEVEL_CONFIGS[currentLevel] || LEVEL_CONFIGS[1];
  const currentProblem = problems[currentProblemIdx] || null;

  // 1. Restore active game session & load persistent unlocked levels progress
  useEffect(() => {
    let isMounted = true;
    if (!visible) return;

    async function checkAndRestoreSession() {
      try {
        const [saved, unlocked] = await Promise.all([
          GamePersistenceService.getActiveSession(user?.id),
          GamePersistenceService.getUnlockedLevels(user?.id),
        ]);
        if (!isMounted) return;

        if (unlocked) {
          setUnlockedLevels(unlocked);
        }

        if (saved && saved.status === 'in_progress' && Array.isArray(saved.problems) && saved.problems.length > 0) {
          const maxLimit = saved.timeLimit || 30;
          const remaining = GamePersistenceService.calculateRemainingSeconds(saved.endTime, maxLimit);

          endTimeRef.current = saved.endTime;
          sessionIdRef.current = saved.sessionId;
          answersHistoryRef.current = saved.answersHistory || [];

          setSessionId(saved.sessionId);
          setProblems(saved.problems);
          setCurrentProblemIdx(saved.currentProblemIdx || 0);
          setSelectedOperator(saved.operator || '+');
          setCurrentLevel(saved.level || 1);
          setScore(saved.score || 0);
          setCombo(saved.combo || 0);
          userInputRef.current = saved.userInput || '';
          setUserInput(saved.userInput || '');
          setAnswersHistory(saved.answersHistory || []);

          if (remaining > 0) {
            setTimeLeft(remaining);
            setGameState('playing');
          } else {
            // 30 seconds have elapsed while player was away
            setTimeLeft(0);
            setGameState('game_over');
            await GamePersistenceService.updateActiveSession(user?.id, {
              status: 'game_over',
              endedAt: new Date().toISOString(),
            });
          }
        } else if (unlocked) {
          // Adjust level if exceeding unlocked bound for current operator
          const opUnlocked = unlocked[selectedOperator] || 1;
          if (currentLevel > opUnlocked) {
            setCurrentLevel(Math.min(10, opUnlocked));
          }
        }
      } catch (err) {
        console.warn('Error restoring Target Number session or levels:', err);
      }
    }

    checkAndRestoreSession();

    return () => {
      isMounted = false;
    };
  }, [visible, user?.id]);

  // 2. Start a fresh level with absolute 30-second end timestamp
  const startLevel = useCallback(
    async (lvl, op) => {
      const config = LEVEL_CONFIGS[lvl] || LEVEL_CONFIGS[1];
      const generated = [];
      for (let i = 0; i < config.totalQuestions; i++) {
        generated.push(generateProblem(op, lvl));
      }

      const now = Date.now();
      const endTime = now + config.timeLimit * 1000;
      const newSessionId = GamePersistenceService.createSessionId();

      endTimeRef.current = endTime;
      sessionIdRef.current = newSessionId;
      answersHistoryRef.current = [];

      setSessionId(newSessionId);
      setProblems(generated);
      setCurrentProblemIdx(0);
      userInputRef.current = '';
      setUserInput('');
      setTimeLeft(config.timeLimit);
      setScore(0);
      setCombo(0);
      setFeedback(null);
      setSelectedOperator(op);
      setCurrentLevel(lvl);
      setAnswersHistory([]);
      setGameState('playing');

      // Persist complete session to persistent storage immediately
      const sessionData = {
        sessionId: newSessionId,
        userId: user?.id || 'guest',
        gameId: 'g_target_no',
        gameTitle: 'Target Number',
        gameMode: 'Speed Math Rush',
        level: lvl,
        operator: op,
        totalQuestions: config.totalQuestions,
        timeLimit: config.timeLimit,
        startTime: now,
        endTime: endTime,
        startedAt: new Date(now).toISOString(),
        status: 'in_progress',
        currentProblemIdx: 0,
        problems: generated,
        score: 0,
        combo: 0,
        userInput: '',
        answersHistory: [],
      };

      await GamePersistenceService.saveActiveSession(user?.id, sessionData);
    },
    [user?.id]
  );

  // 3. Absolute Ground-Truth Timer Hook (resumes smoothly across foreground/background)
  useEffect(() => {
    if (gameState === 'playing' && endTimeRef.current) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const syncTimer = () => {
        if (!endTimeRef.current) return;
        const remaining = GamePersistenceService.calculateRemainingSeconds(
          endTimeRef.current,
          currentLevelConfig.timeLimit
        );
        setTimeLeft(remaining);

        if (remaining <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setGameState('game_over');
          GamePersistenceService.updateActiveSession(user?.id, {
            status: 'game_over',
            endedAt: new Date().toISOString(),
          });
        }
      };

      syncTimer();
      timerRef.current = setInterval(syncTimer, 250);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, currentLevelConfig.timeLimit, user?.id]);

  // 4. AppState listener for React Native (Android / iOS app switches and Home key)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // Returning to PIXO from background
        if (gameState === 'playing' && endTimeRef.current) {
          const remaining = GamePersistenceService.calculateRemainingSeconds(
            endTimeRef.current,
            currentLevelConfig.timeLimit
          );
          setTimeLeft(remaining);
          if (remaining <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setGameState('game_over');
            GamePersistenceService.updateActiveSession(user?.id, {
              status: 'game_over',
              endedAt: new Date().toISOString(),
            });
          }
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // Leaving PIXO: preserve full state immediately
        if (gameState === 'playing') {
          GamePersistenceService.updateActiveSession(user?.id, {
            score,
            combo,
            currentProblemIdx,
            userInput,
            answersHistory: answersHistoryRef.current,
          });
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [gameState, currentLevelConfig.timeLimit, user?.id, score, combo, currentProblemIdx, userInput]);

  // 5. Web lifecycle listeners for visibility changes, tab switching, and focus/blur
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (!document.hidden && gameState === 'playing' && endTimeRef.current) {
          const remaining = GamePersistenceService.calculateRemainingSeconds(
            endTimeRef.current,
            currentLevelConfig.timeLimit
          );
          setTimeLeft(remaining);
          if (remaining <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setGameState('game_over');
            GamePersistenceService.updateActiveSession(user?.id, {
              status: 'game_over',
              endedAt: new Date().toISOString(),
            });
          }
        } else if (document.hidden && gameState === 'playing') {
          GamePersistenceService.updateActiveSession(user?.id, {
            score,
            combo,
            currentProblemIdx,
            userInput,
            answersHistory: answersHistoryRef.current,
          });
        }
      };

      const handleFocus = () => {
        if (gameState === 'playing' && endTimeRef.current) {
          const remaining = GamePersistenceService.calculateRemainingSeconds(
            endTimeRef.current,
            currentLevelConfig.timeLimit
          );
          setTimeLeft(remaining);
          if (remaining <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setGameState('game_over');
            GamePersistenceService.updateActiveSession(user?.id, {
              status: 'game_over',
              endedAt: new Date().toISOString(),
            });
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [gameState, currentLevelConfig.timeLimit, user?.id, score, combo, currentProblemIdx, userInput]);

  // 6. Handle submitting an answer (via quick-tap choice or numpad input)
  const handleCheckAnswer = useCallback(
    async (valueToTest) => {
      if (!currentProblem || gameState !== 'playing') return;
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      const numVal = parseInt(valueToTest, 10);
      const isCorrect = numVal === currentProblem.answer;

      if (isCorrect) {
        const timeBonus = timeLeft * 10;
        const comboBonus = combo * 25;
        const points = 100 + timeBonus + comboBonus;
        const newScore = score + points;
        const newCombo = combo + 1;
        setScore(newScore);
        setCombo(newCombo);
        setFeedback({ type: 'correct', text: `+${points} PTS!` });

        const updatedHistory = [
          ...answersHistoryRef.current,
          { problemIdx: currentProblemIdx, answer: numVal, isCorrect: true, points },
        ];
        answersHistoryRef.current = updatedHistory;
        setAnswersHistory(updatedHistory);

        // Advance question or complete level
        const nextIdx = currentProblemIdx + 1;
        userInputRef.current = '';
        setUserInput('');

        if (nextIdx >= currentLevelConfig.totalQuestions) {
          // LEVEL COMPLETED!
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setGameState('level_complete');

          // Archive completed session
          await GamePersistenceService.archiveSession(user?.id, {
            sessionId: sessionIdRef.current,
            userId: user?.id,
            gameId: 'g_target_no',
            level: currentLevel,
            operator: selectedOperator,
            score: newScore,
            status: 'completed',
            totalQuestions: currentLevelConfig.totalQuestions,
            timeRemaining: timeLeft,
            answersHistory: updatedHistory,
            completedAt: new Date().toISOString(),
          });

          // Award XP and coins to user session
          const xpEarned = currentLevelConfig.xpReward;
          if (addXp) {
            await addXp(xpEarned);
          }

          // Record session in activity service
          if (user?.id) {
            try {
              const sess = await GamingActivityService.startSession(user.id, {
                id: `target_no_lvl${currentLevel}`,
                title: `Target Number — Level ${currentLevel}`,
                category: 'Math Speed Challenge',
                icon: 'calculator',
              });
              await GamingActivityService.completeSession(user.id, sess.id, {
                difficulty: currentLevel,
                score: newScore,
                durationSeconds: currentLevelConfig.timeLimit - timeLeft,
                result: `Victory — Level ${currentLevel} Cleared`,
                achievements: [`Target No. Level ${currentLevel} Winner`],
              });
            } catch (e) {
              console.warn('Error recording game session:', e);
            }
          }

          if (onSessionComplete) onSessionComplete();
        } else {
          setCurrentProblemIdx(nextIdx);
          // Persist progress update to storage
          await GamePersistenceService.updateActiveSession(user?.id, {
            currentProblemIdx: nextIdx,
            score: newScore,
            combo: newCombo,
            userInput: '',
            answersHistory: updatedHistory,
          });
        }
      } else {
        // Wrong answer
        setCombo(0);
        setFeedback({ type: 'wrong', text: `Incorrect! (${currentProblem.answer})` });
        userInputRef.current = '';
        setUserInput('');
        isProcessingRef.current = false;

        const updatedHistory = [
          ...answersHistoryRef.current,
          { problemIdx: currentProblemIdx, answer: numVal, isCorrect: false, points: 0 },
        ];
        answersHistoryRef.current = updatedHistory;
        setAnswersHistory(updatedHistory);

        await GamePersistenceService.updateActiveSession(user?.id, {
          combo: 0,
          userInput: '',
          answersHistory: updatedHistory,
        });
      }

      setTimeout(() => setFeedback(null), 800);
    },
    [currentProblem, currentLevelConfig, currentProblemIdx, gameState, timeLeft, combo, score, addXp, user?.id, currentLevel, selectedOperator, onSessionComplete]
  );

  // Keypad number press with Instant Auto-Submit when correct answer is entered
  const handleNumpadPress = useCallback(
    (digit) => {
      if (gameState !== 'playing' || !currentProblem) return;
      if (isProcessingRef.current) return;

      const currentVal = userInputRef.current;
      if (currentVal.length >= 5) return;

      const nextVal = currentVal === '0' ? digit : currentVal + digit;
      userInputRef.current = nextVal;
      setUserInput(nextVal);

      // Auto-submit immediately if the entered number matches the problem answer
      const numVal = parseInt(nextVal, 10);
      if (!isNaN(numVal) && numVal === currentProblem.answer) {
        handleCheckAnswer(nextVal);
      }
    },
    [gameState, currentProblem, handleCheckAnswer]
  );

  const handleNumpadDelete = useCallback(() => {
    if (gameState !== 'playing') return;
    const nextVal = userInputRef.current.slice(0, -1);
    userInputRef.current = nextVal;
    setUserInput(nextVal);
  }, [gameState]);

  const handleNumpadSubmit = useCallback(() => {
    if (gameState !== 'playing' || !currentProblem) return;
    if (isProcessingRef.current) return;
    const val = userInputRef.current;
    if (val.trim() !== '') {
      handleCheckAnswer(val);
    }
  }, [gameState, currentProblem, handleCheckAnswer]);

  // Explicit action to clear active session and return to select mode
  const handleBackToMenu = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await GamePersistenceService.clearActiveSession(user?.id);
    sessionIdRef.current = null;
    endTimeRef.current = null;
    setGameState('select_mode');
  }, [user?.id]);

  // Modal Close: preserve in-progress session, or clear if completed/expired
  const handleModalClose = useCallback(() => {
    if (gameState === 'level_complete' || gameState === 'game_over') {
      GamePersistenceService.clearActiveSession(user?.id);
      sessionIdRef.current = null;
      endTimeRef.current = null;
      setGameState('select_mode');
    }
    onClose();
  }, [gameState, onClose, user?.id]);

  // Keyboard support on Web
  useEffect(() => {
    if (Platform.OS === 'web' && gameState === 'playing' && typeof window !== 'undefined') {
      const handleKeyDown = (e) => {
        if (e.key >= '0' && e.key <= '9') {
          handleNumpadPress(e.key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          handleNumpadDelete();
        } else if (e.key === 'Enter') {
          handleNumpadSubmit();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [gameState, handleNumpadPress, handleNumpadDelete, handleNumpadSubmit]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleModalClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.gameCardContainer, isMobile && styles.gameCardMobile]}>
          <LinearGradient
            colors={['#0F1E14', '#08110B', '#050A07']}
            style={styles.modalGradient}
          >
            {/* Top Game Bar */}
            <View style={styles.topGameBar}>
              <View style={styles.gameTitleWrap}>
                <View style={styles.gameIconBadge}>
                  <Ionicons name="calculator" size={20} color="#39FF14" />
                </View>
                <View>
                  <Text style={styles.gameModalTitle}>TARGET NUMBER</Text>
                  <Text style={styles.gameModalSub}>30-SECOND CALCULATION RUSH</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleModalClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* SCREEN 1: SELECT OPERATOR & LEVEL */}
            {gameState === 'select_mode' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.selectModeContent}>
                <Text style={styles.sectionHeaderTitle}>1. CHOOSE YOUR OPERATOR</Text>
                <Text style={styles.sectionHeaderSub}>
                  Select the calculation mode: Addition (+), Subtraction (-), Multiplication (*), or Modulus (%)
                </Text>

                <View style={styles.operatorGrid}>
                  {OPERATORS.map((op) => {
                    const isSelected = selectedOperator === op.id;
                    return (
                      <TouchableOpacity
                        key={op.id}
                        style={[
                          styles.operatorCard,
                          isSelected && { borderColor: op.color, backgroundColor: 'rgba(57, 255, 20, 0.12)' },
                        ]}
                        onPress={() => setSelectedOperator(op.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.operatorSymbolCircle, { backgroundColor: `${op.color}22`, borderColor: op.color }]}>
                          <Text style={[styles.operatorSymbolText, { color: op.color }]}>{op.symbol}</Text>
                        </View>
                        <Text style={styles.operatorLabel}>{op.label}</Text>
                        <Text style={styles.operatorDesc}>{op.desc}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.sectionHeaderTitle, { marginTop: 18 }]}>2. SELECT LEVEL</Text>
                <View style={styles.levelSelectorRow}>
                  {[1, 2, 3].map((lvl) => {
                    const cfg = LEVEL_CONFIGS[lvl];
                    const isSelected = currentLevel === lvl;
                    return (
                      <TouchableOpacity
                        key={lvl}
                        style={[
                          styles.levelPill,
                          isSelected && styles.levelPillActive,
                        ]}
                        onPress={() => setCurrentLevel(lvl)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.levelPillTitle, isSelected && styles.levelPillTitleActive]}>
                          LEVEL {lvl}
                        </Text>
                        <Text style={[styles.levelPillSub, isSelected && styles.levelPillSubActive]}>
                          {cfg.totalQuestions} Values in {cfg.timeLimit}s
                        </Text>
                        <View style={styles.levelXpBadge}>
                          <Text style={styles.levelXpText}>+{cfg.xpReward} XP</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Start Button */}
                <TouchableOpacity
                  style={styles.startGameBtn}
                  onPress={() => startLevel(currentLevel, selectedOperator)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#39FF14', '#00E5FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.startGameBtnGradient}
                  >
                    <Ionicons name="play" size={18} color="#050705" style={{ marginRight: 8 }} />
                    <Text style={styles.startGameBtnText}>
                      START LEVEL {currentLevel} ({currentLevelConfig.totalQuestions} VALUES • 30 SECONDS)
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* SCREEN 2: ACTIVE PLAYING */}
            {gameState === 'playing' && currentProblem && (
              <View style={styles.playingContainer}>
                {/* HUD Header */}
                <View style={styles.hudRow}>
                  <View style={styles.hudBadge}>
                    <Text style={styles.hudBadgeLabel}>LEVEL</Text>
                    <Text style={styles.hudBadgeValue}>{currentLevel} / 3</Text>
                  </View>

                  <View style={styles.hudBadge}>
                    <Text style={styles.hudBadgeLabel}>PROGRESS</Text>
                    <Text style={styles.hudBadgeValue}>
                      {currentProblemIdx + 1} / {currentLevelConfig.totalQuestions}
                    </Text>
                  </View>

                  {/* 30s Countdown Timer */}
                  <View style={[styles.timerBadge, timeLeft <= 5 && styles.timerBadgeWarning]}>
                    <Ionicons
                      name="timer-outline"
                      size={16}
                      color={timeLeft <= 5 ? '#FF3B30' : timeLeft <= 12 ? '#FF6A00' : '#39FF14'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.timerValue, timeLeft <= 5 && styles.timerValueWarning]}>
                      {timeLeft}s
                    </Text>
                  </View>

                  <View style={styles.hudBadge}>
                    <Text style={styles.hudBadgeLabel}>SCORE</Text>
                    <Text style={styles.hudBadgeValue}>{score}</Text>
                  </View>
                </View>

                {/* 30-Second Animated Progress Track */}
                <View style={styles.timerTrack}>
                  <View
                    style={[
                      styles.timerFill,
                      {
                        width: `${(timeLeft / currentLevelConfig.timeLimit) * 100}%`,
                        backgroundColor: timeLeft <= 5 ? '#FF3B30' : timeLeft <= 12 ? '#FF6A00' : '#39FF14',
                      },
                    ]}
                  />
                </View>

                {/* Calculation Target Equation Box */}
                <View style={styles.equationCard}>
                  <View style={styles.equationEyebrowRow}>
                    <Text style={styles.equationEyebrow}>
                      CALCULATE TARGET VALUE #{currentProblemIdx + 1} OF {currentLevelConfig.totalQuestions}
                    </Text>
                    <View style={styles.autoSubmitPill}>
                      <Ionicons name="flash" size={10} color="#39FF14" style={{ marginRight: 3 }} />
                      <Text style={styles.autoSubmitPillText}>AUTO-SUBMIT ON CORRECT</Text>
                    </View>
                  </View>
                  <View style={styles.equationRow}>
                    <Text style={styles.equationNumber}>{currentProblem.num1}</Text>
                    <Text style={styles.equationOperator}>
                      {currentProblem.op === '*' ? '×' : currentProblem.op}
                    </Text>
                    <Text style={styles.equationNumber}>{currentProblem.num2}</Text>
                    <Text style={styles.equationEquals}>=</Text>
                    <View style={[styles.equationAnswerTarget, userInput.length > 0 && styles.equationAnswerTargetActive]}>
                      <Text style={styles.equationAnswerTargetText}>
                        {userInput.length > 0 ? userInput : '?'}
                      </Text>
                    </View>
                  </View>

                  {feedback && (
                    <View
                      style={[
                        styles.feedbackBadge,
                        feedback.type === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong,
                      ]}
                    >
                      <Ionicons
                        name={feedback.type === 'correct' ? 'checkmark-circle' : 'close-circle'}
                        size={16}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.feedbackText}>{feedback.text}</Text>
                    </View>
                  )}
                </View>

                {/* QUICK-TAP OPTIONS (Speed solver buttons) */}
                <View style={styles.quickChoicesSection}>
                  <Text style={styles.quickChoicesLabel}>QUICK TAP OPTIONS:</Text>
                  <View style={styles.quickChoicesRow}>
                    {currentProblem.choices.map((choice, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.choiceBtn}
                        onPress={() => handleCheckAnswer(choice)}
                        activeOpacity={0.75}
                      >
                        <LinearGradient
                          colors={['#172B1E', '#0D1711']}
                          style={styles.choiceBtnGradient}
                        >
                          <Text style={styles.choiceBtnText}>{choice}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* COMPACT NUMPAD */}
                <View style={styles.numpadContainer}>
                  <View style={styles.numpadRow}>
                    {['1', '2', '3', '4', '5'].map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={styles.numpadKey}
                        onPress={() => handleNumpadPress(d)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.numpadKeyText}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.numpadRow}>
                    {['6', '7', '8', '9', '0'].map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={styles.numpadKey}
                        onPress={() => handleNumpadPress(d)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.numpadKeyText}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.numpadRow}>
                    <TouchableOpacity
                      style={[styles.numpadKey, styles.numpadKeyDel]}
                      onPress={handleNumpadDelete}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="backspace-outline" size={18} color="#FF6A00" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.numpadKey, styles.numpadKeyEnter]}
                      onPress={handleNumpadSubmit}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.numpadKeyEnterText}>SUBMIT ↵</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* SCREEN 3: LEVEL COMPLETE VICTORY */}
            {gameState === 'level_complete' && (
              <View style={styles.endScreenContainer}>
                <View style={styles.victoryIconWrap}>
                  <Ionicons name="trophy" size={54} color="#39FF14" />
                </View>
                <Text style={styles.victoryTitle}>LEVEL {currentLevel} CLEARED! 🏆</Text>
                <Text style={styles.victorySubtitle}>
                  All {currentLevelConfig.totalQuestions} values successfully calculated in 30 seconds!
                </Text>

                <View style={styles.victoryStatsBox}>
                  <View style={styles.victoryStatRow}>
                    <Text style={styles.victoryStatLabel}>Calculations Completed:</Text>
                    <Text style={styles.victoryStatValue}>
                      {currentLevelConfig.totalQuestions} / {currentLevelConfig.totalQuestions} ✓
                    </Text>
                  </View>
                  <View style={styles.victoryStatRow}>
                    <Text style={styles.victoryStatLabel}>Time Remaining:</Text>
                    <Text style={styles.victoryStatValue}>{timeLeft}s remaining</Text>
                  </View>
                  <View style={styles.victoryStatRow}>
                    <Text style={styles.victoryStatLabel}>Score Earned:</Text>
                    <Text style={styles.victoryStatValue}>{score} PTS</Text>
                  </View>
                  <View style={styles.victoryStatRow}>
                    <Text style={styles.victoryStatLabel}>XP Bonus Awarded:</Text>
                    <Text style={[styles.victoryStatValue, { color: '#39FF14' }]}>
                      +{currentLevelConfig.xpReward} XP
                    </Text>
                  </View>
                </View>

                {/* Actions: Advance Level or Replay */}
                <View style={styles.endActionsRow}>
                  {currentLevel < 3 ? (
                    <TouchableOpacity
                      style={styles.nextLevelBtn}
                      onPress={() => {
                        const nextLvl = currentLevel + 1;
                        setCurrentLevel(nextLvl);
                        startLevel(nextLvl, selectedOperator);
                      }}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#39FF14', '#00E5FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.endActionGradient}
                      >
                        <Text style={styles.endActionText}>
                          ADVANCE TO LEVEL {currentLevel + 1} ({LEVEL_CONFIGS[currentLevel + 1].totalQuestions} VALUES IN 30s) →
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.championBadge}>
                      <Text style={styles.championBadgeText}>👑 ALL 3 TARGET NUMBER LEVELS MASTERED!</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.replayBtn}
                    onPress={handleBackToMenu}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.replayBtnText}>CHANGE OPERATOR / MODE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* SCREEN 4: GAME OVER / TIME EXPIRED */}
            {gameState === 'game_over' && (
              <View style={styles.endScreenContainer}>
                <View style={[styles.victoryIconWrap, { borderColor: '#FF3B30', backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
                  <Ionicons name="time" size={54} color="#FF3B30" />
                </View>
                <Text style={[styles.victoryTitle, { color: '#FF3B30' }]}>30 SECONDS EXPIRED!</Text>
                <Text style={styles.victorySubtitle}>
                  You solved {currentProblemIdx} of {currentLevelConfig.totalQuestions} values before the clock ran out.
                </Text>

                <View style={styles.victoryStatsBox}>
                  <View style={styles.victoryStatRow}>
                    <Text style={styles.victoryStatLabel}>Values Solved:</Text>
                    <Text style={styles.victoryStatValue}>
                      {currentProblemIdx} / {currentLevelConfig.totalQuestions}
                    </Text>
                  </View>
                  <View style={styles.victoryStatRow}>
                    <Text style={styles.victoryStatLabel}>Score:</Text>
                    <Text style={styles.victoryStatValue}>{score} PTS</Text>
                  </View>
                </View>

                <View style={styles.endActionsRow}>
                  <TouchableOpacity
                    style={styles.nextLevelBtn}
                    onPress={() => startLevel(currentLevel, selectedOperator)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#FF6A00', '#FF3B30']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.endActionGradient}
                    >
                      <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={[styles.endActionText, { color: '#FFFFFF' }]}>
                        TRY LEVEL {currentLevel} AGAIN (30 SECONDS)
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.replayBtn}
                    onPress={handleBackToMenu}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.replayBtnText}>BACK TO MENU</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  gameCardContainer: {
    width: '100%',
    maxWidth: 680,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.35)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9), 0 0 25px rgba(57, 255, 20, 0.18)',
        }
      : {}),
  },
  gameCardMobile: {
    maxWidth: '100%',
  },
  modalGradient: {
    padding: 20,
  },
  topGameBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 255, 20, 0.15)',
    paddingBottom: 14,
    marginBottom: 16,
  },
  gameTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  gameModalTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    ...(Platform.OS === 'web' ? { fontFamily: "'Space Grotesk', sans-serif" } : {}),
  },
  gameModalSub: {
    color: colors.textSecondary,
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  selectModeContent: {
    paddingBottom: 10,
  },
  sectionHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionHeaderSub: {
    color: colors.textSecondary,
    fontSize: 11.5,
    marginBottom: 12,
  },
  operatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  operatorCard: {
    flex: 1,
    minWidth: 135,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.2s ease' } : {}),
  },
  operatorSymbolCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  operatorSymbolText: {
    fontSize: 22,
    fontWeight: '900',
  },
  operatorLabel: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
  },
  operatorDesc: {
    color: colors.textSecondary,
    fontSize: 9.5,
    textAlign: 'center',
  },
  levelSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  levelPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.2s ease' } : {}),
  },
  levelPillActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 12px rgba(57, 255, 20, 0.25)' } : {}),
  },
  levelPillTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  levelPillTitleActive: {
    color: colors.primary,
  },
  levelPillSub: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 6,
  },
  levelPillSubActive: {
    color: '#FFFFFF',
  },
  levelXpBadge: {
    backgroundColor: 'rgba(57, 255, 20, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelXpText: {
    color: colors.primary,
    fontSize: 9.5,
    fontWeight: '800',
  },
  startGameBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(57, 255, 20, 0.35)',
        }
      : {}),
  },
  startGameBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  startGameBtnText: {
    color: '#050705',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  playingContainer: {
    paddingVertical: 6,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hudBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  hudBadgeLabel: {
    color: colors.textSecondary,
    fontSize: 8.5,
    fontWeight: '800',
  },
  hudBadgeValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  timerBadgeWarning: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderColor: '#FF3B30',
  },
  timerValue: {
    color: '#39FF14',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timerValueWarning: {
    color: '#FF3B30',
  },
  timerTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  timerFill: {
    height: '100%',
    borderRadius: 3,
  },
  equationCard: {
    backgroundColor: '#0A150D',
    borderWidth: 2,
    borderColor: 'rgba(57, 255, 20, 0.35)',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 20px rgba(57, 255, 20, 0.12)',
        }
      : {}),
  },
  equationEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  autoSubmitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  autoSubmitPillText: {
    color: '#39FF14',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  equationEyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  equationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  equationNumber: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
  },
  equationOperator: {
    color: colors.electricOrange,
    fontSize: 34,
    fontWeight: '900',
  },
  equationEquals: {
    color: colors.textSecondary,
    fontSize: 34,
    fontWeight: '900',
  },
  equationAnswerTarget: {
    minWidth: 64,
    height: 52,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  equationAnswerTargetActive: {
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.28)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 12px rgba(57, 255, 20, 0.4)',
        }
      : {}),
  },
  equationAnswerTargetText: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
  },
  feedbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
  },
  feedbackCorrect: {
    backgroundColor: 'rgba(57, 255, 20, 0.25)',
    borderWidth: 1,
    borderColor: '#39FF14',
  },
  feedbackWrong: {
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  feedbackText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  quickChoicesSection: {
    marginBottom: 14,
  },
  quickChoicesLabel: {
    color: colors.textSecondary,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  quickChoicesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceBtn: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.35)',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 0 10px rgba(57, 255, 20, 0.12)',
          transition: 'all 0.15s ease',
        }
      : {}),
  },
  choiceBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  numpadContainer: {
    gap: 6,
  },
  numpadRow: {
    flexDirection: 'row',
    gap: 6,
  },
  numpadKey: {
    flex: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  numpadKeyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  numpadKeyDel: {
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    borderColor: 'rgba(255, 106, 0, 0.35)',
  },
  numpadKeyEnter: {
    flex: 4,
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
    borderColor: colors.primary,
  },
  numpadKeyEnterText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  endScreenContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  victoryIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 25px rgba(57, 255, 20, 0.4)' } : {}),
  },
  victoryTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  victorySubtitle: {
    color: colors.textSecondary,
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 420,
  },
  victoryStatsBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    gap: 8,
  },
  victoryStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  victoryStatLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  victoryStatValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  endActionsRow: {
    width: '100%',
    gap: 10,
  },
  nextLevelBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', boxShadow: '0 0 20px rgba(57, 255, 20, 0.35)' } : {}),
  },
  endActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  endActionText: {
    color: '#050705',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  championBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 6,
  },
  championBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  replayBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  replayBtnText: {
    color: colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
