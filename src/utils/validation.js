/**
 * Validation utilities for Authentication & Registration
 */

/**
 * Validates player name / username
 * @param {string} name 
 * @returns {{ isValid: boolean, error: string | null }}
 */
export const validateName = (name) => {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Player name is required' };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmed.length > 24) {
    return { isValid: false, error: 'Name must be 24 characters or less' };
  }

  return { isValid: true, error: null };
};

/**
 * Validates real email address format (specifically supports & optimizes for Gmail & real domains)
 * @param {string} email 
 * @param {boolean} requireGmailOnly - optional flag if strictly checking gmail
 * @returns {{ isValid: boolean, error: string | null }}
 */
export const validateEmail = (email, requireGmailOnly = false) => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email address cannot be empty' };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  // Standard RFC 5322 compliant regex for real email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. user@gmail.com)' };
  }

  if (requireGmailOnly && !trimmedEmail.endsWith('@gmail.com') && !trimmedEmail.endsWith('@googlemail.com')) {
    return { isValid: false, error: 'Please use a valid Gmail address (@gmail.com)' };
  }

  return { isValid: true, error: null };
};

/**
 * Validates password field
 * @param {string} password 
 * @returns {{ isValid: boolean, error: string | null, strength: 'weak' | 'medium' | 'strong' }}
 */
export const validatePassword = (password) => {
  if (!password || password === '') {
    return { isValid: false, error: 'Password cannot be empty', strength: 'weak' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters', strength: 'weak' };
  }

  let strengthScore = 0;
  if (password.length >= 8) strengthScore++;
  if (/[A-Z]/.test(password)) strengthScore++;
  if (/[0-9]/.test(password)) strengthScore++;
  if (/[^A-Za-z0-9]/.test(password)) strengthScore++;

  let strength = 'weak';
  if (strengthScore >= 3) {
    strength = 'strong';
  } else if (strengthScore >= 1) {
    strength = 'medium';
  }

  return { isValid: true, error: null, strength };
};

/**
 * Validates password confirmation
 * @param {string} password 
 * @param {string} confirmPassword 
 * @returns {{ isValid: boolean, error: string | null }}
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword === '') {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true, error: null };
};

/**
 * Validates OTP code format
 * @param {string} otp 
 * @param {number} length 
 * @returns {{ isValid: boolean, error: string | null }}
 */
export const validateOtp = (otp, length = 6) => {
  if (!otp || otp.trim() === '') {
    return { isValid: false, error: 'Please enter the verification code' };
  }

  const cleanOtp = otp.trim();
  if (cleanOtp.length !== length || !/^\d+$/.test(cleanOtp)) {
    return { isValid: false, error: `Code must be ${length} numeric digits` };
  }

  return { isValid: true, error: null };
};
