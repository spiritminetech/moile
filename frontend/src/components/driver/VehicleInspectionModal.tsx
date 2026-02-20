// VehicleInspectionModal - Modal for vehicle pre-check inspection
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

interface ChecklistItem {
  status: 'pass' | 'fail' | 'needs_attention' | null;
  notes: string;
  photos: string[];
}

interface VehicleInspectionModalProps {
  visible: boolean;
  vehicleId: number;
  currentMileage: number;
  onClose: () => void;
  onSubmit: (inspectionData: any) => Promise<void>;
}

export const VehicleInspectionModal: React.FC<VehicleInspectionModalProps> = ({
  visible,
  vehicleId,
  currentMileage,
  onClose,
  onSubmit,
}) => {
  const [odometerReading, setOdometerReading] = useState(currentMileage?.toString() || '0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checklist items state
  const [checklist, setChecklist] = useState<Record<string, ChecklistItem>>({
    tires: { status: null, notes: '', photos: [] },
    lights: { status: null, notes: '', photos: [] },
    brakes: { status: null, notes: '', photos: [] },
    steering: { status: null, notes: '', photos: [] },
    fluids: { status: null, notes: '', photos: [] },
    mirrors: { status: null, notes: '', photos: [] },
    seatbelts: { status: null, notes: '', photos: [] },
    horn: { status: null, notes: '', photos: [] },
    wipers: { status: null, notes: '', photos: [] },
    emergencyEquipment: { status: null, notes: '', photos: [] },
    interior: { status: null, notes: '', photos: [] },
    exterior: { status: null, notes: '', photos: [] },
  });

  const checklistItems = [
    { key: 'tires', label: '🛞 Tires', description: 'Pressure, tread, damage' },
    { key: 'lights', label: '💡 Lights', description: 'Headlights, brake lights, signals' },
    { key: 'brakes', label: '🛑 Brakes', description: 'Brake pedal, parking brake' },
    { key: 'steering', label: '🎯 Steering', description: 'Steering wheel, alignment' },
    { key: 'fluids', label: '🛢️ Fluids', description: 'Oil, coolant, brake fluid' },
    { key: 'mirrors', label: '🪞 Mirrors', description: 'Side mirrors, rear view' },
    { key: 'seatbelts', label: '🔒 Seatbelts', description: 'All seatbelts functional' },
    { key: 'horn', label: '📢 Horn', description: 'Horn working properly' },
    { key: 'wipers', label: '🌧️ Wipers', description: 'Wiper blades, washer fluid' },
    { key: 'emergencyEquipment', label: '🚨 Emergency Equipment', description: 'First aid, fire extinguisher, triangle' },
    { key: 'interior', label: '🪑 Interior', description: 'Seats, dashboard, cleanliness' },
    { key: 'exterior', label: '🚗 Exterior', description: 'Body damage, windows, doors' },
  ];

  const resetForm = () => {
    setOdometerReading(currentMileage?.toString() || '0');
    setChecklist({
      tires: { status: null, notes: '', photos: [] },
      lights: { status: null, notes: '', photos: [] },
      brakes: { status: null, notes: '', photos: [] },
      steering: { status: null, notes: '', photos: [] },
      fluids: { status: null, notes: '', photos: [] },
      mirrors: { status: null, notes: '', photos: [] },
      seatbelts: { status: null, notes: '', photos: [] },
      horn: { status: null, notes: '', photos: [] },
      wipers: { status: null, notes: '', photos: [] },
      emergencyEquipment: { status: null, notes: '', photos: [] },
      interior: { status: null, notes: '', photos: [] },
      exterior: { status: null, notes: '', photos: [] },
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateChecklistItem = (key: string, status: 'pass' | 'fail' | 'needs_attention') => {
    setChecklist(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
      },
    }));
  };

  const updateChecklistNotes = (key: string, notes: string) => {
    setChecklist(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        notes,
      },
    }));
  };

  const validateForm = (): boolean => {
    if (!odometerReading || parseInt(odometerReading) < currentMileage) {
      Alert.alert('Validation Error', `Odometer reading must be at least ${currentMileage} km`);
      return false;
    }

    const uncheckedItems = Object.entries(checklist).filter(([_, item]) => item.status === null);
    if (uncheckedItems.length > 0) {
      Alert.alert(
        'Incomplete Inspection',
        `Please check all items. ${uncheckedItems.length} item(s) remaining.`
      );
      return false;
    }

    const failedWithoutNotes = Object.entries(checklist).filter(
      ([_, item]) => (item.status === 'fail' || item.status === 'needs_attention') && !item.notes.trim()
    );
    if (failedWithoutNotes.length > 0) {
      Alert.alert(
        'Missing Notes',
        'Please add notes for all failed or needs attention items.'
      );
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
      const inspectionData = {
        vehicleId,
        checklist,
        odometerReading: parseInt(odometerReading),
        inspectionType: 'pre_trip',
        location: {
          latitude: null,
          longitude: null,
        },
      };

      await onSubmit(inspectionData);
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit vehicle inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCompletionPercentage = () => {
    const total = Object.keys(checklist).length;
    const completed = Object.values(checklist).filter(item => item.status !== null).length;
    return Math.round((completed / total) * 100);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>🔍 Vehicle Pre-Check</Text>
              <Text style={styles.modalSubtitle}>
                {getCompletionPercentage()}% Complete
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Odometer Reading (km) *</Text>
              <TextInput
                style={styles.input}
                placeholder={`Current: ${currentMileage} km`}
                keyboardType="number-pad"
                value={odometerReading}
                onChangeText={setOdometerReading}
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inspection Checklist *</Text>
              <Text style={styles.sectionDescription}>
                Check each item and mark as Pass, Fail, or Needs Attention
              </Text>

              {checklistItems.map((item) => (
                <View key={item.key} style={styles.checklistItem}>
                  <View style={styles.checklistHeader}>
                    <Text style={styles.checklistLabel}>{item.label}</Text>
                    <Text style={styles.checklistDescription}>{item.description}</Text>
                  </View>

                  <View style={styles.statusButtons}>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        checklist[item.key].status === 'pass' && {
                          backgroundColor: ConstructionTheme.colors.success + '22',
                          borderColor: ConstructionTheme.colors.success,
                        },
                      ]}
                      onPress={() => updateChecklistItem(item.key, 'pass')}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          checklist[item.key].status === 'pass' && {
                            color: ConstructionTheme.colors.success,
                          },
                        ]}
                      >
                        ✓ Pass
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        checklist[item.key].status === 'needs_attention' && {
                          backgroundColor: ConstructionTheme.colors.warning + '22',
                          borderColor: ConstructionTheme.colors.warning,
                        },
                      ]}
                      onPress={() => updateChecklistItem(item.key, 'needs_attention')}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          checklist[item.key].status === 'needs_attention' && {
                            color: ConstructionTheme.colors.warning,
                          },
                        ]}
                      >
                        ⚠ Attention
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        checklist[item.key].status === 'fail' && {
                          backgroundColor: ConstructionTheme.colors.error + '22',
                          borderColor: ConstructionTheme.colors.error,
                        },
                      ]}
                      onPress={() => updateChecklistItem(item.key, 'fail')}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          checklist[item.key].status === 'fail' && {
                            color: ConstructionTheme.colors.error,
                          },
                        ]}
                      >
                        ✕ Fail
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {checklist[item.key].status && checklist[item.key].status !== 'pass' && (
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add notes about the issue..."
                      value={checklist[item.key].notes}
                      onChangeText={(text) => updateChecklistNotes(item.key, text)}
                      multiline
                      numberOfLines={2}
                      placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                    />
                  )}
                </View>
              ))}
            </View>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ If any critical items fail (brakes, steering, tires), the vehicle will be marked as unsafe to operate.
              </Text>
            </View>
          </ScrollView>

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
              title={isSubmitting ? 'Submitting...' : 'Submit Inspection'}
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
    maxHeight: '95%',
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
  modalSubtitle: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.primary,
    marginTop: 4,
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
    marginBottom: ConstructionTheme.spacing.lg,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  sectionDescription: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.md,
  },
  input: {
    ...ConstructionTheme.typography.bodyLarge,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.md,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.md,
    color: ConstructionTheme.colors.onSurface,
  },
  checklistItem: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  checklistHeader: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  checklistLabel: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  checklistDescription: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.sm,
    marginTop: ConstructionTheme.spacing.sm,
  },
  statusButton: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.surface,
    borderWidth: 2,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    alignItems: 'center',
  },
  statusButtonText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
  },
  notesInput: {
    ...ConstructionTheme.typography.bodyMedium,
    backgroundColor: ConstructionTheme.colors.surface,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.md,
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.sm,
    color: ConstructionTheme.colors.onSurface,
    marginTop: ConstructionTheme.spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  warningBox: {
    backgroundColor: ConstructionTheme.colors.warningContainer,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.warning,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginBottom: ConstructionTheme.spacing.md,
  },
  warningText: {
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
