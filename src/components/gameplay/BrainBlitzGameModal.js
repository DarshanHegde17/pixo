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
import { colors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { PixoBackButton, PixoPauseModal } from '../common';
import { NavigationService } from '../../services/navigationService';
import {
  BRAIN_BLITZ_MODES,
  BRAIN_BLITZ_MODE_METADATA,
  BRAIN_BLITZ_LEVEL_REWARDS,
  BrainBlitzPersistenceService,
} from '../../services/brainBlitzPersistenceService';
import {
  BrainBlitzGameService,
  MEMORY_MATCH_LEVELS,
  SEQUENCE_RECALL_SYMBOLS,
  SEQUENCE_RECALL_LEVELS,
  PATTERN_RECALL_LEVELS,
} from '../../services/brainBlitzGameService';
import { BrainBlitzAudioService } from '../../services/brainBlitzAudioService';

export const BrainBlitzGameModal = ({
  visible,
  initialMode = BRAIN_BLITZ_MODES.MEMORY_MATCH,
  initialLevel = 1,
  onClose,
  onSessionComplete,
}) => {
  const { user, addXp, addCoins } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // Screen state: 'hub' | 'levels' | 'playing'
  const [screen, setScreen] = useState('hub');
  const [selectedMode, setSelectedMode] = useState(initialMode || BRAIN_BLITZ_MODES.MEMORY_MATCH);
  const [selectedLevel, setSelectedLevel] = useState(initialLevel || 1);
  const [playerStats, setPlayerStats] = useState(null);
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // Active Gameplay Common State
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [pauseModalMode, setPauseModalMode] = useState('pause'); // 'pause' | 'exit_confirm'
  const [activeSavedSession, setActiveSavedSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [gameResult, setGameResult] = useState(null); // { isVictory, xpAwarded, coinsAwarded, stars, reason }
  const frozenTimeLeftRef = useRef(60);
  const timerRef = useRef(null);

  // Mode 1: Memory Match States
  const [memoryCards, setMemoryCards] = useState([]);
  const [flippedCardIndices, setFlippedCardIndices] = useState([]);
  const [matchedPairIds, setMatchedPairIds] = useState(new Set());
  const [isMemoryEvaluating, setIsMemoryEvaluating] = useState(false);

  // Mode 2: Sequence Recall States
  const [targetSequence, setTargetSequence] = useState([]);
  const [activeHighlightedSymbol, setActiveHighlightedSymbol] = useState(null);
  const [isDemonstrating, setIsDemonstrating] = useState(false);
  const [playerSequenceStep, setPlayerSequenceStep] = useState(0);
  const demoTimeoutRefs = useRef([]);

  // Mode 3: Pattern Recall States
  const [patternConfig, setPatternConfig] = useState(null);
  const [isPatternMemorizing, setIsPatternMemorizing] = useState(false);
  const [selectedPatternCells, setSelectedPatternCells] = useState(new Set());
  const [patternEvaluation, setPatternEvaluation] = useState(null);
  const patternTimerRef = useRef(null);

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

  // Load initial player stats and sound setting
  const refreshStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const stats = await BrainBlitzPersistenceService.getStats(user.id);
      setPlayerStats(stats);
      const soundEnabled = await BrainBlitzPersistenceService.isSoundEnabled();
      setIsSoundMuted(!soundEnabled);
      const savedSession = await BrainBlitzPersistenceService.getActiveSession(user.id);
      setActiveSavedSession(savedSession);
    } catch (err) {
      console.warn('Error loading Brain Blitz stats:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (visible) {
      refreshStats();
      BrainBlitzAudioService.init();
    }
  }, [visible, refreshStats]);

  // Route Synchronization
  useEffect(() => {
    if (!visible) return;

    const syncWithRoute = (route) => {
      if (!route) return;
      if (route.id === 'brain_blitz') {
        setScreen('hub');
        setGameResult(null);
        refreshStats();
      } else if (route.id === 'brain_blitz_levels') {
        if (route.params?.mode) {
          setSelectedMode(route.params.mode);
        }
        setScreen('levels');
        setGameResult(null);
      } else if (route.id === 'brain_blitz_gameplay') {
        if (route.params?.mode) setSelectedMode(route.params.mode);
        if (route.params?.level) setSelectedLevel(route.params.level);
        setScreen('playing');
      } else if (['home', 'games', 'quests', 'store', 'profile'].includes(route.id)) {
        if (onClose) onClose();
      }
    };

    syncWithRoute(NavigationService.getCurrentRoute());
    const unsub = NavigationService.subscribe(syncWithRoute);
    return unsub;
  }, [visible, onClose, refreshStats]);

  // Centralized Navigation Back Handler Registration
  useEffect(() => {
    if (!visible) return;

    const unregister = NavigationService.registerBackHandler(
      'brain_blitz_game_modal',
      () => {
        if (isPauseModalOpen) {
          // Absorb back while pause/exit confirmation is active: resume play
          handleResumeGame();
          return true;
        }
        if (screen === 'playing') {
          handleBackRequested();
          return true;
        }
        if (screen === 'levels') {
          NavigationService.navigate('brain_blitz');
          setScreen('hub');
          return true;
        }
        return false;
      },
      80
    );

    return unregister;
  }, [visible, screen, isPauseModalOpen]);

  // Sound toggle handler
  const handleToggleSound = async () => {
    const muted = await BrainBlitzAudioService.toggleMute();
    setIsSoundMuted(muted);
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (screen === 'playing' && !isPauseModalOpen && !isDemonstrating && !isPatternMemorizing && !gameResult) {
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
  }, [screen, isPauseModalOpen, isDemonstrating, isPatternMemorizing, gameResult]);

  const handleTimeExpired = async () => {
    BrainBlitzAudioService.playDefeat();
    if (user?.id) {
      await BrainBlitzPersistenceService.clearActiveSession(user.id);
      setActiveSavedSession(null);
    }
    const configTime =
      selectedMode === BRAIN_BLITZ_MODES.MEMORY_MATCH
        ? (MEMORY_MATCH_LEVELS[selectedLevel]?.timeLimit || 45)
        : selectedMode === BRAIN_BLITZ_MODES.SEQUENCE_RECALL
        ? (SEQUENCE_RECALL_LEVELS[selectedLevel]?.timeLimit || 45)
        : (PATTERN_RECALL_LEVELS[selectedLevel]?.timeLimit || 45);

    setGameResult({
      isVictory: false,
      reason: 'Neural Clock Depleted! The timer reached 0 before mission completion.',
      levelReached: selectedLevel,
      finalScore: score,
      timeUsed: configTime,
      mistakes,
      moves,
    });
  };

  // -------------------------------------------------------------------------
  // GAME INITIALIZERS
  // -------------------------------------------------------------------------
  const startLevel = async (mode, levelNum) => {
    const num = Number(levelNum);
    setSelectedMode(mode);
    setSelectedLevel(num);
    setGameResult(null);
    setMoves(0);
    setMistakes(0);
    setScore(0);
    setIsPauseModalOpen(false);

    // Clear active unfinished session on fresh level attempt
    if (user?.id) {
      await BrainBlitzPersistenceService.clearActiveSession(user.id);
      setActiveSavedSession(null);
    }

    // Clear previous timeouts
    demoTimeoutRefs.current.forEach((t) => clearTimeout(t));
    demoTimeoutRefs.current = [];
    if (patternTimerRef.current) clearTimeout(patternTimerRef.current);

    NavigationService.navigate('brain_blitz_gameplay', { mode, level: num });
    setScreen('playing');

    if (mode === BRAIN_BLITZ_MODES.MEMORY_MATCH) {
      initMemoryMatch(num);
    } else if (mode === BRAIN_BLITZ_MODES.SEQUENCE_RECALL) {
      initSequenceRecall(num);
    } else if (mode === BRAIN_BLITZ_MODES.PATTERN_RECALL) {
      initPatternRecall(num);
    }
  };

  // Resume an in-progress saved session
  const handleResumeSavedSession = (session) => {
    if (!session) return;
    const mode = session.mode || BRAIN_BLITZ_MODES.MEMORY_MATCH;
    const levelNum = Number(session.level || 1);

    setSelectedMode(mode);
    setSelectedLevel(levelNum);
    setGameResult(null);
    setMoves(session.moves || 0);
    setMistakes(session.mistakes || 0);
    setScore(session.score || 0);
    const restoredTime = Math.max(1, Number(session.timeLeft || 30));
    setTimeLeft(restoredTime);
    frozenTimeLeftRef.current = restoredTime;
    setIsPauseModalOpen(false);

    demoTimeoutRefs.current.forEach((t) => clearTimeout(t));
    demoTimeoutRefs.current = [];
    if (patternTimerRef.current) clearTimeout(patternTimerRef.current);

    if (mode === BRAIN_BLITZ_MODES.MEMORY_MATCH && session.boardState?.cards) {
      setMemoryCards(session.boardState.cards);
      setMatchedPairIds(new Set(session.boardState.matchedPairIds || []));
      setFlippedCardIndices([]);
      setIsMemoryEvaluating(false);
    } else if (mode === BRAIN_BLITZ_MODES.SEQUENCE_RECALL && session.boardState?.targetSequence) {
      setTargetSequence(session.boardState.targetSequence);
      setPlayerSequenceStep(session.boardState.stepIndex || 0);
      setIsDemonstrating(false);
    } else if (mode === BRAIN_BLITZ_MODES.PATTERN_RECALL && session.boardState?.patternIndices) {
      const config = PATTERN_RECALL_LEVELS[levelNum] || PATTERN_RECALL_LEVELS[1];
      setPatternConfig({
        ...config,
        patternIndices: session.boardState.patternIndices,
        patternSet: new Set(session.boardState.patternIndices),
      });
      setSelectedPatternCells(new Set(session.boardState.selectedIndices || []));
      setIsPatternMemorizing(false);
    } else {
      startLevel(mode, levelNum);
      return;
    }

    NavigationService.navigate('brain_blitz_gameplay', { mode, level: levelNum });
    setScreen('playing');
  };

  // 1. Initialize Memory Match
  const initMemoryMatch = (levelNum) => {
    const deckData = BrainBlitzGameService.generateMemoryMatchDeck(levelNum);
    setMemoryCards(deckData.cards);
    setFlippedCardIndices([]);
    setMatchedPairIds(new Set());
    setIsMemoryEvaluating(false);
    setTimeLeft(deckData.timeLimit);
    frozenTimeLeftRef.current = deckData.timeLimit;
  };

  // 2. Initialize Sequence Recall
  const initSequenceRecall = (levelNum) => {
    const seqData = BrainBlitzGameService.generateSequence(levelNum);
    setTargetSequence(seqData.sequence);
    setPlayerSequenceStep(0);
    setActiveHighlightedSymbol(null);
    setTimeLeft(seqData.timeLimit);
    frozenTimeLeftRef.current = seqData.timeLimit;

    // Start demonstration phase
    playSequenceDemonstration(seqData.sequence, seqData.stepDurationMs, seqData.pauseMs);
  };

  const playSequenceDemonstration = (sequence, stepDuration, pauseDuration) => {
    setIsDemonstrating(true);
    setPlayerSequenceStep(0);

    sequence.forEach((symbolIdx, stepIdx) => {
      const startTime = 700 + stepIdx * (stepDuration + pauseDuration);

      // Light on
      const tOn = setTimeout(() => {
        setActiveHighlightedSymbol(symbolIdx);
        BrainBlitzAudioService.playSequenceTone(symbolIdx);
      }, startTime);
      demoTimeoutRefs.current.push(tOn);

      // Light off
      const tOff = setTimeout(() => {
        setActiveHighlightedSymbol(null);
      }, startTime + stepDuration);
      demoTimeoutRefs.current.push(tOff);
    });

    // End of demo
    const totalDemoTime = 700 + sequence.length * (stepDuration + pauseDuration) + 300;
    const tEnd = setTimeout(() => {
      setIsDemonstrating(false);
    }, totalDemoTime);
    demoTimeoutRefs.current.push(tEnd);
  };

  // 3. Initialize Pattern Recall
  const initPatternRecall = (levelNum) => {
    const patData = BrainBlitzGameService.generatePattern(levelNum);
    setPatternConfig(patData);
    setSelectedPatternCells(new Set());
    setPatternEvaluation(null);
    setIsPatternMemorizing(true);
    setTimeLeft(patData.timeLimit);
    frozenTimeLeftRef.current = patData.timeLimit;

    // Memory display duration
    if (patternTimerRef.current) clearTimeout(patternTimerRef.current);
    patternTimerRef.current = setTimeout(() => {
      setIsPatternMemorizing(false);
    }, patData.displayDurationSeconds * 1000);
  };

  // -------------------------------------------------------------------------
  // GAMEPLAY ACTIONS
  // -------------------------------------------------------------------------

  // MODE 1: Memory Match Card Tap
  const handleCardTap = (index) => {
    if (isMemoryEvaluating || isPauseModalOpen || gameResult) return;
    if (flippedCardIndices.includes(index)) return;

    const tappedCard = memoryCards[index];
    if (matchedPairIds.has(tappedCard.pairId)) return;

    BrainBlitzAudioService.playFlip();

    if (flippedCardIndices.length === 0) {
      // First card tapped
      setFlippedCardIndices([index]);
    } else if (flippedCardIndices.length === 1) {
      // Second card tapped
      const firstIndex = flippedCardIndices[0];
      const firstCard = memoryCards[firstIndex];
      setFlippedCardIndices([firstIndex, index]);
      setMoves((m) => m + 1);

      if (firstCard.pairId === tappedCard.pairId) {
        // MATCH!
        BrainBlitzAudioService.playMatch();
        const updatedMatched = new Set(matchedPairIds);
        updatedMatched.add(firstCard.pairId);
        setMatchedPairIds(updatedMatched);
        setScore((s) => s + 100);
        setFlippedCardIndices([]);

        // Check Victory
        const config = MEMORY_MATCH_LEVELS[selectedLevel] || MEMORY_MATCH_LEVELS[1];
        if (updatedMatched.size >= config.pairs) {
          triggerLevelVictory();
        }
      } else {
        // MISMATCH
        setIsMemoryEvaluating(true);
        setMistakes((m) => m + 1);
        BrainBlitzAudioService.playMismatch();

        setTimeout(() => {
          setFlippedCardIndices([]);
          setIsMemoryEvaluating(false);
        }, 850);
      }
    }
  };

  // MODE 2: Sequence Recall Symbol Tap
  const handleSequenceSymbolTap = (symbolIdx) => {
    if (isDemonstrating || isPauseModalOpen || gameResult) return;

    BrainBlitzAudioService.playSequenceTone(symbolIdx);
    setActiveHighlightedSymbol(symbolIdx);
    setTimeout(() => setActiveHighlightedSymbol(null), 200);

    const expectedSymbolIdx = targetSequence[playerSequenceStep];

    if (symbolIdx === expectedSymbolIdx) {
      // Correct step
      const nextStep = playerSequenceStep + 1;
      setPlayerSequenceStep(nextStep);
      setScore((s) => s + 50);

      // Check if sequence completed
      if (nextStep >= targetSequence.length) {
        triggerLevelVictory();
      }
    } else {
      // Incorrect symbol tapped!
      BrainBlitzAudioService.playDefeat();
      setMistakes((m) => m + 1);
      setGameResult({
        isVictory: false,
        reason: `Incorrect sequence symbol! Expected ${SEQUENCE_RECALL_SYMBOLS[expectedSymbolIdx].name}, but you tapped ${SEQUENCE_RECALL_SYMBOLS[symbolIdx].name}.`,
      });
    }
  };

  // MODE 3: Pattern Recall Cell Tap & Submit
  const handlePatternCellTap = (cellIdx) => {
    if (isPatternMemorizing || isPauseModalOpen || gameResult || patternEvaluation) return;

    BrainBlitzAudioService.playSelect();
    const updated = new Set(selectedPatternCells);
    if (updated.has(cellIdx)) {
      updated.delete(cellIdx);
    } else {
      updated.add(cellIdx);
    }
    setSelectedPatternCells(updated);

    // Auto submit once required cells count is reached
    if (updated.size === patternConfig.highlightedCount) {
      evaluatePatternSubmission(Array.from(updated));
    }
  };

  const evaluatePatternSubmission = (selectedList) => {
    const evaluation = BrainBlitzGameService.evaluatePatternSubmission(
      patternConfig.patternIndices,
      selectedList
    );
    setPatternEvaluation(evaluation);

    if (evaluation.isPerfect) {
      BrainBlitzAudioService.playMatch();
      setTimeout(() => {
        triggerLevelVictory();
      }, 700);
    } else {
      BrainBlitzAudioService.playDefeat();
      setMistakes(evaluation.incorrectCount + evaluation.missedCount);
      setTimeout(() => {
        setGameResult({
          isVictory: false,
          reason: `Pattern Mismatch! You correctly identified ${evaluation.correctCount}/${evaluation.targetCount} coordinates, with ${evaluation.incorrectCount} incorrect cells.`,
        });
      }, 900);
    }
  };

  // -------------------------------------------------------------------------
  // LEVEL VICTORY & REWARDS
  // -------------------------------------------------------------------------
  const triggerLevelVictory = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    BrainBlitzAudioService.playVictory();

    const configTime =
      selectedMode === BRAIN_BLITZ_MODES.MEMORY_MATCH
        ? MEMORY_MATCH_LEVELS[selectedLevel].timeLimit
        : selectedMode === BRAIN_BLITZ_MODES.SEQUENCE_RECALL
        ? SEQUENCE_RECALL_LEVELS[selectedLevel].timeLimit
        : PATTERN_RECALL_LEVELS[selectedLevel].timeLimit;

    const durationSeconds = Math.max(1, configTime - timeLeft);
    const isPerfect = mistakes === 0;
    const isFast = durationSeconds < Math.round(configTime * 0.45);

    // Calculate stars
    let stars = 3;
    if (mistakes > 0 && mistakes <= 2) stars = 2;
    else if (mistakes > 2) stars = 1;

    let victoryPayload = {
      isVictory: true,
      stars,
      isPerfect,
      isFast,
      moves,
      mistakes,
      durationSeconds,
      xpAwarded: 0,
      coinsAwarded: 0,
      baseXp: 0,
      baseCoins: 0,
      alreadyCompleted: false,
    };

    if (user?.id) {
      try {
        await BrainBlitzPersistenceService.clearActiveSession(user.id);
        setActiveSavedSession(null);

        const res = await BrainBlitzPersistenceService.completeLevel(
          user.id,
          selectedMode,
          selectedLevel,
          {
            score,
            durationSeconds,
            moves,
            mistakes,
            isPerfect,
            isFast,
          }
        );

        victoryPayload = {
          ...victoryPayload,
          xpAwarded: res.xpAwarded,
          coinsAwarded: res.coinsAwarded,
          baseXp: res.baseXp,
          baseCoins: res.baseCoins,
          alreadyCompleted: res.alreadyCompleted,
          newUnlockedLevel: res.newUnlockedLevel,
        };

        if (addXp && res.xpAwarded > 0) await addXp(res.xpAwarded);
        if (addCoins && res.coinsAwarded > 0) await addCoins(res.coinsAwarded);

        await refreshStats();
        if (onSessionComplete) onSessionComplete();
      } catch (err) {
        console.warn('Error completing Brain Blitz level:', err);
      }
    }

    setGameResult(victoryPayload);
  };

  // -------------------------------------------------------------------------
  // PAUSE / RESUME / EXIT / DASHBOARD FLOWS
  // -------------------------------------------------------------------------

  // 1. Back button handler during active gameplay: triggers Exit Confirmation Dialog
  const handleBackRequested = () => {
    if (screen === 'playing') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      frozenTimeLeftRef.current = timeLeft;
      setPauseModalMode('exit_confirm');
      setIsPauseModalOpen(true);
    } else if (screen === 'levels') {
      NavigationService.navigate('brain_blitz');
      setScreen('hub');
    } else {
      if (onClose) onClose();
      NavigationService.navigateToDashboard();
    }
  };

  // 2. Pause button handler: triggers Tactical Pause HUD
  const handlePauseGame = () => {
    if (screen !== 'playing') return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    frozenTimeLeftRef.current = timeLeft;
    setPauseModalMode('pause');
    setIsPauseModalOpen(true);
  };

  // 3. Resume handler: smooth continuation with clock and board preserved
  const handleResumeGame = () => {
    setIsPauseModalOpen(false);
  };

  // 4. Save & Exit handler: saves unfinished session and navigates DIRECTLY to PIXO Dashboard
  const handleSaveAndExit = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    demoTimeoutRefs.current.forEach((t) => clearTimeout(t));
    if (patternTimerRef.current) clearTimeout(patternTimerRef.current);

    // Save unfinished session for persistence tracking
    if (user?.id && !gameResult) {
      let boardState = {};
      if (selectedMode === BRAIN_BLITZ_MODES.MEMORY_MATCH) {
        boardState = {
          cards: memoryCards,
          matchedPairIds: Array.from(matchedPairIds),
        };
      } else if (selectedMode === BRAIN_BLITZ_MODES.SEQUENCE_RECALL) {
        boardState = {
          targetSequence,
          stepIndex: playerSequenceStep,
        };
      } else if (selectedMode === BRAIN_BLITZ_MODES.PATTERN_RECALL) {
        boardState = {
          patternIndices: patternConfig?.patternIndices || [],
          selectedIndices: Array.from(selectedPatternCells),
        };
      }

      const saved = await BrainBlitzPersistenceService.saveActiveSession(user.id, {
        userId: user.id,
        gameId: 'g_brain_blitz',
        gameTitle: 'PIXO Brain Blitz',
        mode: selectedMode,
        modeTitle: currentModeMeta.title,
        level: selectedLevel,
        timeLeft: frozenTimeLeftRef.current || timeLeft,
        score,
        moves,
        mistakes,
        boardState,
        status: 'SAVED',
        timestamp: Date.now(),
      });
      setActiveSavedSession(saved);
    }

    setIsPauseModalOpen(false);
    setGameResult(null);
    setScreen(null);
    if (onClose) onClose();
    NavigationService.navigateToDashboard();
  };

  // 5. Direct Return to Dashboard (from Game Over or Victory screens)
  const handleReturnToDashboard = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    demoTimeoutRefs.current.forEach((t) => clearTimeout(t));
    if (patternTimerRef.current) clearTimeout(patternTimerRef.current);

    setGameResult(null);
    setScreen(null);
    if (onClose) onClose();
    NavigationService.navigateToDashboard();
  };

  // 6. Retry Level (Brand new attempt at same level with board/timer reset)
  const handleRetryLevel = async () => {
    if (user?.id) {
      await BrainBlitzPersistenceService.clearActiveSession(user.id);
      setActiveSavedSession(null);
    }
    startLevel(selectedMode, selectedLevel);
  };

  const handleModalClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    demoTimeoutRefs.current.forEach((t) => clearTimeout(t));
    if (patternTimerRef.current) clearTimeout(patternTimerRef.current);
    NavigationService.navigateToDashboard();
    if (onClose) onClose();
  };

  if (!visible) return null;

  const currentModeMeta = BRAIN_BLITZ_MODE_METADATA[selectedMode] || BRAIN_BLITZ_MODE_METADATA[BRAIN_BLITZ_MODES.MEMORY_MATCH];
  const modeProgress = playerStats?.modeProgress?.[selectedMode];
  const currentUnlocked = modeProgress?.unlockedLevel || 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleModalClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={handleModalClose} />

        <View style={[styles.modalCard, isMobile && styles.modalCardMobile]} onStartShouldSetResponder={() => true}>
          <LinearGradient colors={['#07140B', '#040B06', '#020603']} style={styles.modalGradient}>
            {/* ======================================================= */}
            {/* TOP HEADER BAR (Unified with PixoBackButton)            */}
            {/* ======================================================= */}
            <View style={styles.topHeaderBar}>
              <View style={styles.headerLeftGroup}>
                <PixoBackButton
                  onPress={handleBackRequested}
                  variant="circle"
                  size={18}
                  style={styles.modalBackArrow}
                  accessibilityLabel="Back to previous screen"
                />
                <View style={styles.headerTitleWrap}>
                  <View style={styles.brandBadge}>
                    <Ionicons name="flash" size={17} color="#39FF14" />
                  </View>
                  <View>
                    <Text style={styles.parentGameLabel}>PIXO BRAIN BLITZ</Text>
                    <Text style={styles.mainGameTitle}>
                      {screen === 'playing'
                        ? `${currentModeMeta.title.toUpperCase()} • LVL ${selectedLevel}`
                        : screen === 'levels'
                        ? `${currentModeMeta.title.toUpperCase()} • SELECT LEVEL`
                        : 'TRAIN YOUR BRAIN'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.headerRightActions}>
                {/* Audio Mute/Unmute Toggle Button */}
                <TouchableOpacity
                  style={[styles.headerPillBtn, isSoundMuted && styles.headerPillBtnMuted]}
                  onPress={handleToggleSound}
                  accessibilityLabel="Toggle sound"
                >
                  <Ionicons
                    name={isSoundMuted ? 'volume-mute-outline' : 'volume-high-outline'}
                    size={16}
                    color={isSoundMuted ? '#888888' : '#39FF14'}
                  />
                </TouchableOpacity>

                {screen !== 'hub' && (
                  <TouchableOpacity
                    style={styles.headerPillBtn}
                    onPress={() => {
                      if (screen === 'playing') handleBackRequested();
                      else {
                        NavigationService.navigate('brain_blitz');
                        setScreen('hub');
                      }
                    }}
                  >
                    <Ionicons name="home-outline" size={14} color="#00E5FF" style={{ marginRight: 4 }} />
                    <Text style={[styles.headerPillText, { color: '#00E5FF' }]}>HUB</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={handleBackRequested}
                  accessibilityLabel="Close game"
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ======================================================= */}
            {/* SCREEN 1: BRAIN BLITZ HUB                              */}
            {/* ======================================================= */}
            {screen === 'hub' && (
              <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
                {/* Brand Hero Slogan */}
                <View style={styles.heroSloganWrap}>
                  <Text style={styles.taglineText}>TRAIN YOUR BRAIN. BEAT YOUR BEST.</Text>
                  <Text style={styles.taglineSub}>
                    High-Tech Cognitive Arena • 3 Independent Neural Modes • 30 Progressive Levels
                  </Text>
                </View>

                {/* Overall Player Stats Row */}
                <View style={styles.statsCardGrid}>
                  <View style={styles.statSegment}>
                    <Text style={styles.statSegmentLabel}>TOTAL XP</Text>
                    <Text style={styles.statSegmentValueOrange}>+{playerStats?.totalXp ?? 0}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statSegment}>
                    <Text style={styles.statSegmentLabel}>COINS</Text>
                    <Text style={styles.statSegmentValueGold}>🪙 {playerStats?.totalCoins ?? 0}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statSegment}>
                    <Text style={styles.statSegmentLabel}>CLEARED</Text>
                    <Text style={styles.statSegmentValueGreen}>{playerStats?.totalCompletedLevels ?? 0}/30</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statSegment}>
                    <Text style={styles.statSegmentLabel}>BEST SCORE</Text>
                    <Text style={styles.statSegmentValueCyan}>{playerStats?.bestScore ?? 0}</Text>
                  </View>
                </View>

                {/* Active Unfinished Saved Game Session Banner */}
                {activeSavedSession && activeSavedSession.level && (
                  <View style={styles.savedSessionBanner}>
                    <LinearGradient
                      colors={['#0F2B14', '#08170B', '#040A06']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.savedSessionGradient}
                    >
                      <View style={styles.savedSessionLeft}>
                        <View style={styles.savedSessionIconWrap}>
                          <Ionicons name="play-circle" size={24} color="#39FF14" />
                        </View>
                        <View style={styles.savedSessionTextCol}>
                          <Text style={styles.savedSessionTag}>UNFINISHED SESSION DETECTED</Text>
                          <Text style={styles.savedSessionTitle}>
                            {BRAIN_BLITZ_MODE_METADATA[activeSavedSession.mode]?.title || 'Brain Blitz'} • Level {activeSavedSession.level}
                          </Text>
                          <Text style={styles.savedSessionDetails}>
                            {activeSavedSession.timeLeft}s clock frozen • Score: {activeSavedSession.score}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.resumeSavedBtn}
                        onPress={() => handleResumeSavedSession(activeSavedSession)}
                        activeOpacity={0.85}
                        accessibilityLabel="Resume saved game session"
                      >
                        <LinearGradient colors={['#39FF14', '#00E5FF']} style={styles.resumeSavedBtnGradient}>
                          <Ionicons name="play" size={13} color="#050705" style={{ marginRight: 4 }} />
                          <Text style={styles.resumeSavedBtnText}>RESUME</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                )}

                {/* 3 Playable Mode Cards */}
                <Text style={styles.sectionHeading}>SELECT TRAINING MODE</Text>

                <View style={styles.modeCardsWrap}>
                  {Object.values(BRAIN_BLITZ_MODES).map((modeKey) => {
                    const meta = BRAIN_BLITZ_MODE_METADATA[modeKey];
                    const progress = playerStats?.modeProgress?.[modeKey];
                    const completed = progress?.completedCount || 0;
                    const unlocked = progress?.unlockedLevel || 1;

                    return (
                      <TouchableOpacity
                        key={meta.id}
                        style={[styles.modeCard, { borderColor: `${meta.color}60` }]}
                        activeOpacity={0.85}
                        onPress={() => {
                          setSelectedMode(meta.id);
                          NavigationService.navigate('brain_blitz_levels', { mode: meta.id });
                          setScreen('levels');
                        }}
                      >
                        <LinearGradient colors={meta.accentGradient} style={styles.modeCardGradient}>
                          <View style={styles.modeCardTopRow}>
                            <View style={[styles.modeIconWrap, { borderColor: meta.color }]}>
                              <Ionicons name={meta.icon} size={24} color={meta.color} />
                            </View>

                            <View style={[styles.modeProgressPill, { borderColor: meta.color }]}>
                              <Text style={[styles.modeProgressText, { color: meta.color }]}>
                                {completed}/10 CLEARED
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.modeCardTitle}>{meta.title}</Text>
                          <Text style={[styles.modeCardSubtitle, { color: meta.secondaryColor }]}>
                            {meta.subtitle}
                          </Text>
                          <Text style={styles.modeCardDesc}>{meta.desc}</Text>

                          {/* Progress Track */}
                          <View style={styles.progressBarTrack}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${(completed / 10) * 100}%`,
                                  backgroundColor: meta.color,
                                },
                              ]}
                            />
                          </View>

                          <View style={styles.modeCardFooterRow}>
                            <Text style={styles.modeLevelStatus}>Unlocked: Level {unlocked}</Text>
                            <View style={[styles.playModeBtn, { backgroundColor: meta.color }]}>
                              <Text style={styles.playModeBtnText}>PLAY MODE ›</Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* ======================================================= */}
            {/* SCREEN 2: MODE LEVEL SELECTION (10 Levels Grid)        */}
            {/* ======================================================= */}
            {screen === 'levels' && (
              <View style={styles.flexOneContainer}>
                {/* Sector Header Bar */}
                <View style={[styles.sectorHeaderBar, { borderColor: `${currentModeMeta.color}40` }]}>
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                      NavigationService.navigate('brain_blitz');
                      setScreen('hub');
                    }}
                  >
                    <Ionicons name="arrow-back" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.backBtnText}>HUB</Text>
                  </TouchableOpacity>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.sectorHeaderTitle, { color: currentModeMeta.color }]}>
                      {currentModeMeta.title}
                    </Text>
                    <Text style={styles.sectorHeaderSub}>
                      {currentModeMeta.subtitle} • 10 Progressive Difficulty Tiers
                    </Text>
                  </View>
                </View>

                {/* 10 Levels Grid */}
                <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
                  <View style={styles.levelGridContainer}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => {
                      const isLocked = lvl > currentUnlocked;
                      const isCompleted = modeProgress?.completedLevels?.includes(lvl);
                      const reward = BRAIN_BLITZ_LEVEL_REWARDS[lvl];

                      return (
                        <TouchableOpacity
                          key={lvl}
                          style={[
                            styles.levelCard,
                            isLocked && styles.levelCardLocked,
                            isCompleted && styles.levelCardCompleted,
                            !isLocked && { borderColor: `${currentModeMeta.color}70` },
                          ]}
                          activeOpacity={isLocked ? 0.9 : 0.8}
                          onPress={() => {
                            if (isLocked) {
                              Alert.alert(
                                '🔒 Level Locked',
                                `Complete Level ${lvl - 1} of ${currentModeMeta.title} first to unlock Level ${lvl}!`
                              );
                              return;
                            }
                            startLevel(selectedMode, lvl);
                          }}
                        >
                          <LinearGradient
                            colors={
                              isCompleted
                                ? ['#0C2B14', '#07160B']
                                : isLocked
                                ? ['#0D0F0E', '#060807']
                                : currentModeMeta.accentGradient
                            }
                            style={styles.levelCardGradient}
                          >
                            <View style={styles.levelCardTop}>
                              <Text style={[styles.levelNumberText, !isLocked && { color: currentModeMeta.color }]}>
                                {lvl < 10 ? `0${lvl}` : lvl}
                              </Text>

                              {isLocked ? (
                                <Ionicons name="lock-closed" size={16} color="#666666" />
                              ) : isCompleted ? (
                                <Ionicons name="checkmark-circle" size={18} color="#39FF14" />
                              ) : (
                                <Ionicons name="play" size={16} color={currentModeMeta.color} />
                              )}
                            </View>

                            <Text style={styles.levelCardDetail}>
                              {selectedMode === BRAIN_BLITZ_MODES.MEMORY_MATCH
                                ? `${MEMORY_MATCH_LEVELS[lvl].pairs} Pairs (${MEMORY_MATCH_LEVELS[lvl].totalCards} Cards)`
                                : selectedMode === BRAIN_BLITZ_MODES.SEQUENCE_RECALL
                                ? `${SEQUENCE_RECALL_LEVELS[lvl].length} Glowing Steps`
                                : `${PATTERN_RECALL_LEVELS[lvl].gridSize}×${PATTERN_RECALL_LEVELS[lvl].gridSize} (${PATTERN_RECALL_LEVELS[lvl].highlightedCount} Cells)`}
                            </Text>

                            <View style={styles.levelRewardRow}>
                              <Text style={styles.levelRewardXp}>+{reward.xp} XP</Text>
                              <Text style={styles.levelRewardCoins}>+{reward.coins} 🪙</Text>
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* ======================================================= */}
            {/* SCREEN 3: ACTIVE GAMEPLAY ARENA                        */}
            {/* ======================================================= */}
            {screen === 'playing' && (
              <View style={styles.flexOneContainer}>
                {/* HUD Top Status Bar */}
                <View style={styles.hudBar}>
                  <View style={styles.hudStatItem}>
                    <Text style={styles.hudLabel}>TIME LEFT</Text>
                    <Text style={[styles.hudValue, timeLeft <= 10 && styles.hudValueDanger]}>
                      ⏱ {timeLeft}s
                    </Text>
                  </View>

                  <View style={styles.hudStatItem}>
                    <Text style={styles.hudLabel}>SCORE</Text>
                    <Text style={styles.hudValueCyan}>{score}</Text>
                  </View>

                  {selectedMode === BRAIN_BLITZ_MODES.MEMORY_MATCH ? (
                    <>
                      <View style={styles.hudStatItem}>
                        <Text style={styles.hudLabel}>PAIRS</Text>
                        <Text style={styles.hudValueGreen}>
                          {matchedPairIds.size}/{MEMORY_MATCH_LEVELS[selectedLevel]?.pairs || 3}
                        </Text>
                      </View>
                      <View style={styles.hudStatItem}>
                        <Text style={styles.hudLabel}>MOVES</Text>
                        <Text style={styles.hudValue}>{moves}</Text>
                      </View>
                    </>
                  ) : selectedMode === BRAIN_BLITZ_MODES.SEQUENCE_RECALL ? (
                    <View style={styles.hudStatItem}>
                      <Text style={styles.hudLabel}>PROGRESS</Text>
                      <Text style={styles.hudValueGreen}>
                        {playerSequenceStep}/{targetSequence.length}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.hudStatItem}>
                      <Text style={styles.hudLabel}>SELECTED</Text>
                      <Text style={styles.hudValueGold}>
                        {selectedPatternCells.size}/{patternConfig?.highlightedCount || 3}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.pausePillBtn} onPress={handlePauseGame}>
                    <Ionicons name="pause" size={14} color="#FFA000" style={{ marginRight: 4 }} />
                    <Text style={styles.pausePillText}>PAUSE</Text>
                  </TouchableOpacity>
                </View>

                {/* GAMEPLAY CONTENT CONTAINER */}
                <ScrollView
                  style={styles.gameplayScroll}
                  contentContainerStyle={styles.gameplayScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* -------------------------------------------------- */}
                  {/* SUB-ARENA 1: MEMORY MATCH CARDS GRID               */}
                  {/* -------------------------------------------------- */}
                  {selectedMode === BRAIN_BLITZ_MODES.MEMORY_MATCH && (
                    <View style={styles.memoryDeckWrap}>
                      <View style={styles.instructionBanner}>
                        <Text style={styles.instructionText}>
                          FLIP HIDDEN CARDS & MATCH IDENTICAL CYBER PAIRS
                        </Text>
                      </View>

                      <View style={styles.memoryCardsGrid}>
                        {memoryCards.map((card, idx) => {
                          const isFlipped = flippedCardIndices.includes(idx);
                          const isMatched = matchedPairIds.has(card.pairId);

                          return (
                            <TouchableOpacity
                              key={card.uid}
                              style={[
                                styles.memoryCardBox,
                                isMatched && styles.memoryCardMatched,
                                isFlipped && styles.memoryCardFlipped,
                                {
                                  width:
                                    memoryCards.length > 24
                                      ? isMobile
                                        ? '23%'
                                        : '15%'
                                      : memoryCards.length > 12
                                      ? isMobile
                                        ? '23%'
                                        : '23%'
                                      : isMobile
                                      ? '30%'
                                      : '23%',
                                },
                              ]}
                              activeOpacity={0.8}
                              onPress={() => handleCardTap(idx)}
                            >
                              {isFlipped || isMatched ? (
                                <LinearGradient
                                  colors={isMatched ? ['#0B2B11', '#06170A'] : ['#111E15', '#080E09']}
                                  style={styles.cardFaceContent}
                                >
                                  <Ionicons name={card.icon} size={28} color={card.color} />
                                  <Text style={[styles.cardSymbolName, { color: card.color }]} numberOfLines={1}>
                                    {card.name}
                                  </Text>
                                  {isMatched && (
                                    <View style={styles.matchedBadgeCheck}>
                                      <Ionicons name="checkmark" size={12} color="#39FF14" />
                                    </View>
                                  )}
                                </LinearGradient>
                              ) : (
                                <LinearGradient colors={['#0C160F', '#060B08']} style={styles.cardBackContent}>
                                  <Ionicons name="hardware-chip-outline" size={20} color="rgba(57, 255, 20, 0.35)" />
                                  <Text style={styles.cardBackLabel}>PIXO</Text>
                                </LinearGradient>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* -------------------------------------------------- */}
                  {/* SUB-ARENA 2: SEQUENCE RECALL (SIMON NEURAL PADS)   */}
                  {/* -------------------------------------------------- */}
                  {selectedMode === BRAIN_BLITZ_MODES.SEQUENCE_RECALL && (
                    <View style={styles.sequenceArenaWrap}>
                      <View
                        style={[
                          styles.instructionBanner,
                          isDemonstrating && { borderColor: '#00E5FF' },
                        ]}
                      >
                        <Text style={[styles.instructionText, isDemonstrating && { color: '#00E5FF' }]}>
                          {isDemonstrating
                            ? '👁️ MEMORIZE THE FLASHING SEQUENCE...'
                            : '⚡ YOUR TURN! REPEAT THE EXACT SEQUENCE'}
                        </Text>
                      </View>

                      {/* 8 Cyber Symbol Pads Grid */}
                      <View style={styles.sequenceGrid}>
                        {SEQUENCE_RECALL_SYMBOLS.map((sym, sIdx) => {
                          const isLit = activeHighlightedSymbol === sIdx;

                          return (
                            <TouchableOpacity
                              key={sym.id}
                              style={[
                                styles.sequencePad,
                                { borderColor: isLit ? '#FFFFFF' : `${sym.color}50` },
                                isLit && {
                                  backgroundColor: sym.color,
                                  shadowColor: sym.color,
                                  shadowOpacity: 0.9,
                                  shadowRadius: 18,
                                },
                              ]}
                              disabled={isDemonstrating}
                              activeOpacity={0.7}
                              onPress={() => handleSequenceSymbolTap(sIdx)}
                            >
                              <Ionicons
                                name={sym.icon}
                                size={32}
                                color={isLit ? '#050705' : sym.color}
                              />
                              <Text
                                style={[
                                  styles.sequencePadLabel,
                                  { color: isLit ? '#050705' : '#FFFFFF' },
                                ]}
                              >
                                {sym.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* -------------------------------------------------- */}
                  {/* SUB-ARENA 3: PATTERN RECALL (MATRIX GRID)          */}
                  {/* -------------------------------------------------- */}
                  {selectedMode === BRAIN_BLITZ_MODES.PATTERN_RECALL && patternConfig && (
                    <View style={styles.patternArenaWrap}>
                      <View
                        style={[
                          styles.instructionBanner,
                          isPatternMemorizing && { borderColor: '#39FF14' },
                        ]}
                      >
                        <Text style={[styles.instructionText, isPatternMemorizing && { color: '#39FF14' }]}>
                          {isPatternMemorizing
                            ? `🧠 MEMORIZE ${patternConfig.highlightedCount} HIGHLIGHTED CELLS...`
                            : `✨ REPRODUCE: SELECT ${patternConfig.highlightedCount} COORDINATES`}
                        </Text>
                      </View>

                      {/* NxN Grid */}
                      <View style={styles.patternMatrixBox}>
                        <View
                          style={[
                            styles.patternGridDynamic,
                            {
                              width: Math.min(width - 48, 380),
                              height: Math.min(width - 48, 380),
                            },
                          ]}
                        >
                          {Array.from({ length: patternConfig.totalCells }, (_, cellIdx) => {
                            const isOriginalTarget = patternConfig.patternSet.has(cellIdx);
                            const isSelected = selectedPatternCells.has(cellIdx);

                            // In evaluation phase
                            const isCorrect = patternEvaluation?.correctSelections?.includes(cellIdx);
                            const isIncorrect = patternEvaluation?.incorrectSelections?.includes(cellIdx);
                            const isMissed = patternEvaluation?.missedCells?.includes(cellIdx);

                            let cellBg = '#07120A';
                            let cellBorder = 'rgba(57, 255, 20, 0.2)';

                            if (isPatternMemorizing && isOriginalTarget) {
                              cellBg = '#39FF14';
                              cellBorder = '#FFFFFF';
                            } else if (patternEvaluation) {
                              if (isCorrect) {
                                cellBg = '#39FF14';
                                cellBorder = '#FFFFFF';
                              } else if (isIncorrect) {
                                cellBg = '#FF3B30';
                                cellBorder = '#FFFFFF';
                              } else if (isMissed) {
                                cellBg = '#FFD700';
                                cellBorder = '#FFFFFF';
                              }
                            } else if (isSelected) {
                              cellBg = '#00E5FF';
                              cellBorder = '#FFFFFF';
                            }

                            const cellSize = `${100 / patternConfig.gridSize}%`;

                            return (
                              <TouchableOpacity
                                key={cellIdx}
                                style={[
                                  styles.patternCell,
                                  {
                                    width: cellSize,
                                    height: cellSize,
                                    backgroundColor: cellBg,
                                    borderColor: cellBorder,
                                  },
                                ]}
                                disabled={isPatternMemorizing || !!patternEvaluation}
                                activeOpacity={0.75}
                                onPress={() => handlePatternCellTap(cellIdx)}
                              >
                                {isPatternMemorizing && isOriginalTarget && (
                                  <Ionicons name="sparkles" size={14} color="#050705" />
                                )}
                                {patternEvaluation && isCorrect && (
                                  <Ionicons name="checkmark" size={18} color="#050705" />
                                )}
                                {patternEvaluation && isIncorrect && (
                                  <Ionicons name="close" size={18} color="#FFFFFF" />
                                )}
                                {patternEvaluation && isMissed && (
                                  <Ionicons name="alert" size={16} color="#050705" />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

            {/* ======================================================= */}
            {/* POPUP 1: VICTORY CELEBRATION MODAL                      */}
            {/* ======================================================= */}
            {gameResult && gameResult.isVictory && (
              <View style={styles.resultOverlay}>
                <View style={styles.victoryCard}>
                  <LinearGradient colors={['#0E3316', '#06170A', '#020603']} style={styles.victoryCardGradient}>
                    <Ionicons name="trophy" size={48} color="#FFD700" style={{ alignSelf: 'center', marginBottom: 8 }} />
                    <Text style={styles.victoryHeading}>MISSION ACCOMPLISHED!</Text>
                    <Text style={styles.victorySub}>
                      {currentModeMeta.title} • Level {selectedLevel} Cleared
                    </Text>

                    {/* Star Rating */}
                    <View style={styles.starRow}>
                      {[1, 2, 3].map((s) => (
                        <Ionicons
                          key={s}
                          name={s <= (gameResult.stars || 3) ? 'star' : 'star-outline'}
                          size={28}
                          color="#FFD700"
                          style={{ marginHorizontal: 4 }}
                        />
                      ))}
                    </View>

                    {/* Reward Claims Card */}
                    <View style={styles.rewardReceiptBox}>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Level Base Reward:</Text>
                        <Text style={styles.receiptValue}>+{gameResult.baseXp} XP  •  +{gameResult.baseCoins} Coins</Text>
                      </View>
                      {gameResult.isPerfect && (
                        <View style={styles.receiptRow}>
                          <Text style={styles.receiptLabel}>Flawless Bonus:</Text>
                          <Text style={styles.receiptValueGold}>+10 XP  •  +2 Coins</Text>
                        </View>
                      )}
                      {gameResult.isFast && (
                        <View style={styles.receiptRow}>
                          <Text style={styles.receiptLabel}>Speed Rush Bonus:</Text>
                          <Text style={styles.receiptValueCyan}>+10 XP  •  +1 Coin</Text>
                        </View>
                      )}
                      <View style={styles.receiptDivider} />
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptTotalLabel}>TOTAL REWARD:</Text>
                        <Text style={styles.receiptTotalValue}>
                          +{gameResult.xpAwarded} XP  •  +{gameResult.coinsAwarded} Coins
                        </Text>
                      </View>
                      {gameResult.alreadyCompleted && (
                        <Text style={styles.antiFarmNotice}>
                          ℹ️ Level already cleared previously. Replays award 0 duplicate coins/XP.
                        </Text>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.victoryActionsRow}>
                      {selectedLevel < 10 && (
                        <TouchableOpacity
                          style={styles.nextLevelBtn}
                          onPress={() => startLevel(selectedMode, selectedLevel + 1)}
                          activeOpacity={0.85}
                          accessibilityLabel="Play next level"
                        >
                          <LinearGradient colors={['#39FF14', '#00E5FF']} style={styles.actionBtnGradient}>
                            <Ionicons name="play" size={15} color="#050705" style={{ marginRight: 4 }} />
                            <Text style={styles.nextLevelBtnText}>PLAY NEXT LEVEL</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.returnDashboardBtn}
                        onPress={handleReturnToDashboard}
                        activeOpacity={0.85}
                        accessibilityLabel="Return to PIXO dashboard"
                      >
                        <LinearGradient colors={['#0F2414', '#09150C']} style={styles.dashboardBtnGradient}>
                          <Ionicons name="home" size={15} color="#39FF14" style={{ marginRight: 6 }} />
                          <Text style={styles.returnDashboardBtnText}>RETURN TO DASHBOARD</Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.replayLevelBtn}
                        onPress={() => startLevel(selectedMode, selectedLevel)}
                        activeOpacity={0.8}
                        accessibilityLabel="Replay level"
                      >
                        <Text style={styles.replayLevelBtnText}>REPLAY LEVEL</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            )}

            {/* ======================================================= */}
            {/* POPUP 2: GAME OVER / FAILURE MODAL                      */}
            {/* ======================================================= */}
            {gameResult && !gameResult.isVictory && (
              <View style={styles.resultOverlay}>
                <View style={styles.defeatCard}>
                  <LinearGradient colors={['#2B0C0C', '#170606', '#050202']} style={styles.victoryCardGradient}>
                    <Ionicons name="alert-circle" size={48} color="#FF3B30" style={{ alignSelf: 'center', marginBottom: 8 }} />
                    <Text style={styles.defeatHeading}>GAME OVER</Text>
                    <Text style={styles.defeatSub}>Level {selectedLevel} Incomplete</Text>

                    <Text style={styles.defeatReasonText}>{gameResult.reason}</Text>

                    {/* Defeat Stats Overview */}
                    <View style={styles.defeatStatsBox}>
                      <View style={styles.defeatStatItem}>
                        <Text style={styles.defeatStatLabel}>LEVEL</Text>
                        <Text style={styles.defeatStatValue}>{selectedLevel}</Text>
                      </View>
                      <View style={styles.defeatStatDivider} />
                      <View style={styles.defeatStatItem}>
                        <Text style={styles.defeatStatLabel}>FINAL SCORE</Text>
                        <Text style={styles.defeatStatValue}>{score}</Text>
                      </View>
                      <View style={styles.defeatStatDivider} />
                      <View style={styles.defeatStatItem}>
                        <Text style={styles.defeatStatLabel}>TIME USED</Text>
                        <Text style={styles.defeatStatValue}>{gameResult.timeUsed || 45}s</Text>
                      </View>
                      <View style={styles.defeatStatDivider} />
                      <View style={styles.defeatStatItem}>
                        <Text style={styles.defeatStatLabel}>BEST SCORE</Text>
                        <Text style={styles.defeatStatValueCyan}>{playerStats?.bestScore || score}</Text>
                      </View>
                    </View>

                    <View style={styles.defeatActionsRow}>
                      <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={handleRetryLevel}
                        activeOpacity={0.85}
                        accessibilityLabel="Retry current level"
                      >
                        <LinearGradient colors={['#FF6A00', '#FF3B30']} style={styles.actionBtnGradient}>
                          <Ionicons name="refresh" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.nextLevelBtnText}>RETRY</Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.returnDashboardBtn}
                        onPress={handleReturnToDashboard}
                        activeOpacity={0.85}
                        accessibilityLabel="Return to PIXO dashboard"
                      >
                        <LinearGradient colors={['#0F2414', '#09150C']} style={styles.dashboardBtnGradient}>
                          <Ionicons name="home" size={15} color="#39FF14" style={{ marginRight: 6 }} />
                          <Text style={styles.returnDashboardBtnText}>RETURN TO DASHBOARD</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            )}

            {/* Tactical Pause Menu / Exit Confirmation Modal */}
            <PixoPauseModal
              visible={isPauseModalOpen}
              mode={pauseModalMode}
              gameTitle="BRAIN BLITZ"
              gameSubtitle={`${currentModeMeta.title} • Level ${selectedLevel}`}
              level={selectedLevel}
              timeLeft={frozenTimeLeftRef.current}
              score={score}
              currentQuestion={
                selectedMode === BRAIN_BLITZ_MODES.MEMORY_MATCH
                  ? matchedPairIds.size
                  : selectedMode === BRAIN_BLITZ_MODES.SEQUENCE_RECALL
                  ? playerSequenceStep
                  : selectedPatternCells.size
              }
              totalQuestions={
                selectedMode === BRAIN_BLITZ_MODES.MEMORY_MATCH
                  ? (MEMORY_MATCH_LEVELS[selectedLevel]?.pairsCount || 3)
                  : selectedMode === BRAIN_BLITZ_MODES.SEQUENCE_RECALL
                  ? (targetSequence.length || 3)
                  : (patternConfig?.highlightedCount || 3)
              }
              onResume={handleResumeGame}
              onSaveAndExit={handleSaveAndExit}
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
  },
  backdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '94%',
    maxWidth: 960,
    height: '92%',
    maxHeight: 880,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    backgroundColor: '#050705',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.95), 0 0 40px rgba(57, 255, 20, 0.2)',
        }
      : { elevation: 20 }),
  },
  modalCardMobile: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    borderWidth: 0,
  },
  modalGradient: {
    flex: 1,
  },

  // Header Bar
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 255, 20, 0.2)',
    backgroundColor: 'rgba(4, 11, 6, 0.95)',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalBackArrow: {
    marginRight: 10,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  parentGameLabel: {
    color: '#39FF14',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  mainGameTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerPillBtnMuted: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  headerPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },

  // Main Scrollable Body
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Hero Slogan
  heroSloganWrap: {
    backgroundColor: 'rgba(57, 255, 20, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  taglineText: {
    color: '#39FF14',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 4,
  },
  taglineSub: {
    color: '#99A89A',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Stats Card Grid
  statsCardGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 18, 12, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statSegment: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statSegmentLabel: {
    color: '#7A8E7E',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  statSegmentValueOrange: {
    color: '#FF6A00',
    fontSize: 14,
    fontWeight: '900',
  },
  statSegmentValueGold: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '900',
  },
  statSegmentValueGreen: {
    color: '#39FF14',
    fontSize: 14,
    fontWeight: '900',
  },
  statSegmentValueCyan: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '900',
  },

  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  // 3 Mode Cards
  modeCardsWrap: {
    gap: 12,
  },
  modeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#07120A',
  },
  modeCardGradient: {
    padding: 16,
  },
  modeCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeProgressPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modeProgressText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  modeCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  modeCardSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modeCardDesc: {
    color: '#99A89A',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  modeCardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeLevelStatus: {
    color: '#C0D0C2',
    fontSize: 11,
    fontWeight: '700',
  },
  playModeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  playModeBtnText: {
    color: '#050705',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  // Levels Screen
  flexOneContainer: {
    flex: 1,
  },
  sectorHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(7, 18, 11, 0.8)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  sectorHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  sectorHeaderSub: {
    color: '#8A9E8D',
    fontSize: 10.5,
  },

  // 10 Levels Grid
  levelGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  levelCard: {
    width: '48%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#07120A',
  },
  levelCardLocked: {
    opacity: 0.6,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  levelCardCompleted: {
    borderColor: 'rgba(57, 255, 20, 0.45)',
  },
  levelCardGradient: {
    padding: 12,
  },
  levelCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  levelNumberText: {
    color: '#888888',
    fontSize: 22,
    fontWeight: '900',
  },
  levelCardDetail: {
    color: '#99A89A',
    fontSize: 10.5,
    marginBottom: 8,
    lineHeight: 14,
  },
  levelRewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelRewardXp: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '800',
  },
  levelRewardCoins: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
  },

  // Gameplay HUD
  hudBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 255, 20, 0.2)',
    backgroundColor: 'rgba(5, 12, 7, 0.95)',
  },
  hudStatItem: {
    alignItems: 'center',
  },
  hudLabel: {
    color: '#7A8E7E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  hudValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  hudValueDanger: {
    color: '#FF3B30',
  },
  hudValueCyan: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '900',
  },
  hudValueGreen: {
    color: '#39FF14',
    fontSize: 13,
    fontWeight: '900',
  },
  hudValueGold: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '900',
  },
  pausePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 160, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 160, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pausePillText: {
    color: '#FFA000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  gameplayScroll: {
    flex: 1,
  },
  gameplayScrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },

  instructionBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  instructionText: {
    color: '#39FF14',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  // Mode 1: Memory Match Grid
  memoryDeckWrap: {
    width: '100%',
    alignItems: 'center',
  },
  memoryCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    width: '100%',
  },
  memoryCardBox: {
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    backgroundColor: '#07120A',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  memoryCardFlipped: {
    borderColor: '#00E5FF',
  },
  memoryCardMatched: {
    borderColor: '#39FF14',
  },
  cardFaceContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    position: 'relative',
  },
  cardBackContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackLabel: {
    color: 'rgba(57, 255, 20, 0.4)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 2,
  },
  cardSymbolName: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  matchedBadgeCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(57, 255, 20, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Mode 2: Sequence Recall (Simon)
  sequenceArenaWrap: {
    width: '100%',
    alignItems: 'center',
  },
  sequenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    maxWidth: 440,
    marginTop: 10,
  },
  sequencePad: {
    width: '45%',
    height: 110,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: 'rgba(10, 18, 12, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  sequencePadLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginTop: 6,
  },

  // Mode 3: Pattern Recall
  patternArenaWrap: {
    width: '100%',
    alignItems: 'center',
  },
  patternMatrixBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  patternGridDynamic: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(57, 255, 20, 0.35)',
    backgroundColor: '#040905',
  },
  patternCell: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },

  // Result Popups
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 999,
  },
  victoryCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#39FF14',
    backgroundColor: '#050705',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 0 50px rgba(57, 255, 20, 0.35)' }
      : { elevation: 20 }),
  },
  defeatCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF3B30',
    backgroundColor: '#050705',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 0 50px rgba(255, 59, 48, 0.35)' }
      : { elevation: 20 }),
  },
  victoryCardGradient: {
    padding: 22,
    alignItems: 'center',
  },
  victoryHeading: {
    color: '#39FF14',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 2,
  },
  victorySub: {
    color: '#C0D0C2',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  defeatHeading: {
    color: '#FF3B30',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 2,
  },
  defeatSub: {
    color: '#D0A0A0',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  defeatReasonText: {
    color: '#E0E8E1',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginVertical: 14,
  },
  starRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rewardReceiptBox: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    marginBottom: 18,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  receiptLabel: {
    color: '#99A89A',
    fontSize: 11,
  },
  receiptValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  receiptValueGold: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
  },
  receiptValueCyan: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '800',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 6,
  },
  receiptTotalLabel: {
    color: '#39FF14',
    fontSize: 12,
    fontWeight: '900',
  },
  receiptTotalValue: {
    color: '#39FF14',
    fontSize: 12,
    fontWeight: '900',
  },
  antiFarmNotice: {
    color: '#FFD700',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 6,
    fontStyle: 'italic',
  },
  victoryActionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  nextLevelBtn: {
    flex: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  retryBtn: {
    flex: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLevelBtnText: {
    color: '#050705',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  replayLevelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayLevelBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  hubReturnBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubReturnBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Return to Dashboard and Defeat Overview Elements
  returnDashboardBtn: {
    flex: 2,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#39FF14',
  },
  dashboardBtnGradient: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnDashboardBtnText: {
    color: '#39FF14',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  defeatStatsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    width: '100%',
    marginBottom: 16,
  },
  defeatStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  defeatStatLabel: {
    color: '#8A9E8D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  defeatStatValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  defeatStatValueCyan: {
    color: '#00E5FF',
    fontSize: 15,
    fontWeight: '900',
  },
  defeatStatDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  defeatActionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 4,
  },

  // Saved Session Banner on Hub
  savedSessionBanner: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#39FF14',
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 0 20px rgba(57, 255, 20, 0.25)' }
      : { elevation: 6 }),
  },
  savedSessionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  savedSessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  savedSessionIconWrap: {
    marginRight: 10,
  },
  savedSessionTextCol: {
    flex: 1,
  },
  savedSessionTag: {
    color: '#39FF14',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  savedSessionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },
  savedSessionDetails: {
    color: '#8A9E8D',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  resumeSavedBtn: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  resumeSavedBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resumeSavedBtnText: {
    color: '#050705',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

export default BrainBlitzGameModal;

