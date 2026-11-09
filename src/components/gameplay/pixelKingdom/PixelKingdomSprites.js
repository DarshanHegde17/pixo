import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

/**
 * PixelKnight — Cute but Powerful 8-Bit Pixel Knight
 * Renders authentic pixel art using styled pixel grids that work 100% reliably
 * across Web, iOS, Android, and APK without requiring heavy external image assets.
 */
export const PixelKnight = ({
  state = 'idle', // 'idle' | 'walk' | 'jump' | 'attack' | 'shield' | 'hurt' | 'victory'
  facing = 'right', // 'left' | 'right'
  scale = 1,
}) => {
  const isFacingLeft = facing === 'left';
  const isAttacking = state === 'attack';
  const isShielding = state === 'shield';
  const isHurt = state === 'hurt';
  const isJumping = state === 'jump';
  const isVictory = state === 'victory';

  return (
    <View
      style={[
        styles.knightWrapper,
        {
          transform: [
            { scale },
            { scaleX: isFacingLeft ? -1 : 1 },
          ],
        },
      ]}
    >
      {/* Hurt Flash Aura */}
      {isHurt && <View style={styles.hurtFlashOverlay} />}

      {/* Protective Shield Barrier Glow when Shielding */}
      {isShielding && <View style={styles.shieldAuraBarrier} />}

      {/* Red Helmet Plume */}
      <View style={[styles.plume, isJumping && { top: -2 }]} />

      {/* Steel Helmet */}
      <View style={styles.helmet}>
        {/* Glowing Visor Slot */}
        <View style={styles.visorSlot}>
          <View style={[styles.visorEye, isHurt && { backgroundColor: '#EF4444' }]} />
        </View>
      </View>

      {/* Torso Armor (Cuirass) */}
      <View style={styles.torso}>
        <View style={styles.chestPlate} />
        {/* Belt */}
        <View style={styles.belt} />
      </View>

      {/* Arms & Hands */}
      <View style={styles.armsRow}>
        {/* Left Arm / Shield Hand */}
        <View style={[styles.shieldArm, isShielding && styles.shieldArmForward]}>
          {/* Shield */}
          <View style={[styles.pixelShield, isShielding && styles.pixelShieldActive]}>
            <View style={styles.shieldEmblem} />
          </View>
        </View>

        {/* Right Arm / Sword Hand */}
        <View
          style={[
            styles.swordArm,
            isAttacking && styles.swordArmSlash,
            isVictory && styles.swordArmVictory,
          ]}
        >
          {/* Golden Broadsword */}
          <View style={[styles.pixelSword, isAttacking && styles.pixelSwordSlash]}>
            {/* Sword Blade */}
            <View style={styles.swordBlade} />
            {/* Sword Crossguard */}
            <View style={styles.swordGuard} />
            {/* Sword Hilt */}
            <View style={styles.swordHilt} />
          </View>
        </View>
      </View>

      {/* Legs & Boots */}
      <View style={styles.legsRow}>
        <View style={[styles.leg, state === 'walk' && styles.legWalkLeft]} />
        <View style={[styles.leg, state === 'walk' && styles.legWalkRight]} />
      </View>

      {/* Sword Slash Arc Effect (Visible only during attack) */}
      {isAttacking && <View style={styles.slashArcEffect} />}
    </View>
  );
};

/**
 * PixelEnemy — Slimes, Skeletons, Bats, Goblins, Ghosts, Fire Drakes
 */
