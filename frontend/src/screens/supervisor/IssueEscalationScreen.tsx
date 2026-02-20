// Issue Escalation Screen - Supervisor screen for escalating site issues to managers
// Requirements: 5.3 - Escalate Issues to Manager

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSupervisorContext } from '../../store/context/SupervisorContext';
import { supervisorApiService } from '../../services/api/SupervisorApiService';
import {
  ConstructionCard,
  ConstructionButton,
  ConstructionInput,
  ConstructionSelector,
  ConstructionLoadingIndicator,
} from '../../components/common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import PhotoManager from '../../components/forms/PhotoManager';
import { useAuth } from '../../store/context/AuthContext';

interface IssueEscalationScreenProps {
  navigation: any;
  route?: any;
}

interface IssueEscalation {
  issueType: 'MANPOWER_SHORTAGE' | 'SAFETY_INCIDENT' | 'MATERIAL_DELAY' | 
              'MATERIAL_DAMAGE' | 'WORKER_MISCONDUCT' | 'EQUIPMENT_BREAKDOWN' | 
              'SITE_INSTRUCTION_CHANGE' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  escalateTo: 'MANAGER' | 'ADMIN' | 'BOSS';
  photos: string[];
  projectId: number;
  notes: string;
  immediateActionRequired: boolean;
  estimatedImpact?: string;
  suggestedSolution?: string;
}

