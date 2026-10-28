import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

/**
 * SOLOPLAY V2 Brand Header
 * - Custom geometric emblem (diamond frame + angular neon core + burnt orange reticles)
 * - Brand text: "SOLO" in white, "PLAY" in neon green
 * - Subtle orange energy line
 * - System status: SYSTEM ONLINE • PLAYER ACCESS
 * - Main Tagline: YOUR GAME. YOUR RULES.
 * - Subtitle: Your next level starts here.
 */
export const LogoHeader = () => {
  return (
    <View style={styles.container}>
      {/* Geometric SOLOPLAY Gaming Emblem */}
      <View style={styles.emblemContainer}>
        {/* Outer ambient glow */}
        <View style={styles.emblemGlow} />

        {/* Geometric Diamond Frame */}
        <View style={styles.emblemFrame}>
          {/* Angular Corner Accents */}
          <View style={[styles.cornerAccent, styles.cornerTL]} />
          <View style={[styles.cornerAccent, styles.cornerTR]} />
          <View style={[styles.cornerAccent, styles.cornerBL]} />
          <View style={[styles.cornerAccent, styles.cornerBR]} />

          {/* Central Geometric Icon / Core */}
          <View style={styles.corePrism}>
            <View style={styles.corePrismInner}>
              <View style={styles.coreChevronTop} />
              <View style={styles.coreCenterDot} />
              <View style={styles.coreChevronBottom} />
            </View>
          </View>
        </View>
      </View>

      {/* Brand Title: PIXO with distinct futuristic Orbitron font */}
      <View style={styles.brandRow}>
        <Text style={styles.brandPix}>PIX</Text>
        <Text style={styles.brandO}>O</Text>
      </View>

      {/* Subtle Orange Accent Line & Indicator */}
      <View style={styles.orangeLineWrapper}>
        <View style={styles.orangeLineLeft} />
        <View style={styles.orangeDiamond} />
        <View style={styles.orangeLineRight} />
      </View>

      {/* Status Label: SYSTEM ONLINE • PIXO ACCESS */}
      <View style={styles.statusBadge}>
        <View style={styles.pulseDotWrapper}>
          <View style={styles.pulseDotRing} />
          <View style={styles.pulseDot} />
        </View>
        <Text style={styles.statusText}>SYSTEM ONLINE • PIXO ACCESS</Text>
      </View>

      {/* Main Tagline & Secondary Tagline */}
      <Text style={styles.mainTagline}>YOUR GAME. YOUR RULES.</Text>
      <Text style={styles.tagline}>Your next level starts here.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  emblemContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emblemGlow: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(57, 255, 20, 0.22)',
    ...(Platform.OS === 'web'
      ? {
          filter: 'blur(18px)',
          WebkitFilter: 'blur(18px)',
        }
      : {}),
  },
  emblemFrame: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(11, 16, 12, 0.96)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 22px rgba(57, 255, 20, 0.25), inset 0 0 12px rgba(57, 255, 20, 0.08)',
        }
      : {}),
  },
  cornerAccent: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderColor: colors.orangeAccent,
  },
  cornerTL: {
    top: 3,
    left: 3,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  cornerTR: {
    top: 3,
    right: 3,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
  },
  cornerBL: {
    bottom: 3,
    left: 3,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  cornerBR: {
    bottom: 3,
    right: 3,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  corePrism: {
    width: 34,
    height: 34,
    transform: [{ rotate: '45deg' }],
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corePrismInner: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  coreCenterDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
    marginVertical: 1,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 8px #39FF14',
        }
      : {}),
  },
  coreChevronTop: {
    width: 13,
    height: 2,
    backgroundColor: colors.orangeAccent,
    borderRadius: 1,
  },
  coreChevronBottom: {
    width: 13,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  brandPix: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 5,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
          textShadow: '0 0 14px rgba(255, 255, 255, 0.45)',
        }
      : {}),
  },
  brandO: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 5,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
          textShadow: '0 0 18px rgba(57, 255, 20, 0.85), 0 0 32px rgba(57, 255, 20, 0.4)',
        }
      : {}),
  },
  orangeLineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    marginTop: 5,
    marginBottom: 8,
  },
  orangeLineLeft: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(255, 106, 0, 0.45)',
  },
  orangeDiamond: {
    width: 6,
    height: 6,
    transform: [{ rotate: '45deg' }],
    backgroundColor: colors.orangeAccent,
    marginHorizontal: 8,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 6px #FF6A00',
        }
      : {}),
  },
  orangeLineRight: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(255, 106, 0, 0.45)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 16, 12, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    paddingVertical: 3.5,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    marginBottom: 6,
  },
  pulseDotWrapper: {
    width: 8,
    height: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  pulseDotRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(57, 255, 20, 0.3)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  mainTagline: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
    marginBottom: 2,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', sans-serif",
        }
      : {}),
  },
  tagline: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.3,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Inter', sans-serif",
        }
      : {}),
  },
});

export default LogoHeader;
