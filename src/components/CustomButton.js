import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';

/**
 * Premium Gaming Action Button for SOLOPLAY V2
 * - Neon-green background (#39FF14) with dark high-contrast text (#050705)
 * - Rounded corners ~12px
 * - Subtle green shadow & green-to-orange edge illumination on hover
 * - Interactive arrow / icon motion
 * - High-contrast loading state
 */
export const CustomButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  iconName,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost'
  style,
  textStyle,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={[
        styles.buttonBase,
        isPrimary && styles.primaryButton,
        variant === 'outline' && styles.outlineButton,
        variant === 'secondary' && styles.secondaryButton,
        isPrimary && isHovered && styles.primaryButtonHovered,
        disabled && styles.disabledButton,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator
            size="small"
            color={isPrimary ? '#050705' : colors.primary}
          />
          <Text
            style={[
              styles.loadingText,
              isPrimary ? styles.primaryLoadingText : styles.outlineLoadingText,
            ]}
          >
            AUTHENTICATING...
          </Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          <Text
            style={[
              styles.buttonText,
              isPrimary ? styles.primaryText : styles.outlineText,
              variant === 'secondary' && styles.secondaryText,
              textStyle,
            ]}
          >
            {title}
          </Text>

          {/* Icon or Animated Arrow Indicator */}
          {iconName ? (
            <Ionicons
              name={iconName}
              size={18}
              color={isPrimary ? '#050705' : colors.primary}
              style={[
                styles.buttonIcon,
                isHovered && styles.buttonIconHovered,
              ]}
            />
          ) : null}
        </View>
      )}

      {/* Subtle edge illumination highlight */}
      {isPrimary && (
        <View
          style={[
            styles.edgeHighlight,
            isHovered && styles.edgeHighlightHovered,
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          transition:
            'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.22s ease, filter 0.22s ease',
          cursor: 'pointer',
          userSelect: 'none',
        }
      : {}),
  },
  primaryButton: {
    backgroundColor: '#39FF14',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.6)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 18px rgba(57, 255, 20, 0.32)',
        }
      : {
          shadowColor: '#39FF14',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.45,
          shadowRadius: 10,
          elevation: 6,
        }),
  },
  primaryButtonHovered: {
    ...(Platform.OS === 'web'
      ? {
          transform: 'translateY(-2px)',
          borderColor: 'rgba(255, 106, 0, 0.85)',
          boxShadow:
            '0 6px 24px rgba(57, 255, 20, 0.45), 0 0 16px rgba(255, 106, 0, 0.35)',
        }
      : {}),
  },
  outlineButton: {
    backgroundColor: 'rgba(11, 16, 12, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  secondaryButton: {
    backgroundColor: 'rgba(15, 22, 16, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.3)',
  },
  disabledButton: {
    opacity: 0.55,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'not-allowed',
          boxShadow: 'none',
        }
      : {
          shadowOpacity: 0,
          elevation: 0,
        }),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 8,
  },
  primaryLoadingText: {
    color: '#050705',
  },
  outlineLoadingText: {
    color: colors.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', 'Sora', sans-serif",
        }
      : {}),
  },
  primaryText: {
    color: '#050705',
  },
  outlineText: {
    color: colors.primary,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  buttonIcon: {
    marginLeft: 8,
    ...(Platform.OS === 'web'
      ? {
          transition: 'transform 0.2s ease',
        }
      : {}),
  },
  buttonIconHovered: {
    ...(Platform.OS === 'web'
      ? {
          transform: 'translateX(4px)',
        }
      : {}),
  },
  edgeHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  edgeHighlightHovered: {
    backgroundColor: 'rgba(255, 159, 67, 0.8)',
  },
});

export default CustomButton;