export const PixelEnemy = ({
  type = 'slime', // 'slime' | 'skeleton' | 'bat' | 'goblin' | 'ghost' | 'fire_monster' | 'shadow_knight' | 'fire_drake' | 'crystal_behemoth' | 'dragon'
  facing = 'left',
  scale = 1,
  isHit = false,
}) => {
  const isFacingRight = facing === 'right';

  return (
    <View
      style={[
        styles.enemyWrapper,
        {
          transform: [
            { scale },
            { scaleX: isFacingRight ? -1 : 1 },
          ],
        },
      ]}
    >
      {isHit && <View style={styles.enemyHitOverlay} />}

      {type === 'slime' && (
        <View style={styles.slimeBody}>
          <View style={styles.slimeEyeRow}>
            <View style={styles.slimeEye} />
            <View style={styles.slimeEye} />
          </View>
          <View style={styles.slimeMouth} />
        </View>
      )}

      {type === 'skeleton' && (
        <View style={styles.skeletonBody}>
          <View style={styles.skeletonSkull}>
            <View style={styles.skeletonEyeSocket} />
            <View style={styles.skeletonEyeSocket} />
          </View>
          <View style={styles.skeletonRibs} />
          <View style={styles.skeletonBoneBlade} />
        </View>
      )}

      {type === 'bat' && (
        <View style={styles.batBody}>
          <View style={styles.batWingLeft} />
          <View style={styles.batHead}>
            <View style={styles.batEye} />
            <View style={styles.batEye} />
          </View>
          <View style={styles.batWingRight} />
        </View>
      )}

      {type === 'goblin' && (
        <View style={styles.goblinBody}>
          <View style={styles.goblinEarLeft} />
          <View style={styles.goblinHead}>
            <View style={styles.goblinEye} />
            <View style={styles.goblinEye} />
          </View>
          <View style={styles.goblinEarRight} />
          <View style={styles.goblinDagger} />
        </View>
      )}

      {type === 'ghost' && (
        <View style={styles.ghostBody}>
          <View style={styles.ghostHead}>
            <View style={styles.ghostEye} />
            <View style={styles.ghostEye} />
          </View>
          <View style={styles.ghostTail} />
        </View>
      )}

      {type === 'fire_monster' && (
        <View style={styles.fireMonsterBody}>
          <View style={styles.flameCrest} />
          <View style={styles.fireEyeRow}>
            <View style={styles.fireEye} />
            <View style={styles.fireEye} />
          </View>
        </View>
      )}

      {type === 'shadow_knight' && (
        <View style={styles.shadowKnightBody}>
          <View style={styles.shadowHelm}>
            <View style={styles.shadowGlowEyes} />
          </View>
          <View style={styles.shadowCuirass} />
          <View style={styles.shadowBlade} />
        </View>
      )}

      {type === 'fire_drake' && (
        <View style={styles.fireDrakeBody}>
          <View style={styles.drakeHorns} />
          <View style={styles.drakeSnout}>
            <View style={styles.drakeEye} />
          </View>
          <View style={styles.drakeWings} />
        </View>
      )}

      {type === 'crystal_behemoth' && (
        <View style={styles.crystalBehemothBody}>
          <View style={styles.crystalSpikesTop} />
          <View style={styles.crystalEyeCore} />
          <View style={styles.crystalFists} />
        </View>
      )}

      {type === 'dragon' && (
        <View style={styles.dragonBody}>
          {/* Dragon Huge Horns */}
          <View style={styles.dragonHornsRow}>
            <View style={styles.dragonHornLeft} />
            <View style={styles.dragonHornRight} />
          </View>
          {/* Dragon Snout & Glowing Slit Eyes */}
          <View style={styles.dragonHead}>
            <View style={styles.dragonEyeSlits} />
            <View style={styles.dragonNostrils} />
          </View>
          {/* Dragon Wings */}
          <View style={styles.dragonWingsSpan} />
          {/* Dragon Chest & Scales */}
          <View style={styles.dragonChest} />
          {/* Dragon Spiked Tail */}
          <View style={styles.dragonTail} />
        </View>
      )}
    </View>
  );
};

/**
 * PixelCoin — Spinning Golden Coin
 */
export const PixelCoin = () => (
  <View style={styles.coinOuter}>
    <View style={styles.coinInner}>
      <View style={styles.coinShine} />
    </View>
  </View>
);

/**
 * PixelChest — Royal Treasure Chest
 */
export const PixelChest = ({ isOpen = false }) => (
  <View style={styles.chestContainer}>
    <View style={[styles.chestLid, isOpen && styles.chestLidOpen]}>
      <View style={styles.chestLock} />
    </View>
    <View style={styles.chestBase}>
      <View style={styles.chestGoldBand} />
    </View>
    {isOpen && <View style={styles.chestOpenTreasureGlow} />}
  </View>
);

/**
 * PixelSpike — Hazard Spikes
 */
