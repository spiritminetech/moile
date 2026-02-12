// Delay/Breakdown Reporting Form Component
// Requirement #6: Complete UI for delay/breakdown reporting

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
import { showPhotoOptions, PhotoResult, preparePhotoForUpload } from '../../utils/photoCapture';
import { GeoLocation } from '../../types';

interface DelayBreakdownReportFormProps {
  taskId: number;
  reportType: 'delay' | 'breakdown';
  currentLocation: GeoLocation | null;
  onSubmit: (reportData: {
    type: 'delay' | 'breakdown';
    reason: string;
    estimatedDelay: number;
    description: string;
    photos: PhotoResult[];
    location: GeoLocation;
  }) => Promise<void>;
  onCancel: () => void;
}

const DelayBreakdownReportForm: React.FC<DelayBreakdownReportFormProps> = ({
  taskId,
  reportType,
  currentLocation,
  onSubmit,
  onCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [estimatedDelay, setEstimatedDelay] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delay reasons
  const delayReasons = [
    '🚦 Heavy Traffic',
    '🚧 Road Construction',
    '⚠️ Accident on Route',
    '🌧️ Bad Weather',
    '🚗 Vehicle Issue (Minor)',
    '📍 Wrong Route Taken',
    '⏰ Late Start',
    '📞 Emergency Call',
    '🔧 Other',
  ];

  // Breakdown reasons
  const breakdownReasons = [
    '🔧 Engine Problem',
    '⚙️ Transmission Issue',
    '🛞 Tire Puncture',
    '🔋 Battery Dead',
    '⛽ Fuel System Problem',
    '🌡️ Overheating',
    '🔩 Mechanical Failure',
    '⚡ Electrical Issue',
    '🚨 Other Breakdown',
  ];

  const reasons = reportType === 'delay' ? delayReasons : breakdownReasons;

  const handleTakePhoto = async () => {
    try {
      const photo = await showPhotoOptions(currentLocation || undefined);
      if (photo) {
        setPhotos([...photos, photo]);
        Alert.alert('✅ Photo Added', `Photo captured: ${photo.fileName}`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to capture photo');
    }
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newPhotos = [...photos];
            newPhotos.splice(index, 1);
            setPhotos(newPhotos);
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedReason) {
      Alert.alert('Validation Error', 'Please select a reason');
      return;
    }

    if (!estimatedDelay || parseInt(estimatedDelay) <= 0) {
      Alert.alert('Validation Error', 'Please enter estimated delay in minutes');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please provide a description');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Error', 'GPS location not available. Please enable location services.');
      return;
    }

    if (photos.length === 0) {
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          '⚠️ No Photos',
          'It is recommended to attach photos for verification. Continue without photos?',
          [
            { text: 'Go Back', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Continue Without Photos', style: 'destructive', onPress: () => resolve(true) },
          ]
        );
      });

      if (!proceed) return;
    }

    try {
      setIsSubmitting(true);

      await onSubmit({
        type: reportType,
        reason: selectedReason,
        estimatedDelay: parseInt(estimatedDelay),
        description: description.trim(),
        photos: photos,
        location: currentLocation,
      });

      Alert.alert(
        '✅ Report Submitted',
        `${reportType === 'delay' ? 'Delay' : 'Breakdown'} report submitted successfully. Dispatch and supervisors have been notified.`,
        [{ text: 'OK', onPress: onCancel }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ConstructionCard variant="elevated" style={styles.formCard}>
        <Text style={styles.formTitle}>
          {reportType === 'delay' ? '🚦 Report Delay' : '🔧 Report Breakdown'}
        </Text>
        <Text style={styles.formSubtitle}>
          Task ID: {taskId}
        </Text>

        {/* Reason Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Reason *</Text>
          <View style={styles.reasonGrid}>
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonButton,
                  selectedReason === reason && styles.reasonButtonSelected,
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <Text
                  style={[
                    styles.reasonButtonText,
                    selectedReason === reason && styles.reasonButtonTextSelected,
                  ]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Estimated Delay */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimated Delay (minutes) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter delay in minutes (e.g., 30)"
            keyboardType="number-pad"
            value={estimatedDelay}
            onChangeText={setEstimatedDelay}
            maxLength={4}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={
              reportType === 'delay'
                ? 'Describe the delay situation...'
                : 'Describe the breakdown issue...'
            }
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos (Recommended)</Text>
          <Text style={styles.sectionSubtitle}>
            Attach photos for verification and faster resolution
          </Text>

          {photos.length > 0 && (
            <View style={styles.photoList}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Text style={styles.photoName}>📷 {photo.fileName}</Text>
                  <TouchableOpacity
                    style={styles.photoRemoveButton}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <Text style={styles.photoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <ConstructionButton
            title="📷 Take Photo"
            onPress={handleTakePhoto}
            variant="secondary"
            size="medium"
            disabled={photos.length >= 5}
          />
          {photos.length >= 5 && (
            <Text style={styles.photoLimitText}>Maximum 5 photos allowed</Text>
          )}
        </View>

        {/* GPS Location Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GPS Location</Text>
          {currentLocation ? (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                📍 Lat: {currentLocation.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                📍 Lng: {currentLocation.longitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                🎯 Accuracy: {currentLocation.accuracy.toFixed(0)}m
              </Text>
            </View>
          ) : (
            <Text style={styles.locationError}>⚠️ GPS location not available</Text>
          )}
        </View>

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
            title={isSubmitting ? 'Submitting...' : 'Submit Report'}
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
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  formSubtitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  section: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  sectionSubtitle: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.md,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -ConstructionTheme.spacing.xs,
  },
  reasonButton: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.md,
    margin: ConstructionTheme.spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonButtonSelected: {
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    borderColor: ConstructionTheme.colors.primary,
  },
  reasonButtonText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  reasonButtonTextSelected: {
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.md,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'right',
    marginTop: ConstructionTheme.spacing.xs,
  },
  photoList: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  photoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  photoName: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    flex: 1,
  },
  photoRemoveButton: {
    backgroundColor: ConstructionTheme.colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRemoveText: {
    color: ConstructionTheme.colors.onError,
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoLimitText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.error,
    marginTop: ConstructionTheme.spacing.xs,
  },
  locationInfo: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  locationText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  locationError: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.error,
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

export default DelayBreakdownReportForm;