const IssueEscalationScreen: React.FC<IssueEscalationScreenProps> = ({ navigation, route }) => {
  const { state: supervisorState } = useSupervisorContext();
  const { state: authState } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-filled data from route params (if navigated from another screen)
  const prefilledType = route?.params?.issueType;
  const prefilledProjectId = route?.params?.projectId;

  // Form state
  const [escalation, setEscalation] = useState<IssueEscalation>({
    issueType: prefilledType || 'OTHER',
    severity: 'MEDIUM',
    title: '',
    description: '',
    escalateTo: 'MANAGER',
    photos: [],
    projectId: prefilledProjectId || supervisorState.assignedProjects[0]?.id || 0,
    notes: '',
    immediateActionRequired: false,
    estimatedImpact: '',
    suggestedSolution: '',
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Issue type options
  const issueTypeOptions = [
    { label: '👥 Manpower Shortage', value: 'MANPOWER_SHORTAGE' },
    { label: '⚠️ Safety Incident', value: 'SAFETY_INCIDENT' },
    { label: '📦 Material Delay', value: 'MATERIAL_DELAY' },
    { label: '💔 Material Damage', value: 'MATERIAL_DAMAGE' },
    { label: '👷 Worker Misconduct', value: 'WORKER_MISCONDUCT' },
    { label: '🔧 Equipment Breakdown', value: 'EQUIPMENT_BREAKDOWN' },
    { label: '📋 Site Instruction Change', value: 'SITE_INSTRUCTION_CHANGE' },
    { label: '📝 Other Issue', value: 'OTHER' },
  ];

  // Severity options
  const severityOptions = [
    { label: 'Low - Minor issue, can wait', value: 'LOW' },
    { label: 'Medium - Needs attention soon', value: 'MEDIUM' },
    { label: 'High - Urgent, affecting work', value: 'HIGH' },
    { label: 'Critical - Emergency, work stopped', value: 'CRITICAL' },
  ];

  // Escalate to options
  const escalateToOptions = [
    { label: 'Project Manager', value: 'MANAGER' },
    { label: 'Admin Office', value: 'ADMIN' },
    { label: 'Senior Management', value: 'BOSS' },
  ];

  // Project options
  const projectOptions = supervisorState.assignedProjects.map(project => ({
    label: project.name,
    value: project.id.toString(),
  }));

  // Update field
  const updateField = useCallback((field: keyof IssueEscalation, value: any) => {
    setEscalation(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!escalation.title.trim()) {
      newErrors.title = 'Issue title is required';
    }

    if (!escalation.description.trim()) {
      newErrors.description = 'Issue description is required';
    } else if (escalation.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!escalation.projectId) {
      newErrors.projectId = 'Please select a project';
    }

    if (escalation.severity === 'CRITICAL' && !escalation.immediateActionRequired) {
      Alert.alert(
        'Critical Issue',
        'Critical issues typically require immediate action. Are you sure this is not urgent?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue Anyway', 
            onPress: () => {
              setErrors(newErrors);
            }
          },
        ]
      );
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [escalation]);

  // Handle photo changes
  const handlePhotosChange = useCallback((photos: string[]) => {
    updateField('photos', photos);
  }, [updateField]);

  // Submit escalation
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    Alert.alert(
      'Escalate Issue',
      `Escalate this ${escalation.severity.toLowerCase()} issue to ${escalation.escalateTo.toLowerCase()}?${escalation.immediateActionRequired ? '\n\n⚠️ Immediate action will be requested.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Escalate',
          style: escalation.severity === 'CRITICAL' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setIsSubmitting(true);

              const escalationData = {
                ...escalation,
                supervisorId: authState.user?.id || 0,
                supervisorName: authState.user?.name || 'Unknown',
                timestamp: new Date().toISOString(),
              };

              const response = await supervisorApiService.createIssueEscalation(escalationData);

              if (response.success) {
                Alert.alert(
                  'Issue Escalated',
                  `Your ${escalation.issueType.replace(/_/g, ' ').toLowerCase()} has been escalated to ${escalation.escalateTo.toLowerCase()}.${escalation.immediateActionRequired ? ' They will be notified immediately.' : ''}`,
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              } else {
                Alert.alert('Error', response.errors?.[0] || 'Failed to escalate issue. Please try again.');
              }
            } catch (error) {
              console.error('Submit escalation error:', error);
              Alert.alert('Error', 'Failed to escalate issue. Please check your connection and try again.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  }, [escalation, validateForm, authState, navigation]);

  // Get severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL':
        return ConstructionTheme.colors.error;
      case 'HIGH':
        return ConstructionTheme.colors.warning;
      case 'MEDIUM':
        return ConstructionTheme.colors.info;
      case 'LOW':
        return ConstructionTheme.colors.success;
      default:
        return ConstructionTheme.colors.onSurface;
    }
  };

  // Get issue type icon
  const getIssueTypeIcon = (type: string): string => {
    switch (type) {
      case 'MANPOWER_SHORTAGE':
        return '👥';
      case 'SAFETY_INCIDENT':
        return '⚠️';
      case 'MATERIAL_DELAY':
        return '📦';
      case 'MATERIAL_DAMAGE':
        return '💔';
      case 'WORKER_MISCONDUCT':
        return '👷';
      case 'EQUIPMENT_BREAKDOWN':
        return '🔧';
      case 'SITE_INSTRUCTION_CHANGE':
        return '📋';
      default:
        return '📝';
    }
  };

  if (supervisorState.assignedProjects.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Projects Assigned</Text>
          <Text style={styles.emptyText}>
            You need to be assigned to a project before you can escalate issues.
          </Text>
          <ConstructionButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="primary"
            style={styles.emptyButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Escalate Issue</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Issue Type Card */}
          <ConstructionCard
            title="Issue Type"
            subtitle="What type of issue needs escalation?"
            variant="default"
            style={styles.card}
          >
            <ConstructionSelector
              label="Issue Category *"
              value={escalation.issueType}
              options={issueTypeOptions}
              onSelect={(value) => updateField('issueType', value)}
              placeholder="Select issue type"
              required
            />

            <View style={styles.issueTypePreview}>
              <Text style={styles.issueTypeIcon}>
                {getIssueTypeIcon(escalation.issueType)}
              </Text>
              <Text style={styles.issueTypeText}>
                {escalation.issueType.replace(/_/g, ' ')}
              </Text>
            </View>
          </ConstructionCard>

          {/* Severity & Priority Card */}
          <ConstructionCard
            title="Severity & Priority"
            subtitle="How urgent is this issue?"
            variant="default"
            style={styles.card}
          >
            <ConstructionSelector
              label="Severity Level *"
              value={escalation.severity}
              options={severityOptions}
              onSelect={(value) => updateField('severity', value as any)}
              required
            />

            <View style={[
              styles.severityIndicator,
              { backgroundColor: getSeverityColor(escalation.severity) }
            ]}>
              <Text style={styles.severityText}>
                {escalation.severity} PRIORITY
              </Text>
            </View>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => updateField('immediateActionRequired', !escalation.immediateActionRequired)}
              >
                <View style={[
                  styles.checkboxBox,
                  escalation.immediateActionRequired && styles.checkboxBoxChecked
                ]}>
                  {escalation.immediateActionRequired && (
                    <Text style={styles.checkboxIcon}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Immediate Action Required
                </Text>
              </TouchableOpacity>
            </View>
          </ConstructionCard>

          {/* Issue Details Card */}
          <ConstructionCard
            title="Issue Details"
            subtitle="Provide clear information about the issue"
            variant="default"
            style={styles.card}
          >
            <ConstructionInput
              label="Issue Title *"
              value={escalation.title}
              onChangeText={(text) => updateField('title', text)}
              placeholder="Brief summary of the issue..."
              maxLength={100}
              showCharacterCount
              error={errors.title}
              required
            />

            <ConstructionInput
              label="Detailed Description *"
              value={escalation.description}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Describe the issue in detail, including what happened, when, and current status..."
              multiline
              numberOfLines={6}
              maxLength={1000}
              showCharacterCount
              error={errors.description}
              required
            />

            <ConstructionInput
              label="Estimated Impact"
              value={escalation.estimatedImpact}
              onChangeText={(text) => updateField('estimatedImpact', text)}
              placeholder="How does this affect work progress, timeline, or safety?"
              multiline
              numberOfLines={3}
              maxLength={500}
              showCharacterCount
            />

            <ConstructionInput
              label="Suggested Solution"
              value={escalation.suggestedSolution}
              onChangeText={(text) => updateField('suggestedSolution', text)}
              placeholder="What do you recommend to resolve this issue?"
              multiline
              numberOfLines={3}
              maxLength={500}
              showCharacterCount
            />
          </ConstructionCard>

          {/* Project & Escalation Target Card */}
          <ConstructionCard
            title="Project & Escalation"
            subtitle="Which project and who should handle this?"
            variant="default"
            style={styles.card}
          >
            <ConstructionSelector
              label="Project *"
              value={escalation.projectId.toString()}
              options={projectOptions}
              onSelect={(value) => updateField('projectId', parseInt(value))}
              placeholder="Select project"
              error={errors.projectId}
              required
            />

            <ConstructionSelector
              label="Escalate To *"
              value={escalation.escalateTo}
              options={escalateToOptions}
              onSelect={(value) => updateField('escalateTo', value as any)}
              required
            />

            <View style={styles.escalationInfo}>
              <Text style={styles.escalationInfoIcon}>ℹ️</Text>
              <Text style={styles.escalationInfoText}>
                {escalation.escalateTo === 'MANAGER' && 'Project Manager will review and take action'}
                {escalation.escalateTo === 'ADMIN' && 'Admin office will coordinate resolution'}
                {escalation.escalateTo === 'BOSS' && 'Senior management will be notified immediately'}
              </Text>
            </View>
          </ConstructionCard>

          {/* Photos & Documentation Card */}
          <ConstructionCard
            title="Photos & Documentation"
            subtitle="Add photos or videos to support your escalation"
            variant="default"
            style={styles.card}
          >
            <PhotoManager
              photos={escalation.photos}
              onPhotosChange={handlePhotosChange}
              maxPhotos={5}
              allowCamera
              allowGallery
            />

            <Text style={styles.photoHint}>
              📸 Add photos of the issue, damage, or site conditions (up to 5 photos)
            </Text>
          </ConstructionCard>

          {/* Additional Notes Card */}
          <ConstructionCard
            title="Additional Notes"
            subtitle="Any other information that might help"
            variant="default"
            style={styles.card}
          >
            <ConstructionInput
              label="Notes"
              value={escalation.notes}
              onChangeText={(text) => updateField('notes', text)}
              placeholder="Add any additional context, previous attempts to resolve, or related issues..."
              multiline
              numberOfLines={4}
              maxLength={500}
              showCharacterCount
            />
          </ConstructionCard>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <ConstructionButton
              title={`Escalate ${escalation.severity} Issue`}
              onPress={handleSubmit}
              variant={escalation.severity === 'CRITICAL' ? 'error' : 'primary'}
              size="large"
              loading={isSubmitting}
              disabled={isSubmitting}
              icon="⬆️"
            />

            <Text style={styles.submitHint}>
              This will notify {escalation.escalateTo.toLowerCase()} and create a tracked issue record
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ConstructionLoadingIndicator message="Escalating issue..." />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ConstructionTheme.spacing.md,
    paddingVertical: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primary,
    ...ConstructionTheme.shadows.medium,
  },
  backButton: {
    paddingVertical: ConstructionTheme.spacing.sm,
    paddingHorizontal: ConstructionTheme.spacing.sm,
  },
  backButtonText: {
    ...ConstructionTheme.typography.buttonMedium,
    color: ConstructionTheme.colors.onPrimary,
  },
  headerTitle: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: ConstructionTheme.spacing.md,
    paddingBottom: ConstructionTheme.spacing.xl * 2,
  },
  card: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  issueTypePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginTop: ConstructionTheme.spacing.sm,
  },
  issueTypeIcon: {
    fontSize: 32,
    marginRight: ConstructionTheme.spacing.md,
  },
  issueTypeText: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  severityIndicator: {
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    alignItems: 'center',
    marginTop: ConstructionTheme.spacing.sm,
  },
  severityText: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onPrimary,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    marginTop: ConstructionTheme.spacing.md,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: ConstructionTheme.colors.outline,
    borderRadius: ConstructionTheme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.surface,
  },
  checkboxBoxChecked: {
    backgroundColor: ConstructionTheme.colors.primary,
    borderColor: ConstructionTheme.colors.primary,
  },
  checkboxIcon: {
    color: ConstructionTheme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    fontWeight: '600',
  },
  escalationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.infoContainer,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginTop: ConstructionTheme.spacing.sm,
  },
  escalationInfoIcon: {
    fontSize: 20,
    marginRight: ConstructionTheme.spacing.sm,
  },
  escalationInfoText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
  },
  photoHint: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginTop: ConstructionTheme.spacing.sm,
    fontStyle: 'italic',
  },
  submitContainer: {
    marginTop: ConstructionTheme.spacing.lg,
  },
  submitHint: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: ConstructionTheme.spacing.sm,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ConstructionTheme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: ConstructionTheme.spacing.lg,
  },
  emptyTitle: {
    ...ConstructionTheme.typography.headlineMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: ConstructionTheme.spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
});

export default IssueEscalationScreen;
