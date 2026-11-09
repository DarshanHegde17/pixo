/**
 * PIXO: 8-BIT PIXEL KINGDOM ADVENTURE — Audio Synthesizer SFX Engine
 * 
 * Generates zero-latency retro chiptune sound effects using the Web Audio API:
 * - Jump (Rising frequency sweep square wave)
 * - Sword Attack / Slash (Descending noise swoosh)
 * - Shield Defend (Metallic clank block)
 * - Coin Collect (Two-tone high pitch ping)
 * - Player Hurt (Noise crunch flash)
 * - Enemy Defeat (Descending pop explosion)
 * - Boss Roar (Low frequency sawtooth rumble)
 * - Victory Fanfare (Triumphant 8-bit arpeggio)
 * - Game Over (Classic retro falling notes)
 */

import { Platform } from 'react-native';
import { PixelKingdomPersistenceService } from './pixelKingdomPersistenceService';

class PixelKingdomAudioServiceSingleton {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    try {
      const enabled = await PixelKingdomPersistenceService.isSoundEnabled();
      this.isMuted = !enabled;
    } catch {
      this.isMuted = false;
    }
  }

  getAudioContext() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  async toggleMute() {
    this.isMuted = !this.isMuted;
    await PixelKingdomPersistenceService.setSoundEnabled(!this.isMuted);
    return this.isMuted;
  }

  playTone(frequency, type = 'square', duration = 0.12, gainVal = 0.08) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context autoplay restriction guard
    }
  }

  // 1. Jump Sound (Rising frequency sweep 150Hz -> 420Hz)
  playJump() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  // 2. Sword Slash (Crisp descending swoosh)
  playSlash() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  // 3. Shield Defend (Metallic clank block)
  playShield() {
    if (this.isMuted) return;
    this.playTone(320, 'triangle', 0.12, 0.14);
    setTimeout(() => {
      this.playTone(580, 'sine', 0.08, 0.08);
    }, 20);
  }

  // 4. Coin Collect (Classic 8-bit two-tone chime B5 -> E6)
  playCoin() {
    if (this.isMuted) return;
    this.playTone(987.77, 'sine', 0.08, 0.09); // B5
    setTimeout(() => {
      this.playTone(1318.51, 'sine', 0.18, 0.1); // E6
    }, 70);
  }

  // 5. Player Hurt (Noise crunch)
  playHit() {
    if (this.isMuted) return;
    this.playTone(180, 'sawtooth', 0.18, 0.14);
  }

  // 6. Enemy Defeat (Descending pop tone)
  playEnemyDefeat() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  // 7. Boss Roar (Deep rumble)
  playBossRoar() {
    if (this.isMuted) return;
    this.playTone(75, 'sawtooth', 0.5, 0.2);
  }

  // 8. Victory Fanfare (Retro 8-bit arpeggio: C5 -> E5 -> G5 -> C6)
  playVictory() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'square', 0.2, 0.1);
      }, idx * 110);
    });
  }

  // 9. Game Over (Retro descending defeat theme)
  playGameOver() {
    if (this.isMuted) return;
    const notes = [440, 392, 349.23, 293.66];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.25, 0.1);
      }, idx * 140);
    });
  }
}

export const PixelKingdomAudio = new PixelKingdomAudioServiceSingleton();

