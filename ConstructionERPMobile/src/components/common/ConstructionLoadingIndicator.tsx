// Construction-Optimized Loading Indicator Component
// Requirements: 12.5

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

type LoadingSize = 'small' | 'medium' | 'large';
type LoadingVariant = 'default' | 'overlay' | 'inline' | 'card';

interface ConstructionLoadingIndicatorProps {
  visible?: boolean;
  message?: string;
  size?: LoadingSize;
  variant?: LoadingVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  color?: string;
  progress?: number; // 0-100 for progress indicator
  showProgress?: boolean;
}

const ConstructionLoadingIndicator: React.FC<ConstructionLoadingIndicatorProps> = ({
  visible = true,
  message = 'Loading...',
  size = 'medium',
  variant = 'default',
  style,
  textStyle,
  color = ConstructionTheme.colors.primary,
  progress,
  showProgress = false,
}) => {
  if (!visible) return null;

  const getIndicatorSize = () => {
    switch (size) {
      case 'small':
        return 'small' as const;
      case 'medium':
        return 'large' as const;
      case 'large':
        return 'large' as const;
      default:
        return 'large' as const;
    }
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      justifyContent: 'center',
      alignItems: 'center',
    };

    switch (variant) {
      case 'overlay':
        return {
          ...baseStyle,
          ...styles.overlay,
        };
      case 'inline':
        return {
          ...baseStyle,
          ...styles.inline,
        };
      case 'card':
        return {
          ...baseStyle,
          ...styles.card,
        };
      default:
        return {
          ...baseStyle,
          ...styles.default,
        };
    }
  };

  const renderProgressBar = () => {
    if (!showProgress || progress === undefined) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${Math.max(0, Math.min(100, progress))}%`,
                backgroundColor: color,
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, textStyle]}>
          {Math.round(progress)}%
        </Text>
      </View>
    );
  };

  const renderContent = () => (
    <>
      <ActivityIndicator 
        size={getIndicatorSize()} 
        color={color}
        style={styles.indicator}
      />
      {message && (
        <Text style={[styles.message, textStyle]}>
          {message}
        </Text>
      )}
      {renderProgressBar()}
    </>
  );

  return (
    <View style={[getContainerStyle(), style]}>
      {variant === 'overlay' ? (
        <View style={styles.overlayContent}>
          {renderContent()}
        </View>
      ) : (
        renderContent()
      )}
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
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: ConstructionTheme.colors.surface,
    padding: ConstructionTheme.spacing.xl,
    borderRadius: ConstructionTheme.borderRadius.lg,
    alignItems: 'center',
    minWidth: 160,
    ...ConstructionTheme.shadows.large,
  },
  default: {
    padding: ConstructionTheme.spacing.lg,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.md,
  },
  card: {
    backgroundColor: ConstructionTheme.colors.surface,
    padding: ConstructionTheme.spacing.xl,
    borderRadius: ConstructionTheme.borderRadius.md,
    margin: ConstructionTheme.spacing.md,
    ...ConstructionTheme.shadows.medium,
  },
  indicator: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  message: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    textAlign: 'center',
    marginTop: ConstructionTheme.spacing.sm,
  },
  progressContainer: {
    width: '100%',
    marginTop: ConstructionTheme.spacing.md,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
});

export default ConstructionLoadingIndicator;