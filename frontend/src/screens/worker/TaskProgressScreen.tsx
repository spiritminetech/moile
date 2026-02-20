// Task Progress Update Screen - Update task progress with percentage slider and notes
// Requirements: 4.5

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { TaskAssignment, GeoLocation } from '../../types';
import { workerApiService } from '../../services/api/WorkerApiService';
import { useLocation } from '../../store/context/LocationContext';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import GPSAccuracyIndicator from '../../components/common/GPSAccuracyIndicator';

const TaskProgressScreen = ({ navigation, route }: any) => {
  const { taskId, currentProgress = 0 } = route.params;
  
  const [task, setTask] = useState<TaskAssignment | null>(null);
  const [progressPercent, setProgressPercent] = useState(currentProgress);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [completedQuantity, setCompletedQuantity] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { state: locationState, checkGPSAccuracy } = useLocation();
  const { currentLocation, isLocationEnabled, hasLocationPermission } = locationState;

  // Load task details
  const loadTaskDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await workerApiService.getTaskDetails(taskId);
      
      if (response.success) {
        // Map API response to TaskAssignment interface
        const mappedTask: TaskAssignment = {
          assignmentId: response.data.assignmentId,
          projectId: response.data.project?.id || 1, // Use project.id if available
          taskName: response.data.taskName,
          description: response.data.description,
          dependencies: response.data.dependencies || [],
          sequence: response.data.sequence,
          status: response.data.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
          location: { latitude: 0, longitude: 0, accuracy: 0, timestamp: new Date() }, // Default location
          estimatedHours: response.data.timeEstimate?.estimated || 8, // Use timeEstimate.estimated if available
          actualHours: response.data.timeEstimate?.elapsed,
          createdAt: new Date().toISOString(), // Default if not provided
          updatedAt: new Date().toISOString(), // Default if not provided
          startedAt: response.data.startTime || undefined,
          completedAt: undefined, // API doesn't provide this field
          dailyTarget: response.data.dailyTarget || undefined, // Include daily target data
        };
        setTask(mappedTask);
        
        // Set current progress from progressPercent or dailyTarget.progressToday
        let initialProgress = currentProgress || 0;
        
        // Priority 1: Use existing progressPercent from API
        if (response.data.progress?.percentage !== undefined) {
          initialProgress = response.data.progress.percentage;
        }
        // Priority 2: Use dailyTarget.progressToday.percentage
        else if (response.data.dailyTarget?.progressToday?.percentage !== undefined) {
          initialProgress = response.data.dailyTarget.progressToday.percentage;
        }
        // Priority 3: Calculate from actual/estimated hours (fallback)
        else if (mappedTask.actualHours !== undefined && mappedTask.estimatedHours) {
          initialProgress = Math.min(
            (mappedTask.actualHours / mappedTask.estimatedHours) * 100,
            100
          );
        }
        
        setProgressPercent(initialProgress);
        
        // Set completed quantity if available
        if (response.data.dailyTarget?.progressToday?.completed) {
          setCompletedQuantity(response.data.dailyTarget.progressToday.completed);
        }
      } else {
        setError(response.message || 'Failed to load task details');
      }
    } catch (err: any) {
      console.error('Error loading task details:', err);
      setError(err.message || 'Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadTaskDetails();
  }, [loadTaskDetails]);

  // Auto-start or resume task if needed before allowing progress updates
  const autoStartOrResumeTask = useCallback(async () => {
    if (!task || !currentLocation) return;
    
    // If task is pending or queued (paused), we need to start or resume it first
    if (task.status === 'pending' || task.status === 'queued') {
      try {
        console.log('🚀 Task is pending, attempting to start/resume...');
        
        // Try to resume first (for paused tasks)
        // If task was never started, resume will fail and we'll start it
        let response;
        try {
          console.log('   Attempting resume...');
          response = await workerApiService.resumeTask(
            task.assignmentId, 
            currentLocation
          );
          console.log('✅ Task resumed successfully');
        } catch (resumeError: any) {
          // If resume fails because task was never started, try starting it
          if (resumeError.details?.error === 'TASK_NEVER_STARTED' || 
              resumeError.details?.error === 'TASK_NOT_PAUSED') {
            console.log('   Resume failed, attempting start...');
            response = await workerApiService.startTask(
              task.assignmentId, 
              currentLocation
            );
            console.log('✅ Task started successfully');
          } else {
            throw resumeError;
          }
        }
        
        if (response.success) {
          // Reload task details to get updated status
          await loadTaskDetails();
        } else {
          Alert.alert(
            'Cannot Update Progress',
            response.message || 'Task must be started first. Please go back and start the task.',
            [
              {
                text: 'Go Back',
                onPress: () => navigation.goBack()
              }
            ]
          );
        }
      } catch (error: any) {
        console.error('❌ Error auto-starting/resuming task:', error);
        Alert.alert(
          'Cannot Update Progress',
          error.message || 'Failed to start task. Please go back and start the task manually.',
          [
            {
              text: 'Go Back',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    }
  }, [task, currentLocation, loadTaskDetails, navigation]);

  // Call auto-start/resume after loading task details
  useEffect(() => {
    if (task && currentLocation) {
      autoStartOrResumeTask();
    }
  }, [task, currentLocation, autoStartOrResumeTask]);

  // Validate form
  const validateForm = (): boolean => {
    if (!currentLocation) {
      Alert.alert(
        'Location Required',
        'Please enable location services to update task progress.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (!hasLocationPermission || !isLocationEnabled) {
      Alert.alert(
        'Location Permission Required',
        'Location access is required to update task progress. Please enable location services.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (description.trim().length < 10) {
      Alert.alert(
        'Description Required',
        'Please provide a detailed description of the work completed (minimum 10 characters).',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (progressPercent < 0 || progressPercent > 100) {
      Alert.alert(
        'Invalid Progress',
        'Progress percentage must be between 0 and 100.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  };

  // Handle progress update submission
  const handleSubmitProgress = useCallback(async () => {
    if (!validateForm() || !currentLocation) return;

    try {
      setIsSubmitting(true);

      const response = await workerApiService.updateTaskProgress(
        taskId,
        progressPercent,
        description.trim(),
        currentLocation,
        {
          notes: notes.trim(),
          completedQuantity: completedQuantity > 0 ? completedQuantity : undefined,
          issuesEncountered: []
        }
      );

      if (response.success) {
        Alert.alert(
          'Progress Updated',
          response.message || 'Task progress has been updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back and trigger refresh of task list
                navigation.navigate('TodaysTasks', { refresh: true });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Update Failed',
          response.message || 'Failed to update task progress. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      console.error('Error updating task progress:', err);
      Alert.alert(
        'Error',
        err.message || 'Failed to update task progress. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [taskId, progressPercent, description, notes, completedQuantity, currentLocation, navigation]);

  // Handle complete task
  const handleCompleteTask = useCallback(async () => {
    if (!currentLocation) {
      Alert.alert(
        'Location Required',
        'Please enable location services to complete the task.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Complete Task',
      'Are you sure you want to mark this task as completed? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);

              const response = await workerApiService.completeTask(taskId, currentLocation);

              if (response.success) {
                Alert.alert(
                  'Task Completed',
                  response.message || 'Task has been marked as completed.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Navigate back and trigger refresh of task list
                        navigation.navigate('TodaysTasks', { refresh: true });
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  'Completion Failed',
                  response.message || 'Failed to complete task. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (err: any) {
              console.error('Error completing task:', err);
              Alert.alert(
                'Error',
                err.message || 'Failed to complete task. Please check your connection and try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  }, [taskId, currentLocation, navigation]);

  // Get progress color
  const getProgressColor = (progress: number): string => {
    if (progress < 25) return '#F44336';
    if (progress < 50) return '#FF9800';
    if (progress < 75) return '#FFC107';
    if (progress < 100) return '#2196F3';
    return '#4CAF50';
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Loading task details..." />;
  }

  if (error || !task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Unable to Load Task</Text>
        <Text style={styles.errorMessage}>{error || 'Task not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadTaskDetails}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Task Information */}
      <View style={styles.taskInfoContainer}>
        <Text style={styles.taskName}>{task.taskName}</Text>
        <Text style={styles.taskDescription}>{task.description}</Text>
        <View style={styles.taskDetails}>
          <Text style={styles.detailText}>Estimated: {task.estimatedHours}h</Text>
          {task.actualHours !== undefined && (
            <Text style={styles.detailText}>Actual: {task.actualHours}h</Text>
          )}
        </View>
      </View>

      {/* GPS Accuracy Indicator */}
      <GPSAccuracyIndicator accuracyWarning={checkGPSAccuracy()} />

      {/* Progress Slider */}
      <View style={styles.progressContainer}>
        <Text style={styles.sectionTitle}>Progress Percentage</Text>
        {task?.dailyTarget && (
          <Text style={styles.helperText}>
            💡 Tip: Enter completed quantity below to auto-calculate progress
          </Text>
        )}
        <View style={styles.progressDisplay}>
          <Text style={[styles.progressText, { color: getProgressColor(progressPercent) }]}>
            {Math.round(progressPercent)}%
          </Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={progressPercent}
          onValueChange={setProgressPercent}
          minimumTrackTintColor={getProgressColor(progressPercent)}
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor={getProgressColor(progressPercent)}
          step={5}
        />
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>0%</Text>
          <Text style={styles.progressLabel}>25%</Text>
          <Text style={styles.progressLabel}>50%</Text>
          <Text style={styles.progressLabel}>75%</Text>
          <Text style={styles.progressLabel}>100%</Text>
        </View>
      </View>

      {/* Completed Quantity Input */}
      {task?.dailyTarget && (
        <View style={styles.inputContainer}>
          <Text style={styles.sectionTitle}>
            Completed Quantity ({task.dailyTarget.unit || 'units'})
          </Text>
          <Text style={styles.helperText}>
            Target: {task.dailyTarget.quantity} {task.dailyTarget.unit || 'units'}
          </Text>
          <TextInput
            style={styles.quantityInput}
            placeholder={`Enter completed ${task.dailyTarget.unit || 'units'}...`}
            value={completedQuantity > 0 ? completedQuantity.toString() : ''}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              setCompletedQuantity(num);
              
              // Auto-calculate progress percentage from quantity
              if (num > 0 && task.dailyTarget?.quantity) {
                const calculatedProgress = Math.min(
                  Math.round((num / task.dailyTarget.quantity) * 100),
                  100
                );
                setProgressPercent(calculatedProgress);
              }
            }}
            keyboardType="numeric"
            maxLength={6}
          />
          {completedQuantity > 0 && task.dailyTarget?.quantity && (
            <Text style={styles.autoCalculatedText}>
              ✓ Progress auto-calculated: {Math.round((completedQuantity / task.dailyTarget.quantity) * 100)}%
            </Text>
          )}
        </View>
      )}

      {/* Work Description */}
      <View style={styles.inputContainer}>
        <Text style={styles.sectionTitle}>Work Description *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Describe the work completed in detail..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.characterCount}>{description.length}/500</Text>
      </View>

      {/* Additional Notes */}
      <View style={styles.inputContainer}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Any additional notes, issues, or observations..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={300}
        />
        <Text style={styles.characterCount}>{notes.length}/300</Text>
      </View>

      {/* Location Information */}
      {currentLocation && (
        <View style={styles.locationContainer}>
          <Text style={styles.sectionTitle}>Current Location</Text>
          <Text style={styles.locationText}>
            📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </Text>
          <Text style={styles.accuracyText}>
            Accuracy: ±{Math.round(currentLocation.accuracy)}m
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.updateButton]}
          onPress={handleSubmitProgress}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>Update Progress</Text>
          )}
        </TouchableOpacity>

        {progressPercent >= 100 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleCompleteTask}
            disabled={isSubmitting}
          >
            <Text style={styles.actionButtonText}>Mark as Completed</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  taskInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 12,
  },
  taskDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  progressDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 32,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666666',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FAFAFA',
    minHeight: 100,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    backgroundColor: '#FAFAFA',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  autoCalculatedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '500',
  },
  characterCount: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
    marginTop: 4,
  },
  locationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 12,
    color: '#666666',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  updateButton: {
    backgroundColor: '#2196F3',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F5F5F5',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TaskProgressScreen;