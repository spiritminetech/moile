// FuelLogModal - Modal for logging fuel entries with photo upload
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { ConstructionButton } from '../common';
import { FuelLogEntry } from '../../types';

interface FuelLogModalProps {
  visible: boolean;
  vehicleId: number;
  currentMileage: number;
  onClose: () => void;
  onSubmit: (entry: FuelLogEntry) => Promise<void>;
}

export const FuelLogModal: React.FC<FuelLogModalProps> = ({
  visible,
  vehicleId,
  currentMileage,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState('');
  const [cost, setCost] = useState('');
  const [mileage, setMileage] = useState(currentMileage?.toString() || '0');
  const [location, setLocation] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setAmount('');
    setCost('');
    setMileage(currentMileage?.toString() || '0');
    setLocation('');
    setReceiptPhoto(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setReceiptPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error('Camera error:', error);
    }
  };

  const handleChoosePhoto = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setReceiptPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo');
      console.error('Image picker error:', error);
    }
  };

  const handlePhotoOptions = () => {
    Alert.alert(
      'Receipt Photo',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handleChoosePhoto },
      ]
    );
  };

  const handleRemovePhoto = () => {
    setReceiptPhoto(null);
  };

  const validateForm = (): boolean => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid fuel amount');
      return false;
    }
    if (!cost || parseFloat(cost) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid cost');
      return false;
    }
    if (!mileage || parseInt(mileage) < currentMileage) {
      Alert.alert('Validation Error', `Mileage must be at least ${currentMileage} km`);
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Validation Error', 'Please enter the fuel station location');
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
      const entry: FuelLogEntry = {
        vehicleId,
        date: new Date().toISOString(),
        amount: parseFloat(amount),
        cost: parseFloat(cost),
        mileage: parseInt(mileage),
        location: location.trim(),
        receiptPhoto: receiptPhoto || undefined,
      };

      await onSubmit(entry);
      Alert.alert('Success', 'Fuel log entry saved successfully');
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save fuel log entry');
    } finally {
      setIsSubmitting(false);
    }
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
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>⛽ Log Fuel Entry</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Fuel Amount */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fuel Amount (Liters) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 50.5"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
              />
            </View>

            {/* Cost */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cost ($) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 75.00"
                keyboardType="decimal-pad"
                value={cost}
                onChangeText={setCost}
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
              />
            </View>

            {/* Current Mileage */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Mileage (km) *</Text>
              <TextInput
                style={styles.input}
                placeholder={`e.g., ${currentMileage}`}
                keyboardType="number-pad"
                value={mileage}
                onChangeText={setMileage}
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
              />
              <Text style={styles.inputHint}>
                Vehicle mileage: {currentMileage?.toLocaleString() || 'N/A'} km
              </Text>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gas Station Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Shell Station, Main Street"
                value={location}
                onChangeText={setLocation}
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
              />
            </View>

            {/* Receipt Photo */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Receipt Photo (Optional)</Text>
              {receiptPhoto ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: receiptPhoto }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={handleRemovePhoto}
                  >
                    <Text style={styles.removePhotoText}>✕ Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={handlePhotoOptions}
                >
                  <Text style={styles.photoButtonText}>📷 Add Receipt Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fuel Amount:</Text>
                <Text style={styles.summaryValue}>{amount || '0'} L</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Cost:</Text>
                <Text style={styles.summaryValue}>${cost || '0.00'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Price per Liter:</Text>
                <Text style={styles.summaryValue}>
                  ${amount && cost ? (parseFloat(cost) / parseFloat(amount)).toFixed(2) : '0.00'}
                </Text>
              </View>
            </View>
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
              title={isSubmitting ? 'Saving...' : 'Save Entry'}
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
  inputGroup: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  inputLabel: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.sm,
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
  inputHint: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: ConstructionTheme.spacing.xs,
    fontStyle: 'italic',
  },
  photoButton: {
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    borderWidth: 2,
    borderColor: ConstructionTheme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: ConstructionTheme.borderRadius.md,
    paddingVertical: ConstructionTheme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  photoContainer: {
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: ConstructionTheme.borderRadius.md,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: ConstructionTheme.spacing.sm,
    right: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.error,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  removePhotoText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onError,
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: ConstructionTheme.colors.primaryContainer + '33',
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginTop: ConstructionTheme.spacing.md,
  },
  summaryTitle: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.xs,
  },
  summaryLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  summaryValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
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
