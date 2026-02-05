// TripStatusUpdateForm - Real-time status reporting for transport tasks
// Requirements: 10.1, 10.2, 10.3, 10.4, 10.5

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { TransportTask, GeoLocation } from '../../types';
import { ConstructionButton, ConstructionCard, ConstructionInput, ConstructionSelector } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface TripStatusUpdateFormProps {
  transportTask: TransportTask;
  currentLocation: GeoLocation | null;
  onStatusUpdate: (updateData: TripStatusUpdate) => void;
  onDelayReport: (delayData: DelayReport) => void;
  onBreakdownReport: (breakdownData: BreakdownReport) => void;
  onPhotoUpload: (photoData: TripPhotoData) => void;
  isLoading?: boolean;
}

interface TripStatusUpdate {
  taskId: number;
  status: 'pending' | 'en_route_pickup' | 'pickup_complete' | 'en_route_dropoff' | 'completed';
  location: GeoLocation;
  timestamp: string;
  notes?: string;
  workerCount?: number;
}

interface DelayReport {
  taskId: number;
  delayReason: string;
  estimatedDelay: number; // in minutes
  location: GeoLocation;
  description: string;
  timestamp: string;
}

interface BreakdownReport {
  taskId: number;
  breakdownType: 'mechanical' | 'accident' | 'traffic' | 'weather' | 'other';
  severity: 'minor' | 'major' | 'critical';
  location: GeoLocation;
  description: string;
  assistanceRequired: boolean;
  timestamp: string;
}

interface TripPhotoData {
  taskId: number;
  photoUri: string;
  category: 'pickup' | 'dropoff' | 'incident' | 'delay' | 'completion';
  description: string;
  location: GeoLocation;
  timestamp: string;
}

