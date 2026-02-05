// Progress Report Form Component for Supervisor Daily Reporting
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { ProgressReport, ReportPhoto } from '../../types';
import ConstructionCard from '../common/ConstructionCard';
import ConstructionInput from '../common/ConstructionInput';
import ConstructionButton from '../common/ConstructionButton';
import ConstructionSelector from '../common/ConstructionSelector';
import PhotoManager from '../forms/PhotoManager';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface ProgressReportFormProps {
  projectId: number;
  onSubmit: (report: Omit<ProgressReport, 'reportId'>) => Promise<void>;
  onSaveDraft?: (report: Partial<ProgressReport>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: Partial<ProgressReport>;
}

const ProgressReportForm: React.FC<ProgressReportFormProps> = ({
  projectId,
  onSubmit,
  onSaveDraft,
  onCancel,
  isLoading = false,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    projectId,
    manpowerUtilization: {
      totalWorkers: initialData?.manpowerUtilization?.totalWorkers || 0,
      activeWorkers: initialData?.manpowerUtilization?.activeWorkers || 0,
      productivity: initialData?.manpowerUtilization?.productivity || 0,
      efficiency: initialData?.manpowerUtilization?.efficiency || 0,
    },
    progressMetrics: {
      overallProgress: initialData?.progressMetrics?.overallProgress || 0,
      milestonesCompleted: initialData?.progressMetrics?.milestonesCompleted || 0,
      tasksCompleted: initialData?.progressMetrics?.tasksCompleted || 0,
      hoursWorked: initialData?.progressMetrics?.hoursWorked || 0,
    },
    issues: initialData?.issues || [],
    materialConsumption: initialData?.materialConsumption || [],
    photos: initialData?.photos || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentIssue, setCurrentIssue] = useState({
    type: 'quality' as const,
    description: '',
    severity: 'medium' as const,
    status: 'open' as const,
  });
  const [currentMaterial, setCurrentMaterial] = useState({
    materialId: 0,
    name: '',
    consumed: 0,
    remaining: 0,
    unit: '',
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.manpowerUtilization.totalWorkers < 0) {
      newErrors.totalWorkers = 'Total workers cannot be negative';
    }

    if (formData.manpowerUtilization.activeWorkers > formData.manpowerUtilization.totalWorkers) {
      newErrors.activeWorkers = 'Active workers cannot exceed total workers';
    }

    if (formData.progressMetrics.overallProgress < 0 || formData.progressMetrics.overallProgress > 100) {
      newErrors.overallProgress = 'Overall progress must be between 0 and 100';
    }

    if (formData.progressMetrics.hoursWorked < 0) {
      newErrors.hoursWorked = 'Hours worked cannot be negative';
    }

    if (formData.progressMetrics.hoursWorked > formData.manpowerUtilization.totalWorkers * 24) {
      newErrors.hoursWorked = 'Hours worked seems unreasonably high';
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
      Alert.alert('Error', 'Failed to submit progress report. Please try again.');
    }
  };

  const handleSaveDraft = async () => {
    if (onSaveDraft) {
      try {
        await onSaveDraft(formData);
        Alert.alert('Success', 'Draft saved successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to save draft. Please try again.');
      }
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addIssue = () => {
    if (!currentIssue.description.trim()) {
      Alert.alert('Error', 'Please provide issue description');
      return;
    }

    const newIssue = {
      ...currentIssue,
      description: currentIssue.description.trim(),
    };

    setFormData(prev => ({
      ...prev,
      issues: [...prev.issues, newIssue],
    }));

    setCurrentIssue({
      type: 'quality',
      description: '',
      severity: 'medium',
      status: 'open',
    });
  };

  const removeIssue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.filter((_, i) => i !== index),
    }));
  };

  const addMaterial = () => {
    if (!currentMaterial.name.trim() || currentMaterial.consumed <= 0) {
      Alert.alert('Error', 'Please provide material name and consumed quantity');
      return;
    }

    const newMaterial = {
      ...currentMaterial,
      materialId: Date.now(), // Simple ID generation
      name: currentMaterial.name.trim(),
    };

    setFormData(prev => ({
      ...prev,
      materialConsumption: [...prev.materialConsumption, newMaterial],
    }));

    setCurrentMaterial({
      materialId: 0,
      name: '',
      consumed: 0,
      remaining: 0,
      unit: '',
    });
  };

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materialConsumption: prev.materialConsumption.filter((_, i) => i !== index),
    }));
  };

  const handlePhotosChange = (photos: ReportPhoto[]) => {
    setFormData(prev => ({ ...prev, photos }));
  };

  const issueTypeOptions = [
    { label: 'Safety Issue', value: 'safety', icon: '⚠️' },
    { label: 'Quality Issue', value: 'quality', icon: '🔍' },
    { label: 'Delay', value: 'delay', icon: '⏰' },
    { label: 'Resource Issue', value: 'resource', icon: '📦' },
  ];

  const severityOptions = [
    { label: 'Low', value: 'low', icon: '🟢' },
    { label: 'Medium', value: 'medium', icon: '🟡' },
    { label: 'High', value: 'high', icon: '🟠' },
    { label: 'Critical', value: 'critical', icon: '🔴' },
  ];

  const statusOptions = [
    { label: 'Open', value: 'open', icon: '🔓' },
    { label: 'In Progress', value: 'in_progress', icon: '🔄' },
    { label: 'Resolved', value: 'resolved', icon: '✅' },
  ];

  const unitOptions = [
    { label: 'kg', value: 'kg' },
    { label: 'tons', value: 't' },
    { label: 'pieces', value: 'pcs' },
    { label: 'meters', value: 'm' },
    { label: 'm²', value: 'm2' },
    { label: 'm³', value: 'm3' },
    { label: 'liters', value: 'L' },
    { label: 'bags', value: 'bags' },
  ];

  const getIssueIcon = (type: string): string => {
    const option = issueTypeOptions.find(opt => opt.value === type);
    return option?.icon || '📋';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return ConstructionTheme.colors.error;
      case 'high':
        return ConstructionTheme.colors.warning;
      case 'medium':
        return ConstructionTheme.colors.info;
      case 'low':
        return ConstructionTheme.colors.success;
      default:
        return ConstructionTheme.colors.neutral;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ConstructionCard title="Daily Progress Report" variant="elevated">
        <View style={styles.formContent}>
          {/* Report Date */}
          <ConstructionInput
            label="Report Date *"
            value={formData.date}
            onChangeText={(text) => handleFieldChange('date', text)}
            placeholder="YYYY-MM-DD"
          />

          {/* Manpower Utilization */}
          <Text style={styles.sectionTitle}>👥 Manpower Utilization</Text>
          
          <View style={styles.row}>
            <ConstructionInput
              label="Total Workers"
              value={formData.manpowerUtilization.totalWorkers.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 0;
                handleFieldChange('manpowerUtilization.totalWorkers', value);
              }}
              keyboardType="numeric"
              style={styles.halfInput}
              error={errors.totalWorkers}
            />

            <ConstructionInput
              label="Active Workers"
              value={formData.manpowerUtilization.activeWorkers.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 0;
                handleFieldChange('manpowerUtilization.activeWorkers', value);
              }}
              keyboardType="numeric"
              style={styles.halfInput}
              error={errors.activeWorkers}
            />
          </View>

          <View style={styles.row}>
            <ConstructionInput
              label="Productivity %"
              value={formData.manpowerUtilization.productivity.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                handleFieldChange('manpowerUtilization.productivity', value);
              }}
              keyboardType="numeric"
              style={styles.halfInput}
            />

            <ConstructionInput
              label="Efficiency %"
              value={formData.manpowerUtilization.efficiency.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text) || 0;
                handleFieldChange('manpowerUtilization.efficiency', value);
              }}
              keyboardType="numeric"
              style={styles.halfInput}
            />
          </View>

          {/* Progress Metrics */}
          <Text style={styles.sectionTitle}>📊 Progress Metrics</Text>

          <ConstructionInput
            label="Overall Progress %"
            value={formData.progressMetrics.overallProgress.toString()}
            onChangeText={(text) => {
              const value = parseFloat(text) || 0;
              handleFieldChange('progressMetrics.overallProgress', value);
            }}
            keyboardType="numeric"
            error={errors.overallProgress}
          />

          <View style={styles.row}>
            <ConstructionInput
              label="Milestones Completed"
              value={formData.progressMetrics.milestonesCompleted.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 0;
                handleFieldChange('progressMetrics.milestonesCompleted', value);
              }}
              keyboardType="numeric"
              style={styles.halfInput}
            />

            <ConstructionInput
              label="Tasks Completed"
              value={formData.progressMetrics.tasksCompleted.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 0;
                handleFieldChange('progressMetrics.tasksCompleted', value);
              }}
              keyboardType="numeric"
              style={styles.halfInput}
            />
          </View>

          <ConstructionInput
            label="Total Hours Worked"
            value={formData.progressMetrics.hoursWorked.toString()}
            onChangeText={(text) => {
              const value = parseFloat(text) || 0;
              handleFieldChange('progressMetrics.hoursWorked', value);
            }}
            keyboardType="numeric"
            error={errors.hoursWorked}
          />

          {/* Issues */}
          <Text style={styles.sectionTitle}>⚠️ Issues & Incidents</Text>

          {/* Current Issues List */}
          {formData.issues.length > 0 && (
            <View style={styles.issuesList}>
              {formData.issues.map((issue, index) => (
                <ConstructionCard key={index} variant="outlined" style={styles.issueCard}>
                  <View style={styles.issueHeader}>
                    <Text style={styles.issueIcon}>{getIssueIcon(issue.type)}</Text>
                    <Text style={styles.issueType}>{issue.type.replace('_', ' ').toUpperCase()}</Text>
                    <Text style={[
                      styles.issueSeverity,
                      { color: getSeverityColor(issue.severity) }
                    ]}>
                      {issue.severity.toUpperCase()}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeIssue(index)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.issueDescription}>{issue.description}</Text>
                </ConstructionCard>
              ))}
            </View>
          )}

          {/* Add New Issue */}
          <ConstructionCard variant="outlined" style={styles.addIssueCard}>
            <Text style={styles.addIssueTitle}>Add New Issue</Text>
            
            <ConstructionSelector
              label="Issue Type"
              value={currentIssue.type}
              options={issueTypeOptions}
              onSelect={(value) => setCurrentIssue(prev => ({ ...prev, type: value as any }))}
            />

            <ConstructionSelector
              label="Severity"
              value={currentIssue.severity}
              options={severityOptions}
              onSelect={(value) => setCurrentIssue(prev => ({ ...prev, severity: value as any }))}
            />

            <ConstructionInput
              label="Description"
              value={currentIssue.description}
              onChangeText={(text) => setCurrentIssue(prev => ({ ...prev, description: text }))}
              placeholder="Describe the issue..."
              multiline
              numberOfLines={3}
            />

            <ConstructionButton
              title="Add Issue"
              onPress={addIssue}
              variant="outline"
              size="small"
              icon="➕"
            />
          </ConstructionCard>

          {/* Material Consumption */}
          <Text style={styles.sectionTitle}>📦 Material Consumption</Text>

          {/* Current Materials List */}
          {formData.materialConsumption.length > 0 && (
            <View style={styles.materialsList}>
              {formData.materialConsumption.map((material, index) => (
                <ConstructionCard key={index} variant="outlined" style={styles.materialCard}>
                  <View style={styles.materialHeader}>
                    <Text style={styles.materialName}>{material.name}</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeMaterial(index)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.materialDetails}>
                    Consumed: {material.consumed} {material.unit} | Remaining: {material.remaining} {material.unit}
                  </Text>
                </ConstructionCard>
              ))}
            </View>
          )}

          {/* Add New Material */}
          <ConstructionCard variant="outlined" style={styles.addMaterialCard}>
            <Text style={styles.addMaterialTitle}>Add Material Consumption</Text>
            
            <ConstructionInput
              label="Material Name"
              value={currentMaterial.name}
              onChangeText={(text) => setCurrentMaterial(prev => ({ ...prev, name: text }))}
              placeholder="Enter material name"
            />

            <View style={styles.row}>
              <ConstructionInput
                label="Consumed"
                value={currentMaterial.consumed.toString()}
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  setCurrentMaterial(prev => ({ ...prev, consumed: value }));
                }}
                keyboardType="numeric"
                style={styles.thirdInput}
              />

              <ConstructionInput
                label="Remaining"
                value={currentMaterial.remaining.toString()}
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  setCurrentMaterial(prev => ({ ...prev, remaining: value }));
                }}
                keyboardType="numeric"
                style={styles.thirdInput}
              />

              <ConstructionSelector
                label="Unit"
                value={currentMaterial.unit}
                options={unitOptions}
                onSelect={(value) => setCurrentMaterial(prev => ({ ...prev, unit: value as string }))}
                style={styles.thirdInput}
              />
            </View>

            <ConstructionButton
              title="Add Material"
              onPress={addMaterial}
              variant="outline"
              size="small"
              icon="➕"
            />
          </ConstructionCard>

          {/* Photo Documentation */}
          <Text style={styles.sectionTitle}>📷 Photo Documentation</Text>
          
          <PhotoManager
            photos={formData.photos}
            onPhotosChange={handlePhotosChange}
            maxPhotos={20}
            category="progress"
            label="Progress Photos"
          />

          {/* Form Actions */}
          <View style={styles.actionButtons}>
            {onCancel && (
              <ConstructionButton
                title="Cancel"
                onPress={onCancel}
                variant="outline"
                style={styles.actionButton}
                disabled={isLoading}
              />
            )}

            {onSaveDraft && (
              <ConstructionButton
                title="Save Draft"
                onPress={handleSaveDraft}
                variant="neutral"
                style={styles.actionButton}
                disabled={isLoading}
                icon="💾"
              />
            )}
            
            <ConstructionButton
              title="Submit Report"
              onPress={handleSubmit}
              variant="primary"
              style={styles.submitButton}
              loading={isLoading}
              disabled={isLoading}
              icon="📊"
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
  row: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  thirdInput: {
    flex: 1,
  },
  issuesList: {
    gap: ConstructionTheme.spacing.sm,
  },
  issueCard: {
    marginBottom: 0,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  issueIcon: {
    fontSize: ConstructionTheme.dimensions.iconMedium,
    marginRight: ConstructionTheme.spacing.sm,
  },
  issueType: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
    fontWeight: '600',
  },
  issueSeverity: {
    ...ConstructionTheme.typography.labelSmall,
    fontWeight: '600',
    marginRight: ConstructionTheme.spacing.sm,
  },
  issueDescription: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ConstructionTheme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: ConstructionTheme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  addIssueCard: {
    marginTop: ConstructionTheme.spacing.md,
  },
  addIssueTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
    fontWeight: '600',
  },
  materialsList: {
    gap: ConstructionTheme.spacing.sm,
  },
  materialCard: {
    marginBottom: 0,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  materialName: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    flex: 1,
  },
  materialDetails: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  addMaterialCard: {
    marginTop: ConstructionTheme.spacing.md,
  },
  addMaterialTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.md,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.lg,
  },
  actionButton: {
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
});

export default ProgressReportForm;