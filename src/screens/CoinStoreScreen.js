import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { XP_TO_COIN_PACKAGES } from '../services/gamingActivityService';
import { colors, spacing, borderRadius } from '../theme';

/**
 * PIXO Coin Store Screen
 * Master Prompt Section 7 & 8:
 * - 10 exchange packages from 50 XP (5 Coins) to 1,000 XP (120 Coins).
 * - Real-time updated XP and Coin balances.
 * - Confirmation popup before deducting XP.
 * - Instant exchange animation and feedback.
 * - Attractive neon-green and gold gaming cards.
 */
export const CoinStoreScreen = ({ onNavigateHome }) => {
  const { user, exchangeXpForCoins } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const userXp = typeof user?.xp === 'number' ? user.xp : 0;
  const userCoins = typeof user?.coins === 'number' ? user.coins : 0;

  // Selected package for confirmation popup
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successExchange, setSuccessExchange] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSelectPackage = (pkg) => {
    if (userXp < pkg.xpRequired) {
      Alert.alert(
        'Not Enough XP!',
        `You need ${pkg.xpRequired} XP to exchange for ${pkg.coinsReceived} Coins.\nYour current balance: ${userXp} XP.\n\nWin games to earn more XP!`
      );
      return;
    }
    setErrorMessage(null);
    setSelectedPackage(pkg);
  };

  const handleConfirmExchange = async () => {
    if (!selectedPackage || isSubmitting) return;

    if (userXp < selectedPackage.xpRequired) {
      setErrorMessage('Not enough XP! Win more games to earn XP.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await exchangeXpForCoins(selectedPackage.id);
      setIsSubmitting(false);

      if (res && res.success) {
        const exchangedPkg = selectedPackage;
        setSelectedPackage(null);
        setSuccessExchange({
          pkg: exchangedPkg,
          newXp: res.newXp,
          newCoins: res.newCoins,
        });
      } else {
        setErrorMessage(res?.error || 'Exchange failed. Please try again.');
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Transaction failed.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            {onNavigateHome && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onNavigateHome}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
                <Text style={styles.backBtnText}>DASHBOARD</Text>
              </TouchableOpacity>
            )}

            <View style={styles.titleBadge}>
              <Ionicons name="cash" size={16} color="#FFD700" style={{ marginRight: 6 }} />
              <Text style={styles.titleBadgeText}>PIXO ECONOMY // XP EXCHANGE</Text>
            </View>
          </View>

          <Text style={styles.mainTitle}>COIN STORE</Text>
          <Text style={styles.subtitle}>
            Exchange your battle-earned XP for Coins. Use Coins to restore broken streaks or unlock rewards!
          </Text>
        </View>

        {/* Live Balances Banner */}
        <View style={styles.balanceBanner}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.14)', 'rgba(57, 255, 20, 0.08)', '#09100B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            {/* XP Balance */}
            <View style={styles.balanceCol}>
              <View style={styles.balanceLabelRow}>
                <Ionicons name="flash" size={16} color="#00E5FF" style={{ marginRight: 6 }} />
                <Text style={styles.balanceLabel}>AVAILABLE XP</Text>
              </View>
              <Text style={styles.balanceValueXp}>{userXp.toLocaleString()} XP</Text>
              <Text style={styles.balanceHint}>Earned by winning games</Text>
            </View>

            <View style={styles.balanceDivider} />

            {/* Coin Balance */}
            <View style={styles.balanceCol}>
              <View style={styles.balanceLabelRow}>
                <Ionicons name="cash" size={18} color="#FFD700" style={{ marginRight: 6 }} />
                <Text style={styles.balanceLabelCoin}>AVAILABLE COINS</Text>
              </View>
              <Text style={styles.balanceValueCoin}>{userCoins.toLocaleString()} COINS</Text>
              <Text style={styles.balanceHint}>100 Coins = 1 Missed Day Restore</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionHeading}>EXCHANGE PACKAGES (10 PACKS)</Text>
          <Text style={styles.sectionSub}>No real money • 100% In-game rewards</Text>
        </View>

        {/* 10 Exchange Package Cards Grid */}
        <View style={[styles.packageGrid, isMobile && styles.packageGridMobile]}>
          {XP_TO_COIN_PACKAGES.map((pkg) => {
            const canAfford = userXp >= pkg.xpRequired;
            const isTopTier = pkg.id >= 9;

            return (
              <View
                key={pkg.id}
                style={[
                  styles.packageCard,
                  isTopTier && styles.packageCardTopTier,
                  isMobile && styles.packageCardMobile,
                ]}
              >
                <LinearGradient
                  colors={
                    isTopTier
                      ? ['rgba(255, 215, 0, 0.22)', 'rgba(255, 106, 0, 0.08)', '#0D120E']
                      : ['rgba(57, 255, 20, 0.12)', 'rgba(255, 215, 0, 0.05)', '#0A0F0C']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.packageCardGradient}
                >
                  {/* Top Row: Package ID & Badge */}
                  <View style={styles.pkgTopRow}>
                    <Text style={styles.pkgNumberText}>PACK #{pkg.id}</Text>
                    {pkg.badge && (
                      <View style={[styles.pkgBadge, isTopTier && styles.pkgBadgeTopTier]}>
                        <Text style={styles.pkgBadgeText}>{pkg.badge}</Text>
                      </View>
                    )}
                  </View>

                  {/* Coin Reward Hero */}
                  <View style={styles.pkgHeroWrap}>
                    <View style={styles.pkgCoinIconGlow}>
                      <Ionicons name="cash" size={28} color="#FFD700" />
                    </View>
                    <Text style={styles.pkgCoinsText}>+{pkg.coinsReceived} COINS</Text>
                    <Text style={styles.pkgLabelText}>{pkg.label}</Text>
                  </View>

                  {/* Cost Pill */}
                  <View style={styles.costPill}>
                    <Ionicons name="flash" size={13} color="#00E5FF" style={{ marginRight: 4 }} />
                    <Text style={styles.costPillText}>COST: {pkg.xpRequired} XP</Text>
                  </View>

                  {/* Exchange Button */}
                  <TouchableOpacity
                    style={[
                      styles.exchangeBtn,
                      !canAfford && styles.exchangeBtnDisabled,
                      isTopTier && canAfford && styles.exchangeBtnTopTier,
                    ]}
                    onPress={() => handleSelectPackage(pkg)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={
                        canAfford
                          ? isTopTier
                            ? ['#FFD700', '#FF9500']
                            : ['#39FF14', '#00E5FF']
                          : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.04)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.exchangeBtnGradient}
                    >
                      <Ionicons
                        name={canAfford ? 'swap-horizontal' : 'lock-closed'}
                        size={15}
                        color={canAfford ? '#050705' : 'rgba(255, 255, 255, 0.35)'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.exchangeBtnText,
                          !canAfford && styles.exchangeBtnTextDisabled,
                        ]}
                      >
                        {canAfford ? `EXCHANGE ${pkg.xpRequired} XP` : `NEED ${pkg.xpRequired - userXp} XP`}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      {selectedPackage && (
        <Modal
          visible={!!selectedPackage}
          transparent
          animationType="fade"
          onRequestClose={() => !isSubmitting && setSelectedPackage(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
              <LinearGradient
                colors={['#17120B', '#0E0C09', '#080A08']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalGradient}
              >
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <View style={styles.modalIconWrap}>
                      <Ionicons name="swap-horizontal" size={20} color="#FFD700" />
                    </View>
                    <View>
                      <Text style={styles.modalHeading}>CONFIRM EXCHANGE</Text>
                      <Text style={styles.modalSubheading}>Package #{selectedPackage.id} • {selectedPackage.label}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setSelectedPackage(null)}
                    disabled={isSubmitting}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Offer Summary Banner */}
                <View style={styles.offerBanner}>
                  <View style={styles.offerItem}>
                    <Text style={styles.offerLabel}>DEDUCT</Text>
                    <Text style={styles.offerValueXp}>-{selectedPackage.xpRequired} XP</Text>
                  </View>

                  <Ionicons name="arrow-forward" size={20} color="#39FF14" />

                  <View style={styles.offerItem}>
                    <Text style={styles.offerLabel}>RECEIVE</Text>
                    <Text style={styles.offerValueCoin}>+{selectedPackage.coinsReceived} COINS</Text>
                  </View>
                </View>

                {/* Balance Impact Breakdown */}
                <View style={styles.impactCard}>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Current XP Balance:</Text>
                    <Text style={styles.impactValue}>{userXp.toLocaleString()} XP</Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>XP After Exchange:</Text>
                    <Text style={[styles.impactValue, { color: '#00E5FF' }]}>
                      {(userXp - selectedPackage.xpRequired).toLocaleString()} XP
                    </Text>
                  </View>

                  <View style={styles.impactDivider} />

                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Current Coin Balance:</Text>
                    <Text style={styles.impactValue}>{userCoins.toLocaleString()} Coins</Text>
                  </View>
                  <View style={styles.impactRow}>
                    <Text style={styles.impactLabel}>Coins After Exchange:</Text>
                    <Text style={[styles.impactValue, { color: '#FFD700' }]}>
                      {(userCoins + selectedPackage.coinsReceived).toLocaleString()} Coins
                    </Text>
                  </View>
                </View>

                {errorMessage && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#FF3B30" style={{ marginRight: 6 }} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Modal Action Buttons */}
                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setSelectedPackage(null)}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.modalCancelText}>CANCEL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, isSubmitting && styles.modalConfirmBtnDisabled]}
                    onPress={handleConfirmExchange}
                    disabled={isSubmitting}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FF9500']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalConfirmGradient}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#050705" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={16} color="#050705" style={{ marginRight: 6 }} />
                          <Text style={styles.modalConfirmText}>
                            CONFIRM & EXCHANGE
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
      )}

      {/* Success Animation Modal */}
      {successExchange && (
        <Modal
          visible={!!successExchange}
          transparent
          animationType="fade"
          onRequestClose={() => setSuccessExchange(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successCard}>
              <LinearGradient
                colors={['#102213', '#08140B', '#040B06']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.successGradient}
              >
                <View style={styles.successIconGlow}>
                  <Ionicons name="checkmark-done" size={36} color="#39FF14" />
                </View>

                <Text style={styles.successTitle}>EXCHANGE SUCCESSFUL! 🪙</Text>
                <Text style={styles.successSubtitle}>
                  +{successExchange.pkg.coinsReceived} Coins have been added to your vault.
                </Text>

                <View style={styles.successBalancesBox}>
                  <Text style={styles.successBalanceText}>
                    ⚡ XP Remaining: {successExchange.newXp.toLocaleString()} XP
                  </Text>
                  <Text style={styles.successBalanceCoinText}>
                    🪙 Total Coins: {successExchange.newCoins.toLocaleString()} Coins
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.successDoneBtn}
                  onPress={() => setSuccessExchange(null)}
                >
                  <LinearGradient
                    colors={['#39FF14', '#00E5FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.successDoneGradient}
                  >
                    <Text style={styles.successDoneText}>CONTINUE PLAYING</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050705',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  backBtnText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  titleBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.8,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  balanceBanner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    overflow: 'hidden',
    marginBottom: 20,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 14px rgba(255, 215, 0, 0.1)',
        }
      : {}),
  },
  balanceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  balanceCol: {
    flex: 1,
  },
  balanceDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5CE1E6',
    letterSpacing: 0.8,
  },
  balanceLabelCoin: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFE066',
    letterSpacing: 0.8,
  },
  balanceValueXp: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  balanceValueCoin: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  balanceHint: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 3,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 10.5,
    color: colors.textTertiary,
  },
  packageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  packageGridMobile: {
    flexDirection: 'column',
  },
  packageCard: {
    flex: 1,
    minWidth: 260,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    overflow: 'hidden',
    backgroundColor: '#0A0F0C',
    ...(Platform.OS === 'web'
      ? {
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
        }
      : {}),
  },
  packageCardTopTier: {
    borderColor: 'rgba(255, 215, 0, 0.45)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 215, 0, 0.15)',
        }
      : {}),
  },
  packageCardMobile: {
    width: '100%',
  },
  packageCardGradient: {
    padding: 16,
  },
  pkgTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pkgNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  pkgBadge: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.35)',
  },
  pkgBadgeTopTier: {
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    borderColor: 'rgba(255, 215, 0, 0.45)',
  },
  pkgBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#39FF14',
    letterSpacing: 0.5,
  },
  pkgHeroWrap: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  pkgCoinIconGlow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 8,
  },
  pkgCoinsText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  pkgLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  costPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderRadius: 6,
    paddingVertical: 5,
    marginVertical: 12,
  },
  costPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 0.5,
  },
  exchangeBtn: {
    borderRadius: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  exchangeBtnDisabled: {
    opacity: 0.5,
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : {}),
  },
  exchangeBtnTopTier: {
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  exchangeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  exchangeBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 0.6,
  },
  exchangeBtnTextDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    overflow: 'hidden',
    backgroundColor: '#0C0A07',
  },
  modalCardMobile: {
    maxWidth: '100%',
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalSubheading: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 16,
  },
  offerItem: {
    alignItems: 'center',
  },
  offerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  offerValueXp: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FF6961',
  },
  offerValueCoin: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFD700',
  },
  impactCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  impactLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  impactValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  impactDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    marginVertical: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.35)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#FF6961',
    fontSize: 11,
    fontWeight: '700',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  modalConfirmBtn: {
    flex: 2,
    height: 42,
    borderRadius: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  modalConfirmBtnDisabled: {
    opacity: 0.7,
  },
  modalConfirmGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#050705',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  successCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    overflow: 'hidden',
  },
  successGradient: {
    padding: 24,
    alignItems: 'center',
  },
  successIconGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  successBalancesBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },
  successBalanceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00E5FF',
    marginBottom: 4,
  },
  successBalanceCoinText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFD700',
  },
  successDoneBtn: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  successDoneGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDoneText: {
    color: '#050705',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});

