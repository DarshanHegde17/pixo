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
 * SOLOPLAY V3 Cinematic Game Details Modal
 */
export const GameDetailsModal = ({
  visible,
  game,
  onClose,
  onLaunch,
}) => {
  if (!visible || !game) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Glowing Border Wrap */}
          <View style={styles.borderGlow}>
            <View style={styles.innerCard}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.titleWrap}>
                  <Text style={styles.modalGenre}>{game.category || game.genre || 'Single Player'}</Text>
                  <Text style={styles.modalTitle}>{game.title}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Tags */}
              {Array.isArray(game.tags) && (
                <View style={styles.modalTagRow}>
                  {game.tags.map((tag, idx) => (
                    <View key={idx} style={styles.modalTag}>
                      <Text style={styles.modalTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Description */}
              <Text style={styles.modalDesc}>
                {game.desc || game.description || 'Embark on an immersive solo journey with high-octane gameplay, rich storyline, and seamless progression.'}
              </Text>

              {/* Specs & Capabilities Box */}
              <View style={styles.modalStatsBox}>
                <View style={styles.modalStatItem}>
                  <Ionicons name="star" size={15} color="#FFB547" />
                  <Text style={styles.modalStatText}>{game.rating || '4.9 ★'}</Text>
                </View>
                <View style={styles.modalStatDivider} />
                <View style={styles.modalStatItem}>
                  <Ionicons name="cloud-done-outline" size={15} color={colors.primary} />
                  <Text style={styles.modalStatText}>Cloud Saved</Text>
                </View>
                <View style={styles.modalStatDivider} />
                <View style={styles.modalStatItem}>
                  <Ionicons name="game-controller-outline" size={15} color={colors.orangeWarm} />
                  <Text style={styles.modalStatText}>Controller Ready</Text>
                </View>
              </View>

              {/* Launch Game Action Button */}
              <TouchableOpacity
                style={styles.launchButton}
                onPress={() => onLaunch(game)}
                activeOpacity={0.85}
              >
                <Ionicons name="play" size={17} color="#050705" style={{ marginRight: 8 }} />
                <Text style={styles.launchButtonText}>LAUNCH SOLO MISSION →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 5, 0.88)',
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
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 22,
    overflow: 'hidden',
  },
  borderGlow: {
    backgroundColor: 'rgba(57, 255, 20, 0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 106, 0, 0.45)',
    borderRadius: 22,
    padding: 1.5,
    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(57, 255, 20, 0.25)',
        }
      : {
          elevation: 12,
        }),
  },
  innerCard: {
    backgroundColor: 'rgba(17, 25, 35, 0.98)',
    borderRadius: 21,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  modalGenre: {
    color: colors.orangeWarm,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.6,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', sans-serif",
        }
      : {}),
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
        }
      : {}),
  },
  modalTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  modalTag: {
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalTagText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  modalStatsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 22, 16, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.16)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  modalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalStatText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalStatDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  launchButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#39FF14',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.8)',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(57, 255, 20, 0.4)',
        }
      : {}),
  },
  launchButtonText: {
    color: '#050705',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default GameDetailsModal;
