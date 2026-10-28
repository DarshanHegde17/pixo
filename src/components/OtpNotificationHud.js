import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';

/**
 * Cinematic Gmail OTP Notification HUD
 * Pops down with dark glass styling, neon-green code display,
 * and high-contrast Auto-Fill action.
 */
export const OtpNotificationHud = ({
  visible,
  code,
  email,
  onAutoFill,
  onDismiss,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      setCopied(false);
    }
  }, [visible, code]);

  if (!visible || !code) return null;

  const handleFill = () => {
    setCopied(true);
    if (onAutoFill) {
      onAutoFill(code);
    }
  };

  return (
    <View style={styles.hudContainer}>
      <View style={styles.borderGlow}>
        <View style={styles.innerContent}>
          {/* Top Row: Gmail status & Close */}
          <View style={styles.headerRow}>
            <View style={styles.badgeRow}>
              <View style={styles.pulseDot} />
              <Ionicons name="mail" size={14} color="#EA4335" style={{ marginRight: 5 }} />
              <Text style={styles.sourceText}>GMAIL OTP DELIVERY • SECURE</Text>
            </View>

            <TouchableOpacity
              onPress={onDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body: Email & message */}
          <Text style={styles.titleText}>PIXO Verification Code</Text>
          <Text style={styles.bodyText}>
            Delivered to <Text style={styles.emailText}>{email}</Text>
          </Text>

          {/* OTP Code Display Box */}
          <View style={styles.codeRow}>
            <View style={styles.codeDisplayBox}>
              <Text style={styles.codeValue}>{code}</Text>
            </View>

            <TouchableOpacity
              style={[styles.autoFillBtn, copied && styles.autoFillBtnCopied]}
              onPress={handleFill}
              activeOpacity={0.8}
            >
              <Ionicons
                name={copied ? 'checkmark-circle' : 'flash'}
                size={15}
                color={copied ? '#FFFFFF' : '#050705'}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.autoFillText, copied && styles.autoFillTextCopied]}>
                {copied ? 'FILLED' : 'AUTO-FILL'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hudContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? {
          animation: 'panelEntrance 0.35s ease-out forwards',
        }
      : {}),
  },
  borderGlow: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
    padding: 1.5,
    backgroundColor: 'rgba(57, 255, 20, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.5)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(57, 255, 20, 0.25)',
        }
      : {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: 12,
        }),
  },
  innerContent: {
    backgroundColor: 'rgba(11, 16, 12, 0.96)',
    borderRadius: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#39FF14',
    marginRight: 6,
  },
  sourceText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 2,
  },
  titleText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  emailText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  codeDisplayBox: {
    backgroundColor: 'rgba(15, 22, 16, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.4)',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  codeValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Space Grotesk', monospace",
          textShadow: '0 0 10px rgba(57, 255, 20, 0.5)',
        }
      : {}),
  },
  autoFillBtn: {
    backgroundColor: '#39FF14',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.8)',
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          boxShadow: '0 0 12px rgba(57, 255, 20, 0.35)',
        }
      : {}),
  },
  autoFillBtnCopied: {
    backgroundColor: colors.emerald,
    borderColor: colors.emerald,
  },
  autoFillText: {
    color: '#050705',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  autoFillTextCopied: {
    color: '#FFFFFF',
  },
});

export default OtpNotificationHud;