const TripStatusUpdateForm: React.FC<TripStatusUpdateFormProps> = ({
  transportTask,
  currentLocation,
  onStatusUpdate,
  onDelayReport,
  onBreakdownReport,
  onPhotoUpload,
  isLoading = false,
}) => {
  const [selectedUpdateType, setSelectedUpdateType] = useState<'status' | 'delay' | 'breakdown' | 'photo'>('status');
  const [statusNotes, setStatusNotes] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [delayMinutes, setDelayMinutes] = useState('');
  const [delayDescription, setDelayDescription] = useState('');
  const [breakdownType, setBreakdownType] = useState<BreakdownReport['breakdownType']>('mechanical');
  const [breakdownSeverity, setBreakdownSeverity] = useState<BreakdownReport['severity']>('minor');
  const [breakdownDescription, setBreakdownDescription] = useState('');
  const [assistanceRequired, setAssistanceRequired] = useState(false);
  const [photoDescription, setPhotoDescription] = useState('');

  // Status update options based on current status
  const getAvailableStatusUpdates = () => {
    switch (transportTask.status) {
      case 'pending':
        return [
          { value: 'en_route_pickup', label: '🚌 En Route to Pickup' },
        ];
      case 'en_route_pickup':
        return [
          { value: 'pickup_complete', label: '✅ Pickup Complete' },
        ];
      case 'pickup_complete':
        return [
          { value: 'en_route_dropoff', label: '🏗️ En Route to Site' },
        ];
      case 'en_route_dropoff':
        return [
          { value: 'completed', label: '🎯 Trip Completed' },
        ];
      default:
        return [];
    }
  };

  // Delay reason options
  const delayReasonOptions = [
    { value: 'traffic', label: '🚦 Traffic Congestion' },
    { value: 'weather', label: '🌧️ Weather Conditions' },
    { value: 'vehicle', label: '🚌 Vehicle Issues' },
    { value: 'worker_delay', label: '👥 Worker Delays' },
    { value: 'road_closure', label: '🚧 Road Closure' },
    { value: 'accident', label: '🚨 Traffic Accident' },
    { value: 'fuel', label: '⛽ Fuel Stop' },
    { value: 'other', label: '❓ Other' },
  ];

  // Breakdown type options
  const breakdownTypeOptions = [
    { value: 'mechanical', label: '🔧 Mechanical Issue' },
    { value: 'accident', label: '🚨 Accident' },
    { value: 'traffic', label: '🚦 Traffic Incident' },
    { value: 'weather', label: '🌧️ Weather Related' },
    { value: 'other', label: '❓ Other' },
  ];

  // Breakdown severity options
  const breakdownSeverityOptions = [
    { value: 'minor', label: '🟢 Minor - Can Continue' },
    { value: 'major', label: '🟡 Major - Delayed' },
    { value: 'critical', label: '🔴 Critical - Cannot Continue' },
  ];

  // Handle status update
  const handleStatusUpdate = (newStatus: TripStatusUpdate['status']) => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'GPS location is required for status updates');
      return;
    }

    const updateData: TripStatusUpdate = {
      taskId: transportTask.taskId,
      status: newStatus,
      location: currentLocation,
      timestamp: new Date().toISOString(),
      notes: statusNotes.trim() || undefined,
      workerCount: transportTask.checkedInWorkers,
    };

    Alert.alert(
      'Update Status',
      `Update trip status to "${newStatus.replace('_', ' ').toUpperCase()}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            onStatusUpdate(updateData);
            setStatusNotes('');
          },
        },
      ]
    );
  };

  // Handle delay report
  const handleDelayReport = () => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'GPS location is required for delay reports');
      return;
    }

    if (!delayReason || !delayMinutes || !delayDescription.trim()) {
      Alert.alert('Missing Information', 'Please fill in all delay report fields');
      return;
    }

    const delayData: DelayReport = {
      taskId: transportTask.taskId,
      delayReason,
      estimatedDelay: parseInt(delayMinutes),
      location: currentLocation,
      description: delayDescription.trim(),
      timestamp: new Date().toISOString(),
    };

    Alert.alert(
      'Report Delay',
      `Report ${delayMinutes} minute delay due to ${delayReason}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: () => {
            onDelayReport(delayData);
            // Reset form
            setDelayReason('');
            setDelayMinutes('');
            setDelayDescription('');
          },
        },
      ]
    );
  };

  // Handle breakdown report
  const handleBreakdownReport = () => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'GPS location is required for breakdown reports');
      return;
    }

    if (!breakdownDescription.trim()) {
      Alert.alert('Missing Information', 'Please provide a description of the breakdown');
      return;
    }

    const breakdownData: BreakdownReport = {
      taskId: transportTask.taskId,
      breakdownType,
      severity: breakdownSeverity,
      location: currentLocation,
      description: breakdownDescription.trim(),
      assistanceRequired,
      timestamp: new Date().toISOString(),
    };

    Alert.alert(
      'Report Breakdown',
      `Report ${breakdownSeverity} ${breakdownType} breakdown?${assistanceRequired ? ' Assistance will be requested.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: breakdownSeverity === 'critical' ? 'destructive' : 'default',
          onPress: () => {
            onBreakdownReport(breakdownData);
            // Reset form
            setBreakdownDescription('');
            setAssistanceRequired(false);
          },
        },
      ]
    );
  };

  // Handle photo upload (mock implementation)
  const handlePhotoUpload = () => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'GPS location is required for photo uploads');
      return;
    }

    // Mock photo selection - in real implementation, would use camera/gallery
    Alert.alert(
      'Photo Upload',
      'Select photo source:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Camera',
          onPress: () => {
            // Mock photo data
            const photoData: TripPhotoData = {
              taskId: transportTask.taskId,
              photoUri: 'mock://photo/uri',
              category: 'incident',
              description: photoDescription.trim() || 'Trip documentation',
              location: currentLocation,
              timestamp: new Date().toISOString(),
            };
            onPhotoUpload(photoData);
            setPhotoDescription('');
            Alert.alert('Success', 'Photo uploaded successfully');
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            // Mock photo data
            const photoData: TripPhotoData = {
              taskId: transportTask.taskId,
              photoUri: 'mock://gallery/uri',
              category: 'completion',
              description: photoDescription.trim() || 'Trip documentation',
              location: currentLocation,
              timestamp: new Date().toISOString(),
            };
            onPhotoUpload(photoData);
            setPhotoDescription('');
            Alert.alert('Success', 'Photo uploaded successfully');
          },
        },
      ]
    );
  };

  const availableStatusUpdates = getAvailableStatusUpdates();

  return (
    <ConstructionCard title="Trip Status Updates" variant="elevated">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Current Status */}
        <View style={styles.currentStatus}>
          <Text style={styles.statusTitle}>Current Status</Text>
          <Text style={styles.statusValue}>
            {transportTask.status.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={styles.routeInfo}>
            Route: {transportTask.route} | Workers: {transportTask.checkedInWorkers}/{transportTask.totalWorkers}
          </Text>
        </View>

        {/* Update Type Selector */}
        <View style={styles.updateTypeSelector}>
          <Text style={styles.sectionTitle}>Select Update Type</Text>
          <View style={styles.updateTypeButtons}>
            <TouchableOpacity
              style={[
                styles.updateTypeButton,
                selectedUpdateType === 'status' && styles.updateTypeButtonActive
              ]}
              onPress={() => setSelectedUpdateType('status')}
            >
              <Text style={[
                styles.updateTypeButtonText,
                selectedUpdateType === 'status' && styles.updateTypeButtonTextActive
              ]}>
                📊 Status
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.updateTypeButton,
                selectedUpdateType === 'delay' && styles.updateTypeButtonActive
              ]}
              onPress={() => setSelectedUpdateType('delay')}
            >
              <Text style={[
                styles.updateTypeButtonText,
                selectedUpdateType === 'delay' && styles.updateTypeButtonTextActive
              ]}>
                ⏰ Delay
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.updateTypeButton,
                selectedUpdateType === 'breakdown' && styles.updateTypeButtonActive
              ]}
              onPress={() => setSelectedUpdateType('breakdown')}
            >
              <Text style={[
                styles.updateTypeButtonText,
                selectedUpdateType === 'breakdown' && styles.updateTypeButtonTextActive
              ]}>
                🚨 Breakdown
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.updateTypeButton,
                selectedUpdateType === 'photo' && styles.updateTypeButtonActive
              ]}
              onPress={() => setSelectedUpdateType('photo')}
            >
              <Text style={[
                styles.updateTypeButtonText,
                selectedUpdateType === 'photo' && styles.updateTypeButtonTextActive
              ]}>
                📸 Photo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Update Form */}
        {selectedUpdateType === 'status' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Update Trip Status</Text>
            
            <ConstructionInput
              label="Notes (Optional)"
              value={statusNotes}
              onChangeText={setStatusNotes}
              placeholder="Add any notes about the status update..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.statusButtons}>
              {availableStatusUpdates.map((statusOption) => (
                <ConstructionButton
                  key={statusOption.value}
                  title={statusOption.label}
                  onPress={() => handleStatusUpdate(statusOption.value as TripStatusUpdate['status'])}
                  variant="primary"
                  size="medium"
                  style={styles.statusButton}
                  loading={isLoading}
                />
              ))}
              {availableStatusUpdates.length === 0 && (
                <Text style={styles.noUpdatesText}>
                  ✅ No status updates available for current trip status
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Delay Report Form */}
        {selectedUpdateType === 'delay' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Report Delay</Text>
            
            <ConstructionSelector
              label="Delay Reason"
              value={delayReason}
              onValueChange={setDelayReason}
              options={delayReasonOptions}
              placeholder="Select delay reason..."
              required
            />

            <ConstructionInput
              label="Estimated Delay (minutes)"
              value={delayMinutes}
              onChangeText={setDelayMinutes}
              placeholder="Enter delay in minutes..."
              keyboardType="numeric"
              required
            />

            <ConstructionInput
              label="Description"
              value={delayDescription}
              onChangeText={setDelayDescription}
              placeholder="Describe the delay situation..."
              multiline
              numberOfLines={3}
              required
            />

            <ConstructionButton
              title="📝 Report Delay"
              onPress={handleDelayReport}
              variant="warning"
              size="medium"
              fullWidth
              loading={isLoading}
            />
          </View>
        )}

        {/* Breakdown Report Form */}
        {selectedUpdateType === 'breakdown' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Report Breakdown</Text>
            
            <ConstructionSelector
              label="Breakdown Type"
              value={breakdownType}
              onValueChange={(value) => setBreakdownType(value as BreakdownReport['breakdownType'])}
              options={breakdownTypeOptions}
              placeholder="Select breakdown type..."
              required
            />

            <ConstructionSelector
              label="Severity"
              value={breakdownSeverity}
              onValueChange={(value) => setBreakdownSeverity(value as BreakdownReport['severity'])}
              options={breakdownSeverityOptions}
              placeholder="Select severity level..."
              required
            />

            <ConstructionInput
              label="Description"
              value={breakdownDescription}
              onChangeText={setBreakdownDescription}
              placeholder="Describe the breakdown situation..."
              multiline
              numberOfLines={4}
              required
            />

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAssistanceRequired(!assistanceRequired)}
            >
              <Text style={styles.checkbox}>
                {assistanceRequired ? '☑️' : '☐'}
              </Text>
              <Text style={styles.checkboxLabel}>
                Request immediate assistance
              </Text>
            </TouchableOpacity>

            <ConstructionButton
              title="🚨 Report Breakdown"
              onPress={handleBreakdownReport}
              variant={breakdownSeverity === 'critical' ? 'error' : 'warning'}
              size="medium"
              fullWidth
              loading={isLoading}
            />
          </View>
        )}

        {/* Photo Upload Form */}
        {selectedUpdateType === 'photo' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Upload Photo</Text>
            
            <ConstructionInput
              label="Photo Description"
              value={photoDescription}
              onChangeText={setPhotoDescription}
              placeholder="Describe what the photo shows..."
              multiline
              numberOfLines={2}
            />

            <ConstructionButton
              title="📸 Take/Select Photo"
              onPress={handlePhotoUpload}
              variant="secondary"
              size="medium"
              fullWidth
              loading={isLoading}
            />
          </View>
        )}

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>📍 Current Location</Text>
          {currentLocation ? (
            <>
              <Text style={styles.locationText}>
                Lat: {currentLocation.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Lng: {currentLocation.longitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Accuracy: {Math.round(currentLocation.accuracy)}m
              </Text>
            </>
          ) : (
            <Text style={styles.locationError}>
              ⚠️ GPS location not available
            </Text>
          )}
        </View>
      </ScrollView>
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 600,
  },
  currentStatus: {
    marginBottom: ConstructionTheme.spacing.lg,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  statusTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onPrimaryContainer,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  statusValue: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    marginBottom: ConstructionTheme.spacing.xs,
    fontWeight: 'bold',
  },
  routeInfo: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimaryContainer,
  },
  updateTypeSelector: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onBackground,
    marginBottom: ConstructionTheme.spacing.md,
  },
  updateTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  updateTypeButton: {
    flex: 1,
    minWidth: '45%',
    padding: ConstructionTheme.spacing.md,
    margin: ConstructionTheme.spacing.xs,
    backgroundColor: ConstructionTheme.colors.surface,
    borderRadius: ConstructionTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: ConstructionTheme.colors.neutral,
    alignItems: 'center',
  },
  updateTypeButtonActive: {
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    borderColor: ConstructionTheme.colors.primary,
  },
  updateTypeButtonText: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurface,
    textAlign: 'center',
  },
  updateTypeButtonTextActive: {
    color: ConstructionTheme.colors.onPrimaryContainer,
    fontWeight: 'bold',
  },
  formSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  statusButtons: {
    marginTop: ConstructionTheme.spacing.md,
  },
  statusButton: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  noUpdatesText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    padding: ConstructionTheme.spacing.lg,
    fontStyle: 'italic',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.sm,
  },
  checkbox: {
    fontSize: ConstructionTheme.dimensions.iconMedium,
    marginRight: ConstructionTheme.spacing.sm,
  },
  checkboxLabel: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurface,
    flex: 1,
  },
  locationInfo: {
    marginTop: ConstructionTheme.spacing.lg,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  locationTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  locationText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  locationError: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.error,
    fontWeight: 'bold',
  },
});

export default TripStatusUpdateForm;