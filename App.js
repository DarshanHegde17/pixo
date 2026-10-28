import React from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { GlowingBackground } from './src/components/GlowingBackground';
import { colors } from './src/theme';

function AppContent() {
  const { isAuthenticated, isLoadingSession } = useAuth();

  // Loading Session Splash Screen
  if (isLoadingSession) {
    return (
      <GlowingBackground>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingLogoBadge}>
            <LinearGradient
              colors={['#39FF14', '#00C853']}
              style={styles.loadingLogoGradient}
            >
              <Ionicons name="shield-checkmark" size={38} color="#050705" />
            </LinearGradient>
          </View>
          <Text style={styles.loadingTitle}>
            PIX<Text style={styles.loadingTitleAccent}>O</Text>
          </Text>
          <Text style={styles.loadingSubtitle}>Restoring Player Session...</Text>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        </View>
      </GlowingBackground>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="light" backgroundColor={colors.background} />
      {isAuthenticated ? (
        <HomeScreen />
      ) : (
        <LoginScreen />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingLogoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    backgroundColor: 'rgba(57, 255, 20, 0.25)',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
  },
  loadingLogoGradient: {
    flex: 1,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 4,
    ...(Platform.OS === 'web'
      ? {
          fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
          textShadow: '0 0 16px rgba(255, 255, 255, 0.4)',
        }
      : {}),
  },
  loadingTitleAccent: {
    color: colors.primary,
    ...(Platform.OS === 'web'
      ? {
          textShadow: '0 0 20px rgba(57, 255, 20, 0.85)',
        }
      : {}),
  },
  loadingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    letterSpacing: 0.5,
  },
});
