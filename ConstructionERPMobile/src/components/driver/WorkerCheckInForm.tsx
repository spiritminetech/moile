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

  // Determine if this is a dropoff location
  const isDropoff = selectedLocationId === -1;

  // Debug logging
  console.log('🔍 WorkerCheckInForm Debug:', {
    selectedLocationId,
    isDropoff,
    hasTask: !!transportTask,
    pickupLocationsCount: transportTask?.pickupLocations?.length || 0,
    hasDropoff: !!transportTask?.dropoffLocation,
  });

  // Get the selected location (pickup or dropoff)
  const selectedLocation = isDropoff
    ? (transportTask.dropoffLocation ? {
        locationId: -1,
        name: transportTask.dropoffLocation.name || 'Drop-off Location',
        address: transportTask.dropoffLocation.address || '',
        coordinates: transportTask.dropoffLocation.coordinates || { latitude: 0, longitude: 0 },
        workerManifest: transportTask.pickupLocations?.flatMap(loc => loc.workerManifest || []) || [],
        estimatedPickupTime: transportTask.dropoffLocation.estimatedArrival || '',
        actualPickupTime: transportTask.dropoffLocation.actualArrival,
      } : null)
    : transportTask.pickupLocations.find(
        loc => loc.locationId === selectedLocationId
      );

  console.log('🔍 Selected Location:', {
    found: !!selectedLocation,
    locationId: selectedLocation?.locationId,
    name: selectedLocation?.name,
    workersCount: selectedLocation?.workerManifest?.length || 0,
  });

  if (!selectedLocation) {
    return (
      <ConstructionCard title="Worker Check-In" variant="error">
        <Text style={styles.errorText}>
          ⚠️ Selected location not found
        </Text>
        <Text style={styles.errorText}>
          Location ID: {selectedLocationId}
        </Text>
        <Text style={styles.errorText}>
          Is Dropoff: {isDropoff ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.errorText}>
          Has dropoff location: {transportTask.dropoffLocation ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.errorText}>
          Pickup locations count: {transportTask.pickupLocations?.length || 0}
        </Text>
        {transportTask.pickupLocations && transportTask.pickupLocations.length > 0 && (
          <View>
            <Text style={styles.errorText}>Available location IDs:</Text>
            {transportTask.pickupLocations.map(loc => (
              <Text key={loc.locationId} style={styles.errorText}>
                - {loc.locationId}: {loc.name}
              </Text>
            ))}
          </View>
        )}
      </ConstructionCard>
    );
  }

  // Check if worker manifest is empty
  if (!selectedLocation.workerManifest || selectedLocation.workerManifest.length === 0) {
    return (
      <ConstructionCard title="Worker Check-In" variant="error">
        <Text style={styles.errorText}>
          ⚠️ No workers found for this location
        </Text>
        <Text style={styles.errorText}>
          Location: {selectedLocation.name}
        </Text>
        <Text style={styles.errorText}>
          Location ID: {selectedLocation.locationId}
        </Text>
        <Text style={styles.errorText}>
          Worker manifest is empty. Please ensure workers are assigned to this task.
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

  // Handle complete pickup or dropoff
  const handleCompletePickup = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Location not found. Please try again.');
      setIsCompletingPickup(false);
      return;
    }

    // ✅ FIX: Get workers who are checked in (either manually or via checkbox selection)
    const checkedInWorkers = selectedLocation.workerManifest?.filter(w => w.checkedIn) || [];
    const uncheckedWorkers = selectedLocation.workerManifest?.filter(w => !w.checkedIn) || [];
    
    // If there are selected workers (checkboxes) but not checked in yet, check them in first
    if (selectedWorkers.size > 0) {
      Alert.alert(
        'Check In Selected Workers',
        `Check in ${selectedWorkers.size} selected workers before completing?`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => setIsCompletingPickup(false)
          },
          {
            text: 'Check In & Complete',
            onPress: async () => {
              setIsCompletingPickup(true);
              try {
                // Check in all selected workers first
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

                // Then complete pickup/dropoff
                await onCompletePickup(selectedLocationId);
                setSelectedWorkers(new Set());
              } catch (error) {
                console.error('Complete error:', error);
                setIsCompletingPickup(false);
                Alert.alert('Error', 'Failed to complete');
              }
            },
          },
        ]
      );
      return;
    }
    
    if (uncheckedWorkers.length > 0 && !isDropoff) {
      Alert.alert(
        'Incomplete Pickup',
        `${uncheckedWorkers.length} workers are not checked in. Complete pickup anyway?`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => setIsCompletingPickup(false)
          },
          {
            text: 'Complete Anyway',
            style: 'destructive',
            onPress: async () => {
              setIsCompletingPickup(true);
              try {
                await onCompletePickup(selectedLocationId);
              } catch (error) {
                console.error('Complete pickup error:', error);
                setIsCompletingPickup(false);
                Alert.alert('Error', 'Failed to complete pickup');
              }
            },
          },
        ]
      );
    } else if (uncheckedWorkers.length > 0 && isDropoff) {
      Alert.alert(
        'Incomplete Drop-off',
        `${uncheckedWorkers.length} workers are not checked out. Complete drop-off anyway?`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => setIsCompletingPickup(false)
          },
          {
            text: 'Complete Anyway',
            style: 'destructive',
            onPress: async () => {
              setIsCompletingPickup(true);
              try {
                await onCompletePickup(selectedLocationId);
              } catch (error) {
                console.error('Complete drop-off error:', error);
                setIsCompletingPickup(false);
                Alert.alert('Error', 'Failed to complete drop-off');
              }
            },
          },
        ]
      );
    } else {
      setIsCompletingPickup(true);
      (async () => {
        try {
          await onCompletePickup(selectedLocationId);
        } catch (error) {
          console.error('Complete error:', error);
          setIsCompletingPickup(false);
          Alert.alert('Error', 'Failed to complete');
        }
      })();
    }
  };

  // Update notes for a worker
  const updateWorkerNotes = (workerId: number, notes: string) => {
    setCheckInNotes(prev => ({
      ...prev,
      [workerId]: notes,
    }));
  };

  const checkedInCount = selectedLocation.workerManifest?.filter(w => w.checkedIn).length || 0;
  const totalWorkers = selectedLocation.workerManifest?.length || 0;

  return (
    <ConstructionCard 
      title={isDropoff ? `Drop-off - ${selectedLocation.name}` : `Worker Check-In - ${selectedLocation.name}`} 
      variant="elevated"
      style={styles.cardContainer}
    >
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{selectedLocation.name}</Text>
          <Text style={styles.locationAddress}>{selectedLocation.address}</Text>
          <Text style={styles.pickupTime}>
            {isDropoff ? '📅 ETA: ' : '📅 Pickup Time: '}{selectedLocation.estimatedPickupTime}
          </Text>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Progress: {checkedInCount}/{totalWorkers} workers {isDropoff ? 'on board' : 'checked in'}
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
              title={isDropoff 
                ? `✅ Select ${selectedWorkers.size} for Drop-off` 
                : `✅ Check In ${selectedWorkers.size} Workers`
              }
              onPress={isDropoff ? () => {} : handleBulkCheckIn}
              variant="success"
              size="medium"
              loading={isLoading}
              disabled={isDropoff}  // At drop, use "Complete Drop-off" button instead
            />
            {isDropoff && (
              <Text style={styles.bulkActionHint}>
                Click "Complete Drop-off" below to drop off selected workers
              </Text>
            )}
          </View>
        )}

        {/* Worker List */}
        <View style={styles.workerList}>
          <Text style={styles.sectionTitle}>👥 Worker Manifest</Text>
          {selectedLocation.workerManifest && selectedLocation.workerManifest.length > 0 ? (
            selectedLocation.workerManifest.map((worker) => (
            <ConstructionCard
              key={worker.workerId}
              variant={
                isDropoff 
                  ? (selectedWorkers.has(worker.workerId) ? 'primary' : 'outlined')  // Drop: Highlight selected
                  : (worker.checkedIn ? 'success' : 'outlined')  // Pickup: Highlight checked in
              }
              style={styles.workerCard}
            >
              <View style={styles.workerHeader}>
                <TouchableOpacity
                  style={styles.workerInfo}
                  onPress={() => toggleWorkerSelection(worker.workerId)}
                  disabled={false}
                >
                  <View style={styles.workerDetails}>
                    <Text style={styles.workerName}>
                      {/* ✅ FIX: At drop location, show checkboxes even for picked-up workers */}
                      {isDropoff 
                        ? (selectedWorkers.has(worker.workerId) ? '☑️' : '☐')  // Drop: Always show checkbox
                        : (worker.checkedIn ? '✅' : selectedWorkers.has(worker.workerId) ? '☑️' : '☐')  // Pickup: Show ✅ if checked in
                      } {worker.name}
                    </Text>
                    <Text style={styles.workerPhone}>📞 {worker.phone}</Text>
                    {worker.checkedIn && worker.checkInTime && !isDropoff && (
                      <Text style={styles.checkInTime}>
                        ✅ Checked in at: {new Date(worker.checkInTime).toLocaleTimeString()}
                      </Text>
                    )}
                    {worker.checkedIn && isDropoff && (
                      <Text style={styles.checkInTime}>
                        🚌 On vehicle (picked up at {new Date(worker.checkInTime).toLocaleTimeString()})
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Notes input - Only show for workers not yet processed */}
              {!worker.checkedIn && !isDropoff && (
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

              {/* Action buttons - Only show individual check-in button at pickup for unchecked workers */}
              {!isDropoff && (
                <View style={styles.workerActions}>
                  {!worker.checkedIn && (
                    <ConstructionButton
                      title="✅ Check In"
                      onPress={() => handleWorkerCheckIn(worker.workerId)}
                      variant="success"
                      size="small"
                      loading={isLoading}
                    />
                  )}
                </View>
              )}
            </ConstructionCard>
          ))
          ) : (
            <Text style={styles.errorText}>No workers in manifest</Text>
          )}
        </View>

        {/* Complete Pickup Button */}
        <View style={styles.completePickupSection}>
          <ConstructionButton
            title={isDropoff ? "✅ Complete Drop-off" : "✅ Complete Pickup"}
            onPress={handleCompletePickup}
            variant="success"
            size="large"
            loading={isCompletingPickup}
            fullWidth
          />
          <Text style={styles.completePickupHint}>
            {isDropoff 
              ? `Complete drop-off for ${checkedInCount} of ${totalWorkers} workers`
              : `Complete pickup for ${checkedInCount} of ${totalWorkers} workers`
            }
          </Text>
        </View>
      </ScrollView>
    </ConstructionCard>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    marginBottom: ConstructionTheme.spacing.md,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: ConstructionTheme.spacing.xl * 2,
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
  bulkActionHint: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSuccessContainer,
    marginTop: ConstructionTheme.spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
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
  errorText: {
    ...ConstructionTheme.typography.bodyLarge,
    color: ConstructionTheme.colors.error,
    textAlign: 'center',
    padding: ConstructionTheme.spacing.lg,
  },
  completePickupSection: {
    marginTop: ConstructionTheme.spacing.xl,
    marginBottom: ConstructionTheme.spacing.lg,
    paddingHorizontal: ConstructionTheme.spacing.md,
  },
  completePickupHint: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: ConstructionTheme.spacing.sm,
  },
});

export default WorkerCheckInForm;