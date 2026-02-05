import React, { useEffect, useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
  Picker
} from 'react-native';
import { supervisorApiService } from '../../services/api/SupervisorApiService';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface Worker {
  id: number;
  fullName: string;
  role?: string;
}

interface Task {
  id: number;
  taskName: string;
  description?: string;
  projectId: number;
  estimatedHours?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
 modalButtonCancelText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
  },
  modalButtonAssignText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
});

export default TaskManagementScreen;sm,
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonAssign: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    flex: 1,
    marginLeft: ConstructionTheme.spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
 ace,
    backgroundColor: ConstructionTheme.colors.surface,
    minHeight: 44,
    flex: 1,
    marginHorizontal: ConstructionTheme.spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: ConstructionTheme.spacing.md,
  },
  modalButtonCancel: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingVertical: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.tionTheme.colors.onSurfaceVariant,
    marginHorizontal: ConstructionTheme.spacing.sm,
  },
  targetInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  targetInput: {
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurf
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.sm,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    backgroundColor: ConstructionTheme.colors.surface,
    minHeight: 44,
    width: 80,
    textAlign: 'center',
  },
  timeInputSeparator: {
    ...ConstructionTheme.typography.bodyMedium,
    color: Construc: ConstructionTheme.spacing.xs,
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  priorityButtonActive: {
    // Color set dynamically
  },
  priorityButtonText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontWeight: 'bold',
  },
  priorityButtonTextActive: {
    color: ConstructionTheme.colors.onPrimary,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    borderWidth: 1,orizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    backgroundColor: ConstructionTheme.colors.surface,
    minHeight: 44,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginHorizontalacing.xs,
  },
  taskItemHours: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.primary,
  },
  formGroup: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  formLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  formInput: {
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.sm,
    paddingH: 'transparent',
  },
  taskItemSelected: {
    borderColor: ConstructionTheme.colors.primary,
    backgroundColor: ConstructionTheme.colors.primaryContainer,
  },
  taskItemName: {
    ...ConstructionTheme.typography.titleSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  taskItemDescription: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.sp,
  sectionLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  tasksList: {
    maxHeight: 200,
    marginBottom: ConstructionTheme.spacing.md,
  },
  taskItem: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginBottom: ConstructionTheme.spacing.sm,
    borderWidth: 2,
    borderColor.spacing.lg,
    width: '100%',
    maxHeight: '80%',
    ...ConstructionTheme.shadows.large,
  },
  modalTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.md,
    textAlign: 'center',
  }tructionTheme.shadows.small,
  },
  noDataText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.lg,
  },
  modalContent: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: ConstructionThemeConstructionTheme.colors.error,
  },
  actionButtonText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  removeButtonText: {
    color: ConstructionTheme.colors.onPrimary,
  },
  noDataContainer: {
    backgroundColor: ConstructionTheme.colors.surface,
    marginHorizontal: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.xl,
    borderRadius: ConstructionTheme.borderRadius.md,
    alignItems: 'center',
    ...Consontent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.outline,
    paddingTop: ConstructionTheme.spacing.sm,
  },
  actionButton: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginLeft: ConstructionTheme.spacing.sm,
    minHeight: 32,
    justifyContent: 'center',
  },
  removeButton: {
    backgroundColor: pography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  timeEstimate: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.primary,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  dailyTarget: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.success,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  assignmentActions: {
    flexDirection: 'row',
    justifyConPrimary,
    fontWeight: 'bold',
    fontSize: 10,
  },
  priorityBadge: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  priorityText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 10,
  },
  assignmentDetails: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  detailText: {
    ...ConstructionTheme.tyitleSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  assignmentStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: ConstructionTheme.spacing.sm,
    paddingVertical: ConstructionTheme.spacing.xs,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  statusText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.ructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    ...ConstructionTheme.shadows.small,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  assignmentInfo: {
    flex: 1,
    marginRight: ConstructionTheme.spacing.sm,
  },
  taskName: {
    ...ConstructionTheme.typography.t  ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  statLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  assignTaskText: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  assignmentCard: {
    backgroundColor: ConstructionTheme.colors.surface,
    marginHorizontal: Constader: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  workerName: {
    ...ConstructionTheme.typography.titleSmall,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: 'bold',
  },
  workerRole: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  workerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
  tionTheme.colors.onSurface,
    fontWeight: 'bold',
    marginHorizontal: ConstructionTheme.spacing.md,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  workersList: {
    paddingHorizontal: ConstructionTheme.spacing.md,
  },
  workerCard: {
    backgroundColor: ConstructionTheme.colors.surface,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginRight: ConstructionTheme.spacing.sm,
    width: 160,
    ...ConstructionTheme.shadows.small,
  },
  workerHeTheme.shadows.small,
  },
  summaryValue: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.primary,
    fontWeight: 'bold',
  },
  summaryLabel: {
    ...ConstructionTheme.typography.labelSmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: ConstructionTheme.spacing.xs,
  },
  section: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstrucpTextActive: {
    color: ConstructionTheme.colors.onPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: ConstructionTheme.spacing.md,
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.surface,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginHorizontal: ConstructionTheme.spacing.xs,
    alignItems: 'center',
    ...ConstructionuctionTheme.colors.surfaceVariant,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginRight: ConstructionTheme.spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  projectChipActive: {
    backgroundColor: ConstructionTheme.colors.primary,
  },
  projectChipText: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
  },
  projectChionTheme.colors.onPrimary,
    opacity: 0.8,
    marginTop: ConstructionTheme.spacing.xs,
  },
  projectSelector: {
    backgroundColor: ConstructionTheme.colors.surface,
    padding: ConstructionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.outline,
  },
  selectorLabel: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  projectChip: {
    backgroundColor: Constrheme.spacing.md,
  },
  header: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingHorizontal: ConstructionTheme.spacing.lg,
    paddingTop: ConstructionTheme.spacing.xl,
    paddingBottom: ConstructionTheme.spacing.md,
    ...ConstructionTheme.shadows.medium,
  },
  title: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  lastRefreshText: {
    ...ConstructionTheme.typography.labelSmall,
    color: Constructi        </View>
          </View>
        </View>
      </Modal>
    </View>
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
    marginTop: ConstructionTShowUpdateModal(false);
                  setSelectedAssignment(null);
                  resetForm();
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalButtonAssign}
                onPress={updateTaskAssignment}
              >
                <Text style={styles.modalButtonAssignText}>Update</Text>
              </TouchableOpacity>
    TextInput
                    style={styles.targetInput}
                    value={dailyTarget.unit}
                    onChangeText={(text) => setDailyTarget(prev => ({ ...prev, unit: text }))}
                    placeholder="Unit"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setstyle={styles.formGroup}>
                <Text style={styles.formLabel}>Daily Target:</Text>
                <View style={styles.targetInputs}>
                  <TextInput
                    style={styles.targetInput}
                    value={dailyTarget.quantity.toString()}
                    onChangeText={(text) => setDailyTarget(prev => ({ ...prev, quantity: parseInt(text) || 0 }))}
                    placeholder="Quantity"
                    keyboardType="numeric"
                  />
                  <timeInputSeparator}>h</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={timeEstimate.minutes.toString()}
                    onChangeText={(text) => setTimeEstimate(prev => ({ ...prev, minutes: parseInt(text) || 0 }))}
                    placeholder="Minutes"
                    keyboardType="numeric"
                  />
                  <Text style={styles.timeInputSeparator}>m</Text>
                </View>
              </View>

              <View mGroup}>
                <Text style={styles.formLabel}>Time Estimate:</Text>
                <View style={styles.timeInputs}>
                  <TextInput
                    style={styles.timeInput}
                    value={timeEstimate.hours.toString()}
                    onChangeText={(text) => setTimeEstimate(prev => ({ ...prev, hours: parseInt(text) || 0 }))}
                    placeholder="Hours"
                    keyboardType="numeric"
                  />
                  <Text style={styles.lors.surfaceVariant }
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={[
                        styles.priorityButtonText,
                        priority === p && styles.priorityButtonTextActive
                      ]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority:</Text>
                <View style={styles.priorityButtons}>
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityButton,
                        priority === p && styles.priorityButtonActive,
                        { backgroundColor: priority === p ? getPriorityColor(p) : ConstructionTheme.co        value={floor}
                  onChangeText={setFloor}
                  placeholder="Enter floor"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Zone:</Text>
                <TextInput
                  style={styles.formInput}
                  value={zone}
                  onChangeText={setZone}
                  placeholder="Enter zone"
                />
              </View>

              <View style={styles.for style={styles.formGroup}>
                <Text style={styles.formLabel}>Work Area:</Text>
                <TextInput
                  style={styles.formInput}
                  value={workArea}
                  onChangeText={setWorkArea}
                  placeholder="Enter work area"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Floor:</Text>
                <TextInput
                  style={styles.formInput}
          equestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Task Assignment</Text>
            
            {selectedAssignment && (
              <Text style={styles.modalSubtitle}>
                {selectedAssignment.taskName} - {selectedAssignment.workerName}
              </Text>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              <View  
              <TouchableOpacity
                style={styles.modalButtonAssign}
                onPress={assignTasks}
              >
                <Text style={styles.modalButtonAssignText}>
                  Assign ({selectedTasks.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Task Update Modal */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        transparent={true}
        onR         </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowAssignModal(false);
                  setSelectedWorker(null);
                  setSelectedTasks([]);
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
            }
                  onPress={() => toggleTaskSelection(task.id)}
                >
                  <Text style={styles.taskItemName}>{task.taskName}</Text>
                  {task.description && (
                    <Text style={styles.taskItemDescription}>{task.description}</Text>
                  )}
                  {task.estimatedHours && (
                    <Text style={styles.taskItemHours}>
                      Est. {task.estimatedHours}h
                    </Text>
                  )}
       : {workers.find(w => w.id === selectedWorker)?.fullName}
              </Text>
            )}

            <Text style={styles.sectionLabel}>Select Tasks:</Text>
            <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
              {tasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskItem,
                    selectedTasks.includes(task.id) && styles.taskItemSelected
                  ]}
        </View>
      </ScrollView>

      {/* Task Assignment Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Tasks</Text>
            
            {selectedWorker && (
              <Text style={styles.modalSubtitle}>
                Workerext style={styles.sectionTitle}>Active Task Assignments</Text>
          {activeAssignments.length > 0 ? (
            <FlatList
              data={activeAssignments}
              renderItem={renderTaskAssignment}
              keyExtractor={(item) => item.assignmentId.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No active task assignments</Text>
            </View>
          )ble Workers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Workers</Text>
          <FlatList
            data={workers}
            renderItem={renderWorkerCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.workersList}
          />
        </View>

        {/* Active Task Assignments */}
        <View style={styles.section}>
          <T          <Text style={styles.summaryLabel}>Active Tasks</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{workers.length}</Text>
            <Text style={styles.summaryLabel}>Available Workers</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{tasks.length}</Text>
            <Text style={styles.summaryLabel}>Total Tasks</Text>
          </View>
        </View>

        {/* Availa  <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[ConstructionTheme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{activeAssignments.length}</Text>
  </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Task Management</Text>
        {lastRefresh && (
          <Text style={styles.lastRefreshText}>
            Last updated: {lastRefresh.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        )}
      </View>

      {/* Project Selector */}
      {renderProjectSelector()}

    Theme.colors.success }]}>
              {completedTasks}
            </Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
        </View>

        <Text style={styles.assignTaskText}>Tap to assign tasks</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ConstructionTheme.colors.primary} />
        <Text style={styles.loadingText}>Loading task management...</Text>
      tyles.statItem}>
            <Text style={styles.statValue}>{queuedTasks}</Text>
            <Text style={styles.statLabel}>Queued</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: ConstructionTheme.colors.primary }]}>
              {activeTasks}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Constructionks = workerTaskList.filter(t => t.status === 'completed').length;

    return (
      <TouchableOpacity 
        style={styles.workerCard}
        onPress={() => {
          setSelectedWorker(item.id);
          setShowAssignModal(true);
        }}
      >
        <View style={styles.workerHeader}>
          <Text style={styles.workerName}>{item.fullName}</Text>
          <Text style={styles.workerRole}>{item.role}</Text>
        </View>
        
        <View style={styles.workerStats}>
          <View style={smentId)}
          >
            <Text style={[styles.actionButtonText, styles.removeButtonText]}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Render worker card
  const renderWorkerCard = ({ item }: { item: Worker }) => {
    const workerTaskList = workerTasks[item.id] || [];
    const queuedTasks = workerTaskList.filter(t => t.status === 'queued').length;
    const activeTasks = workerTaskList.filter(t => t.status === 'in_progress').length;
    const completedTasm.priority || 'MEDIUM');
            setTimeEstimate(item.timeEstimate || { hours: 8, minutes: 0 });
            setDailyTarget(item.dailyTarget || { quantity: 1, unit: 'task' });
            setShowUpdateModal(true);
          }}
        >
          <Text style={styles.actionButtonText}>Update</Text>
        </TouchableOpacity>

        {item.status === 'queued' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => removeQueuedTask(item.assign </Text>
      )}

      {item.dailyTarget && (
        <Text style={styles.dailyTarget}>
          Target: {item.dailyTarget.quantity} {item.dailyTarget.unit}
        </Text>
      )}

      <View style={styles.assignmentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedAssignment(item);
            setWorkArea(item.workArea || '');
            setFloor(item.floor || '');
            setZone(item.zone || '');
            setPriority(ite.assignmentDetails}>
        <Text style={styles.detailText}>Sequence: #{item.sequence}</Text>
        {item.workArea && <Text style={styles.detailText}>Area: {item.workArea}</Text>}
        {item.floor && <Text style={styles.detailText}>Floor: {item.floor}</Text>}
        {item.zone && <Text style={styles.detailText}>Zone: {item.zone}</Text>}
      </View>

      {item.timeEstimate && (
        <Text style={styles.timeEstimate}>
          Estimated: {item.timeEstimate.hours}h {item.timeEstimate.minutes}m
       mentStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
          {item.priority && (
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles          </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render task assignment card
  const renderTaskAssignment = ({ item }: { item: TaskAssignment }) => (
    <View style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
        <View style={styles.assignmentInfo}>
          <Text style={styles.taskName}>{item.taskName}</Text>
          <Text style={styles.workerName}>{item.workerName}</Text>
        </View>
        <View style={styles.assignllIndicator={false}>
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={[
              styles.projectChip,
              selectedProject === project.id && styles.projectChipActive
            ]}
            onPress={() => setSelectedProject(project.id)}
          >
            <Text style={[
              styles.projectChipText,
              selectedProject === project.id && styles.projectChipTextActive
            ]}>
              {project.name}
   {
      case 'HIGH':
        return ConstructionTheme.colors.error;
      case 'MEDIUM':
        return ConstructionTheme.colors.warning;
      case 'LOW':
        return ConstructionTheme.colors.success;
      default:
        return ConstructionTheme.colors.onSurfaceVariant;
    }
  };

  // Render project selector
  const renderProjectSelector = () => (
    <View style={styles.projectSelector}>
      <Text style={styles.selectorLabel}>Select Project:</Text>
      <ScrollView horizontal showsHorizontalScrov, taskId]
    );
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return ConstructionTheme.colors.warning;
      case 'in_progress':
        return ConstructionTheme.colors.primary;
      case 'completed':
        return ConstructionTheme.colors.success;
      default:
        return ConstructionTheme.colors.onSurfaceVariant;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority)ror', 'Failed to remove task');
            }
          }
        }
      ]
    );
  };

  // Reset form
  const resetForm = () => {
    setWorkArea('');
    setFloor('');
    setZone('');
    setPriority('MEDIUM');
    setTimeEstimate({ hours: 8, minutes: 0 });
    setDailyTarget({ quantity: 1, unit: 'task' });
  };

  // Toggle task selection
  const toggleTaskSelection = (taskId: number) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...pre        try {
              const response = await supervisorApiService.removeQueuedTask({
                assignmentId
              });

              if (response.success) {
                Alert.alert('Success', 'Task removed successfully');
                loadProjectData();
              } else {
                Alert.alert('Error', response.message || 'Failed to remove task');
              }
            } catch (error) {
              console.error('Remove task error:', error);
              Alert.alert('Erdate assignment');
      }
    } catch (error) {
      console.error('Update assignment error:', error);
      Alert.alert('Error', 'Failed to update assignment');
    }
  };

  // Remove queued task
  const removeQueuedTask = async (assignmentId: number) => {
    Alert.alert(
      'Remove Task',
      'Are you sure you want to remove this queued task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
         if (dailyTarget) changes.dailyTarget = dailyTarget;

      const response = await supervisorApiService.updateTaskAssignment({
        assignmentId: selectedAssignment.assignmentId,
        changes
      });

      if (response.success) {
        Alert.alert('Success', 'Task assignment updated successfully');
        setShowUpdateModal(false);
        setSelectedAssignment(null);
        resetForm();
        loadProjectData();
      } else {
        Alert.alert('Error', response.message || 'Failed to up{
      console.error('Task assignment error:', error);
      Alert.alert('Error', 'Failed to assign tasks');
    }
  };

  // Update task assignment
  const updateTaskAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      const changes: any = {};
      
      if (workArea) changes.workArea = workArea;
      if (floor) changes.floor = floor;
      if (zone) changes.zone = zone;
      if (priority) changes.priority = priority;
      if (timeEstimate) changes.timeEstimate = timeEstimate;
 signTask({
        employeeId: selectedWorker,
        projectId: selectedProject,
        taskIds: selectedTasks,
        date: assignmentDate
      });

      if (response.success) {
        Alert.alert('Success', `${selectedTasks.length} tasks assigned successfully`);
        setShowAssignModal(false);
        setSelectedWorker(null);
        setSelectedTasks([]);
        loadProjectData();
      } else {
        Alert.alert('Error', response.message || 'Failed to assign tasks');
      }
    } catch (error) edProject, assignmentDate, workers]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadProjectData();
    setIsRefreshing(false);
  }, [loadProjectData]);

  // Assign tasks to worker
  const assignTasks = async () => {
    if (!selectedWorker || selectedTasks.length === 0 || !selectedProject) {
      Alert.alert('Error', 'Please select a worker and at least one task');
      return;
    }

    try {
      const response = await supervisorApiService.as   if (workerTasksResponse.success && workerTasksResponse.data) {
            workerTasksData[worker.id] = workerTasksResponse.data.tasks || [];
          }
        } catch (error) {
          console.error(`Failed to load tasks for worker ${worker.id}:`, error);
        }
      }
      setWorkerTasks(workerTasksData);

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load project data:', error);
      Alert.alert('Error', 'Failed to load project data');
    }
  }, [selectta);
      }

      if (activeTasksResponse.success && activeTasksResponse.data) {
        setActiveAssignments(activeTasksResponse.data.activeTasks || []);
      }

      // Load individual worker tasks
      const workerTasksData: { [workerId: number]: TaskAssignment[] } = {};
      for (const worker of workers) {
        try {
          const workerTasksResponse = await supervisorApiService.getWorkerTasks({
            employeeId: worker.id,
            date: assignmentDate
          });
          
       ApiService.getCheckedInWorkers(selectedProject),
        supervisorApiService.getProjectTasks(selectedProject),
        supervisorApiService.getActiveTasks(selectedProject)
      ]);

      if (workersResponse.success && workersResponse.data) {
        setWorkers(workersResponse.data.map((w: any) => ({
          id: w.employee.id,
          fullName: w.employee.fullName,
          role: 'Worker'
        })));
      }

      if (tasksResponse.success && tasksResponse.data) {
        setTasks(tasksResponse.data.length > 0) {
          setSelectedProject(projectData[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load project-specific data
  const loadProjectData = useCallback(async () => {
    if (!selectedProject) return;

    try {
      const [workersResponse, tasksResponse, activeTasksResponse] = await Promise.all([
        supervisort]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const projectsResponse = await supervisorApiService.getSupervisorProjects();
      
      if (projectsResponse.success && projectsResponse.data) {
        const projectData = projectsResponse.data.map((p: any) => ({
          id: p.id,
          name: p.projectName || p.name,
          location: p.location || 'Unknown'
        }));
        setProjects(projectData);
        
        if (projectDarget, setDailyTarget] = useState({ quantity: 1, unit: 'task' });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data when project changes
  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    }
  }, [selectedProject]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedProject) {
        loadProjectData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedProjec]);
  const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignment | null>(null);

  // Form states
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [workArea, setWorkArea] = useState('');
  const [floor, setFloor] = useState('');
  const [zone, setZone] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [timeEstimate, setTimeEstimate] = useState({ hours: 8, minutes: 0 });
  const [dailyTarId: number]: TaskAssignment[] }>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([
  location: string;
}

const TaskManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<TaskAssignment[]>([]);
  const [workerTasks, setWorkerTasks] = useState<{ [worke}

interface TaskAssignment {
  assignmentId: number;
  taskId: number;
  taskName: string;
  employeeId: number;
  workerName: string;
  status: 'queued' | 'in_progress' | 'completed';
  sequence: number;
  startTime?: string;
  endTime?: string;
  workArea?: string;
  floor?: string;
  zone?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  timeEstimate?: {
    hours: number;
    minutes: number;
  };
  dailyTarget?: {
    quantity: number;
    unit: string;
  };
}

interface Project {
  id: number;
  name: string;