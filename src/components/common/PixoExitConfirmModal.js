import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NavigationService } from '../../services/navigationService';

/**
 * PixoExitConfirmModal — Root Dashboard Application Exit Confirmation
 * 
 * Master Prompt Section 8 Requirements:
 * - Triggered when player presses Back on the root Dashboard.
 * - Displays professional confirmation popup:
 *     "Do you want to exit PIXO?"
 * - Buttons:
 *     1. [ STAY IN PIXO ]: Dismisses popup and remains in dashboard.
 *     2. [ EXIT APP ]: For Android APK, calls BackHandler.exitApp().
 */
export const PixoExitConfirmModal = ({
  visible,
  onDismiss,
  onConfirmExit,
}) => {
  useEffect(() => {
    if (visible) {
      const unregister = NavigationService.registerBackHandler(
        'pixo_exit_confirm_modal',
        () => {
          if (onDismiss) onDismiss();
          return true;
        },
        100 // Highest priority: Confirmation popup
      );
      return unregister;
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  const handleExitApp = () => {
    if (onConfirmExit) {
      onConfirmExit();
    } else {
      NavigationService.exitApp();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient
            colors={['#122416', '#0A150D', '#050A07']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Warning / Exit Badge */}
            <View style={styles.badgeWrapper}>
              <View style={styles.badgeCircle}>
                <Ionicons name="log-out-outline" size={26} color="#39FF14" />
              </View>
            </View>

            <Text style={styles.title}>Do you want to exit PIXO?</Text>
            <Text style={styles.message}>
              Your progress, coins, and battle statistics are saved safely in cloud memory.
            </Text>

            <View style={styles.buttonsColumn}>
              {/* Stay in PIXO (Primary Recommended) */}
              <TouchableOpacity
                style={styles.stayButton}
                onPress={onDismiss}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#39FF14', '#00E5FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.stayButtonGradient}
                >
                  <Ionicons name="checkmark-circle" size={17} color="#050705" style={{ marginRight: 6 }} />
                  <Text style={styles.stayButtonText}>STAY IN PIXO</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Exit App (Destructive) */}
              <TouchableOpacity
                style={styles.exitButton}
                onPress={handleExitApp}
                activeOpacity={0.8}
              >
                <Ionicons name="exit-outline" size={16} color="#FF453A" style={{ marginRight: 6 }} />
                <Text style={styles.exitButtonText}>EXIT APP</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    zIndex: 99999,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.6,
    borderColor: '#39FF14',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 30px rgba(57, 255, 20, 0.3), 0 10px 40px rgba(0, 0, 0, 0.9)',
        }
      : {}),
  },
  cardGradient: {
    padding: 22,
    alignItems: 'center',
  },
  badgeWrapper: {
    marginBottom: 14,
  },
  badgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderWidth: 1.5,
    borderColor: '#39FF14',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 14px rgba(57, 255, 20, 0.35)' } : {}),
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    color: '#8A9E8D',
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonsColumn: {
    width: '100%',
    gap: 10,
  },
  stayButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(57, 255, 20, 0.28)',
        }
      : {}),
  },
  stayButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  stayButtonText: {
    color: '#050705',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 69, 58, 0.4)',
    borderRadius: 14,
    paddingVertical: 12,
    width: '100%',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  exitButtonText: {
    color: '#FF453A',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

export default PixoExitConfirmModal;
