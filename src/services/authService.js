import { SessionStorage } from './sessionStorage.js';

const STORAGE_KEYS = {
  CURRENT_SESSION: '@soloplay_active_session',
  USERS_REGISTRY: '@soloplay_registered_users',
  PENDING_OTP: '@soloplay_pending_otp_record',
};

// Pre-seeded demo / existing accounts
export const DEFAULT_DEMO_USERS = [
  {
    id: 'usr_demo_1',
    name: 'SoloSlayer',
    email: 'gamer@gmail.com',
    password: 'SoloGamer2026!',
    xp: 3450,
    maxXp: 5000,
    coins: 850,
    streak: 7,
    avatar: 'game-controller',
    gamerTag: 'SOLO_SLAYER#2099',
    badge: 'Pro Slayer',
    profilePicture: null,
    createdAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'usr_demo_2',
    name: 'CyberKnight',
    email: 'player1@pixo.gg',
    password: 'SoloGamer2026!',
    xp: 1200,
    maxXp: 2500,
    coins: 450,
    streak: 3,
    avatar: 'shield',
    gamerTag: 'CYBER_KNIGHT#4040',
    badge: 'Cyber Veteran',
    profilePicture: null,
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'usr_demo_3',
    name: 'CyberKnight',
    email: 'player1@soloplay.gg',
    password: 'SoloGamer2026!',
    xp: 1200,
    maxXp: 2500,
    coins: 450,
    streak: 3,
    avatar: 'shield',
    gamerTag: 'CYBER_KNIGHT#4040',
    badge: 'Cyber Veteran',
    profilePicture: null,
    createdAt: '2026-02-01T00:00:00.000Z',
  },
];

// In-memory OTP store for active verification sessions
let activeOtpStore = {
  email: '',
  code: '',
  expiresAt: 0,
};

