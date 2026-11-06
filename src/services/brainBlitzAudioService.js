/**
 * PIXO BRAIN BLITZ — Audio & Synthesizer SFX Engine
 * 
 * Provides responsive, zero-latency cyberpunk sound effects using the Web Audio API:
 * - Card Flip
 * - Pair Match (Harmonic Chord)
 * - Pair Mismatch / Error
 * - Sequence Simon Tones (8 Musical pitches)
 * - Pattern Cell Select Ping
 * - Victory Fanfare
 * - Game Over Sound
 * 
 * Includes global mute/unmute state management and handles browser user-gesture restrictions safely.
 */

import { Platform } from 'react-native';
import { BrainBlitzPersistenceService } from './brainBlitzPersistenceService';

class BrainBlitzAudioServiceSingleton {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    try {
      const enabled = await BrainBlitzPersistenceService.isSoundEnabled();
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
    await BrainBlitzPersistenceService.setSoundEnabled(!this.isMuted);
    return this.isMuted;
  }

  playTone(frequency, type = 'sine', duration = 0.15, gainVal = 0.1) {
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
      // Audio autoplay restrictions or headless environment
    }
  }

  // 1. Card Flip SFX
  playFlip() {
    this.playTone(600, 'triangle', 0.08, 0.08);
  }

  // 2. Pair Match SFX (Bright ascending major chime)
  playMatch() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.25, 0.12);
      }, i * 70);
    });
  }

  // 3. Mismatch / Error SFX
  playMismatch() {
    this.playTone(180, 'sawtooth', 0.18, 0.08);
  }

  // 4. Sequence Simon Tones (8 Distinct Notes C4 through C5)
  playSequenceTone(symbolIndex = 0) {
    const scale = [
      261.63, // C4 - Circle (Green)
      293.66, // D4 - Triangle (Cyan)
      329.63, // E4 - Square (Gold)
      349.23, // F4 - Star (Orange)
      392.00, // G4 - Diamond (Pink)
      440.00, // A4 - Lightning (Spring Green)
      493.88, // B4 - Moon (Indigo)
      523.25, // C5 - Heart (Crimson)
    ];
    const freq = scale[symbolIndex % scale.length];
    this.playTone(freq, 'sine', 0.35, 0.18);
  }

  // 5. Pattern Cell Select Ping
  playSelect() {
    this.playTone(880, 'sine', 0.07, 0.09);
  }

  // 6. Victory Fanfare (Celebratory Arpeggio)
  playVictory() {
    if (this.isMuted) return;
    const fanfare = [
      { freq: 523.25, delay: 0 },
      { freq: 659.25, delay: 100 },
      { freq: 783.99, delay: 200 },
      { freq: 1046.5, delay: 320 },
    ];
    fanfare.forEach(({ freq, delay }) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.45, 0.15);
      }, delay);
    });
  }

  // 7. Defeat / Game Over Sound
  playDefeat() {
    if (this.isMuted) return;
    const defeatNotes = [
      { freq: 440, delay: 0 },
      { freq: 415.3, delay: 150 },
      { freq: 392, delay: 300 },
      { freq: 349.23, delay: 480 },
    ];
    defeatNotes.forEach(({ freq, delay }) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.3, 0.08);
      }, delay);
    });
  }
}

export const BrainBlitzAudioService = new BrainBlitzAudioServiceSingleton();
export default BrainBlitzAudioService;

