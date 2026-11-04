import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import {
  LOGIC_CODE_CATEGORIES,
  LogicCodeQuestionService,
  isValidOperatorSolution,
  generateBODMASExplanation,
} from '../../services/logicCodeQuestionService';
import {
  LogicCodePersistenceService,
  LOGIC_CODE_BADGES,
} from '../../services/logicCodePersistenceService';
import { useAuth } from '../../context/AuthContext';
import { PixoBackButton, PixoPauseModal } from '../common';
import { NavigationService } from '../../services/navigationService';

export const LogicCodeGameModal = ({
  visible,
  initialCategory = null,
  initialLevel = 1,
  onClose,
  onSessionComplete,
}) => {
  const { user, addXp } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 680;

  // Screen state: 'dashboard' | 'category_levels' | 'playing' | 'level_complete' | 'progress_dashboard'
  const [screen, setScreen] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState(LOGIC_CODE_CATEGORIES[0]);
  const [selectedLevel, setSelectedLevel] = useState(initialLevel || 1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [activeResumeSession, setActiveResumeSession] = useState(null);

  // Active Gameplay State
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const frozenTimeLeftRef = useRef(45);
  const [userSelection, setUserSelection] = useState(null); // For multiple choice / classification
  const [placedOperators, setPlacedOperators] = useState([]); // For missing operator [box0, box1, ...]
  const [activeBoxIdx, setActiveBoxIdx] = useState(0); // Focused operator box
  const [isUntimed, setIsUntimed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [hintUsedForQuestion, setHintUsedForQuestion] = useState(false);
  const [feedback, setFeedback] = useState(null); // { isCorrect, explanation, earnedXp, answer }
  const [answersHistory, setAnswersHistory] = useState([]);
  const [levelVictoryData, setLevelVictoryData] = useState(null);

  const timerRef = useRef(null);

  // Lock background scrolling on Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (visible) {
        const orig = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = orig || '';
        };
      }
    }
  }, [visible]);

  // Load user progress, unlocked level, and active unfinished session
  const refreshUserProgress = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [unlocked, completed, stats, resume] = await Promise.all([
        LogicCodePersistenceService.getUnlockedLevel(user.id),
        LogicCodePersistenceService.getCompletedLevels(user.id),
        LogicCodePersistenceService.getStats(user.id),
        LogicCodePersistenceService.getActiveSession(user.id),
      ]);
      setUnlockedLevel(unlocked);
      setCompletedLevels(completed);
      setPlayerStats(stats);
      setActiveResumeSession(resume);
    } catch (err) {
      console.warn('Error loading Logic Code progress:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (visible) {
      refreshUserProgress();
      if (initialCategory) {
        const found = LOGIC_CODE_CATEGORIES.find((c) => c.id === initialCategory);
        if (found) setSelectedCategory(found);
      }
    }
  }, [visible, initialCategory, refreshUserProgress]);

  // -------------------------------------------------------------------------
  // Timer Management
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (screen === 'playing' && !isUntimed && feedback === null) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, isUntimed, feedback]);

  const handleTimeExpired = () => {
    // Time expired for this question: mark incorrect and show explanation
    const currentQ = questions[currentQuestionIdx];
    if (!currentQ) return;
    handleSubmitAnswer(null, true);
  };

  // -------------------------------------------------------------------------
  // Game Session Actions (Start / Resume / Save)
  // -------------------------------------------------------------------------
  const startLevel = async (levelNum) => {
    const num = Number(levelNum);
    if (num > unlockedLevel) {
      Alert.alert('🔒 Level Locked', `Complete Level ${num - 1} first to unlock Level ${num}!`);
      return;
    }

    const generated = LogicCodeQuestionService.generateLevelQuestions(num);
    const initialPlacedOps = generated[0]?.type === 'missing_operator' ? Array(generated[0].opCount).fill(null) : [];

    setSelectedLevel(num);
    setQuestions(generated);
    setCurrentQuestionIdx(0);
    setUserSelection(null);
    setPlacedOperators(initialPlacedOps);
    setActiveBoxIdx(0);
    setTimeLeft(45);
    setScore(0);
    setEarnedXp(0);
    setCorrectCount(0);
    setIsHintOpen(false);
    setHintUsedForQuestion(false);
    setFeedback(null);
    setAnswersHistory([]);
    setLevelVictoryData(null);
    setScreen('playing');

    // Save initial session state
    if (user?.id) {
      await LogicCodePersistenceService.saveActiveSession(user.id, {
        level: num,
        category: selectedCategory.id,
        questions: generated,
        currentQuestionIdx: 0,
        score: 0,
        earnedXp: 0,
        correctCount: 0,
        answersHistory: [],
        status: 'in_progress',
      });
      setActiveResumeSession(null);
    }
  };

  const resumeGame = async () => {
    if (!activeResumeSession) return;
    const sess = activeResumeSession;
    const cat = LOGIC_CODE_CATEGORIES.find((c) => c.id === sess.category) || selectedCategory;

    setSelectedCategory(cat);
    setSelectedLevel(sess.level);
    setQuestions(sess.questions);
    setCurrentQuestionIdx(sess.currentQuestionIdx || 0);
    setUserSelection(null);
    const q = sess.questions[sess.currentQuestionIdx || 0];
    setPlacedOperators(q?.type === 'missing_operator' ? Array(q.opCount).fill(null) : []);
    setActiveBoxIdx(0);
    setTimeLeft(sess.timeLeft || 45);
    setScore(sess.score || 0);
    setEarnedXp(sess.earnedXp || 0);
    setCorrectCount(sess.correctCount || 0);
    setIsHintOpen(false);
    setHintUsedForQuestion(false);
    setFeedback(null);
    setAnswersHistory(sess.answersHistory || []);
    setScreen('playing');
  };

  const dismissResumeGame = async () => {
    if (user?.id) {
      await LogicCodePersistenceService.clearActiveSession(user.id);
      setActiveResumeSession(null);
    }
  };

  // -------------------------------------------------------------------------
  // Question Answering & Verification
  // -------------------------------------------------------------------------
  const handleSubmitAnswer = async (forcedSelection = null, isTimeout = false) => {
    const currentQ = questions[currentQuestionIdx];
    if (!currentQ) return;

    let isCorrect = false;
    let givenAnswer = null;

    if (isTimeout) {
      isCorrect = false;
      givenAnswer = 'Time Expired';
    } else if (currentQ.type === 'missing_operator') {
      const ops = placedOperators;
      if (ops.includes(null)) {
        Alert.alert('Incomplete Equation', 'Please place all missing mathematical operators in the boxes.');
        return;
      }
      const opMap = { '+': '+', '−': '-', '×': '*', '÷': '/' };
      const mathOps = ops.map((op) => opMap[op] || op);
      isCorrect = isValidOperatorSolution(currentQ.numbers, mathOps, currentQ.target);
      givenAnswer = ops.join('  ');
    } else {
      const choice = forcedSelection !== null ? forcedSelection : userSelection;
      if (choice === null) {
        Alert.alert('Selection Required', 'Please choose an answer option to submit.');
        return;
      }
      isCorrect = String(choice) === String(currentQ.correctAnswer);
      givenAnswer = choice;
    }

    // Reward calculation: +10 XP for correct, +5 XP no-hint bonus
    let xpGain = 0;
    if (isCorrect) {
      xpGain = 10;
      if (!hintUsedForQuestion) {
        xpGain += 5; // 5 XP no-hint bonus
      }
    }

    const points = isCorrect ? Math.floor(800 + (timeLeft > 0 ? timeLeft * 10 : 0)) : 0;
    const newScore = score + points;
    const newEarnedXp = earnedXp + xpGain;
    const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;

    setScore(newScore);
    setEarnedXp(newEarnedXp);
    setCorrectCount(newCorrectCount);

    const resultRecord = {
      questionIdx: currentQuestionIdx,
      isCorrect,
      givenAnswer,
      correctAnswer: currentQ.correctAnswer || currentQ.validSolutions?.[0]?.join('  '),
      xpGain,
      explanation: currentQ.explanation,
    };

    const newHistory = [...answersHistory, resultRecord];
    setAnswersHistory(newHistory);

    // Record question attempt in persistent stats
    if (user?.id) {
      await LogicCodePersistenceService.recordQuestionAttempt(user.id, {
        isCorrect,
        timeSeconds: 45 - timeLeft,
        xpEarned: xpGain,
      });

      // Update resume state
      await LogicCodePersistenceService.saveActiveSession(user.id, {
        level: selectedLevel,
        category: selectedCategory.id,
        questions,
        currentQuestionIdx: currentQuestionIdx + 1,
        score: newScore,
        earnedXp: newEarnedXp,
        correctCount: newCorrectCount,
        answersHistory: newHistory,
        status: 'in_progress',
      });
    }

    setFeedback({
      isCorrect,
      givenAnswer,
      correctAnswer: currentQ.correctAnswer || currentQ.validSolutions?.[0]?.join('  '),
      explanation: currentQ.explanation,
      xpGain,
    });
  };

  const handleNextQuestion = async () => {
    setFeedback(null);
    setIsHintOpen(false);
    setHintUsedForQuestion(false);
    setUserSelection(null);

    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx >= questions.length) {
      // LEVEL COMPLETE!
      await handleLevelComplete();
    } else {
      setCurrentQuestionIdx(nextIdx);
      const nextQ = questions[nextIdx];
      setPlacedOperators(nextQ?.type === 'missing_operator' ? Array(nextQ.opCount).fill(null) : []);
      setActiveBoxIdx(0);
      setTimeLeft(45);
    }
  };

  const handleLevelComplete = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (user?.id) {
      try {
        const victoryRes = await LogicCodePersistenceService.completeLevel(user.id, selectedLevel, {
          correctCount,
          totalQuestions: questions.length,
          score,
          durationSeconds: 120,
          earnedQuestionXp: earnedXp,
        });

        setLevelVictoryData(victoryRes);

        // Add earned XP to auth state if applicable
        if (addXp && victoryRes.xpAwarded > 0) {
          await addXp(victoryRes.xpAwarded);
        }

        await refreshUserProgress();
        if (onSessionComplete) onSessionComplete();
      } catch (err) {
        console.warn('Error completing Logic Code level:', err);
      }
    }

    setScreen('level_complete');
  };

  // Close handler: save progress if in_progress, then close
  const handleModalClose = useCallback(async () => {
    if (screen === 'playing' && user?.id && questions.length > 0 && currentQuestionIdx < questions.length) {
      await LogicCodePersistenceService.saveActiveSession(user.id, {
        level: selectedLevel,
        category: selectedCategory.id,
        questions,
        currentQuestionIdx,
        score,
        earnedXp,
        correctCount,
        answersHistory,
        status: 'in_progress',
      });
    }
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  }, [screen, user?.id, questions, currentQuestionIdx, selectedLevel, selectedCategory, score, earnedXp, correctCount, answersHistory, onClose]);

  // Handle Pause Mission (Back button during active gameplay)
  const handlePauseMission = useCallback(() => {
    if (screen !== 'playing') return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    frozenTimeLeftRef.current = timeLeft || 45;
    setIsPauseModalOpen(true);
  }, [screen, timeLeft]);

  // Handle Resume Mission
  const handleResumeMission = useCallback(() => {
    setIsPauseModalOpen(false);
  }, []);

  // Handle Exit Mission (Save unfinished session and return to levels screen)
  const handleExitMission = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (user?.id) {
      await LogicCodePersistenceService.saveActiveSession(user.id, {
        level: selectedLevel,
        category: selectedCategory.id,
        questions,
        currentQuestionIdx,
        score,
        earnedXp,
        correctCount,
        answersHistory,
        status: 'in_progress',
      });
    }

    setIsPauseModalOpen(false);
    setScreen('category_levels');
  }, [user?.id, selectedLevel, selectedCategory, questions, currentQuestionIdx, score, earnedXp, correctCount, answersHistory]);

  // Centralized Navigation Back Handler registration for Logic Code
  useEffect(() => {
    if (!visible) return;

    const unregister = NavigationService.registerBackHandler(
      'logic_code_game_modal',
      () => {
        if (isPauseModalOpen) {
          // Absorb back while pause menu is active
          return true;
        }
        if (screen === 'playing') {
          handlePauseMission();
          return true;
        }
        if (screen === 'category_levels') {
          setScreen('dashboard');
          return true;
        }
        if (screen === 'progress_dashboard') {
          setScreen('dashboard');
          return true;
        }
        if (screen === 'level_complete') {
          setScreen('category_levels');
          return true;
        }
        if (screen === 'dashboard') {
          handleModalClose();
          return true;
        }
        return false;
      },
      80
    );

    return unregister;
  }, [visible, screen, isPauseModalOpen, handlePauseMission, handleModalClose]);

  if (!visible) return null;

  const currentQ = questions[currentQuestionIdx];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleModalClose}>
      <View style={styles.modalOverlay}>
        {/* Backdrop: dismiss on outside touch */}
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={handleModalClose} />

        {/* Modal Window Card */}
        <View style={[styles.modalCard, isMobile && styles.modalCardMobile]} onStartShouldSetResponder={() => true}>
          <LinearGradient colors={['#07140B', '#040B06', '#020603']} style={styles.modalGradient}>
            {/* ======================================================= */}
            {/* TOP HEADER BAR (Always visible & fixed)                */}
            {/* ======================================================= */}
            <View style={styles.topHeaderBar}>
              <View style={styles.headerLeftGroup}>
                <PixoBackButton
                  onPress={() => {
                    if (screen === 'playing') {
                      handlePauseMission();
                    } else if (screen === 'category_levels' || screen === 'progress_dashboard') {
                      setScreen('dashboard');
                    } else if (screen === 'level_complete') {
                      setScreen('category_levels');
                    } else {
                      handleModalClose();
                    }
                  }}
                  variant="circle"
                  size={18}
                  style={styles.modalBackArrow}
                  accessibilityLabel="Back to previous screen"
                />
                <View style={styles.headerTitleWrap}>
                  <View style={styles.brandBadge}>
                    <Ionicons name="hardware-chip-outline" size={18} color="#39FF14" />
                  </View>
                  <View>
                    <Text style={styles.parentGameLabel}>CYBER STRIKE: 2099</Text>
                    <Text style={styles.mainGameTitle}>
                      {screen === 'playing' ? `LOGIC CODE • LEVEL ${selectedLevel}` : 'LOGIC CODE'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.headerRightActions}>
                {screen !== 'dashboard' && screen !== 'progress_dashboard' && (
                  <TouchableOpacity
                    style={styles.headerPillBtn}
                    onPress={() => {
                      if (screen === 'playing') {
                        handlePauseMission();
                      } else {
                        setScreen('dashboard');
                      }
                    }}
                  >
                    <Ionicons name="home-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.headerPillText}>HUB</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.headerPillBtn, screen === 'progress_dashboard' && styles.headerPillBtnActive]}
                  onPress={() => setScreen(screen === 'progress_dashboard' ? 'dashboard' : 'progress_dashboard')}
                >
                  <Ionicons name="stats-chart" size={14} color={screen === 'progress_dashboard' ? '#050705' : '#00E5FF'} style={{ marginRight: 4 }} />
                  <Text style={[styles.headerPillText, screen === 'progress_dashboard' && { color: '#050705' }]}>STATS</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => {
                    if (screen === 'playing') {
                      handlePauseMission();
                    } else {
                      handleModalClose();
                    }
                  }}
                  accessibilityLabel="Close game"
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ======================================================= */}
            {/* SCREEN 1: MAIN DASHBOARD                               */}
            {/* ======================================================= */}
            {screen === 'dashboard' && (
              <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
                {/* Brand Hero Slogan */}
                <View style={styles.heroSloganWrap}>
                  <Text style={styles.taglineText}>THINK SMART. SOLVE FAST. STRIKE STRONG.</Text>
                  <Text style={styles.taglineSub}>
                    Educational Cyber-Brain Training • 40 Progressive Mathematical & Logical Missions
                  </Text>
                </View>

                {/* Resume Game Banner (If mid-level session exists) */}
                {activeResumeSession && (
                  <View style={styles.resumeCard}>
                    <View style={styles.resumeLeftCol}>
                      <View style={styles.resumePulseDot} />
                      <View>
                        <Text style={styles.resumeHeading}>UNFINISHED MISSION FOUND</Text>
                        <Text style={styles.resumeSub}>
                          Level {activeResumeSession.level} • Question {(activeResumeSession.currentQuestionIdx || 0) + 1} of 5
                        </Text>
                      </View>
                    </View>
                    <View style={styles.resumeActions}>
                      <TouchableOpacity style={styles.resumeBtn} onPress={resumeGame}>
                        <Ionicons name="play" size={14} color="#050705" style={{ marginRight: 4 }} />
                        <Text style={styles.resumeBtnText}>RESUME</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.resumeDismissBtn} onPress={dismissResumeGame}>
                        <Ionicons name="trash-outline" size={14} color="#FF6A00" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Overall Player Performance Strip */}
                <View style={styles.statsStrip}>
                  <View style={styles.statSegment}>
                    <Text style={styles.statSegmentLabel}>LEVEL</Text>
                    <Text style={styles.statSegmentValueGreen}>{unlockedLevel} / 40</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statSegment}>
                    <Text style={styles.statSegmentLabel}>CLEARED</Text>
                    <Text style={styles.statSegmentValueGold}>{completedLevels.length}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statSegment}>
                    <Text style={styles.statSegmentLabel}>ACCURACY</Text>
                    <Text style={styles.statSegmentValueCyan}>{playerStats?.accuracy ?? 100}%</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statSegment}>
                    <Text style={styles.statSegmentLabel}>LOGIC XP</Text>
                    <Text style={styles.statSegmentValueOrange}>+{playerStats?.totalXp ?? 0}</Text>
                  </View>
                </View>

                {/* 4 Game Category Cards */}
                <Text style={styles.sectionHeading}>SELECT TRAINING SECTOR</Text>

                <View style={styles.categoryGrid}>
                  {LOGIC_CODE_CATEGORIES.map((cat, idx) => {
                    const isCatUnlocked = cat.levelRange[0] <= unlockedLevel;
                    const catCompleted = completedLevels.filter(
                      (lvl) => lvl >= cat.levelRange[0] && lvl <= cat.levelRange[1]
                    ).length;

                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryCard,
                          !isCatUnlocked && styles.categoryCardLocked,
                          { borderColor: isCatUnlocked ? `${cat.color}60` : 'rgba(255, 255, 255, 0.08)' },
                        ]}
                        activeOpacity={isCatUnlocked ? 0.85 : 0.7}
                        onPress={() => {
                          if (!isCatUnlocked) {
                            Alert.alert(
                              '🔒 Sector Locked',
                              `Complete all 10 levels in the previous sector to unlock ${cat.title}!`
                            );
                            return;
                          }
                          setSelectedCategory(cat);
                          setScreen('category_levels');
                        }}
                      >
                        <LinearGradient
                          colors={isCatUnlocked ? cat.gradient : ['#0C0E0D', '#060807']}
                          style={styles.categoryCardGradient}
                        >
                          <View style={styles.categoryCardTopRow}>
                            <View style={[styles.categoryIconWrap, { borderColor: isCatUnlocked ? cat.color : '#555555' }]}>
                              <Ionicons name={cat.icon} size={22} color={isCatUnlocked ? cat.color : '#666666'} />
                            </View>

                            <View style={[styles.categoryStatusPill, isCatUnlocked && { borderColor: cat.color }]}>
                              {isCatUnlocked ? (
                                <Text style={[styles.categoryStatusText, { color: cat.color }]}>
                                  {catCompleted}/10 CLEARED
                                </Text>
                              ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                  <Ionicons name="lock-closed" size={11} color="#777777" style={{ marginRight: 4 }} />
                                  <Text style={styles.categoryStatusTextLocked}>LOCKED</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <Text style={styles.categoryTitle}>{cat.title}</Text>
                          <Text style={styles.categorySubtitle}>{cat.subtitle}</Text>
                          <Text style={styles.categoryDesc}>{cat.desc}</Text>

                          {/* Progress bar */}
                          <View style={styles.categoryProgressTrack}>
                            <View
                              style={[
                                styles.categoryProgressFill,
                                {
                                  width: `${(catCompleted / 10) * 100}%`,
                                  backgroundColor: cat.color,
                                },
                              ]}
                            />
                          </View>

                          <View style={styles.categoryFooterRow}>
                            <Text style={styles.categoryLevelRange}>
                              Levels {cat.levelRange[0]}–{cat.levelRange[1]}
                            </Text>
                            <Text style={[styles.categoryActionLink, { color: isCatUnlocked ? cat.color : '#666666' }]}>
                              {isCatUnlocked ? 'ENTER SECTOR ›' : 'COMPLETE PREV SECTOR'}
                            </Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* ======================================================= */}
            {/* SCREEN 2: CATEGORY LEVEL SELECTION                     */}
            {/* ======================================================= */}
            {screen === 'category_levels' && (
              <View style={styles.flexOneContainer}>
                {/* Sector Header */}
                <View style={[styles.sectorHeaderBar, { borderColor: `${selectedCategory.color}40` }]}>
                  <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('dashboard')}>
                    <Ionicons name="arrow-back" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.backBtnText}>HUB</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.sectorHeaderTitle, { color: selectedCategory.color }]}>
                      {selectedCategory.title}
                    </Text>
                    <Text style={styles.sectorHeaderSub}>{selectedCategory.subtitle} • Levels {selectedCategory.levelRange[0]}–{selectedCategory.levelRange[1]}</Text>
                  </View>
                </View>

                {/* 10 Levels Grid in ScrollView */}
                <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
                  <View style={styles.levelGridContainer}>
                    {Array.from(
                      { length: selectedCategory.levelRange[1] - selectedCategory.levelRange[0] + 1 },
                      (_, i) => selectedCategory.levelRange[0] + i
                    ).map((lvl) => {
                      const isLocked = lvl > unlockedLevel;
                      const isCompleted = completedLevels.includes(lvl);
                      const isSelected = selectedLevel === lvl;
                      const relativeLvl = ((lvl - 1) % 10) + 1;
                      const difficulty = relativeLvl <= 3 ? 'EASY' : relativeLvl <= 7 ? 'MEDIUM' : 'HARD';
                      const diffColor = relativeLvl <= 3 ? '#39FF14' : relativeLvl <= 7 ? '#00E5FF' : '#FF6A00';

                      return (
                        <TouchableOpacity
                          key={lvl}
                          style={[
                            styles.levelCard,
                            isSelected && styles.levelCardSelected,
                            isCompleted && styles.levelCardCompleted,
                            isLocked && styles.levelCardLocked,
                          ]}
                          onPress={() => {
                            if (isLocked) {
                              Alert.alert('🔒 Level Locked', `Complete Level ${lvl - 1} first to unlock Level ${lvl}!`);
                            } else {
                              setSelectedLevel(lvl);
                            }
                          }}
                          activeOpacity={isLocked ? 0.7 : 0.85}
                        >
                          <View style={styles.levelCardTop}>
                            <Text style={[styles.levelCardNum, isSelected && styles.levelCardNumActive]}>
                              LVL {lvl}
                            </Text>
                            {isCompleted ? (
                              <Ionicons name="checkmark-circle" size={14} color="#39FF14" />
                            ) : isLocked ? (
                              <Ionicons name="lock-closed" size={13} color="#777777" />
                            ) : (
                              <Ionicons name="flash" size={13} color="#00E5FF" />
                            )}
                          </View>

                          <View style={[styles.diffBadge, { borderColor: isLocked ? '#444' : `${diffColor}60` }]}>
                            <Text style={[styles.diffBadgeText, { color: isLocked ? '#666' : diffColor }]}>
                              {difficulty}
                            </Text>
                          </View>

                          <Text style={[styles.levelCardSub, isLocked && { color: '#666' }]}>
                            {isLocked ? `Complete L${lvl - 1}` : isCompleted ? 'Cleared ✓' : 'Available'}
                          </Text>

                          <View style={styles.rewardPill}>
                            <Text style={[styles.rewardPillText, isLocked && { color: '#555' }]}>
                              +20 XP Completion
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Pinned Start Level Button at bottom */}
                <View style={styles.footerBar}>
                  {selectedLevel > unlockedLevel ? (
                    <View style={styles.startBtnLocked}>
                      <Ionicons name="lock-closed" size={16} color="#777777" style={{ marginRight: 8 }} />
                      <Text style={styles.startBtnTextLocked}>
                        LOCKED • COMPLETE LEVEL {selectedLevel - 1} TO UNLOCK
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.startBtn}
                      onPress={() => startLevel(selectedLevel)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#39FF14', '#00E5FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.startBtnGradient}
                      >
                        <Ionicons name="play" size={17} color="#050705" style={{ marginRight: 8 }} />
                        <Text style={styles.startBtnText}>
                          LAUNCH LEVEL {selectedLevel} MISSION (5 QUESTIONS) →
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* ======================================================= */}
            {/* SCREEN 3: INDIVIDUAL GAMEPLAY SCREEN                   */}
            {/* ======================================================= */}
            {screen === 'playing' && currentQ && (
              <View style={styles.flexOneContainer}>
                {/* Gameplay HUD */}
                <View style={styles.hudBar}>
                  <View style={styles.hudBadge}>
                    <Text style={styles.hudBadgeLabel}>LEVEL</Text>
                    <Text style={styles.hudBadgeVal}>{selectedLevel} / 40</Text>
                  </View>

                  <View style={styles.hudBadge}>
                    <Text style={styles.hudBadgeLabel}>QUESTION</Text>
                    <Text style={styles.hudBadgeVal}>{currentQuestionIdx + 1} / {questions.length}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.timerBadge, isUntimed && styles.timerBadgeUntimed, timeLeft <= 10 && !isUntimed && styles.timerBadgeAlert]}
                    onPress={() => setIsUntimed(!isUntimed)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isUntimed ? 'infinite' : 'timer-outline'}
                      size={14}
                      color={isUntimed ? '#00E5FF' : timeLeft <= 10 ? '#FF3B30' : '#39FF14'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.timerText, timeLeft <= 10 && !isUntimed && { color: '#FF3B30' }]}>
                      {isUntimed ? 'PRACTICE' : `${timeLeft}s`}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.hudBadge}>
                    <Text style={styles.hudBadgeLabel}>SCORE</Text>
                    <Text style={styles.hudBadgeVal}>{score}</Text>
                  </View>
                </View>

                {/* 5-Step Segmented Progress Bar */}
                <View style={styles.stepProgressBar}>
                  {questions.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.progressStep,
                        idx < currentQuestionIdx && styles.progressStepDone,
                        idx === currentQuestionIdx && styles.progressStepActive,
                      ]}
                    />
                  ))}
                </View>

                {/* Main Question View (Scrollable on small screens) */}
                <ScrollView style={styles.scrollBody} contentContainerStyle={styles.questionContent}>
                  {/* Category & Title */}
                  <View style={styles.questionHeaderBlock}>
                    <Text style={styles.questionCategoryLabel}>{currentQ.category.toUpperCase()}</Text>
                    <Text style={styles.questionMainTitle}>{currentQ.title}</Text>
                    <Text style={styles.questionPrompt}>{currentQ.prompt}</Text>
                  </View>

                  {/* -------------------------------------------------- */}
                  {/* TYPE A: MISSING OPERATOR CHALLENGE                 */}
                  {/* -------------------------------------------------- */}
                  {currentQ.type === 'missing_operator' && (
                    <View style={styles.operatorPuzzleWrap}>
                      <View style={styles.targetBanner}>
                        <Text style={styles.targetBannerLabel}>TARGET NUMBER</Text>
                        <Text style={styles.targetBannerValue}>{currentQ.target}</Text>
                      </View>

                      {/* Equation with Empty Operator Boxes */}
                      <View style={styles.equationRow}>
                        {currentQ.numbers.map((num, i) => (
                          <React.Fragment key={i}>
                            <View style={styles.equationNumBox}>
                              <Text style={styles.equationNumText}>{num}</Text>
                            </View>

                            {i < currentQ.numbers.length - 1 && (
                              <TouchableOpacity
                                style={[
                                  styles.operatorSlotBox,
                                  activeBoxIdx === i && styles.operatorSlotBoxActive,
                                  placedOperators[i] && styles.operatorSlotBoxFilled,
                                ]}
                                onPress={() => setActiveBoxIdx(i)}
                                activeOpacity={0.85}
                              >
                                <Text style={styles.operatorSlotText}>
                                  {placedOperators[i] ? placedOperators[i] : '?'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </React.Fragment>
                        ))}
                        <Text style={styles.equationEqualsText}>=</Text>
                        <View style={styles.equationTargetBox}>
                          <Text style={styles.equationTargetText}>{currentQ.target}</Text>
                        </View>
                      </View>

                      <Text style={styles.operatorPaletteLabel}>
                        TAP AN OPERATOR TO PLACE IN BOX #{activeBoxIdx + 1}:
                      </Text>

                      {/* Operator Palette (Tap to select) */}
                      <View style={styles.operatorPaletteRow}>
                        {['+', '−', '×', '÷'].map((op) => (
                          <TouchableOpacity
                            key={op}
                            style={styles.paletteOpBtn}
                            onPress={() => {
                              const updated = [...placedOperators];
                              updated[activeBoxIdx] = op;
                              setPlacedOperators(updated);
                              // Auto advance active box
                              if (activeBoxIdx < currentQ.opCount - 1) {
                                setActiveBoxIdx(activeBoxIdx + 1);
                              }
                            }}
                            activeOpacity={0.8}
                          >
                            <LinearGradient colors={['#172E1E', '#0A170F']} style={styles.paletteOpGradient}>
                              <Text style={styles.paletteOpText}>{op}</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* -------------------------------------------------- */}
                  {/* TYPE B: MULTIPLE CHOICE (Pattern / Root / Number)   */}
                  {/* -------------------------------------------------- */}
                  {currentQ.type !== 'missing_operator' && Array.isArray(currentQ.options) && (
                    <View style={styles.optionsGrid}>
                      {currentQ.options.map((opt, i) => {
                        const isSelected = userSelection === opt;
                        return (
                          <TouchableOpacity
                            key={i}
                            style={[
                              styles.choiceCard,
                              isSelected && styles.choiceCardSelected,
                            ]}
                            onPress={() => setUserSelection(opt)}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.choiceIndexCircle, isSelected && styles.choiceIndexCircleSelected]}>
                              <Text style={[styles.choiceIndexText, isSelected && { color: '#050705' }]}>
                                {String.fromCharCode(65 + i)}
                              </Text>
                            </View>
                            <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>
                              {String(opt)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Guided Hint Card (Toggleable) */}
                  {isHintOpen && (
                    <View style={styles.hintCard}>
                      <View style={styles.hintHeader}>
                        <Ionicons name="bulb" size={16} color="#FFD700" style={{ marginRight: 6 }} />
                        <Text style={styles.hintTitle}>TACTICAL HINT</Text>
                      </View>
                      <Text style={styles.hintBody}>{currentQ.hint}</Text>
                    </View>
                  )}
                </ScrollView>

                {/* Bottom Action Controls */}
                <View style={styles.gameplayFooter}>
                  <TouchableOpacity
                    style={[styles.hintBtn, isHintOpen && styles.hintBtnActive]}
                    onPress={() => {
                      setIsHintOpen(!isHintOpen);
                      setHintUsedForQuestion(true);
                    }}
                  >
                    <Ionicons name="bulb-outline" size={16} color={isHintOpen ? '#050705' : '#FFD700'} style={{ marginRight: 6 }} />
                    <Text style={[styles.hintBtnText, isHintOpen && { color: '#050705' }]}>
                      {isHintOpen ? 'HIDE HINT' : 'HINT (-5 XP BONUS)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={() => handleSubmitAnswer()}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={['#39FF14', '#00E5FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnGradient}>
                      <Text style={styles.submitBtnText}>SUBMIT ANSWER ↵</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ======================================================= */}
            {/* SCREEN 4: POST-ANSWER REVIEW / EXPLANATION MODAL       */}
            {/* ======================================================= */}
            {feedback && (
              <View style={styles.feedbackOverlay}>
                <View style={[styles.feedbackCard, feedback.isCorrect ? styles.feedbackCardCorrect : styles.feedbackCardWrong]}>
                  <View style={styles.feedbackHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons
                        name={feedback.isCorrect ? 'checkmark-circle' : 'close-circle'}
                        size={24}
                        color={feedback.isCorrect ? '#39FF14' : '#FF3B30'}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[styles.feedbackStatusText, { color: feedback.isCorrect ? '#39FF14' : '#FF3B30' }]}>
                        {feedback.isCorrect ? 'CORRECT CALCULATION!' : 'INCORRECT'}
                      </Text>
                    </View>
                    <Text style={styles.feedbackXpPill}>+{feedback.xpGain} XP</Text>
                  </View>

                  <Text style={styles.feedbackCorrectAns}>
                    Correct Answer: <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{String(feedback.correctAnswer)}</Text>
                  </Text>

                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationLabel}>STEP-BY-STEP EXPLANATION:</Text>
                    <Text style={styles.explanationText}>{feedback.explanation}</Text>
                  </View>

                  <TouchableOpacity style={styles.nextQuestionBtn} onPress={handleNextQuestion} activeOpacity={0.85}>
                    <LinearGradient colors={['#39FF14', '#00E5FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtnGradient}>
                      <Text style={styles.nextBtnText}>
                        {currentQuestionIdx + 1 >= questions.length ? 'VIEW MISSION RESULTS →' : 'NEXT QUESTION →'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ======================================================= */}
            {/* SCREEN 5: LEVEL COMPLETE / VICTORY                     */}
            {/* ======================================================= */}
            {screen === 'level_complete' && levelVictoryData && (
              <ScrollView style={styles.scrollBody} contentContainerStyle={styles.victoryContent}>
                <View style={styles.victoryIconCircle}>
                  <Ionicons name="trophy" size={54} color="#39FF14" />
                </View>

                <Text style={styles.victoryHeading}>MISSION ACCOMPLISHED!</Text>
                <Text style={styles.victorySub}>
                  {levelVictoryData.isPerfect ? '⚡ FLAWLESS S-RANK EXECUTION ⚡' : 'Level Cleared Successfully'}
                </Text>

                {/* Score & Rewards Breakdown */}
                <View style={styles.victoryStatsBox}>
                  <View style={styles.victoryStatRow}>
                    <Text style={styles.victoryStatLabel}>Level Cleared:</Text>
                    <Text style={styles.victoryStatVal}>Level {selectedLevel}</Text>
                  </View>
                  <View style={styles.victoryStatRow}>
                    <Text style={styles.victoryStatLabel}>Correct Answers:</Text>
                    <Text style={styles.victoryStatVal}>{correctCount} / {questions.length}</Text>
                  </View>
                  <View style={styles.victoryStatRow}>
                    <Text style={styles.victoryStatLabel}>Mission Score:</Text>
                    <Text style={styles.victoryStatVal}>{score} PTS</Text>
                  </View>
                  <View style={styles.victoryStatRow}>
                    <Text style={styles.victoryStatLabel}>XP Awarded:</Text>
                    <Text style={[styles.victoryStatVal, { color: '#39FF14' }]}>
                      +{levelVictoryData.xpAwarded} XP
                    </Text>
                  </View>
                  {levelVictoryData.coinsAwarded > 0 && (
                    <View style={styles.victoryStatRow}>
                      <Text style={styles.victoryStatLabel}>Coins Awarded:</Text>
                      <Text style={[styles.victoryStatVal, { color: '#FFD700' }]}>
                        +{levelVictoryData.coinsAwarded} Coins
                      </Text>
                    </View>
                  )}
                  <View style={styles.victoryStatRow}>
                    <Text style={styles.victoryStatLabel}>Next Level Unlocked:</Text>
                    <Text style={[styles.victoryStatVal, { color: '#00E5FF' }]}>
                      Level {levelVictoryData.unlockedLevel}
                    </Text>
                  </View>
                </View>

                {/* Badges notification if level 10, 20, 30, 40 */}
                {selectedLevel === 10 && (
                  <View style={styles.badgeAwardBanner}>
                    <Ionicons name="ribbon" size={20} color="#39FF14" style={{ marginRight: 8 }} />
                    <Text style={styles.badgeAwardText}>BADGE UNLOCKED: PATTERN HACKER!</Text>
                  </View>
                )}
                {selectedLevel === 20 && (
                  <View style={styles.badgeAwardBanner}>
                    <Ionicons name="ribbon" size={20} color="#00E5FF" style={{ marginRight: 8 }} />
                    <Text style={styles.badgeAwardText}>BADGE UNLOCKED: NUMBER SLEUTH!</Text>
                  </View>
                )}
                {selectedLevel === 30 && (
                  <View style={styles.badgeAwardBanner}>
                    <Ionicons name="ribbon" size={20} color="#FFD700" style={{ marginRight: 8 }} />
                    <Text style={styles.badgeAwardText}>BADGE UNLOCKED: QUANTUM ROOTER!</Text>
                  </View>
                )}
                {selectedLevel === 40 && (
                  <View style={styles.badgeAwardBanner}>
                    <Ionicons name="trophy" size={22} color="#FF3B30" style={{ marginRight: 8 }} />
                    <Text style={[styles.badgeAwardText, { color: '#FF3B30' }]}>
                      👑 ULTIMATE LOGIC MASTER BADGE EARNED! 👑
                    </Text>
                  </View>
                )}

                {/* Victory Actions */}
                <View style={styles.victoryActions}>
                  {selectedLevel < 40 ? (
                    <TouchableOpacity
                      style={styles.advanceBtn}
                      onPress={() => startLevel(selectedLevel + 1)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient colors={['#39FF14', '#00E5FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startBtnGradient}>
                        <Text style={styles.advanceBtnText}>ADVANCE TO LEVEL {selectedLevel + 1} →</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.allClearedCard}>
                      <Text style={styles.allClearedText}>🏆 ALL 40 LOGIC CODE MISSIONS CLEARED! 🏆</Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.replayBtn} onPress={() => startLevel(selectedLevel)}>
                    <Text style={styles.replayBtnText}>REPLAY LEVEL {selectedLevel}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.returnHubBtn} onPress={() => setScreen('dashboard')}>
                    <Text style={styles.returnHubBtnText}>RETURN TO HUB</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {/* ======================================================= */}
            {/* SCREEN 6: PROGRESS DASHBOARD                           */}
            {/* ======================================================= */}
            {screen === 'progress_dashboard' && (
              <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
                <View style={styles.statsHeaderBlock}>
                  <Text style={styles.statsHeaderTitle}>LOGIC CODE PROGRESS DASHBOARD</Text>
                  <Text style={styles.statsHeaderSub}>Performance Metrics & Sector Completion Analysis</Text>
                </View>

                {/* Metrics Grid */}
                <View style={styles.kpiGrid}>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>LEVELS CLEARED</Text>
                    <Text style={styles.kpiValGreen}>{playerStats?.completedLevelsCount ?? 0} / 40</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>ACCURACY</Text>
                    <Text style={styles.kpiValCyan}>{playerStats?.accuracy ?? 100}%</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>QUESTIONS SOLVED</Text>
                    <Text style={styles.kpiValGold}>{playerStats?.totalCorrect ?? 0}</Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>TOTAL XP EARNED</Text>
                    <Text style={styles.kpiValOrange}>+{playerStats?.totalXp ?? 0}</Text>
                  </View>
                </View>

                {/* Category Progress Bars */}
                <Text style={[styles.sectionHeading, { marginTop: 16 }]}>SECTOR BREAKDOWN</Text>

                {LOGIC_CODE_CATEGORIES.map((cat) => {
                  const completed = playerStats?.categoryProgress?.[cat.id] ?? 0;
                  return (
                    <View key={cat.id} style={styles.sectorProgressCard}>
                      <View style={styles.sectorProgressTop}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name={cat.icon} size={16} color={cat.color} style={{ marginRight: 6 }} />
                          <Text style={styles.sectorProgressTitle}>{cat.title}</Text>
                        </View>
                        <Text style={[styles.sectorProgressVal, { color: cat.color }]}>{completed} / 10</Text>
                      </View>
                      <View style={styles.sectorProgressBarTrack}>
                        <View style={[styles.sectorProgressBarFill, { width: `${(completed / 10) * 100}%`, backgroundColor: cat.color }]} />
                      </View>
                    </View>
                  );
                })}

                {/* Badges Section */}
                <Text style={[styles.sectionHeading, { marginTop: 16 }]}>EARNED BADGES</Text>
                <View style={styles.badgeRow}>
                  {Object.values(LOGIC_CODE_BADGES).map((b) => {
                    const isEarned = playerStats?.badges?.some((eb) => eb.id === b.id);
                    return (
                      <View key={b.id} style={[styles.badgePill, !isEarned && styles.badgePillLocked]}>
                        <Ionicons name={b.icon} size={18} color={isEarned ? b.color : '#555555'} style={{ marginRight: 8 }} />
                        <View>
                          <Text style={[styles.badgeTitle, isEarned && { color: '#FFFFFF' }]}>{b.title}</Text>
                          <Text style={styles.badgeDesc}>{isEarned ? b.desc : `Unlocks at Level ${b.levelRequirement}`}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* Pixo Mission Pause Menu Modal */}
            <PixoPauseModal
              visible={isPauseModalOpen}
              gameTitle={`CYBER STRIKE: LEVEL ${selectedLevel} (${selectedCategory?.title || 'Tactical'})`}
              level={selectedLevel}
              timeLeft={frozenTimeLeftRef.current || timeLeft}
              score={score}
              currentQuestion={currentQuestionIdx + 1}
              totalQuestions={questions.length || 5}
              onResume={handleResumeMission}
              onExit={handleExitMission}
            />
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }
      : {}),
  },
  backdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
  },
  modalCard: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '90vh',
    height: Platform.OS === 'web' ? '88vh' : undefined,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.45)',
    backgroundColor: '#040B06',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 10px 50px rgba(0, 0, 0, 0.95), 0 0 40px rgba(57, 255, 20, 0.3)',
        }
      : {}),
  },
  modalCardMobile: {
    maxWidth: '100%',
    maxHeight: '96vh',
    height: '96vh',
  },
  modalGradient: {
    padding: 18,
    flex: 1,
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  flexOneContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  },
  scrollBody: {
    flex: 1,
    minHeight: 0,
    ...(Platform.OS === 'web'
      ? {
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }
      : {}),
  },
  scrollContent: {
    paddingBottom: 20,
    paddingRight: 4,
  },
  topHeaderBar: {
    flexShrink: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 255, 20, 0.2)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalBackArrow: {
    marginRight: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 1.5,
    borderColor: '#39FF14',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  parentGameLabel: {
    color: '#00E5FF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  mainGameTitle: {
    color: '#39FF14',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    ...(Platform.OS === 'web' ? { fontFamily: "'Space Grotesk', sans-serif" } : {}),
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  headerPillBtnActive: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },
  headerPillText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  heroSloganWrap: {
    backgroundColor: 'rgba(57, 255, 20, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  taglineText: {
    color: '#39FF14',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  taglineSub: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  resumeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 106, 0, 0.12)',
    borderWidth: 1.5,
    borderColor: '#FF6A00',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  resumeLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resumePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6A00',
  },
  resumeHeading: {
    color: '#FF6A00',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  resumeSub: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  resumeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#39FF14',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  resumeBtnText: {
    color: '#050705',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resumeDismissBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  statsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0A170F',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  statSegment: {
    alignItems: 'center',
  },
  statSegmentLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statSegmentValueGreen: {
    color: '#39FF14',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  statSegmentValueGold: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  statSegmentValueCyan: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  statSegmentValueOrange: {
    color: '#FF6A00',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  sectionHeading: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  categoryGrid: {
    gap: 12,
  },
  categoryCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.2s ease' } : {}),
  },
  categoryCardLocked: {
    opacity: 0.6,
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : {}),
  },
  categoryCardGradient: {
    padding: 14,
  },
  categoryCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  categoryStatusTextLocked: {
    color: '#777777',
    fontSize: 9.5,
    fontWeight: '700',
  },
  categoryTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  categorySubtitle: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  categoryDesc: {
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 14,
    marginVertical: 6,
  },
  categoryProgressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 6,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryLevelRange: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  categoryActionLink: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectorHeaderBar: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  sectorHeaderTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sectorHeaderSub: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  levelGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  levelCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.18s ease' } : {}),
  },
  levelCardSelected: {
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.18)',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 16px rgba(57, 255, 20, 0.4)' } : {}),
  },
  levelCardCompleted: {
    borderColor: 'rgba(57, 255, 20, 0.35)',
    backgroundColor: 'rgba(57, 255, 20, 0.05)',
  },
  levelCardLocked: {
    borderColor: 'rgba(255, 255, 255, 0.04)',
    backgroundColor: 'rgba(15, 15, 15, 0.65)',
    opacity: 0.6,
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : {}),
  },
  levelCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelCardNum: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '900',
  },
  levelCardNumActive: {
    color: '#39FF14',
  },
  diffBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginBottom: 4,
  },
  diffBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  levelCardSub: {
    color: colors.textSecondary,
    fontSize: 9.5,
    marginBottom: 4,
  },
  rewardPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  rewardPillText: {
    color: '#00E5FF',
    fontSize: 8.5,
    fontWeight: '700',
  },
  footerBar: {
    flexShrink: 0,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(57, 255, 20, 0.2)',
  },
  startBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', boxShadow: '0 0 20px rgba(57, 255, 20, 0.35)' } : {}),
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  startBtnText: {
    color: '#050705',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  startBtnLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : {}),
  },
  startBtnTextLocked: {
    color: '#777777',
    fontSize: 11.5,
    fontWeight: '800',
  },
  hudBar: {
    flexShrink: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hudBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
  },
  hudBadgeLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
  },
  hudBadgeVal: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderWidth: 1.5,
    borderColor: '#39FF14',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  timerBadgeUntimed: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: '#00E5FF',
  },
  timerBadgeAlert: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: '#FF3B30',
  },
  timerText: {
    color: '#39FF14',
    fontSize: 12,
    fontWeight: '900',
  },
  stepProgressBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#00E5FF',
  },
  progressStepDone: {
    backgroundColor: '#39FF14',
  },
  questionContent: {
    paddingBottom: 16,
  },
  questionHeaderBlock: {
    marginBottom: 12,
  },
  questionCategoryLabel: {
    color: '#39FF14',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  questionMainTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginVertical: 2,
  },
  questionPrompt: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  operatorPuzzleWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  targetBanner: {
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: '#FF6A00',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  targetBannerLabel: {
    color: '#FF6A00',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  targetBannerValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  equationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  equationNumBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equationNumText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  operatorSlotBox: {
    backgroundColor: 'rgba(255, 106, 0, 0.1)',
    borderWidth: 2,
    borderColor: '#FF6A00',
    borderStyle: 'dashed',
    borderRadius: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  operatorSlotBoxActive: {
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
  },
  operatorSlotBoxFilled: {
    borderStyle: 'solid',
    backgroundColor: 'rgba(255, 106, 0, 0.25)',
  },
  operatorSlotText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  equationEqualsText: {
    color: colors.textSecondary,
    fontSize: 22,
    fontWeight: '900',
  },
  equationTargetBox: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 1.5,
    borderColor: '#39FF14',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equationTargetText: {
    color: '#39FF14',
    fontSize: 20,
    fontWeight: '900',
  },
  operatorPaletteLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
  },
  operatorPaletteRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paletteOpBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    width: 48,
    height: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  paletteOpGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteOpText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  optionsGrid: {
    gap: 8,
    marginVertical: 10,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.15s ease' } : {}),
  },
  choiceCardSelected: {
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.16)',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 12px rgba(57, 255, 20, 0.3)' } : {}),
  },
  choiceIndexCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  choiceIndexCircleSelected: {
    backgroundColor: '#39FF14',
  },
  choiceIndexText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '900',
  },
  choiceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  choiceTextSelected: {
    color: '#39FF14',
  },
  hintCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hintTitle: {
    color: '#FFD700',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  hintBody: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 15,
  },
  gameplayFooter: {
    flexShrink: 0,
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(57, 255, 20, 0.2)',
  },
  hintBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 10,
    paddingVertical: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  hintBtnActive: {
    backgroundColor: '#FFD700',
  },
  hintBtnText: {
    color: '#FFD700',
    fontSize: 10.5,
    fontWeight: '800',
  },
  submitBtn: {
    flex: 2,
    borderRadius: 10,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', boxShadow: '0 0 15px rgba(57, 255, 20, 0.3)' } : {}),
  },
  submitBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#050705',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 99,
  },
  feedbackCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#0D1A10',
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
  },
  feedbackCardCorrect: {
    borderColor: '#39FF14',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 30px rgba(57, 255, 20, 0.35)' } : {}),
  },
  feedbackCardWrong: {
    borderColor: '#FF3B30',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 30px rgba(255, 59, 48, 0.35)' } : {}),
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackStatusText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  feedbackXpPill: {
    color: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 1,
    borderColor: '#39FF14',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '900',
  },
  feedbackCorrectAns: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  explanationBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    marginBottom: 14,
  },
  explanationLabel: {
    color: '#00E5FF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  explanationText: {
    color: '#E0E8E2',
    fontSize: 11.5,
    lineHeight: 16,
  },
  nextQuestionBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  nextBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#050705',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  victoryContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  victoryIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 2,
    borderColor: '#39FF14',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 30px rgba(57, 255, 20, 0.4)' } : {}),
  },
  victoryHeading: {
    color: '#39FF14',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  victorySub: {
    color: '#00E5FF',
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 14,
    textAlign: 'center',
  },
  victoryStatsBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 12,
  },
  victoryStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  victoryStatLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  victoryStatVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  badgeAwardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 1.5,
    borderColor: '#39FF14',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    width: '100%',
    justifyContent: 'center',
  },
  badgeAwardText: {
    color: '#39FF14',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  victoryActions: {
    width: '100%',
    gap: 8,
  },
  advanceBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer', boxShadow: '0 0 20px rgba(57, 255, 20, 0.35)' } : {}),
  },
  advanceBtnText: {
    color: '#050705',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  replayBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  replayBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  returnHubBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  returnHubBtnText: {
    color: colors.textMuted,
    fontSize: 10.5,
    fontWeight: '700',
  },
  allClearedCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  allClearedText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '900',
  },
  statsHeaderBlock: {
    marginBottom: 12,
  },
  statsHeaderTitle: {
    color: '#39FF14',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statsHeaderSub: {
    color: colors.textSecondary,
    fontSize: 10.5,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  kpiLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
  },
  kpiValGreen: {
    color: '#39FF14',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  kpiValCyan: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  kpiValGold: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  kpiValOrange: {
    color: '#FF6A00',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  sectorProgressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  sectorProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectorProgressTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sectorProgressVal: {
    fontSize: 11,
    fontWeight: '900',
  },
  sectorProgressBarTrack: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sectorProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  badgeRow: {
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    borderRadius: 10,
    padding: 10,
  },
  badgePillLocked: {
    opacity: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeTitle: {
    color: '#999999',
    fontSize: 11.5,
    fontWeight: '900',
  },
  badgeDesc: {
    color: colors.textSecondary,
    fontSize: 9.5,
    marginTop: 1,
  },
});

