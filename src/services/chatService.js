/**
 * SOLOPLAY — Smart Chat Service
 * Handles authenticated user messaging, local session persistence,
 * rate limiting, sanitization, and tactical AI Co-Pilot responses.
 */

import { SessionStorage } from './sessionStorage.js';

const CHAT_STORAGE_KEYS = {
  COPILOT_PREFIX: '@soloplay_copilot_chat_',
  GLOBAL_COMMS: '@soloplay_global_chat',
};

// Rate limiting store (timestamps of last message per user)
const lastMessageTimestamps = new Map();
const RATE_LIMIT_MS = 800; // 800ms debounce

// Default initial Co-Pilot messages
export const DEFAULT_COPILOT_MESSAGES = [
  {
    id: 'copilot_init_1',
    sender: 'Solo Co-Pilot',
    role: 'assistant',
    text: 'Tactical Solo Co-Pilot initialized. Ready to assist with game routes, mission tactics, and streak progression.',
    timestamp: '12:00 PM',
  },
];

// Default initial Global Comms community transmissions
export const DEFAULT_GLOBAL_MESSAGES = [
  {
    id: 'global_init_1',
    sender: 'CyberKnight',
    userId: 'usr_demo_2',
    avatar: 'shield',
    text: 'Just conquered Chapter 4 in Shadow Blade! Dual plasma katanas are lethal 🔥',
    timestamp: '11:42 AM',
    accentColor: '#39FF14',
  },
  {
    id: 'global_init_2',
    sender: 'NeonViper',
    userId: 'usr_net_3',
    avatar: 'flash',
    text: 'Anyone hit 18k points in Neon Runner today? Combo multiplier is insane.',
    timestamp: '12:15 PM',
    accentColor: '#00E5FF',
  },
  {
    id: 'global_init_3',
    sender: 'AstroGamer',
    userId: 'usr_net_4',
    avatar: 'planet',
    text: 'Sector 7 wormhole unlocked in Astro Odyssey! Cosmic gravity puzzles are top tier.',
    timestamp: '12:28 PM',
    accentColor: '#FF6A00',
  },
];

/**
 * Format date time to 12-hour AM/PM string
 */
export function formatChatTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Sanitize user chat input against script injection & tags
 */
export function sanitizeChatText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .trim()
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '')
    .slice(0, 500); // 500 char max limit
}

