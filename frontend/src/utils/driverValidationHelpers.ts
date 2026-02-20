// Driver Validation Helper Functions
// Used for geo-fence enforcement and worker count validation

import { Alert, Linking } from 'react-native';
import { GeoLocation } from '../types';
import { calculateDistance, isWithinGeofence, formatDistance } from './geofenceUtils';

/**
 * Validate driver location before starting route
 * Returns true if validation passes, false otherwise
 */
export async function validatePreStartLocation(
  currentLocation: GeoLocation | null,
  approvedLocation: { latitude: number; longitude: number; name: string }
): Promise<boolean> {
  if (!currentLocation) {
    Alert.alert(
      '❌ GPS Not Available',
      'GPS location is required to start route. Please enable location services.',
      [{ text: 'OK' }]
    );
    return false;
  }

  const { isWithin, distance } = isWithinGeofence(
    currentLocation.latitude,
    currentLocation.longitude,
    approvedLocation.latitude,
    approvedLocation.longitude,
    150 // 150m radius for route start
  );

  if (!isWithin) {
    Alert.alert(
      '🚫 Location Validation Failed',
      `You must be at the approved pickup location to start the route.\n\nYou are ${formatDistance(
        distance
      )} away from ${approvedLocation.name}.\n\nRequired: Within 150m\n\n⚠️ Please move to the correct location and try again.`,
      [
        { text: 'OK', style: 'cancel' },
        {
          text: 'Navigate to Location',
          onPress: () => {
            Linking.openURL(
              `https://maps.google.com/?q=${approvedLocation.latitude},${approvedLocation.longitude}`
            );
          },
        },
      ]
    );
    return false;
  }

  return true;
}

/**
 * Validate driver location for pickup completion
 * Returns true if validation passes, false otherwise
 */
export async function validatePickupLocation(
  currentLocation: GeoLocation | null,
  pickupLocation: { latitude: number; longitude: number; name: string },
  taskId: number,
  locationId: number,
  logViolation: (data: any) => Promise<void>
): Promise<boolean> {
  if (!currentLocation) {
    Alert.alert(
      '❌ GPS Required',
      'GPS location is required to complete pickup. Please enable location services.',
      [{ text: 'OK' }]
    );
    return false;
  }

  const { isWithin, distance } = isWithinGeofence(
    currentLocation.latitude,
    currentLocation.longitude,
    pickupLocation.latitude,
    pickupLocation.longitude,
    100 // 100m radius for pickup
  );

  if (!isWithin) {
    Alert.alert(
      '🚫 Geo-fence Violation',
      `You are ${formatDistance(
        distance
      )} away from the pickup location.\n\nPickup can ONLY be completed within 100m of ${
        pickupLocation.name
      }.\n\nCurrent distance: ${formatDistance(distance)}\nRequired: Within 100m\n\n⚠️ This violation has been logged and supervisors have been notified.`,
      [
        { text: 'OK', style: 'cancel' },
        {
          text: 'Navigate to Location',
          onPress: () => {
            Linking.openURL(
              `https://maps.google.com/?q=${pickupLocation.latitude},${pickupLocation.longitude}`
            );
          },
        },
      ]
    );

    // Log violation
    await logViolation({
      taskId: taskId,
      locationId: locationId,
      locationType: 'pickup',
      driverLocation: currentLocation,
      expectedLocation: pickupLocation,
      distance: distance,
      timestamp: new Date(),
      notifyAdmin: false,
    });

    return false;
  }

  return true;
}

/**
 * Validate driver location for dropoff completion
 * Returns true if validation passes, false otherwise
 */
export async function validateDropoffLocation(
  currentLocation: GeoLocation | null,
  dropoffLocation: { latitude: number; longitude: number; name: string },
  taskId: number,
  logViolation: (data: any) => Promise<void>
): Promise<boolean> {
  if (!currentLocation) {
    Alert.alert(
      '❌ GPS Required',
      'GPS location is required to complete drop-off. Please enable location services.',
      [{ text: 'OK' }]
    );
    return false;
  }

  const { isWithin, distance } = isWithinGeofence(
    currentLocation.latitude,
    currentLocation.longitude,
    dropoffLocation.latitude,
    dropoffLocation.longitude,
    100 // 100m radius for dropoff
  );

  if (!isWithin) {
    Alert.alert(
      '🚫 Geo-fence Violation',
      `You are ${formatDistance(
        distance
      )} away from the drop-off location.\n\nDrop-off can ONLY be completed within 100m of ${
        dropoffLocation.name
      }.\n\nCurrent distance: ${formatDistance(distance)}\nRequired: Within 100m\n\n⚠️ This violation has been logged and admin/supervisors have been notified immediately.`,
      [
        { text: 'OK', style: 'cancel' },
        {
          text: 'Navigate to Site',
          onPress: () => {
            Linking.openURL(
              `https://maps.google.com/?q=${dropoffLocation.latitude},${dropoffLocation.longitude}`
            );
          },
        },
      ]
    );

    // Log violation with admin notification
    await logViolation({
      taskId: taskId,
      locationId: -1,
      locationType: 'dropoff',
      driverLocation: currentLocation,
      expectedLocation: dropoffLocation,
      distance: distance,
      timestamp: new Date(),
      notifyAdmin: true, // Immediate admin notification for dropoff violations
    });

    return false;
  }

  return true;
}

/**
 * Check for worker count mismatch
 * Returns mismatch data if there's a mismatch, null otherwise
 */
export function checkWorkerCountMismatch(
  expectedWorkers: Array<{ workerId: number; name: string }>,
  actualWorkers: Array<{ workerId: number; name: string }>
): {
  hasMismatch: boolean;
  expectedCount: number;
  actualCount: number;
  missingWorkers: Array<{ workerId: number; name: string }>;
} | null {
  const actualWorkerIds = actualWorkers.map((w) => w.workerId);
  const missingWorkers = expectedWorkers.filter(
    (w) => !actualWorkerIds.includes(w.workerId)
  );

  if (missingWorkers.length > 0) {
    return {
      hasMismatch: true,
      expectedCount: expectedWorkers.length,
      actualCount: actualWorkers.length,
      missingWorkers: missingWorkers,
    };
  }

  return null;
}

/**
 * Check if previous task is completed (for sequential execution)
 */
export function canStartTask(
  tasks: Array<{ taskId: number; status: string }>,
  currentTaskId: number
): { canStart: boolean; reason?: string } {
  const currentIndex = tasks.findIndex((t) => t.taskId === currentTaskId);
  
  if (currentIndex === 0) {
    // First task can always be started
    return { canStart: true };
  }

  const previousTask = tasks[currentIndex - 1];
  if (previousTask && previousTask.status !== 'completed') {
    return {
      canStart: false,
      reason: `Complete Task #${currentIndex} first before starting this task`,
    };
  }

  return { canStart: true };
}
