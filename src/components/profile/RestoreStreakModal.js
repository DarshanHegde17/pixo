import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';

/**
 * PIXO Restore Streak Confirmation Modal
 *
 * Master Prompt Section 6:
 * - Currency: COINS ONLY.
 * - Exactly 100 COINS per missed day.
 * - Atomic confirmation popup before deducting Coins.
 * - Shows available Coins balance and balance after deduction.
 * - If user has insufficient Coins: displays:
 *   "Not Enough Coins! Win more games or exchange your XP for Coins."
 * - Prevents double deductions on rapid clicks.
 */
export const RestoreStreakModal = ({
  visible,
  onClose,
  streakState,
  availableCoins = 0,
  availableXp = 0,
  onConfirmRestore,
  onOpenCoinStore,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 520;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!visible) return null;

  const previousStreak = streakState?.previousStreak || 7;
  const missedDays = Math.max(1, streakState?.missedDays || 1);
  const restorationCost = missedDays * 100; // 100 Coins per missed day
  const hasEnoughCoins = availableCoins >= restorationCost;
  const remainingCoins = Math.max(0, availableCoins - restorationCost);

  const handleConfirm = async () => {
    if (!hasEnoughCoins) {
      setErrorMessage('Not Enough Coins! Win more games or exchange your XP for Coins.');
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await onConfirmRestore();
      setIsSubmitting(false);
      if (res && !res.success) {
        setErrorMessage(res.error || 'Failed to restore streak. Please try again.');
      } else {
        onClose();
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Restoration failed.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.cardContainer, isMobile && styles.cardContainerMobile]}>
          <LinearGradient
            colors={['#17100B', '#0C0A08', '#070605']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Top Bar with Fire Badge */}
            <View style={styles.topBar}>
              <View style={styles.titleWrap}>
                <View style={styles.fireBadge}>
                  <Ionicons name="flame" size={20} color="#FF6A00" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>RESTORE STREAK</Text>
                  <Text style={styles.modalSub}>COINS RESTORATION VAULT</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Broken Streak Alert Header */}
            <View style={styles.alertBox}>
              <View style={styles.alertRow}>
                <Ionicons name="alert-circle" size={20} color="#FF6A00" style={{ marginRight: 8 }} />
                <Text style={styles.alertTitle}>STREAK BROKEN</Text>
              </View>
              <Text style={styles.alertBody}>
                Your consecutive streak of{' '}
                <Text style={styles.highlightText}>{previousStreak} DAYS</Text> was broken because you
                missed <Text style={styles.highlightText}>{missedDays} calendar day{missedDays > 1 ? 's' : ''}</Text>.
              </Text>
            </View>

            {/* Cost & Balance Breakdown */}
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Missed Calendar Days:</Text>
                <Text style={styles.breakdownValue}>
                  {missedDays} Day{missedDays > 1 ? 's' : ''}
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Restoration Rate:</Text>
                <Text style={styles.breakdownValue}>100 Coins per missed day</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownCostLabel}>TOTAL RESTORATION COST:</Text>
                <Text style={styles.breakdownCostValue}>
                  {restorationCost.toLocaleString()} Coins
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Your Available Coins:</Text>
                <Text style={[styles.breakdownValue, !hasEnoughCoins && styles.insufficientValue]}>
                  {availableCoins.toLocaleString()} Coins
                </Text>
              </View>

              {hasEnoughCoins ? (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Coins Balance After:</Text>
                  <Text style={[styles.breakdownValue, { color: '#FFD700' }]}>
                    {remainingCoins.toLocaleString()} Coins
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Error or Warning Message */}
            {!hasEnoughCoins && (
              <View style={styles.errorBanner}>
                <Ionicons name="close-circle" size={16} color="#FF3B30" style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>
                  Not Enough Coins! Win more games or exchange your XP for Coins.
                </Text>
              </View>
            )}

            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="close-circle" size={16} color="#FF3B30" style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            )}

            {/* Information Notice */}
            <View style={styles.infoNotice}>
              <Ionicons name="information-circle-outline" size={16} color="#39FF14" style={{ marginRight: 6 }} />
              <Text style={styles.infoNoticeText}>
                Restoring will reinstate your {previousStreak}-day streak. Complete today's game to continue your streak to {previousStreak + 1} days!
              </Text>
            </View>

            {/* Quick Coin Store Shortcut if low on coins */}
            {!hasEnoughCoins && onOpenCoinStore && (
              <TouchableOpacity
                style={styles.storeShortcutBtn}
                onPress={() => {
                  onClose();
                  onOpenCoinStore();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.25)', 'rgba(57, 255, 20, 0.12)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.storeShortcutGradient}
                >
                  <Ionicons name="cash" size={16} color="#FFD700" style={{ marginRight: 6 }} />
                  <Text style={styles.storeShortcutText}>
                    GO TO COIN STORE — EXCHANGE XP FOR COINS
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  !hasEnoughCoins && styles.confirmBtnDisabled,
                  isSubmitting && styles.confirmBtnSubmitting,
                ]}
                onPress={handleConfirm}
                disabled={!hasEnoughCoins || isSubmitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    hasEnoughCoins
                      ? ['#FFD700', '#FF9500']
                      : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmBtnGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#050705" />
                  ) : (
                    <>
                      <Ionicons
                        name="cash"
                        size={15}
                        color={hasEnoughCoins ? '#050705' : 'rgba(255, 255, 255, 0.4)'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.confirmBtnText,
                          !hasEnoughCoins && styles.confirmBtnTextDisabled,
                        ]}
                      >
                        {hasEnoughCoins
                          ? `CONFIRM & DEDUCT ${restorationCost.toLocaleString()} COINS`
                          : `NEED ${(restorationCost - availableCoins).toLocaleString()} MORE COINS`}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  cardContainer: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 106, 0, 0.45)',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 30px rgba(255, 106, 0, 0.25)',
        }
      : {}),
  },
  cardContainerMobile: {
    maxWidth: '100%',
  },
  cardGradient: {
    padding: 22,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 106, 0, 0.2)',
    marginBottom: 16,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 106, 0, 0.18)',
    borderWidth: 1,
    borderColor: '#FF6A00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    color: '#FF6A00',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  modalSub: {
    color: colors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  alertBox: {
    backgroundColor: 'rgba(255, 106, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    color: '#FF6A00',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  alertBody: {
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  highlightText: {
    color: '#39FF14',
    fontWeight: '900',
  },
  breakdownCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    color: colors.textSecondary,
    fontSize: 11.5,
  },
  breakdownValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  breakdownCostLabel: {
    color: '#FF6A00',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  breakdownCostValue: {
    color: '#FF6A00',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  insufficientValue: {
    color: '#FF3B30',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#FF3B30',
    fontSize: 11.5,
    fontWeight: '700',
    flex: 1,
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 18,
  },
  infoNoticeText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storeShortcutBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    marginBottom: 14,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  storeShortcutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  storeShortcutText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  confirmBtn: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  confirmBtnDisabled: {
    opacity: 0.6,
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : {}),
  },
  confirmBtnSubmitting: {
    opacity: 0.8,
  },
  confirmBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  confirmBtnText: {
    color: '#050705',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  confirmBtnTextDisabled: {
    color: 'rgba(255, 255, 255, 0.45)',
  },
});