export const ChatService = {
  /**
   * Check if rate-limited
   */
  isRateLimited(userId) {
    const key = userId || 'anonymous';
    const now = Date.now();
    const last = lastMessageTimestamps.get(key) || 0;
    if (now - last < RATE_LIMIT_MS) {
      return true;
    }
    lastMessageTimestamps.set(key, now);
    return false;
  },

  /**
   * Fetch conversation history for Tactical AI Co-Pilot
   */
  async getCoPilotHistory(userId) {
    try {
      const storageKey = `${CHAT_STORAGE_KEYS.COPILOT_PREFIX}${userId || 'default'}`;
      const saved = await SessionStorage.getItem(storageKey);
      if (Array.isArray(saved) && saved.length > 0) {
        return saved;
      }
      return DEFAULT_COPILOT_MESSAGES;
    } catch (err) {
      console.warn('Error reading Co-Pilot history:', err);
      return DEFAULT_COPILOT_MESSAGES;
    }
  },

  /**
   * Fetch conversation history for Global Comms channel
   */
  async getGlobalCommsHistory() {
    try {
      const saved = await SessionStorage.getItem(CHAT_STORAGE_KEYS.GLOBAL_COMMS);
      if (Array.isArray(saved) && saved.length > 0) {
        return saved;
      }
      return DEFAULT_GLOBAL_MESSAGES;
    } catch (err) {
      console.warn('Error reading Global Comms history:', err);
      return DEFAULT_GLOBAL_MESSAGES;
    }
  },

  /**
   * Send message to Solo Co-Pilot & generate contextual advice
   */
  async sendCoPilotMessage(user, rawText) {
    const text = sanitizeChatText(rawText);
    if (!text) {
      throw new Error('Message cannot be empty.');
    }

    const userId = user?.id || 'usr_demo_1';
    if (this.isRateLimited(userId)) {
      throw new Error('Transmission frequency limit reached. Please wait a moment.');
    }

    const userMessage = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender: user?.name || 'Slayer',
      role: 'user',
      text,
      timestamp: formatChatTime(),
      avatar: user?.avatar || 'game-controller',
      profilePicture: user?.profilePicture || null,
    };

    // Generate intelligent tactical answer
    const aiResponseText = this.generateCoPilotResponse(text, user);
    const aiMessage = {
      id: `copilot_${Date.now() + 1}_${Math.random().toString(36).substring(2, 6)}`,
      sender: 'Solo Co-Pilot',
      role: 'assistant',
      text: aiResponseText,
      timestamp: formatChatTime(),
    };

    const currentHistory = await this.getCoPilotHistory(userId);
    const updatedHistory = [...currentHistory, userMessage, aiMessage];

    const storageKey = `${CHAT_STORAGE_KEYS.COPILOT_PREFIX}${userId}`;
    await SessionStorage.setItem(storageKey, updatedHistory);

    return { userMessage, aiMessage, updatedHistory };
  },

  /**
   * Send message to Global Squad Comms
   */
  async sendGlobalCommsMessage(user, rawText) {
    const text = sanitizeChatText(rawText);
    if (!text) {
      throw new Error('Message cannot be empty.');
    }

    const userId = user?.id || 'usr_demo_1';
    if (this.isRateLimited(userId)) {
      throw new Error('Transmission frequency limit reached. Please wait a moment.');
    }

    const newCommsMessage = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender: user?.name || 'Slayer',
      userId,
      avatar: user?.avatar || 'game-controller',
      profilePicture: user?.profilePicture || null,
      text,
      timestamp: formatChatTime(),
      accentColor: '#39FF14',
    };

    const currentHistory = await this.getGlobalCommsHistory();
    const updatedHistory = [...currentHistory, newCommsMessage];

    await SessionStorage.setItem(CHAT_STORAGE_KEYS.GLOBAL_COMMS, updatedHistory);

    return { newCommsMessage, updatedHistory };
  },

  /**
   * Clear Co-Pilot history
   */
  async clearCoPilotHistory(userId) {
    const storageKey = `${CHAT_STORAGE_KEYS.COPILOT_PREFIX}${userId || 'default'}`;
    await SessionStorage.setItem(storageKey, DEFAULT_COPILOT_MESSAGES);
    return DEFAULT_COPILOT_MESSAGES;
  },

  /**
   * Reset Global Comms history
   */
  async resetGlobalCommsHistory() {
    await SessionStorage.setItem(CHAT_STORAGE_KEYS.GLOBAL_COMMS, DEFAULT_GLOBAL_MESSAGES);
    return DEFAULT_GLOBAL_MESSAGES;
  },

  /**
   * Context-aware intelligent tactical response generation for Co-Pilot
   */
  generateCoPilotResponse(prompt, user) {
    const q = prompt.toLowerCase();

    // 1. Neon Runner: 2099
    if (q.includes('neon') || q.includes('runner') || q.includes('parkour')) {
      return 'Neon Runner 2099 tip: Slide right before neon billboards and trigger double dash to preserve combo speed above 3.5x for the 15,000 pts daily quest!';
    }

    // 2. Shadow Blade Reborn
    if (q.includes('shadow') || q.includes('blade') || q.includes('katana') || q.includes('boss')) {
      return 'Shadow Blade Reborn: In Chapter 4, wait for the robotic warden’s visor to flash orange, then execute an instant parry for 100% plasma critical damage.';
    }

    // 3. Astro Odyssey Zero
    if (q.includes('astro') || q.includes('odyssey') || q.includes('space') || q.includes('wormhole')) {
      return 'Astro Odyssey: Reverse thrusters 2 seconds before entering Sector 7 gravity anomalies to shield your scout craft from gravitational shear.';
    }

    // 4. Daily Streak & Verification Rules
    if (q.includes('streak') || q.includes('flame') || q.includes('daily') || q.includes('calendar')) {
      return 'Streak Rule: Complete at least 1 game activity per calendar day (12:00 AM - 11:59 PM) to increase your streak! If you miss a day, restore your streak for 1,000 XP per missed day.';
    }

    // 5. XP & Season Pass
    if (q.includes('xp') || q.includes('level') || q.includes('rank') || q.includes('tier') || q.includes('pass')) {
      const currentXp = user?.xp || 510;
      return `Season Pass status: You have ${currentXp.toLocaleString()} XP. Complete Daily Quests in the command HUD (+150 to +300 XP each) and win games to boost your XP progression!`;
    }

    // 6. Quests & Objectives
    if (q.includes('quest') || q.includes('mission') || q.includes('objective')) {
      return 'Daily Quests active: Complete "Cyber Strike Highscore" or "Daily Solo Training" in the dashboard to unlock rewards and qualify your daily streak.';
    }

    // 7. Cyber Strike / Spotlight
    if (q.includes('cyber strike') || q.includes('spotlight') || q.includes('featured')) {
      return 'Cyber Strike: 2099 is today’s Featured Showcase! 30+ hours of solo cyberpunk campaign with cyber augmentations and RTX graphics.';
    }

    // 8. General Greetings & Help
    if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('status')) {
      return `Welcome ${user?.name || 'Slayer'}! Tactical HUD active. Ask me about game mechanics, quest secrets, or high-score multipliers.`;
    }

    // Default intelligent gaming assistant response
    return 'Tactical tip: Focus on maintaining high combo chains and completing verified daily runs to maximize your XP multiplier and unlock new tier badges!';
  },
};
