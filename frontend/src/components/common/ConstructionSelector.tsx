// Construction-Optimized Selector Component (minimizes typing)
// Requirements: 12.2

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface SelectorOption {
  label: string;
  value: string | number;
  icon?: string; // Emoji icon
  disabled?: boolean;
}

interface ConstructionSelectorProps {
  label?: string;
  value: string | number | null;
  options: SelectorOption[];
  onSelect?: (value: string | number) => void;
  onValueChange?: (value: string | number) => void; // Alias for onSelect
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  style?: ViewStyle;
  multiple?: boolean;
  selectedValues?: (string | number)[];
  onMultiSelect?: (values: (string | number)[]) => void;
}

const ConstructionSelector: React.FC<ConstructionSelectorProps> = ({
  label,
  value,
  options,
  onSelect,
  onValueChange,
  placeholder = 'Select an option',
  disabled = false,
  error,
  style,
  multiple = false,
  selectedValues = [],
  onMultiSelect,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSelect = (optionValue: string | number) => {
    if (onSelect) {
      onSelect(optionValue);
    }
    if (onValueChange) {
      onValueChange(optionValue);
    }
  };

  const getSelectedLabel = (): string => {
    if (multiple && selectedValues.length > 0) {
      if (selectedValues.length === 1) {
        const option = options.find(opt => opt.value === selectedValues[0]);
        return option?.label || '';
      }
      return `${selectedValues.length} items selected`;
    }

    if (value !== null) {
      const option = options.find(opt => opt.value === value);
      return option?.label || '';
    }

    return placeholder;
  };

  const handleOptionPress = (optionValue: string | number) => {
    if (multiple && onMultiSelect) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onMultiSelect(newValues);
    } else {
      handleSelect(optionValue);
      setIsModalVisible(false);
    }
  };

  const isOptionSelected = (optionValue: string | number): boolean => {
    if (multiple) {
      return selectedValues.includes(optionValue);
    }
    return value === optionValue;
  };

  const renderOption = ({ item }: { item: SelectorOption }) => {
    const isSelected = isOptionSelected(item.value);
    
    return (
      <TouchableOpacity
        style={[
          styles.option,
          isSelected && styles.selectedOption,
          item.disabled && styles.disabledOption,
        ]}
        onPress={() => handleOptionPress(item.value)}
        disabled={item.disabled}
      >
        <View style={styles.optionContent}>
          {item.icon && (
            <Text style={styles.optionIcon}>{item.icon}</Text>
          )}
          <Text style={[
            styles.optionText,
            isSelected && styles.selectedOptionText,
            item.disabled && styles.disabledOptionText,
          ]}>
            {item.label}
          </Text>
          {isSelected && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.selector,
          error && styles.selectorError,
          disabled && styles.selectorDisabled,
        ]}
        onPress={() => setIsModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.selectorText,
          (value === null && selectedValues.length === 0) && styles.placeholderText,
          disabled && styles.disabledText,
        ]}>
          {getSelectedLabel()}
        </Text>
        <Text style={[styles.arrow, disabled && styles.disabledText]}>
          ▼
        </Text>
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>
          ⚠️ {error}
        </Text>
      )}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {label || 'Select Option'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item.value.toString()}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />

            {multiple && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  label: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onBackground,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ConstructionTheme.dimensions.inputMedium,
    paddingHorizontal: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surface,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.neutral,
    borderRadius: ConstructionTheme.borderRadius.md,
    ...ConstructionTheme.shadows.small,
  },
  selectorError: {
    borderColor: ConstructionTheme.colors.error,
    borderWidth: 2,
  },
  selectorDisabled: {
    backgroundColor: ConstructionTheme.colors.disabled,
    borderColor: ConstructionTheme.colors.disabled,
  },
  selectorText: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
  },
  placeholderText: {
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  disabledText: {
    color: ConstructionTheme.colors.onDisabled,
  },
  arrow: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginLeft: ConstructionTheme.spacing.sm,
  },
  errorText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.error,
    marginTop: ConstructionTheme.spacing.xs,
    paddingHorizontal: ConstructionTheme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.lg,
    width: '90%',
    maxHeight: '80%',
    ...ConstructionTheme.shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.surfaceVariant,
  },
  modalTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
  },
  closeButton: {
    padding: ConstructionTheme.spacing.sm,
  },
  closeButtonText: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.surfaceVariant,
  },
  selectedOption: {
    backgroundColor: ConstructionTheme.colors.primaryLight + '20', // 20% opacity
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: ConstructionTheme.dimensions.iconMedium,
    marginRight: ConstructionTheme.spacing.md,
  },
  optionText: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: ConstructionTheme.colors.primary,
  },
  disabledOptionText: {
    color: ConstructionTheme.colors.onDisabled,
  },
  checkmark: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: ConstructionTheme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.surfaceVariant,
  },
  doneButton: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingVertical: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    alignItems: 'center',
  },
  doneButtonText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onPrimary,
  },
});

export default ConstructionSelector;