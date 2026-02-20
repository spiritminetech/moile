// Toast Component - Non-blocking notification
// Simple toast notification for success/error messages

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface ToastProps {
  visible: boolean;
  message: string;
  duration?: number;
  onDismiss: () => void;
  type?: 'success' | 'error' | 'info' | 'warning';
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  duration = 2000,
  onDismiss,
  type = 'success',
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        // Animate out
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDismiss();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, opacity, translateY, onDismiss]);

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return ConstructionTheme.colors.success;
      case 'error':
        return ConstructionTheme.colors.error;
      case 'info':
        return ConstructionTheme.colors.info;
      case 'warning':
        return ConstructionTheme.colors.warning;
      default:
        return ConstructionTheme.colors.success;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      default:
        return '✅';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <Text style={styles.icon}>{getIcon()}</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 12,
    ...ConstructionTheme.shadows.large,
    zIndex: 9999,
    elevation: 10,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  message: {
    ...ConstructionTheme.typography.bodyLarge,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '600',
  },
});

export default Toast;
