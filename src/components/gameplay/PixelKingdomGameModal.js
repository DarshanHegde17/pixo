import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { NavigationService } from '../../services/navigationService';
import { PixelKingdomIntroScreen } from './pixelKingdom/PixelKingdomIntroScreen';
import { PixelKingdomLevelSelect } from './pixelKingdom/PixelKingdomLevelSelect';
import { PixelKingdomGameScreen } from './pixelKingdom/PixelKingdomGameScreen';
import { PixelKingdomPersistenceService } from '../../services/pixelKingdomPersistenceService';
import { useAuth } from '../../context/AuthContext';

export const PixelKingdomGameModal = ({
  visible,
  initialLevel = 1,
  onClose,
  onSessionComplete,
}) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // Screen state: 'intro' | 'levels' | 'playing'
  const [screen, setScreen] = useState('intro');
  const [activeLevel, setActiveLevel] = useState(initialLevel || 1);
  const [savedSession, setSavedSession] = useState(null);
  const [resumeData, setResumeData] = useState(null);

  // Load saved mission on open
  const checkSavedSession = useCallback(async () => {
    try {
      const active = await PixelKingdomPersistenceService.getActiveSession(userId);
      setSavedSession(active);
    } catch (e) {
      console.warn('Failed to inspect saved Pixel Kingdom session:', e);
    }
  }, [userId]);

  useEffect(() => {
    if (visible) {
      checkSavedSession();
      setScreen('intro');
    }
  }, [visible, checkSavedSession]);

  // Centralized Navigation Sync
  useEffect(() => {
    if (!visible) return;

    const syncWithRoute = (route) => {
      if (!route || !route.id) return;
      if (route.id === 'pixel_kingdom') {
        setScreen('intro');
      } else if (route.id === 'pixel_kingdom_levels') {
        setScreen('levels');
      } else if (route.id === 'pixel_kingdom_gameplay') {
        if (route.params?.level) setActiveLevel(Number(route.params.level));
        setScreen('playing');
      }
    };

    syncWithRoute(NavigationService.getCurrentRoute());
    const unsub = NavigationService.subscribe(syncWithRoute);
    return unsub;
  }, [visible]);

  // Back Navigation Handler
  useEffect(() => {
    if (!visible) return;

    const unregister = NavigationService.registerBackHandler(
      'pixel_kingdom_game_modal',
      () => {
        if (screen === 'playing') {
          // In gameplay: return to levels
          NavigationService.navigate('pixel_kingdom_levels');
          setScreen('levels');
          return true;
        } else if (screen === 'levels') {
          // In levels: return to intro
          NavigationService.navigate('pixel_kingdom');
          setScreen('intro');
          return true;
        } else if (screen === 'intro') {
          // In intro: exit modal to dashboard
          if (onClose) onClose();
          NavigationService.navigateToDashboard();
          return true;
        }
        return false;
      },
      70
    );

    return unregister;
  }, [visible, screen, onClose]);

  // Handle Start Adventure
  const handleStartAdventure = () => {
    setResumeData(null);
    NavigationService.navigate('pixel_kingdom_levels');
    setScreen('levels');
  };

  // Handle Select Level
  const handleSelectLevel = (levelNum) => {
    setResumeData(null);
    setActiveLevel(Number(levelNum));
    NavigationService.navigate('pixel_kingdom_gameplay', { level: levelNum });
    setScreen('playing');
  };

  // Handle Resume Saved Mission
  const handleResumeSavedMission = (session) => {
    const lvl = session?.level || 1;
    setActiveLevel(Number(lvl));
    setResumeData(session);
    NavigationService.navigate('pixel_kingdom_gameplay', { level: lvl });
    setScreen('playing');
  };

  // Handle Mission Completed Callback
  const handleMissionCompleted = (report) => {
    checkSavedSession();
    if (onSessionComplete) onSessionComplete(report);
  };

  // Handle Exit to Dashboard
  const handleExitToDashboard = () => {
    if (onClose) onClose();
    NavigationService.navigateToDashboard();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => NavigationService.goBack()}
    >
      <View style={styles.modalRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#050A06" />

        {screen === 'intro' && (
          <PixelKingdomIntroScreen
            onStartAdventure={handleStartAdventure}
            onResumeSavedMission={handleResumeSavedMission}
            savedSession={savedSession}
            onExit={handleExitToDashboard}
          />
        )}

        {screen === 'levels' && (
          <PixelKingdomLevelSelect
            userId={userId}
            onSelectLevel={handleSelectLevel}
            onBackToIntro={() => {
              NavigationService.navigate('pixel_kingdom');
              setScreen('intro');
            }}
          />
        )}

        {screen === 'playing' && (
          <PixelKingdomGameScreen
            levelNumber={activeLevel}
            userId={userId}
            initialSavedState={resumeData}
            onMissionCompleted={handleMissionCompleted}
            onExitToLevelSelect={(nextLvl) => {
              if (nextLvl && nextLvl <= 10) {
                setActiveLevel(nextLvl);
                setResumeData(null);
              } else {
                NavigationService.navigate('pixel_kingdom_levels');
                setScreen('levels');
              }
            }}
            onExitToDashboard={handleExitToDashboard}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#050A06',
  },
});

