// Reimbursement Request Submission Screen
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
import PhotoManager from '../../components/forms/PhotoManager';
import { ReportPhoto } from '../../types';

interface ExpenseCategory {
  value: string;
  label: string;
  description: string;
  icon: string;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    value: 'TRANSPORT',
    label: 'Transportation',
    description: 'Travel expenses, fuel, parking',
    icon: '🚗',
  },
  {
    value: 'MEALS',
    label: 'Meals',
    description: 'Business meals and refreshments',
    icon: '🍽️',
  },
  {
    value: 'ACCOMMODATION',
    label: 'Accommodation',
    description: 'Hotel and lodging expenses',
    icon: '🏨',
  },
  {
    value: 'MATERIALS',
    label: 'Materials',
    description: 'Work-related materials purchased',
    icon: '🧱',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Other work-related expenses',
    icon: '📋',
  },
  {
    value: 'medical',
    label: 'Medical',
    description: 'Work-related medical expenses',
    icon: '🏥',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other work-related expenses',
    icon: '📄',
  },
];

const ReimbursementRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('transportation');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receiptPhotos, setReceiptPhotos] = useState<ReportPhoto[]>([]);

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

    if (expenseDate > new Date()) {
      newErrors.expenseDate = 'Expense date cannot be in the future';
    }

    // Check if expense date is too old (more than 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    if (expenseDate < ninetyDaysAgo) {
      newErrors.expenseDate = 'Expense date cannot be more than 90 days old';
    }

    if (receiptPhotos.length === 0) {
      newErrors.receipts = 'At least one receipt photo is required';
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
      const response = await workerApiService.submitReimbursementRequest({
        amount: parseFloat(amount),
        currency: 'USD', // Default currency
        description: description.trim(),
        category: category as 'TRANSPORT' | 'MEALS' | 'ACCOMMODATION' | 'MATERIALS' | 'OTHER',
        urgency: 'NORMAL' as const,
        requiredDate: expenseDate,
        justification: `${title.trim()} - ${description.trim()}`,
        // Note: attachments would need to be converted from photo URIs to File objects
      });

      if (response.success) {
        Alert.alert(
          'Request Submitted',
          'Your reimbursement request has been submitted successfully. You will be notified when it is reviewed.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit reimbursement request');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit reimbursement request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExpenseDate(selectedDate);
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
    return <LoadingOverlay visible={true} message="Submitting reimbursement request..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reimbursement Request</Text>
          <Text style={styles.headerSubtitle}>
            Submit expenses for reimbursement with receipts
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expense Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Travel expenses for site visit"
              placeholderTextColor="#9E9E9E"
              maxLength={100}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expense Category *</Text>
            <View style={styles.categoryContainer}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryOption,
                    category === cat.value && styles.categoryOptionSelected,
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <View style={styles.categoryIcon}>
                    <Text style={styles.categoryIconText}>{cat.icon}</Text>
                  </View>
                  <View style={styles.categoryContent}>
                    <Text
                      style={[
                        styles.categoryLabel,
                        category === cat.value && styles.categoryLabelSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                    <Text
                      style={[
                        styles.categoryDescription,
                        category === cat.value && styles.categoryDescriptionSelected,
                      ]}
                    >
                      {cat.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioButton,
                      category === cat.value && styles.radioButtonSelected,
                    ]}
                  >
                    {category === cat.value && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount and Date Row */}
          <View style={styles.amountDateRow}>
            <View style={styles.amountColumn}>
              <Text style={styles.label}>Amount *</Text>
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
            </View>

            <View style={styles.dateColumn}>
              <Text style={styles.label}>Expense Date *</Text>
              <TouchableOpacity
                style={[styles.dateButton, errors.expenseDate && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>{formatDate(expenseDate)}</Text>
              </TouchableOpacity>
              {errors.expenseDate && <Text style={styles.errorText}>{errors.expenseDate}</Text>}
            </View>
          </View>

          {/* Receipt Photos */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Receipt Photos *</Text>
            <Text style={styles.receiptHint}>
              Take clear photos of your receipts. Multiple receipts can be uploaded.
            </Text>
            <PhotoManager
              photos={receiptPhotos}
              onPhotosChange={setReceiptPhotos}
              maxPhotos={5}
            />
            {errors.receipts && <Text style={styles.errorText}>{errors.receipts}</Text>}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide detailed description of the expense, including business purpose, location, and any relevant context..."
              placeholderTextColor="#9E9E9E"
              multiline
              numberOfLines={4}
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
                <Text style={styles.summaryLabel}>Category:</Text>
                <Text style={styles.summaryValue}>
                  {EXPENSE_CATEGORIES.find(c => c.value === category)?.label}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount:</Text>
                <Text style={styles.summaryAmount}>${formatCurrency(amount)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>{formatDate(expenseDate)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Receipts:</Text>
                <Text style={styles.summaryValue}>{receiptPhotos.length} photo(s)</Text>
              </View>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!title.trim() || !description.trim() || !amount.trim() || receiptPhotos.length === 0) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!title.trim() || !description.trim() || !amount.trim() || receiptPhotos.length === 0}
          >
            <Text style={styles.submitButtonText}>Submit Reimbursement Request</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={expenseDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
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
  categoryContainer: {
    gap: 8,
  },
  categoryOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryContent: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  categoryLabelSelected: {
    color: '#2196F3',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#757575',
  },
  categoryDescriptionSelected: {
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
  receiptHint: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
    lineHeight: 20,
  },
  summaryContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
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

export default ReimbursementRequestScreen;