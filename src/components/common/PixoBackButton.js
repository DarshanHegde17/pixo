import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationService } from '../../services/navigationService';
import { colors } from '../../theme';

/**
 * PixoBackButton — Universal PIXO Visible Back Arrow
 * 
 * Master Prompt Section 2 Requirements:
 * - Uses left-arrow icon.
 * - Black and neon-green PIXO cyberpunk theme.
 * - Consistent positioning & mobile-friendly touch target (min 44x44).
 * - Subtle hover and click feedback.
 * - Accessible button labels.
 * - Dispatches through centralized NavigationService.goBack().
 */
export const PixoBackButton = ({
  onPress,
  label = null,
  variant = 'pill', // 'pill' | 'circle' | 'minimal'
  size = 20,
  color = '#39FF14',
  style,
  accessibilityLabel = 'Go back to previous screen',
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      NavigationService.goBack();
    }
  };

  if (variant === 'circle') {
    return (
      <TouchableOpacity
        style={[styles.circleBtn, style]}
        onPress={handlePress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Ionicons name="arrow-back" size={size} color={color} />
      </TouchableOpacity>
    );
  }

  if (variant === 'minimal') {
    return (
      <TouchableOpacity
        style={[styles.minimalBtn, style]}
        onPress={handlePress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Ionicons name="arrow-back" size={size} color={color} />
        {label ? <Text style={[styles.btnLabel, { color }]}>{label}</Text> : null}
      </TouchableOpacity>
    );
  }

  // Default 'pill' variant
  return (
    <TouchableOpacity
      style={[styles.pillBtn, style]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="arrow-back" size={size} color={color} style={label ? { marginRight: 6 } : {}} />
      {label ? <Text style={[styles.btnLabel, { color }]}>{label}</Text> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 19, 11, 0.92)',
    borderWidth: 1.4,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 40,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 0 10px rgba(57, 255, 20, 0.18)',
          transition: 'all 0.18s ease',
        }
      : {}),
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 19, 11, 0.92)',
    borderWidth: 1.4,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 0 12px rgba(57, 255, 20, 0.22)',
          transition: 'transform 0.15s ease',
        }
      : {}),
  },
  minimalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 40,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  btnLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});

export default PixoBackButton;

