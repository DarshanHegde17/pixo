import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

const { width: screenWidth } = Dimensions.get('window');
const isSmallMobile = screenWidth < 380;

/**
 * Premium Segmented OTP Input for SOLOPLAY V2/V3
 * - Responsive 6-digit numeric boxes scaling across all Android and iOS screen sizes
 * - Dark charcoal fill (#0B100C)
 * - Neon green active glow (#39FF14)
 * - Smooth paste handling
 */
export const OtpInput = ({
  code = '',
  setCode,
  length = 6,
  error = null,
  disabled = false,
  autoFocus = true,
  onComplete,
}) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Split code into array of single digits
  const codeDigits = Array(length)
    .fill('')
    .map((_, index) => code[index] || '');

  // Handle hidden text input change with paste support
  const handleChangeText = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    setCode(cleaned);

    if (cleaned.length === length && onComplete) {
      onComplete(cleaned);
    }
  };

  const handleContainerPress = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  return (
    <View style={styles.wrapper}>
      {/* Hidden native input capturing keyboard and paste events */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={handleChangeText}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.hiddenInput}
        caretHidden
      />

      {/* Segmented Digit Boxes */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleContainerPress}
        style={styles.boxesContainer}
      >
        {codeDigits.map((digit, index) => {
          const isCurrentActive =
            isFocused && index === Math.min(code.length, length - 1);
          const isFilled = !!digit;
          const hasDigitError = !!error;

          return (
            <View
              key={`otp-box-${index}`}
              style={[
                styles.digitBox,
                isFilled && styles.digitBoxFilled,
                isCurrentActive && styles.digitBoxActive,
                hasDigitError && styles.digitBoxError,
              ]}
            >
              <Text
                style={[
                  styles.digitText,
                  isFilled && styles.digitTextFilled,
                  hasDigitError && styles.digitTextError,
                ]}
              >
                {digit}
              </Text>

              {/* Neon Green Cursor when active and empty */}
              {isCurrentActive && !isFilled && <View style={styles.activeCursor} />}
            </View>
          );
        })}
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: 0,
    left: 0,
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    gap: isSmallMobile ? 4 : 6,
  },
  digitBox: {
    flex: 1,
    height: isSmallMobile ? 46 : 50,
    maxWidth: isSmallMobile ? 44 : 48,
    backgroundColor: '#0B100C',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.2)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...(Platform.OS === 'web'
      ? {
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }
      : {}),
  },
  digitBoxFilled: {
    borderColor: 'rgba(57, 255, 20, 0.65)',
    backgroundColor: 'rgba(57, 255, 20, 0.05)',
  },
  digitBoxActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(57, 255, 20, 0.09)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 14px rgba(57, 255, 20, 0.35)',
        }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 4,
        }),
  },
  digitBoxError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(255, 77, 77, 0.08)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 12px rgba(255, 77, 77, 0.3)',
        }
      : {}),
  },
  digitText: {
    fontSize: isSmallMobile ? 18 : 20,
    fontWeight: '800',
    color: colors.textSecondary,
    textAlign: 'center',
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', monospace",
        }
      : {}),
  },
  digitTextFilled: {
    color: colors.primary,
    ...(Platform.OS === 'web'
      ? {
          textShadow: '0 0 8px rgba(57, 255, 20, 0.6)',
        }
      : {}),
  },
  digitTextError: {
    color: colors.error,
  },
  activeCursor: {
    position: 'absolute',
    bottom: 6,
    width: 14,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 2,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 0 6px #39FF14',
        }
      : {}),
  },
  errorContainer: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default OtpInput;
