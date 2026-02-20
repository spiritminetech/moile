import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  message = 'Loading...' 
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={ConstructionTheme.colors.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ConstructionTheme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: ConstructionTheme.colors.surface,
    padding: ConstructionTheme.spacing.xl,
    borderRadius: ConstructionTheme.borderRadius.lg,
    alignItems: 'center',
    minWidth: 160,
    ...ConstructionTheme.shadows.large,
  },
  message: {
    marginTop: ConstructionTheme.spacing.md,
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    textAlign: 'center',
  },
});

export default LoadingOverlay;