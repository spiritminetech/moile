// Worker Count Mismatch Handling Form
// Requirement #3: Mandatory reason selection for worker count mismatches

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { ConstructionButton, ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface WorkerMismatch {
  workerId: number;
  workerName: string;
  reason: 'absent' | 'shifted' | 'medical' | 'other' | null;
  remarks: string;
}

interface WorkerCountMismatchFormProps {
  expectedWorkers: Array<{ workerId: number; name: string }>;
  actualWorkers: Array<{ workerId: number; name: string }>;
  onSubmit: (mismatches: WorkerMismatch[]) => Promise<void>;
  onCancel: () => void;
}

const WorkerCountMismatchForm: React.FC<WorkerCountMismatchFormProps> = ({
  expectedWorkers,
  actualWorkers,
  onSubmit,
  onCancel,
}) => {
  const actualWorkerIds = actualWorkers.map((w) => w.workerId);
  const missingWorkers = expectedWorkers.filter(
    (w) => !actualWorkerIds.includes(w.workerId)
  );

  const [workerMismatches, setWorkerMismatches] = useState<WorkerMismatch[]>(
    missingWorkers.map((w) => ({
      workerId: w.workerId,
      workerName: w.name,
      reason: null,
      remarks: '',
    }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonOptions = [
    { value: 'absent', label: '❌ Absent/No-show', description: 'Worker did not show up at pickup' },
    { value: 'shifted', label: '🔄 Shifted to Another Site', description: 'Worker reassigned to different location' },
    { value: 'medical', label: '🏥 Medical Emergency', description: 'Worker had medical issue' },
    { value: 'other', label: '📝 Other Reason', description: 'Other reason (specify in remarks)' },
  ];

  const handleReasonSelect = (workerId: number, reason: WorkerMismatch['reason']) => {
    setWorkerMismatches((prev) =>
      prev.map((w) => (w.workerId === workerId ? { ...w, reason } : w))
    );
  };

  const handleRemarksChange = (workerId: number, remarks: string) => {
    setWorkerMismatches((prev) =>
      prev.map((w) => (w.workerId === workerId ? { ...w, remarks } : w))
    );
  };

  const handleSubmit = async () => {
    // Validation: All workers must have a reason selected
    const missingReasons = workerMismatches.filter((w) => !w.reason);
    if (missingReasons.length > 0) {
      Alert.alert(
        'Validation Error',
        `Please select a reason for all missing workers:\n${missingReasons
          .map((w) => `• ${w.workerName}`)
          .join('\n')}`
      );
      return;
    }

    // Validation: Workers with "other" reason must have remarks
    const missingRemarks = workerMismatches.filter(
      (w) => w.reason === 'other' && !w.remarks.trim()
    );
    if (missingRemarks.length > 0) {
      Alert.alert(
        'Validation Error',
        `Please provide remarks for workers with "Other" reason:\n${missingRemarks
          .map((w) => `• ${w.workerName}`)
          .join('\n')}`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(workerMismatches);
      Alert.alert(
        '✅ Mismatch Recorded',
        'Worker count mismatch has been recorded. Supervisors have been notified.',
        [{ text: 'OK', onPress: onCancel }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to record mismatch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ConstructionCard variant="elevated" style={styles.formCard}>
        <Text style={styles.formTitle}>⚠️ Worker Count Mismatch</Text>
        <Text style={styles.formSubtitle}>
          Expected: {expectedWorkers.length} workers | Actual: {actualWorkers.length} workers
        </Text>
        <Text style={styles.warningText}>
          Please provide a reason for each missing worker. This information will be sent to
          supervisors and used for attendance records.
        </Text>

        {workerMismatches.map((worker, index) => (
          <View key={worker.workerId} style={styles.workerSection}>
            <Text style={styles.workerName}>
              {index + 1}. {worker.workerName}
            </Text>
            <Text style={styles.workerId}>ID: {worker.workerId}</Text>

            {/* Reason Selection */}
            <View style={styles.reasonSection}>
              <Text style={styles.sectionTitle}>Select Reason *</Text>
              {reasonOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.reasonOption,
                    worker.reason === option.value && styles.reasonOptionSelected,
                  ]}
                  onPress={() =>
                    handleReasonSelect(worker.workerId, option.value as WorkerMismatch['reason'])
                  }
                >
                  <View style={styles.reasonOptionContent}>
                    <Text
                      style={[
                        styles.reasonOptionLabel,
                        worker.reason === option.value && styles.reasonOptionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.reasonOptionDescription,
                        worker.reason === option.value && styles.reasonOptionDescriptionSelected,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioButton,
                      worker.reason === option.value && styles.radioButtonSelected,
                    ]}
                  >
                    {worker.reason === option.value && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Remarks */}
            <View style={styles.remarksSection}>
              <Text style={styles.sectionTitle}>
                Remarks {worker.reason === 'other' && '*'}
              </Text>
              <TextInput
                style={styles.remarksInput}
                placeholder="Add any additional details..."
                multiline
                numberOfLines={3}
                value={worker.remarks}
                onChangeText={(text) => handleRemarksChange(worker.workerId, text)}
                maxLength={200}
              />
              <Text style={styles.characterCount}>{worker.remarks.length}/200</Text>
            </View>

            {index < workerMismatches.length - 1 && <View style={styles.divider} />}
          </View>
        ))}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <ConstructionButton
            title="Cancel"
            onPress={onCancel}
            variant="outlined"
            size="large"
            style={styles.actionButton}
            disabled={isSubmitting}
          />
          <ConstructionButton
            title={isSubmitting ? 'Submitting...' : 'Submit'}
            onPress={handleSubmit}
            variant="primary"
            size="large"
            style={styles.actionButton}
            disabled={isSubmitting}
          />
        </View>
      </ConstructionCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formCard: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  formTitle: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.error,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  formSubtitle: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  warningText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    backgroundColor: ConstructionTheme.colors.errorContainer,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  workerSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  workerName: {
    ...ConstructionTheme.typography.titleLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  workerId: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.md,
  },
  reasonSection: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  reasonOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginBottom: ConstructionTheme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonOptionSelected: {
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    borderColor: ConstructionTheme.colors.primary,
  },
  reasonOptionContent: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.md,
  },
  reasonOptionLabel: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  reasonOptionLabelSelected: {
    color: ConstructionTheme.colors.primary,
  },
  reasonOptionDescription: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  reasonOptionDescriptionSelected: {
    color: ConstructionTheme.colors.primary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ConstructionTheme.colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: ConstructionTheme.colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ConstructionTheme.colors.primary,
  },
  remarksSection: {
    marginTop: ConstructionTheme.spacing.md,
  },
  remarksInput: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.md,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  characterCount: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'right',
    marginTop: ConstructionTheme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: ConstructionTheme.colors.outline,
    marginVertical: ConstructionTheme.spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: ConstructionTheme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: ConstructionTheme.spacing.xs,
  },
});

export default WorkerCountMismatchForm;
