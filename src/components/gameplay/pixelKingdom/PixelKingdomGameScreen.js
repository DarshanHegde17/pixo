import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  PixelKnight,
  PixelEnemy,
  PixelCoin,
  PixelChest,
  PixelSpike,
  PixelExitPortal,
} from './PixelKingdomSprites';
import {
  generateLevelData,
  checkAABB,
  LEVEL_WIDTH,
  LEVEL_HEIGHT,
  GRAVITY,
  JUMP_FORCE,
  MOVE_SPEED,
} from './PixelKingdomEngine';
import {
  PIXEL_KINGDOM_LEVELS,
  PixelKingdomPersistenceService,
} from '../../../services/pixelKingdomPersistenceService';
import { PixelKingdomAudio } from '../../../services/pixelKingdomAudioService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PixelKingdomGameScreen = ({
  levelNumber = 1,
  userId,
  initialSavedState = null,
  onMissionCompleted,
  onExitToLevelSelect,
  onExitToDashboard,
}) => {
  const meta = PIXEL_KINGDOM_LEVELS.find((l) => l.level === Number(levelNumber)) || PIXEL_KINGDOM_LEVELS[0];

  // Viewport Dimensions
  const viewWidth = Math.min(SCREEN_WIDTH, 840);
  const viewHeight = 400;

  // Game Engine State Refs (to avoid React re-render lag during 60 FPS physics loop)
  const gameStateRef = useRef(null);
  const inputRef = useRef({
    left: false,
    right: false,
    jump: false,
    attack: false,
    shield: false,
  });
  const loopRef = useRef(null);
  const lastTimeRef = useRef(Date.now());

  // React Render States (Refreshed at ~30-60 FPS for HUD & Entities)
  const [renderTick, setRenderTick] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [victoryReport, setVictoryReport] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize Level & Player State
  const initGame = useCallback(() => {
    const data = generateLevelData(levelNumber);

    let startX = data.playerStart.x;
    let startY = data.playerStart.y;
    let health = 100;
    let score = 0;
    let coinsCollected = 0;
    let enemiesDefeated = 0;

    // Restore from saved cloud session if applicable
    if (initialSavedState && Number(initialSavedState.level) === Number(levelNumber)) {
      if (initialSavedState.playerX) startX = initialSavedState.playerX;
      if (initialSavedState.playerY) startY = initialSavedState.playerY;
      if (typeof initialSavedState.health === 'number') health = initialSavedState.health;
      if (typeof initialSavedState.score === 'number') score = initialSavedState.score;
      if (typeof initialSavedState.coinsCollected === 'number') coinsCollected = initialSavedState.coinsCollected;
      if (typeof initialSavedState.enemiesDefeated === 'number') enemiesDefeated = initialSavedState.enemiesDefeated;
    }

    gameStateRef.current = {
      player: {
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        width: 26,
        height: 38,
        onGround: false,
        facing: 'right',
        state: 'idle',
        attackTimer: 0,
        shieldTimer: 0,
        invulnerableTimer: 0,
        health,
        maxHealth: 100,
        score,
        coinsCollected,
        enemiesDefeated,
        isDefending: false,
      },
      platforms: data.platforms,
      hazards: data.hazards,
      coins: data.coins,
      chest: data.chest,
      enemies: data.enemies,
      boss: data.boss,
      exitPortal: data.exitPortal,
      cameraX: 0,
      startTime: Date.now(),
      elapsedSeconds: 0,
    };

    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    setVictoryReport(null);
  }, [levelNumber, initialSavedState]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Main 60 FPS Physics & Combat Game Loop
  useEffect(() => {
    if (isPaused || isGameOver || isVictory) return;

    const gameLoop = () => {
      const now = Date.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const state = gameStateRef.current;
      if (!state) return;

      const { player, platforms, hazards, coins, chest, enemies, boss, exitPortal } = state;

      // Update Play Time
      state.elapsedSeconds = Math.round((now - state.startTime) / 1000);

      // 1. Controller / Keyboard Input Polling
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        const gp = gamepads && (gamepads[0] || gamepads[1]);
        if (gp) {
          inputRef.current.left = gp.axes[0] < -0.3 || gp.buttons[14]?.pressed;
          inputRef.current.right = gp.axes[0] > 0.3 || gp.buttons[15]?.pressed;
          inputRef.current.jump = gp.buttons[0]?.pressed || gp.buttons[1]?.pressed; // A or B
          inputRef.current.attack = gp.buttons[2]?.pressed; // X
          inputRef.current.shield = gp.buttons[4]?.pressed || gp.buttons[6]?.pressed; // L1 / L2
        }
      }

      // 2. Player Timers
      if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;
      if (player.attackTimer > 0) {
        player.attackTimer -= dt;
        if (player.attackTimer <= 0) player.state = 'idle';
      }

      player.isDefending = inputRef.current.shield;

      // 3. Player Horizontal Movement
      if (inputRef.current.left) {
        player.vx = -MOVE_SPEED;
        player.facing = 'left';
        if (player.onGround && player.state !== 'attack' && !player.isDefending) {
          player.state = 'walk';
        }
      } else if (inputRef.current.right) {
        player.vx = MOVE_SPEED;
        player.facing = 'right';
        if (player.onGround && player.state !== 'attack' && !player.isDefending) {
          player.state = 'walk';
        }
      } else {
        player.vx *= 0.6; // friction
        if (player.onGround && player.state !== 'attack' && !player.isDefending) {
          player.state = 'idle';
        }
      }

      if (player.isDefending) {
        player.state = 'shield';
        player.vx *= 0.4; // slower while defending
      }

      // 4. Jump Handling
      if (inputRef.current.jump && player.onGround && !player.isDefending) {
        player.vy = JUMP_FORCE;
        player.onGround = false;
        player.state = 'jump';
        PixelKingdomAudio.playJump();
      }

      // 5. Sword Attack Handling
      if (inputRef.current.attack && player.attackTimer <= 0 && !player.isDefending) {
        player.attackTimer = 0.28;
        player.state = 'attack';
        PixelKingdomAudio.playSlash();

        // Sword Hitbox (extends 40px in facing direction)
        const swordHitbox = {
          x: player.facing === 'right' ? player.x + player.width : player.x - 42,
          y: player.y + 4,
          width: 44,
          height: 32,
        };

        // Check enemies in sword reach
        enemies.forEach((enemy) => {
          if (!enemy.isDefeated && checkAABB(swordHitbox, { x: enemy.x, y: enemy.y, width: 28, height: 32 })) {
            enemy.hp -= 50;
            enemy.isHit = true;
            enemy.hitTimer = 0.2;
            enemy.vx = player.facing === 'right' ? 3.5 : -3.5; // knockback

            if (enemy.hp <= 0) {
              enemy.isDefeated = true;
              player.score += 150;
              player.enemiesDefeated += 1;
              PixelKingdomAudio.playEnemyDefeat();
            } else {
              PixelKingdomAudio.playHit();
            }
          }
        });

        // Check boss in sword reach
        if (boss && !boss.isDefeated) {
          const bossBox = { x: boss.x, y: boss.y, width: 60, height: 60 };
          if (checkAABB(swordHitbox, bossBox)) {
            boss.hp -= 35;
            boss.isHit = true;
            boss.hitTimer = 0.25;

            if (boss.hp <= 0) {
              boss.isDefeated = true;
              player.score += 1000;
              PixelKingdomAudio.playEnemyDefeat();
            } else {
              PixelKingdomAudio.playHit();
            }
          }
        }

        // Check treasure chest in reach
        if (chest && !chest.isOpen) {
          const chestBox = { x: chest.x, y: chest.y, width: 26, height: 20 };
          if (checkAABB(swordHitbox, chestBox)) {
            chest.isOpen = true;
            player.score += 250;
            player.coinsCollected += chest.bonusCoins;
            PixelKingdomAudio.playCoin();
          }
        }
      }

      // 6. Apply Gravity & Position Integration
      player.vy += GRAVITY;
      player.x += player.vx;
      player.y += player.vy;

      // Bound player to level limits
      if (player.x < 0) player.x = 0;
      if (player.x > LEVEL_WIDTH - player.width) player.x = LEVEL_WIDTH - player.width;

      // 7. Platform Collisions
      player.onGround = false;
      const playerBox = { x: player.x, y: player.y, width: player.width, height: player.height };

      platforms.forEach((plat) => {
        // Move dynamic moving platforms
        if (plat.type === 'moving') {
          plat.x += plat.speed * plat.dir;
          if (plat.x >= plat.maxX) plat.dir = -1;
          if (plat.x <= plat.minX) plat.dir = 1;
        }

        // Landing collision (from above)
        if (
          player.vy >= 0 &&
          player.y + player.height >= plat.y &&
          player.y + player.height <= plat.y + 14 &&
          player.x + player.width > plat.x &&
          player.x < plat.x + plat.width
        ) {
          player.y = plat.y - player.height;
          player.vy = 0;
          player.onGround = true;
          if (player.state === 'jump') player.state = 'idle';

          // Carry player with moving platform
          if (plat.type === 'moving') {
            player.x += plat.speed * plat.dir;
          }
        }
      });

      // 8. Bottom Abyss Pit Falling Check
      if (player.y > LEVEL_HEIGHT) {
        player.health -= 25;
        PixelKingdomAudio.playHit();
        player.x = Math.max(50, player.x - 180);
        player.y = 200;
        player.vy = 0;
        if (player.health <= 0) {
          handleMissionFailed();
          return;
        }
      }

      // 9. Hazard Spikes & Lava Collisions
      hazards.forEach((hazard) => {
        if (player.invulnerableTimer <= 0 && checkAABB(playerBox, hazard)) {
          const dmg = hazard.type === 'lava' ? 30 : 25;
          player.health -= dmg;
          player.invulnerableTimer = 1.0;
          player.vy = -7.5; // bounce up
          PixelKingdomAudio.playHit();

          if (player.health <= 0) {
            handleMissionFailed();
            return;
          }
        }
      });

      // 10. Coin Pickups
      coins.forEach((c) => {
        if (!c.collected && checkAABB(playerBox, { x: c.x, y: c.y, width: 14, height: 14 })) {
          c.collected = true;
          player.coinsCollected += 1;
          player.score += 50;
          PixelKingdomAudio.playCoin();
        }
      });

      // 11. Enemy Patrol AI & Combat
      enemies.forEach((enemy) => {
        if (enemy.isDefeated) return;

        // Reset hit flash timer
        if (enemy.hitTimer > 0) {
          enemy.hitTimer -= dt;
          if (enemy.hitTimer <= 0) enemy.isHit = false;
        }

        // Move enemy
        enemy.x += enemy.vx;
        if (enemy.x >= enemy.maxX) {
          enemy.vx = -Math.abs(enemy.vx);
          enemy.facing = 'left';
        } else if (enemy.x <= enemy.minX) {
          enemy.vx = Math.abs(enemy.vx);
          enemy.facing = 'right';
        }

        // Enemy-Player Collision
        const enemyBox = { x: enemy.x, y: enemy.y, width: 28, height: 32 };
        if (player.invulnerableTimer <= 0 && checkAABB(playerBox, enemyBox)) {
          // If player is holding SHIELD and facing enemy: block!
          const facingEnemy = (player.facing === 'right' && enemy.x > player.x) || (player.facing === 'left' && enemy.x < player.x);
          if (player.isDefending && facingEnemy) {
            player.health -= 3; // minimal chip damage
            enemy.vx = -enemy.vx * 1.5; // push enemy away
            player.invulnerableTimer = 0.5;
            PixelKingdomAudio.playShield();
          } else {
            player.health -= 20;
            player.invulnerableTimer = 0.9;
            player.vy = -5;
            player.vx = enemy.x > player.x ? -3 : 3;
            PixelKingdomAudio.playHit();
          }

          if (player.health <= 0) {
            handleMissionFailed();
            return;
          }
        }
      });

      // 12. Boss AI & Combat (Levels 3, 5, 8, 10)
      if (boss && !boss.isDefeated) {
        if (boss.hitTimer > 0) {
          boss.hitTimer -= dt;
          if (boss.hitTimer <= 0) boss.isHit = false;
        }

        boss.attackTimer += dt;
        boss.x += boss.vx;
        if (boss.x >= boss.maxX) {
          boss.vx = -Math.abs(boss.vx);
          boss.facing = 'left';
        } else if (boss.x <= boss.minX) {
          boss.vx = Math.abs(boss.vx);
          boss.facing = 'right';
        }

        // Special Boss Roar & Phase Shift
        if (boss.attackTimer > 4) {
          boss.attackTimer = 0;
          PixelKingdomAudio.playBossRoar();
        }

        // Boss-Player Collision
        const bossBox = { x: boss.x, y: boss.y, width: 60, height: 60 };
        if (player.invulnerableTimer <= 0 && checkAABB(playerBox, bossBox)) {
          if (player.isDefending) {
            player.health -= 8;
            player.invulnerableTimer = 0.6;
            player.vx = boss.x > player.x ? -5 : 5;
            PixelKingdomAudio.playShield();
          } else {
            player.health -= 30;
            player.invulnerableTimer = 1.0;
            player.vy = -6;
            player.vx = boss.x > player.x ? -5 : 5;
            PixelKingdomAudio.playHit();
          }

          if (player.health <= 0) {
            handleMissionFailed();
            return;
          }
        }
      }

      // 13. Exit Portal & Mission Complete Condition
      const canComplete = player.coinsCollected >= meta.targetCoins && (!boss || boss.isDefeated);
      if (canComplete && checkAABB(playerBox, exitPortal)) {
        handleMissionVictory();
        return;
      }

      // 14. Smooth Camera Tracking
      const targetCamX = player.x - viewWidth * 0.38;
      state.cameraX = Math.max(0, Math.min(targetCamX, LEVEL_WIDTH - viewWidth));

      // Trigger frame re-render
      setRenderTick((t) => (t + 1) % 1000);
      loopRef.current = requestAnimationFrame(gameLoop);
    };

    loopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (loopRef.current) cancelAnimationFrame(loopRef.current);
    };
  }, [isPaused, isGameOver, isVictory, viewWidth, meta]);

  // Keyboard Event Handlers (Desktop)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputRef.current.right = true;
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        inputRef.current.jump = true;
      } else if (e.key === 'x' || e.key === 'X' || e.key === 'j' || e.key === 'J') {
        inputRef.current.attack = true;
      } else if (e.key === 'z' || e.key === 'Z' || e.key === 'k' || e.key === 'K') {
        inputRef.current.shield = true;
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setIsPaused((p) => !p);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputRef.current.right = false;
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        inputRef.current.jump = false;
      } else if (e.key === 'x' || e.key === 'X' || e.key === 'j' || e.key === 'J') {
        inputRef.current.attack = false;
      } else if (e.key === 'z' || e.key === 'Z' || e.key === 'k' || e.key === 'K') {
        inputRef.current.shield = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mission Failed Handler
  const handleMissionFailed = () => {
    setIsGameOver(true);
    PixelKingdomAudio.playGameOver();
  };

  // Mission Victory Handler
  const handleMissionVictory = async () => {
    setIsVictory(true);
    PixelKingdomAudio.playVictory();

    const state = gameStateRef.current;
    const finalScore = state ? state.player.score : 500;
    const duration = state ? state.elapsedSeconds : 60;

    // Dispatches rewards to database & updates streaks/quests!
    const res = await PixelKingdomPersistenceService.claimLevelRewards(
      userId,
      levelNumber,
      finalScore,
      duration
    );

    setVictoryReport({
      level: levelNumber,
      title: meta.title,
      score: finalScore,
      duration,
      coins: state ? state.player.coinsCollected : 10,
      enemies: state ? state.player.enemiesDefeated : 4,
      xpAwarded: res.xpAwarded || meta.rewardXp,
      coinsAwarded: res.coinsAwarded || meta.rewardCoins,
      isFirstClear: res.isFirstClear,
    });

    if (onMissionCompleted) {
      onMissionCompleted(res);
    }
  };

  // Save & Exit to Level Select
  const handleSaveAndExit = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const state = gameStateRef.current;
      if (state) {
        await PixelKingdomPersistenceService.saveActiveSession(userId, {
          level: levelNumber,
          playerX: Math.round(state.player.x),
          playerY: Math.round(state.player.y),
          health: Math.max(10, state.player.health),
          score: state.player.score,
          coinsCollected: state.player.coinsCollected,
          enemiesDefeated: state.player.enemiesDefeated,
          elapsedSeconds: state.elapsedSeconds,
        });
      }
      onExitToLevelSelect();
    } catch (e) {
      console.warn('Failed to save session:', e);
      onExitToLevelSelect();
    } finally {
      setIsSaving(false);
    }
  };

  const state = gameStateRef.current;
  if (!state) return null;

  const { player, platforms, hazards, coins, chest, enemies, boss, exitPortal, cameraX } = state;
  const isTargetAchieved = player.coinsCollected >= meta.targetCoins && (!boss || boss.isDefeated);

  return (
    <View style={styles.container}>
      {/* ========================================================= */}
      {/* 1. TOP COMBAT HUD                                         */}
      {/* ========================================================= */}
      <View style={styles.topHud}>
        {/* Left: Health Bar */}
        <View style={styles.healthContainer}>
          <View style={styles.healthIconWrap}>
            <Ionicons name="heart" size={14} color="#EF4444" />
          </View>
          <View style={styles.healthTrack}>
            <View
              style={[
                styles.healthFill,
                { width: `${Math.max(0, Math.min(100, player.health))}%` },
                player.health < 30 && { backgroundColor: '#EF4444' },
              ]}
            />
          </View>
          <Text style={styles.healthText}>{Math.max(0, Math.round(player.health))}%</Text>
        </View>

        {/* Center: Stage & Objective Snip */}
        <View style={styles.hudCenterBlock}>
          <Text style={styles.hudStageTitle} numberOfLines={1}>
            LVL {levelNumber}: {meta.title}
          </Text>
          <Text style={styles.hudObjectiveText} numberOfLines={1}>
            🪙 {player.coinsCollected}/{meta.targetCoins} Coins • ⚔️ {player.enemiesDefeated}/{meta.targetEnemies} Slayed
          </Text>
        </View>

        {/* Right: Score & Pause Button */}
        <View style={styles.hudRightBlock}>
          <Text style={styles.hudScoreText}>{player.score} PTS</Text>
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={() => setIsPaused(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="pause" size={14} color="#39FF14" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Boss Health Bar (When Boss is Active in Levels 3, 5, 8, 10) */}
      {boss && !boss.isDefeated && (
        <View style={styles.bossBarContainer}>
          <View style={styles.bossBarHeader}>
            <Ionicons name="skull" size={13} color="#EF4444" style={{ marginRight: 4 }} />
            <Text style={styles.bossNameText}>
              {boss.name} — {boss.title}
            </Text>
            <Text style={styles.bossHpText}>{Math.max(0, boss.hp)} / {boss.maxHp} HP</Text>
          </View>
          <View style={styles.bossTrack}>
            <View
              style={[
                styles.bossFill,
                { width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* 2. SIDE-SCROLLING 2D PIXEL PLATFORMER ARENA VIEWPORT      */}
      {/* ========================================================= */}
      <View style={[styles.arenaViewport, { width: viewWidth, height: viewHeight }]}>
        {/* Dynamic Theme Sky Gradient */}
        <LinearGradient
          colors={
            meta.bgTheme === 'forest'
              ? ['#06180C', '#0E2E18', '#07150B']
              : meta.bgTheme === 'volcano'
              ? ['#260803', '#450F05', '#1A0401']
              : meta.bgTheme === 'crystal'
              ? ['#1E0826', '#351142', '#120417']
              : ['#0A1218', '#14202B', '#090E14']
          }
          style={StyleSheet.absoluteFillObject}
        />

        {/* Parallax Distant Backdrop Pillars */}
        <View
          style={[
            styles.distantParallaxRow,
            { transform: [{ translateX: -cameraX * 0.3 }] },
          ]}
        >
          <View style={styles.distantPillar} />
          <View style={[styles.distantPillar, { left: 400 }]} />
          <View style={[styles.distantPillar, { left: 800 }]} />
          <View style={[styles.distantPillar, { left: 1200 }]} />
          <View style={[styles.distantPillar, { left: 1600 }]} />
        </View>

        {/* World Layer Container (Shifted by cameraX) */}
        <View
          style={[
            styles.worldLayer,
            { transform: [{ translateX: -cameraX }] },
          ]}
        >
          {/* Platforms Rendering */}
          {platforms.map((plat) => (
            <View
              key={plat.id}
              style={[
                styles.platformMesh,
                {
                  left: plat.x,
                  top: plat.y,
                  width: plat.width,
                  height: plat.height,
                  backgroundColor: plat.type === 'ground' ? '#14532D' : '#1E293B',
                  borderColor: plat.type === 'ground' ? '#22C55E' : '#38BDF8',
                },
                plat.type === 'moving' && styles.platformMovingGlow,
              ]}
            >
              {/* Pixel Grass / Stone Trim */}
              <View
                style={[
                  styles.platformTopTrim,
                  { backgroundColor: plat.type === 'ground' ? '#22C55E' : '#60A5FA' },
                ]}
              />
            </View>
          ))}

          {/* Hazard Spikes / Lava Rendering */}
          {hazards.map((haz) => (
            <View
              key={haz.id}
              style={[
                styles.hazardEntity,
                {
                  left: haz.x,
                  top: haz.y,
                  width: haz.width,
                  height: haz.height,
                  backgroundColor: haz.type === 'lava' ? '#EA580C' : 'transparent',
                },
              ]}
            >
              {haz.type === 'spike' && <PixelSpike />}
              {haz.type === 'lava' && <View style={styles.lavaGlowRim} />}
            </View>
          ))}

          {/* Collectible Coins Rendering */}
          {coins.map((c) => {
            if (c.collected) return null;
            return (
              <View
                key={c.id}
                style={[styles.coinEntity, { left: c.x, top: c.y }]}
              >
                <PixelCoin />
              </View>
            );
          })}

          {/* Treasure Chest Rendering */}
          {chest && (
            <View style={[styles.chestEntity, { left: chest.x, top: chest.y }]}>
              <PixelChest isOpen={chest.isOpen} />
            </View>
          )}

          {/* Enemies Rendering */}
          {enemies.map((enemy) => {
            if (enemy.isDefeated) return null;
            return (
              <View
                key={enemy.id}
                style={[styles.enemyEntity, { left: enemy.x, top: enemy.y }]}
              >
                <PixelEnemy
                  type={enemy.type}
                  facing={enemy.facing}
                  isHit={enemy.isHit}
                />
              </View>
            );
          })}

          {/* Boss Entity Rendering */}
          {boss && !boss.isDefeated && (
            <View style={[styles.bossEntity, { left: boss.x, top: boss.y }]}>
              <PixelEnemy
                type={boss.type}
                facing={boss.facing}
                isHit={boss.isHit}
                scale={1.3}
              />
            </View>
          )}

          {/* Exit Portal / Castle Gateway */}
          <View
            style={[
              styles.portalEntity,
              { left: exitPortal.x, top: exitPortal.y },
              isTargetAchieved && styles.portalEntityActive,
            ]}
          >
            <PixelExitPortal />
            {isTargetAchieved && (
              <View style={styles.portalReadyCallout}>
                <Text style={styles.portalReadyText}>ENTER GATE</Text>
              </View>
            )}
          </View>

          {/* Pixel Knight Player Entity */}
          <View
            style={[
              styles.playerEntity,
              { left: player.x, top: player.y },
              player.invulnerableTimer > 0 && styles.playerInvulnerableGlow,
            ]}
          >
            <PixelKnight
              state={player.state}
              facing={player.facing}
              scale={1}
            />
          </View>
        </View>
      </View>

      {/* ========================================================= */}
      {/* 3. MOBILE ON-SCREEN TOUCH CONTROLS (RESPONSIVE VIRTUAL PAD) */}
      {/* ========================================================= */}
      <View style={styles.mobileControlsContainer}>
        {/* Left D-Pad: Left & Right */}
        <View style={styles.dpadGroup}>
          <TouchableOpacity
            style={styles.dpadButton}
            onPressIn={() => { inputRef.current.left = true; }}
            onPressOut={() => { inputRef.current.left = false; }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dpadButton}
            onPressIn={() => { inputRef.current.right = true; }}
            onPressOut={() => { inputRef.current.right = false; }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons: SHIELD, ATTACK, JUMP */}
        <View style={styles.actionButtonsGroup}>
          {/* Shield / Defend Button (Z) */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.shieldBtn]}
            onPressIn={() => { inputRef.current.shield = true; }}
            onPressOut={() => { inputRef.current.shield = false; }}
            activeOpacity={0.7}
          >
            <Ionicons name="shield" size={20} color="#00E5FF" />
            <Text style={styles.actionBtnSubtext}>SHIELD</Text>
          </TouchableOpacity>

          {/* Attack / Sword Button (X) */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.attackBtn]}
            onPressIn={() => { inputRef.current.attack = true; }}
            onPressOut={() => { inputRef.current.attack = false; }}
            activeOpacity={0.7}
          >
            <Ionicons name="flash" size={22} color="#F59E0B" />
            <Text style={styles.actionBtnSubtext}>ATTACK</Text>
          </TouchableOpacity>

          {/* Jump Button (Space) */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.jumpBtn]}
            onPressIn={() => { inputRef.current.jump = true; }}
            onPressOut={() => { inputRef.current.jump = false; }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-up" size={24} color="#050705" />
            <Text style={[styles.actionBtnSubtext, { color: '#050705' }]}>JUMP</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ========================================================= */}
      {/* 4. MODAL: TACTICAL PAUSE MENU                             */}
      {/* ========================================================= */}
      {isPaused && (
        <View style={styles.overlayModal}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Ionicons name="pause-circle" size={22} color="#39FF14" style={{ marginRight: 6 }} />
              <Text style={styles.modalTitleText}>MISSION PAUSED</Text>
            </View>
            <Text style={styles.modalSubtitleText}>
              Stage {levelNumber}: {meta.title} • {player.score} Points
            </Text>

            <View style={styles.modalButtonsStack}>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => setIsPaused(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={18} color="#050705" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>RESUME MISSION</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={handleSaveAndExit}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-upload" size={16} color="#00E5FF" style={{ marginRight: 6 }} />
                <Text style={styles.modalSecondaryBtnText}>
                  {isSaving ? 'SAVING...' : 'SAVE & EXIT TO LEVEL SELECTION'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  initGame();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={[styles.modalSecondaryBtnText, { color: '#F59E0B' }]}>
                  RESTART MISSION
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDangerBtn}
                onPress={onExitToDashboard}
                activeOpacity={0.8}
              >
                <Ionicons name="exit-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.modalDangerBtnText}>EXIT TO DASHBOARD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: MISSION FAILED SCREEN                           */}
      {/* ========================================================= */}
      {isGameOver && (
        <View style={styles.overlayModal}>
          <View style={[styles.modalCard, { borderColor: '#EF4444' }]}>
            <Ionicons name="skull" size={44} color="#EF4444" style={{ marginBottom: 8 }} />
            <Text style={[styles.modalTitleText, { color: '#EF4444' }]}>MISSION FAILED</Text>
            <Text style={styles.modalSubtitleText}>
              Your valiant knight fell in combat. The pixel kingdom remains besieged.
            </Text>

            <View style={styles.defeatMetricsRow}>
              <Text style={styles.defeatMetric}>Score: {player.score} PTS</Text>
              <Text style={styles.defeatMetric}>Coins: {player.coinsCollected}</Text>
              <Text style={styles.defeatMetric}>Monsters: {player.enemiesDefeated}</Text>
            </View>

            <View style={styles.modalButtonsStack}>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => initGame()}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[styles.modalPrimaryBtnText, { color: '#FFFFFF' }]}>RETRY MISSION</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={onExitToLevelSelect}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSecondaryBtnText}>LEVEL SELECTION</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDangerBtn}
                onPress={onExitToDashboard}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDangerBtnText}>RETURN TO DASHBOARD</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: MISSION COMPLETED SCREEN                        */}
      {/* ========================================================= */}
      {isVictory && victoryReport && (
        <View style={styles.overlayModal}>
          <View style={[styles.modalCard, { borderColor: '#39FF14' }]}>
            <Ionicons name="trophy" size={48} color="#FFD700" style={{ marginBottom: 6 }} />
            <Text style={[styles.modalTitleText, { color: '#39FF14' }]}>MISSION COMPLETED!</Text>
            <Text style={styles.modalSubtitleText}>
              Stage {victoryReport.level}: {victoryReport.title} Cleared!
            </Text>

            {/* Reward Summary Badges */}
            <View style={styles.victoryRewardsRow}>
              <View style={styles.rewardPillXp}>
                <Ionicons name="flash" size={15} color="#00E5FF" style={{ marginRight: 4 }} />
                <Text style={styles.rewardXpText}>+{victoryReport.xpAwarded} XP</Text>
              </View>
              <View style={styles.rewardPillCoins}>
                <Ionicons name="cash" size={15} color="#FFD700" style={{ marginRight: 4 }} />
                <Text style={styles.rewardCoinsText}>+{victoryReport.coinsAwarded} COINS</Text>
              </View>
            </View>

            {/* Performance Debrief Table */}
            <View style={styles.debriefBox}>
              <View style={styles.debriefRow}>
                <Text style={styles.debriefLabel}>Final Score:</Text>
                <Text style={styles.debriefValue}>{victoryReport.score} PTS</Text>
              </View>
              <View style={styles.debriefRow}>
                <Text style={styles.debriefLabel}>Completion Time:</Text>
                <Text style={styles.debriefValue}>{victoryReport.duration}s</Text>
              </View>
              <View style={styles.debriefRow}>
                <Text style={styles.debriefLabel}>Coins Gathered:</Text>
                <Text style={styles.debriefValue}>{victoryReport.coins}</Text>
              </View>
              <View style={styles.debriefRow}>
                <Text style={styles.debriefLabel}>Monsters Defeated:</Text>
                <Text style={styles.debriefValue}>{victoryReport.enemies}</Text>
              </View>
            </View>

            {/* Next Mission / Exit Actions */}
            <View style={styles.modalButtonsStack}>
              {levelNumber < 10 ? (
                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  onPress={() => onExitToLevelSelect(levelNumber + 1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalPrimaryBtnText}>NEXT MISSION (STAGE {levelNumber + 1})</Text>
                  <Ionicons name="arrow-forward" size={18} color="#050705" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              ) : (
                <View style={styles.dragonSlayerBadge}>
                  <Ionicons name="ribbon" size={16} color="#FFD700" style={{ marginRight: 6 }} />
                  <Text style={styles.dragonSlayerText}>LEGENDARY DRAGON SLAYER ACQUIRED!</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => onExitToLevelSelect()}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSecondaryBtnText}>LEVEL SELECTION</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050A06',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topHud: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 10,
    paddingBottom: 8,
    backgroundColor: '#08110A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 255, 20, 0.2)',
    zIndex: 20,
  },
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthIconWrap: {
    marginRight: 4,
  },
  healthTrack: {
    width: 60,
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  healthFill: {
    height: '100%',
    backgroundColor: '#22C55E',
  },
  healthText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 5,
  },
  hudCenterBlock: {
    alignItems: 'center',
  },
  hudStageTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#39FF14',
    letterSpacing: 0.5,
  },
  hudObjectiveText: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  hudRightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hudScoreText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFD700',
  },
  pauseButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bossBarContainer: {
    width: '92%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginTop: 4,
    zIndex: 19,
  },
  bossBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  bossNameText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#EF4444',
  },
  bossHpText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bossTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#450A0A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bossFill: {
    height: '100%',
    backgroundColor: '#DC2626',
  },
  arenaViewport: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    marginVertical: 4,
  },
  distantParallaxRow: {
    position: 'absolute',
    top: 60,
    bottom: 0,
    width: 2400,
  },
  distantPillar: {
    position: 'absolute',
    width: 60,
    height: 240,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 4,
  },
  worldLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: LEVEL_WIDTH,
    height: LEVEL_HEIGHT,
  },
  platformMesh: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  platformTopTrim: {
    width: '100%',
    height: 3,
  },
  platformMovingGlow: {
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  hazardEntity: {
    position: 'absolute',
  },
  lavaGlowRim: {
    width: '100%',
    height: 4,
    backgroundColor: '#FDE047',
  },
  coinEntity: {
    position: 'absolute',
  },
  chestEntity: {
    position: 'absolute',
  },
  enemyEntity: {
    position: 'absolute',
  },
  bossEntity: {
    position: 'absolute',
  },
  portalEntity: {
    position: 'absolute',
    opacity: 0.6,
  },
  portalEntityActive: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  portalReadyCallout: {
    position: 'absolute',
    top: -18,
    backgroundColor: '#39FF14',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  portalReadyText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#050705',
  },
  playerEntity: {
    position: 'absolute',
    zIndex: 10,
  },
  playerInvulnerableGlow: {
    opacity: 0.65,
  },
  mobileControlsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 6,
    backgroundColor: '#08110A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(57, 255, 20, 0.15)',
  },
  dpadGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  dpadButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  shieldBtn: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 2,
    borderColor: '#00E5FF',
  },
  attackBtn: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  jumpBtn: {
    width: 56,
    height: 56,
    backgroundColor: '#39FF14',
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  actionBtnSubtext: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#CBD5E1',
    letterSpacing: 0.4,
    marginTop: 1,
  },

  // Overlays / Modals
  overlayModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 10, 6, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 50,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0D1710',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  modalSubtitleText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  modalButtonsStack: {
    width: '100%',
    gap: 10,
    marginTop: 18,
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#39FF14',
    paddingVertical: 13,
    borderRadius: 10,
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#050705',
    letterSpacing: 0.6,
  },
  modalSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalSecondaryBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 0.5,
  },
  modalDangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
  },
  modalDangerBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  defeatMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  defeatMetric: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FCA5A5',
  },
  victoryRewardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 14,
  },
  rewardPillXp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rewardXpText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#00E5FF',
  },
  rewardPillCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rewardCoinsText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFD700',
  },
  debriefBox: {
    width: '100%',
    backgroundColor: '#101B13',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  debriefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  debriefLabel: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '700',
  },
  debriefValue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  dragonSlayerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingVertical: 10,
    borderRadius: 8,
  },
  dragonSlayerText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
});

