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
import { showPhotoOptions, PhotoResult } from '../../utils/photoCapture';

interface WorkerCheckInFormProps {
  transportTask: TransportTask;
  selectedLocationId: number;
  onWorkerCheckIn: (workerId: number, checkInData: WorkerCheckInData) => void;
  onWorkerCheckOut: (workerId: number) => void;
  onCompletePickup: (locationId: number, selectedWorkerIds?: number[], photo?: PhotoResult) => void;
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
  const [capturedPhoto, setCapturedPhoto] = useState<PhotoResult | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  // Determine if this is a dropoff location
  const isDropoff = selectedLocationId === -1;
  // ✅ FIX: Pickup is completed ONLY when status explicitly indicates completion
  // During ONGOING or en_route_pickup, pickup is NOT completed yet
  const isPickupCompleted = !isDropoff && (
    transportTask.status === 'pickup_complete' ||
    transportTask.status === 'PICKUP_COMPLETE' ||
    transportTask.status === 'en_route_dropoff' ||
    transportTask.status === 'ENROUTE_DROPOFF' ||
    transportTask.status === 'completed' ||
    transportTask.status === 'COMPLETED'
  );
  
  // ✅ NEW: Check if we're actively doing pickup (not completed yet)
  const isActivePickup = !isDropoff && !isPickupCompleted && (
    transportTask.status === 'ONGOING' ||
    transportTask.status === 'PLANNED' ||
    transportTask.status === 'en_route_pickup'
  );
  
  // ✅ NEW: Check if dropoff is already completed
  const isDropoffCompleted = isDropoff && (
    transportTask.status === 'completed' ||
    transportTask.status === 'COMPLETED'
  );
  
  // Combined check for any completion
  const isCompleted = isPickupCompleted || isDropoffCompleted;

  // ✅ ENHANCED DEBUG: Log everything about the current state
  console.log('🔍 WorkerCheckInForm Debug:', {
    selectedLocationId,
    isDropoff,
    isPickupCompleted,
    isDropoffCompleted,
    isActivePickup,
    isCompleted,
    taskStatus: transportTask.status,
    hasTask: !!transportTask,
    pickupLocationsCount: transportTask?.pickupLocations?.length || 0,
    hasDropoff: !!transportTask?.dropoffLocation,
  });

  // Get the selected location (pickup or dropoff)
  // ✅ FIX: Don't reset checkedIn during active pickup - keep the real backend status
  // Instead, use the checkbox selection state to determine what to show
  const selectedLocation = isDropoff
    ? (transportTask.dropoffLocation ? {
        locationId: -1,
        name: transportTask.dropoffLocation.name || 'Drop-off Location',
        address: transportTask.dropoffLocation.address || '',
        coordinates: transportTask.dropoffLocation.coordinates || { latitude: 0, longitude: 0 },
        // ✅ FIX: At dropoff, show workers who were picked up
        // Preserve dropStatus and wasPickedUp from the worker data
        workerManifest: transportTask.pickupLocations?.flatMap(loc => 
          (loc.workerManifest || [])
            .filter(w => w.checkedIn || w.wasPickedUp)  // Show picked-up workers
            .map(w => ({
              ...w,
              checkedIn: isDropoffCompleted ? (w.dropStatus === 'confirmed') : false,  // ✅ At completion, show based on dropStatus
              wasPickedUp: w.checkedIn || w.wasPickedUp,  // ✅ Preserve wasPickedUp status
              dropStatus: w.dropStatus || 'pending',  // ✅ Preserve dropStatus
            }))
        ) || [],
        estimatedPickupTime: transportTask.dropoffLocation.estimatedArrival || '',
        actualPickupTime: transportTask.dropoffLocation.actualArrival,
      } : null)
    : transportTask.pickupLocations.find(
        loc => loc.locationId === selectedLocationId
      );  // ✅ Use original data - don't reset checkedIn

  console.log('🔍 Selected Location:', {
    found: !!selectedLocation,
    locationId: selectedLocation?.locationId,
    name: selectedLocation?.name,
    workersCount: selectedLocation?.workerManifest?.length || 0,
    isDropoff,
    isDropoffCompleted,
    isPickupCompleted,
    isActivePickup,
    isCompleted,
    workers: selectedLocation?.workerManifest?.map(w => ({
      id: w.workerId,
      name: w.name,
      checkedIn: w.checkedIn,
      dropStatus: (w as any).dropStatus,
      wasPickedUp: (w as any).wasPickedUp,
    })),
  });
  
