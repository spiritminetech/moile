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
import { TransportTask, GeoLocation, VehicleRequest, GracePeriodApplication, ModuleIntegration } from '../../types';
import { ConstructionButton, ConstructionCard, ConstructionInput, ConstructionSelector } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';
import { validateTimeWindow, validateGeofence, calculateGracePeriod } from '../../utils/validation';

interface TripStatusUpdateFormProps {
  transportTask: TransportTask;
  currentLocation: GeoLocation | null;
  onStatusUpdate: (updateData: TripStatusUpdate) => void;
  onDelayReport: (delayData: DelayReport) => void;
  onBreakdownReport: (breakdownData: BreakdownReport) => void;
  onPhotoUpload: (photoData: TripPhotoData) => void;
  onVehicleRequest?: (vehicleRequest: VehicleRequest) => void;
  onGracePeriodApplication?: (gracePeriod: GracePeriodApplication) => void;
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
  onVehicleRequest,
  onGracePeriodApplication,
  isLoading = false,
}) => {
  const [selectedUpdateType, setSelectedUpdateType] = useState<'status' | 'delay' | 'breakdown' | 'photo' | 'vehicle'>('status');
  const [statusNotes, setStatusNotes] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [delayMinutes, setDelayMinutes] = useState('');
  const [delayDescription, setDelayDescription] = useState('');
  const [breakdownType, setBreakdownType] = useState<BreakdownReport['breakdownType']>('mechanical');
  const [breakdownSeverity, setBreakdownSeverity] = useState<BreakdownReport['severity']>('minor');
  const [breakdownDescription, setBreakdownDescription] = useState('');
  const [assistanceRequired, setAssistanceRequired] = useState(false);
  const [photoDescription, setPhotoDescription] = useState('');
  
  // Vehicle request state
  const [vehicleRequestType, setVehicleRequestType] = useState<VehicleRequest['requestType']>('replacement');
  const [vehicleRequestReason, setVehicleRequestReason] = useState('');
  const [vehicleRequestUrgency, setVehicleRequestUrgency] = useState<VehicleRequest['urgency']>('medium');

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

  // Enhanced status update with validation
  const handleStatusUpdate = (newStatus: TripStatusUpdate['status']) => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'GPS location is required for status updates');
      return;
    }

    // Time window validation for pickup
    if (newStatus === 'pickup_complete') {
      const pickupLocation = transportTask.pickupLocations[0]; // Assuming first location for now
      if (pickupLocation?.timeWindow) {
        const scheduledTime = new Date(pickupLocation.estimatedPickupTime);
        const timeValidation = validateTimeWindow(new Date(), scheduledTime, pickupLocation.timeWindow.windowMinutes);
        
        if (!timeValidation.isValid) {
          Alert.alert(
            'Time Window Violation',
            timeValidation.message,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Proceed Anyway', 
                style: 'destructive',
                onPress: () => proceedWithStatusUpdate(newStatus)
              }
            ]
          );
          return;
        }
      }

      // Geofence validation for pickup
      if (pickupLocation?.geofence) {
        const geofenceValidation = validateGeofence(
          { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
          pickupLocation.geofence,
          pickupLocation.name
        );
        
        if (!geofenceValidation.isValid) {
          Alert.alert(
            'Location Validation Failed',
            geofenceValidation.message,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Override', 
                style: 'destructive',
                onPress: () => proceedWithStatusUpdate(newStatus)
              }
            ]
          );
          return;
        }
      }
    }

    // Geofence validation for dropoff
    if (newStatus === 'completed' && transportTask.dropoffLocation?.geofence) {
      const geofenceValidation = validateGeofence(
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        transportTask.dropoffLocation.geofence,
        transportTask.dropoffLocation.name
      );
      
      if (!geofenceValidation.isValid) {
        Alert.alert(
          'Dropoff Location Validation Failed',
          geofenceValidation.message,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Override', 
              style: 'destructive',
              onPress: () => proceedWithStatusUpdate(newStatus)
            }
          ]
        );
        return;
      }
    }

    proceedWithStatusUpdate(newStatus);
  };

  const proceedWithStatusUpdate = (newStatus: TripStatusUpdate['status']) => {
    const updateData: TripStatusUpdate = {
      taskId: transportTask.taskId,
      status: newStatus,
      location: currentLocation!,
      timestamp: new Date().toISOString(),
      notes: statusNotes.trim() || undefined,
      workerCount: transportTask.checkedInWorkers,
    };

    Alert.alert(
      'Confirm Status Update',
      `Update trip status to "${newStatus.replace('_', ' ').toUpperCase()}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            onStatusUpdate(updateData);
            setStatusNotes('');
          },
        },
      ]
    );
  };

  // Enhanced delay report with grace period calculation
  const handleDelayReport = () => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'GPS location is required for delay reports');
      return;
    }

    if (!delayReason || !delayMinutes || !delayDescription.trim()) {
      Alert.alert('Missing Information', 'Please fill in all delay report fields');
      return;
    }

    const delayMinutesNum = parseInt(delayMinutes);
    const gracePeriod = calculateGracePeriod(delayMinutesNum, delayReason);

    const delayData: DelayReport = {
      taskId: transportTask.taskId,
      delayReason,
      estimatedDelay: delayMinutesNum,
      location: currentLocation,
      description: delayDescription.trim(),
      timestamp: new Date().toISOString(),
    };

    const gracePeriodMessage = gracePeriod.autoApproved 
      ? `\n\nGrace period of ${gracePeriod.gracePeriodMinutes} minutes will be automatically applied to affected workers.`
      : gracePeriod.requiresApproval 
        ? `\n\nGrace period of ${gracePeriod.gracePeriodMinutes} minutes requires supervisor approval.`
        : '';

    Alert.alert(
      'Report Delay',
      `Report ${delayMinutes} minute delay due to ${delayReason}?${gracePeriodMessage}`,
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
            
            // Show vehicle request option for major delays
            if (delayMinutesNum >= 30) {
              setTimeout(() => {
                Alert.alert(
                  'Request Alternate Vehicle?',
                  'This delay is significant. Would you like to request an alternate vehicle?',
                  [
                    { text: 'Not Now', style: 'cancel' },
                    { 
                      text: 'Request Vehicle', 
                      onPress: () => handleVehicleRequest('replacement', 'Significant delay reported')
                    }
                  ]
                );
              }, 1000);
            }
          },
        },
      ]
    );
  };

  // Handle breakdown report with vehicle request option
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
            
            // Auto-request vehicle for major/critical breakdowns
            if (breakdownSeverity === 'major' || breakdownSeverity === 'critical') {
              setTimeout(() => {
                const urgency = breakdownSeverity === 'critical' ? 'critical' : 'high';
                handleVehicleRequest('emergency', `${breakdownSeverity} ${breakdownType} breakdown`, urgency);
              }, 1000);
            }
          },
        },
      ]
    );
  };

  // Handle vehicle request
  const handleVehicleRequest = (
    requestType: VehicleRequest['requestType'] = vehicleRequestType, 
    reason: string = vehicleRequestReason,
    urgency: VehicleRequest['urgency'] = vehicleRequestUrgency
  ) => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'GPS location is required for vehicle requests');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Missing Information', 'Please provide a reason for the vehicle request');
      return;
    }

    const vehicleRequest: VehicleRequest = {
      taskId: transportTask.taskId,
      requestType,
      reason: reason.trim(),
      urgency,
      currentLocation,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };

    const urgencyText = urgency === 'critical' ? 'EMERGENCY' : urgency.toUpperCase();
    const requestTypeText = requestType === 'replacement' ? 'replacement vehicle' : 
                           requestType === 'additional' ? 'additional vehicle' : 'emergency assistance';

    Alert.alert(
      `${urgencyText} Vehicle Request`,
      `Request ${requestTypeText} for: ${reason}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          style: urgency === 'critical' ? 'destructive' : 'default',
          onPress: () => {
            if (onVehicleRequest) {
              onVehicleRequest(vehicleRequest);
            }
            // Reset form
            setVehicleRequestReason('');
            setVehicleRequestType('replacement');
            setVehicleRequestUrgency('medium');
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
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
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
            <TouchableOpacity
              style={[
                styles.updateTypeButton,
                selectedUpdateType === 'vehicle' && styles.updateTypeButtonActive
              ]}
              onPress={() => setSelectedUpdateType('vehicle')}
            >
              <Text style={[
                styles.updateTypeButtonText,
                selectedUpdateType === 'vehicle' && styles.updateTypeButtonTextActive
              ]}>
                🚗 Vehicle
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

        {/* Vehicle Request Form */}
        {selectedUpdateType === 'vehicle' && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Request Vehicle</Text>
            
            <ConstructionSelector
              label="Request Type"
              value={vehicleRequestType}
              onValueChange={setVehicleRequestType}
              options={[
                { value: 'replacement', label: '🔄 Replacement Vehicle' },
                { value: 'additional', label: '➕ Additional Vehicle' },
                { value: 'emergency', label: '🚨 Emergency Assistance' },
              ]}
            />

            <ConstructionSelector
              label="Urgency Level"
              value={vehicleRequestUrgency}
              onValueChange={setVehicleRequestUrgency}
              options={[
                { value: 'low', label: '🟢 Low - Can Wait' },
                { value: 'medium', label: '🟡 Medium - Soon' },
                { value: 'high', label: '🟠 High - Urgent' },
                { value: 'critical', label: '🔴 Critical - Emergency' },
              ]}
            />

            <ConstructionInput
              label="Reason for Request"
              value={vehicleRequestReason}
              onChangeText={setVehicleRequestReason}
              placeholder="Explain why you need a vehicle..."
              multiline
              numberOfLines={3}
              required
            />

            <ConstructionButton
              title="🚗 Request Vehicle"
              onPress={() => handleVehicleRequest()}
              variant={vehicleRequestUrgency === 'critical' ? 'error' : 'primary'}
              size="medium"
              fullWidth
              loading={isLoading}
              disabled={!vehicleRequestReason.trim()}
            />

            {transportTask.vehicleRequest && (
              <View style={styles.existingRequestInfo}>
                <Text style={styles.existingRequestTitle}>
                  📋 Current Request Status
                </Text>
                <Text style={styles.existingRequestText}>
                  Type: {transportTask.vehicleRequest.requestType}
                </Text>
                <Text style={styles.existingRequestText}>
                  Status: {transportTask.vehicleRequest.status.toUpperCase()}
                </Text>
                <Text style={styles.existingRequestText}>
                  Urgency: {transportTask.vehicleRequest.urgency.toUpperCase()}
                </Text>
                {transportTask.vehicleRequest.alternateVehicle && (
                  <View style={styles.alternateVehicleInfo}>
                    <Text style={styles.alternateVehicleTitle}>
                      🚛 Alternate Vehicle Assigned
                    </Text>
                    <Text style={styles.alternateVehicleText}>
                      Vehicle: {transportTask.vehicleRequest.alternateVehicle.plateNumber}
                    </Text>
                    <Text style={styles.alternateVehicleText}>
                      Driver: {transportTask.vehicleRequest.alternateVehicle.driverName}
                    </Text>
                    <Text style={styles.alternateVehicleText}>
                      Phone: {transportTask.vehicleRequest.alternateVehicle.driverPhone}
                    </Text>
                    <Text style={styles.alternateVehicleText}>
                      ETA: {new Date(transportTask.vehicleRequest.alternateVehicle.estimatedArrival).toLocaleTimeString()}
                    </Text>
                  </View>
                )}
              </View>
            )}
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
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: ConstructionTheme.spacing.xxl || 32,
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
  // Vehicle request styles
  existingRequestInfo: {
    marginTop: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.secondaryContainer,
    borderRadius: ConstructionTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: ConstructionTheme.colors.secondary,
  },
  existingRequestTitle: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.onSecondaryContainer,
    marginBottom: ConstructionTheme.spacing.sm,
    fontWeight: 'bold',
  },
  existingRequestText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSecondaryContainer,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  alternateVehicleInfo: {
    marginTop: ConstructionTheme.spacing.sm,
    padding: ConstructionTheme.spacing.sm,
    backgroundColor: ConstructionTheme.colors.tertiaryContainer,
    borderRadius: ConstructionTheme.borderRadius.sm,
  },
  alternateVehicleTitle: {
    ...ConstructionTheme.typography.labelMedium,
    color: ConstructionTheme.colors.onTertiaryContainer,
    marginBottom: ConstructionTheme.spacing.xs,
    fontWeight: 'bold',
  },
  alternateVehicleText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onTertiaryContainer,
    marginBottom: ConstructionTheme.spacing.xs,
  },
});

export default TripStatusUpdateForm;