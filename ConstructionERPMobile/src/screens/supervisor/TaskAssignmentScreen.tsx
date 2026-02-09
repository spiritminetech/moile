// TaskAssignmentScreen - Comprehensive task management interface for supervisors
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { useSupervisorContext } from '../../store/context/SupervisorContext';
import { supervisorApiService } from '../../services/api/SupervisorApiService';
import {
  TaskAssignmentRequest,
  TeamMember,
  Project,
  ApiResponse,
} from '../../types';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

// Task assignment data interface
interface TaskAssignment {
  assignmentId: number;
  taskId: number;
  taskName: string;
  workerId: number;
  workerName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  progress: number;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  estimatedHours: number;
  actualHours: number | null;
  dependencies: number[];
  canStart: boolean;
  dailyTarget?: {
    quantity: number;
    unit: string;
  };
}

// Task creation form data - ENHANCED with all required fields
interface TaskCreationForm {
  taskName: string;
  description: string;
  workerId: number;
  workerIds: number[]; // For group assignment
  assignmentMode: 'individual' | 'group';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedHours: number;
  instructions: string;
  requiredSkills: string[];
  dependencies: number[];
  projectId: number;
  // NEW FIELDS - Missing from specification
  trade: 'electrical' | 'plumbing' | 'carpentry' | 'masonry' | 'painting' | 'welding' | 'hvac' | 'other';
  siteLocation: string; // Location within site
  toolsRequired: string; // Tools/materials required
  materialsRequired: string; // Materials required
  startTime: string; // Start time (HH:mm format)
  endTime: string; // End time (HH:mm format)
}

