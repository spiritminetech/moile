// Construction-Optimized Card Component
// Requirements: 12.1, 12.2, 12.3

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'success' | 'warning' | 'error';

interface ConstructionCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: CardVariant;
  style?: ViewStyle | ViewStyle[];
  titleStyle?: TextStyle;
  contentStyle?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

const ConstructionCard: React.FC<ConstructionCardProps> = ({
  children,
  title,
  subtitle,
  variant = 'default',
  style,
  titleStyle,
  contentStyle,
  padding = 'medium',
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.baseCard,
      backgroundColor: ConstructionTheme.colors.surface,
      borderRadius: ConstructionTheme.borderRadius.md,
      minHeight: ConstructionTheme.dimensions.cardMinHeight,
    };

    // Apply variant-specific styles
    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          ...ConstructionTheme.shadows.medium,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 2,
          borderColor: ConstructionTheme.colors.neutral,
          ...ConstructionTheme.shadows.small,
        };
      case 'success':
        return {
          ...baseStyle,
          borderLeftWidth: 4,
          borderLeftColor: ConstructionTheme.colors.success,
          backgroundColor: '#E8F5E8',
          ...ConstructionTheme.shadows.small,
        };
      case 'warning':
        return {
          ...baseStyle,
          borderLeftWidth: 4,
          borderLeftColor: ConstructionTheme.colors.warning,
          backgroundColor: '#FFF8E1',
          ...ConstructionTheme.shadows.small,
        };
      case 'error':
        return {
          ...baseStyle,
          borderLeftWidth: 4,
          borderLeftColor: ConstructionTheme.colors.error,
          backgroundColor: '#FFEBEE',
          ...ConstructionTheme.shadows.small,
        };
      default:
        return {
          ...baseStyle,
          ...ConstructionTheme.shadows.small,
        };
    }
  };

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return {};
      case 'small':
        return { padding: ConstructionTheme.spacing.sm };
      case 'medium':
        return { padding: ConstructionTheme.spacing.md };
      case 'large':
        return { padding: ConstructionTheme.spacing.lg };
      default:
        return { padding: ConstructionTheme.spacing.md };
    }
  };

  const getTitleColor = (): string => {
    switch (variant) {
      case 'success':
        return ConstructionTheme.colors.success;
      case 'warning':
        return '#E65100'; // Darker orange for better contrast
      case 'error':
        return ConstructionTheme.colors.error;
      default:
        return ConstructionTheme.colors.onSurface;
    }
  };

  return (
    <View style={[getCardStyle(), style]}>
      <View style={[getPaddingStyle(), contentStyle]}>
        {(title || subtitle) && (
          <View style={styles.header}>
            {title && (
              <Text 
                style={[
                  styles.title, 
                  { color: getTitleColor() },
                  titleStyle
                ]}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </View>
        )}
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  baseCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  header: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  title: {
    ...ConstructionTheme.typography.headlineSmall,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  subtitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
});

export default ConstructionCard;