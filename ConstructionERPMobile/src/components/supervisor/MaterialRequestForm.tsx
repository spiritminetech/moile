// Material Request Form Component for Supervisor Resource Management
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialRequest } from '../../types';
import ConstructionCard from '../common/ConstructionCard';
import ConstructionInput from '../common/ConstructionInput';
import ConstructionButton from '../common/ConstructionButton';
import ConstructionSelector from '../common/ConstructionSelector';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface MaterialRequestFormProps {
  projectId: number;
  requesterId: number;
  onSubmit: (request: Omit<MaterialRequest, 'id' | 'status'>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: Partial<MaterialRequest>;
}

const MaterialRequestForm: React.FC<MaterialRequestFormProps> = ({
  projectId,
  requesterId,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    projectId,
    requesterId,
    itemName: initialData?.itemName || '',
    category: initialData?.category || '',
    quantity: initialData?.quantity || 0,
    unit: initialData?.unit || '',
    urgency: initialData?.urgency || 'normal' as const,
    requiredDate: initialData?.requiredDate || new Date(),
    purpose: initialData?.purpose || '',
    justification: initialData?.justification || '',
    estimatedCost: initialData?.estimatedCost || undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Material name is required';
    }

    if (formData.itemName.length > 100) {
      newErrors.itemName = 'Material name cannot exceed 100 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.quantity > 10000) {
      newErrors.quantity = 'Quantity seems unreasonably high';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit of measurement is required';
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }

    if (formData.purpose.length > 200) {
      newErrors.purpose = 'Purpose cannot exceed 200 characters';
    }

    if (!formData.justification.trim()) {
      newErrors.justification = 'Justification is required';
    }

    if (formData.justification.length > 500) {
      newErrors.justification = 'Justification cannot exceed 500 characters';
    }

    if (formData.requiredDate <= new Date()) {
      newErrors.requiredDate = 'Required date must be in the future';
    }

    if (formData.estimatedCost !== undefined && formData.estimatedCost < 0) {
      newErrors.estimatedCost = 'Estimated cost cannot be negative';
    }

    if (formData.estimatedCost !== undefined && formData.estimatedCost > 100000) {
      newErrors.estimatedCost = 'Estimated cost seems unreasonably high';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit material request. Please try again.');
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const categoryOptions = [
    { label: 'Concrete & Cement', value: 'concrete', icon: '🏗️' },
    { label: 'Steel & Rebar', value: 'steel', icon: '🔩' },
    { label: 'Lumber & Wood', value: 'lumber', icon: '🪵' },
    { label: 'Electrical Supplies', value: 'electrical', icon: '⚡' },
    { label: 'Plumbing Supplies', value: 'plumbing', icon: '🔧' },
    { label: 'Insulation', value: 'insulation', icon: '🧱' },
    { label: 'Roofing Materials', value: 'roofing', icon: '🏠' },
    { label: 'Paint & Finishes', value: 'paint', icon: '🎨' },
    { label: 'Hardware & Fasteners', value: 'hardware', icon: '🔨' },
    { label: 'Safety Equipment', value: 'safety', icon: '🦺' },
    { label: 'Tools & Equipment', value: 'tools', icon: '🛠️' },
    { label: 'Other', value: 'other', icon: '📦' },
  ];

  const unitOptions = [
    { label: 'Pieces (pcs)', value: 'pcs' },
    { label: 'Kilograms (kg)', value: 'kg' },
    { label: 'Tons (t)', value: 't' },
    { label: 'Meters (m)', value: 'm' },
    { label: 'Square Meters (m²)', value: 'm2' },
    { label: 'Cubic Meters (m³)', value: 'm3' },
    { label: 'Liters (L)', value: 'L' },
    { label: 'Bags', value: 'bags' },
    { label: 'Boxes', value: 'boxes' },
    { label: 'Rolls', value: 'rolls' },
    { label: 'Sheets', value: 'sheets' },
    { label: 'Sets', value: 'sets' },
  ];

  const urgencyOptions = [
    { label: 'Low Priority', value: 'low', icon: '🟢' },
    { label: 'Normal Priority', value: 'normal', icon: '🟡' },
    { label: 'High Priority', value: 'high', icon: '🟠' },
    { label: 'Urgent', value: 'urgent', icon: '🔴' },
  ];

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string): Date => {
    return new Date(dateString + 'T00:00:00');
  };

  const getEstimatedTotal = (): number => {
    if (formData.estimatedCost && formData.quantity) {
      return formData.estimatedCost * formData.quantity;
    }
    return 0;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ConstructionCard title="Material Request" variant="elevated">
        <View style={styles.formContent}>
          {/* Material Information */}
          <Text style={styles.sectionTitle}>Material Information</Text>
          
          <ConstructionInput
            label="Material Name *"
            value={formData.itemName}
            onChangeText={(text) => handleFieldChange('itemName', text)}
            placeholder="Enter material name"
            error={errors.itemName}
            maxLength={100}
            showCharacterCount
          />

          <ConstructionSelector
            label="Category *"
            value={formData.category}
            options={categoryOptions}
            onSelect={(value) => handleFieldChange('category', value)}
            placeholder="Select material category"
            error={errors.category}
          />

          <View style={styles.quantityRow}>
            <ConstructionInput
              label="Quantity *"
              value={formData.quantity.toString()}
              onChangeText={(text) => {
                const quantity = parseFloat(text) || 0;
                handleFieldChange('quantity', quantity);
              }}
              keyboardType="numeric"
              placeholder="0"
              error={errors.quantity}
              style={styles.quantityInput}
            />

            <ConstructionSelector
              label="Unit *"
              value={formData.unit}
              options={unitOptions}
              onSelect={(value) => handleFieldChange('unit', value)}
              placeholder="Select unit"
              error={errors.unit}
              style={styles.unitSelector}
            />
          </View>

          {/* Request Details */}
          <Text style={styles.sectionTitle}>Request Details</Text>

          <ConstructionSelector
            label="Priority *"
            value={formData.urgency}
            options={urgencyOptions}
            onSelect={(value) => handleFieldChange('urgency', value)}
            placeholder="Select priority level"
          />

          <ConstructionInput
            label="Required Date *"
            value={formatDate(formData.requiredDate)}
            onChangeText={(text) => {
              try {
                const date = parseDate(text);
                handleFieldChange('requiredDate', date);
              } catch (error) {
                // Invalid date format, ignore
              }
            }}
            placeholder="YYYY-MM-DD"
            error={errors.requiredDate}
          />

          <ConstructionInput
            label="Purpose *"
            value={formData.purpose}
            onChangeText={(text) => handleFieldChange('purpose', text)}
            placeholder="What will this material be used for?"
            error={errors.purpose}
            maxLength={200}
            showCharacterCount
          />

          <ConstructionInput
            label="Justification *"
            value={formData.justification}
            onChangeText={(text) => handleFieldChange('justification', text)}
            placeholder="Why is this material needed? Provide detailed justification..."
            multiline
            numberOfLines={4}
            error={errors.justification}
            maxLength={500}
            showCharacterCount
          />

          {/* Cost Information */}
          <Text style={styles.sectionTitle}>Cost Information (Optional)</Text>

          <ConstructionInput
            label="Estimated Unit Cost"
            value={formData.estimatedCost?.toString() || ''}
            onChangeText={(text) => {
              const cost = parseFloat(text) || undefined;
              handleFieldChange('estimatedCost', cost);
            }}
            keyboardType="numeric"
            placeholder="0.00"
            error={errors.estimatedCost}
            icon="💰"
          />

          {/* Cost Summary */}
          {formData.estimatedCost && formData.quantity > 0 && (
            <ConstructionCard variant="outlined" style={styles.costSummary}>
              <Text style={styles.costSummaryTitle}>Cost Summary</Text>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Unit Cost:</Text>
                <Text style={styles.costValue}>${formData.estimatedCost.toFixed(2)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Quantity:</Text>
                <Text style={styles.costValue}>{formData.quantity} {formData.unit}</Text>
              </View>
              <View style={[styles.costRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Estimated Cost:</Text>
                <Text style={styles.totalValue}>${getEstimatedTotal().toFixed(2)}</Text>
              </View>
            </ConstructionCard>
          )}

          {/* Form Actions */}
          <View style={styles.actionButtons}>
            {onCancel && (
              <ConstructionButton
                title="Cancel"
                onPress={onCancel}
                variant="outline"
                style={styles.cancelButton}
                disabled={isLoading}
              />
            )}
            
            <ConstructionButton
              title="Submit Request"
              onPress={handleSubmit}
              variant="primary"
              style={styles.submitButton}
              loading={isLoading}
              disabled={isLoading}
              icon="📦"
            />
          </View>

          {/* Validation Summary */}
          {Object.keys(errors).length > 0 && (
            <ConstructionCard variant="error" style={styles.errorSummary}>
              <Text style={styles.errorSummaryTitle}>Please fix the following errors:</Text>
              {Object.entries(errors).map(([field, error]) => (
                <Text key={field} style={styles.errorSummaryText}>
                  • {error}
                </Text>
              ))}
            </ConstructionCard>
          )}

          {/* Guidelines */}
          <ConstructionCard variant="outlined" style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>📋 Request Guidelines</Text>
            <Text style={styles.guidelinesText}>
              • Provide accurate quantities and specifications
            </Text>
            <Text style={styles.guidelinesText}>
              • Include detailed justification for approval
            </Text>
            <Text style={styles.guidelinesText}>
              • Allow sufficient lead time for procurement
            </Text>
            <Text style={styles.guidelinesText}>
              • Urgent requests may require additional approval
            </Text>
          </ConstructionCard>
        </View>
      </ConstructionCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  formContent: {
    gap: ConstructionTheme.spacing.md,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginTop: ConstructionTheme.spacing.lg,
    marginBottom: ConstructionTheme.spacing.sm,
    fontWeight: '600',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
  },
  quantityInput: {
    flex: 2,
  },
  unitSelector: {
    flex: 3,
  },
  costSummary: {
    marginTop: ConstructionTheme.spacing.md,
  },
  costSummaryTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
    fontWeight: '600',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  costLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  costValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.neutral,
    paddingTop: ConstructionTheme.spacing.sm,
    marginTop: ConstructionTheme.spacing.sm,
  },
  totalLabel: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
  },
  totalValue: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  errorSummary: {
    marginTop: ConstructionTheme.spacing.md,
  },
  errorSummaryTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.error,
    marginBottom: ConstructionTheme.spacing.sm,
    fontWeight: '600',
  },
  errorSummaryText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.error,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  guidelines: {
    marginTop: ConstructionTheme.spacing.lg,
  },
  guidelinesTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
    fontWeight: '600',
  },
  guidelinesText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
});

export default MaterialRequestForm;