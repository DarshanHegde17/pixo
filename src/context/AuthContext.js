import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [otpNotification, setOtpNotification] = useState(null);

  // Restore session on initial load
  const restoreSession = useCallback(async () => {
    try {
      setIsLoadingSession(true);
      const activeUser = await AuthService.getActiveSession();
      if (activeUser) {
        setUser(activeUser);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

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

  return (
    <AuthContext.Provider
      value={{
        user,
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
