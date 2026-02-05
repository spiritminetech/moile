// WorkerCheckInForm - Passenger confirmation for transport tasks
// Requirements: 9.2, 9.3

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { TransportTask, WorkerManifest } from '../../types';
import { ConstructionButton, ConstructionCard, ConstructionInput } from '../common';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface WorkerCheckInFormProps {
  transportTask: TransportTask;
  selectedLocationId: number;
  onWorkerCheckIn: (workerId: number, checkInData: WorkerCheckInData) => void;
  onWorkerCheckOut: (workerId: number) => void;
  onCompletePickup: (locationId: number) => void;
  isLoading?: boolean;
}

interface WorkerCheckInData {
  workerId: number;
  checkInTime: string;
  photoVerification?: string;
  notes?: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

const WorkerCheckInForm: React.FC<WorkerCheckInFormProps> = ({
  transportTask,
  selectedLocationId,
  onWorkerCheckIn,
  onWorkerCheckOut,
  onCompletePickup,
  isLoading = false,
}) => {
  const [selectedWorkers, setSelectedWorkers] = useState<Set<number>>(new Set());
  const [checkInNotes, setCheckInNotes] = useState<{ [key: number]: string }>({});
  const [isCompletingPickup, setIsCompletingPickup] = useState(false);

  // Get the selected pickup location
  const selectedLocation = transportTask.pickupLocations.find(
    loc => loc.locationId === selectedLocationId
  );

  if (!selectedLocation) {
    return (
      <ConstructionCard title="Worker Check-In" variant="error">
        <Text style={styles.errorText}>
          ⚠️ Selected pickup location not found
        </Text>
      </ConstructionCard>
    );
  }

  // Handle worker selection toggle
  const toggleWorkerSelection = (workerId: number) => {
    const newSelection = new Set(selectedWorkers);
    if (newSelection.has(workerId)) {
      newSelection.delete(workerId);
    } else {
      newSelection.add(workerId);
    }
    setSelectedWorkers(newSelection);
  };

  // Handle individual worker check-in
  const handleWorkerCheckIn = async (workerId: number) => {
    try {
      // Get current location (mock implementation)
      const currentLocation = {
        latitude: selectedLocation.coordinates.latitude,
        longitude: selectedLocation.coordinates.longitude,
      };

      const checkInData: WorkerCheckInData = {
        workerId,
        checkInTime: new Date().toISOString(),
        notes: checkInNotes[workerId] || '',
        location: currentLocation,
      };

      await onWorkerCheckIn(workerId, checkInData);
      
      // Remove from selected workers after successful check-in
      const newSelection = new Set(selectedWorkers);
      newSelection.delete(workerId);
      setSelectedWorkers(newSelection);
      
      Alert.alert('Success', 'Worker checked in successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to check in worker. Please try again.');
    }
  };

  // Handle worker check-out
  const handleWorkerCheckOut = async (workerId: number) => {
    Alert.alert(
      'Check Out Worker',
      'Are you sure you want to check out this worker?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await onWorkerCheckOut(workerId);
              Alert.alert('Success', 'Worker checked out successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to check out worker. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle bulk check-in
  const handleBulkCheckIn = async () => {
    if (selectedWorkers.size === 0) {
      Alert.alert('No Selection', 'Please select workers to check in');
      return;
    }

    Alert.alert(
      'Bulk Check-In',
      `Check in ${selectedWorkers.size} selected workers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In All',
          onPress: async () => {
            try {
              const currentLocation = {
                latitude: selectedLocation.coordinates.latitude,
                longitude: selectedLocation.coordinates.longitude,
              };

              for (const workerId of selectedWorkers) {
                const checkInData: WorkerCheckInData = {
                  workerId,
                  checkInTime: new Date().toISOString(),
                  notes: checkInNotes[workerId] || '',
                  location: currentLocation,
                };
                await onWorkerCheckIn(workerId, checkInData);
              }

              setSelectedWorkers(new Set());
              Alert.alert('Success', `${selectedWorkers.size} workers checked in successfully`);
            } catch (error) {
              Alert.alert('Error', 'Failed to check in some workers. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle complete pickup
  const handleCompletePickup = () => {
    const uncheckedWorkers = selectedLocation.workerManifest.filter(w => !w.checkedIn);
    
    if (uncheckedWorkers.length > 0) {
      Alert.alert(
        'Incomplete Pickup',
        `${uncheckedWorkers.length} workers are not checked in. Complete pickup anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete Anyway',
            style: 'destructive',
            onPress: () => {
              setIsCompletingPickup(true);
              onCompletePickup(selectedLocationId);
            },
          },
        ]
      );
    } else {
      setIsCompletingPickup(true);
      onCompletePickup(selectedLocationId);
    }
  };

  // Update notes for a worker
  const updateWorkerNotes = (workerId: number, notes: string) => {
    setCheckInNotes(prev => ({
      ...prev,
      [workerId]: notes,
    }));
  };

  const checkedInCount = selectedLocation.workerManifest.filter(w => w.checkedIn).length;
  const totalWorkers = selectedLocation.workerManifest.length;

  return (
    <ConstructionCard title={`Worker Check-In - ${selectedLocation.name}`} variant="elevated">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{selectedLocation.name}</Text>
          <Text style={styles.locationAddress}>{selectedLocation.address}</Text>
          <Text style={styles.pickupTime}>
            📅 Pickup Time: {selectedLocation.estimatedPickupTime}
          </Text>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Progress: {checkedInCount}/{totalWorkers} workers checked in
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(checkedInCount / totalWorkers) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Bulk Actions */}
        {selectedWorkers.size > 0 && (
          <View style={styles.bulkActions}>
            <Text style={styles.bulkActionText}>
              {selectedWorkers.size} workers selected
            </Text>
            <ConstructionButton
              title={`✅ Check In ${selectedWorkers.size} Workers`}
              onPress={handleBulkCheckIn}
              variant="success"
              size="medium"
              loading={isLoading}
            />
          </View>
        )}

        {/* Worker List */}
        <View style={styles.workerList}>
          <Text style={styles.sectionTitle}>👥 Worker Manifest</Text>
          {selectedLocation.workerManifest.map((worker) => (
            <ConstructionCard
              key={worker.workerId}
              variant={worker.checkedIn ? 'success' : 'outlined'}
              style={styles.workerCard}
            >
              <View style={styles.workerHeader}>
                <TouchableOpacity
                  style={styles.workerInfo}
                  onPress={() => !worker.checkedIn && toggleWorkerSelection(worker.workerId)}
                  disabled={worker.checkedIn}
                >
                  <View style={styles.workerDetails}>
                    <Text style={styles.workerName}>
                      {worker.checkedIn ? '✅' : selectedWorkers.has(worker.workerId) ? '☑️' : '☐'} {worker.name}
                    </Text>
                    <Text style={styles.workerPhone}>📞 {worker.phone}</Text>
                    {worker.checkedIn && worker.checkInTime && (
                      <Text style={styles.checkInTime}>
                        ✅ Checked in at: {new Date(worker.checkInTime).toLocaleTimeString()}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Notes input for unchecked workers */}
              {!worker.checkedIn && (
                <View style={styles.notesSection}>
                  <ConstructionInput
                    label="Notes (Optional)"
                    value={checkInNotes[worker.workerId] || ''}
                    onChangeText={(text) => updateWorkerNotes(worker.workerId, text)}
                    placeholder="Add any notes about this worker..."
                    multiline
                    numberOfLines={2}
                    style={styles.notesInput}
                  />
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.workerActions}>
                {worker.checkedIn ? (
                  <ConstructionButton
                    title="❌ Check Out"
                    onPress={() => handleWorkerCheckOut(worker.workerId)}
                    variant="warning"
                    size="small"
                    loading={isLoading}
                  />
                ) : (
                  <ConstructionButton
                    title="✅ Check In"
                    onPress={() => handleWorkerCheckIn(worker.workerId)}
                    variant="success"
                    size="small"
                    loading={isLoading}
                  />
                )}
              </View>
            </ConstructionCard>
          ))}
        </View>

        {/* Complete Pickup Button */}
        <View style={styles.completeSection}>
          <ConstructionButton
            title={`🚌 Complete Pickup (${checkedInCount}/${totalWorkers})`}
            onPress={handleCompletePickup}
            variant={checkedInCount === totalWorkers ? "success" : "warning"}
            size="large"
            fullWidth
            loading={isCompletingPickup}
          />
          {checkedInCount < totalWorkers && (
            <Text style={styles.warningText}>
              ⚠️ {totalWorkers - checkedInCount} workers not checked in
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
  locationInfo: {
    marginBottom: ConstructionTheme.spacing.lg,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  locationName: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  locationAddress: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimaryContainer,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  pickupTime: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  progressInfo: {
    marginTop: ConstructionTheme.spacing.sm,
  },
  progressText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onPrimaryContainer,
    marginBottom: ConstructionTheme.spacing.xs,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ConstructionTheme.colors.success,
    borderRadius: 4,
  },
  bulkActions: {
    marginBottom: ConstructionTheme.spacing.lg,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.successContainer,
    borderRadius: ConstructionTheme.borderRadius.md,
  },
  bulkActionText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSuccessContainer,
    marginBottom: ConstructionTheme.spacing.sm,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  workerList: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  sectionTitle: {
    ...ConstructionTheme.typography.headlineSmall,
    color: ConstructionTheme.colors.onBackground,
    marginBottom: ConstructionTheme.spacing.md,
  },
  workerCard: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  workerHeader: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  workerInfo: {
    flex: 1,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.onSurface,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  workerPhone: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    marginBottom: ConstructionTheme.spacing.xs,
  },
  checkInTime: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.success,
    fontWeight: 'bold',
  },
  notesSection: {
    marginBottom: ConstructionTheme.spacing.sm,
  },
  notesInput: {
    marginBottom: 0,
  },
  workerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  completeSection: {
    marginBottom: ConstructionTheme.spacing.lg,
  },
  warningText: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.warning,
    textAlign: 'center',
    marginTop: ConstructionTheme.spacing.sm,
    fontWeight: 'bold',
  },
  errorText: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.error,
    textAlign: 'center',
    padding: ConstructionTheme.spacing.lg,
  },
});

export default WorkerCheckInForm;