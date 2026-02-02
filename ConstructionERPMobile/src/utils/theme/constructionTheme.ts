// Construction-Optimized UI Theme
// Requirements: 12.1, 12.2, 12.3, 12.5

import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Construction-optimized color palette with high contrast
export const ConstructionColors = {
  // Primary colors - high contrast for outdoor visibility
  primary: '#FF6B00', // High-visibility orange
  primaryDark: '#E55A00',
  primaryLight: '#FF8533',
  
  // Secondary colors
  secondary: '#2E7D32', // Safety green
  secondaryDark: '#1B5E20',
  secondaryLight: '#4CAF50',
  
  // Status colors - high contrast
  success: '#2E7D32', // Safety green
  warning: '#FF8F00', // High-visibility amber
  error: '#D32F2F', // Safety red
  info: '#1976D2', // High-contrast blue
  
  // Background colors - optimized for outdoor visibility
  background: '#FAFAFA', // Light gray for reduced glare
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  
  // Text colors - high contrast
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onBackground: '#212121', // High contrast black
  onSurface: '#212121',
  onSurfaceVariant: '#424242',
  
  // Text color variants (for backward compatibility)
  text: {
    primary: '#212121',
    secondary: '#424242',
    disabled: '#757575',
  },
  
  // Border colors
  border: '#E0E0E0',
  outline: '#BDBDBD',
  
  // Interactive states
  disabled: '#BDBDBD',
  onDisabled: '#757575',
  
  // Construction-specific colors
  safety: '#FF6B00', // High-visibility orange
  caution: '#FFC107', // Yellow for caution
  danger: '#F44336', // Red for danger
  neutral: '#607D8B', // Blue-gray for neutral states
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.6)', // Darker overlay for better visibility
  scrim: 'rgba(0, 0, 0, 0.32)',
};

// Construction-optimized spacing - larger for gloved hands
export const ConstructionSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Touch target spacing - minimum 44pt for accessibility
  touchTarget: 44,
  largeTouch: 56, // For primary actions
  extraLargeTouch: 72, // For critical actions
};

// Construction-optimized typography - larger sizes for outdoor visibility
export const ConstructionTypography = {
  // Font sizes (for backward compatibility)
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  
  // Font weights (for backward compatibility)
  weights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Display text
  displayLarge: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  displaySmall: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  
  // Headline text
  headlineLarge: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  headlineMedium: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  headlineSmall: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  
  // Body text - larger for outdoor readability
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  
  // Label text
  labelLarge: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
  
  // Button text - bold for visibility
  buttonLarge: {
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 22,
  },
  buttonMedium: {
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 20,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '700' as const,
    lineHeight: 18,
  },
};

// Construction-optimized component dimensions
export const ConstructionDimensions = {
  // Button heights - larger for gloved hands
  buttonSmall: 40,
  buttonMedium: 48,
  buttonLarge: 56,
  buttonExtraLarge: 64,
  
  // Input heights
  inputSmall: 44,
  inputMedium: 52,
  inputLarge: 60,
  
  // Card dimensions
  cardMinHeight: 120,
  cardPadding: 20,
  cardRadius: 12,
  
  // Icon sizes
  iconSmall: 20,
  iconMedium: 24,
  iconLarge: 32,
  iconExtraLarge: 48,
  
  // Screen dimensions
  screenWidth,
  screenHeight,
  
  // Safe areas
  headerHeight: 60,
  tabBarHeight: 70, // Taller for easier access
  bottomSafeArea: 34,
};

// Construction-optimized shadows and elevation
export const ConstructionShadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
};

// Construction-optimized border radius
export const ConstructionBorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
};

// Animation durations - slightly longer for better visibility
export const ConstructionAnimations = {
  fast: 150,
  normal: 250,
  slow: 350,
  
  // Easing curves
  easeOut: 'ease-out',
  easeIn: 'ease-in',
  easeInOut: 'ease-in-out',
};

// Construction theme object
export const ConstructionTheme = {
  colors: ConstructionColors,
  spacing: ConstructionSpacing,
  typography: ConstructionTypography,
  dimensions: ConstructionDimensions,
  shadows: ConstructionShadows,
  borderRadius: ConstructionBorderRadius,
  animations: ConstructionAnimations,
};

export default ConstructionTheme;