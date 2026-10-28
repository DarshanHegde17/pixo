import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlowingBackground } from '../components/GlowingBackground';
import { LogoHeader } from '../components/LogoHeader';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { OtpInput } from '../components/OtpInput';
import { OtpNotificationHud } from '../components/OtpNotificationHud';
import { SuccessModal } from '../components/SuccessModal';
import { useAuth } from '../context/AuthContext';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateOtp,
} from '../utils/validation';
import { colors, spacing, borderRadius } from '../theme';

export const LoginScreen = ({ onLoginSuccess }) => {
  const {
    login,
    registerWithOtp,
    requestOtp,
    otpNotification,
    dismissOtpNotification,
  } = useAuth();

  // Auth Modes: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');

  // Registration Flow Step: 'form' | 'otp'
  const [registerStep, setRegisterStep] = useState('form');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Hover states for tabs
  const [hoveredTab, setHoveredTab] = useState(null);

  // Validation Errors
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [successUserData, setSuccessUserData] = useState({ name: '', email: '' });

  // OTP Timer
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Field Refs
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Countdown timer effect for OTP
  useEffect(() => {
    let interval = null;
    if (registerStep === 'otp' && resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [registerStep, resendCountdown]);

  // Password strength calculation
  const passwordValidation = validatePassword(password);
  const passwordStrength = password ? passwordValidation.strength : null;

  // Clear errors when switching modes
  const handleSwitchMode = (mode) => {
    setAuthMode(mode);
    setRegisterStep('form');
    setErrors({});
    setOtpCode('');
  };

  // Quick fill existing demo accounts for instant login testing
  const handleQuickDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrors({});
  };

  // --- LOGIN SUBMISSION ---
  const handleLoginSubmit = async () => {
    const emailRes = validateEmail(email);
    const passRes = validatePassword(password);

    const newErrors = {
      email: emailRes.error,
      password: passRes.error,
      general: null,
    };

    setErrors(newErrors);

    if (!emailRes.isValid || !passRes.isValid) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password, rememberMe);
      setIsLoading(false);

      if (result.success) {
        setSuccessUserData({ name: result.user.name, email: result.user.email });
        setIsSuccessModalVisible(true);
      } else {
        setErrors((prev) => ({ ...prev, general: result.error }));
      }
    } catch (err) {
      setIsLoading(false);
      setErrors((prev) => ({
        ...prev,
        general: 'An unexpected error occurred during login.',
      }));
    }
  };

  // --- REGISTRATION: STEP 1 (REQUEST OTP) ---
  const handleRegisterProceedToOtp = async () => {
    const nameRes = validateName(name);
    const emailRes = validateEmail(email);
    const passRes = validatePassword(password);
    const confirmPassRes = validateConfirmPassword(password, confirmPassword);

    const newErrors = {
      name: nameRes.error,
      email: emailRes.error,
      password: passRes.error,
      confirmPassword: confirmPassRes.error,
      general: null,
    };

    setErrors(newErrors);

    if (
      !nameRes.isValid ||
      !emailRes.isValid ||
      !passRes.isValid ||
      !confirmPassRes.isValid
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const otpRes = await requestOtp(email);
      setIsLoading(false);

      if (otpRes.success) {
        setRegisterStep('otp');
        setResendCountdown(60);
        setCanResend(false);
        setOtpCode('');
        setErrors({});
      } else {
        setErrors((prev) => ({
          ...prev,
          general: otpRes.error || 'Failed to send OTP code.',
        }));
      }
    } catch (err) {
      setIsLoading(false);
      setErrors((prev) => ({
        ...prev,
        general: 'Error requesting OTP verification.',
      }));
    }
  };

  // --- REGISTRATION: RESEND OTP ---
  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    const otpRes = await requestOtp(email);
    setIsLoading(false);

    if (otpRes.success) {
      setResendCountdown(60);
      setCanResend(false);
      setOtpCode('');
      setErrors((prev) => ({ ...prev, general: null, otp: null }));
    } else {
      setErrors((prev) => ({
        ...prev,
        otp: otpRes.error || 'Failed to resend OTP.',
      }));
    }
  };

  // --- REGISTRATION: STEP 2 (VERIFY OTP & COMPLETE REGISTRATION) ---
  const handleVerifyOtpAndRegister = async (codeToVerify = otpCode) => {
    const code = codeToVerify || otpCode;
    const otpValidation = validateOtp(code, 6);

    if (!otpValidation.isValid) {
      setErrors((prev) => ({ ...prev, otp: otpValidation.error }));
      return;
    }

    setIsLoading(true);
    try {
      const regResult = await registerWithOtp({
        name,
        email,
        password,
        otp: code,
      });

      setIsLoading(false);

      if (regResult.success) {
        setSuccessUserData({
          name: regResult.user.name,
          email: regResult.user.email,
        });
        setIsSuccessModalVisible(true);
      } else {
        setErrors((prev) => ({ ...prev, otp: regResult.error }));
      }
    } catch (err) {
      setIsLoading(false);
      setErrors((prev) => ({
        ...prev,
        otp: 'Verification failed. Please try again.',
      }));
    }
  };

  // Close success modal & navigate
  const handleModalClose = () => {
    setIsSuccessModalVisible(false);
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  // Auto fill OTP from HUD
  const handleAutoFillOtp = (code) => {
    setOtpCode(code);
    setErrors((prev) => ({ ...prev, otp: null }));
    handleVerifyOtpAndRegister(code);
  };

  return (
    <GlowingBackground>
      <StatusBar barStyle="light-content" backgroundColor="#050705" />

      {/* Gmail OTP Delivery HUD banner */}
      <OtpNotificationHud
        visible={!!otpNotification}
        code={otpNotification?.code}
        email={otpNotification?.email}
        onAutoFill={handleAutoFillOtp}
        onDismiss={dismissOtpNotification}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Centered Glassmorphism Authentication Panel */}
          <View
            style={[
              styles.glassCard,
              Platform.OS === 'web' && { className: 'pixo-panel-enter' },
            ]}
          >
            {/* Top Orange Energy Accent Line */}
            <View style={styles.cardOrangeEdgeHighlight} />

            {/* Section 5: Brand Header */}
            <LogoHeader />

            {/* Section 6: Login and Register Segmented Control Navigation */}
            {registerStep !== 'otp' && (
              <View
                style={styles.tabSwitcher}
                accessibilityRole="tablist"
              >
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    authMode === 'login' && styles.tabButtonActive,
                    hoveredTab === 'login' &&
                      authMode !== 'login' &&
                      styles.tabButtonHovered,
                  ]}
                  onPress={() => handleSwitchMode('login')}
                  onMouseEnter={() => setHoveredTab('login')}
                  onMouseLeave={() => setHoveredTab(null)}
                  activeOpacity={0.75}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: authMode === 'login' }}
                  accessibilityLabel="Sign In"
                >
                  <Ionicons
                    name="log-in-outline"
                    size={16}
                    color={authMode === 'login' ? colors.primary : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      authMode === 'login' && styles.tabButtonTextActive,
                    ]}
                  >
                    SIGN IN
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    authMode === 'register' && styles.tabButtonActive,
                    hoveredTab === 'register' &&
                      authMode !== 'register' &&
                      styles.tabButtonHovered,
                  ]}
                  onPress={() => handleSwitchMode('register')}
                  onMouseEnter={() => setHoveredTab('register')}
                  onMouseLeave={() => setHoveredTab(null)}
                  activeOpacity={0.75}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: authMode === 'register' }}
                  accessibilityLabel="Register"
                >
                  <Ionicons
                    name="person-add-outline"
                    size={16}
                    color={authMode === 'register' ? colors.primary : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      authMode === 'register' && styles.tabButtonTextActive,
                    ]}
                  >
                    REGISTER
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* General Error Banner */}
            {errors.general && (
              <View style={styles.generalErrorBanner}>
                <Ionicons name="warning" size={17} color={colors.error} />
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            )}

            {/* ========================================================= */}
            {/* VIEW 1: SIGN IN (PLAYER ACCESS // 001)                    */}
            {/* ========================================================= */}
            {authMode === 'login' && (
              <View style={styles.formContainer}>
                {/* Form Heading Section */}
                <View style={styles.formHeaderSection}>
                  <View style={styles.formMiniBadge}>
                    <Text style={styles.formMiniBadgeText}>PLAYER ACCESS // 001</Text>
                  </View>
                  <Text style={styles.formHeading}>Welcome back, Player.</Text>
                  <Text style={styles.formSubtitle}>
                    Your next adventure is waiting.
                  </Text>
                </View>

                {/* Email Address */}
                <CustomInput
                  label="Email address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="Enter your email address"
                  iconName="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  error={errors.email}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />

                {/* Password Field */}
                <CustomInput
                  inputRef={passwordInputRef}
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  placeholder="Enter your password"
                  iconName="lock-closed-outline"
                  isPassword
                  autoComplete="password"
                  textContentType="password"
                  error={errors.password}
                  returnKeyType="done"
                  onSubmitEditing={handleLoginSubmit}
                />

                {/* Remember Me & Forgot Password Row */}
                <View style={styles.loginMetaRow}>
                  <TouchableOpacity
                    style={styles.rememberMeRow}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: rememberMe }}
                  >
                    <View
                      style={[
                        styles.customCheckbox,
                        rememberMe && styles.customCheckboxChecked,
                      ]}
                    >
                      {rememberMe && (
                        <Ionicons name="checkmark" size={13} color="#050705" />
                      )}
                    </View>
                    <Text style={styles.rememberMeText}>Remember me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        'Password Recovery',
                        'Password recovery instructions will be transmitted to your registered email.',
                        [{ text: 'Acknowledge' }]
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Primary Button */}
                <CustomButton
                  title="ENTER THE GAME →"
                  onPress={handleLoginSubmit}
                  loading={isLoading}
                  iconName="arrow-forward"
                />

                {/* Quick Demo Credentials Quick-Pick for smooth pair-programming verification */}
                <View style={styles.demoSection}>
                  <View style={styles.demoHeaderRow}>
                    <Ionicons name="flash" size={13} color={colors.orangeAccent} />
                    <Text style={styles.demoSectionTitle}>
                      QUICK VERIFICATION ACCOUNTS:
                    </Text>
                  </View>
                  <View style={styles.demoBadgesRow}>
                    <TouchableOpacity
                      style={styles.demoBadge}
                      onPress={() =>
                        handleQuickDemoFill('gamer@gmail.com', 'SoloGamer2026!')
                      }
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="game-controller-outline"
                        size={13}
                        color={colors.primary}
                      />
                      <Text style={styles.demoBadgeText}>gamer@gmail.com</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.demoBadge}
                      onPress={() =>
                        handleQuickDemoFill('player1@pixo.gg', 'SoloGamer2026!')
                      }
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="shield-outline"
                        size={13}
                        color={colors.primary}
                      />
                      <Text style={styles.demoBadgeText}>player1@pixo.gg</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Footer Switch to Register */}
                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>New to PIXO? </Text>
                  <TouchableOpacity
                    onPress={() => handleSwitchMode('register')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.footerLink}>Build Your Legend</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ========================================================= */}
            {/* VIEW 2: REGISTER (NEW PLAYER REGISTRATION - STEP 1)       */}
            {/* ========================================================= */}
            {authMode === 'register' && registerStep === 'form' && (
              <View style={styles.formContainer}>
                {/* Form Heading Section */}
                <View style={styles.formHeaderSection}>
                  <View style={styles.formMiniBadge}>
                    <Text style={styles.formMiniBadgeText}>
                      NEW PLAYER REGISTRATION
                    </Text>
                  </View>
                  <Text style={styles.formHeading}>Build Your Legend.</Text>
                  <Text style={styles.formSubtitle}>
                    Every legend starts somewhere. Create your identity.
                  </Text>
                </View>

                {/* Player Name / Gamer Tag */}
                <CustomInput
                  label="Player name / Gamer tag"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="Enter your gamer tag (e.g. CyberKnight)"
                  iconName="person-outline"
                  autoCapitalize="words"
                  error={errors.name}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                />

                {/* Real Gmail / Email */}
                <CustomInput
                  inputRef={emailInputRef}
                  label="Email address (Gmail supported)"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="Enter your email address"
                  iconName="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  error={errors.email}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />

                {/* Password Field */}
                <CustomInput
                  inputRef={passwordInputRef}
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: null }));
                  }}
                  placeholder="Create a strong password (min. 6 chars)"
                  iconName="lock-closed-outline"
                  isPassword
                  error={errors.password}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                />

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.strengthRow}>
                    <Text style={styles.strengthLabel}>Security Strength:</Text>
                    <View style={styles.strengthBars}>
                      <View
                        style={[
                          styles.strengthBar,
                          passwordStrength && styles.strengthBarActiveWeak,
                        ]}
                      />
                      <View
                        style={[
                          styles.strengthBar,
                          (passwordStrength === 'medium' ||
                            passwordStrength === 'strong') &&
                            styles.strengthBarActiveMedium,
                        ]}
                      />
                      <View
                        style={[
                          styles.strengthBar,
                          passwordStrength === 'strong' &&
                            styles.strengthBarActiveStrong,
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.strengthText,
                        passwordStrength === 'strong'
                          ? styles.textGreen
                          : passwordStrength === 'medium'
                          ? styles.textYellow
                          : styles.textRed,
                      ]}
                    >
                      {passwordStrength ? passwordStrength.toUpperCase() : ''}
                    </Text>
                  </View>
                )}

                {/* Confirm Password */}
                <CustomInput
                  inputRef={confirmPasswordInputRef}
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword)
                      setErrors((prev) => ({ ...prev, confirmPassword: null }));
                  }}
                  placeholder="Confirm your password"
                  iconName="shield-checkmark-outline"
                  isPassword
                  error={errors.confirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleRegisterProceedToOtp}
                />

                {/* Primary Button */}
                <CustomButton
                  title="REQUEST OTP & JOIN PIXO →"
                  onPress={handleRegisterProceedToOtp}
                  loading={isLoading}
                  iconName="arrow-forward"
                />

                <Text style={styles.registrationSubNotice}>
                  Your account. Your adventure.
                </Text>

                {/* Switch to Sign In */}
                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => handleSwitchMode('login')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.footerLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ========================================================= */}
            {/* VIEW 3: OTP VERIFICATION (STEP 2 OF REGISTRATION)         */}
            {/* ========================================================= */}
            {authMode === 'register' && registerStep === 'otp' && (
              <View style={styles.formContainer}>
                {/* Form Heading Section */}
                <View style={styles.formHeaderSection}>
                  <View style={styles.formMiniBadge}>
                    <Text style={styles.formMiniBadgeText}>
                      SECURITY VERIFICATION
                    </Text>
                  </View>
                  <Text style={styles.formHeading}>Verify Your Identity.</Text>
                  <Text style={styles.formSubtitle}>
                    Enter the verification code sent to your email.
                  </Text>
                </View>

                {/* Email Destination Info Card */}
                <View style={styles.otpEmailBanner}>
                  <View style={styles.otpIconWrap}>
                    <Ionicons name="mail" size={17} color={colors.primary} />
                  </View>
                  <View style={styles.otpEmailTextWrapper}>
                    <Text style={styles.otpEmailTitle}>Code Dispatched To</Text>
                    <Text style={styles.otpEmailValue} numberOfLines={1}>
                      {email}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editEmailBtn}
                    onPress={() => setRegisterStep('form')}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="pencil" size={13} color={colors.primary} />
                    <Text style={styles.editEmailBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {/* Segmented OTP Input */}
                <OtpInput
                  code={otpCode}
                  setCode={(val) => {
                    setOtpCode(val);
                    if (errors.otp) setErrors((prev) => ({ ...prev, otp: null }));
                  }}
                  length={6}
                  error={errors.otp}
                  onComplete={(code) => handleVerifyOtpAndRegister(code)}
                />

                {/* Countdown / Resend Action */}
                <View style={styles.resendRow}>
                  {canResend ? (
                    <TouchableOpacity
                      onPress={handleResendOtp}
                      style={styles.resendButton}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={15}
                        color={colors.primary}
                      />
                      <Text style={styles.resendButtonText}>
                        Resend Verification Code
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.countdownBadge}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.countdownText}>
                        Resend code in{' '}
                        <Text style={styles.countdownValue}>{resendCountdown}s</Text>
                      </Text>
                    </View>
                  )}
                </View>

                {/* Primary Button */}
                <CustomButton
                  title="VERIFY & ACTIVATE ACCOUNT →"
                  onPress={() => handleVerifyOtpAndRegister()}
                  loading={isLoading}
                  iconName="shield-checkmark"
                />

                {/* Back to Edit Button */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setRegisterStep('form')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="arrow-back"
                    size={15}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.backButtonText}>Back to registration details</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <SuccessModal
        visible={isSuccessModalVisible}
        name={successUserData.name}
        email={successUserData.email}
        isRegistration={authMode === 'register'}
        onClose={handleModalClose}
      />
    </GlowingBackground>
  );
};

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 460;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 12 : 16,
    paddingVertical: isMobile ? 18 : 28,
  },
  glassCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'rgba(15, 22, 16, 0.84)',
    borderRadius: isMobile ? 20 : 26,
    paddingHorizontal: isMobile ? 16 : 26,
    paddingVertical: isMobile ? 22 : 28,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.18)',
    position: 'relative',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          boxShadow:
            '0 24px 64px rgba(0, 0, 0, 0.85), 0 0 35px rgba(57, 255, 20, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.6,
          shadowRadius: 24,
          elevation: 10,
        }),
  },
  cardOrangeEdgeHighlight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '45%',
    height: 2,
    backgroundColor: 'rgba(255, 106, 0, 0.65)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 10px #FF6A00',
        }
      : {}),
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#090E0A',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    ...(Platform.OS === 'web'
      ? {
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }
      : {}),
  },
  tabButtonActive: {
    backgroundColor: 'rgba(57, 255, 20, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.38)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 12px rgba(57, 255, 20, 0.18)',
        }
      : {}),
  },
  tabButtonHovered: {
    backgroundColor: 'rgba(255, 106, 0, 0.08)',
    borderColor: 'rgba(255, 106, 0, 0.3)',
  },
  tabButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tabButtonTextActive: {
    color: colors.primary,
  },
  formContainer: {
    width: '100%',
  },
  formHeaderSection: {
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  formMiniBadge: {
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  formMiniBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  formHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.4,
    marginBottom: 4,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', 'Sora', sans-serif",
        }
      : {}),
  },
  formSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Inter', sans-serif",
        }
      : {}),
  },
  generalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.12)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  generalErrorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  loginMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: -2,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
        }
      : {}),
  },
  customCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.35)',
    backgroundColor: '#0B100C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  customCheckboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberMeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  forgotPasswordText: {
    color: colors.orangeWarm,
    fontSize: 12,
    fontWeight: '600',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          transition: 'color 0.2s ease',
        }
      : {}),
  },
  demoSection: {
    backgroundColor: 'rgba(9, 14, 10, 0.75)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.15)',
    marginTop: 6,
    marginBottom: spacing.sm,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  demoSectionTitle: {
    color: colors.orangeWarm,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 5,
  },
  demoBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    borderRadius: borderRadius.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 5,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
        }
      : {}),
  },
  demoBadgeText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  strengthLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginRight: spacing.xs,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    marginRight: spacing.xs,
  },
  strengthBar: {
    width: 22,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  strengthBarActiveWeak: {
    backgroundColor: colors.error,
  },
  strengthBarActiveMedium: {
    backgroundColor: colors.warning,
  },
  strengthBarActiveStrong: {
    backgroundColor: colors.emerald,
  },
  strengthText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textGreen: {
    color: colors.emerald,
  },
  textYellow: {
    color: colors.warning,
  },
  textRed: {
    color: colors.error,
  },
  registrationSubNotice: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    marginBottom: spacing.xs,
    fontStyle: 'italic',
  },
  otpEmailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 16, 12, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.22)',
    borderRadius: 12,
    padding: 10,
    marginBottom: spacing.sm,
  },
  otpIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpEmailTextWrapper: {
    flex: 1,
    marginLeft: 10,
  },
  otpEmailTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  otpEmailValue: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  editEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
        }
      : {}),
  },
  editEmailBtnText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 6,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
        }
      : {}),
  },
  resendButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  countdownText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  countdownValue: {
    color: colors.primary,
    fontWeight: '800',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: 6,
    marginTop: 4,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
        }
      : {}),
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(57, 255, 20, 0.12)',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          textShadow: '0 0 8px rgba(57, 255, 20, 0.4)',
        }
      : {}),
  },
});

export default LoginScreen;