const TaskAssignmentScreen: React.FC = () => {
  const { state: authState } = useAuth();
  const { state: supervisorState, refreshAllData, clearError } = useSupervisorContext();

  // Local state
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'normal' | 'high' | 'urgent'>('all');

  // Modal states
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [showUpdateDailyTargetModal, setShowUpdateDailyTargetModal] = useState(false);
  const [showVerifyCompletionModal, setShowVerifyCompletionModal] = useState(false); // NEW
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | null>(null);

  // Daily target state
  const [dailyTargetQuantity, setDailyTargetQuantity] = useState<string>('');
  const [dailyTargetUnit, setDailyTargetUnit] = useState<string>('');
  const [targetUpdateReason, setTargetUpdateReason] = useState<string>(''); // NEW
  const [targetUpdateReasonCategory, setTargetUpdateReasonCategory] = useState<'weather' | 'manpower' | 'material' | 'other'>('other'); // NEW

  // Form states
  const [createTaskForm, setCreateTaskForm] = useState<TaskCreationForm>({
    taskName: '',
    description: '',
    workerId: 0,
    workerIds: [], // NEW
    assignmentMode: 'individual', // NEW
    priority: 'normal',
    estimatedHours: 8,
    instructions: '',
    requiredSkills: [],
    dependencies: [],
    projectId: 0,
    // NEW FIELDS
    trade: 'other',
    siteLocation: '',
    toolsRequired: '',
    materialsRequired: '',
    startTime: '08:00',
    endTime: '17:00',
  });
  const [reassignWorkerId, setReassignWorkerId] = useState<number>(0);
  const [reassignReason, setReassignReason] = useState<string>('');

  // Load task assignments
  const loadTaskAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      clearError();

      const params = {
        projectId: selectedProject || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
      };

      const response = await supervisorApiService.getTaskAssignments(params);
      
      if (response.success && response.data) {
        setTaskAssignments(response.data.assignments);
        setLastRefresh(new Date());
      } else {
        console.error('Failed to load task assignments:', response.errors);
      }
    } catch (error) {
      console.error('Task assignments loading error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject, filterStatus, filterPriority, clearError]);

  // Initial load
  useEffect(() => {
    loadTaskAssignments();
  }, [loadTaskAssignments]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadTaskAssignments();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadTaskAssignments]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadTaskAssignments(),
        refreshAllData()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadTaskAssignments, refreshAllData]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = taskAssignments;

    // Apply filters
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    // Sort by priority and status
    return filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const statusOrder = { pending: 4, in_progress: 3, completed: 2, cancelled: 1 };
      
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return statusOrder[b.status] - statusOrder[a.status];
    });
  }, [taskAssignments, filterStatus, filterPriority]);

  // Available workers for assignment
  const availableWorkers = useMemo(() => {
    return supervisorState.teamMembers.filter(member => 
      member.attendanceStatus === 'present' || member.attendanceStatus === 'on_break'
    );
  }, [supervisorState.teamMembers]);

  // Available projects
  const availableProjects = useMemo(() => {
    return supervisorState.assignedProjects.filter(project => project.status === 'active');
  }, [supervisorState.assignedProjects]);

  // Task creation handler - ENHANCED with all new fields
  const handleCreateTask = useCallback(async () => {
    try {
      // Validation
      if (!createTaskForm.taskName.trim() || !createTaskForm.projectId) {
        Alert.alert('Validation Error', 'Please fill in task name and select a project');
        return;
      }

      // Validate worker selection based on assignment mode
      if (createTaskForm.assignmentMode === 'individual' && !createTaskForm.workerId) {
        Alert.alert('Validation Error', 'Please select a worker');
        return;
      }

      if (createTaskForm.assignmentMode === 'group' && createTaskForm.workerIds.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one worker for group assignment');
        return;
      }

      // Validate time range
      if (createTaskForm.startTime && createTaskForm.endTime) {
        const start = new Date(`2000-01-01T${createTaskForm.startTime}`);
        const end = new Date(`2000-01-01T${createTaskForm.endTime}`);
        if (end <= start) {
          Alert.alert('Validation Error', 'End time must be after start time');
          return;
        }
      }

      // Prepare task data with all new fields
      const taskData = {
        taskName: createTaskForm.taskName,
        description: createTaskForm.description || createTaskForm.taskName,
        employeeId: createTaskForm.assignmentMode === 'individual' ? createTaskForm.workerId : undefined,
        employeeIds: createTaskForm.assignmentMode === 'group' ? createTaskForm.workerIds : undefined,
        assignmentMode: createTaskForm.assignmentMode,
        projectId: createTaskForm.projectId,
        priority: createTaskForm.priority,
        estimatedHours: createTaskForm.estimatedHours,
        instructions: createTaskForm.instructions,
        date: new Date().toISOString().split('T')[0],
        // NEW FIELDS
        trade: createTaskForm.trade,
        siteLocation: createTaskForm.siteLocation,
        toolsRequired: createTaskForm.toolsRequired,
        materialsRequired: createTaskForm.materialsRequired,
        startTime: createTaskForm.startTime,
        endTime: createTaskForm.endTime,
      };

      // Use appropriate endpoint based on assignment mode
      let response;
      if (createTaskForm.assignmentMode === 'group') {
        // Group assignment endpoint (to be implemented in backend)
        response = await supervisorApiService.createAndAssignTaskGroup(taskData);
      } else {
        // Individual assignment endpoint (existing)
        response = await supervisorApiService.createAndAssignTask(taskData);
      }
      
      if (response.success) {
        const assignmentType = createTaskForm.assignmentMode === 'group' 
          ? `to ${createTaskForm.workerIds.length} workers` 
          : 'successfully';
        Alert.alert('Success', `Task created and assigned ${assignmentType}`);
        setShowCreateTaskModal(false);
        resetCreateTaskForm();
        await loadTaskAssignments();
      } else {
        Alert.alert('Error', response.errors?.join(', ') || 'Failed to create task');
      }
    } catch (error) {
      console.error('Task creation error:', error);
      Alert.alert('Error', 'Failed to create task');
    }
  }, [createTaskForm, loadTaskAssignments]);

  // Task reassignment handler
  const handleReassignTask = useCallback(async () => {
    try {
      if (!selectedTask || !reassignWorkerId || !reassignReason.trim()) {
        Alert.alert('Validation Error', 'Please select a worker and provide a reason');
        return;
      }

      const response = await supervisorApiService.reassignTask(selectedTask.assignmentId, {
        newWorkerId: reassignWorkerId,
        reason: reassignReason,
        priority: selectedTask.priority,
        instructions: selectedTask.instructions || '',
      });
      
      if (response.success) {
        Alert.alert('Success', 'Task reassigned successfully');
        setShowReassignModal(false);
        setSelectedTask(null);
        setReassignWorkerId(0);
        setReassignReason('');
        await loadTaskAssignments();
      } else {
        Alert.alert('Error', response.errors?.join(', ') || 'Failed to reassign task');
      }
    } catch (error) {
      console.error('Task reassignment error:', error);
      Alert.alert('Error', 'Failed to reassign task');
    }
  }, [selectedTask, reassignWorkerId, reassignReason, loadTaskAssignments]);

  // Priority update handler
  const handleUpdatePriority = useCallback(async (task: TaskAssignment, newPriority: TaskAssignment['priority']) => {
    try {
      const response = await supervisorApiService.updateTaskPriority(task.assignmentId, {
        priority: newPriority,
        instructions: task.instructions || '',
        estimatedHours: task.estimatedHours,
      });
      
      if (response.success) {
        Alert.alert('Success', 'Task priority updated successfully');
        await loadTaskAssignments();
      } else {
        Alert.alert('Error', response.errors?.join(', ') || 'Failed to update priority');
      }
    } catch (error) {
      console.error('Priority update error:', error);
      Alert.alert('Error', 'Failed to update task priority');
    }
  }, [loadTaskAssignments]);

  // Daily target update handler - ENHANCED with reason tracking
  const handleUpdateDailyTarget = useCallback(async () => {
    try {
      if (!selectedTask) return;

      const quantity = parseInt(dailyTargetQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        Alert.alert('Invalid Input', 'Please enter a valid quantity');
        return;
      }

      if (!dailyTargetUnit.trim()) {
        Alert.alert('Invalid Input', 'Please enter a unit (e.g., panels, meters, items)');
        return;
      }

      // Validate reason if target is being changed
      if (!targetUpdateReason.trim()) {
        Alert.alert('Reason Required', 'Please provide a reason for updating the daily target');
        return;
      }

      const response = await supervisorApiService.updateTaskAssignment({
        assignmentId: selectedTask.assignmentId,
        changes: {
          dailyTarget: {
            quantity,
            unit: dailyTargetUnit.trim()
          },
          targetUpdateReason: targetUpdateReason.trim(),
          targetUpdateReasonCategory: targetUpdateReasonCategory,
          targetUpdatedAt: new Date().toISOString(),
        }
      });

      if (response.success) {
        Alert.alert('Success', 'Daily target updated successfully');
        setShowUpdateDailyTargetModal(false);
        setDailyTargetQuantity('');
        setDailyTargetUnit('');
        setTargetUpdateReason('');
        setTargetUpdateReasonCategory('other');
        await loadTaskAssignments();
      } else {
        Alert.alert('Error', response.errors?.join(', ') || 'Failed to update daily target');
      }
    } catch (error) {
      console.error('Daily target update error:', error);
      Alert.alert('Error', 'Failed to update daily target');
    }
  }, [selectedTask, dailyTargetQuantity, dailyTargetUnit, targetUpdateReason, targetUpdateReasonCategory, loadTaskAssignments]);

  // Reset create task form - ENHANCED with all new fields
  const resetCreateTaskForm = useCallback(() => {
    setCreateTaskForm({
      taskName: '',
      description: '',
      workerId: 0,
      workerIds: [],
      assignmentMode: 'individual',
      priority: 'normal',
      estimatedHours: 8,
      instructions: '',
      requiredSkills: [],
      dependencies: [],
      projectId: availableProjects[0]?.id || 0,
      trade: 'other',
      siteLocation: '',
      toolsRequired: '',
      materialsRequired: '',
      startTime: '08:00',
      endTime: '17:00',
    });
  }, [availableProjects]);

  // NEW: Supervisor verification handler
  const handleVerifyCompletion = useCallback(async (task: TaskAssignment) => {
    try {
      Alert.alert(
        'Verify Task Completion',
        `Are you sure you want to verify and confirm completion of "${task.taskName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Verify',
            onPress: async () => {
              const response = await supervisorApiService.verifyTaskCompletion(task.assignmentId);
              
              if (response.success) {
                Alert.alert('Success', 'Task completion verified successfully');
                setShowVerifyCompletionModal(false);
                await loadTaskAssignments();
              } else {
                Alert.alert('Error', response.errors?.join(', ') || 'Failed to verify task completion');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Task verification error:', error);
      Alert.alert('Error', 'Failed to verify task completion');
    }
  }, [loadTaskAssignments]);

  // Get priority color
  const getPriorityColor = (priority: TaskAssignment['priority']) => {
    switch (priority) {
      case 'urgent': return ConstructionTheme.colors.error;
      case 'high': return ConstructionTheme.colors.warning;
      case 'normal': return ConstructionTheme.colors.info;
      case 'low': return ConstructionTheme.colors.onSurfaceVariant;
      default: return ConstructionTheme.colors.onSurfaceVariant;
    }
  };

  // Get status color
  const getStatusColor = (status: TaskAssignment['status']) => {
    switch (status) {
      case 'completed': return ConstructionTheme.colors.success;
      case 'in_progress': return ConstructionTheme.colors.primary;
      case 'pending': return ConstructionTheme.colors.warning;
      case 'cancelled': return ConstructionTheme.colors.error;
      default: return ConstructionTheme.colors.onSurfaceVariant;
    }
  };

  // Show loading state during initial load
  if (isLoading && taskAssignments.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={ConstructionTheme.colors.primary} />
        <Text style={styles.loadingText}>Loading task assignments...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Task Assignment</Text>
          {lastRefresh && (
            <Text style={styles.lastRefreshText}>
              Last updated: {lastRefresh.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => {
            resetCreateTaskForm();
            setShowCreateTaskModal(true);
          }}
        >
          <Text style={styles.createButtonText}>+ New Task</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {/* Project Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Project:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterChip, selectedProject === null && styles.filterChipActive]}
                onPress={() => setSelectedProject(null)}
              >
                <Text style={[styles.filterChipText, selectedProject === null && styles.filterChipTextActive]}>
                  All Projects
                </Text>
              </TouchableOpacity>
              {availableProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.filterChip, selectedProject === project.id && styles.filterChipActive]}
                  onPress={() => setSelectedProject(project.id)}
                >
                  <Text style={[styles.filterChipText, selectedProject === project.id && styles.filterChipTextActive]}>
                    {project.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Status Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
                  onPress={() => setFilterStatus(status as any)}
                >
                  <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
                    {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Priority Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Priority:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['all', 'urgent', 'high', 'normal', 'low'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[styles.filterChip, filterPriority === priority && styles.filterChipActive]}
                  onPress={() => setFilterPriority(priority as any)}
                >
                  <Text style={[styles.filterChipText, filterPriority === priority && styles.filterChipTextActive]}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* Error Display */}
      {supervisorState.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{supervisorState.error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.errorDismiss}>
            <Text style={styles.errorDismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Task List */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[ConstructionTheme.colors.primary]}
            tintColor={ConstructionTheme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks found</Text>
            <Text style={styles.emptySubtext}>
              {filterStatus !== 'all' || filterPriority !== 'all' 
                ? 'Try adjusting your filters or create a new task'
                : 'Create your first task assignment'
              }
            </Text>
            <TouchableOpacity 
              style={styles.emptyActionButton}
              onPress={() => {
                resetCreateTaskForm();
                setShowCreateTaskModal(true);
              }}
            >
              <Text style={styles.emptyActionButtonText}>Create New Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <TouchableOpacity
              key={`task-${task.assignmentId}`}
              style={styles.taskCard}
              onPress={() => {
                setSelectedTask(task);
                setShowTaskDetailsModal(true);
              }}
              activeOpacity={0.7}
            >
              {/* Task Header */}
              <View style={styles.taskHeader}>
                <View style={styles.taskTitleContainer}>
                  <Text style={styles.taskName} numberOfLines={1}>
                    {task.taskName}
                  </Text>
                  <View style={styles.taskBadges}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                      <Text style={styles.priorityBadgeText}>
                        {(task.priority || 'normal').toUpperCase()}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                      <Text style={styles.statusBadgeText}>
                        {(task.status || 'pending').replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Worker Info */}
              <View style={styles.workerInfo}>
                <Text style={styles.workerLabel}>Assigned to:</Text>
                <Text style={styles.workerName}>{task.workerName}</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <Text style={styles.progressValue}>{task.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${task.progress}%`,
                        backgroundColor: getStatusColor(task.status)
                      }
                    ]} 
                  />
                </View>
              </View>

              {/* Task Details */}
              <View style={styles.taskDetails}>
                <View style={styles.taskDetailItem}>
                  <Text style={styles.taskDetailLabel}>Estimated:</Text>
                  <Text style={styles.taskDetailValue}>{task.estimatedHours}h</Text>
                </View>
                {task.actualHours && (
                  <View style={styles.taskDetailItem}>
                    <Text style={styles.taskDetailLabel}>Actual:</Text>
                    <Text style={styles.taskDetailValue}>{task.actualHours}h</Text>
                  </View>
                )}
                <View style={styles.taskDetailItem}>
                  <Text style={styles.taskDetailLabel}>Assigned:</Text>
                  <Text style={styles.taskDetailValue}>
                    {new Date(task.assignedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* Daily Target Display */}
              {task.dailyTarget && (
                <View style={styles.dailyTargetContainer}>
                  <Text style={styles.dailyTargetLabel}>Daily Target:</Text>
                  <Text style={styles.dailyTargetValue}>
                    {task.dailyTarget.quantity} {task.dailyTarget.unit}
                  </Text>
                </View>
              )}

              {/* Dependencies Indicator */}
              {task.dependencies.length > 0 && (
                <View style={styles.dependenciesContainer}>
                  <Text style={styles.dependenciesText}>
                    🔗 {task.dependencies.length} dependencies
                  </Text>
                  {!task.canStart && (
                    <Text style={styles.blockedText}>⚠️ Blocked</Text>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.taskActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedTask(task);
                    setReassignWorkerId(0);
                    setReassignReason('');
                    setShowReassignModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Reassign</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    Alert.alert(
                      'Update Priority',
                      'Select new priority level:',
                      [
                        { text: 'Low', onPress: () => handleUpdatePriority(task, 'low') },
                        { text: 'Normal', onPress: () => handleUpdatePriority(task, 'normal') },
                        { text: 'High', onPress: () => handleUpdatePriority(task, 'high') },
                        { text: 'Urgent', onPress: () => handleUpdatePriority(task, 'urgent') },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={styles.actionButtonText}>Priority</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.updateTargetButton]}
                  onPress={() => {
                    setSelectedTask(task);
                    setDailyTargetQuantity(task.dailyTarget?.quantity.toString() || '');
                    setDailyTargetUnit(task.dailyTarget?.unit || '');
                    setShowUpdateDailyTargetModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Update Target</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Create Task Modal */}
      <Modal
        visible={showCreateTaskModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateTaskModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Task</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCreateTaskModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Task Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Task Name *</Text>
              <TextInput
                style={styles.formInput}
                value={createTaskForm.taskName}
                onChangeText={(text) => setCreateTaskForm(prev => ({ ...prev, taskName: text }))}
                placeholder="Enter task name"
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={createTaskForm.description}
                onChangeText={(text) => setCreateTaskForm(prev => ({ ...prev, description: text }))}
                placeholder="Enter task description"
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Project Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Project *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                {availableProjects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.optionChip,
                      createTaskForm.projectId === project.id && styles.optionChipActive
                    ]}
                    onPress={() => setCreateTaskForm(prev => ({ ...prev, projectId: project.id }))}
                  >
                    <Text style={[
                      styles.optionChipText,
                      createTaskForm.projectId === project.id && styles.optionChipTextActive
                    ]}>
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Worker Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Assignment Mode *</Text>
              <View style={styles.assignmentModeToggle}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    createTaskForm.assignmentMode === 'individual' && styles.modeButtonActive
                  ]}
                  onPress={() => setCreateTaskForm(prev => ({ ...prev, assignmentMode: 'individual', workerIds: [] }))}
                >
                  <Text style={[
                    styles.modeButtonText,
                    createTaskForm.assignmentMode === 'individual' && styles.modeButtonTextActive
                  ]}>
                    Individual Worker
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    createTaskForm.assignmentMode === 'group' && styles.modeButtonActive
                  ]}
                  onPress={() => setCreateTaskForm(prev => ({ ...prev, assignmentMode: 'group', workerId: 0 }))}
                >
                  <Text style={[
                    styles.modeButtonText,
                    createTaskForm.assignmentMode === 'group' && styles.modeButtonTextActive
                  ]}>
                    Group Assignment
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Individual Worker Selection */}
            {createTaskForm.assignmentMode === 'individual' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Assign to Worker *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                  {availableWorkers.map((worker) => (
                    <TouchableOpacity
                      key={worker.id}
                      style={[
                        styles.optionChip,
                        createTaskForm.workerId === worker.id && styles.optionChipActive
                      ]}
                      onPress={() => setCreateTaskForm(prev => ({ ...prev, workerId: worker.id }))}
                    >
                      <Text style={[
                        styles.optionChipText,
                        createTaskForm.workerId === worker.id && styles.optionChipTextActive
                      ]}>
                        {worker.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Group Worker Selection */}
            {createTaskForm.assignmentMode === 'group' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Select Workers * ({createTaskForm.workerIds.length} selected)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                  {availableWorkers.map((worker) => (
                    <TouchableOpacity
                      key={worker.id}
                      style={[
                        styles.optionChip,
                        createTaskForm.workerIds.includes(worker.id) && styles.optionChipActive
                      ]}
                      onPress={() => {
                        setCreateTaskForm(prev => ({
                          ...prev,
                          workerIds: prev.workerIds.includes(worker.id)
                            ? prev.workerIds.filter(id => id !== worker.id)
                            : [...prev.workerIds, worker.id]
                        }));
                      }}
                    >
                      <Text style={[
                        styles.optionChipText,
                        createTaskForm.workerIds.includes(worker.id) && styles.optionChipTextActive
                      ]}>
                        {createTaskForm.workerIds.includes(worker.id) && '✓ '}
                        {worker.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* NEW: Trade/Nature of Work Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Trade / Nature of Work *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                {(['electrical', 'plumbing', 'carpentry', 'masonry', 'painting', 'welding', 'hvac', 'other'] as const).map((trade) => (
                  <TouchableOpacity
                    key={trade}
                    style={[
                      styles.optionChip,
                      createTaskForm.trade === trade && styles.optionChipActive
                    ]}
                    onPress={() => setCreateTaskForm(prev => ({ ...prev, trade }))}
                  >
                    <Text style={[
                      styles.optionChipText,
                      createTaskForm.trade === trade && styles.optionChipTextActive
                    ]}>
                      {trade.charAt(0).toUpperCase() + trade.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* NEW: Site Location */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location Within Site</Text>
              <TextInput
                style={styles.formInput}
                value={createTaskForm.siteLocation}
                onChangeText={(text) => setCreateTaskForm(prev => ({ ...prev, siteLocation: text }))}
                placeholder="e.g., Building A - 3rd Floor, North Wing"
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
              />
            </View>

            {/* NEW: Start and End Time */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Work Schedule</Text>
              <View style={styles.timePickerRow}>
                <View style={styles.timePickerField}>
                  <Text style={styles.timePickerLabel}>Start Time</Text>
                  <TextInput
                    style={styles.formInput}
                    value={createTaskForm.startTime}
                    onChangeText={(text) => setCreateTaskForm(prev => ({ ...prev, startTime: text }))}
                    placeholder="08:00"
                    placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                  />
                </View>
                <View style={styles.timePickerField}>
                  <Text style={styles.timePickerLabel}>End Time</Text>
                  <TextInput
                    style={styles.formInput}
                    value={createTaskForm.endTime}
                    onChangeText={(text) => setCreateTaskForm(prev => ({ ...prev, endTime: text }))}
                    placeholder="17:00"
                    placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                  />
                </View>
              </View>
              <Text style={styles.formHint}>Format: HH:mm (24-hour format)</Text>
            </View>

            {/* NEW: Tools Required */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tools Required</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={createTaskForm.toolsRequired}
                onChangeText={(text) => setCreateTaskForm(prev => ({ ...prev, toolsRequired: text }))}
                placeholder="e.g., Drill, Hammer, Safety Harness, Measuring Tape"
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* NEW: Materials Required */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Materials Required</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={createTaskForm.materialsRequired}
                onChangeText={(text) => setCreateTaskForm(prev => ({ ...prev, materialsRequired: text }))}
                placeholder="e.g., Cement bags (10), Steel rods (50), Paint (5 gallons)"
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Priority Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                {(['low', 'normal', 'high', 'urgent'] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.optionChip,
                      createTaskForm.priority === priority && styles.optionChipActive,
                      { borderColor: getPriorityColor(priority) }
                    ]}
                    onPress={() => setCreateTaskForm(prev => ({ ...prev, priority }))}
                  >
                    <Text style={[
                      styles.optionChipText,
                      createTaskForm.priority === priority && styles.optionChipTextActive
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Estimated Hours */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Estimated Hours</Text>
              <TextInput
                style={styles.formInput}
                value={createTaskForm.estimatedHours.toString()}
                onChangeText={(text) => {
                  const hours = parseInt(text) || 0;
                  setCreateTaskForm(prev => ({ ...prev, estimatedHours: hours }));
                }}
                placeholder="8"
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                keyboardType="numeric"
              />
            </View>

            {/* Instructions */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Instructions</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={createTaskForm.instructions}
                onChangeText={(text) => setCreateTaskForm(prev => ({ ...prev, instructions: text }))}
                placeholder="Enter detailed instructions for the worker"
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Required Skills */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Required Skills (Optional)</Text>
              <Text style={styles.formHint}>
                Skills will be validated against worker certifications
              </Text>
              {/* For now, we'll keep this simple - in a full implementation, this would be a multi-select */}
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Welding, Electrical, Safety Certified"
                placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                onChangeText={(text) => {
                  const skills = text.split(',').map(skill => skill.trim()).filter(skill => skill);
                  setCreateTaskForm(prev => ({ ...prev, requiredSkills: skills }));
                }}
              />
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCreateTaskModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={handleCreateTask}
            >
              <Text style={styles.modalConfirmButtonText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reassign Task Modal */}
      <Modal
        visible={showReassignModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReassignModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reassign Task</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowReassignModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedTask && (
              <>
                {/* Current Task Info */}
                <View style={styles.currentTaskInfo}>
                  <Text style={styles.currentTaskTitle}>Current Assignment</Text>
                  <Text style={styles.currentTaskName}>{selectedTask.taskName}</Text>
                  <Text style={styles.currentTaskWorker}>
                    Currently assigned to: {selectedTask.workerName}
                  </Text>
                </View>

                {/* New Worker Selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Reassign to Worker *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                    {availableWorkers
                      .filter(worker => worker.id !== selectedTask.workerId)
                      .map((worker) => (
                        <TouchableOpacity
                          key={worker.id}
                          style={[
                            styles.optionChip,
                            reassignWorkerId === worker.id && styles.optionChipActive
                          ]}
                          onPress={() => setReassignWorkerId(worker.id)}
                        >
                          <Text style={[
                            styles.optionChipText,
                            reassignWorkerId === worker.id && styles.optionChipTextActive
                          ]}>
                            {worker.name}
                          </Text>
                          <Text style={styles.workerStatusText}>
                            {worker.attendanceStatus}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>

                {/* Reassignment Reason */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Reason for Reassignment *</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    value={reassignReason}
                    onChangeText={setReassignReason}
                    placeholder="Explain why this task is being reassigned"
                    placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </>
            )}
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowReassignModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={handleReassignTask}
            >
              <Text style={styles.modalConfirmButtonText}>Reassign Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Task Details Modal */}
      <Modal
        visible={showTaskDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTaskDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Task Details</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTaskDetailsModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedTask && (
              <>
                {/* Task Overview */}
                <View style={styles.taskOverview}>
                  <Text style={styles.taskOverviewTitle}>{selectedTask.taskName}</Text>
                  <View style={styles.taskOverviewBadges}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedTask.priority) }]}>
                      <Text style={styles.priorityBadgeText}>
                        {(selectedTask.priority || 'normal').toUpperCase()}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTask.status) }]}>
                      <Text style={styles.statusBadgeText}>
                        {(selectedTask.status || 'pending').replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Progress</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Completion</Text>
                      <Text style={styles.progressValue}>{selectedTask.progress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${selectedTask.progress}%`,
                            backgroundColor: getStatusColor(selectedTask.status)
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>

                {/* Assignment Details */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Assignment Details</Text>
                  <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Assigned to:</Text>
                      <Text style={styles.detailValue}>{selectedTask.workerName}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Assigned on:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedTask.assignedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Estimated hours:</Text>
                      <Text style={styles.detailValue}>{selectedTask.estimatedHours}h</Text>
                    </View>
                    {selectedTask.actualHours && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Actual hours:</Text>
                        <Text style={styles.detailValue}>{selectedTask.actualHours}h</Text>
                      </View>
                    )}
                    {selectedTask.startedAt && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Started on:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(selectedTask.startedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    {selectedTask.completedAt && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Completed on:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(selectedTask.completedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Dependencies */}
                {selectedTask.dependencies.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Dependencies</Text>
                    <View style={styles.dependenciesList}>
                      {selectedTask.dependencies.map((depId, index) => (
                        <View key={depId} style={styles.dependencyItem}>
                          <Text style={styles.dependencyText}>
                            🔗 Task #{depId}
                          </Text>
                        </View>
                      ))}
                      {!selectedTask.canStart && (
                        <Text style={styles.blockedWarning}>
                          ⚠️ This task is blocked by incomplete dependencies
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Quick Actions */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Quick Actions</Text>
                  <View style={styles.quickActions}>
                    <TouchableOpacity
                      style={styles.quickActionButton}
                      onPress={() => {
                        setShowTaskDetailsModal(false);
                        setTimeout(() => {
                          setReassignWorkerId(0);
                          setReassignReason('');
                          setShowReassignModal(true);
                        }, 300);
                      }}
                    >
                      <Text style={styles.quickActionText}>Reassign Worker</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.quickActionButton}
                      onPress={() => {
                        setShowTaskDetailsModal(false);
                        Alert.alert(
                          'Update Priority',
                          'Select new priority level:',
                          [
                            { text: 'Low', onPress: () => handleUpdatePriority(selectedTask, 'low') },
                            { text: 'Normal', onPress: () => handleUpdatePriority(selectedTask, 'normal') },
                            { text: 'High', onPress: () => handleUpdatePriority(selectedTask, 'high') },
                            { text: 'Urgent', onPress: () => handleUpdatePriority(selectedTask, 'urgent') },
                            { text: 'Cancel', style: 'cancel' },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.quickActionText}>Change Priority</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickActionButton}
                      onPress={() => {
                        setShowTaskDetailsModal(false);
                        setTimeout(() => {
                          setDailyTargetQuantity(selectedTask.dailyTarget?.quantity.toString() || '');
                          setDailyTargetUnit(selectedTask.dailyTarget?.unit || '');
                          setTargetUpdateReason('');
                          setTargetUpdateReasonCategory('other');
                          setShowUpdateDailyTargetModal(true);
                        }, 300);
                      }}
                    >
                      <Text style={styles.quickActionText}>Update Daily Target</Text>
                    </TouchableOpacity>

                    {/* NEW: Verify Completion Button */}
                    {selectedTask.status === 'completed' && (
                      <TouchableOpacity
                        style={[styles.quickActionButton, styles.verifyButton]}
                        onPress={() => {
                          setShowTaskDetailsModal(false);
                          setTimeout(() => {
                            handleVerifyCompletion(selectedTask);
                          }, 300);
                        }}
                      >
                        <Text style={[styles.quickActionText, styles.verifyButtonText]}>✓ Verify & Confirm Completion</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Update Daily Target Modal */}
      <Modal
        visible={showUpdateDailyTargetModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUpdateDailyTargetModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Daily Target</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowUpdateDailyTargetModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedTask && (
              <>
                <Text style={styles.modalSubtitle}>
                  {selectedTask.taskName} - {selectedTask.workerName}
                </Text>

                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Daily Target</Text>
                  <Text style={styles.formSectionDescription}>
                    Set the daily target quantity and unit for this task
                  </Text>

                  <View style={styles.formRow}>
                    <View style={styles.formFieldHalf}>
                      <Text style={styles.formLabel}>Quantity *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={dailyTargetQuantity}
                        onChangeText={setDailyTargetQuantity}
                        placeholder="e.g., 50"
                        keyboardType="numeric"
                        placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                      />
                    </View>

                    <View style={styles.formFieldHalf}>
                      <Text style={styles.formLabel}>Unit *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={dailyTargetUnit}
                        onChangeText={setDailyTargetUnit}
                        placeholder="e.g., panels, meters"
                        placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                      />
                    </View>
                  </View>

                  <View style={styles.examplesContainer}>
                    <Text style={styles.examplesTitle}>Common Examples:</Text>
                    <Text style={styles.exampleText}>• 50 panels</Text>
                    <Text style={styles.exampleText}>• 100 sq meters</Text>
                    <Text style={styles.exampleText}>• 25 outlets</Text>
                    <Text style={styles.exampleText}>• 150 meters</Text>
                  </View>
                </View>

                {/* NEW: Reason for Target Update */}
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Reason for Update *</Text>
                  <Text style={styles.formSectionDescription}>
                    Explain why the daily target is being changed
                  </Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Reason Category *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                      {(['weather', 'manpower', 'material', 'other'] as const).map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.optionChip,
                            targetUpdateReasonCategory === category && styles.optionChipActive
                          ]}
                          onPress={() => setTargetUpdateReasonCategory(category)}
                        >
                          <Text style={[
                            styles.optionChipText,
                            targetUpdateReasonCategory === category && styles.optionChipTextActive
                          ]}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Details *</Text>
                    <TextInput
                      style={[styles.formInput, styles.formTextArea]}
                      value={targetUpdateReason}
                      onChangeText={setTargetUpdateReason}
                      placeholder="Provide specific details about why the target is being updated"
                      placeholderTextColor={ConstructionTheme.colors.onSurfaceVariant}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.reasonExamplesContainer}>
                    <Text style={styles.examplesTitle}>Example Reasons:</Text>
                    <Text style={styles.exampleText}>• Weather: Heavy rain delayed work</Text>
                    <Text style={styles.exampleText}>• Manpower: 2 workers absent today</Text>
                    <Text style={styles.exampleText}>• Material: Cement delivery delayed</Text>
                    <Text style={styles.exampleText}>• Other: Client requested scope change</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowUpdateDailyTargetModal(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalSubmitButton}
                    onPress={handleUpdateDailyTarget}
                  >
                    <Text style={styles.modalSubmitButtonText}>Update Target</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.background,
  },
  loadingText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: ConstructionTheme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.xl,
    paddingBottom: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primary,
    ...ConstructionTheme.shadows.medium,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  lastRefreshText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    opacity: 0.8,
    marginTop: ConstructionTheme.spacing.xs,
  },
  createButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonSmall,
    justifyContent: 'center',
  },
  createButtonText: {
    ...ConstructionTheme.typography.buttonSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  filtersContainer: {
    backgroundColor: ConstructionTheme.colors.surface,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  filtersScroll: {
    paddingHorizontal: ConstructionTheme.spacing.md,
  },
  filterGroup: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  filterLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
    marginLeft: ConstructionTheme.spacing.xs,
  },
  filterChip: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginRight: ConstructionTheme.spacing.xs,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    minHeight: 32,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: ConstructionTheme.colors.primary,
    borderColor: ConstructionTheme.colors.primary,
  },
  filterChipText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    marginHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: '#C62828',
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
  },
  errorDismiss: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    backgroundColor: ConstructionTheme.colors.error,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: 32,
    justifyContent: 'center',
  },
  errorDismissText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: ConstructionTheme.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.xxl,
  },
  emptyText: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  emptySubtext: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: ConstructionTheme.spacing.lg,
  },
  emptyActionButton: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonMedium,
    justifyContent: 'center',
  },
  emptyActionButtonText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onPrimary,
  },
  taskCard: {
    backgroundColor: ConstructionTheme.colors.surface,
    marginHorizontal: ConstructionTheme.spacing.md,
    marginVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: ConstructionTheme.spacing.lg,
    ...ConstructionTheme.shadows.medium,
  },
  taskHeader: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  taskTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskName: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
  },
  taskBadges: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: 24,
    justifyContent: 'center',
  },
  priorityBadgeText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 10,
  },
  statusBadge: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: 24,
    justifyContent: 'center',
  },
  statusBadgeText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 10,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  workerLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginRight: ConstructionTheme.spacing.sm,
  },
  workerName: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  progressLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  progressValue: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: ConstructionTheme.colors.outline,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  taskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.md,
  },
  taskDetailItem: {
    alignItems: 'center',
  },
  taskDetailLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  taskDetailValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  dependenciesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  dependenciesText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  blockedText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.error,
    fontWeight: 'bold',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: ConstructionTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
  },
  actionButton: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonSmall,
    justifyContent: 'center',
    minWidth: 80,
  },
  actionButtonText: {
    ...ConstructionTheme.typography.buttonSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.xl,
    paddingBottom: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primary,
    ...ConstructionTheme.shadows.medium,
  },
  modalTitle: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
    backgroundColor: ConstructionTheme.colors.surface,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginRight: ConstructionTheme.spacing.sm,
    minHeight: ConstructionTheme.dimensions.buttonMedium,
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.primary,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginLeft: ConstructionTheme.spacing.sm,
    minHeight: ConstructionTheme.dimensions.buttonMedium,
    justifyContent: 'center',
  },
  modalConfirmButtonText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onPrimary,
    textAlign: 'center',
  },
  // Form Styles
  formGroup: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  formLabel: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  formInput: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    minHeight: ConstructionTheme.dimensions.inputMedium,
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formHint: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  optionsScroll: {
    marginTop: ConstructionTheme.spacing.xs,
  },
  optionChip: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginRight: ConstructionTheme.spacing.sm,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    minHeight: ConstructionTheme.dimensions.buttonSmall,
    justifyContent: 'center',
  },
  optionChipActive: {
    backgroundColor: ConstructionTheme.colors.primary,
    borderColor: ConstructionTheme.colors.primary,
  },
  optionChipText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  optionChipTextActive: {
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  // Reassign Modal Styles
  currentTaskInfo: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    padding: ConstructionTheme.spacing.lg,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  currentTaskTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  currentTaskName: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  currentTaskWorker: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  workerStatusText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: ConstructionTheme.spacing.xs,
  },
  // Task Details Modal Styles
  taskOverview: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  taskOverviewTitle: {
    ...ConstructionTheme.typography.headlineLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  taskOverviewBadges: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.sm,
  },
  detailSection: {
    marginBottom: ConstructionTheme.spacing.lg,
    paddingBottom: ConstructionTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  detailSectionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.md,
  },
  detailGrid: {
    gap: ConstructionTheme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  detailValue: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  dependenciesList: {
    gap: ConstructionTheme.spacing.sm,
  },
  dependencyItem: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  dependencyText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  blockedWarning: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.error,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: ConstructionTheme.spacing.sm,
  },
  quickActions: {
    gap: ConstructionTheme.spacing.sm,
  },
  quickActionButton: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonMedium,
    justifyContent: 'center',
  },
  quickActionText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onPrimary,
    textAlign: 'center',
  },
  // Daily Target Styles
  dailyTargetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    padding: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginTop: ConstructionTheme.spacing.sm,
  },
  dailyTargetLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: '600',
  },
  dailyTargetValue: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  updateTargetButton: {
    backgroundColor: ConstructionTheme.colors.secondary,
  },
  formSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  formSectionTitle: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
    fontWeight: 'bold',
  },
  formSectionDescription: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
  },
  formFieldHalf: {
    flex: 1,
  },
  formLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
    fontWeight: '600',
  },
  formInput: {
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    backgroundColor: ConstructionTheme.colors.surface,
    minHeight: 44,
  },
  examplesContainer: {
    marginTop: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  examplesTitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  exampleText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginLeft: ConstructionTheme.spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.lg,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    paddingVertical: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.primary,
    paddingVertical: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    minHeight: ConstructionTheme.dimensions.buttonMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.lg,
    textAlign: 'center',
  },
  // NEW STYLES for enhanced features
  assignmentModeToggle: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.sm,
    marginTop: ConstructionTheme.spacing.xs,
  },
  modeButton: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderWidth: 2,
    borderColor: ConstructionTheme.colors.outline,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: ConstructionTheme.colors.primary,
    borderColor: ConstructionTheme.colors.primary,
  },
  modeButtonText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.xs,
  },
  timePickerField: {
    flex: 1,
  },
  timePickerLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  reasonExamplesContainer: {
    marginTop: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.warning,
  },
  verifyButton: {
    backgroundColor: ConstructionTheme.colors.success,
  },
  verifyButtonText: {
    fontWeight: 'bold',
  },
});

export default TaskAssignmentScreen;