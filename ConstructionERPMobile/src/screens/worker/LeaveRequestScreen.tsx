// Leave Request Submission Screen
// Requirements: 6.1

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { workerApiService } from '../../services/api/WorkerApiService';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import AttachmentManager from '../../components/forms/AttachmentManager';

interface AttachmentFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

type LeaveType = 'ANNUAL' | 'MEDICAL' | 'EMERGENCY';

interface LeaveTypeOption {
  value: LeaveType;
  label: string;
  description: string;
}

const LEAVE_TYPES: LeaveTypeOption[] = [
  {
    value: 'ANNUAL',
    label: 'Annual Leave',
    description: 'Planned vacation or personal time off',
  },
  {
    value: 'MEDICAL',
    label: 'Medical Leave',
    description: 'Medical illness or health-related absence',
  },
  {
    value: 'EMERGENCY',
    label: 'Emergency Leave',
    description: 'Urgent personal or family emergency',
  },
];

const LeaveRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    if (fromDate >= toDate) {
      newErrors.dates = 'To date must be after from date';
    }

    if (fromDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      newErrors.fromDate = 'From date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Convert AttachmentFile to File for API
      const fileAttachments: File[] | undefined = attachments.length > 0 
        ? attachments.map(att => {
            const blob = new Blob([], { type: att.type });
            const file = new File([blob], att.name, { type: att.type });
            // Add uri property for compatibility
            (file as any).uri = att.uri;
            return file;
          })
        : undefined;

      const response = await workerApiService.submitLeaveRequest({
        leaveType,
        fromDate,
        toDate,
        reason: reason.trim(),
        attachments: fileAttachments,
      });

      if (response.success) {
        Alert.alert(
          'Request Submitted',
          response.data.message || 'Your leave request has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit leave request');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit leave request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFromDateChange = (event: any, selectedDate?: Date) => {
    setShowFromDatePicker(false);
    if (selectedDate) {
      setFromDate(selectedDate);
      // Auto-adjust to date if it's before the new from date
      if (selectedDate >= toDate) {
        const newToDate = new Date(selectedDate);
        newToDate.setDate(newToDate.getDate() + 1);
        setToDate(newToDate);
      }
    }
  };

  const handleToDateChange = (event: any, selectedDate?: Date) => {
    setShowToDatePicker(false);
    if (selectedDate) {
      setToDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDays = () => {
    const timeDiff = toDate.getTime() - fromDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Submitting leave request..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Leave Request</Text>
          <Text style={styles.headerSubtitle}>
            Submit a request for time off from work
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Leave Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Leave Type *</Text>
            <View style={styles.leaveTypeContainer}>
              {LEAVE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.leaveTypeOption,
                    leaveType === type.value && styles.leaveTypeOptionSelected,
                  ]}
                  onPress={() => setLeaveType(type.value)}
                >
                  <View style={styles.leaveTypeHeader}>
                    <Text
                      style={[
                        styles.leaveTypeLabel,
                        leaveType === type.value && styles.leaveTypeLabelSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                    <View
                      style={[
                        styles.radioButton,
                        leaveType === type.value && styles.radioButtonSelected,
                      ]}
                    >
                      {leaveType === type.value && <View style={styles.radioButtonInner} />}
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.leaveTypeDescription,
                      leaveType === type.value && styles.leaveTypeDescriptionSelected,
                    ]}
                  >
                    {type.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Leave Period *</Text>
            
            <View style={styles.dateRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>From Date</Text>
                <TouchableOpacity
                  style={[styles.dateButton, errors.fromDate && styles.inputError]}
                  onPress={() => setShowFromDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>{formatDate(fromDate)}</Text>
                </TouchableOpacity>
                {errors.fromDate && <Text style={styles.errorText}>{errors.fromDate}</Text>}
              </View>

              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>To Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowToDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>{formatDate(toDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {errors.dates && <Text style={styles.errorText}>{errors.dates}</Text>}

            {/* Duration Display */}
            <View style={styles.durationContainer}>
              <Text style={styles.durationText}>
                Duration: {calculateDays()} day{calculateDays() !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Reason */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reason *</Text>
            <TextInput
              style={[styles.textArea, errors.reason && styles.inputError]}
              value={reason}
              onChangeText={setReason}
              placeholder="Provide details about your leave request, including reason and any relevant information..."
              placeholderTextColor="#9E9E9E"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            {errors.reason && <Text style={styles.errorText}>{errors.reason}</Text>}
            <Text style={styles.characterCount}>{reason.length}/500</Text>
          </View>

          {/* Attachments */}
          <View style={styles.inputGroup}>
            <AttachmentManager
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              maxAttachments={5}
              title="Supporting Documents (Optional)"
              description="Add medical certificates, approval letters, or other supporting documents"
            />
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, !reason.trim() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!reason.trim()}
          >
            <Text style={styles.submitButtonText}>Submit Leave Request</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Pickers */}
      {showFromDatePicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleFromDateChange}
          minimumDate={new Date()}
        />
      )}

      {showToDatePicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleToDateChange}
          minimumDate={fromDate}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#757575',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#212121',
  },
  inputError: {
    borderColor: '#F44336',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#212121',
    minHeight: 100,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'right',
    marginTop: 4,
  },
  leaveTypeContainer: {
    gap: 12,
  },
  leaveTypeOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
  },
  leaveTypeOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  leaveTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  leaveTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  leaveTypeLabelSelected: {
    color: '#2196F3',
  },
  leaveTypeDescription: {
    fontSize: 14,
    color: '#757575',
  },
  leaveTypeDescriptionSelected: {
    color: '#1976D2',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#2196F3',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateColumn: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500',
  },
  durationContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  submitContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#BDBDBD',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LeaveRequestScreen;