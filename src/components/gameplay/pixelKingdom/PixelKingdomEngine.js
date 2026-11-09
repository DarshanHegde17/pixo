/**
 * PIXO: 8-BIT PIXEL KINGDOM ADVENTURE — Core Game Engine
 * 
 * Generates 10 progressive 2D side-scrolling platform levels with real physics:
 * - Gravity, acceleration, friction, platform collision detection
 * - Player movement, jumping, sword attacking hitbox, shield defense
 * - Enemy patrol AI, combat collision, and defeat rewards
 * - Boss fight phases (Shadow Knight, Fire Drake, Crystal Behemoth, Ancient Red Dragon)
 * - Collectible royal coins, treasure chests, hazard spikes, and level exit gates
 */

import { PIXEL_KINGDOM_LEVELS } from '../../../services/pixelKingdomPersistenceService';

export const LEVEL_WIDTH = 2200;
export const LEVEL_HEIGHT = 440;
export const GRAVITY = 0.55;
export const JUMP_FORCE = -11.5;
export const MOVE_SPEED = 4.2;

/**
 * Procedurally generates full physics geometry, platforms, enemies, and collectibles
 * for each of the 10 unique missions.
 */
export function generateLevelData(levelNumber = 1) {
  const meta = PIXEL_KINGDOM_LEVELS.find((l) => l.level === Number(levelNumber)) || PIXEL_KINGDOM_LEVELS[0];

  // 1. Platforms: [{ id, x, y, width, height, type: 'ground' | 'platform' | 'moving' }]
  const platforms = [
    // Starting ground
    { id: 'g0', x: 0, y: 380, width: 450, height: 60, type: 'ground' },
    // Mid ground sections with gaps
    { id: 'g1', x: 550, y: 380, width: 400, height: 60, type: 'ground' },
    { id: 'g2', x: 1050, y: 380, width: 450, height: 60, type: 'ground' },
    // End stage / Boss arena ground
    { id: 'g3', x: 1600, y: 380, width: 600, height: 60, type: 'ground' },
  ];

  // Elevated platforms
  const elevated = [
    { id: 'p1', x: 200, y: 290, width: 130, height: 16, type: 'platform' },
    { id: 'p2', x: 380, y: 220, width: 140, height: 16, type: 'platform' },
    { id: 'p3', x: 600, y: 260, width: 120, height: 16, type: 'platform' },
    { id: 'p4', x: 780, y: 190, width: 150, height: 16, type: 'platform' },
    { id: 'p5', x: 1000, y: 250, width: 130, height: 16, type: 'platform' },
    { id: 'p6', x: 1200, y: 190, width: 140, height: 16, type: 'platform' },
    { id: 'p7', x: 1420, y: 260, width: 130, height: 16, type: 'platform' },
    { id: 'p8', x: 1720, y: 270, width: 140, height: 16, type: 'platform' },
    { id: 'p9', x: 1920, y: 210, width: 140, height: 16, type: 'platform' },
  ];
  platforms.push(...elevated);

  // Moving platforms in advanced levels
  if (levelNumber >= 2) {
    platforms.push({
      id: 'm1',
      x: 480,
      y: 320,
      width: 90,
      height: 14,
      type: 'moving',
      minX: 460,
      maxX: 530,
      speed: 1.2,
      dir: 1,
    });
  }
  if (levelNumber >= 4) {
    platforms.push({
      id: 'm2',
      x: 960,
      y: 330,
      width: 80,
      height: 14,
      type: 'moving',
      minX: 950,
      maxX: 1040,
      speed: 1.5,
      dir: 1,
    });
  }

  // 2. Hazards (Spikes / Lava)
  const hazards = [];
  // Gaps filled with spikes or lava
  hazards.push({ id: 'h1', x: 450, y: 400, width: 100, height: 40, type: meta.bgTheme === 'volcano' ? 'lava' : 'spike' });
  hazards.push({ id: 'h2', x: 950, y: 400, width: 100, height: 40, type: meta.bgTheme === 'volcano' ? 'lava' : 'spike' });
  hazards.push({ id: 'h3', x: 1500, y: 400, width: 100, height: 40, type: meta.bgTheme === 'volcano' ? 'lava' : 'spike' });

  // Additional hazards on higher levels
  if (levelNumber >= 3) {
    hazards.push({ id: 'h4', x: 680, y: 368, width: 30, height: 12, type: 'spike' });
    hazards.push({ id: 'h5', x: 1280, y: 368, width: 30, height: 12, type: 'spike' });
  }

  // 3. Collectibles: Royal Coins
  const coins = [];
  const coinSpots = [
    { x: 120, y: 340 },
    { x: 260, y: 250 },
    { x: 440, y: 180 },
    { x: 620, y: 340 },
    { x: 660, y: 220 },
    { x: 840, y: 150 },
    { x: 1100, y: 340 },
    { x: 1260, y: 150 },
    { x: 1480, y: 220 },
    { x: 1680, y: 340 },
    { x: 1780, y: 230 },
    { x: 1980, y: 170 },
    { x: 2060, y: 340 },
  ];

  const totalCoinsToSpawn = Math.min(coinSpots.length, Math.max(meta.targetCoins + 2, 8));
  for (let i = 0; i < totalCoinsToSpawn; i++) {
    coins.push({
      id: `c_${i}`,
      x: coinSpots[i].x,
      y: coinSpots[i].y,
      collected: false,
    });
  }

  // 4. Treasure Chest (Near end or secret ledge)
  const chest = {
    x: 1460,
    y: 236,
    isOpen: false,
    bonusCoins: 5,
    bonusXp: 30,
  };

  // 5. Enemies Setup
  const enemies = [];
  let enemyType = 'slime';
  if (levelNumber === 2) enemyType = 'skeleton';
  else if (levelNumber === 3) enemyType = 'ghost';
  else if (levelNumber === 4) enemyType = 'bat';
  else if (levelNumber === 5) enemyType = 'fire_monster';
  else if (levelNumber === 6) enemyType = 'goblin';
  else if (levelNumber === 7) enemyType = 'skeleton';
  else if (levelNumber === 8) enemyType = 'ghost';
  else if (levelNumber === 9) enemyType = 'fire_monster';
  else if (levelNumber === 10) enemyType = 'fire_monster';

  const enemyPatrols = [
    { x: 280, y: 344, minX: 180, maxX: 420 },
    { x: 700, y: 344, minX: 580, maxX: 880 },
    { x: 800, y: 154, minX: 780, maxX: 920 },
    { x: 1180, y: 344, minX: 1080, maxX: 1400 },
    { x: 1380, y: 344, minX: 1200, maxX: 1480 },
    { x: 1750, y: 344, minX: 1620, maxX: 1900 },
  ];

  const enemiesToSpawn = Math.min(enemyPatrols.length, meta.targetEnemies || 4);
  for (let i = 0; i < enemiesToSpawn; i++) {
    const ep = enemyPatrols[i];
    enemies.push({
      id: `e_${i}`,
      type: enemyType,
      x: ep.x,
      y: ep.y,
      vx: 1.2,
      minX: ep.minX,
      maxX: ep.maxX,
      hp: 100,
      maxHp: 100,
      facing: 'left',
      isHit: false,
      hitTimer: 0,
      isDefeated: false,
      attackCooldown: 0,
    });
  }

  // 6. Boss Entity (For levels 3, 5, 8, 10)
  let boss = null;
  if (meta.isBossLevel && meta.boss) {
    let bossType = 'shadow_knight';
    if (levelNumber === 5) bossType = 'fire_drake';
    else if (levelNumber === 8) bossType = 'crystal_behemoth';
    else if (levelNumber === 10) bossType = 'dragon';

    boss = {
      type: bossType,
      name: meta.boss.name,
      title: meta.boss.title,
      x: 1850,
      y: bossType === 'dragon' ? 304 : 330,
      vx: 1.6,
      minX: 1650,
      maxX: 2050,
      hp: meta.boss.maxHp,
      maxHp: meta.boss.maxHp,
      facing: 'left',
      isHit: false,
      hitTimer: 0,
      phase: 1,
      maxPhases: meta.boss.phases || 2,
      attackTimer: 0,
      isAttacking: false,
      isDefeated: false,
    };
  }

  // 7. Level Exit Portal (At end of level)
  const exitPortal = {
    x: 2120,
    y: 334,
    width: 32,
    height: 46,
  };

  return {
    meta,
    platforms,
    hazards,
    coins,
    chest,
    enemies,
    boss,
    exitPortal,
    playerStart: { x: 50, y: 340 },
  };
}

/**
 * AABB Bounding Box Collision Check
 */
export function checkAABB(r1, r2) {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}