  // ✅ NEW: Auto-select all picked-up workers at dropoff
  React.useEffect(() => {
    if (isDropoff && !isDropoffCompleted && selectedLocation?.workerManifest) {
      // Auto-select all workers who were picked up
      const pickedUpWorkerIds = selectedLocation.workerManifest
        .filter(w => w.checkedIn || (w as any).wasPickedUp)
        .map(w => w.workerId);
      
      if (pickedUpWorkerIds.length > 0) {
        console.log('🚌 Auto-selecting picked-up workers for dropoff:', pickedUpWorkerIds);
        setSelectedWorkers(new Set(pickedUpWorkerIds));
      }
    }
  }, [isDropoff, isDropoffCompleted, selectedLocation?.workerManifest]);
  
  // ✅ CRITICAL: Log display decision for EACH worker
  if (selectedLocation?.workerManifest) {
    selectedLocation.workerManifest.forEach((worker, index) => {
      console.log(`👤 Worker ${index + 1} Display Logic:`, {
        workerId: worker.workerId,
        name: worker.name,
        checkedIn: worker.checkedIn,
        isCompleted,
        isPickupCompleted,
        isDropoffCompleted,
        isActivePickup,
        willShowCheckbox: !isCompleted,
        displayIcon: isCompleted
          ? (isPickupCompleted ? (worker.checkedIn ? '✅' : '❌') : '❌')
          : (selectedWorkers.has(worker.workerId) ? '☑️' : '☐')
      });
    });
  }
  
