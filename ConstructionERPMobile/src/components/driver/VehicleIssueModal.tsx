// VehicleIssueModal - Modal for reporting vehicle issues
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { ConstructionButton } from '../common';

interface VehicleIssueModalProps {
  visible: boolean;
  vehicleId: number;
  onClose: () => void;
  onSubmit: (issueData: {
    category: string;
    description: string;
    severity: string;
  }) => Promise<void>;
}

export const VehicleIssueModal: React.FC<VehicleIssueModalProps> = ({
  visible,
  vehicleId,
  onClose,
  onSubmit,
}) => {
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCategory('');
    setDescription('');
    setSeverity('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    if (!category) {
      Alert.alert('Validation Error', 'Please select an issue category');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please describe the issue');
      return false;
    }
    if (description.trim().length < 10) {
      Alert.alert('Validation Error', 'Please provide a more detailed description (at least 10 characters)');
      return false;
    }
    if (!severity) {
      Alert.alert('Validation Error', 'Please select severity level');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        category,
        description: description.trim(),
        severity,
      });
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to report vehicle issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: 'mechanical', label: '🔧 Mechanical Issue', description: 'Engine, brakes, transmission' },
    { value: 'electrical', label: '⚡ Electrical Issue', description: 'Battery, lights, electronics' },
    { value: 'safety', label: '⚠️ Safety Concern', description: 'Seatbelts, airbags, tires' },
    { value: 'other', label: '📋 Other Issue', description: 'Any other problems' },
  ];

  const severities = [
    { value: 'low', label: 'Low', description: 'Minor issue, can wait', color: ConstructionTheme.colors.success },
    { value: 'medium', label: 'Medium', description: 'Needs attention soon', color: ConstructionTheme.colors.primary },
    { value: 'high', label: 'High', description: 'Urgent repair needed', color: ConstructionTheme.colors.warning },
    { value: 'critical', label: 'Critical', description: 'Unsafe to drive', color: ConstructionTheme.colors.error },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🔧 Report Vehicle Issue</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Issue Category *</Text>
              <View style={styles.optionsContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.optionCard,
                      category === cat.value && styles.optionCardSelected,
                    ]}
                    onPress={() => setCategory(cat.value)}
                  >
                    <Text style={[
                      styles.optionLabel,
                      category === cat.value && styles.optionLabelSelected,
                    ]}>
                      {cat.label}
                    </Text>
                    <Text style={styles.optionDescription}>{cat.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Issue Description *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe the issue in detail..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
              />
              <Text style={styles.charCount}>{description.length} characters</Text>
            </View>

            {/* Severity Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Severity Level *</Text>
              <View style={styles.optionsContainer}>
                {severities.map((sev) => (
                  <TouchableOpacity
                    key={sev.value}
                    style={[
                      styles.severityCard,
                      severity === sev.value && { 
                        borderColor: sev.color,
                        backgroundColor: sev.color + '22'
                      },
                    ]}
                    onPress={() => setSeverity(sev.value)}
                  >
                    <View style={styles.severityHeader}>
                      <Text style={[
                        styles.severityLabel,
                        severity === sev.value && { color: sev.color }
                      ]}>
                        {sev.label}
                      </Text>
                      {severity === sev.value && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.severityDescription}>{sev.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Warning for critical issues */}
            {severity === 'critical' && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Critical issues mark the vehicle as OUT OF SERVICE. The vehicle cannot be used until repaired.
                </Text>
              </View>
            )}

            {severity === 'high' && (
              <View style={styles.cautionBox}>
                <Text style={styles.cautionText}>
                  ⚠️ High severity issues mark the vehicle as NEEDS REPAIR. Use with caution.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <ConstructionButton
              title="Cancel"
              onPress={handleClose}
              variant="outlined"
              size="medium"
              style={styles.footerButton}
              disabled={isSubmitting}
            />
            <ConstructionButton
              title={isSubmitting ? 'Reporting...' : 'Report Issue'}
              onPress={handleSubmit}
              variant="primary"
              size="medium"
              style={styles.footerButton}
              disabled={isSubmitting}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderTopLeftRadius: ConstructionTheme.borderRadius.xl,
    borderTopRightRadius: ConstructionTheme.borderRadius.xl,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline + '33',
  },
  modalTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: ConstructionTheme.spacing.sm,
  },
  closeButtonText: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  modalContent: {
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.md,
  },
  section: {
    marginBottom: ConstructionTheme.spacing.xl,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.md,
  },
  optionsContainer: {
    gap: ConstructionTheme.spacing.sm,
  },
  optionCard: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderWidth: 2,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: ConstructionTheme.spacing.md,
  },
  optionCardSelected: {
    borderColor: ConstructionTheme.colors.primary,
    backgroundColor: ConstructionTheme.colors.primaryContainer + '33',
  },
  optionLabel: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  optionLabelSelected: {
    color: ConstructionTheme.colors.primary,
  },
  optionDescription: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  textArea: {
    ...ConstructionTheme.typography.bodyLarge,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.md,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.md,
    color: ConstructionTheme.colors.onSurface,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: ConstructionTheme.spacing.xs,
    textAlign: 'right',
  },
  severityCard: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderWidth: 2,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: ConstructionTheme.spacing.md,
  },
  severityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  severityLabel: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  checkmark: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.primary,
  },
  severityDescription: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  warningBox: {
    backgroundColor: ConstructionTheme.colors.errorContainer,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.error,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  warningText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onErrorContainer,
  },
  cautionBox: {
    backgroundColor: ConstructionTheme.colors.warningContainer,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.warning,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  cautionText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onWarningContainer,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline + '33',
    gap: ConstructionTheme.spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
