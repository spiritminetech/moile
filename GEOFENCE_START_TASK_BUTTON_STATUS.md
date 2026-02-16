# Geofence Validation for Start Task Button - Status

## ❌ NOT FULLY IMPLEMENTED

The requirement "If worker is outside geo-fence: Start Task button disabled" is **partially implemented** but not complete.

---

## ✅ What IS Implemented

### 1. Backend Geofence Validation
Location: `backend/src/modules/worker/workerController.js` (lines 2200+)

When a worker tries to start a task, the backend validates:
```javascript
// Get project geofence
const project = await Project.findOne({ id: assignment.projectId });

// Validate worker location against geofence
const distance = calculateDistance(
  location.latitude,
  location.longitude,
  project.geofence.center.latitude,
  project.geofence.center.longitude
);

if (distance > project.geofence.radius) {
  return res.status(400).json({
    error: 'GEOFENCE_VALIDATION_FAILED',
    message: 'You must be within the project site to start this task'
  });
}
```

### 2. Error Handling in Mobile App
Location: `ConstructionERPMobile/src/screens/worker/TodaysTasksScreen.tsx` (line 396)

```typescript
if (response.error === 'GEOFENCE_VALIDATION_FAILED') {
  Alert.alert(
    'Outside Geo-Fence',
    response.message || 'You must be at the work site to start this task.'
  );
}
```

### 3. Location Map Screen
Location: `ConstructionERPMobile/src/screens/worker/TaskLocationMapScreen.tsx`

Shows:
- Worker's current location
- Project geofence circle
- Distance from site
- Visual indicator if inside/outside geofence

---

## ❌ What is NOT Implemented

### Missing: Proactive Button Disable

The Start Task button in `TaskCard.tsx` does NOT check geofence before allowing the user to click.

**Current behavior:**
1. User clicks "Start Task"
2. API call is made
3. Backend validates geofence
4. If outside, error is returned
5. Alert shown to user

**Expected behavior:**
1. App checks worker location vs project geofence
2. If outside geofence, button is disabled/grayed out
3. Shows message: "Move closer to site to start task"
4. User can't even attempt to start

---

## 📊 Current Implementation in TaskCard

Location: `ConstructionERPMobile/src/components/cards/TaskCard.tsx` (line 109)

```typescript
const handleStartTask = () => {
  // ✅ Checks offline mode
  if (isOffline) {
    Alert.alert('Offline Mode', 'Cannot start tasks while offline');
    return;
  }

  // ✅ Checks task dependencies
  if (!canStart) {
    Alert.alert('Cannot Start Task', 'Dependencies must be completed first');
    return;
  }

  // ❌ MISSING: Geofence check
  // Should check: if (!isInsideGeofence) { ... }

  // Proceeds to start task
  Alert.alert('Start Task', `Start "${task.taskName}"?`, [
    { text: 'Cancel' },
    { text: 'Start', onPress: () => onStartTask(task.assignmentId) }
  ]);
};
```

---

## 🔧 What Needs to be Added

### 1. Pass Geofence Status to TaskCard

In `TodaysTasksScreen.tsx`, calculate geofence status:

```typescript
const isInsideGeofence = (task: TaskAssignment): boolean => {
  if (!currentLocation || !task.projectGeofence) return false;
  
  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    task.projectGeofence.latitude,
    task.projectGeofence.longitude
  );
  
  return distance <= task.projectGeofence.radius;
};
```

### 2. Update TaskCard Props

Add `isInsideGeofence` prop:

```typescript
<TaskCard
  task={item}
  onStartTask={handleStartTask}
  isInsideGeofence={isInsideGeofence(item)}  // ← Add this
  // ... other props
/>
```

### 3. Update TaskCard Component

Disable button if outside geofence:

```typescript
const canStartTask = canStart && isInsideGeofence && !isOffline;

<ActionButton
  key="start"
  title={
    !isInsideGeofence ? 'Outside Geo-Fence' :
    !canStart ? 'Dependencies Required' :
    'Start Task'
  }
  onPress={handleStartTask}
  disabled={!canStartTask}  // ← Disable if outside geofence
  variant={canStartTask ? 'success' : 'neutral'}
/>
```

---

## 📝 Summary

| Feature | Status | Location |
|---------|--------|----------|
| Backend geofence validation | ✅ Implemented | `workerController.js` |
| Error handling in mobile | ✅ Implemented | `TodaysTasksScreen.tsx` |
| Location map with geofence | ✅ Implemented | `TaskLocationMapScreen.tsx` |
| **Proactive button disable** | ❌ **NOT Implemented** | `TaskCard.tsx` |

---

## 🎯 Recommendation

The feature works (backend prevents starting tasks outside geofence), but the UX could be improved by:

1. Disabling the Start Task button when outside geofence
2. Showing distance to site
3. Providing "Navigate to Site" button
4. Real-time geofence status updates

This would prevent users from clicking Start only to see an error, improving the user experience.
