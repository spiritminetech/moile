// Advance Payment Request Submission Screen
// Requirements: 6.3

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

interface ReasonOption {
  value: string;
  label: string;
  description: string;
  icon: string;
}

const COMMON_REASONS: ReasonOption[] = [
  {
    value: 'emergency',
    label: 'Emergency',
    description: 'Urgent personal or family emergency',
    icon: '🚨',
  },
  {
    value: 'medical',
    label: 'Medical',
    description: 'Medical expenses or treatment',
    icon: '🏥',
  },
  {
    value: 'family',
    label: 'Family',
    description: 'Family obligations or events',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    value: 'education',
    label: 'Education',
    description: 'Educational expenses or training',
    icon: '🎓',
  },
  {
    value: 'travel',
    label: 'Travel',
    description: 'Travel or transportation needs',
    icon: '✈️',
  },
  {
    value: 'housing',
    label: 'Housing',
    description: 'Rent, utilities, or housing expenses',
    icon: '🏠',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other legitimate financial need',
    icon: '📄',
  },
];

const AdvancePaymentRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('emergency');
  const [amount, setAmount] = useState('');
  const [requiredDate, setRequiredDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    const amountNum = parseFloat(amount);
    if (!amount.trim() || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    // Check for reasonable amount limits (example: max $5000)
    if (amountNum > 5000) {
      newErrors.amount = 'Amount cannot exceed $5,000';
    }

    if (requiredDate <= new Date()) {
      newErrors.requiredDate = 'Required date must be in the future';
    }

    // Check if required date is too far in the future (more than 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    if (requiredDate > thirtyDaysFromNow) {
      newErrors.requiredDate = 'Required date cannot be more than 30 days in the future';
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
      const response = await workerApiService.submitAdvancePaymentRequest({
        amount: parseFloat(amount),
        currency: 'USD', // Default currency
        description: description.trim(),
        category: 'ADVANCE' as const,
        urgency: 'NORMAL' as const,
        requiredDate,
        justification: `${title.trim()} - ${reason}`,
      });

      if (response.success) {
        Alert.alert(
          'Request Submitted',
          'Your advance payment request has been submitted successfully. You will be notified when it is reviewed.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit advance payment request');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit advance payment request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setRequiredDate(selectedDate);
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

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toFixed(2);
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setAmount(cleanValue);
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Submitting advance payment request..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Advance Payment Request</Text>
          <Text style={styles.headerSubtitle}>
            Request advance payment for urgent financial needs
          </Text>
        </View>

        {/* Important Notice */}
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeIcon}>ℹ️</Text>
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Important Notice</Text>
            <Text style={styles.noticeText}>
              Advance payments are deducted from future salary payments. Please ensure you understand the repayment terms before submitting.
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Request Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Emergency medical expenses"
              placeholderTextColor="#9E9E9E"
              maxLength={100}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Reason */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reason for Advance *</Text>
            <View style={styles.reasonContainer}>
              {COMMON_REASONS.map((reasonOption) => (
                <TouchableOpacity
                  key={reasonOption.value}
                  style={[
                    styles.reasonOption,
                    reason === reasonOption.value && styles.reasonOptionSelected,
                  ]}
                  onPress={() => setReason(reasonOption.value)}
                >
                  <View style={styles.reasonIcon}>
                    <Text style={styles.reasonIconText}>{reasonOption.icon}</Text>
                  </View>
                  <View style={styles.reasonContent}>
                    <Text
                      style={[
                        styles.reasonLabel,
                        reason === reasonOption.value && styles.reasonLabelSelected,
                      ]}
                    >
                      {reasonOption.label}
                    </Text>
                    <Text
                      style={[
                        styles.reasonDescription,
                        reason === reasonOption.value && styles.reasonDescriptionSelected,
                      ]}
                    >
                      {reasonOption.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioButton,
                      reason === reasonOption.value && styles.radioButtonSelected,
                    ]}
                  >
                    {reason === reasonOption.value && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount and Date Row */}
          <View style={styles.amountDateRow}>
            <View style={styles.amountColumn}>
              <Text style={styles.label}>Amount Requested *</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={[styles.amountInput, errors.amount && styles.inputError]}
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  placeholderTextColor="#9E9E9E"
                  keyboardType="decimal-pad"
                  maxLength={10}
                />
              </View>
              {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
              <Text style={styles.amountHint}>Maximum: $5,000</Text>
            </View>

            <View style={styles.dateColumn}>
              <Text style={styles.label}>Required Date *</Text>
              <TouchableOpacity
                style={[styles.dateButton, errors.requiredDate && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>{formatDate(requiredDate)}</Text>
              </TouchableOpacity>
              {errors.requiredDate && <Text style={styles.errorText}>{errors.requiredDate}</Text>}
              <Text style={styles.dateHint}>Within 30 days</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Detailed Explanation *</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide a detailed explanation of why you need this advance payment, including specific circumstances, urgency, and how you plan to repay..."
              placeholderTextColor="#9E9E9E"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            <Text style={styles.characterCount}>{description.length}/500</Text>
          </View>

          {/* Summary */}
          {amount && !isNaN(parseFloat(amount)) && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Request Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Reason:</Text>
                <Text style={styles.summaryValue}>
                  {COMMON_REASONS.find(r => r.value === reason)?.label}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount:</Text>
                <Text style={styles.summaryAmount}>${formatCurrency(amount)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Required by:</Text>
                <Text style={styles.summaryValue}>{formatDate(requiredDate)}</Text>
              </View>
            </View>
          )}

          {/* Repayment Notice */}
          <View style={styles.repaymentNotice}>
            <Text style={styles.repaymentTitle}>Repayment Information</Text>
            <Text style={styles.repaymentText}>
              • Advance payments will be deducted from your future salary
            </Text>
            <Text style={styles.repaymentText}>
              • Deduction schedule will be determined by HR and communicated upon approval
            </Text>
            <Text style={styles.repaymentText}>
              • You will receive a repayment schedule with your approval notification
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!title.trim() || !description.trim() || !amount.trim()) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!title.trim() || !description.trim() || !amount.trim()}
          >
            <Text style={styles.submitButtonText}>Submit Advance Payment Request</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={requiredDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
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
  noticeContainer: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noticeIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  form: {
    padding: 16,
    paddingTop: 0,
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
    minHeight: 120,
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
  reasonContainer: {
    gap: 8,
  },
  reasonOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reasonIconText: {
    fontSize: 20,
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  reasonLabelSelected: {
    color: '#2196F3',
  },
  reasonDescription: {
    fontSize: 14,
    color: '#757575',
  },
  reasonDescriptionSelected: {
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
    marginLeft: 8,
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
  amountDateRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  amountColumn: {
    flex: 1,
  },
  dateColumn: {
    flex: 1,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingLeft: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 16,
    color: '#212121',
    borderWidth: 0,
  },
  amountHint: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
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
  dateHint: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  summaryContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  repaymentNotice: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  repaymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57F17',
    marginBottom: 8,
  },
  repaymentText: {
    fontSize: 14,
    color: '#F57F17',
    lineHeight: 20,
    marginBottom: 4,
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

export default AdvancePaymentRequestScreen;