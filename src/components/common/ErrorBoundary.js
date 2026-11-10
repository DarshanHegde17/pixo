import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[PIXO ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined' && window.location) {
      window.location.hash = '#home';
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="warning" size={36} color="#EF4444" />
            </View>
            <Text style={styles.title}>APPLICATION RECOVERY</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={this.handleReload}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color="#000" style={{ marginRight: 6 }} />
              <Text style={styles.btnText}>RELOAD PIXO DASHBOARD</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050805',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0c140e',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  message: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#39FF14',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  btnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

