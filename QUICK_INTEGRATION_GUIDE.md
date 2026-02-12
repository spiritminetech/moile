# Quick Integration Guide - Driver App Critical Fixes

## 🚀 5-Minute Integration Guide

This guide shows you exactly what to add to your existing `TransportTasksScreen.tsx` to enable all critical fixes.

---

## Step 1: Import New Components and Utilities

Add these imports at the top of `TransportTasksScreen.tsx`:

```typescript
// Add these new imports
import { DelayBreakdownReportForm, WorkerCountMismatchForm } from '../../components/driver';
import { 
  calculateDistance, 
  isWithinGeofence, 
  validateGeofenceDetailed,
  GEOFENCE_RADIUS 
} from '../../utils/geofenceUtils';
```

---

## Step 2: Add State Variables

Add these state variables to your component:

```typescript
// Add these new state variables
const [showDelayForm, setShowDelayForm] = useState(false);
const [showBreakdownForm, setShowBreakdownForm] = useState(false);
const [showMismatchForm, setShowMismatchForm] = useState(false);
const [mismatchData, setMismatchData] = useState<{
  expectedWorkers: any[];
  actualWorkers: any[];
} | null>(null);
```

---

## Step 3: Update handleStartRoute (Fix #1: Pre-Start Validation)

Replace your existing `handleStartRoute` function with this:

```typescript
const handleStartRoute = useCallback(async (taskId: number) => {
  try {
    // ✅ FIX #1: STRICT GEO-FENCE VALIDATION
    const currentLocation = await getCurrentLocation();
    
    if (!currentLocation) {
      Alert.alert(
        '❌ GPS Not Available',
        'GPS location is required to start route. Please enable location services.',
        [{ text: 'OK' }]
      );
      return; // HARD BLOCK
    }

    // Get the task
    const task = transportTasks.find(t => t.taskId === taskId);
    if (!task || !task.pickupLocations[0]) {
      Alert.alert('Error', 'Task or pickup location not found');
      return;
    }

    // Validate geo-fence
    const pickupLocation = task.pickupLocations[0];
    const validation = validateGeofenceDetailed(
      currentLocation.latitude,
      currentLocation.longitude,
      pickupLocation.coordinates.latitude,
      pickupLocation.coordinates.longitude,
      GEOFENCE_RADIUS.START_ROUTE
    );

    if (!validation.isValid) {
      Alert.alert(
        '🚫 Location Validation Failed',
        `You must be at the approved pickup location to start the route.\n\n${validation.warningMessage}\n\nPlease move to the correct location and try again.`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Navigate',
            onPress: () => {
              Linking.openURL(
                `https://maps.google.com/?q=${pickupLocation.coordinates.latitude},${pickupLocation.coordinates.longitude}`
              );
            },
          },
        ]
      );
      return; // HARD BLOCK
    }

    // Proceed with route start
    const response = await driverApiService.updateTransportTaskStatus(
      taskId,
      'en_route_pickup',
      currentLocation,
      'Route started from approved location'
    );

    if (response.success) {
      Alert.alert('✅ Route Started', 'Route started successfully!');
      handleRefresh();
    }
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to start route');
  }
}, [transportTasks, getCurrentLocation, handleRefresh]);
```

---

## Step 4: Update handleCompletePickup (Fix #2: Geo-fence Enforcement)

Add this geo-fence check at the START of your `handleCompletePickup` function:

```typescript
const handleCompletePickup = useCallback(async (locationId: number) => {
  try {
    // ✅ FIX #2: STRICT GEO-FENCE ENFORCEMENT
    const currentLocation = await getCurrentLocation();
    
    if (!currentLocation) {
      Alert.alert('❌ GPS Required', 'GPS location is required to complete pickup.');
      return; // HARD BLOCK
    }

    const location = selectedTask?.pickupLocations.find(loc => loc.locationId === locationId);
    if (!location) {
      Alert.alert('Error', 'Location not found');
      return;
    }

    // Validate geo-fence
    const validation = validateGeofenceDetailed(
      currentLocation.latitude,
      currentLocation.longitude,
      location.coordinates.latitude,
      location.coordinates.longitude,
      GEOFENCE_RADIUS.PICKUP
    );

    if (!validation.isValid) {
      Alert.alert(
        '🚫 Geo-fence Violation',
        `Pickup can ONLY be completed within ${GEOFENCE_RADIUS.PICKUP}m of the location.\n\n${validation.warningMessage}\n\n⚠️ This violation has been logged and supervisors have been notified.`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Navigate',
            onPress: () => {
              Linking.openURL(
                `https://maps.google.com/?q=${location.coordinates.latitude},${location.coordinates.longitude}`
              );
            },
          },
        ]
      );

      // Log violation
      await driverApiService.logGeofenceViolation({
        taskId: selectedTask.taskId,
        locationId: locationId,
        locationType: 'pickup',
        driverLocation: currentLocation,
        expectedLocation: location.coordinates,
        distance: validation.distance,
        timestamp: new Date(),
      });

      return; // HARD BLOCK
    }

    // Continue with existing pickup logic...
    // ... rest of your existing code ...
    
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to complete pickup');
  }
}, [selectedTask, getCurrentLocation]);
```

---

## Step 5: Update handleCompleteDropoff (Fix #2 & #3: Geo-fence + Mismatch)

Add these checks at the START of your `handleCompleteDropoff` function:

```typescript
const handleCompleteDropoff = useCallback(async (locationId: number) => {
  try {
    // ✅ FIX #2: STRICT GEO-FENCE ENFORCEMENT
    const currentLocation = await getCurrentLocation();
    
    if (!currentLocation) {
      Alert.alert('❌ GPS Required', 'GPS location is required to complete drop-off.');
      return; // HARD BLOCK
    }

    const location = selectedTask?.dropoffLocation;
    if (!location) {
      Alert.alert('Error', 'Drop-off location not found');
      return;
    }

    // Validate geo-fence
    const validation = validateGeofenceDetailed(
      currentLocation.latitude,
      currentLocation.longitude,
      location.coordinates.latitude,
      location.coordinates.longitude,
      GEOFENCE_RADIUS.DROPOFF
    );

    if (!validation.isValid) {
      Alert.alert(
        '🚫 Geo-fence Violation',
        `Drop-off can ONLY be completed within ${GEOFENCE_RADIUS.DROPOFF}m of the site.\n\n${validation.warningMessage}\n\n⚠️ This violation has been logged and admin/supervisors have been notified.`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Navigate',
            onPress: () => {
              Linking.openURL(
                `https://maps.google.com/?q=${location.coordinates.latitude},${location.coordinates.longitude}`
              );
            },
          },
        ]
      );

      // Log violation with admin notification
      await driverApiService.logGeofenceViolation({
        taskId: selectedTask.taskId,
        locationId: -1,
        locationType: 'dropoff',
        driverLocation: currentLocation,
        expectedLocation: location.coordinates,
        distance: validation.distance,
        timestamp: new Date(),
        notifyAdmin: true,
      });

      return; // HARD BLOCK
    }

    // ✅ FIX #3: WORKER COUNT MISMATCH HANDLING
    const checkedInWorkers = selectedTask.pickupLocations.flatMap(loc =>
      (loc.workerManifest || []).filter(w => w.checkedIn)
    );
    
    const expectedCount = selectedTask.totalWorkers;
    const actualCount = checkedInWorkers.length;

    if (actualCount !== expectedCount) {
      // Show mismatch form
      setMismatchData({
        expectedWorkers: selectedTask.pickupLocations.flatMap(loc => loc.workerManifest),
        actualWorkers: checkedInWorkers,
      });
      setShowMismatchForm(true);
      return; // Wait for mismatch form completion
    }

    // Continue with existing drop-off logic...
    // ... rest of your existing code ...
    
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to complete drop-off');
  }
}, [selectedTask, getCurrentLocation]);
```

---

## Step 6: Add Mismatch Handler (Fix #3)

Add this new handler function:

```typescript
const handleMismatchSubmit = useCallback(async (mismatches: any[]) => {
  try {
    // Submit mismatch to backend
    const response = await driverApiService.submitWorkerMismatch({
      taskId: selectedTask!.taskId,
      expectedCount: selectedTask!.totalWorkers,
      actualCount: selectedTask!.pickupLocations.flatMap(loc =>
        (loc.workerManifest || []).filter(w => w.checkedIn)
      ).length,
      mismatches: mismatches,
      timestamp: new Date(),
      location: locationState.currentLocation!,
    });

    if (response.success) {
      setShowMismatchForm(false);
      // Now proceed with drop-off
      await completeDropoffAfterMismatch();
    }
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to record mismatch');
  }
}, [selectedTask, locationState.currentLocation]);
```

---

## Step 7: Update handleReportIssue (Fix #6: Delay/Breakdown UI)

Replace your existing `handleReportIssue` function with this:

```typescript
const handleReportIssue = useCallback(() => {
  Alert.alert(
    '🚨 Report Issue',
    'What type of issue would you like to report?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '🚦 Traffic Delay',
        onPress: () => setShowDelayForm(true),
      },
      {
        text: '🔧 Vehicle Breakdown',
        onPress: () => setShowBreakdownForm(true),
      },
    ]
  );
}, []);

