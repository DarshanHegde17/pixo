import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PathFinderGrid } from './PathFinderGrid';
import { PathFinderHUD } from './PathFinderHUD';
import { PathFinderService } from '../../../services/pathFinderService';
import { PathFinderPersistenceService } from '../../../services/pathFinderPersistenceService';
import { PathFinderAudioService } from '../../../services/pathFinderAudioService';

export const PathFinderGameScreen = ({
  stage,
  user,
  initialPath = null,
  initialTimer = 0,
  initialMoves = 0,
  initialHintsUsed = 0,
  initialMistakes = 0,
  onStageCompleted,
  onExitToStages,
  onExitToDashboard,
  onNextStage,
}) => {
  const [path, setPath] = useState(
    Array.isArray(initialPath) && initialPath.length > 0 ? initialPath : [stage.start]
  );
  const [timerSeconds, setTimerSeconds] = useState(initialTimer || 0);
  const [mistakesCount, setMistakesCount] = useState(initialMistakes || 0);
  const [hintsRemaining, setHintsRemaining] = useState(Math.max(0, 3 - (initialHintsUsed || 0)));
  const [hintsUsed, setHintsUsed] = useState(initialHintsUsed || 0);

  const [isPaused, setIsPaused] = useState(false);
  const [hintMessage, setHintMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [victoryData, setVictoryData] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const timerRef = useRef(null);

  // Active Timer
  useEffect(() => {
    if (!isPaused && !victoryData) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, victoryData]);

  // Auto-Save Active Session when state changes
  useEffect(() => {
    if (user?.id && !victoryData && path.length > 1) {
      PathFinderPersistenceService.saveActiveSession(user.id, {
        stageId: stage.id,
        stageTitle: stage.title,
        path,
        moveCount: Math.max(0, path.length - 1),
        timer: timerSeconds,
        hintsUsed,
        mistakes: mistakesCount,
      });
    }
  }, [path, timerSeconds, hintsUsed, mistakesCount, user?.id, stage.id, stage.title, victoryData]);

  /**
   * Handle Path Change from Grid (tap, backtrack, swipe)
   */
  const handlePathChange = useCallback(
    async (newPath) => {
      setPath(newPath);

      // Check if player has just reached the FINISH tile
      const lastTile = newPath[newPath.length - 1];
      const [finishR, finishC] = stage.finish;

      if (lastTile[0] === finishR && lastTile[1] === finishC) {
        // Player touched finish - Execute thorough logical validation!
        setIsEvaluating(true);
        const validation = PathFinderService.validatePath(stage, newPath);

        if (validation.valid) {
          // WIN!
          PathFinderAudioService.playVictory();
          try {
            const result = await PathFinderPersistenceService.recordStageCompletion(
              user?.id,
              stage.id,
              {
                moves: validation.moves,
                timerSeconds,
                hintsUsed,
                path: newPath,
              }
            );
            setVictoryData({
              ...result,
              stars: validation.moves <= (stage.maxMoves - 2) ? 3 : 2,
            });
            if (onStageCompleted) {
              onStageCompleted(result);
            }
          } catch (e) {
            console.warn('Error recording victory:', e);
            setVictoryData({
              stageId: stage.id,
              moves: validation.moves,
              timerSeconds,
              xpAwarded: stage.rewardXp,
              coinsAwarded: stage.rewardCoins,
              stars: 2,
            });
          }
        } else {
          // VALIDATION FAILED
          PathFinderAudioService.playDefeat();
          setMistakesCount((m) => m + 1);
          setErrorMessage(validation.error || 'Wrong path! Did not satisfy all puzzle rules.');
        }
        setIsEvaluating(false);
      }
    },
    [stage, user?.id, timerSeconds, hintsUsed, onStageCompleted]
  );

  /**
   * Request Diagnostic Hint
   */
  const handleHintPress = () => {
    if (hintsRemaining <= 0) return;
    PathFinderAudioService.playHint();
    const hint = PathFinderService.getHint(stage, path, hintsUsed);
    setHintMessage(hint);
    setHintsRemaining((h) => h - 1);
    setHintsUsed((u) => u + 1);
  };

  /**
   * Reset Path to Start
   */
  const handleResetPress = () => {
    PathFinderAudioService.playUndo();
    setPath([stage.start]);
    setErrorMessage(null);
  };

  /**
   * Undo last step
   */
  const handleUndoStep = () => {
    if (path.length > 1) {
      PathFinderAudioService.playUndo();
      setPath((prev) => prev.slice(0, prev.length - 1));
    }
  };

  /**
   * Save and Exit from Pause Menu
   */
  const handleSaveAndExit = async () => {
    if (user?.id) {
      await PathFinderPersistenceService.saveActiveSession(user.id, {
        stageId: stage.id,
        stageTitle: stage.title,
        path,
        moveCount: Math.max(0, path.length - 1),
        timer: timerSeconds,
        hintsUsed,
        mistakes: mistakesCount,
      });
    }
    setIsPaused(false);
    onExitToStages();
  };

  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <PathFinderHUD
        stage={stage}
        timerSeconds={timerSeconds}
        movesCount={Math.max(0, path.length - 1)}
        mistakesCount={mistakesCount}
        hintsRemaining={hintsRemaining}
        onHintPress={handleHintPress}
        onResetPress={handleResetPress}
        onPausePress={() => setIsPaused(true)}
        isLocked={!!victoryData || isEvaluating}
      />

      {/* Grid Canvas */}
      <View style={styles.gridSection}>
        <PathFinderGrid
          stage={stage}
          path={path}
          onPathChange={handlePathChange}
          isLocked={!!victoryData || isPaused}
          onTileBlocked={(msg) => {
            setMistakesCount((m) => m + 1);
          }}
        />
      </View>

      {/* Quick Action Bottom Controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.actionBtn, path.length <= 1 && styles.actionBtnDisabled]}
          onPress={handleUndoStep}
          disabled={path.length <= 1 || !!victoryData}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-undo-outline" size={18} color={path.length > 1 ? '#F8FAFC' : '#475569'} />
          <Text style={[styles.actionBtnText, path.length <= 1 && styles.actionBtnTextDisabled]}>
            Undo Step
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleResetPress}
          disabled={path.length <= 1 || !!victoryData}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Clear Route</Text>
        </TouchableOpacity>
      </View>

      {/* HINT MODAL */}
      <Modal visible={!!hintMessage} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.hintModalBox}>
            <View style={styles.hintIconCircle}>
              <Ionicons name="bulb" size={28} color="#00E5FF" />
            </View>
            <Text style={styles.hintModalTitle}>TACTICAL HINT</Text>
            <Text style={styles.hintModalBody}>{hintMessage}</Text>
            <TouchableOpacity
              style={styles.hintOkBtn}
              onPress={() => setHintMessage(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.hintOkBtnText}>GOT IT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* WRONG PATH / ERROR MODAL */}
      <Modal visible={!!errorMessage} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.errorModalBox}>
            <View style={styles.errorIconCircle}>
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
            </View>
            <Text style={styles.errorModalTitle}>WRONG PATH! TRY AGAIN.</Text>
            <Text style={styles.errorModalBody}>{errorMessage}</Text>

            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.errorRetryBtn}
                onPress={() => {
                  setErrorMessage(null);
                  handleUndoStep();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-undo" size={16} color="#000" />
                <Text style={styles.errorRetryText}>BACKTRACK 1 STEP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.errorClearBtn}
                onPress={() => {
                  setErrorMessage(null);
                  handleResetPress();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.errorClearText}>START OVER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PAUSE MODAL */}
      <Modal visible={isPaused} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pauseModalBox}>
            <Text style={styles.pauseTitle}>GAME PAUSED</Text>
            <Text style={styles.pauseSub}>
              {stage.name}: {stage.title}
            </Text>

            <View style={styles.pauseButtonsCol}>
              <TouchableOpacity
                style={styles.pausePrimaryBtn}
                onPress={() => setIsPaused(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={18} color="#000" />
                <Text style={styles.pausePrimaryText}>RESUME</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pauseSecondaryBtn}
                onPress={handleSaveAndExit}
                activeOpacity={0.8}
              >
                <Ionicons name="save-outline" size={18} color="#FFD700" />
                <Text style={styles.pauseSecondaryText}>SAVE & EXIT TO STAGES</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pauseSecondaryBtn}
                onPress={() => {
                  setIsPaused(false);
                  handleResetPress();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={18} color="#94A3B8" />
                <Text style={styles.pauseSecondaryText}>RESTART PUZZLE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pauseDangerBtn}
                onPress={() => {
                  setIsPaused(false);
                  onExitToDashboard();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.pauseDangerText}>EXIT TO DASHBOARD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VICTORY MODAL */}
      <Modal visible={!!victoryData} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.victoryModalBox}>
            <View style={styles.victoryIconCircle}>
              <Ionicons name="trophy" size={38} color="#FFD700" />
            </View>

            <Text style={styles.victoryTitle}>PUZZLE SOLVED!</Text>
            <Text style={styles.victorySub}>
              Master route completed on {stage.name}: {stage.title}
            </Text>

            {/* Stars row */}
            <View style={styles.victoryStarsRow}>
              {[1, 2, 3].map((starIdx) => (
                <Ionicons
                  key={`vstar_${starIdx}`}
                  name={starIdx <= (victoryData?.stars || 3) ? 'star' : 'star-outline'}
                  size={26}
                  color="#FFD700"
                  style={{ marginHorizontal: 3 }}
                />
              ))}
            </View>

            {/* Stats summary */}
            <View style={styles.victoryStatsGrid}>
              <View style={styles.victoryStatItem}>
                <Text style={styles.victoryStatVal}>{victoryData?.moves || path.length - 1}</Text>
                <Text style={styles.victoryStatLabel}>MOVES</Text>
              </View>
              <View style={styles.victoryStatDivider} />
              <View style={styles.victoryStatItem}>
                <Text style={styles.victoryStatVal}>{timerSeconds}s</Text>
                <Text style={styles.victoryStatLabel}>TIME</Text>
              </View>
              <View style={styles.victoryStatDivider} />
              <View style={styles.victoryStatItem}>
                <Text style={[styles.victoryStatVal, { color: '#39FF14' }]}>
                  +{stage.rewardXp}
                </Text>
                <Text style={styles.victoryStatLabel}>XP</Text>
              </View>
              <View style={styles.victoryStatDivider} />
              <View style={styles.victoryStatItem}>
                <Text style={[styles.victoryStatVal, { color: '#FFD700' }]}>
                  +{stage.rewardCoins}
                </Text>
                <Text style={styles.victoryStatLabel}>COINS</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.victoryActionsCol}>
              {stage.id < 10 && (
                <TouchableOpacity
                  style={styles.nextStageBtn}
                  onPress={() => {
                    setVictoryData(null);
                    onNextStage(stage.id + 1);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nextStageBtnText}>NEXT STAGE (STAGE {stage.id + 1})</Text>
                  <Ionicons name="arrow-forward" size={18} color="#000" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.victorySecondaryBtn}
                onPress={() => {
                  setVictoryData(null);
                  handleResetPress();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={16} color="#94A3B8" />
                <Text style={styles.victorySecondaryText}>REPLAY STAGE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.victoryTertiaryBtn}
                onPress={() => {
                  setVictoryData(null);
                  onExitToStages();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.victoryTertiaryText}>STAGE SELECTION</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050805',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  gridSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d170f',
    borderWidth: 1,
    borderColor: '#1e3322',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  actionBtnDisabled: {
    opacity: 0.5,
    borderColor: '#142017',
  },
  actionBtnText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 6,
  },
  actionBtnTextDisabled: {
    color: '#475569',
  },

  // Modals Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Hint Box
  hintModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#08120d',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    padding: 20,
    alignItems: 'center',
  },
  hintIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  hintModalTitle: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  hintModalBody: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
  },
  hintOkBtn: {
    backgroundColor: '#00E5FF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  hintOkBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.8,
  },

  // Error Box
  errorModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#14080a',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    padding: 20,
    alignItems: 'center',
  },
  errorIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorModalTitle: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  errorModalBody: {
    color: '#F87171',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  errorRetryBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 11,
    borderRadius: 10,
  },
  errorRetryText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  errorClearBtn: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#201014',
    borderWidth: 1,
    borderColor: '#3c1820',
    paddingVertical: 11,
    borderRadius: 10,
  },
  errorClearText: {
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 11,
  },

  // Pause Box
  pauseModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0a100c',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1d3121',
    padding: 22,
    alignItems: 'center',
  },
  pauseTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  pauseSub: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 20,
  },
  pauseButtonsCol: {
    width: '100%',
    gap: 10,
  },
  pausePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#39FF14',
    paddingVertical: 13,
    borderRadius: 10,
  },
  pausePrimaryText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  pauseSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101a12',
    borderWidth: 1,
    borderColor: '#1f3523',
    paddingVertical: 12,
    borderRadius: 10,
  },
  pauseSecondaryText: {
    color: '#E2E8F0',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 6,
  },
  pauseDangerBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  pauseDangerText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 12,
  },

  // Victory Box
  victoryModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#08120c',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#39FF14',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#39FF14',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  victoryIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  victoryTitle: {
    color: '#39FF14',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  victorySub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  victoryStarsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  victoryStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#060a07',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#152417',
    marginBottom: 18,
  },
  victoryStatItem: {
    alignItems: 'center',
  },
  victoryStatVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  victoryStatLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  victoryStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#152417',
  },
  victoryActionsCol: {
    width: '100%',
    gap: 8,
  },
  nextStageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#39FF14',
    paddingVertical: 13,
    borderRadius: 10,
    shadowColor: '#39FF14',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  nextStageBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  victorySecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101a12',
    borderWidth: 1,
    borderColor: '#1f3523',
    paddingVertical: 11,
    borderRadius: 10,
  },
  victorySecondaryText: {
    color: '#E2E8F0',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 6,
  },
  victoryTertiaryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  victoryTertiaryText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
});

