// Progress Report Screen - Supervisor role-specific screen for creating and managing daily progress reports
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSupervisorContext } from '../../store/context/SupervisorContext';
import { supervisorApiService } from '../../services/api/SupervisorApiService';
import { cameraService } from '../../services/camera/CameraService';
import {
  ConstructionCard,
  ConstructionButton,
  ConstructionInput,
  ConstructionLoadingIndicator,
  ErrorDisplay,
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { ProgressReport, SupervisorReport, ReportPhoto } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

interface MaterialConsumptionItem {
  materialId: number;
  name: string;
  consumed: number;
  remaining: number;
  unit: string;
  plannedConsumption: number;
  wastage: number;
  notes: string;
}

interface IssueItem {
  type: 'safety' | 'quality' | 'delay' | 'resource';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  location: string;
  actionTaken: string;
}

interface ProgressReportFormData {
  summary: string;
  manpowerUtilization: {
    totalWorkers: number;
    activeWorkers: number;
    productivity: number;
    efficiency: number;
    overtimeHours: number;
    absentWorkers: number;
    lateWorkers: number;
  };
  progressMetrics: {
    overallProgress: number;
    milestonesCompleted: number;
    tasksCompleted: number;
    hoursWorked: number;
  };
  issues: IssueItem[];
  materialConsumption: MaterialConsumptionItem[];
  photos: ReportPhoto[];
}

const ProgressReportScreen: React.FC = () => {
  const { state, loadDailyReports, createProgressReport, updateProgressReport, submitProgressReport } = useSupervisorContext();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SupervisorReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state for creating/editing reports
  const [formData, setFormData] = useState<ProgressReportFormData>({
    summary: '',
    manpowerUtilization: {
      totalWorkers: 0,
      activeWorkers: 0,
      productivity: 0,
      efficiency: 0,
      overtimeHours: 0,
      absentWorkers: 0,
      lateWorkers: 0,
    },
    progressMetrics: {
      overallProgress: 0,
      milestonesCompleted: 0,
      tasksCompleted: 0,
      hoursWorked: 0,
    },
    issues: [],
    materialConsumption: [],
    photos: [],
  });

  // Issue form state
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [currentIssue, setCurrentIssue] = useState<IssueItem>({
    type: 'safety',
    description: '',
    severity: 'low',
    status: 'open',
    location: '',
    actionTaken: '',
  });

  // Material consumption form state
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<MaterialConsumptionItem>({
    materialId: 0,
    name: '',
    consumed: 0,
    remaining: 0,
    unit: '',
    plannedConsumption: 0,
    wastage: 0,
    notes: '',
  });

  // Debug: Log form state changes
  useEffect(() => {
    console.log('🔵 Issue Form State Changed:', showIssueForm);
  }, [showIssueForm]);

  useEffect(() => {
    console.log('🟢 Material Form State Changed:', showMaterialForm);
  }, [showMaterialForm]);

  // Load reports on mount
  useEffect(() => {
    loadDailyReports();
  }, [loadDailyReports]);

  // Debug: Log when reports change
  useEffect(() => {
    console.log('📊 ProgressReportScreen - Reports updated:', state.dailyReports.length);
    console.log('📋 Report IDs in screen:', state.dailyReports.map(r => r.reportId || r.id).join(', '));
  }, [state.dailyReports]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDailyReports();
    } finally {
      setRefreshing(false);
    }
  }, [loadDailyReports]);

  // Reset form data
  const resetFormData = useCallback(() => {
    setFormData({
      summary: '',
      manpowerUtilization: {
        totalWorkers: 0,
        activeWorkers: 0,
        productivity: 0,
        efficiency: 0,
        overtimeHours: 0,
        absentWorkers: 0,
        lateWorkers: 0,
      },
      progressMetrics: {
        overallProgress: 0,
        milestonesCompleted: 0,
        tasksCompleted: 0,
        hoursWorked: 0,
      },
      issues: [],
      materialConsumption: [],
      photos: [],
    });
  }, []);

  // Create new progress report
  const handleCreateReport = useCallback(async () => {
    if (!formData.summary.trim()) {
      Alert.alert('Validation Error', 'Please provide a summary for the progress report.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create the progress report data
      const reportData: Omit<ProgressReport, 'reportId'> = {
        date: new Date().toISOString().split('T')[0],
        projectId: state.assignedProjects[0]?.id || 1, // Use first assigned project
        manpowerUtilization: formData.manpowerUtilization,
        progressMetrics: formData.progressMetrics,
        issues: formData.issues,
        materialConsumption: formData.materialConsumption,
        photos: formData.photos.map(photo => ({
          photoId: photo.photoId,
          category: photo.category as 'progress' | 'issue' | 'completion',
          url: photo.url,
          timestamp: photo.timestamp.toISOString(),
        })),
      };

      await createProgressReport(reportData);
      
      Alert.alert('Success', 'Progress report created successfully!');
      setShowCreateModal(false);
      resetFormData();
      
      // Explicitly reload the reports list to show the new report
      await loadDailyReports();
      
    } catch (error) {
      console.error('Error creating progress report:', error);
      Alert.alert('Error', 'Failed to create progress report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, state.assignedProjects, createProgressReport, resetFormData, loadDailyReports]);

  // Submit report for approval
  const handleSubmitReport = useCallback(async (reportId: string) => {
    Alert.alert(
      'Submit Report',
      'Are you sure you want to submit this report for approval? You won\'t be able to edit it after submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'default',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await submitProgressReport(reportId);
              Alert.alert('Success', 'Report submitted for approval!');
              
              // Explicitly reload the reports list to show updated status
              await loadDailyReports();
            } catch (error) {
              console.error('Error submitting report:', error);
              Alert.alert('Error', 'Failed to submit report. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  }, [submitProgressReport]);

  // Photo capture handlers
  const handleCapturePhoto = useCallback(async () => {
    try {
      const photo = await cameraService.capturePhoto();
      if (photo) {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, { ...photo, category: 'progress' }],
        }));
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  }, []);

  const handleSelectFromGallery = useCallback(async () => {
    try {
      const photo = await cameraService.selectFromGallery();
      if (photo) {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, { ...photo, category: 'progress' }],
        }));
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  }, []);

  const handleRemovePhoto = useCallback((photoIndex: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, index) => index !== photoIndex),
    }));
  }, []);

  // Issue management handlers
  const handleAddIssue = useCallback(() => {
    if (!currentIssue.description.trim()) {
      Alert.alert('Validation Error', 'Please provide an issue description.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      issues: [...prev.issues, currentIssue],
    }));

    setCurrentIssue({
      type: 'safety',
      description: '',
      severity: 'low',
      status: 'open',
      location: '',
      actionTaken: '',
    });
    setShowIssueForm(false);
  }, [currentIssue]);

  const handleRemoveIssue = useCallback((issueIndex: number) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.filter((_, index) => index !== issueIndex),
    }));
  }, []);

  // Material consumption handlers
  const handleAddMaterial = useCallback(() => {
    if (!currentMaterial.name.trim() || currentMaterial.consumed <= 0) {
      Alert.alert('Validation Error', 'Please provide valid material information.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      materialConsumption: [...prev.materialConsumption, {
        ...currentMaterial,
        materialId: Date.now(), // Mock ID generation
      }],
    }));

    setCurrentMaterial({
      materialId: 0,
      name: '',
      consumed: 0,
      remaining: 0,
      unit: '',
      plannedConsumption: 0,
      wastage: 0,
      notes: '',
    });
    setShowMaterialForm(false);
  }, [currentMaterial]);

  const handleRemoveMaterial = useCallback((materialIndex: number) => {
    setFormData(prev => ({
      ...prev,
      materialConsumption: prev.materialConsumption.filter((_, index) => index !== materialIndex),
    }));
  }, []);

  // Render report item
  const renderReportItem = useCallback(({ item }: { item: SupervisorReport }) => (
    <ConstructionCard
      title={`Report - ${item.date}`}
      subtitle={`Project: ${item.projectName}`}
      variant={item.status === 'submitted' ? 'success' : item.status === 'approved' ? 'success' : 'default'}
      style={styles.reportCard}
    >
      <View style={styles.reportContent}>
        <Text style={styles.reportSummary} numberOfLines={2}>
          {item.summary}
        </Text>
        
        <View style={styles.reportMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Progress</Text>
            <Text style={styles.metricValue}>{item.progressMetrics.overallProgress}%</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Workers</Text>
            <Text style={styles.metricValue}>{item.manpowerUtilization.activeWorkers}/{item.manpowerUtilization.totalWorkers}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Tasks</Text>
            <Text style={styles.metricValue}>{item.progressMetrics.tasksCompleted}</Text>
          </View>
        </View>

        <View style={styles.reportActions}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {(item.status || 'draft').toUpperCase()}
          </Text>
          
          {item.status === 'draft' && (
            <ConstructionButton
              title="Submit"
              onPress={() => handleSubmitReport(item.reportId)}
              variant="primary"
              size="small"
              disabled={isSubmitting}
            />
          )}
        </View>
      </View>
    </ConstructionCard>
  ), [handleSubmitReport, isSubmitting]);

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft':
        return ConstructionTheme.colors.warning;
      case 'submitted':
        return ConstructionTheme.colors.info;
      case 'approved':
        return ConstructionTheme.colors.success;
      default:
        return ConstructionTheme.colors.onSurface;
    }
  };

  // Render photo item
  const renderPhotoItem = useCallback(({ item, index }: { item: ReportPhoto; index: number }) => (
    <View style={styles.photoItem}>
      <Image source={{ uri: item.url }} style={styles.photoThumbnail} />
      <TouchableOpacity
        style={styles.removePhotoButton}
        onPress={() => handleRemovePhoto(index)}
      >
        <Text style={styles.removePhotoText}>×</Text>
      </TouchableOpacity>
    </View>
  ), [handleRemovePhoto]);

  // Render issue item
  const renderIssueItem = useCallback(({ item, index }: { item: IssueItem; index: number }) => (
    <View style={styles.issueItem}>
      <View style={styles.issueHeader}>
        <Text style={[styles.issueType, { color: getIssueTypeColor(item.type) }]}>
          {(item.type || 'general').toUpperCase()}
        </Text>
        <Text style={[styles.issueSeverity, { color: getSeverityColor(item.severity) }]}>
          {(item.severity || 'low').toUpperCase()}
        </Text>
        <TouchableOpacity onPress={() => handleRemoveIssue(index)}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.issueDescription}>{item.description}</Text>
      {item.location && (
        <Text style={styles.issueLocation}>📍 Location: {item.location}</Text>
      )}
      {item.actionTaken && (
        <Text style={styles.issueAction}>✅ Action: {item.actionTaken}</Text>
      )}
    </View>
  ), [handleRemoveIssue]);

  // Get issue type color
  const getIssueTypeColor = (type: string): string => {
    switch (type) {
      case 'safety':
        return ConstructionTheme.colors.error;
      case 'quality':
        return ConstructionTheme.colors.warning;
      case 'delay':
        return ConstructionTheme.colors.info;
      case 'resource':
        return ConstructionTheme.colors.secondary;
      default:
        return ConstructionTheme.colors.onSurface;
    }
  };

  // Get severity color
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
        return ConstructionTheme.colors.onSurface;
    }
  };

  // Render material item
  const renderMaterialItem = useCallback(({ item, index }: { item: MaterialConsumptionItem; index: number }) => (
    <View style={styles.materialItem}>
      <View style={styles.materialHeader}>
        <Text style={styles.materialName}>{item.name}</Text>
        <TouchableOpacity onPress={() => handleRemoveMaterial(index)}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.materialDetails}>
        Consumed: {item.consumed} {item.unit} | Remaining: {item.remaining} {item.unit}
      </Text>
      {(item.plannedConsumption > 0 || item.wastage > 0) && (
        <Text style={styles.materialDetails}>
          {item.plannedConsumption > 0 && `Planned: ${item.plannedConsumption} ${item.unit}`}
          {item.plannedConsumption > 0 && item.wastage > 0 && ' | '}
          {item.wastage > 0 && `Wastage: ${item.wastage} ${item.unit}`}
        </Text>
      )}
      {item.notes && (
        <Text style={styles.materialNotes}>Note: {item.notes}</Text>
      )}
    </View>
  ), [handleRemoveMaterial]);

  if (state.reportsLoading && state.dailyReports.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ConstructionLoadingIndicator message="Loading progress reports..." />
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.errorContainer}>
        <ErrorDisplay
          error={state.error}
          onRetry={handleRefresh}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress Reports</Text>
        <ConstructionButton
          title="Create Report"
          onPress={() => setShowCreateModal(true)}
          variant="primary"
          size="medium"
        />
      </View>

      {/* Reports List */}
      <FlatList
        data={state.dailyReports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.reportId}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[ConstructionTheme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <ConstructionCard title="No Reports" variant="outlined">
            <Text style={styles.emptyText}>
              No progress reports found. Create your first report to get started.
            </Text>
          </ConstructionCard>
        }
      />

      {/* Create Report Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Progress Report</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Summary Section */}
            <ConstructionCard title="Report Summary" variant="outlined">
              <ConstructionInput
                label="Summary"
                value={formData.summary}
                onChangeText={(text) => setFormData(prev => ({ ...prev, summary: text }))}
                placeholder="Enter progress report summary..."
                multiline
                numberOfLines={3}
              />
            </ConstructionCard>

            {/* Manpower Utilization */}
            <ConstructionCard title="Manpower Utilization" variant="outlined">
              <View style={styles.inputRow}>
                <ConstructionInput
                  label="Total Workers"
                  value={formData.manpowerUtilization.totalWorkers.toString()}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    manpowerUtilization: {
                      ...prev.manpowerUtilization,
                      totalWorkers: parseInt(text) || 0,
                    },
                  }))}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
                <ConstructionInput
                  label="Active Workers"
                  value={formData.manpowerUtilization.activeWorkers.toString()}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    manpowerUtilization: {
                      ...prev.manpowerUtilization,
                      activeWorkers: parseInt(text) || 0,
                    },
                  }))}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
              </View>
              <View style={styles.inputRow}>
                <ConstructionInput
                  label="Productivity (%)"
                  value={formData.manpowerUtilization.productivity.toString()}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    manpowerUtilization: {
                      ...prev.manpowerUtilization,
                      productivity: parseInt(text) || 0,
                    },
                  }))}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
                <ConstructionInput
                  label="Efficiency (%)"
                  value={formData.manpowerUtilization.efficiency.toString()}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    manpowerUtilization: {
                      ...prev.manpowerUtilization,
                      efficiency: parseInt(text) || 0,
                    },
                  }))}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
              </View>
              <View style={styles.inputRow}>
                <ConstructionInput
                  label="Overtime Hours"
                  value={formData.manpowerUtilization.overtimeHours.toString()}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    manpowerUtilization: {
                      ...prev.manpowerUtilization,
                      overtimeHours: parseFloat(text) || 0,
                    },
                  }))}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
                <ConstructionInput
                  label="Absent Workers"
                  value={formData.manpowerUtilization.absentWorkers.toString()}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    manpowerUtilization: {
                      ...prev.manpowerUtilization,
                      absentWorkers: parseInt(text) || 0,
                    },
                  }))}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
              </View>
              <ConstructionInput
                label="Late Workers"
                value={formData.manpowerUtilization.lateWorkers.toString()}
                onChangeText={(text) => setFormData(prev => ({
                  ...prev,
                  manpowerUtilization: {
                    ...prev.manpowerUtilization,
                    lateWorkers: parseInt(text) || 0,
                  },
                }))}
                keyboardType="numeric"
              />
            </ConstructionCard>

            {/* Progress Metrics */}
            <ConstructionCard title="Progress Metrics" variant="outlined">
              <View style={styles.inputRow}>
                <ConstructionInput
                  label="Overall Progress (%)"
                  value={formData.progressMetrics.overallProgress.toString()}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    progressMetrics: {
                      ...prev.progressMetrics,
                      overallProgress: parseInt(text) || 0,
                    },
                  }))}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
                <ConstructionInput
                  label="Milestones Completed"
                  value={formData.progressMetrics.milestonesCompleted.toString()}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    progressMetrics: {
                      ...prev.progressMetrics,
                      milestonesCompleted: parseInt(text) || 0,
                    },
                  }))}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
              </View>
              <View style={styles.inputRow}>
                <ConstructionInput
                  label="Tasks Completed"
                  value={formData.progressMetrics.tasksCompleted.toString()}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    progressMetrics: {
                      ...prev.progressMetrics,
                      tasksCompleted: parseInt(text) || 0,
                    },
                  }))}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
                <ConstructionInput
                  label="Hours Worked"
                  value={formData.progressMetrics.hoursWorked.toString()}
                  onChangeText={(text) => setFormData(prev => ({
                    ...prev,
                    progressMetrics: {
                      ...prev.progressMetrics,
                      hoursWorked: parseInt(text) || 0,
                    },
                  }))}
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
              </View>
            </ConstructionCard>

            {/* Issues Section */}
            <ConstructionCard title="Issues & Safety Incidents" variant="outlined">
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Issues ({formData.issues.length})</Text>
                <ConstructionButton
                  title={showIssueForm ? "Cancel" : "Add Issue"}
                  onPress={() => {
                    console.log('🔵 Add Issue button pressed!');
                    setShowIssueForm(!showIssueForm);
                    console.log('🔵 showIssueForm toggled to:', !showIssueForm);
                  }}
                  variant="secondary"
                  size="small"
                />
              </View>
              
              {/* Inline Issue Form */}
              {showIssueForm && (
                <View style={styles.inlineForm}>
                  <ConstructionInput
                    label="Issue Type"
                    value={currentIssue.type}
                    onChangeText={(text) => setCurrentIssue(prev => ({ ...prev, type: text as any }))}
                    placeholder="safety, quality, delay, resource"
                  />
                  
                  <ConstructionInput
                    label="Description *"
                    value={currentIssue.description}
                    onChangeText={(text) => setCurrentIssue(prev => ({ ...prev, description: text }))}
                    placeholder="Describe the issue..."
                    multiline
                    numberOfLines={3}
                  />
                  
                  <ConstructionInput
                    label="Severity"
                    value={currentIssue.severity}
                    onChangeText={(text) => setCurrentIssue(prev => ({ ...prev, severity: text as any }))}
                    placeholder="low, medium, high, critical"
                  />

                  <ConstructionInput
                    label="Location (Optional)"
                    value={currentIssue.location}
                    onChangeText={(text) => setCurrentIssue(prev => ({ ...prev, location: text }))}
                    placeholder="e.g., Block A, Floor 3, Zone 2"
                  />

                  <ConstructionInput
                    label="Action Taken (Optional)"
                    value={currentIssue.actionTaken}
                    onChangeText={(text) => setCurrentIssue(prev => ({ ...prev, actionTaken: text }))}
                    placeholder="Describe action taken..."
                    multiline
                    numberOfLines={2}
                  />

                  <ConstructionButton
                    title="Add Issue to List"
                    onPress={handleAddIssue}
                    variant="primary"
                    size="small"
                  />
                </View>
              )}
              
              {formData.issues.length > 0 ? (
                <FlatList
                  data={formData.issues}
                  renderItem={renderIssueItem}
                  keyExtractor={(_, index) => index.toString()}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.emptyText}>No issues reported</Text>
              )}
            </ConstructionCard>

            {/* Material Consumption */}
            <ConstructionCard title="Material Consumption" variant="outlined">
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Materials ({formData.materialConsumption.length})</Text>
                <ConstructionButton
                  title={showMaterialForm ? "Cancel" : "Add Material"}
                  onPress={() => {
                    console.log('🟢 Add Material button pressed!');
                    setShowMaterialForm(!showMaterialForm);
                    console.log('🟢 showMaterialForm toggled to:', !showMaterialForm);
                  }}
                  variant="secondary"
                  size="small"
                />
              </View>
              
              {/* Inline Material Form */}
              {showMaterialForm && (
                <View style={styles.inlineForm}>
                  <ConstructionInput
                    label="Material Name *"
                    value={currentMaterial.name}
                    onChangeText={(text) => setCurrentMaterial(prev => ({ ...prev, name: text }))}
                    placeholder="Enter material name"
                  />
                  
                  <View style={styles.inputRow}>
                    <ConstructionInput
                      label="Consumed *"
                      value={currentMaterial.consumed.toString()}
                      onChangeText={(text) => setCurrentMaterial(prev => ({ ...prev, consumed: parseFloat(text) || 0 }))}
                      keyboardType="numeric"
                      style={styles.halfInput}
                    />
                    <ConstructionInput
                      label="Remaining"
                      value={currentMaterial.remaining.toString()}
                      onChangeText={(text) => setCurrentMaterial(prev => ({ ...prev, remaining: parseFloat(text) || 0 }))}
                      keyboardType="numeric"
                      style={styles.halfInput}
                    />
                  </View>
                  
                  <ConstructionInput
                    label="Unit *"
                    value={currentMaterial.unit}
                    onChangeText={(text) => setCurrentMaterial(prev => ({ ...prev, unit: text }))}
                    placeholder="e.g., bags, tons, liters"
                  />

                  <View style={styles.inputRow}>
                    <ConstructionInput
                      label="Planned (Optional)"
                      value={currentMaterial.plannedConsumption.toString()}
                      onChangeText={(text) => setCurrentMaterial(prev => ({ ...prev, plannedConsumption: parseFloat(text) || 0 }))}
                      keyboardType="numeric"
                      style={styles.halfInput}
                    />
                    <ConstructionInput
                      label="Wastage (Optional)"
                      value={currentMaterial.wastage.toString()}
                      onChangeText={(text) => setCurrentMaterial(prev => ({ ...prev, wastage: parseFloat(text) || 0 }))}
                      keyboardType="numeric"
                      style={styles.halfInput}
                    />
                  </View>

                  <ConstructionInput
                    label="Notes (Optional)"
                    value={currentMaterial.notes}
                    onChangeText={(text) => setCurrentMaterial(prev => ({ ...prev, notes: text }))}
                    placeholder="Additional notes about material usage..."
                    multiline
                    numberOfLines={2}
                  />

                  <ConstructionButton
                    title="Add Material to List"
                    onPress={handleAddMaterial}
                    variant="primary"
                    size="small"
                  />
                </View>
              )}
              
              {formData.materialConsumption.length > 0 ? (
                <FlatList
                  data={formData.materialConsumption}
                  renderItem={renderMaterialItem}
                  keyExtractor={(_, index) => index.toString()}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.emptyText}>No materials tracked</Text>
              )}
            </ConstructionCard>

            {/* Photo Documentation */}
            <ConstructionCard title="Photo Documentation" variant="outlined">
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Photos ({formData.photos.length})</Text>
                <View style={styles.photoButtons}>
                  <ConstructionButton
                    title="Camera"
                    onPress={handleCapturePhoto}
                    variant="secondary"
                    size="small"
                    style={styles.photoButton}
                  />
                  <ConstructionButton
                    title="Gallery"
                    onPress={handleSelectFromGallery}
                    variant="secondary"
                    size="small"
                    style={styles.photoButton}
                  />
                </View>
              </View>
              {formData.photos.length > 0 ? (
                <FlatList
                  data={formData.photos}
                  renderItem={renderPhotoItem}
                  keyExtractor={(_, index) => index.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.photoList}
                />
              ) : (
                <Text style={styles.emptyText}>No photos added</Text>
              )}
            </ConstructionCard>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <ConstructionButton
                title="Cancel"
                onPress={() => {
                  setShowCreateModal(false);
                  resetFormData();
                }}
                variant="outline"
                style={styles.actionButton}
              />
              <ConstructionButton
                title="Create Report"
                onPress={handleCreateReport}
                variant="primary"
                style={styles.actionButton}
                disabled={isSubmitting}
                loading={isSubmitting}
              />
            </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ConstructionTheme.colors.background,
    padding: ConstructionTheme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
  },
  listContainer: {
    padding: ConstructionTheme.spacing.md,
  },
  reportCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  reportContent: {
    gap: ConstructionTheme.spacing.sm,
  },
  reportSummary: {
    fontSize: 14,
    color: ConstructionTheme.colors.onSurface,
    lineHeight: 20,
  },
  reportMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: ConstructionTheme.spacing.sm,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: ConstructionTheme.colors.primary,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: ConstructionTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: ConstructionTheme.colors.border,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: ConstructionTheme.colors.onSurfaceVariant,
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSurface,
  },
  closeButton: {
    fontSize: 24,
    color: ConstructionTheme.colors.onSurface,
    padding: ConstructionTheme.spacing.xs,
  },
  modalContent: {
    flex: 1,
    padding: ConstructionTheme.spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: ConstructionTheme.colors.onSurface,
  },
  inlineForm: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginBottom: ConstructionTheme.spacing.md,
    gap: ConstructionTheme.spacing.sm,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.xs,
  },
  photoButton: {
    minWidth: 80,
  },
  photoList: {
    marginTop: ConstructionTheme.spacing.sm,
  },
  photoItem: {
    position: 'relative',
    marginRight: ConstructionTheme.spacing.sm,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: ConstructionTheme.colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: ConstructionTheme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  issueItem: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    padding: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  issueType: {
    fontSize: 12,
    fontWeight: '600',
  },
  issueSeverity: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeText: {
    color: ConstructionTheme.colors.error,
    fontSize: 12,
    fontWeight: '500',
  },
  issueDescription: {
    fontSize: 14,
    color: ConstructionTheme.colors.onSurface,
  },
  issueLocation: {
    fontSize: 12,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: ConstructionTheme.spacing.xs,
    fontStyle: 'italic',
  },
  issueAction: {
    fontSize: 12,
    color: ConstructionTheme.colors.success,
    marginTop: ConstructionTheme.spacing.xs,
    fontStyle: 'italic',
  },
  materialItem: {
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    padding: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '500',
    color: ConstructionTheme.colors.onSurface,
  },
  materialDetails: {
    fontSize: 12,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  materialNotes: {
    fontSize: 12,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: ConstructionTheme.spacing.xs,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    gap: ConstructionTheme.spacing.sm,
    paddingTop: ConstructionTheme.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.md,
  },
  issueModal: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: ConstructionTheme.spacing.md,
    width: '100%',
    maxWidth: 400,
  },
  materialModal: {
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.md,
    padding: ConstructionTheme.spacing.md,
    width: '100%',
    maxWidth: 400,
  },
});

export default ProgressReportScreen;