  // ✅ DEBUG: Log completion banner calculation
  if (isCompleted) {
    const pickupCount = selectedLocation?.workerManifest?.filter(w => w.checkedIn).length || 0;
    const dropCount = selectedLocation?.workerManifest?.filter(w => (w as any).dropStatus === 'confirmed').length || 0;
    const pickedUpCount = selectedLocation?.workerManifest?.filter(w => w.checkedIn || (w as any).wasPickedUp).length || 0;
    
    console.log('📊 Completion banner calculation:', {
      isPickupCompleted,
      isDropoffCompleted,
      totalWorkers: selectedLocation?.workerManifest?.length || 0,
      pickupCount,
      dropCount,
      pickedUpCount,
      bannerText: isPickupCompleted
        ? `${pickupCount} of ${selectedLocation?.workerManifest?.length || 0} workers were checked in`
        : `${dropCount} of ${pickedUpCount} workers were dropped off`,
      workerDetails: selectedLocation?.workerManifest?.map(w => ({
        id: w.workerId,
        name: w.name,
        checkedIn: w.checkedIn,
        dropStatus: (w as any).dropStatus,
        wasPickedUp: (w as any).wasPickedUp,
      }))
    });
  }

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
      <ConstructionCard title="Worker Check-In" variant="outlined">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            📋 Loading worker manifest...
          </Text>
          <Text style={styles.loadingSubtext}>
            Location: {selectedLocation.name}
          </Text>
          <Text style={styles.loadingSubtext}>
            Please wait while we fetch worker details from the server.
          </Text>
        </View>
      </ConstructionCard>
    );
  }

  // Handle worker selection toggle - AUTO CHECK-IN when checkbox is selected
  const toggleWorkerSelection = async (workerId: number) => {
    const newSelection = new Set(selectedWorkers);
    
    if (newSelection.has(workerId)) {
      // Uncheck - just remove from selection (don't check out)
      newSelection.delete(workerId);
      setSelectedWorkers(newSelection);
    } else {
      // Check - add to selection AND immediately check in at pickup
      newSelection.add(workerId);
      setSelectedWorkers(newSelection);
      
      // ✅ AUTO CHECK-IN: If at pickup (not dropoff), immediately check in the worker
      if (!isDropoff && !isCompleted) {
        try {
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
          console.log(`✅ Auto checked-in worker ${workerId}`);
        } catch (error) {
          console.error(`❌ Auto check-in failed for worker ${workerId}:`, error);
          // Remove from selection if check-in failed
          newSelection.delete(workerId);
          setSelectedWorkers(newSelection);
        }
      }
    }
  };

  // Handle individual worker check-in - SIMPLIFIED, NO POPUP
  const handleWorkerCheckIn = async (workerId: number) => {
    try {
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
      
      // No popup, just log success
      console.log('✅ Worker checked in successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to check in worker.');
    }
  };

  // Handle bulk check-in - SIMPLIFIED, NO POPUP
  const handleBulkCheckIn = async () => {
    if (selectedWorkers.size === 0) {
      Alert.alert('No Selection', 'Please select workers to check in');
      return;
    }

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
      // Simple toast-style message instead of popup
      console.log(`✅ ${selectedWorkers.size} workers checked in successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to check in workers.');
    }
  };

  // Handle photo capture - INLINE, NO POPUP
  const handleCapturePhoto = async () => {
    if (isCapturingPhoto) return;
    
    setIsCapturingPhoto(true);
    try {
      const photo = await showPhotoOptions(selectedLocation.coordinates);
      if (photo) {
        setCapturedPhoto(photo);
        console.log('✅ Photo captured:', photo.fileName);
      }
    } catch (error) {
      console.error('❌ Photo capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  // Handle complete pickup or dropoff - SIMPLIFIED, PASS PHOTO
  const handleCompletePickup = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Location not found.');
      return;
    }

    console.log('🔍 WorkerCheckInForm handleCompletePickup:', {
      selectedLocationId,
      isDropoff,
      hasCapturedPhoto: !!capturedPhoto,
      capturedPhotoFileName: capturedPhoto?.fileName,
    });

    setIsCompletingPickup(true);
    
    try {
      // ✅ FIX: At dropoff, ALWAYS pass worker IDs (either selected or all picked-up)
      // At pickup, pass undefined (all checked-in workers)
      let workerIds: number[] | undefined = undefined;
      
      if (isDropoff) {
        // At dropoff: use selected workers if any, otherwise use all picked-up workers
        if (selectedWorkers.size > 0) {
          workerIds = Array.from(selectedWorkers);
          console.log(`📋 Dropoff: Using ${workerIds.length} selected workers:`, workerIds);
        } else {
          // No workers selected - use all picked-up workers
          workerIds = selectedLocation.workerManifest
            ?.filter(w => w.checkedIn || (w as any).wasPickedUp)
            .map(w => w.workerId) || [];
          console.log(`📋 Dropoff: No selection, using all ${workerIds.length} picked-up workers:`, workerIds);
        }
      } else {
        // At pickup: don't pass specific IDs (backend will use all checked-in)
        workerIds = undefined;
        console.log(`📋 Pickup: Not passing specific worker IDs`);
      }
      
      // ✅ NEW: Pass photo to parent handler
      console.log('📤 Calling onCompletePickup with photo:', {
        locationId: selectedLocationId,
        workerIdsCount: workerIds?.length,
        hasPhoto: !!capturedPhoto,
        photoFileName: capturedPhoto?.fileName,
        photoObject: capturedPhoto,  // Log the actual object
      });
      
      // ✅ CRITICAL: Pass capturedPhoto directly, not capturedPhoto || undefined
      // undefined is falsy, so capturedPhoto || undefined returns undefined when capturedPhoto is null
      await onCompletePickup(selectedLocationId, workerIds, capturedPhoto ?? undefined);
      setSelectedWorkers(new Set());
      setCapturedPhoto(null); // Clear photo after completion
    } catch (error) {
      console.error('Complete error:', error);
      Alert.alert('Error', 'Failed to complete. Please try again.');
    } finally {
      setIsCompletingPickup(false);
    }
  };

  // Update notes for a worker
  const updateWorkerNotes = (workerId: number, notes: string) => {
    setCheckInNotes(prev => ({
      ...prev,
      [workerId]: notes,
    }));
  };

  // ✅ FIX: Calculate checked-in count correctly
  // Now that we're not resetting checkedIn, we can use the selectedLocation data directly
  const checkedInCount = isDropoff 
    ? selectedWorkers.size  // At dropoff, count selected workers
    : selectedLocation.workerManifest?.filter(w => w.checkedIn).length || 0;  // At pickup, count checked-in workers
  const totalWorkers = selectedLocation.workerManifest?.length || 0;
  
  console.log('📊 Worker counts:', {
    isActivePickup,
    isDropoff,
    checkedInCount,
    totalWorkers,
    workers: selectedLocation.workerManifest?.map(w => ({ 
      id: w.workerId, 
      name: w.name, 
      checkedIn: w.checkedIn,
      checkInTime: w.checkInTime,
    })),
  });
  
  // ✅ DEBUG: Log what will be displayed
  console.log('🎨 Display logic:', {
    isCompleted,
    isPickupCompleted,
    isDropoffCompleted,
    isActivePickup,
    isDropoff,
    sampleWorker: selectedLocation.workerManifest?.[0] ? {
      id: selectedLocation.workerManifest[0].workerId,
      checkedIn: selectedLocation.workerManifest[0].checkedIn,
      willShow: !isCompleted && !isDropoff && selectedLocation.workerManifest[0].checkedIn ? '✅' : '☐'
    } : null
  });

  return (
    <ConstructionCard 
      title={
        isPickupCompleted 
          ? `✅ Pickup Completed - ${selectedLocation.name}` 
          : isDropoffCompleted
            ? `✅ Drop-off Completed - ${selectedLocation.name}`
            : isDropoff 
              ? `Drop-off - ${selectedLocation.name}` 
              : `Worker Check-In - ${selectedLocation.name}`
      } 
      variant={isCompleted ? "success" : "elevated"}
      style={styles.cardContainer}
    >
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Completion Banner - Only show at the location where completion happened */}
        {isPickupCompleted && !isDropoff && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedBannerText}>
              ✅ Pickup completed at this location
            </Text>
            <Text style={styles.completedBannerSubtext}>
              {`${selectedLocation.workerManifest?.filter(w => w.checkedIn).length || 0} of ${totalWorkers} workers were checked in`}
            </Text>
          </View>
        )}
        
        {/* Dropoff Completion Banner - Only show at dropoff location */}
        {isDropoffCompleted && isDropoff && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedBannerText}>
              ✅ Drop-off completed at this location
            </Text>
            <Text style={styles.completedBannerSubtext}>
              {(() => {
                // ✅ FIX: Calculate dropoff counts with detailed logging
                const allWorkers = selectedLocation.workerManifest || [];
                const droppedWorkers = allWorkers.filter(w => {
                  const status = (w as any).dropStatus;
                  const isConfirmed = status === 'confirmed' || status === 'CONFIRMED';
                  return isConfirmed;
                });
                const pickedUpWorkers = allWorkers.filter(w => w.checkedIn || (w as any).wasPickedUp);
                
                return `${droppedWorkers.length} of ${pickedUpWorkers.length} workers were dropped off`;
              })()}
            </Text>
          </View>
        )}

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{selectedLocation.name}</Text>
          <Text style={styles.locationAddress}>{selectedLocation.address}</Text>
          <Text style={styles.pickupTime}>
            {isDropoff ? '📅 ETA: ' : '📅 Pickup Time: '}{selectedLocation.estimatedPickupTime}
          </Text>
          {!isCompleted && (
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Progress: {checkedInCount}/{totalWorkers} workers {isDropoff ? 'selected for drop' : 'checked in'}
              </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${totalWorkers > 0 ? (checkedInCount / totalWorkers) * 100 : 0}%` }
                ]} 
              />
            </View>
          </View>
          )}
        </View>

        {/* Info message for pickup */}
        {!isCompleted && !isDropoff && (
          <View style={styles.infoMessage}>
            <Text style={styles.infoMessageText}>
              ℹ️ Select workers using checkboxes to check them in
            </Text>
          </View>
        )}
        
        {/* Info message for dropoff */}
        {!isCompleted && isDropoff && selectedWorkers.size > 0 && (
          <View style={styles.infoMessage}>
            <Text style={styles.infoMessageText}>
              ✅ {selectedWorkers.size} workers selected for drop-off
            </Text>
          </View>
        )}

        {/* Worker List */}
        <View style={styles.workerList}>
          <Text style={styles.sectionTitle}>👥 Worker Manifest</Text>
          {selectedLocation.workerManifest && selectedLocation.workerManifest.length > 0 ? (
            selectedLocation.workerManifest.map((worker) => (
            <ConstructionCard
              key={worker.workerId}
              variant={worker.checkedIn ? 'success' : 'outlined'}  // Always show success for picked-up workers
              style={styles.workerCard}
            >
              <View style={styles.workerHeader}>
                <TouchableOpacity
                  style={styles.workerInfo}
                  onPress={() => !isCompleted && toggleWorkerSelection(worker.workerId)}  // Disable if completed
                  disabled={isCompleted || (!isDropoff && worker.checkedIn)}  // Disable if completed or already checked in
                >
                  <View style={styles.workerDetails}>
                    {/* Professional Checkbox */}
                    <View style={styles.workerNameRow}>
                      {!isCompleted && (
                        <View style={[
                          styles.checkbox,
                          selectedWorkers.has(worker.workerId) && styles.checkboxChecked
                        ]}>
                          {selectedWorkers.has(worker.workerId) && (
                            <Text style={styles.checkboxIcon}>✓</Text>
                          )}
                        </View>
                      )}
                      {isCompleted && (
                        <View style={styles.statusIcon}>
                          <Text style={styles.statusIconText}>
                            {isPickupCompleted
                              ? worker.checkedIn ? '✅' : '❌'
                              : isDropoffCompleted
                                ? (worker as any).dropStatus === 'confirmed' ? '✅' : 
                                  (worker as any).wasPickedUp ? '🚌' : '❌'
                                : '❌'}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.workerName}>{worker.name}</Text>
                    </View>
                    <Text style={styles.workerPhone}>📞 {worker.phone}</Text>
                    {worker.checkedIn && worker.checkInTime && !isDropoff && (
                      <Text style={styles.checkInTime}>
                        ✅ Checked in at: {new Date(worker.checkInTime).toLocaleTimeString()}
                      </Text>
                    )}
                    {isDropoff && !isCompleted && (worker as any).wasPickedUp && (
                      <Text style={styles.checkInTime}>
                        🚌 Picked up at {new Date(worker.checkInTime || '').toLocaleTimeString()}
                      </Text>
                    )}
                    {isDropoffCompleted && (worker as any).dropStatus === 'confirmed' && (
                      <Text style={styles.checkInTime}>
                        ✅ Dropped off
                      </Text>
                    )}
                    {isDropoffCompleted && (worker as any).wasPickedUp && (worker as any).dropStatus !== 'confirmed' && (
                      <Text style={styles.checkInTime}>
                        🚌 Still on vehicle (not dropped at this location)
                      </Text>
                    )}
                    {isDropoffCompleted && !(worker as any).wasPickedUp && (
                      <Text style={styles.checkInTime}>
                        ❌ Not picked up
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Notes input - Only show for workers not yet processed and not completed */}
              {!isCompleted && !worker.checkedIn && !isDropoff && (
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
            </ConstructionCard>
          ))
          ) : (
            <Text style={styles.errorText}>No workers in manifest</Text>
          )}
        </View>

        {/* Photo Section - Inline, not popup */}
        {!isCompleted && (
          <View style={styles.photoSection}>
            {!capturedPhoto ? (
              <ConstructionButton
                title="📷 Add Photo (Optional)"
                subtitle="Tap to capture proof of pickup/dropoff"
                variant="primary"
                size="medium"
                onPress={handleCapturePhoto}
                loading={isCapturingPhoto}
                fullWidth
              />
            ) : (
              <View style={styles.photoPreview}>
                <Image 
                  source={{ uri: capturedPhoto.uri }} 
                  style={styles.photoThumbnail} 
                />
                <View style={styles.photoInfo}>
                  <Text style={styles.photoText}>✓ Photo attached</Text>
                  <Text style={styles.photoSize}>
                    {(capturedPhoto.fileSize / 1024).toFixed(1)} KB
                  </Text>
                  {capturedPhoto.location && (
                    <Text style={styles.photoGps}>📍 GPS tagged</Text>
                  )}
                </View>
                <TouchableOpacity 
                  onPress={() => setCapturedPhoto(null)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Complete Pickup/Dropoff Button - Only show if not completed */}
        {!isCompleted && (
          <View style={styles.completePickupSection}>
            <ConstructionButton
              title={isDropoff 
                ? selectedWorkers.size > 0 
                  ? `✅ Complete Drop-off (${selectedWorkers.size} Selected)` 
                  : totalWorkers > 0
                    ? `✅ Complete Drop-off (All ${totalWorkers})`
                    : "✅ Complete Drop-off"
                : checkedInCount > 0
                  ? `✅ Complete Pickup (${checkedInCount} Checked In)`
                  : "✅ Complete Pickup"
              }
              subtitle={capturedPhoto ? '📷 With photo ✓' : 'No photo'}
              onPress={handleCompletePickup}
              variant="success"
              size="large"
              loading={isCompletingPickup}
              disabled={isDropoff ? totalWorkers === 0 : checkedInCount === 0}  // ✅ Disable if no workers
              fullWidth
            />
            <Text style={styles.completePickupHint}>
              {isDropoff 
                ? selectedWorkers.size > 0
                  ? `Drop off ${selectedWorkers.size} selected workers`
                  : checkedInCount > 0
                    ? `Drop off all ${checkedInCount} workers`
                    : '⚠️ No workers available for drop-off'
                : checkedInCount === 0
                  ? '⚠️ Please check in at least one worker before completing pickup'
                  : `Complete pickup for ${checkedInCount} of ${totalWorkers} workers`
              }
            </Text>
          </View>
        )}
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
  infoMessage: {
    marginBottom: ConstructionTheme.spacing.md,
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.primaryContainer,
    borderRadius: ConstructionTheme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: ConstructionTheme.colors.primary,
  },
  infoMessageText: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onPrimaryContainer,
    textAlign: 'center',
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
  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: ConstructionTheme.colors.primary,
    marginRight: ConstructionTheme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: ConstructionTheme.colors.primary,
    borderColor: ConstructionTheme.colors.primary,
  },
  checkboxIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusIcon: {
    width: 24,
    height: 24,
    marginRight: ConstructionTheme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconText: {
    fontSize: 18,
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
  loadingContainer: {
    padding: ConstructionTheme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...ConstructionTheme.typography.titleLarge,
    color: ConstructionTheme.colors.primary,
    textAlign: 'center',
    marginBottom: ConstructionTheme.spacing.md,
  },
  loadingSubtext: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: ConstructionTheme.spacing.xs,
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
  completedBanner: {
    backgroundColor: ConstructionTheme.colors.successContainer,
    padding: ConstructionTheme.spacing.md,
    borderRadius: ConstructionTheme.borderRadius.md,
    marginBottom: ConstructionTheme.spacing.lg,
    alignItems: 'center',
  },
  completedBannerText: {
    ...ConstructionTheme.typography.titleMedium,
    color: ConstructionTheme.colors.onSuccessContainer,
    fontWeight: 'bold',
    marginBottom: ConstructionTheme.spacing.xs,
  },
  completedBannerSubtext: {
    ...ConstructionTheme.typography.bodyMedium,
    color: ConstructionTheme.colors.onSuccessContainer,
  },
  photoSection: {
    marginVertical: ConstructionTheme.spacing.lg,
    paddingHorizontal: ConstructionTheme.spacing.md,
  },
  photoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.successContainer,
    borderRadius: ConstructionTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: ConstructionTheme.colors.success,
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: ConstructionTheme.borderRadius.sm,
    marginRight: ConstructionTheme.spacing.md,
    backgroundColor: ConstructionTheme.colors.surfaceVariant,
  },
  photoInfo: {
    flex: 1,
  },
  photoText: {
    ...ConstructionTheme.typography.bodyLarge,
    fontWeight: '600',
    color: ConstructionTheme.colors.onSuccessContainer,
    marginBottom: 4,
  },
  photoSize: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSuccessContainer,
    marginBottom: 2,
  },
  photoGps: {
    ...ConstructionTheme.typography.bodySmall,
    color: ConstructionTheme.colors.onSuccessContainer,
  },
  removeButton: {
    padding: ConstructionTheme.spacing.sm,
  },
  removeText: {
    ...ConstructionTheme.typography.labelLarge,
    color: ConstructionTheme.colors.error,
    fontWeight: '600',
  },
});

export default WorkerCheckInForm;