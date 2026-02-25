// TaskCard Component - Display individual task with actions and dependency indicators
// Requirements: 4.1, 4.2, 4.3, 4.6

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { TaskAssignment } from '../../types';
import { ConstructionButton, ConstructionCard } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import AttachmentViewer from '../common/AttachmentViewer';
import { workerApiService } from '../../services/api/WorkerApiService';

interface TaskCardProps {
  task: TaskAssignment;
  onStartTask: (taskId: number) => void;
  onUpdateProgress: (taskId: number, progress: number) => void;
  onResumeTask: (taskId: number) => void;
  onViewLocation: (task: TaskAssignment) => void;
  canStart: boolean;
  isInsideGeofence?: boolean;
  isOffline: boolean;
  navigation?: any;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStartTask,
  onUpdateProgress,
  onResumeTask,
  onViewLocation,
  canStart,
  isInsideGeofence = true,
  isOffline,
  navigation,
  isExpanded = false,
  onToggleExpand,
}) => {
  // State for instruction acknowledgment
  const [hasReadInstructions, setHasReadInstructions] = useState(
    task.instructionReadStatus?.hasRead || false
  );
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  // Get priority color and icon
  const getPriorityColor = (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return '#D32F2F';
      case 'high':
        return '#FF5722';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return '🚨';
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getPriorityText = (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'Critical';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Normal';
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
      case 'queued':
        return '#FF9800';
      case 'in_progress':
        return '#2196F3';
      case 'paused':
        return '#FFA726'; // Orange for paused
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#757575';
      default:
        console.warn('⚠️ Unknown task status:', status);
        return '#757575';
    }
  };

  // Handle start task with confirmation
  const handleStartTask = () => {
    if (isOffline) {
      Alert.alert(
        'Offline Mode',
        'Cannot start tasks while offline. Please connect to internet.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isInsideGeofence) {
      Alert.alert(
        'Outside Geo-Fence',
        'You must be at the work site to start this task. Please move closer to the project location.',
        [
          { text: 'OK' },
          { 
            text: 'View Location', 
            onPress: () => onViewLocation(task)
          }
        ]
      );
      return;
    }

    if (!canStart) {
      Alert.alert(
        'Cannot Start Task',
        'This task has dependencies that must be completed first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Start Task',
      `Are you sure you want to start "${task.taskName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => onStartTask(task.assignmentId) },
      ]
    );
  };

  // Handle progress update
  const handleUpdateProgress = () => {
    if (isOffline) {
      Alert.alert(
        'Offline Mode',
        'Cannot update progress while offline. Please connect to internet.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isInsideGeofence) {
      Alert.alert(
        'Outside Geo-Fence',
        'You must be at the work site to continue working on this task. Please move closer to the project location.',
        [
          { text: 'OK' },
          { 
            text: 'View Location', 
            onPress: () => onViewLocation(task)
          }
        ]
      );
      return;
    }

    onUpdateProgress(task.assignmentId, task.actualHours || 0);
  };

  // Handle view location
  const handleViewLocation = () => {
    // Navigate to map screen if navigation is available
    if (navigation && task.projectGeofence) {
      navigation.navigate('TaskLocationMap', {
        task: task,
        projectGeofence: task.projectGeofence
      });
    } else {
      // Fallback to old behavior
      onViewLocation(task);
    }
  };

  // Handle marking instructions as read
  const handleMarkAsRead = async () => {
    try {
      await workerApiService.markInstructionsAsRead(task.assignmentId);
      setHasReadInstructions(true);
    } catch (error) {
      console.error('Error marking instructions as read:', error);
      Alert.alert('Error', 'Failed to mark instructions as read');
    }
  };

  // Handle acknowledging instructions
  const handleAcknowledge = async () => {
    if (!hasReadInstructions) {
      Alert.alert('Please Read First', 'You must read the instructions before acknowledging');
      return;
    }

    Alert.alert(
      'Acknowledge Instructions',
      'By acknowledging, you confirm that you have read and understood all supervisor instructions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I Understand',
          onPress: async () => {
            setIsAcknowledging(true);
            try {
              await workerApiService.acknowledgeInstructions(task.assignmentId);
              Alert.alert('Success', 'Instructions acknowledged successfully');
            } catch (error) {
              console.error('Error acknowledging instructions:', error);
              Alert.alert('Error', 'Failed to acknowledge instructions');
            } finally {
              setIsAcknowledging(false);
            }
          },
        },
      ]
    );
  };

  // Handle supervisor contact
  const handleCallSupervisor = () => {
    if (task.supervisorContact) {
      Linking.openURL(`tel:${task.supervisorContact}`);
    } else {
      Alert.alert('No Contact', 'Supervisor contact number not available');
    }
  };

  const handleMessageSupervisor = () => {
    if (task.supervisorContact) {
      Linking.openURL(`sms:${task.supervisorContact}`);
    } else {
      Alert.alert('No Contact', 'Supervisor contact number not available');
    }
  };

  // Handle navigate to site
  const handleNavigateToSite = () => {
    if (task.projectGeofence) {
      const { latitude, longitude } = task.projectGeofence;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      Linking.openURL(url).catch(err => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Could not open navigation app');
      });
    } else {
      Alert.alert('No Location', 'Project location not available');
    }
  };

  // Get status text
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
      case 'queued':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        console.warn('⚠️ Unknown task status:', status);
        return 'Unknown';
    }
  };

  // Render enhanced dependency indicators with visual connections
  const renderDependencies = () => {
    if (!task.dependencies || task.dependencies.length === 0) {
      return null;
    }

    return (
      <View style={styles.dependenciesContainer}>
        <View style={styles.dependenciesHeader}>
          <Text style={styles.dependenciesLabel}>🔗 Dependencies:</Text>
          <Text style={styles.dependenciesCount}>({task.dependencies.length})</Text>
        </View>
        <View style={styles.dependenciesList}>
          {task.dependencies.map((depId, index) => (
            <View key={depId} style={styles.dependencyItem}>
              <View style={styles.dependencyTag}>
                <Text style={styles.dependencyIcon}>📋</Text>
                <Text style={styles.dependencyText}>Task #{depId}</Text>
              </View>
              {index < task.dependencies.length - 1 && (
                <View style={styles.dependencyConnector}>
                  <Text style={styles.connectorText}>→</Text>
                </View>
              )}
            </View>
          ))}
        </View>
        {!canStart && (
          <View style={styles.dependencyWarning}>
            <Text style={styles.dependencyWarningIcon}>⚠️</Text>
            <Text style={styles.dependencyWarningText}>
              Complete dependencies before starting this task
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render action buttons
  const renderActionButtons = () => {
    const buttons = [];

    // Start button for pending/queued tasks (ONLY if never started)
    // FIX: Check !task.startedAt to exclude paused tasks
    if ((task.status === 'pending' || task.status === 'queued') && !task.startedAt) {
      // Determine button state and title
      const canStartTask = canStart && isInsideGeofence && !isOffline;
      let buttonTitle = 'Start Task';
      let buttonVariant: 'success' | 'neutral' | 'danger' = 'success';

      // PRODUCTION MODE - Debug button state (always visible)
      console.log('='.repeat(80));
      console.log('🔘 PRODUCTION MODE - BUTTON STATE IN TASKCARD');
      console.log('='.repeat(80));
      console.log('Task:', task.taskName);
      console.log('Assignment ID:', task.assignmentId);
      console.log('Task Status:', task.status);
      console.log('Task startedAt:', task.startedAt);
      console.log('Props received:');
      console.log('  - canStart (from parent):', canStart);
      console.log('  - isInsideGeofence (from parent):', isInsideGeofence);
      console.log('  - isOffline (from parent):', isOffline);
      console.log('---');
      console.log('Button Logic:');
      console.log('  - canStartTask (final):', canStartTask);
      console.log('  - Formula: canStart && isInsideGeofence && !isOffline');
      console.log('  - Result:', canStart, '&&', isInsideGeofence, '&&', !isOffline, '=', canStartTask);
      console.log('---');

      if (isOffline) {
        buttonTitle = 'Offline';
        buttonVariant = 'neutral';
        console.log('Button will show: "Offline" (neutral, disabled)');
      } else if (!isInsideGeofence) {
        buttonTitle = 'Outside Geo-Fence';
        buttonVariant = 'danger';
        console.log('Button will show: "Outside Geo-Fence" (danger, disabled)');
        console.log('  ⚠️ THIS IS YOUR ISSUE - isInsideGeofence is FALSE');
      } else if (!canStart) {
        buttonTitle = 'Dependencies Required';
        buttonVariant = 'neutral';
        console.log('Button will show: "Dependencies Required" (neutral, disabled)');
      } else {
        console.log('Button will show: "Start Task" (success, enabled)');
      }
      
      console.log('---');
      console.log('Final Button State:');
      console.log('  - Title:', buttonTitle);
      console.log('  - Variant:', buttonVariant);
      console.log('  - Disabled:', !canStartTask);
      console.log('='.repeat(80));

      buttons.push(
        <ConstructionButton
          key="start"
          title={buttonTitle}
          onPress={handleStartTask}
          variant={buttonVariant}
          disabled={!canStartTask}
          size="medium"
          icon="▶️"
          style={styles.actionButton}
        />
      );
    }

    // Progress button for in-progress tasks
    if (task.status === 'in_progress') {
      // Check geofence for continue working button
      const canContinueWorking = isInsideGeofence && !isOffline;
      let buttonTitle = 'Continue Working';
      let buttonVariant: 'primary' | 'neutral' | 'danger' = 'primary';

      if (isOffline) {
        buttonTitle = 'Offline';
        buttonVariant = 'neutral';
      } else if (!isInsideGeofence) {
        buttonTitle = 'Outside Geo-Fence';
        buttonVariant = 'danger';
      }

      buttons.push(
        <ConstructionButton
          key="progress"
          title={buttonTitle}
          onPress={handleUpdateProgress}
          variant={buttonVariant}
          disabled={!canContinueWorking}
          size="medium"
          icon="📊"
          style={styles.actionButton}
        />
      );
    }
    
    // Resume button for paused tasks
    if (task.status === 'paused') {
      // Check geofence for resume button
      const canResumeTask = isInsideGeofence && !isOffline;
      let buttonTitle = 'Resume Task';
      let buttonVariant: 'success' | 'neutral' | 'danger' = 'success';

      if (isOffline) {
        buttonTitle = 'Offline';
        buttonVariant = 'neutral';
      } else if (!isInsideGeofence) {
        buttonTitle = 'Outside Geo-Fence';
        buttonVariant = 'danger';
      }

      buttons.push(
        <ConstructionButton
          key="resume"
          title={buttonTitle}
          onPress={() => onResumeTask(task.assignmentId)}
          variant={buttonVariant}
          disabled={!canResumeTask}
          size="medium"
          icon="▶️"
          style={styles.actionButton}
        />
      );
    }
    
    // LEGACY: Handle old paused tasks (queued status but has been started)
    // This is for backward compatibility with old data
    if (task.status === 'pending' && task.startedAt) {
      buttons.push(
        <ConstructionButton
          key="resume-legacy"
          title="Resume Task"
          onPress={() => onResumeTask(task.assignmentId)}
          variant="success"
          size="medium"
          disabled={isOffline}
          icon="▶️"
          style={styles.actionButton}
        />
      );
    }

    // Location button for all tasks
    buttons.push(
      <ConstructionButton
        key="location"
        title="View on Map"
        onPress={handleViewLocation}
        variant="neutral"
        size="medium"
        icon="🗺️"
        style={styles.locationButton}
      />
    );

    return (
      <View style={styles.actionsContainer}>
        {buttons}
      </View>
    );
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onToggleExpand}
      disabled={!onToggleExpand}
    >
      <ConstructionCard
        variant="elevated"
        style={[styles.container, isExpanded ? styles.expandedCard : styles.collapsedCard]}
      >
        {/* Header with status and priority - Always visible */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.taskName} numberOfLines={isExpanded ? undefined : 1}>
                {task.taskName}
              </Text>
              {onToggleExpand && (
                <Text style={styles.expandIndicator}>
                  {isExpanded ? '▲' : '▼'}
                </Text>
              )}
            </View>
            <View style={styles.headerMeta}>
              <View style={styles.priorityIndicator}>
                <Text style={styles.priorityIcon}>{getPriorityIcon(task.priority || 'medium')}</Text>
                <Text style={[styles.priorityText, { color: getPriorityColor(task.priority || 'medium') }]}>
                  {getPriorityText(task.priority || 'medium')}
                </Text>
              </View>
              <Text style={styles.sequence}>#{task.sequence}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
            <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
          </View>
        </View>

        {/* Summary Info - Always visible */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>📋 Project:</Text>
          <Text style={styles.summaryValue} numberOfLines={isExpanded ? undefined : 1}>
            {task.projectCode} - {task.projectName}
          </Text>
        </View>

        {/* Expanded Content - Only visible when expanded */}
        {isExpanded && (
          <>
            {/* Section Divider */}
            <View style={styles.sectionDivider} />

            {/* Description */}
            <Text style={styles.description}>{task.description}</Text>

            {/* Assigned Project Section */}
            <View style={styles.projectInfoSection}>
              <Text style={styles.sectionTitle}>📌 ASSIGNED PROJECT</Text>
              <View style={styles.projectInfoRow}>
                <Text style={styles.projectInfoLabel}>Project Code:</Text>
                <Text style={styles.projectInfoValue}>{task.projectCode}</Text>
              </View>
              <View style={styles.projectInfoRow}>
                <Text style={styles.projectInfoLabel}>Project Name:</Text>
                <Text style={styles.projectInfoValue}>{task.projectName}</Text>
              </View>
              {task.clientName && task.clientName !== 'N/A' && (
                <View style={styles.projectInfoRow}>
                  <Text style={styles.projectInfoLabel}>Client:</Text>
                  <Text style={styles.projectInfoValue}>{task.clientName}</Text>
                </View>
              )}
              {task.siteName && (
                <View style={styles.projectInfoRow}>
                  <Text style={styles.projectInfoLabel}>Site:</Text>
                  <Text style={styles.projectInfoValue}>{task.siteName}</Text>
                </View>
              )}
              {task.natureOfWork && (
                <View style={styles.projectInfoRow}>
                  <Text style={styles.projectInfoLabel}>Nature of Work:</Text>
                  <Text style={styles.projectInfoValue}>{task.natureOfWork}</Text>
                </View>
              )}
            </View>

            {/* Work Location Section */}
            <View style={styles.locationSection}>
              <Text style={styles.sectionTitle}>📍 WORK LOCATION</Text>
              {task.projectGeofence && (
                <>
                  <View style={[
                    styles.geoStatusBadge,
                    isInsideGeofence ? styles.geoStatusInside : styles.geoStatusOutside
                  ]}>
                    <Text style={styles.geoStatusIcon}>
                      {isInsideGeofence ? '🟢' : '🔴'}
                    </Text>
                    <Text style={styles.geoStatusText}>
                      {isInsideGeofence ? 'Inside Geo-Fence' : 'Outside Geo-Fence'}
                    </Text>
                  </View>
                  {!isInsideGeofence && task.status === 'pending' && (
                    <Text style={styles.geoWarning}>
                      ⚠️ You must be at the work site to start this task
                    </Text>
                  )}
                  <View style={styles.locationButtons}>
                    <ConstructionButton
                      title="Navigate"
                      onPress={handleNavigateToSite}
                      variant="success"
                      size="small"
                      icon="🚗"
                      style={styles.locationButton}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Reporting Supervisor Section */}
            {(task.supervisorName || task.supervisorContact) && (
              <View style={styles.supervisorContactSection}>
                <Text style={styles.sectionTitle}>👨‍🔧 REPORTING SUPERVISOR</Text>
                {task.supervisorName && (
                  <Text style={styles.supervisorName}>{task.supervisorName}</Text>
                )}
                {task.supervisorContact && (
                  <>
                    <Text style={styles.supervisorContact}>{task.supervisorContact}</Text>
                    <View style={styles.contactButtons}>
                      <ConstructionButton
                        title="Call"
                        onPress={handleCallSupervisor}
                        variant="primary"
                        size="small"
                        icon="📞"
                        style={styles.contactButton}
                      />
                      <ConstructionButton
                        title="Message"
                        onPress={handleMessageSupervisor}
                        variant="neutral"
                        size="small"
                        icon="💬"
                        style={styles.contactButton}
                      />
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Nature of Work Section - Only show after task started */}
            {task.status === 'in_progress' && (
              <View style={styles.natureOfWorkSection}>
                <Text style={styles.sectionTitle}>🛠️ NATURE OF WORK</Text>
                {task.trade && (
                  <View style={styles.workDetail}>
                    <Text style={styles.workLabel}>Trade:</Text>
                    <Text style={styles.workValue}>{task.trade}</Text>
                  </View>
                )}
                {task.activity && (
                  <View style={styles.workDetail}>
                    <Text style={styles.workLabel}>Activity:</Text>
                    <Text style={styles.workValue}>{task.activity}</Text>
                  </View>
                )}
                {task.workType && (
                  <View style={styles.workDetail}>
                    <Text style={styles.workLabel}>Work Type:</Text>
                    <Text style={styles.workValue}>{task.workType}</Text>
                  </View>
                )}
                {task.requiredTools && task.requiredTools.length > 0 && (
                  <View style={styles.workDetail}>
                    <Text style={styles.workLabel}>Required Tools:</Text>
                    {task.requiredTools.map((tool, index) => (
                      <Text key={index} style={styles.listItem}>• {tool}</Text>
                    ))}
                  </View>
                )}
                {task.requiredMaterials && task.requiredMaterials.length > 0 && (
                  <View style={styles.workDetail}>
                    <Text style={styles.workLabel}>Required Materials:</Text>
                    {task.requiredMaterials.map((material, index) => (
                      <Text key={index} style={styles.listItem}>• {material}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Supervisor Instructions Section */}
            {task.supervisorInstructions && task.supervisorInstructions !== task.description && (
              <View style={styles.instructionsSection}>
                <Text style={styles.sectionTitle}>📋 SUPERVISOR INSTRUCTIONS</Text>
                <Text style={styles.instructionsText}>
                  {task.supervisorInstructions}
                </Text>
                
                {task.instructionAttachments && task.instructionAttachments.length > 0 && (
                  <View style={styles.attachmentsContainer}>
                    <Text style={styles.attachmentsLabel}>Attachments:</Text>
                    {task.instructionAttachments.map((attachment, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={styles.attachmentItem}
                        onPress={() => {
                          if (attachment.url) {
                            Linking.openURL(attachment.url);
                          } else {
                            Alert.alert('Not Available', 'Attachment URL not available');
                          }
                        }}
                      >
                        <Text style={styles.attachmentIcon}>
                          {attachment.type === 'drawing' ? '📐' : 
                           attachment.type === 'document' ? '📄' : 
                           attachment.type === 'photo' ? '📷' : '🎥'}
                        </Text>
                        <Text style={styles.attachmentDescription}>
                          {attachment.description || attachment.filename}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Daily Job Target Section - Comprehensive Display */}
            {task.dailyTarget && (
              <View style={styles.dailyJobTargetSection}>
                <Text style={styles.sectionTitle}>🎯 DAILY JOB TARGET</Text>
                
                {/* Target Type */}
                {task.dailyTarget.targetType && (
                  <View style={styles.targetRow}>
                    <Text style={styles.targetLabel}>Target Type:</Text>
                    <Text style={styles.targetValue}>{task.dailyTarget.targetType}</Text>
                  </View>
                )}

                {/* Expected Output */}
                <View style={styles.targetRow}>
                  <Text style={styles.targetLabel}>Expected Output:</Text>
                  <Text style={styles.targetValueHighlight}>
                    {task.dailyTarget.quantity} {task.dailyTarget.unit}
                  </Text>
                </View>

                {/* Area/Level */}
                {task.dailyTarget.areaLevel && (
                  <View style={styles.targetRow}>
                    <Text style={styles.targetLabel}>Area/Level:</Text>
                    <Text style={styles.targetValue}>{task.dailyTarget.areaLevel}</Text>
                  </View>
                )}

                {/* Time Schedule */}
                {(task.dailyTarget.startTime || task.dailyTarget.expectedFinish) && (
                  <>
                    {task.dailyTarget.startTime && (
                      <View style={styles.targetRow}>
                        <Text style={styles.targetLabel}>Start Time:</Text>
                        <Text style={styles.targetValue}>{task.dailyTarget.startTime}</Text>
                      </View>
                    )}
                    {task.dailyTarget.expectedFinish && (
                      <View style={styles.targetRow}>
                        <Text style={styles.targetLabel}>Expected Finish:</Text>
                        <Text style={styles.targetValue}>{task.dailyTarget.expectedFinish}</Text>
                      </View>
                    )}
                  </>
                )}

                {/* Progress Today */}
                {task.dailyTarget.progressToday && (
                  <View style={styles.progressTodaySection}>
                    <Text style={styles.progressTodayTitle}>Progress Today:</Text>
                    
                    <View style={styles.progressStatsRow}>
                      <View style={styles.progressStat}>
                        <Text style={styles.progressStatLabel}>Completed:</Text>
                        <Text style={styles.progressStatValue}>
                          {task.dailyTarget.progressToday.completed} / {task.dailyTarget.progressToday.total} {task.dailyTarget.unit}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                            width: `${task.dailyTarget.progressToday.percentage}%`,
                            backgroundColor: task.dailyTarget.progressToday.percentage >= 75 ? '#4CAF50' :
                                           task.dailyTarget.progressToday.percentage >= 50 ? '#FF9800' : '#F44336'
                          }
                        ]} 
                      />
                    </View>
                    
                    <Text style={styles.progressPercentage}>
                      Progress: {task.dailyTarget.progressToday.percentage}%
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Action Buttons */}
        {renderActionButtons()}
      </ConstructionCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.md,
  },
  taskName: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sequence: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.lg,
  },
  statusText: {
    color: ConstructionTheme.colors.onPrimary,
    ...ConstructionTheme.typography.labelMedium,
    textTransform: 'uppercase',
  },
  description: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: ConstructionTheme.spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: ConstructionTheme.spacing.lg,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  detailLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginRight: 6,
  },
  detailValue: {
    ...ConstructionTheme.typography.bodyMedium,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
  },
  dependenciesContainer: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  dependenciesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  dependenciesCount: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  dependencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dependencyConnector: {
    marginHorizontal: 8,
  },
  connectorText: {
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontSize: 16,
  },
  dependencyIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  dependencyWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: ConstructionTheme.colors.warning + '20',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: ConstructionTheme.colors.warning,
  },
  dependencyWarningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  dependencyWarningText: {
    ...ConstructionTheme.typography.bodySmall,
    color: '#E65100',
    flex: 1,
  },
  dependenciesLabel: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  dependenciesList: {
    flexDirection: 'column',
  },
  dependencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.primaryLight + '20',
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: 6,
    borderRadius: ConstructionTheme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: ConstructionTheme.colors.primary,
  },
  dependencyText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: '500',
  },
  instructionsContainer: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant + '30',
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.primary,
  },
  instructionsTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  instructionsText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: ConstructionTheme.spacing.md,
  },
  instructionsUpdated: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: ConstructionTheme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: 120,
  },
  locationButton: {
    flex: 1,
    minWidth: 120,
  },
  offlineIndicator: {
    marginTop: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.warning + '20',
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.warning,
  },
  offlineText: {
    ...ConstructionTheme.typography.bodySmall,
    color: '#E65100',
    fontWeight: '500',
  },
  projectInfoSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  projectInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  projectInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    width: 120,
  },
  projectInfoValue: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  acknowledgmentSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#666666',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
  },
  acknowledgeButton: {
    marginBottom: 12,
  },
  legalNote: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  acknowledgedBadge: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  acknowledgedText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Daily Target Styles
  dailyTargetSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 6,
    borderLeftColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dailyTargetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyTargetIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  dailyTargetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1565C0',
    letterSpacing: 0.5,
  },
  dailyTargetContent: {
    alignItems: 'center',
  },
  targetValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  targetQuantity: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1565C0',
    marginRight: 8,
  },
  targetUnit: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1976D2',
  },
  targetDescription: {
    fontSize: 14,
    color: '#424242',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  progressSection: {
    width: '100%',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },
  targetStatusBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  targetOnTrack: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  targetNearTarget: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  targetBehind: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  targetStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  // Collapsible styles
  collapsedCard: {
    minHeight: 120,
  },
  expandedCard: {
    minHeight: 200,
  },
  expandIndicator: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 8,
    fontWeight: '600',
  },
  summarySection: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginRight: 6,
  },
  summaryValue: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  locationSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  geoStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  geoStatusInside: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  geoStatusOutside: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  geoStatusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  geoStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  geoWarning: {
    fontSize: 13,
    color: '#D32F2F',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  supervisorContactSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  supervisorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  supervisorContact: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    flex: 1,
  },
  natureOfWorkSection: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  workDetail: {
    marginBottom: 8,
  },
  workLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  workValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  listItem: {
    fontSize: 13,
    color: '#000000',
    marginLeft: 8,
    marginTop: 2,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  instructionsSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1565C0',
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#1565C0',
    marginTop: 8,
    whiteSpace: 'pre-line',
  },
  attachmentsContainer: {
    marginTop: 12,
  },
  attachmentsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 6,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#FFF',
    borderRadius: 4,
    marginBottom: 4,
  },
  attachmentIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  attachmentDescription: {
    fontSize: 13,
    color: '#1976D2',
    flex: 1,
  },
  // Daily Job Target Section Styles
  dailyJobTargetSection: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 4,
  },
  targetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    flex: 1,
  },
  targetValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  targetValueHighlight: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  progressTodaySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#C8E6C9',
  },
  progressTodayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
  },
  progressStatsRow: {
    marginBottom: 12,
  },
  progressStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#424242',
  },
  progressStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
});

export default TaskCard;