export const PixelSpike = () => (
  <View style={styles.spikeContainer}>
    <View style={styles.spikeTooth} />
    <View style={styles.spikeTooth} />
    <View style={styles.spikeTooth} />
  </View>
);

/**
 * PixelExitPortal — Glowing Archway Portal
 */
export const PixelExitPortal = () => (
  <View style={styles.portalArch}>
    <View style={styles.portalVortex} />
    <View style={styles.portalRune} />
  </View>
);

const styles = StyleSheet.create({
  // ================= KNIGHT STYLES =================
  knightWrapper: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  plume: {
    width: 8,
    height: 6,
    backgroundColor: '#EF4444',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 2,
    position: 'absolute',
    top: 0,
    left: 8,
    zIndex: 4,
  },
  helmet: {
    width: 18,
    height: 12,
    backgroundColor: '#94A3B8',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#475569',
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  visorSlot: {
    width: 14,
    height: 3,
    backgroundColor: '#0F172A',
    borderRadius: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 2,
  },
  visorEye: {
    width: 4,
    height: 2,
    backgroundColor: '#38BDF8',
  },
  torso: {
    width: 18,
    height: 12,
    backgroundColor: '#64748B',
    borderRadius: 2,
    marginTop: 1,
    alignItems: 'center',
    zIndex: 2,
  },
  chestPlate: {
    width: 14,
    height: 7,
    backgroundColor: '#475569',
    borderRadius: 1,
    marginTop: 1,
  },
  belt: {
    width: 18,
    height: 3,
    backgroundColor: '#92400E',
    marginTop: 1,
  },
  armsRow: {
    position: 'absolute',
    top: 14,
    width: 38,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  shieldArm: {
    width: 10,
    height: 14,
  },
  shieldArmForward: {
    transform: [{ translateX: 6 }, { scale: 1.15 }],
  },
  pixelShield: {
    width: 10,
    height: 14,
    backgroundColor: '#2563EB',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pixelShieldActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#1D4ED8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  shieldEmblem: {
    width: 4,
    height: 6,
    backgroundColor: '#F59E0B',
  },
  swordArm: {
    width: 14,
    height: 16,
    alignItems: 'flex-start',
  },
  swordArmSlash: {
    transform: [{ rotate: '45deg' }, { translateX: 4 }, { translateY: -4 }],
  },
  swordArmVictory: {
    transform: [{ rotate: '-80deg' }, { translateY: -12 }],
  },
  pixelSword: {
    alignItems: 'center',
  },
  pixelSwordSlash: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  swordBlade: {
    width: 4,
    height: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    borderRadius: 1,
  },
  swordGuard: {
    width: 10,
    height: 2,
    backgroundColor: '#F59E0B',
  },
  swordHilt: {
    width: 3,
    height: 4,
    backgroundColor: '#78350F',
  },
  legsRow: {
    flexDirection: 'row',
    width: 14,
    justifyContent: 'space-between',
    marginTop: 1,
    zIndex: 1,
  },
  leg: {
    width: 5,
    height: 9,
    backgroundColor: '#334155',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  legWalkLeft: {
    transform: [{ translateY: -2 }],
  },
  legWalkRight: {
    transform: [{ translateY: 2 }],
  },
  slashArcEffect: {
    position: 'absolute',
    top: 6,
    right: -14,
    width: 24,
    height: 24,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderColor: '#F59E0B',
    borderRadius: 12,
    transform: [{ rotate: '25deg' }],
    opacity: 0.85,
  },
  hurtFlashOverlay: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: -2,
    right: -2,
    backgroundColor: 'rgba(239, 68, 68, 0.45)',
    borderRadius: 6,
    zIndex: 10,
  },
  shieldAuraBarrier: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    right: -8,
    width: 16,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    zIndex: 9,
  },

  // ================= ENEMY STYLES =================
  enemyWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  enemyHitOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 4,
    zIndex: 10,
  },

  // Slime
  slimeBody: {
    width: 26,
    height: 20,
    backgroundColor: '#22C55E',
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slimeEyeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  slimeEye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#052E16',
  },
  slimeMouth: {
    width: 6,
    height: 2,
    backgroundColor: '#14532D',
    marginTop: 2,
  },

  // Skeleton
  skeletonBody: {
    width: 26,
    height: 38,
    alignItems: 'center',
  },
  skeletonSkull: {
    width: 16,
    height: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 3,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  skeletonEyeSocket: {
    width: 4,
    height: 4,
    backgroundColor: '#0F172A',
    borderRadius: 1,
  },
  skeletonRibs: {
    width: 14,
    height: 14,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#E2E8F0',
    marginTop: 2,
  },
  skeletonBoneBlade: {
    position: 'absolute',
    top: 14,
    right: -6,
    width: 4,
    height: 16,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 1,
  },

  // Bat
  batBody: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 32,
    height: 18,
  },
  batWingLeft: {
    width: 10,
    height: 14,
    backgroundColor: '#581C87',
    borderTopLeftRadius: 8,
  },
  batHead: {
    width: 12,
    height: 12,
    backgroundColor: '#3B0764',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 3,
  },
  batEye: {
    width: 3,
    height: 3,
    backgroundColor: '#EF4444',
    borderRadius: 1.5,
  },
  batWingRight: {
    width: 10,
    height: 14,
    backgroundColor: '#581C87',
    borderTopRightRadius: 8,
  },

  // Goblin
  goblinBody: {
    width: 24,
    height: 32,
    alignItems: 'center',
  },
  goblinHead: {
    width: 16,
    height: 14,
    backgroundColor: '#65A30D',
    borderRadius: 3,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  goblinEye: {
    width: 3,
    height: 3,
    backgroundColor: '#FEF08A',
  },
  goblinEarLeft: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 4,
    height: 4,
    backgroundColor: '#4D7C0F',
    borderTopLeftRadius: 4,
  },
  goblinEarRight: {
    position: 'absolute',
    right: 0,
    top: 2,
    width: 4,
    height: 4,
    backgroundColor: '#4D7C0F',
    borderTopRightRadius: 4,
  },
  goblinDagger: {
    position: 'absolute',
    bottom: 4,
    right: -4,
    width: 3,
    height: 10,
    backgroundColor: '#E2E8F0',
  },

  // Ghost
  ghostBody: {
    width: 24,
    height: 30,
    backgroundColor: 'rgba(224, 231, 255, 0.85)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
    paddingTop: 5,
  },
  ghostHead: {
    flexDirection: 'row',
    gap: 5,
  },
  ghostEye: {
    width: 4,
    height: 5,
    backgroundColor: '#1E1B4B',
    borderRadius: 2,
  },
  ghostTail: {
    width: 18,
    height: 6,
    marginTop: 8,
    borderBottomWidth: 3,
    borderColor: 'rgba(165, 180, 252, 0.9)',
    borderStyle: 'dashed',
  },

  // Fire Monster
  fireMonsterBody: {
    width: 26,
    height: 28,
    backgroundColor: '#EA580C',
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: 'center',
    paddingTop: 4,
  },
  flameCrest: {
    position: 'absolute',
    top: -5,
    width: 8,
    height: 6,
    backgroundColor: '#FACC15',
    borderRadius: 3,
  },
  fireEyeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  fireEye: {
    width: 4,
    height: 4,
    backgroundColor: '#FEF08A',
    borderRadius: 2,
  },

  // Shadow Knight Boss
  shadowKnightBody: {
    width: 36,
    height: 52,
    alignItems: 'center',
  },
  shadowHelm: {
    width: 22,
    height: 18,
    backgroundColor: '#1E1B4B',
    borderWidth: 2,
    borderColor: '#7E22CE',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowGlowEyes: {
    width: 14,
    height: 3,
    backgroundColor: '#C084FC',
    borderRadius: 1,
  },
  shadowCuirass: {
    width: 24,
    height: 22,
    backgroundColor: '#312E81',
    marginTop: 2,
    borderRadius: 3,
  },
  shadowBlade: {
    position: 'absolute',
    top: 10,
    right: -8,
    width: 6,
    height: 30,
    backgroundColor: '#6B21A8',
    borderWidth: 1,
    borderColor: '#A855F7',
    borderRadius: 2,
  },

  // Fire Drake Boss
  fireDrakeBody: {
    width: 48,
    height: 54,
    alignItems: 'center',
  },
  drakeHorns: {
    width: 28,
    height: 8,
    borderTopWidth: 4,
    borderColor: '#DC2626',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  drakeSnout: {
    width: 28,
    height: 22,
    backgroundColor: '#B91C1C',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drakeEye: {
    width: 6,
    height: 4,
    backgroundColor: '#FDE047',
    borderRadius: 2,
  },
  drakeWings: {
    position: 'absolute',
    top: 8,
    width: 58,
    height: 24,
    borderWidth: 3,
    borderColor: '#EF4444',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  // Crystal Behemoth Boss
  crystalBehemothBody: {
    width: 50,
    height: 56,
    alignItems: 'center',
  },
  crystalSpikesTop: {
    width: 32,
    height: 10,
    borderTopWidth: 5,
    borderColor: '#E879F9',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  crystalEyeCore: {
    width: 34,
    height: 30,
    backgroundColor: '#701A75',
    borderWidth: 3,
    borderColor: '#D946EF',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crystalFists: {
    flexDirection: 'row',
    width: 54,
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 4,
  },

  // Ultimate Dragon Boss
  dragonBody: {
    width: 72,
    height: 76,
    alignItems: 'center',
  },
  dragonHornsRow: {
    flexDirection: 'row',
    width: 44,
    justifyContent: 'space-between',
  },
  dragonHornLeft: {
    width: 8,
    height: 16,
    backgroundColor: '#7F1D1D',
    borderTopLeftRadius: 6,
  },
  dragonHornRight: {
    width: 8,
    height: 16,
    backgroundColor: '#7F1D1D',
    borderTopRightRadius: 6,
  },
  dragonHead: {
    width: 42,
    height: 28,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#991B1B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  dragonEyeSlits: {
    width: 22,
    height: 5,
    backgroundColor: '#FEF08A',
    borderRadius: 2,
  },
  dragonNostrils: {
    width: 14,
    height: 3,
    backgroundColor: '#450A0A',
    marginTop: 4,
  },
  dragonWingsSpan: {
    position: 'absolute',
    top: 14,
    width: 90,
    height: 36,
    borderWidth: 4,
    borderColor: '#EF4444',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    zIndex: 2,
  },
  dragonChest: {
    width: 40,
    height: 30,
    backgroundColor: '#991B1B',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: 1,
    zIndex: 4,
  },
  dragonTail: {
    width: 10,
    height: 18,
    backgroundColor: '#B91C1C',
    borderBottomRightRadius: 8,
  },

  // ================= COLLECTIBLES & HAZARDS =================
  coinOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinInner: {
    width: 6,
    height: 6,
    backgroundColor: '#D97706',
    borderRadius: 3,
  },
  coinShine: {
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  chestContainer: {
    width: 26,
    height: 20,
    alignItems: 'center',
  },
  chestLid: {
    width: 26,
    height: 9,
    backgroundColor: '#78350F',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  chestLidOpen: {
    transform: [{ rotate: '-25deg' }, { translateY: -4 }],
  },
  chestLock: {
    width: 4,
    height: 4,
    backgroundColor: '#FBBF24',
    borderRadius: 2,
    marginTop: 2,
  },
  chestBase: {
    width: 24,
    height: 11,
    backgroundColor: '#451A03',
    borderWidth: 1,
    borderColor: '#B45309',
  },
  chestGoldBand: {
    width: '100%',
    height: 2,
    backgroundColor: '#F59E0B',
    marginTop: 4,
  },
  chestOpenTreasureGlow: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 10,
    backgroundColor: 'rgba(250, 204, 21, 0.4)',
    borderRadius: 5,
  },
  spikeContainer: {
    flexDirection: 'row',
    height: 12,
  },
  spikeTooth: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#94A3B8',
  },
  portalArch: {
    width: 32,
    height: 46,
    backgroundColor: '#0F172A',
    borderWidth: 3,
    borderColor: '#39FF14',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  portalVortex: {
    width: 20,
    height: 32,
    backgroundColor: 'rgba(57, 255, 20, 0.3)',
    borderRadius: 10,
  },
  portalRune: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
});

