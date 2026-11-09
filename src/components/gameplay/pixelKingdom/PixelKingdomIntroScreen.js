import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PixelKnight, PixelChest } from './PixelKingdomSprites';
import { PixelKingdomAudio } from '../../../services/pixelKingdomAudioService';

export const PixelKingdomIntroScreen = ({
  onStartAdventure,
  onResumeSavedMission,
  savedSession,
  onExit,
}) => {
  // Cloud & Castle floating animations
  const cloudAnim = useRef(new Animated.Value(0)).current;
  const glowPulseAnim = useRef(new Animated.Value(1)).current;
  const knightBobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Drifting cloud loop
    const cloudLoop = Animated.loop(
      Animated.timing(cloudAnim, {
        toValue: 1,
        duration: 18000,
        useNativeDriver: true,
      })
    );
    cloudLoop.start();

    // 2. Glowing button breathing loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Knight idle bobbing
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(knightBobAnim, {
          toValue: -4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(knightBobAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    bobLoop.start();

    return () => {
      cloudLoop.stop();
      pulseLoop.stop();
      bobLoop.stop();
    };
  }, [cloudAnim, glowPulseAnim, knightBobAnim]);

  const cloudTranslateX = cloudAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 420],
  });

  return (
    <View style={styles.container}>
      {/* ========================================================= */}
      {/* 1. TOP BAR: PIXO BACK BUTTON & AUDIO MUTE TOGGLE          */}
      {/* ========================================================= */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onExit} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color="#39FF14" style={{ marginRight: 6 }} />
          <Text style={styles.backButtonText}>DASHBOARD</Text>
        </TouchableOpacity>

        {/* Feature Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.featureBadge}>
            <Ionicons name="cloud-done" size={13} color="#00E5FF" style={{ marginRight: 4 }} />
            <Text style={styles.featureBadgeText}>CLOUD SAVED</Text>
          </View>
          <View style={styles.featureBadge}>
            <Ionicons name="game-controller" size={13} color="#39FF14" style={{ marginRight: 4 }} />
            <Text style={styles.featureBadgeText}>CONTROLLER READY</Text>
          </View>
        </View>
      </View>

      {/* ========================================================= */}
      {/* 2. ANIMATED RETRO PIXEL ART SCENERY BACKGROUND           */}
      {/* ========================================================= */}
      <View style={styles.sceneContainer}>
        {/* Parallax Sky Gradient */}
        <LinearGradient
          colors={['#071018', '#0F261C', '#071810']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Pixel Moon */}
        <View style={styles.pixelMoon}>
          <View style={styles.moonCrater} />
        </View>

        {/* Animated Floating Pixel Clouds */}
        <Animated.View
          style={[
            styles.cloudGroup,
            { transform: [{ translateX: cloudTranslateX }] },
          ]}
        >
          <View style={styles.pixelCloud} />
          <View style={[styles.pixelCloud, { marginTop: 16, marginLeft: 90, opacity: 0.6 }]} />
        </Animated.View>

        {/* Pixel Mountains in Distance */}
        <View style={styles.mountainsRow}>
          <View style={[styles.mountain, styles.mountainLeft]} />
          <View style={[styles.mountain, styles.mountainCenter]} />
          <View style={[styles.mountain, styles.mountainRight]} />
        </View>

        {/* Ancient Royal Castle Silhouettes & Battlements */}
        <View style={styles.castleContainer}>
          {/* Left Tower */}
          <View style={styles.castleTower}>
            <View style={styles.towerRamparts} />
            <View style={styles.towerWindow} />
          </View>
          {/* Main Castle Keep */}
          <View style={styles.castleKeep}>
            <View style={styles.keepBattlements} />
            <View style={styles.royalBanner} />
            <View style={styles.castlePortcullis} />
          </View>
          {/* Right Tower */}
          <View style={styles.castleTower}>
            <View style={styles.towerRamparts} />
            <View style={styles.towerWindow} />
          </View>
        </View>

        {/* Forest Pines & Foreground Ground */}
        <View style={styles.forestForeground}>
          <View style={styles.pineTree} />
          <View style={[styles.pineTree, { marginLeft: 20 }]} />
          <View style={[styles.pineTree, { marginLeft: 'auto', marginRight: 30 }]} />
        </View>

        {/* Animated Pixel Knight standing heroically */}
        <Animated.View
          style={[
            styles.knightHeroSpot,
            { transform: [{ translateY: knightBobAnim }] },
          ]}
        >
          <PixelKnight state="idle" facing="right" scale={1.8} />
        </Animated.View>

        {/* Glowing Royal Treasure Chest */}
        <View style={styles.treasureSpot}>
          <PixelChest isOpen={false} />
          <View style={styles.treasureGlowAura} />
        </View>
      </View>

      {/* ========================================================= */}
      {/* 3. HERO GAME LOGO, TITLE, SUBTITLE & METRICS              */}
      {/* ========================================================= */}
      <View style={styles.heroContent}>
        <View style={styles.eyebrowTag}>
          <View style={styles.retroDot} />
          <Text style={styles.eyebrowText}>8-BIT RETRO ADVENTURE • 10 MISSIONS</Text>
        </View>

        <Text style={styles.heroTitle}>PIXEL KINGDOM</Text>
        <Text style={styles.heroTitleSub}>ADVENTURE</Text>

        <Text style={styles.heroSubtitle}>
          Embark on an epic 8-bit quest across crumbling pixel kingdoms, royal castles, and forgotten dungeons.
        </Text>

        {/* Game Specs Bar */}
        <View style={styles.specsBar}>
          <View style={styles.specItem}>
            <Ionicons name="star" size={14} color="#FFD700" style={{ marginRight: 4 }} />
            <Text style={styles.specValue}>4.8</Text>
            <Text style={styles.specLabel}>Rating</Text>
          </View>
          <View style={styles.specDivider} />
          <View style={styles.specItem}>
            <Ionicons name="shield-checkmark" size={14} color="#39FF14" style={{ marginRight: 4 }} />
            <Text style={styles.specValue}>10 Stages</Text>
            <Text style={styles.specLabel}>Sequential</Text>
          </View>
          <View style={styles.specDivider} />
          <View style={styles.specItem}>
            <Ionicons name="flame" size={14} color="#FF8A00" style={{ marginRight: 4 }} />
            <Text style={styles.specValue}>4 Bosses</Text>
            <Text style={styles.specLabel}>Epic Fights</Text>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 4. ACTIONS: RESUME MISSION (IF SAVED) & START ADVENTURE   */}
        {/* ========================================================= */}
        <View style={styles.actionsContainer}>
          {savedSession && (
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={() => {
                PixelKingdomAudio.playJump();
                onResumeSavedMission(savedSession);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#00E5FF', '#007799']}
                style={styles.resumeGradient}
              >
                <Ionicons name="play" size={18} color="#050705" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.resumeBtnTitle}>RESUME SAVED MISSION</Text>
                  <Text style={styles.resumeBtnSub}>
                    Stage {savedSession.level || 1} • {savedSession.score || 0} Pts • {savedSession.health || 100}% HP
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <Animated.View style={{ transform: [{ scale: glowPulseAnim }], width: '100%' }}>
            <TouchableOpacity
              style={styles.startAdventureButton}
              onPress={() => {
                PixelKingdomAudio.playCoin();
                onStartAdventure();
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#39FF14', '#15803D']}
                style={styles.startButtonGradient}
              >
                <Ionicons name="flash" size={20} color="#050705" style={{ marginRight: 8 }} />
                <Text style={styles.startAdventureButtonText}>START ADVENTURE</Text>
                <Ionicons name="arrow-forward" size={18} color="#050705" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050A06',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 14,
    paddingBottom: 10,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#39FF14',
    letterSpacing: 0.8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  sceneContainer: {
    width: '92%',
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.35)',
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    marginVertical: 10,
  },
  pixelMoon: {
    position: 'absolute',
    top: 18,
    right: 28,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF08A',
    shadowColor: '#FEF08A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  moonCrater: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EAB308',
    marginTop: 6,
    marginLeft: 6,
  },
  cloudGroup: {
    position: 'absolute',
    top: 24,
    left: 0,
  },
  pixelCloud: {
    width: 50,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 7,
  },
  mountainsRow: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  mountain: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },
  mountainLeft: {
    borderLeftWidth: 60,
    borderRightWidth: 60,
    borderBottomWidth: 70,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#163524',
  },
  mountainCenter: {
    borderLeftWidth: 80,
    borderRightWidth: 80,
    borderBottomWidth: 100,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1E4631',
    marginLeft: -40,
  },
  mountainRight: {
    borderLeftWidth: 70,
    borderRightWidth: 70,
    borderBottomWidth: 80,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#122D1F',
    marginLeft: -30,
  },
  castleContainer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  castleTower: {
    width: 24,
    height: 58,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
  },
  towerRamparts: {
    width: 28,
    height: 8,
    backgroundColor: '#1E293B',
    borderBottomWidth: 2,
    borderColor: '#64748B',
  },
  towerWindow: {
    width: 4,
    height: 8,
    backgroundColor: '#FEF08A',
    marginTop: 10,
  },
  castleKeep: {
    width: 50,
    height: 48,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
  },
  keepBattlements: {
    width: 54,
    height: 6,
    backgroundColor: '#0F172A',
  },
  royalBanner: {
    width: 12,
    height: 16,
    backgroundColor: '#EF4444',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    marginTop: 4,
  },
  castlePortcullis: {
    width: 14,
    height: 16,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    marginTop: 'auto',
  },
  forestForeground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: '#14532D',
    borderTopWidth: 3,
    borderColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pineTree: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#15803D',
    marginTop: -16,
  },
  knightHeroSpot: {
    position: 'absolute',
    bottom: 24,
    right: 70,
    zIndex: 8,
  },
  treasureSpot: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 7,
  },
  treasureGlowAura: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(250, 204, 21, 0.25)',
  },
  heroContent: {
    width: '92%',
    alignItems: 'center',
  },
  eyebrowTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  retroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#39FF14',
    marginRight: 6,
  },
  eyebrowText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#39FF14',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : undefined,
  },
  heroTitleSub: {
    fontSize: 22,
    fontWeight: '900',
    color: '#39FF14',
    letterSpacing: 2.5,
    marginTop: -4,
    textShadowColor: 'rgba(57, 255, 20, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    lineHeight: 17,
  },
  specsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1A13',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginVertical: 14,
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    marginRight: 4,
  },
  specLabel: {
    fontSize: 9,
    color: '#718096',
    fontWeight: '700',
  },
  specDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionsContainer: {
    width: '100%',
    gap: 10,
  },
  resumeButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  resumeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resumeBtnTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 0.6,
  },
  resumeBtnSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0B2027',
  },
  startAdventureButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  startAdventureButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 1.2,
  },
});

