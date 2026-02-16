# Geofence Button Disable Implementation - COMPLETE

## ✅ Implementation Summary

The Start Task button now proactively disables when the worker is outside the project geofence, providing better UX and preventing unnecessary API calls.

---

## 🔧 Changes Made

### 1. TodaysTasksScreen.tsx

#### Added Geofence Calculation Function
```typescript
// Calculate distance using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2): number => {
  // Returns distance in meters
};

// Check if worker is inside geofence for a task
const isInsideGeofence = useCallback((task: TaskAssignment): boolean => {
  if (!currentLocation) return false;
  if (!task.projectGeofence) return true; // Backward compatibility
  
  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    task.projectGeofence.latitude,
    task.projectGeofence.longitude
  );
  
  const radius = task.projectGeofence.radius || 100;
  const tolerance = task.projectGeofence.allowedVariance || 20;
  
  return distance <= (radius + tolerance);
}, [currentLocation]);
```

#### Updated TaskCard Rendering
```typescript
<TaskCard
  task={item}
  onStartTask={handleStartTask}
  onUpdateProgress={handleUpdateProgress}
  onViewLocation={handleViewLocation}
  canStart={canStartTask(item)}
  isInsideGeofence={isInsideGeofence(item)}  // ← Added
  isOffline={isOffline}
  navigation={navigation}
  isExpanded={expandedTaskId === item.assignmentId}
  onToggleExpand={() => handleToggleExpand(item.assignmentId)}
/>
```

---

### 2. TaskCard.tsx

#### Updated Props Interface
```typescript
interface TaskCardProps {
  task: TaskAssignment;
  onStartTask: (taskId: number) => void;
  onUpdateProgress: (taskId: number, progress: number) => void;
  onViewLocation: (task: TaskAssignment) => void;
  canStart: boolean;
  isInsideGeofence?: boolean;  // ← Added (default: true)
  isOffline: boolean;
  navigation?: any;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}
```

#### Updated handleStartTask Function
```typescript
const handleStartTask = () => {
  // Check offline first
  if (isOffline) {
    Alert.alert('Offline Mode', 'Cannot start tasks while offline');
    return;
  }

  // Check geofence (NEW)
  if (!isInsideGeofence) {
    Alert.alert(
      'Outside Geo-Fence',
      'You must be at the work site to start this task.',
      [
        { text: 'OK' },
        { text: 'View Location', onPress: () => onViewLocation(task) }
      ]
    );
    return;
  }

  // Check dependencies
  if (!canStart) {
    Alert.alert('Cannot Start Task', 'Dependencies must be completed first');
    return;
  }

  // Proceed to start
  Alert.alert('Start Task', `Start "${task.taskName}"?`, [
    { text: 'Cancel' },
    { text: 'Start', onPress: () => onStartTask(task.assignmentId) }
  ]);
};
```

#### Updated Button Rendering
```typescript
// Start button for pending tasks
if (task.status === 'pending') {
  const canStartTask = canStart && isInsideGeofence && !isOffline;
  let buttonTitle = 'Start Task';
  let buttonVariant = 'success';

  if (isOffline) {
    buttonTitle = 'Offline';
    buttonVariant = 'neutral';
  } else if (!isInsideGeofence) {
    buttonTitle = 'Outside Geo-Fence';  // ← NEW
    buttonVariant = 'danger';
  } else if (!canStart) {
    buttonTitle = 'Dependencies Required';
    buttonVariant = 'neutral';
  }

  buttons.push(
    <ConstructionButton
      key="start"
      title={buttonTitle}
      onPress={handleStartTask}
      variant={buttonVariant}
      disabled={!canStartTask}  // ← Disabled when outside geofence
      size="medium"
      fullWidth
    />
  );
}
```

---

## 🎯 Button States

The Start Task button now has 4 possible states:

| Condition | Button Title | Variant | Disabled | Action |
|-----------|-------------|---------|----------|--------|
| ✅ Ready to start | "Start Task" | success | No | Starts task |
| 📡 Offline | "Offline" | neutral | Yes | Shows offline alert |
| 📍 Outside geofence | "Outside Geo-Fence" | danger | Yes | Shows geofence alert + View Location |
| 🔗 Dependencies | "Dependencies Required" | neutral | Yes | Shows dependency alert |

---

## 🔍 Geofence Validation Logic

### Distance Calculation
- Uses Haversine formula for accurate GPS distance
- Returns distance in meters

### Geofence Check
```typescript
distance <= (radius + tolerance)
```

- **radius**: Project geofence radius (default: 100m)
- **tolerance**: Allowed variance for GPS accuracy (default: 20m)
- **Total allowed distance**: radius + tolerance (e.g., 120m)

### Backward Compatibility
- If task has no geofence data, validation passes (returns true)
- If no current location, validation fails (returns false)

---

## 📱 User Experience Flow

### Before (Old Behavior):
1. User clicks "Start Task"
2. API call made
3. Backend validates geofence
4. Error returned if outside
5. Alert shown

### After (New Behavior):
1. Button shows "Outside Geo-Fence" (red/danger)
2. Button is disabled
3. User can't click
4. Alert explains: "You must be at the work site"
5. "View Location" button opens map to show distance

---

## ✅ Benefits

1. **Better UX**: User knows immediately they're outside geofence
2. **Prevents errors**: No failed API calls
3. **Clear feedback**: Button text explains why it's disabled
4. **Helpful action**: "View Location" button shows how far they are
5. **Real-time updates**: As worker moves, button updates automatically

---

## 🧪 Testing

### Test Scenarios:

1. **Inside Geofence**:
   - Button: "Start Task" (green)
   - Enabled: Yes
   - Click: Shows confirmation dialog

2. **Outside Geofence**:
   - Button: "Outside Geo-Fence" (red)
   - Enabled: No
   - Click: Shows alert with "View Location" option

3. **No Location Permission**:
   - Button: "Outside Geo-Fence" (red)
   - Enabled: No
   - Behavior: Treated as outside geofence

4. **Offline Mode**:
   - Button: "Offline" (gray)
   - Enabled: No
   - Takes precedence over geofence check

5. **Has Dependencies**:
   - Button: "Dependencies Required" (gray)
   - Enabled: No
   - Checked after geofence validation

---

## 📝 Files Modified

1. `ConstructionERPMobile/src/screens/worker/TodaysTasksScreen.tsx`
   - Added `calculateDistance` function
   - Added `isInsideGeofence` callback
   - Updated TaskCard props to include `isInsideGeofence`

2. `ConstructionERPMobile/src/components/cards/TaskCard.tsx`
   - Added `isInsideGeofence` prop to interface
   - Updated `handleStartTask` to check geofence
   - Updated button rendering logic for geofence state
   - Added "View Location" option in geofence alert

---

## 🚀 Deployment

**No backend changes required** - This is a frontend-only enhancement.

**To test:**
1. Rebuild the mobile app
2. Login as worker
3. Go to Today's Tasks
4. If outside project site, button will show "Outside Geo-Fence" and be disabled
5. Move closer to site, button will enable automatically

---

## ✅ Status: COMPLETE

The geofence validation for Start Task button is now fully implemented and provides proactive feedback to workers about their location relative to the work site.
