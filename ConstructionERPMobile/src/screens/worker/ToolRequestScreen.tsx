// Tool Request Submission Screen
// Requirements: 6.2

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

type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface ToolItem {
  id: string;
  name: string;
  quantity: number;
  specifications: string;
  duration: string;
}

interface PriorityOption {
  value: Priority;
  label: string;
  color: string;
  description: string;
}

const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: 'low',
    label: 'Low',
    color: '#4CAF50',
    description: 'Can wait, not urgent',
  },
  {
    value: 'medium',
    label: 'Medium',
    color: '#FF9800',
    description: 'Needed soon, moderate urgency',
  },
  {
    value: 'high',
    label: 'High',
    color: '#F44336',
    description: 'Needed quickly, high priority',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    color: '#9C27B0',
    description: 'Critical, needed immediately',
  },
];

const COMMON_DURATIONS = ['1 day', '3 days', '1 week', '2 weeks', '1 month', 'Until project completion'];

const ToolRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [requiredDate, setRequiredDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tools, setTools] = useState<ToolItem[]>([
    { id: '1', name: '', quantity: 1, specifications: '', duration: '1 week' },
  ]);

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

    if (requiredDate <= new Date()) {
      newErrors.requiredDate = 'Required date must be in the future';
    }

    // Validate tools
    const validTools = tools.filter(t => t.name.trim());
    if (validTools.length === 0) {
      newErrors.tools = 'At least one tool item is required';
    }

    // Check for invalid quantities
    const invalidQuantities = tools.some(t => t.name.trim() && (t.quantity <= 0 || !Number.isInteger(t.quantity)));
    if (invalidQuantities) {
      newErrors.quantities = 'All quantities must be positive whole numbers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const validTools = tools.filter(t => t.name.trim()).map(t => ({
      name: t.name.trim(),
      quantity: t.quantity,
      specifications: t.specifications.trim() || undefined,
      duration: t.duration.trim() || undefined,
    }));

    setIsLoading(true);
    try {
      // For now, submit the first tool as a single request
      // In a real implementation, you might want to submit multiple requests or update the API
      const firstTool = validTools[0];
      if (!firstTool) {
        Alert.alert('Error', 'Please add at least one tool to the request');
        return;
      }

      const response = await workerApiService.submitToolRequest({
        projectId: 1, // This should come from context/props
        itemName: firstTool.name,
        itemCategory: 'other' as const, // Default category, could be made selectable
        quantity: firstTool.quantity,
        unit: 'piece', // Default unit
        urgency: priority.toUpperCase() as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
        requiredDate,
        purpose: title.trim(),
        justification: description.trim(),
        specifications: firstTool.specifications,
      });

      if (response.success) {
        Alert.alert(
          'Request Submitted',
          'Your tool request has been submitted successfully. You will be notified when it is reviewed.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit tool request');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit tool request');
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

  const addToolItem = () => {
    const newId = (tools.length + 1).toString();
    setTools([...tools, { id: newId, name: '', quantity: 1, specifications: '', duration: '1 week' }]);
  };

  const removeToolItem = (id: string) => {
    if (tools.length > 1) {
      setTools(tools.filter(t => t.id !== id));
    }
  };

  const updateToolItem = (id: string, field: keyof ToolItem, value: string | number) => {
    setTools(tools.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Submitting tool request..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tool Request</Text>
          <Text style={styles.headerSubtitle}>
            Request tools and equipment for construction work
          </Text>
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
              placeholder="e.g., Power tools for concrete work"
              placeholderTextColor="#9E9E9E"
              maxLength={100}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Priority */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priority *</Text>
            <View style={styles.priorityContainer}>
              {PRIORITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.priorityOption,
                    priority === option.value && styles.priorityOptionSelected,
                    { borderLeftColor: option.color },
                  ]}
                  onPress={() => setPriority(option.value)}
                >
                  <View style={styles.priorityHeader}>
                    <Text
                      style={[
                        styles.priorityLabel,
                        priority === option.value && styles.priorityLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <View
                      style={[
                        styles.radioButton,
                        priority === option.value && styles.radioButtonSelected,
                      ]}
                    >
                      {priority === option.value && <View style={styles.radioButtonInner} />}
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.priorityDescription,
                      priority === option.value && styles.priorityDescriptionSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Required Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Required Date *</Text>
            <TouchableOpacity
              style={[styles.dateButton, errors.requiredDate && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDate(requiredDate)}</Text>
            </TouchableOpacity>
            {errors.requiredDate && <Text style={styles.errorText}>{errors.requiredDate}</Text>}
          </View>

          {/* Tool Items */}
          <View style={styles.inputGroup}>
            <View style={styles.toolsHeader}>
              <Text style={styles.label}>Tool Items *</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addToolItem}
              >
                <Text style={styles.addButtonText}>+ Add Tool</Text>
              </TouchableOpacity>
            </View>

            {tools.map((tool, index) => (
              <View key={tool.id} style={styles.toolItem}>
                <View style={styles.toolItemHeader}>
                  <Text style={styles.toolItemTitle}>Tool {index + 1}</Text>
                  {tools.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeToolItem(tool.id)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={styles.input}
                  value={tool.name}
                  onChangeText={(value) => updateToolItem(tool.id, 'name', value)}
                  placeholder="Tool name (e.g., Concrete mixer, Drill, Hammer)"
                  placeholderTextColor="#9E9E9E"
                  maxLength={100}
                />

                <View style={styles.quantityRow}>
                  <View style={styles.quantityInput}>
                    <Text style={styles.quantityLabel}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={tool.quantity.toString()}
                      onChangeText={(value) => {
                        const num = parseInt(value) || 1;
                        updateToolItem(tool.id, 'quantity', Math.max(1, num));
                      }}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>

                  <View style={styles.durationInput}>
                    <Text style={styles.quantityLabel}>Duration Needed</Text>
                    <TextInput
                      style={styles.input}
                      value={tool.duration}
                      onChangeText={(value) => updateToolItem(tool.id, 'duration', value)}
                      placeholder="e.g., 1 week"
                    />
                  </View>
                </View>

                <TextInput
                  style={styles.textArea}
                  value={tool.specifications}
                  onChangeText={(value) => updateToolItem(tool.id, 'specifications', value)}
                  placeholder="Specifications (optional) - model, power, size, special features, etc."
                  placeholderTextColor="#9E9E9E"
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  maxLength={200}
                />
              </View>
            ))}

            {errors.tools && <Text style={styles.errorText}>{errors.tools}</Text>}
            {errors.quantities && <Text style={styles.errorText}>{errors.quantities}</Text>}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Details *</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide additional details about your tool request, including purpose, specific work tasks, location where tools will be used, and any special requirements..."
              placeholderTextColor="#9E9E9E"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            <Text style={styles.characterCount}>{description.length}/500</Text>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!title.trim() || !description.trim() || !tools.some(t => t.name.trim())) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!title.trim() || !description.trim() || !tools.some(t => t.name.trim())}
          >
            <Text style={styles.submitButtonText}>Submit Tool Request</Text>
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
    minHeight: 80,
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
  priorityContainer: {
    gap: 8,
  },
  priorityOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 16,
  },
  priorityOptionSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  priorityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  priorityLabelSelected: {
    color: '#2196F3',
  },
  priorityDescription: {
    fontSize: 14,
    color: '#757575',
  },
  priorityDescriptionSelected: {
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
  toolsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toolItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toolItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  removeButton: {
    backgroundColor: '#F44336',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  quantityInput: {
    flex: 1,
  },
  durationInput: {
    flex: 2,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
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

export default ToolRequestScreen;