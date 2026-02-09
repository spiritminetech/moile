import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import ConstructionCard from '../../components/common/ConstructionCard';
import ConstructionButton from '../../components/common/ConstructionButton';
import ConstructionInput from '../../components/common/ConstructionInput';
import ConstructionSelector from '../../components/common/ConstructionSelector';
import ConstructionLoadingIndicator from '../../components/common/ConstructionLoadingIndicator';
import PhotoManager from '../../components/forms/PhotoManager';
import { LocationContext } from '../../store/context/LocationContext';
import { useAuth } from '../../store/context/AuthContext';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { ReportPhoto } from '../../types';

interface IssueReportScreenProps {
  navigation: any;
  route: any;
}

interface IssueReport {
  type: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  photos: ReportPhoto[];
  location?: {
    latitude: number;
    longitude: number;
  };
}

const IssueReportScreen: React.FC<IssueReportScreenProps> = ({ navigation, route }) => {
  const { currentLocation } = useContext(LocationContext) as any;
  const { state } = useAuth();
  const user = state.user;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportType = route.params?.type || 'general';

  const [report, setReport] = useState<IssueReport>({
    type: reportType,
    title: '',
    description: '',
    priority: 'medium',
    category: 'technical',
    photos: [],
  });

  const issueCategories = [
    { label: 'Technical Issue', value: 'technical' },
    { label: 'Equipment Problem', value: 'equipment' },
    { label: 'Safety Concern', value: 'safety' },
    { label: 'Site Access', value: 'access' },
    { label: 'App Bug', value: 'app_bug' },
    { label: 'Other', value: 'other' },
  ];

  const priorityLevels = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ];

  const handlePhotoChange = (photos: ReportPhoto[]) => {
    setReport(prev => ({ ...prev, photos }));
  };

  const validateForm = (): boolean => {
    if (!report.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the issue.');
      return false;
    }
    if (!report.description.trim()) {
      Alert.alert('Validation Error', 'Please provide a description of the issue.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // In a real app, this would call the API service
      const issueData = {
        ...report,
        reporterId: user?.id,
        reporterName: user?.name,
        timestamp: new Date().toISOString(),
        location: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        } : undefined,
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Issue Reported',
        'Your issue has been reported successfully. You will receive updates on its status.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Submission Failed',
        'Failed to submit the issue report. Please try again or contact your supervisor.',
        [
          { text: 'Retry', onPress: handleSubmit },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScreenTitle = () => {
    switch (reportType) {
      case 'supervisor_contact':
        return 'Message Supervisor';
      case 'safety':
        return 'Safety Issue Report';
      default:
        return 'Report Issue';
    }
  };

  const getDescriptionPlaceholder = () => {
    switch (reportType) {
      case 'supervisor_contact':
        return 'Enter your message to the supervisor...';
      case 'safety':
        return 'Describe the safety concern in detail...';
      default:
        return 'Describe the issue you are experiencing...';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <ConstructionCard style={styles.formCard}>
            <Text style={styles.title}>{getScreenTitle()}</Text>

            <ConstructionInput
              label="Issue Title"
              value={report.title}
              onChangeText={(title: string) => setReport(prev => ({ ...prev, title }))}
              placeholder="Brief summary of the issue"
              required
            />

            <ConstructionSelector
              label="Category"
              value={report.category}
              onValueChange={(value) => setReport(prev => ({ ...prev, category: value as string }))}
              options={issueCategories}
            />

            <ConstructionSelector
              label="Priority"
              value={report.priority}
              onValueChange={(value) => setReport(prev => ({ ...prev, priority: value as string }))}
              options={priorityLevels}
            />

            <ConstructionInput
              label="Description"
              value={report.description}
              onChangeText={(description: string) => setReport(prev => ({ ...prev, description }))}
              placeholder={getDescriptionPlaceholder()}
              multiline
              numberOfLines={4}
              required
            />

            <PhotoManager
              photos={report.photos}
              onPhotosChange={handlePhotoChange}
              maxPhotos={5}
              label="Attach Photos (Optional)"
            />

            {currentLocation && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Current Location:</Text>
                <Text style={styles.locationText}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationNote}>
                  Location will be included with your report
                </Text>
              </View>
            )}
          </ConstructionCard>

          <View style={styles.buttonContainer}>
            <ConstructionButton
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="secondary"
              style={styles.cancelButton}
            />
            <ConstructionButton
              title={isSubmitting ? 'Submitting...' : 'Submit Report'}
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitButton}
            />
          </View>
        </View>
      </ScrollView>

      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ConstructionLoadingIndicator message="Submitting issue report..." />
        </View>
      )}
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: ConstructionTheme.spacing.md,
  },
  formCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  title: {
    fontSize: ConstructionTheme.typography.sizes.xl,
    fontWeight: ConstructionTheme.typography.weights.bold,
    color: ConstructionTheme.colors.text.primary,
    marginBottom: ConstructionTheme.spacing.lg,
    textAlign: 'center',
  },
  locationInfo: {
    marginTop: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.border,
  },
  locationLabel: {
    fontSize: ConstructionTheme.typography.sizes.sm,
    fontWeight: ConstructionTheme.typography.weights.semibold,
    color: ConstructionTheme.colors.text.primary,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  locationText: {
    fontSize: ConstructionTheme.typography.sizes.sm,
    color: ConstructionTheme.colors.text.secondary,
    fontFamily: 'monospace',
  },
  locationNote: {
    fontSize: ConstructionTheme.typography.sizes.xs,
    color: ConstructionTheme.colors.text.secondary,
    fontStyle: 'italic',
    marginTop: ConstructionTheme.spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ConstructionTheme.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IssueReportScreen;