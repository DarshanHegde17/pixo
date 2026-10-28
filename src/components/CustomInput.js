import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';

/**
 * Premium Gaming Input Field for SOLOPLAY V2
 * - Dark charcoal fill (#0B100C)
 * - Thin muted border (rgba(57, 255, 20, 0.18))
 * - Neon green active glow on focus
 * - Non-overlapping high-contrast labels
 * - Soft gray icon turning neon green on focus
 * - Accessible error & success states
 * - Password visibility toggle with smooth feedback
 */
export const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  iconName,
  isPassword = false,
  error = null,
  isValid = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  textContentType,
  autoComplete,
  returnKeyType = 'next',
  onSubmitEditing,
  inputRef,
  helperText,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasError = !!error;

  return (
    <View style={styles.wrapper}>
      {/* Label with technical indicator */}
      {label && (
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.label,
              isFocused && styles.labelFocused,
              hasError && styles.labelError,
            ]}
          >
            {label}
          </Text>
          {isValid && !hasError && (
            <Ionicons name="checkmark-circle" size={14} color={colors.emerald} />
          )}
        </View>
      )}

      {/* Input container */}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          isValid && !hasError && styles.inputContainerValid,
        ]}
      >
        {/* Left Icon */}
        {iconName && (
          <View style={styles.iconWrapper}>
            <Ionicons
              name={iconName}
              size={19}
              color={
                hasError
                  ? colors.error
                  : isFocused
                  ? colors.primary
                  : colors.textSecondary
              }
            />
          </View>
        )}

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textPlaceholder}
          secureTextEntry={isPassword && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          textContentType={textContentType}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={colors.primary}
          {...rest}
        />

        {/* Password visibility toggle */}
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
            accessibilityRole="button"
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
              size={19}
              color={
                isFocused
                  ? colors.primary
                  : isPasswordVisible
                  ? colors.textPrimary
                  : colors.textMuted
              }
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Helper text if needed */}
      {!hasError && helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Inter', sans-serif",
        }
      : {}),
  },
  labelFocused: {
    color: colors.primary,
  },
  labelError: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B100C',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.18)',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
    ...(Platform.OS === 'web'
      ? {
          transition: 'border-color 0.22s ease, box-shadow 0.22s ease',
        }
      : {}),
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(11, 16, 12, 0.98)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 14px rgba(57, 255, 20, 0.28), inset 0 0 8px rgba(57, 255, 20, 0.05)',
        }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 4,
        }),
  },
  inputContainerError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(18, 12, 12, 0.95)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 12px rgba(255, 77, 77, 0.25)',
        }
      : {
          shadowColor: colors.error,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
        }),
  },
  inputContainerValid: {
    borderColor: 'rgba(0, 200, 83, 0.45)',
  },
  iconWrapper: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Inter', sans-serif",
          outlineStyle: 'none',
        }
      : {}),
  },
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingLeft: 2,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
    letterSpacing: 0.2,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    paddingLeft: 2,
  },
});

export default CustomInput;
