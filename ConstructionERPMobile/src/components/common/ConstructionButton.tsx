// Construction-Optimized Button Component
// Requirements: 12.1, 12.2, 12.3

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'danger' | 'outline' | 'outlined';
type ButtonSize = 'small' | 'medium' | 'large' | 'extraLarge';

interface ConstructionButtonProps {
  title: string;
  subtitle?: string; // NEW: Explain what the button does
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string; // Emoji icon for simplicity
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  subtitleStyle?: TextStyle; // NEW: Custom subtitle styling
}

const ConstructionButton: React.FC<ConstructionButtonProps> = ({
  title,
  subtitle, // NEW
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
  subtitleStyle, // NEW
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.baseButton,
      height: subtitle ? getButtonHeight() + 20 : getButtonHeight(), // Add height for subtitle
      backgroundColor: getBackgroundColor(),
      borderRadius: ConstructionTheme.borderRadius.md,
      ...ConstructionTheme.shadows.medium,
    };

    // Add border for outline variant
    if (variant === 'outline' || variant === 'outlined') {
      baseStyle.borderWidth = 2;
      baseStyle.borderColor = ConstructionTheme.colors.primary;
      baseStyle.shadowOpacity = 0;
      baseStyle.elevation = 0;
    }

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    if (disabled || loading) {
      baseStyle.backgroundColor = ConstructionTheme.colors.disabled;
      baseStyle.shadowOpacity = 0;
      baseStyle.elevation = 0;
      if (variant === 'outline' || variant === 'outlined') {
        baseStyle.borderColor = ConstructionTheme.colors.disabled;
      }
    }

    return baseStyle;
  };

  const getButtonHeight = (): number => {
    switch (size) {
      case 'small':
        return ConstructionTheme.dimensions.buttonSmall;
      case 'medium':
        return ConstructionTheme.dimensions.buttonMedium;
      case 'large':
        return ConstructionTheme.dimensions.buttonLarge;
      case 'extraLarge':
        return ConstructionTheme.dimensions.buttonExtraLarge;
      default:
        return ConstructionTheme.dimensions.buttonMedium;
    }
  };

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'primary':
        return ConstructionTheme.colors.primary;
      case 'secondary':
        return ConstructionTheme.colors.secondary;
      case 'success':
        return ConstructionTheme.colors.success;
      case 'warning':
        return ConstructionTheme.colors.warning;
      case 'error':
        return ConstructionTheme.colors.error;
      case 'danger':
        return ConstructionTheme.colors.danger;
      case 'neutral':
        return ConstructionTheme.colors.neutral;
      case 'outline':
        return 'transparent';
      default:
        return ConstructionTheme.colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled || loading) {
      return ConstructionTheme.colors.onDisabled;
    }
    if (variant === 'outline' || variant === 'outlined') {
      // Use onSurface for better visibility on light backgrounds
      return ConstructionTheme.colors.onSurface;
    }
    return ConstructionTheme.colors.onPrimary;
  };

  const getTextStyle = (): TextStyle => {
    let typography;
    switch (size) {
      case 'small':
        typography = ConstructionTheme.typography.buttonSmall;
        break;
      case 'medium':
        typography = ConstructionTheme.typography.buttonMedium;
        break;
      case 'large':
      case 'extraLarge':
        typography = ConstructionTheme.typography.buttonLarge;
        break;
      default:
        typography = ConstructionTheme.typography.buttonMedium;
    }

    return {
      ...typography,
      color: getTextColor(),
      textAlign: 'center',
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={() => {
        console.log(`🔘 ConstructionButton pressed: "${title}"`);
        onPress();
      }}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={getTextColor()} 
            style={styles.loader}
          />
        ) : (
          <>
            {icon && (
              <Text style={[styles.icon, { color: getTextColor() }]}>
                {icon}
              </Text>
            )}
            <View style={subtitle ? styles.textContainer : undefined}>
              <Text style={[getTextStyle(), textStyle]}>
                {title}
              </Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: getTextColor() }, subtitleStyle]}>
                  {subtitle}
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    minWidth: ConstructionTheme.spacing.touchTarget * 2,
    minHeight: ConstructionTheme.spacing.largeTouch, // ENHANCED: Minimum 60px for gloves
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  icon: {
    fontSize: ConstructionTheme.dimensions.iconLarge, // ENHANCED: Larger icons
    marginRight: ConstructionTheme.spacing.xs, // 4px - Minimal spacing for tight visual grouping
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
    opacity: 0.9,
  },
  loader: {
    marginRight: ConstructionTheme.spacing.sm,
  },
});

export default ConstructionButton;