// Daily Job Report Screen - Worker creates and submits daily work reports
// Updated to match exact API specification
// Requirements: 5.1, 5.2, 5.4

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLocation } from '../../store/context/LocationContext';
import { useAuth } from '../../store/context/AuthContext';
import { useOffline } from '../../store/context/OfflineContext';
import { workerApiService } from '../../services/api/WorkerApiService';
import { 
  DailyJobReport, 
  CreateDailyReportRequest,
  UploadReportPhotosRequest,
  SubmitDailyReportRequest,
  ReportPhoto
} from '../../types';
import PhotoManager from '../../components/forms/PhotoManager';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ConstructionButton from '../../components/common/ConstructionButton';
import ConstructionInput from '../../components/common/ConstructionInput';
import ConstructionCard from '../../components/common/ConstructionCard';
import ConstructionSelector from '../../components/common/ConstructionSelector';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface DailyReportScreenProps {
  route: {
    params: {
      reportId?: string;
      projectId?: number;
    };
  };
}

const DailyReportScreen: React.FC = () => {
  const { state: authState } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { reportId, projectId } = (route.params as any) || {};
  const { isOnline } = useOffline();

  // Get project ID from auth state or route params
  const currentProjectId = projectId || authState.user?.currentProject?.id || 1;

  // Form state matching API specification
  const [formData, setFormData] = useState<CreateDailyReportRequest>({
    date: new Date().toISOString().split('T')[0],
    projectId: currentProjectId,
    workArea: '',
    floor: '',
    summary: '',
    tasksCompleted: [{
      taskId: 0,
      description: '',
      quantityCompleted: 0,
      unit: '',
      progressPercent: 0,
      notes: ''
    }],
    issues: [],
    materialUsed: [],
    workingHours: {
      startTime: '08:00:00',
      endTime: '17:00:00',
      breakDuration: 60,
      overtimeHours: 0
    }
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReport, setExistingReport] = useState<DailyJobReport | null>(null);
  const [photos, setPhotos] = useState<ReportPhoto[]>([]);
  const [currentReportId, setCurrentReportId] = useState<string | null>(reportId || null);

  // Dropdown options
  const severityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' }
  ];

  const categoryOptions = [
    { label: 'Progress', value: 'progress' },
    { label: 'Issue', value: 'issue' },
    { label: 'Completion', value: 'completion' },
    { label: 'Material', value: 'material' }
  ];

  useEffect(() => {
    if (reportId) {
      loadExistingReport();
    }
  }, [reportId]);

  const loadExistingReport = async () => {
    if (!reportId) return;

    setIsLoading(true);
    try {
      const response = await workerApiService.getDailyReport(reportId);
      if (response.success && response.data) {
        const report = response.data;
        setExistingReport(report);
        
        // Convert report data to form data
        setFormData({
          date: report.date,
          projectId: report.projectId,
          workArea: report.workArea,
          floor: report.floor,
          summary: report.summary,
          tasksCompleted: report.tasksCompleted,
          issues: report.issues,
          materialUsed: report.materialUsed,
          workingHours: report.workingHours
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load report details');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof CreateDailyReportRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasksCompleted: [
        ...prev.tasksCompleted,
        {
          taskId: 0,
          description: '',
          quantityCompleted: 0,
          unit: '',
          progressPercent: 0,
          notes: ''
        }
      ]
    }));
  };

  const updateTask = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      tasksCompleted: prev.tasksCompleted.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const removeTask = (index: number) => {
    if (formData.tasksCompleted.length > 1) {
      setFormData(prev => ({
        ...prev,
        tasksCompleted: prev.tasksCompleted.filter((_, i) => i !== index)
      }));
    }
  };

  const addIssue = () => {
    setFormData(prev => ({
      ...prev,
      issues: [
        ...prev.issues,
        {
          type: '',
          description: '',
          severity: 'medium' as const,
          reportedAt: new Date().toISOString()
        }
      ]
    }));
  };

  const updateIssue = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.map((issue, i) => 
        i === index ? { ...issue, [field]: value } : issue
      )
    }));
  };

  const removeIssue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.filter((_, i) => i !== index)
    }));
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materialUsed: [
        ...prev.materialUsed,
        {
          materialId: 0,
          name: '',
          quantityUsed: 0,
          unit: ''
        }
      ]
    }));
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      materialUsed: prev.materialUsed.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materialUsed: prev.materialUsed.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.workArea.trim()) {
      Alert.alert('Validation Error', 'Work area is required');
      return false;
    }
    if (!formData.summary.trim()) {
      Alert.alert('Validation Error', 'Summary is required');
      return false;
    }
    if (formData.tasksCompleted.some(task => !task.description.trim())) {
      Alert.alert('Validation Error', 'All task descriptions are required');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (currentReportId) {
        // Update existing report (API doesn't specify update endpoint, so we'll show message)
        Alert.alert('Info', 'Report draft updated locally');
      } else {
        // Create new report
        const response = await workerApiService.createDailyReport(formData);
        if (response.success && response.data) {
          setCurrentReportId(response.data.reportId);
          Alert.alert('Success', 'Report draft saved successfully');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save report draft');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadPhotos = async () => {
    if (!currentReportId) {
      Alert.alert('Error', 'Please save the report first before uploading photos');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Error', 'Please select photos to upload');
      return;
    }

    setIsLoading(true);
    try {
      // Convert ReportPhoto to File for upload
      const filePhotos: File[] = photos.map(photo => {
        // Create a File-like object from ReportPhoto
        const blob = new Blob([], { type: photo.mimeType });
        const file = new File([blob], photo.filename, { type: photo.mimeType });
        // Add uri property for compatibility
        (file as any).uri = photo.uri;
        return file;
      });

      const uploadData: UploadReportPhotosRequest = {
        photos: filePhotos,
        category: 'progress',
        description: 'Daily report photos'
      };

      const response = await workerApiService.uploadReportPhotos(currentReportId, uploadData);
      if (response.success) {
        Alert.alert('Success', `${response.data.totalPhotos} photos uploaded successfully`);
        setPhotos([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!currentReportId) {
      Alert.alert('Error', 'Please save the report first');
      return;
    }

    Alert.alert(
      'Submit Report',
      'Are you sure you want to submit this report? You won\'t be able to edit it after submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const submitData: SubmitDailyReportRequest = {
                finalNotes: 'Report completed and ready for review',
                supervisorNotification: true
              };

              const response = await workerApiService.submitDailyReport(currentReportId, submitData);
              if (response.success) {
                Alert.alert('Success', 'Report submitted successfully', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to submit report');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return <LoadingOverlay visible={true} message="Loading report..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.container}>
      <ConstructionCard title="Daily Job Report">
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <ConstructionInput
            label="Date"
            value={formData.date}
            onChangeText={(value) => updateFormData('date', value)}
            placeholder="YYYY-MM-DD"
          />

          <ConstructionInput
            label="Work Area *"
            value={formData.workArea}
            onChangeText={(value) => updateFormData('workArea', value)}
            placeholder="e.g., Zone A, Building 1"
          />

          <ConstructionInput
            label="Floor"
            value={formData.floor}
            onChangeText={(value) => updateFormData('floor', value)}
            placeholder="e.g., Floor 3, Ground Floor"
          />

          <ConstructionInput
            label="Summary *"
            value={formData.summary}
            onChangeText={(value) => updateFormData('summary', value)}
            placeholder="Brief summary of work completed"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Working Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Working Hours</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <ConstructionInput
                label="Start Time"
                value={formData.workingHours.startTime}
                onChangeText={(value) => updateFormData('workingHours', {
                  ...formData.workingHours,
                  startTime: value
                })}
                placeholder="HH:MM:SS"
              />
            </View>
            <View style={styles.halfWidth}>
              <ConstructionInput
                label="End Time"
                value={formData.workingHours.endTime}
                onChangeText={(value) => updateFormData('workingHours', {
                  ...formData.workingHours,
                  endTime: value
                })}
                placeholder="HH:MM:SS"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <ConstructionInput
                label="Break Duration (minutes)"
                value={formData.workingHours.breakDuration.toString()}
                onChangeText={(value) => updateFormData('workingHours', {
                  ...formData.workingHours,
                  breakDuration: parseInt(value) || 0
                })}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <ConstructionInput
                label="Overtime Hours"
                value={formData.workingHours.overtimeHours.toString()}
                onChangeText={(value) => updateFormData('workingHours', {
                  ...formData.workingHours,
                  overtimeHours: parseInt(value) || 0
                })}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Tasks Completed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks Completed</Text>
            <TouchableOpacity onPress={addTask} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add Task</Text>
            </TouchableOpacity>
          </View>

          {formData.tasksCompleted.map((task, index) => (
            <View key={`task-${index}-${task.taskName || ''}-${Date.now()}`} style={styles.taskItem}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskNumber}>Task {index + 1}</Text>
                {formData.tasksCompleted.length > 1 && (
                  <TouchableOpacity onPress={() => removeTask(index)}>
                    <Text style={styles.removeButton}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ConstructionInput
                label="Task ID"
                value={task.taskId.toString()}
                onChangeText={(value) => updateTask(index, 'taskId', parseInt(value) || 0)}
                keyboardType="numeric"
              />

              <ConstructionInput
                label="Description *"
                value={task.description}
                onChangeText={(value) => updateTask(index, 'description', value)}
                placeholder="Task description"
                multiline
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <ConstructionInput
                    label="Quantity Completed"
                    value={task.quantityCompleted.toString()}
                    onChangeText={(value) => updateTask(index, 'quantityCompleted', parseInt(value) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <ConstructionInput
                    label="Unit"
                    value={task.unit}
                    onChangeText={(value) => updateTask(index, 'unit', value)}
                    placeholder="e.g., panels, m²"
                  />
                </View>
              </View>

              <ConstructionInput
                label="Progress Percent"
                value={task.progressPercent.toString()}
                onChangeText={(value) => updateTask(index, 'progressPercent', parseInt(value) || 0)}
                keyboardType="numeric"
                placeholder="0-100"
              />

              <ConstructionInput
                label="Notes"
                value={task.notes}
                onChangeText={(value) => updateTask(index, 'notes', value)}
                placeholder="Additional notes"
                multiline
              />
            </View>
          ))}
        </View>

        {/* Issues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Issues</Text>
            <TouchableOpacity onPress={addIssue} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add Issue</Text>
            </TouchableOpacity>
          </View>

          {formData.issues.map((issue, index) => (
            <View key={`issue-${index}-${issue.description?.substring(0, 10) || ''}-${Date.now()}`} style={styles.issueItem}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskNumber}>Issue {index + 1}</Text>
                <TouchableOpacity onPress={() => removeIssue(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              </View>

              <ConstructionInput
                label="Type"
                value={issue.type}
                onChangeText={(value) => updateIssue(index, 'type', value)}
                placeholder="e.g., material_shortage, equipment_failure"
              />

              <ConstructionInput
                label="Description"
                value={issue.description}
                onChangeText={(value) => updateIssue(index, 'description', value)}
                placeholder="Describe the issue"
                multiline
              />

              <ConstructionSelector
                label="Severity"
                value={issue.severity}
                onValueChange={(value) => updateIssue(index, 'severity', value)}
                options={severityOptions}
              />
            </View>
          ))}
        </View>

        {/* Materials Used */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Materials Used</Text>
            <TouchableOpacity onPress={addMaterial} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Add Material</Text>
            </TouchableOpacity>
          </View>

          {formData.materialUsed.map((material, index) => (
            <View key={`material-${index}-${material.materialName || ''}-${Date.now()}`} style={styles.materialItem}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskNumber}>Material {index + 1}</Text>
                <TouchableOpacity onPress={() => removeMaterial(index)}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              </View>

              <ConstructionInput
                label="Material ID"
                value={material.materialId.toString()}
                onChangeText={(value) => updateMaterial(index, 'materialId', parseInt(value) || 0)}
                keyboardType="numeric"
              />

              <ConstructionInput
                label="Name"
                value={material.name}
                onChangeText={(value) => updateMaterial(index, 'name', value)}
                placeholder="Material name"
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <ConstructionInput
                    label="Quantity Used"
                    value={material.quantityUsed.toString()}
                    onChangeText={(value) => updateMaterial(index, 'quantityUsed', parseInt(value) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <ConstructionInput
                    label="Unit"
                    value={material.unit}
                    onChangeText={(value) => updateMaterial(index, 'unit', value)}
                    placeholder="e.g., pieces, kg"
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Photo Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <PhotoManager
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={5}
            category="progress"
          />
          {photos.length > 0 && (
            <ConstructionButton
              title="Upload Photos"
              onPress={handleUploadPhotos}
              disabled={!currentReportId}
              style={styles.uploadButton}
            />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <ConstructionButton
            title="Save Draft"
            onPress={handleSaveDraft}
            disabled={isLoading || isSubmitting}
            variant="secondary"
            style={styles.actionButton}
          />

          <ConstructionButton
            title="Submit Report"
            onPress={handleSubmitReport}
            disabled={!currentReportId || isLoading || isSubmitting}
            loading={isSubmitting}
            style={styles.actionButton}
          />
        </View>
      </ConstructionCard>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
    padding: ConstructionTheme.spacing.md,
  },
  section: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: ConstructionTheme.typography.sizes.lg,
    fontWeight: ConstructionTheme.typography.weights.bold,
    color: ConstructionTheme.colors.text.primary,
  },
  addButton: {
    backgroundColor: ConstructionTheme.colors.primary,
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.sm,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  addButtonText: {
    color: ConstructionTheme.colors.onPrimary,
    fontSize: ConstructionTheme.typography.sizes.sm,
    fontWeight: ConstructionTheme.typography.weights.medium,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ConstructionTheme.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  taskItem: {
    backgroundColor: ConstructionTheme.colors.surface,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginBottom: ConstructionTheme.spacing.md,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.border,
  },
  issueItem: {
    backgroundColor: ConstructionTheme.colors.surface,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginBottom: ConstructionTheme.spacing.md,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.warning,
  },
  materialItem: {
    backgroundColor: ConstructionTheme.colors.surface,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginBottom: ConstructionTheme.spacing.md,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.info,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  taskNumber: {
    fontSize: ConstructionTheme.typography.sizes.md,
    fontWeight: ConstructionTheme.typography.weights.medium,
    color: ConstructionTheme.colors.text.primary,
  },
  removeButton: {
    color: ConstructionTheme.colors.error,
    fontSize: ConstructionTheme.typography.sizes.sm,
    fontWeight: ConstructionTheme.typography.weights.medium,
  },
  uploadButton: {
    marginTop: ConstructionTheme.spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ConstructionTheme.spacing.md,
    marginTop: ConstructionTheme.spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
});

export default DailyReportScreen;