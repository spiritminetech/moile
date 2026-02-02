// Construction-Optimized Input Component
// Requirements: 12.1, 12.2, 12.3

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

type InputSize = 'small' | 'medium' | 'large';

interface ConstructionInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  size?: InputSize;
  disabled?: boolean;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  maxLength?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  showCharacterCount?: boolean;
  icon?: string; // Emoji icon
  onIconPress?: () => void;
  required?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
}

const ConstructionInput: React.FC<ConstructionInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  size = 'medium',
  disabled = false,
  error,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  secureTextEntry = false,
  maxLength,
  style,
  inputStyle,
  showCharacterCount = false,
  icon,
  onIconPress,
  required = false,
  autoCapitalize = 'sentences',
  autoCorrect = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getInputHeight = (): number => {
    if (multiline) {
      return Math.max(
        ConstructionTheme.dimensions.inputMedium,
        numberOfLines * 24 + ConstructionTheme.spacing.md * 2
      );
    }

    switch (size) {
      case 'small':
        return ConstructionTheme.dimensions.inputSmall;
      case 'medium':
        return ConstructionTheme.dimensions.inputMedium;
      case 'large':
        return ConstructionTheme.dimensions.inputLarge;
      default:
        return ConstructionTheme.dimensions.inputMedium;
    }
  };

  const getContainerStyle = (): ViewStyle => {
    return {
      ...styles.container,
      borderColor: error 
        ? ConstructionTheme.colors.error 
        : isFocused 
          ? ConstructionTheme.colors.primary 
          : ConstructionTheme.colors.neutral,
      borderWidth: error || isFocused ? 2 : 1,
      backgroundColor: disabled 
        ? ConstructionTheme.colors.disabled 
        : ConstructionTheme.colors.surface,
      height: getInputHeight(),
    };
  };

  const getInputStyle = (): TextStyle => {
    return {
      ...styles.input,
      ...ConstructionTheme.typography.bodyLarge,
      color: disabled 
        ? ConstructionTheme.colors.onDisabled 
        : ConstructionTheme.colors.onSurface,
      textAlignVertical: multiline ? 'top' : 'center',
    };
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={styles.label}>
          {label}{required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={getContainerStyle()}>
        <TextInput
          style={[getInputStyle(), inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={ConstructionTheme.colors.primary}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
        
        {icon && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={onIconPress}
            disabled={!onIconPress}
          >
            <Text style={styles.icon}>{icon}</Text>
          </TouchableOpacity>
        )}
      </View>

      {(error || (showCharacterCount && maxLength)) && (
        <View style={styles.footer}>
          {error && (
            <Text style={styles.errorText}>
              ⚠️ {error}
            </Text>
          )}
          {showCharacterCount && maxLength && (
            <Text style={styles.characterCount}>
              {value.length}/{maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  label: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onBackground,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  required: {
    color: ConstructionTheme.colors.error,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ConstructionTheme.borderRadius.md,
    paddingHorizontal: ConstructionTheme.spacing.md,
    ...ConstructionTheme.shadows.small,
  },
  input: {
    flex: 1,
    paddingVertical: ConstructionTheme.spacing.sm,
  },
  iconContainer: {
    padding: ConstructionTheme.spacing.sm,
    marginLeft: ConstructionTheme.spacing.sm,
  },
  icon: {
    fontSize: ConstructionTheme.dimensions.iconMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: ConstructionTheme.spacing.xs,
    paddingHorizontal: ConstructionTheme.spacing.xs,
  },
  errorText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.error,
    flex: 1,
  },
  characterCount: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
});

export default ConstructionInput;