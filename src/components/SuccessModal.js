import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

/**
 * Cinematic Success Modal for SOLOPLAY V2
 * Appears upon successful login or verified registration
 */
export const SuccessModal = ({
  visible,
  email,
  name,
  isRegistration = false,
  onClose,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          <View style={styles.borderGlow}>
            <View style={styles.innerCard}>
              {/* Checkmark Badge */}
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
              </View>

              <Text style={styles.title}>
                {isRegistration ? 'ACCOUNT VERIFIED & READY' : 'PLAYER ACCESS GRANTED'}
              </Text>

              <Text style={styles.subtitle}>
                {isRegistration ? 'Welcome to PIXO,' : 'Welcome back,'}{' '}
                <Text style={styles.highlight}>{name || 'Player'}</Text>
              </Text>

              {email ? (
                <View style={styles.userBadge}>
                  <Ionicons name="mail" size={14} color={colors.primary} />
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.infoText}>
                {isRegistration
                  ? 'Your Gmail OTP has been verified by the backend. Your player profile and session are now active.'
                  : 'Session credentials validated. Ready to enter the arena and resume your quests.'}
              </Text>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>ENTER THE GAME ARENA →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 5, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }
      : {}),
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    overflow: 'hidden',
  },
  borderGlow: {
    backgroundColor: 'rgba(57, 255, 20, 0.35)',
    padding: 1.5,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.45)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '0 12px 48px rgba(0, 0, 0, 0.9), 0 0 30px rgba(57, 255, 20, 0.25)',
        }
      : {
          elevation: 12,
        }),
  },
  innerCard: {
    backgroundColor: 'rgba(15, 22, 16, 0.97)',
    borderRadius: 23,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    marginBottom: spacing.md,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 24px rgba(57, 255, 20, 0.35)',
        }
      : {}),
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: 1.2,
    textAlign: 'center',
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', sans-serif",
        }
      : {}),
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  highlight: {
    color: colors.primary,
    fontWeight: '800',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 16, 12, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    marginBottom: spacing.md,
    maxWidth: '90%',
  },
  userEmail: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#39FF14',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.8)',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(57, 255, 20, 0.35)',
        }
      : {}),
  },
  actionBtnText: {
    color: '#050705',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', sans-serif",
        }
      : {}),
  },
});

export default SuccessModal;
