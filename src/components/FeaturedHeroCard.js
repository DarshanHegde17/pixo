import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 500;
const isSmallMobile = screenWidth < 380;

/**
 * SOLOPLAY V3 Cinematic Featured Game Hero Card
 * - Responsive on both Desktop and Android / iOS Mobile screens
 * - Futuristic city skyline silhouette with neon-green & electric-orange energy trails
 * - Deep atmospheric dark gradient overlay (100% text readability)
 * - Game metadata: 30+ Hours, Offline Campaign, Single Player, 4.9 Rating
 * - Interactive actions: PLAY NOW and VIEW DETAILS
 * - Smooth hover lift, border glow travel, and artwork scale
 */
export const FeaturedHeroCard = ({ onPlay, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onViewDetails}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={[
        styles.cardContainer,
        isHovered && styles.cardContainerHovered,
      ]}
    >
      {/* Background Artwork Layer */}
      <View style={[styles.artworkContainer, isHovered && styles.artworkHovered]}>
        {/* Sky gradient */}
        <LinearGradient
          colors={['#06110B', '#09151D', '#040704']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Ambient illumination orbs inside card */}
        <View style={styles.cardGreenGlow} />
        <View style={styles.cardOrangeGlow} />

        {/* Futuristic City Silhouette (vector geometry) */}
        <View style={styles.cityscapeContainer} pointerEvents="none">
          {/* Background buildings */}
          <View style={[styles.building, styles.b1]} />
          <View style={[styles.building, styles.b2]} />
          <View style={[styles.building, styles.b3]} />
          <View style={[styles.building, styles.b4]} />
          <View style={[styles.building, styles.b5]} />
          <View style={[styles.building, styles.b6]} />
          <View style={[styles.building, styles.b7]} />
          <View style={[styles.spireTower, styles.spire1]} />
          <View style={[styles.spireTower, styles.spire2]} />

          {/* Glowing neon window bands */}
          <View style={[styles.neonWindowBand, { bottom: 35, left: '18%', width: 25 }]} />
          <View style={[styles.neonWindowBand, { bottom: 55, left: '42%', width: 35, backgroundColor: colors.orangeAccent }]} />
          <View style={[styles.neonWindowBand, { bottom: 40, left: '68%', width: 28 }]} />

          {/* Perspective grid floor */}
          <View style={styles.cityGridFloor} />
        </View>

        {/* Reading Vignette Gradient (ensures high contrast for text) */}
        <LinearGradient
          colors={[
            'rgba(5, 7, 5, 0.45)',
            'rgba(9, 17, 11, 0.82)',
            'rgba(5, 7, 5, 0.98)',
          ]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Top Traveling Orange Energy Line */}
      <View
        style={[
          styles.travelingOrangeLine,
          isHovered && styles.travelingOrangeLineActive,
        ]}
      />

      {/* Hero Content */}
      <View style={styles.contentContainer}>
        {/* Badge Row */}
        <View style={styles.badgeRow}>
          <View style={styles.gameOfWeekBadge}>
            <Ionicons name="flash" size={11} color="#050705" style={{ marginRight: 4 }} />
            <Text style={styles.gameOfWeekBadgeText}>GAME OF THE WEEK</Text>
          </View>

          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFB547" style={{ marginRight: 4 }} />
            <Text style={styles.ratingText}>4.9 ★</Text>
            <Text style={styles.reviewCountText}>(18.2k)</Text>
          </View>
        </View>

        {/* Title & Slogan */}
        <Text style={styles.gameTitle}>CYBER STRIKE: 2099</Text>
        <Text style={styles.gameTagline}>
          Hack the system. Master the shadows. Change the future.
        </Text>

        <Text style={styles.gameDescription} numberOfLines={isSmallMobile ? 2 : 3}>
          Enter a neon-drenched cyberpunk world where every mission challenges your strategy, speed, and survival skills.
        </Text>

        {/* Metadata Chips Row */}
        <View style={styles.metadataRow}>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={12} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.metaChipText}>30+ HOURS</Text>
          </View>

          <View style={styles.metaChip}>
            <Ionicons name="cloud-offline-outline" size={12} color={colors.orangeWarm} style={{ marginRight: 4 }} />
            <Text style={styles.metaChipText}>OFFLINE</Text>
          </View>

          <View style={styles.metaChip}>
            <Ionicons name="person-outline" size={12} color={colors.cyan} style={{ marginRight: 4 }} />
            <Text style={styles.metaChipText}>SINGLE PLAYER</Text>
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.actionsRow}>
          {/* Primary Play Button */}
          <TouchableOpacity
            style={[styles.playButton, isHovered && styles.playButtonHovered]}
            onPress={onPlay}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={15} color="#050705" style={{ marginRight: 5 }} />
            <Text style={styles.playButtonText}>PLAY NOW</Text>
          </TouchableOpacity>

          {/* Secondary Details Button */}
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={onViewDetails}
            activeOpacity={0.8}
          >
            <Text style={styles.detailsButtonText}>VIEW DETAILS</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.textPrimary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.28)',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#09110B',
    marginBottom: spacing.lg,
    ...(Platform.OS === 'web'
      ? {
          transition:
            'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease, box-shadow 0.28s ease',
          boxShadow:
            '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 24px rgba(57, 255, 20, 0.12)',
          cursor: 'pointer',
        }
      : {
          elevation: 8,
        }),
  },
  cardContainerHovered: {
    borderColor: 'rgba(57, 255, 20, 0.65)',
    ...(Platform.OS === 'web'
      ? {
          transform: 'translateY(-3px)',
          boxShadow:
            '0 18px 48px rgba(0, 0, 0, 0.85), 0 0 35px rgba(57, 255, 20, 0.25), 0 0 15px rgba(255, 106, 0, 0.2)',
        }
      : {}),
  },
  artworkContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          transition: 'transform 0.5s ease',
        }
      : {}),
  },
  artworkHovered: {
    ...(Platform.OS === 'web'
      ? {
          transform: 'scale(1.025)',
        }
      : {}),
  },
  cardGreenGlow: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
    ...(Platform.OS === 'web' ? { filter: 'blur(70px)' } : { opacity: 0.3 }),
  },
  cardOrangeGlow: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 106, 0, 0.22)',
    ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } : { opacity: 0.3 }),
  },
  cityscapeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    opacity: 0.45,
  },
  building: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: '#060B07',
    borderTopWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
  },
  b1: { left: '4%', width: 55, height: 95 },
  b2: { left: '16%', width: 45, height: 135 },
  b3: { left: '28%', width: 70, height: 110 },
  b4: { left: '42%', width: 50, height: 155 },
  b5: { left: '55%', width: 65, height: 120 },
  b6: { left: '70%', width: 55, height: 140 },
  b7: { left: '84%', width: 60, height: 105 },
  spireTower: {
    position: 'absolute',
    bottom: 20,
    width: 4,
    backgroundColor: colors.orangeAccent,
    borderRadius: 2,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 10px #FF6A00' } : {}),
  },
  spire1: { left: '46%', height: 175 },
  spire2: { left: '74%', height: 160 },
  neonWindowBand: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.primary,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 6px #39FF14' } : {}),
  },
  cityGridFloor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 22,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(57, 255, 20, 0.4)',
    backgroundColor: 'rgba(6, 12, 7, 0.95)',
  },
  travelingOrangeLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '35%',
    height: 2.5,
    backgroundColor: colors.orangeAccent,
    zIndex: 10,
    ...(Platform.OS === 'web'
      ? {
          transition: 'width 0.35s ease, background-color 0.35s ease',
          boxShadow: '0 0 10px #FF6A00',
        }
      : {}),
  },
  travelingOrangeLineActive: {
    width: '100%',
    backgroundColor: '#FF8C32',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 16px #FF8C32',
        }
      : {}),
  },
  contentContainer: {
    padding: isMobile ? 16 : spacing.lg,
    zIndex: 5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  gameOfWeekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#39FF14',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 12px rgba(57, 255, 20, 0.4)',
        }
      : {}),
  },
  gameOfWeekBadgeText: {
    color: '#050705',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 22, 16, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 181, 71, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  ratingText: {
    color: '#FFB547',
    fontSize: 11,
    fontWeight: '800',
  },
  reviewCountText: {
    color: colors.textSecondary,
    fontSize: 10,
    marginLeft: 3,
  },
  gameTitle: {
    fontSize: isMobile ? 22 : 26,
    fontWeight: '900',
    color: '#F7FAF5',
    letterSpacing: 1.2,
    marginTop: 6,
    marginBottom: 3,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', 'Sora', sans-serif",
          textShadow: '0 0 20px rgba(57, 255, 20, 0.4)',
        }
      : {}),
  },
  gameTagline: {
    fontSize: isMobile ? 12 : 13,
    fontWeight: '700',
    color: colors.orangeWarm,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  gameDescription: {
    fontSize: isMobile ? 12 : 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
    maxWidth: 680,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 25, 35, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaChipText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#39FF14',
    paddingHorizontal: isMobile ? 18 : 22,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.8)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 18px rgba(57, 255, 20, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }
      : {}),
  },
  playButtonHovered: {
    backgroundColor: '#4EFA2E',
    borderColor: colors.orangeAccent,
    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '0 6px 24px rgba(57, 255, 20, 0.55), 0 0 14px rgba(255, 106, 0, 0.4)',
        }
      : {}),
  },
  playButtonText: {
    color: '#050705',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 22, 16, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.35)',
    paddingHorizontal: isMobile ? 14 : 16,
    paddingVertical: 9,
    borderRadius: 9,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }
      : {}),
  },
  detailsButtonText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default FeaturedHeroCard;