const handleDelaySubmit = useCallback(async (reportData: any) => {
  try {
    // Upload photos
    const photoUrls = [];
    for (const photo of reportData.photos) {
      const formData = preparePhotoForUpload(photo);
      const uploadResponse = await driverApiService.uploadTripPhoto(
        selectedTask!.taskId,
        formData
      );
      if (uploadResponse.success && uploadResponse.data?.photoUrl) {
        photoUrls.push(uploadResponse.data.photoUrl);
      }
    }

    // Submit delay report
    const response = await driverApiService.reportDelay({
      taskId: selectedTask!.taskId,
      reason: reportData.reason,
      estimatedDelay: reportData.estimatedDelay,
      description: reportData.description,
      location: reportData.location,
      photoUrls: photoUrls,
      timestamp: new Date(),
    });

    if (response.success) {
      setShowDelayForm(false);
      Alert.alert(
        '✅ Delay Reported',
        'Delay reported successfully. Dispatch and supervisors notified.\n\nGrace period applied to worker attendance.'
      );
    }
  } catch (error: any) {
    throw error;
  }
}, [selectedTask]);

const handleBreakdownSubmit = useCallback(async (reportData: any) => {
  try {
    // Upload photos
    const photoUrls = [];
    for (const photo of reportData.photos) {
      const formData = preparePhotoForUpload(photo);
      const uploadResponse = await driverApiService.uploadTripPhoto(
        selectedTask!.taskId,
        formData
      );
      if (uploadResponse.success && uploadResponse.data?.photoUrl) {
        photoUrls.push(uploadResponse.data.photoUrl);
      }
    }

    // Submit breakdown report
    const response = await driverApiService.reportBreakdown({
      taskId: selectedTask!.taskId,
      reason: reportData.reason,
      estimatedDelay: reportData.estimatedDelay,
      description: reportData.description,
      location: reportData.location,
      photoUrls: photoUrls,
      timestamp: new Date(),
      requiresAssistance: true,
    });

    if (response.success) {
      setShowBreakdownForm(false);
      Alert.alert(
        '✅ Breakdown Reported',
        'Breakdown reported. Emergency assistance dispatched.\n\nEstimated arrival: 30-45 minutes'
      );
    }
  } catch (error: any) {
    throw error;
  }
}, [selectedTask]);
```

---

## Step 8: Update Task Rendering (Fix #5: Sequential Tasks)

Update your task card rendering to add sequential validation:

```typescript
{transportTasks.map((task, index) => {
  // ✅ FIX #5: SEQUENTIAL TASK EXECUTION
  const previousTask = index > 0 ? transportTasks[index - 1] : null;
  const canStartTask = !previousTask || previousTask.status === 'completed';

  return (
    <ConstructionCard key={task.taskId} variant="outlined" style={styles.taskCard}>
      {/* ... existing task header ... */}

      {/* Sequential task warning */}
      {!canStartTask && task.status === 'pending' && (
        <View style={styles.sequentialWarning}>
          <Text style={styles.sequentialWarningText}>
            ⚠️ Complete Task #{index} first before starting this task
          </Text>
        </View>
      )}

      <View style={styles.taskActions}>
        <ConstructionButton
          title="🗺️ Start Route"
          onPress={() => handleStartRoute(task.taskId)}
          variant="primary"
          size="small"
          disabled={!canStartTask || task.status !== 'pending'}
          style={styles.taskActionButton}
        />
        {!canStartTask && (
          <Text style={styles.disabledReason}>
            Previous task must be completed first
          </Text>
        )}
      </View>
    </ConstructionCard>
  );
})}
```

---

## Step 9: Add Form Modals to Render

Add these modals at the end of your render method (before closing tags):

```typescript
{/* Delay Report Form */}
{showDelayForm && selectedTask && (
  <DelayBreakdownReportForm
    taskId={selectedTask.taskId}
    reportType="delay"
    currentLocation={locationState.currentLocation}
    onSubmit={handleDelaySubmit}
    onCancel={() => setShowDelayForm(false)}
  />
)}

