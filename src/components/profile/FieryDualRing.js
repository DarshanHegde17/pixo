import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * FieryDualRing - Crystalline Neon Green (Left) + Blazing Orange Flame (Right)
 * Accurately replicates the dual elemental ring visual from the reference.
 */
export const FieryDualRing = ({
  size = 84,
  centerValue = '0',
  centerLabel = 'DAYS',
  iconName = 'flame',
  iconColor = '#FF8A00',
  subText = null,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.9,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.55,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim, glowAnim]);

  const outerRadius = size / 2;
  const innerSize = size * 0.7;
  const strokeWidth = size * 0.12;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Dual Animated Glow Halo Behind */}
      <Animated.View
        style={[
          styles.glowBackdrop,
          {
            width: size * 1.15,
            height: size * 1.15,
            borderRadius: (size * 1.15) / 2,
            opacity: glowAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.glowHalfLeft} />
        <View style={styles.glowHalfRight} />
      </Animated.View>

      {/* Ring Body Container with Top and Bottom Gaps */}
      <View style={[styles.ringWrapper, { width: size, height: size }]}>
        {/* LEFT HALF: Crystalline Neon Green Arc */}
        <View style={[styles.halfContainer, styles.leftHalf, { width: outerRadius, height: size }]}>
          <View
            style={[
              styles.arcCircle,
              {
                width: size,
                height: size,
                borderRadius: outerRadius,
                borderWidth: strokeWidth,
                borderColor: 'transparent',
                borderLeftColor: '#39FF14',
                borderTopColor: '#00E5FF',
                borderBottomColor: '#39FF14',
                transform: [{ rotate: '45deg' }],
                ...(Platform.OS === 'web'
                  ? {
                      boxShadow: '-4px 0 16px rgba(57, 255, 20, 0.7), inset -2px 0 8px rgba(0, 229, 255, 0.5)',
                    }
                  : {}),
              },
            ]}
          />
        </View>

        {/* RIGHT HALF: Intense Blazing Orange Fire Arc */}
        <View
          style={[
            styles.halfContainer,
            styles.rightHalf,
            { width: outerRadius, height: size, left: outerRadius },
          ]}
        >
          <View
            style={[
              styles.arcCircle,
              {
                width: size,
                height: size,
                borderRadius: outerRadius,
                borderWidth: strokeWidth,
                borderColor: 'transparent',
                borderRightColor: '#FF8A00',
                borderTopColor: '#FF3D00',
                borderBottomColor: '#FF8A00',
                left: -outerRadius,
                transform: [{ rotate: '-45deg' }],
                ...(Platform.OS === 'web'
                  ? {
                      boxShadow: '4px 0 16px rgba(255, 138, 0, 0.7), inset 2px 0 8px rgba(255, 61, 0, 0.5)',
                    }
                  : {}),
              },
            ]}
          />
        </View>

        {/* Top Notch Accent Gap (12 o'clock) */}
        <View style={[styles.gapNotch, styles.topNotch, { width: strokeWidth * 1.5, height: strokeWidth * 0.7 }]} />

        {/* Bottom Notch Accent Gap (6 o'clock) */}
        <View style={[styles.gapNotch, styles.bottomNotch, { width: strokeWidth * 1.5, height: strokeWidth * 0.7 }]} />

        {/* Deep Black Center Cavity */}
        <View
          style={[
            styles.centerCavity,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          {iconName ? (
            <Ionicons name={iconName} size={Math.round(size * 0.26)} color={iconColor} style={styles.centerIcon} />
          ) : null}
          <Text style={[styles.centerValue, { fontSize: Math.round(size * 0.22) }]}>
            {centerValue}
          </Text>
          {centerLabel ? (
            <Text style={[styles.centerLabel, { fontSize: Math.max(7, Math.round(size * 0.095)) }]}>
              {centerLabel}
            </Text>
          ) : null}
          {subText ? <Text style={styles.centerSubText}>{subText}</Text> : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowBackdrop: {
    position: 'absolute',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  glowHalfLeft: {
    flex: 1,
    backgroundColor: 'rgba(57, 255, 20, 0.22)',
  },
  glowHalfRight: {
    flex: 1,
    backgroundColor: 'rgba(255, 138, 0, 0.22)',
  },
  ringWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halfContainer: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  leftHalf: {
    left: 0,
  },
  rightHalf: {
    overflow: 'hidden',
  },
  arcCircle: {
    position: 'absolute',
    top: 0,
  },
  gapNotch: {
    position: 'absolute',
    backgroundColor: '#0A0F0B',
    zIndex: 5,
    borderRadius: 2,
  },
  topNotch: {
    top: 0,
  },
  bottomNotch: {
    bottom: 0,
  },
  centerCavity: {
    backgroundColor: '#070C08',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  centerIcon: {
    marginBottom: -2,
  },
  centerValue: {
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: undefined,
    letterSpacing: 0.3,
  },
  centerLabel: {
    fontWeight: '900',
    color: '#FF8A00',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  centerSubText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#39FF14',
    letterSpacing: 0.5,
  },
});