export const AuthService = {
  /**
   * Get all registered users from storage + demo users
   * @returns {Promise<Array>}
   */
  async getAllUsers() {
    try {
      const storedUsers = await SessionStorage.getItem(STORAGE_KEYS.USERS_REGISTRY);
      const customUsers = Array.isArray(storedUsers) ? storedUsers : [];
      
      // Combine custom users with demo users (custom overrides demo if same email)
      const userMap = new Map();
      DEFAULT_DEMO_USERS.forEach((u) => userMap.set(u.email.toLowerCase(), u));
      customUsers.forEach((u) => userMap.set(u.email.toLowerCase(), u));

      return Array.from(userMap.values());
    } catch (err) {
      console.error('Error fetching users:', err);
      return DEFAULT_DEMO_USERS;
    }
  },

  /**
   * Find user by email
   * @param {string} email
   * @returns {Promise<object | null>}
   */
  async findUserByEmail(email) {
    if (!email) return null;
    const users = await this.getAllUsers();
    const normalized = email.trim().toLowerCase();
    return users.find((u) => u.email.toLowerCase() === normalized) || null;
  },

  /**
   * Find user by ID
   * @param {string} userId
   * @returns {Promise<object | null>}
   */
  async findUserById(userId) {
    if (!userId) return null;
    const users = await this.getAllUsers();
    return users.find((u) => u.id === userId) || null;
  },

  /**
   * Generates a 6-digit OTP code and records it
   * @param {string} email
   * @returns {Promise<{ success: boolean, otp: string, email: string, expiresAt: number }>}
   */
  async requestOtp(email) {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Generate secure 6-digit numeric OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    activeOtpStore = {
      email: normalizedEmail,
      code,
      expiresAt,
    };

    await SessionStorage.setItem(STORAGE_KEYS.PENDING_OTP, activeOtpStore);

    return {
      success: true,
      otp: code,
      email: normalizedEmail,
      expiresAt,
    };
  },

  /**
   * Verify an OTP against the stored active OTP
   * @param {string} email
   * @param {string} enteredOtp
   * @returns {Promise<{ isValid: boolean, error: string | null }>}
   */
  async verifyOtpCode(email, enteredOtp) {
    const normalizedEmail = email.trim().toLowerCase();
    let record = activeOtpStore;

    if (!record || record.email !== normalizedEmail) {
      const stored = await SessionStorage.getItem(STORAGE_KEYS.PENDING_OTP);
      if (stored) record = stored;
    }

    if (!record || record.email !== normalizedEmail) {
      return {
        isValid: false,
        error: 'No active OTP verification session found for this email. Please request a new code.',
      };
    }

    if (Date.now() > record.expiresAt) {
      return {
        isValid: false,
        error: 'Verification code has expired. Please request a new code.',
      };
    }

    if (record.code !== enteredOtp.trim()) {
      return {
        isValid: false,
        error: 'Incorrect verification code. Please check your email and try again.',
      };
    }

    return { isValid: true, error: null };
  },

  /**
   * Register a new user with OTP verification and create session
   * @param {{ name: string, email: string, password: string, otp: string }} params
   * @returns {Promise<{ success: boolean, user?: object, error?: string }>}
   */
  async registerUser({ name, email, password, otp }) {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify OTP
    const otpResult = await this.verifyOtpCode(normalizedEmail, otp);
    if (!otpResult.isValid) {
      return { success: false, error: otpResult.error };
    }

    // 2. Check if email already registered
    const existing = await this.findUserByEmail(normalizedEmail);
    if (existing) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please log in instead.',
      };
    }

    // 3. Create new user profile
    const safeTag = `${name.trim().toUpperCase().replace(/\s+/g, '_')}#${Math.floor(1000 + Math.random() * 9000)}`;
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: normalizedEmail,
      gamerTag: safeTag,
      password: password,
      xp: 150,
      maxXp: 5000,
      coins: 200,
      streak: 1,
      avatar: 'flash',
      badge: 'Novice Adventurer',
      profilePicture: null,
      createdAt: new Date().toISOString(),
    };

    // 4. Save to persistent custom users list
    const storedUsers = (await SessionStorage.getItem(STORAGE_KEYS.USERS_REGISTRY)) || [];
    storedUsers.push(newUser);
    await SessionStorage.setItem(STORAGE_KEYS.USERS_REGISTRY, storedUsers);

    // 5. Clear pending OTP
    activeOtpStore = { email: '', code: '', expiresAt: 0 };
    await SessionStorage.removeItem(STORAGE_KEYS.PENDING_OTP);

    // 6. Automatically log in user and create session
    await this.setSession(newUser);

    return {
      success: true,
      user: newUser,
    };
  },

  /**
   * Authenticate existing user with Email & Password
   * @param {string} email
   * @param {string} password
   * @param {boolean} rememberMe
   * @returns {Promise<{ success: boolean, user?: object, error?: string }>}
   */
  async loginUser(email, password, rememberMe = true) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.findUserByEmail(normalizedEmail);

    if (!user) {
      return {
        success: false,
        error: 'Account not found. Please check your email or create a new account.',
      };
    }

    if (user.password !== password) {
      return {
        success: false,
        error: 'Incorrect password. Please verify your credentials and try again.',
      };
    }

    // Establish session
    await this.setSession(user);

    return {
      success: true,
      user,
    };
  },

  /**
   * Save user session
   * @param {object} user
   */
  async setSession(user) {
    if (!user) return;
    const sessionData = {
      user,
      sessionToken: `token_${user.id}_${Date.now()}`,
      loggedInAt: new Date().toISOString(),
    };
    await SessionStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionData);
  },

  /**
   * Get active user session
   * @returns {Promise<object | null>}
   */
  async getActiveSession() {
    try {
      const sessionData = await SessionStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (sessionData && sessionData.user) {
        return sessionData.user;
      }
      return null;
    } catch (err) {
      console.error('Error reading session:', err);
      return null;
    }
  },

  /**
   * Update authenticated user profile details (name, gamerTag, avatar, profilePicture)
   */
  async updateUserProfile(userId, updates = {}) {
    if (!userId) throw new Error('Unauthorized');

    const users = await this.getAllUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    let updatedUser = null;

    if (userIndex !== -1) {
      updatedUser = {
        ...users[userIndex],
        ...updates,
      };
      users[userIndex] = updatedUser;
    } else {
      const active = await this.getActiveSession();
      if (active && active.id === userId) {
        updatedUser = { ...active, ...updates };
        users.push(updatedUser);
      }
    }

    if (!updatedUser) {
      throw new Error('User record not found.');
    }

    // Save updated users list
    await SessionStorage.setItem(STORAGE_KEYS.USERS_REGISTRY, users);

    // Update active session
    await this.setSession(updatedUser);

    return updatedUser;
  },

  /**
   * Adds XP to user balance (accumulates directly, no level calculation)
   */
  async addXpToUser(userId, xpToAdd) {
    if (!userId || !xpToAdd) return null;
    const active = await this.getActiveSession();
    if (!active || active.id !== userId) return null;

    const currentXp = typeof active.xp === 'number' ? active.xp : 0;
    const newXp = currentXp + xpToAdd;
    const maxXp = active.maxXp || 5000;

    const updatedUser = await this.updateUserProfile(userId, {
      xp: newXp,
      maxXp,
    });

    return { updatedUser };
  },

  /**
   * Adds coins to user balance
   */
  async addCoinsToUser(userId, coinsToAdd) {
    if (!userId || !coinsToAdd) return null;
    const active = await this.getActiveSession();
    if (!active || active.id !== userId) return null;

    const currentCoins = typeof active.coins === 'number' ? active.coins : 850;
    const newCoins = currentCoins + coinsToAdd;

    const updatedUser = await this.updateUserProfile(userId, {
      coins: newCoins,
    });
    return updatedUser;
  },

  /**
   * Checks if daily XP reward was already collected today (1 per day limit)
   */
  async checkDailyClaimStatus(userId) {
    if (!userId) return false;
    const today = new Date().toISOString().slice(0, 10);
    const key = `@soloplay_daily_xp_${userId}_${today}`;
    const record = await SessionStorage.getItem(key);
    return !!record;
  },

  /**
   * Resets daily claim status (useful for demo testing)
   */
  async resetDailyClaimStatus(userId) {
    if (!userId) return false;
    const today = new Date().toISOString().slice(0, 10);
    const key = `@soloplay_daily_xp_${userId}_${today}`;
    await SessionStorage.removeItem(key);
    return true;
  },

  /**
   * Collects daily 1-per-day XP & Coin reward
   */
  async claimDailyReward(userId, xpAmount = 150, coinsAmount = 50) {
    if (!userId) return { success: false, error: 'No user ID' };
    const today = new Date().toISOString().slice(0, 10);
    const key = `@soloplay_daily_xp_${userId}_${today}`;
    const alreadyClaimed = await SessionStorage.getItem(key);
    if (alreadyClaimed) {
      return { success: false, alreadyClaimed: true, message: 'Already collected for today (1/1)' };
    }

    // Mark as claimed for today
    await SessionStorage.setItem(key, { claimedAt: new Date().toISOString() });

    // Add XP
    const xpResult = await this.addXpToUser(userId, xpAmount);

    // Add Coins and ensure streak
    const active = await this.getActiveSession();
    const currentCoins = typeof active?.coins === 'number' ? active.coins : 850;
    const newCoins = currentCoins + coinsAmount;
    const currentStreak = typeof active?.streak === 'number' ? active.streak : 7;

    const updatedUser = await this.updateUserProfile(userId, {
      coins: newCoins,
      streak: currentStreak,
      lastDailyClaim: today,
    });

    return {
      success: true,
      updatedUser,
      xpAdded: xpAmount,
      coinsAdded: coinsAmount,
    };
  },

  /**
   * Terminate active session (Log out)
   */
  async logout() {
    await SessionStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  },
};

export default AuthService;
