// Task Assignment Form Component for Supervisor Task Management
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { TaskAssignmentRequest, TeamMember } from '../../types';
import ConstructionCard from '../common/ConstructionCard';
import ConstructionInput from '../common/ConstructionInput';
import ConstructionButton from '../common/ConstructionButton';
import ConstructionSelector from '../common/ConstructionSelector';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface TaskAssignmentFormProps {
  workers: TeamMember[];
  availableTasks: Array<{
    id: number;
    name: string;
    description: string;
    estimatedHours: number;
    requiredSkills: string[];
    dependencies: number[];
  }>;
  onSubmit: (assignment: TaskAssignmentRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: Partial<TaskAssignmentRequest>;
}

const TaskAssignmentForm: React.FC<TaskAssignmentFormProps> = ({
  workers,
  availableTasks,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}) => {
  const [formData, setFormData] = useState<TaskAssignmentRequest>({
    workerId: initialData?.workerId || 0,
    taskId: initialData?.taskId || 0,
    priority: initialData?.priority || 'normal',
    estimatedHours: initialData?.estimatedHours || 0,
    instructions: initialData?.instructions || '',
    requiredSkills: initialData?.requiredSkills || [],
    dependencies: initialData?.dependencies || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedTask, setSelectedTask] = useState<typeof availableTasks[0] | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (formData.taskId) {
      const task = availableTasks.find(t => t.id === formData.taskId);
      setSelectedTask(task || null);
      if (task && formData.estimatedHours === 0) {
        setFormData(prev => ({ ...prev, estimatedHours: task.estimatedHours }));
      }
    }
  }, [formData.taskId, availableTasks]);

  useEffect(() => {
    if (formData.workerId) {
      const worker = workers.find(w => w.id === formData.workerId);
      setSelectedWorker(worker || null);
    }
  }, [formData.workerId, workers]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.workerId) {
      newErrors.workerId = 'Please select a worker';
    }

    if (!formData.taskId) {
      newErrors.taskId = 'Please select a task';
    }

    if (formData.estimatedHours <= 0) {
      newErrors.estimatedHours = 'Estimated hours must be greater than 0';
    }

    if (formData.estimatedHours > 24) {
      newErrors.estimatedHours = 'Estimated hours cannot exceed 24 hours per day';
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Please provide task instructions';
    }

    if (formData.instructions.length > 500) {
      newErrors.instructions = 'Instructions cannot exceed 500 characters';
    }

    // Validate worker skills against required skills
    if (selectedWorker && selectedTask) {
      const workerSkills = selectedWorker.certifications.map(cert => cert.name.toLowerCase());
      const missingSkills = selectedTask.requiredSkills.filter(
        skill => !workerSkills.includes(skill.toLowerCase())
      );
      
      if (missingSkills.length > 0) {
        newErrors.skills = `Worker missing required skills: ${missingSkills.join(', ')}`;
      }
    }

    // Validate worker availability
    if (selectedWorker && selectedWorker.currentTask) {
      newErrors.availability = 'Worker is currently assigned to another task';
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
      Alert.alert('Error', 'Failed to assign task. Please try again.');
    }
  };

  const handleFieldChange = (field: keyof TaskAssignmentRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const workerOptions = workers.map(worker => ({
    label: `${worker.name} (${worker.role})`,
    value: worker.id,
    icon: worker.attendanceStatus === 'present' ? '✅' : '❌',
    disabled: worker.attendanceStatus !== 'present' || !!worker.currentTask,
  }));

  const taskOptions = availableTasks.map(task => ({
    label: task.name,
    value: task.id,
    icon: '📋',
  }));

  const priorityOptions = [
    { label: 'Low Priority', value: 'low', icon: '🟢' },
    { label: 'Normal Priority', value: 'normal', icon: '🟡' },
    { label: 'High Priority', value: 'high', icon: '🟠' },
    { label: 'Urgent', value: 'urgent', icon: '🔴' },
  ];

  const skillOptions = [
    { label: 'Concrete Work', value: 'concrete' },
    { label: 'Steel Work', value: 'steel' },
    { label: 'Electrical', value: 'electrical' },
    { label: 'Plumbing', value: 'plumbing' },
    { label: 'Carpentry', value: 'carpentry' },
    { label: 'Masonry', value: 'masonry' },
    { label: 'Painting', value: 'painting' },
    { label: 'Roofing', value: 'roofing' },
    { label: 'HVAC', value: 'hvac' },
    { label: 'Safety', value: 'safety' },
  ];

  const dependencyOptions = availableTasks
    .filter(task => task.id !== formData.taskId)
    .map(task => ({
      label: task.name,
      value: task.id,
    }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ConstructionCard title="Task Assignment" variant="elevated">
        <View style={styles.formContent}>
          {/* Worker Selection */}
          <ConstructionSelector
            label="Select Worker *"
            value={formData.workerId}
            options={workerOptions}
            onSelect={(value) => handleFieldChange('workerId', value)}
            placeholder="Choose a worker"
            error={errors.workerId || errors.availability}
          />

          {/* Selected Worker Info */}
          {selectedWorker && (
            <ConstructionCard variant="outlined" style={styles.workerInfo}>
              <Text style={styles.workerInfoTitle}>Worker Information</Text>
              <Text style={styles.workerInfoText}>
                Status: {selectedWorker.attendanceStatus.replace('_', ' ').toUpperCase()}
              </Text>
              {selectedWorker.currentTask && (
                <Text style={styles.workerInfoText}>
                  Current Task: {selectedWorker.currentTask.name} ({selectedWorker.currentTask.progress}%)
                </Text>
              )}
              <Text style={styles.workerInfoText}>
                Certifications: {selectedWorker.certifications.map(c => c.name).join(', ') || 'None'}
              </Text>
            </ConstructionCard>
          )}

          {/* Task Selection */}
          <ConstructionSelector
            label="Select Task *"
            value={formData.taskId}
            options={taskOptions}
            onSelect={(value) => handleFieldChange('taskId', value)}
            placeholder="Choose a task"
            error={errors.taskId}
          />

          {/* Selected Task Info */}
          {selectedTask && (
            <ConstructionCard variant="outlined" style={styles.taskInfo}>
              <Text style={styles.taskInfoTitle}>Task Information</Text>
              <Text style={styles.taskInfoText}>
                Description: {selectedTask.description}
              </Text>
              <Text style={styles.taskInfoText}>
                Estimated Hours: {selectedTask.estimatedHours}
              </Text>
              {selectedTask.requiredSkills.length > 0 && (
                <Text style={styles.taskInfoText}>
                  Required Skills: {selectedTask.requiredSkills.join(', ')}
                </Text>
              )}
              {selectedTask.dependencies.length > 0 && (
                <Text style={styles.taskInfoText}>
                  Dependencies: {selectedTask.dependencies.length} task(s)
                </Text>
              )}
            </ConstructionCard>
          )}

          {/* Priority Selection */}
          <ConstructionSelector
            label="Priority *"
            value={formData.priority}
            options={priorityOptions}
            onSelect={(value) => handleFieldChange('priority', value)}
            placeholder="Select priority level"
          />

          {/* Estimated Hours */}
          <ConstructionInput
            label="Estimated Hours *"
            value={formData.estimatedHours.toString()}
            onChangeText={(text) => {
              const hours = parseFloat(text) || 0;
              handleFieldChange('estimatedHours', hours);
            }}
            keyboardType="numeric"
            placeholder="Enter estimated hours"
            error={errors.estimatedHours}
            maxLength={5}
          />

          {/* Instructions */}
          <ConstructionInput
            label="Task Instructions *"
            value={formData.instructions}
            onChangeText={(text) => handleFieldChange('instructions', text)}
            placeholder="Provide detailed instructions for the worker"
            multiline
            numberOfLines={4}
            error={errors.instructions}
            maxLength={500}
            showCharacterCount
          />

          {/* Required Skills */}
          <ConstructionSelector
            label="Required Skills"
            selectedValues={formData.requiredSkills}
            options={skillOptions}
            onMultiSelect={(values) => handleFieldChange('requiredSkills', values)}
            placeholder="Select required skills"
            multiple
            error={errors.skills}
          />

          {/* Dependencies */}
          {dependencyOptions.length > 0 && (
            <ConstructionSelector
              label="Task Dependencies"
              selectedValues={formData.dependencies}
              options={dependencyOptions}
              onMultiSelect={(values) => handleFieldChange('dependencies', values)}
              placeholder="Select prerequisite tasks"
              multiple
            />
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
              title="Assign Task"
              onPress={handleSubmit}
              variant="primary"
              style={styles.submitButton}
              loading={isLoading}
              disabled={isLoading}
              icon="✅"
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
  workerInfo: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  workerInfoTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
    fontWeight: '600',
  },
  workerInfoText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  taskInfo: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  taskInfoTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
    fontWeight: '600',
  },
  taskInfoText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
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
});

export default TaskAssignmentForm;