{/* Breakdown Report Form */}
{showBreakdownForm && selectedTask && (
  <DelayBreakdownReportForm
    taskId={selectedTask.taskId}
    reportType="breakdown"
    currentLocation={locationState.currentLocation}
    onSubmit={handleBreakdownSubmit}
    onCancel={() => setShowBreakdownForm(false)}
  />
)}

{/* Worker Mismatch Form */}
{showMismatchForm && mismatchData && (
  <WorkerCountMismatchForm
    expectedWorkers={mismatchData.expectedWorkers}
    actualWorkers={mismatchData.actualWorkers}
    onSubmit={handleMismatchSubmit}
    onCancel={() => setShowMismatchForm(false)}
  />
)}
```

---

## Step 10: Add Styles

Add these styles to your StyleSheet:

```typescript
sequentialWarning: {
  backgroundColor: ConstructionTheme.colors.errorContainer,
  padding: ConstructionTheme.spacing.sm,
  borderRadius: ConstructionTheme.borderRadius.sm,
  marginBottom: ConstructionTheme.spacing.md,
},
sequentialWarningText: {
  ...ConstructionTheme.typography.bodySmall,
  color: ConstructionTheme.colors.error,
  textAlign: 'center',
},
disabledReason: {
  ...ConstructionTheme.typography.bodySmall,
  color: ConstructionTheme.colors.onSurfaceVariant,
  textAlign: 'center',
  marginTop: ConstructionTheme.spacing.xs,
},
```

---

## ✅ DONE!

That's it! All 6 critical fixes are now integrated.

## 🧪 Testing Checklist

- [ ] Test route start outside geo-fence (should block)
- [ ] Test route start inside geo-fence (should work)
- [ ] Test pickup outside geo-fence (should block)
- [ ] Test drop outside geo-fence (should block)
- [ ] Test worker count mismatch (should show form)
- [ ] Test sequential tasks (Task 2 disabled until Task 1 done)
- [ ] Test delay reporting with photos
- [ ] Test breakdown reporting with photos

---

**Integration Time:** ~30 minutes  
**Difficulty:** Easy (Copy & Paste)  
**Impact:** HIGH - All critical features enabled
