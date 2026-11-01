import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AuthService } from '../services/authService';
import { GamingActivityService, toDateKey, getAppTimezone } from '../services/gamingActivityService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [streakState, setStreakState] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [otpNotification, setOtpNotification] = useState(null);
  const lastCheckedDateRef = useRef(toDateKey(new Date()));

  // Refresh and validate streak state from persistent database
  const refreshStreak = useCallback(async (userId = user?.id) => {
    if (!userId) {
      setStreakState(null);
      return null;
    }
    try {
      const state = await GamingActivityService.getUserStreakState(userId);
      setStreakState(state);
      // Synchronize user.streak in local user state
      if (state && typeof state.currentStreak === 'number') {
        setUser((prev) => (prev ? { ...prev, streak: state.currentStreak } : prev));
      }
      return state;
    } catch (err) {
      console.warn('Error refreshing streak state:', err);
      return null;
    }
  }, [user?.id]);

  // Restore session on initial load & validate streak
  const restoreSession = useCallback(async () => {
    try {
      setIsLoadingSession(true);
      const activeUser = await AuthService.getActiveSession();
      if (activeUser) {
        setUser(activeUser);
        await refreshStreak(activeUser.id);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    } finally {
      setIsLoadingSession(false);
    }
  }, [refreshStreak]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // AUTOMATIC MIDNIGHT STREAK VALIDATION
  // Monitors calendar day boundaries and triggers validation at 12:00 AM
  useEffect(() => {
    if (!user?.id) return;

    let midnightTimer = null;
    let pollInterval = null;

    const scheduleMidnightTimer = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const msUntilMidnight = Math.max(1000, midnight.getTime() - now.getTime());

      midnightTimer = setTimeout(async () => {
        lastCheckedDateRef.current = toDateKey(new Date());
        await refreshStreak(user.id);
        scheduleMidnightTimer();
      }, msUntilMidnight);
    };

    scheduleMidnightTimer();

    // Secondary safety poll: verify if local calendar date changed across 12:00 AM
    pollInterval = setInterval(async () => {
      const currentDateKey = toDateKey(new Date());
      if (currentDateKey !== lastCheckedDateRef.current) {
        lastCheckedDateRef.current = currentDateKey;
        await refreshStreak(user.id);
      }
    }, 15000);

    return () => {
      if (midnightTimer) clearTimeout(midnightTimer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [user?.id, refreshStreak]);

  // Request OTP for new registration
  const requestOtp = async (email) => {
    try {
      const res = await AuthService.requestOtp(email);
      if (res.success) {
        setOtpNotification({
          visible: true,
          code: res.otp,
          email: res.email,
          expiresAt: res.expiresAt,
        });
      }
      return res;
    } catch (err) {
      return { success: false, error: 'Failed to generate verification code' };
    }
  };

  const dismissOtpNotification = () => {
    setOtpNotification(null);
  };

  // Register with OTP
  const registerWithOtp = async ({ name, email, password, otp }) => {
    try {
      const res = await AuthService.registerUser({ name, email, password, otp });
      if (res.success && res.user) {
        setUser(res.user);
        setOtpNotification(null);
      }
      return res;
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  // Login with Email & Password
  const login = async (email, password, rememberMe = true) => {
    try {
      const res = await AuthService.loginUser(email, password, rememberMe);
      if (res.success && res.user) {
        setUser(res.user);
      }
      return res;
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setOtpNotification(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const updated = await AuthService.updateUserProfile(user.id, updates);
      setUser(updated);
      return { success: true, user: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Add XP
  const addXp = async (amount) => {
    if (!user) return;
    try {
      const res = await AuthService.addXpToUser(user.id, amount);
      if (res && res.updatedUser) {
        setUser(res.updatedUser);
      }
      return res;
    } catch (err) {
      console.error('Failed to add XP:', err);
    }
  };

  // Add Coins
  const addCoins = async (amount) => {
    if (!user) return;
    try {
      const updated = await AuthService.addCoinsToUser(user.id, amount);
      if (updated) setUser(updated);
      return updated;
    } catch (err) {
      console.error('Failed to add coins:', err);
    }
  };

  // Claim Daily XP Reward (default 20 XP)
  const claimDailyReward = async (xpAmount = 20, coinsAmount = 10) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const res = await AuthService.claimDailyReward(user.id, xpAmount, coinsAmount);
      if (res && res.updatedUser) {
        setUser(res.updatedUser);
      }
      return res;
    } catch (err) {
      console.error('Failed to claim daily reward:', err);
      return { success: false, error: err.message };
    }
  };

  // RESTORE BROKEN STREAK USING XP
  const restoreStreak = async (days = null) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const res = await GamingActivityService.restoreStreak(user.id, days);
      if (res.success && res.streakState) {
        setStreakState(res.streakState);
        setUser((prev) =>
          prev ? { ...prev, xp: res.remainingXp, streak: res.restoredStreak } : prev
        );
      }
      return res;
    } catch (err) {
      console.error('Error in restoreStreak:', err);
      return { success: false, error: err.message || 'Restoration failed' };
    }
  };

  // Test Simulation helper: simulate missed calendar days for test verification
  const simulateMissedDays = async (days = 1) => {
    if (!user) return null;
    try {
      const simulated = await GamingActivityService.simulateMissedDays(user.id, days);
      setStreakState(simulated);
      setUser((prev) => (prev ? { ...prev, streak: 0 } : prev));
      return simulated;
    } catch (err) {
      console.error('Error in simulateMissedDays:', err);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        streakState,
        isAuthenticated: !!user,
        isLoadingSession,
        otpNotification,
        requestOtp,
        dismissOtpNotification,
        registerWithOtp,
        login,
        logout,
        restoreSession,
        updateProfile,
        addXp,
        addCoins,
        claimDailyReward,
        refreshStreak,
        restoreStreak,
        simulateMissedDays,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
