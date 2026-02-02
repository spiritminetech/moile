import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
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

interface SafetyIncidentScreenProps {
  navigation: any;
}

interface SafetyIncident {
  type: string;
  severity: string;
  description: string;
  injuredPersons: string;
  witnessNames: string;
  immediateActions: string;
  photos: ReportPhoto[];
  location?: {
    latitude: number;
    longitude: number;
  };
}

const SafetyIncidentScreen: React.FC<SafetyIncidentScreenProps> = ({ navigation }) => {
  const { currentLocation } = useContext(LocationContext) as any;
  const { state } = useAuth();
  const user = state.user;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [incident, setIncident] = useState<SafetyIncident>({
    type: 'near_miss',
    severity: 'low',
    description: '',
    injuredPersons: '',
    witnessNames: '',
    immediateActions: '',
    photos: [],
  });

  const incidentTypes = [
    { label: 'Near Miss', value: 'near_miss' },
    { label: 'Minor Injury', value: 'minor_injury' },
    { label: 'Major Injury', value: 'major_injury' },
    { label: 'Equipment Damage', value: 'equipment_damage' },
    { label: 'Environmental Spill', value: 'environmental' },
    { label: 'Fire/Explosion', value: 'fire_explosion' },
    { label: 'Other', value: 'other' },
  ];

  const severityLevels = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' },
  ];

  const handlePhotoChange = (photos: ReportPhoto[]) => {
    setIncident(prev => ({ ...prev, photos }));
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Services',
      'This will call emergency services (911). Only use for actual emergencies requiring immediate medical attention or fire/police response.',
      [
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:911');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSafetyOfficerCall = () => {
    Alert.alert(
      'Contact Safety Officer',
      'This will call the site safety officer for immediate assistance.',
      [
        {
          text: 'Call Safety Officer',
          onPress: () => {
            // In a real app, this would get the safety officer's phone from context/API
            const safetyOfficerPhone = '+1-555-SAFETY';
            Linking.openURL(`tel:${safetyOfficerPhone}`);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const shareLocation = async () => {
    if (!currentLocation) {
      Alert.alert('Location Error', 'Current location is not available.');
      return;
    }

    const locationText = `Emergency location: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`;
    const mapsUrl = `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
    
    Alert.alert(
      'Share Location',
      `${locationText}\n\nMaps Link: ${mapsUrl}`,
      [
        {
          text: 'Copy Location',
          onPress: () => {
            // In a real app, this would copy to clipboard
            Alert.alert('Copied', 'Location copied to clipboard');
          },
        },
        {
          text: 'Open in Maps',
          onPress: () => {
            Linking.openURL(mapsUrl);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateForm = (): boolean => {
    if (!incident.description.trim()) {
      Alert.alert('Validation Error', 'Please provide a description of the incident.');
      return false;
    }
    if (incident.severity === 'critical' && incident.photos.length === 0) {
      Alert.alert(
        'Photos Required',
        'Critical incidents require photo documentation. Please add at least one photo.'
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // For critical incidents, confirm emergency services have been contacted
    if (incident.severity === 'critical') {
      Alert.alert(
        'Critical Incident',
        'Have you contacted emergency services (911) if needed?',
        [
          {
            text: 'Yes, Continue',
            onPress: () => submitIncident(),
          },
          {
            text: 'Call 911 First',
            onPress: handleEmergencyCall,
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    submitIncident();
  };

  const submitIncident = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, this would call the API service
      const incidentData = {
        ...incident,
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
        'Incident Reported',
        'Safety incident has been reported successfully. Safety personnel will be notified immediately.',
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
        'Failed to submit the safety incident report. Please try again or contact the safety officer immediately.',
        [
          { text: 'Retry', onPress: submitIncident },
          { text: 'Call Safety Officer', onPress: handleSafetyOfficerCall },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Emergency Actions */}
          <ConstructionCard style={styles.emergencyCard}>
            <Text style={styles.emergencyTitle}>Emergency Actions</Text>
            <View style={styles.emergencyButtons}>
              <ConstructionButton
                title="Call 911"
                onPress={handleEmergencyCall}
                variant="danger"
                style={styles.emergencyButton}
              />
              <ConstructionButton
                title="Safety Officer"
                onPress={handleSafetyOfficerCall}
                variant="warning"
                style={styles.emergencyButton}
              />
              <ConstructionButton
                title="Share Location"
                onPress={shareLocation}
                variant="secondary"
                style={styles.emergencyButton}
                disabled={!currentLocation}
              />
            </View>
          </ConstructionCard>

          {/* Incident Report Form */}
          <ConstructionCard style={styles.formCard}>
            <Text style={styles.title}>Safety Incident Report</Text>

            <ConstructionSelector
              label="Incident Type"
              value={incident.type}
              onValueChange={(value) => setIncident(prev => ({ ...prev, type: value as string }))}
              options={incidentTypes}
            />

            <ConstructionSelector
              label="Severity Level"
              value={incident.severity}
              onValueChange={(value) => setIncident(prev => ({ ...prev, severity: value as string }))}
              options={severityLevels}
            />

            <ConstructionInput
              label="Incident Description"
              value={incident.description}
              onChangeText={(description: string) => setIncident(prev => ({ ...prev, description }))}
              placeholder="Describe what happened, when, and where..."
              multiline
              numberOfLines={4}
              required
            />

            <ConstructionInput
              label="Injured Persons (if any)"
              value={incident.injuredPersons}
              onChangeText={(injuredPersons: string) => setIncident(prev => ({ ...prev, injuredPersons }))}
              placeholder="Names and nature of injuries"
              multiline
              numberOfLines={2}
            />

            <ConstructionInput
              label="Witnesses"
              value={incident.witnessNames}
              onChangeText={(witnessNames: string) => setIncident(prev => ({ ...prev, witnessNames }))}
              placeholder="Names of witnesses present"
              multiline
              numberOfLines={2}
            />

            <ConstructionInput
              label="Immediate Actions Taken"
              value={incident.immediateActions}
              onChangeText={(immediateActions: string) => setIncident(prev => ({ ...prev, immediateActions }))}
              placeholder="What actions were taken immediately after the incident?"
              multiline
              numberOfLines={3}
            />

            <PhotoManager
              photos={incident.photos}
              onPhotosChange={handlePhotoChange}
              maxPhotos={10}
              label="Incident Photos"
              required={incident.severity === 'critical'}
            />

            {currentLocation && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Incident Location:</Text>
                <Text style={styles.locationText}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationNote}>
                  GPS coordinates will be included with the report
                </Text>
              </View>
            )}

            {incident.severity === 'critical' && (
              <View style={styles.criticalWarning}>
                <Text style={styles.criticalWarningText}>
                  ⚠️ CRITICAL INCIDENT: Ensure emergency services have been contacted if needed.
                  This report will trigger immediate notifications to safety personnel.
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
              variant={incident.severity === 'critical' ? 'danger' : 'primary'}
            />
          </View>
        </View>
      </ScrollView>

      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ConstructionLoadingIndicator message="Submitting safety incident report..." />
        </View>
      )}
    </KeyboardAvoidingView>
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
  emergencyCard: {
    marginBottom: ConstructionTheme.spacing.md,
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderWidth: 2,
  },
  emergencyTitle: {
    fontSize: ConstructionTheme.typography.sizes.lg,
    fontWeight: ConstructionTheme.typography.weights.bold,
    color: '#856404',
    marginBottom: ConstructionTheme.spacing.md,
    textAlign: 'center',
  },
  emergencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: ConstructionTheme.spacing.sm,
  },
  emergencyButton: {
    flex: 1,
    minWidth: '30%',
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
  criticalWarning: {
    marginTop: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: '#F8D7DA',
    borderRadius: ConstructionTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#DC3545',
  },
  criticalWarningText: {
    fontSize: ConstructionTheme.typography.sizes.sm,
    color: '#721C24',
    fontWeight: ConstructionTheme.typography.weights.semibold,
    textAlign: 'center',
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

export default SafetyIncidentScreen;