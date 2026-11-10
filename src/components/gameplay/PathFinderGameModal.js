import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { NavigationService } from '../../services/navigationService';
import { PathFinderIntroScreen } from './pathFinder/PathFinderIntroScreen';
import { PathFinderStageSelect } from './pathFinder/PathFinderStageSelect';
import { PathFinderGameScreen } from './pathFinder/PathFinderGameScreen';
import { PathFinderService, PATH_FINDER_STAGES } from '../../services/pathFinderService';
import { PathFinderPersistenceService } from '../../services/pathFinderPersistenceService';

export const PathFinderGameModal = ({
  visible,
  initialStage = 1,
  onClose,
  onSessionComplete,
}) => {
  const { user } = useAuth();

  // Screen flow: 'intro' -> 'stages' -> 'playing'
  const [screen, setScreen] = useState('intro');
  const [selectedStageId, setSelectedStageId] = useState(initialStage || 1);

  const [unlockedStage, setUnlockedStage] = useState(1);
  const [completedStages, setCompletedStages] = useState([]);
  const [stageStats, setStageStats] = useState({});
  const [savedSession, setSavedSession] = useState(null);

  // Resume state
  const [resumeData, setResumeData] = useState(null);

  // Load user progress and saved session
  const loadUserProgress = useCallback(async () => {
    if (!user?.id) return;
    try {
      const unlocked = await PathFinderPersistenceService.getUnlockedStage(user.id);
      const completed = await PathFinderPersistenceService.getCompletedStages(user.id);
      const stats = await PathFinderPersistenceService.getStageStats(user.id);
      const active = await PathFinderPersistenceService.getActiveSession(user.id);

      setUnlockedStage(unlocked);
      setCompletedStages(completed);
      setStageStats(stats || {});
      setSavedSession(active);
    } catch (e) {
      console.warn('Error loading Path Finder user progress:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    if (visible) {
      loadUserProgress();
      const current = NavigationService.getCurrentRoute();
      if (current?.id === 'path_finder_stages') {
        setScreen('stages');
      } else if (current?.id === 'path_finder_gameplay') {
        setScreen('playing');
      } else {
        setScreen('intro');
      }
    }
  }, [visible, loadUserProgress]);

  // Synchronize screen with NavigationService route changes
  useEffect(() => {
    if (!visible) return;

    const syncWithRoute = (route) => {
      if (!route) return;
      if (route.id === 'home' || route.id === 'games') {
        if (onClose) onClose();
      } else if (route.id === 'path_finder') {
        setScreen('intro');
      } else if (route.id === 'path_finder_stages') {
        setScreen('stages');
      } else if (route.id === 'path_finder_gameplay') {
        setScreen('playing');
      }
    };

    syncWithRoute(NavigationService.getCurrentRoute());
    const unsub = NavigationService.subscribe(syncWithRoute);
    return unsub;
  }, [visible, onClose]);

  // Centralized Navigation Back Handler Registration
  useEffect(() => {
    if (!visible) return;

    const unregister = NavigationService.registerBackHandler(
      'path_finder_modal',
      () => {
        if (screen === 'playing') {
          NavigationService.navigate('path_finder_stages');
          setScreen('stages');
          return true;
        }
        if (screen === 'stages') {
          NavigationService.navigate('path_finder');
          setScreen('intro');
          return true;
        }
        if (screen === 'intro') {
          handleClose();
          return true;
        }
        return false;
      },
      80
    );

    return unregister;
  }, [visible, screen, onClose]);

  const handleClose = () => {
    NavigationService.navigate('games');
    if (onClose) onClose();
  };

  const handleStartPuzzle = () => {
    NavigationService.navigate('path_finder_stages');
    setScreen('stages');
  };

  const handleResumePuzzle = () => {
    if (savedSession && savedSession.stageId) {
      setSelectedStageId(savedSession.stageId);
      setResumeData(savedSession);
      NavigationService.navigate('path_finder_gameplay');
      setScreen('playing');
    } else {
      NavigationService.navigate('path_finder_stages');
      setScreen('stages');
    }
  };

  const handleNewPuzzle = async () => {
    if (user?.id) {
      await PathFinderPersistenceService.clearActiveSession(user.id);
      setSavedSession(null);
    }
    setResumeData(null);
    NavigationService.navigate('path_finder_stages');
    setScreen('stages');
  };

  const handleSelectStage = (stageId) => {
    setSelectedStageId(stageId);
    setResumeData(null);
    NavigationService.navigate('path_finder_gameplay');
    setScreen('playing');
  };

  const handleStageCompleted = async (completionResult) => {
    await loadUserProgress();
    if (onSessionComplete) {
      onSessionComplete(completionResult);
    }
  };

  const handleNextStage = (nextId) => {
    setSelectedStageId(nextId);
    setResumeData(null);
    NavigationService.navigate('path_finder_gameplay');
    setScreen('playing');
  };

  if (!visible) return null;

  const activeStageConfig = PathFinderService.getStage(selectedStageId);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={() => {
        if (screen === 'playing') {
          NavigationService.navigate('path_finder_stages');
          setScreen('stages');
        } else if (screen === 'stages') {
          NavigationService.navigate('path_finder');
          setScreen('intro');
        } else {
          handleClose();
        }
      }}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#050805" />
        <View style={styles.container}>
          {screen === 'intro' && (
            <PathFinderIntroScreen
              onStartPuzzle={handleStartPuzzle}
              onResumePuzzle={handleResumePuzzle}
              onNewPuzzle={handleNewPuzzle}
              onExit={handleClose}
              savedSession={savedSession}
              unlockedStage={unlockedStage}
            />
          )}

          {screen === 'stages' && (
            <PathFinderStageSelect
              unlockedStage={unlockedStage}
              completedStages={completedStages}
              stageStats={stageStats}
              onSelectStage={handleSelectStage}
              onBack={() => {
                NavigationService.navigate('path_finder');
                setScreen('intro');
              }}
            />
          )}

          {screen === 'playing' && (
            <PathFinderGameScreen
              stage={activeStageConfig}
              user={user}
              initialPath={resumeData?.path || null}
              initialTimer={resumeData?.timer || 0}
              initialMoves={resumeData?.moveCount || 0}
              initialHintsUsed={resumeData?.hintsUsed || 0}
              initialMistakes={resumeData?.mistakes || 0}
              onStageCompleted={handleStageCompleted}
              onExitToStages={() => {
                loadUserProgress();
                NavigationService.navigate('path_finder_stages');
                setScreen('stages');
              }}
              onExitToDashboard={handleClose}
              onNextStage={handleNextStage}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050805',
  },
  container: {
    flex: 1,
    backgroundColor: '#050805',
  },
});
