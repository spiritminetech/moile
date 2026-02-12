# Multiple Active Trips Fix - Active Trip Tracking

## 🐛 Problem Identified

### Before Fix:
When a driver starts multiple routes:
1. Start Route for Task 1 → Shows in Active Trip Tracking ✅
2. Start Route for Task 2 → Only Task 2 shows, Task 1 disappears ❌

**Root Cause**: Using single state variables that get overwritten:
```typescript
// WRONG - Only tracks ONE trip
const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
const [tripLogId, setTripLogId] = useState<string | null>(null);
const [isLocationTracking, setIsLocationTracking] = useState(false);
```

---

## ✅ Solution Implemented

### After Fix:
Track trip data PER TASK using a dictionary/map:
```typescript
// CORRECT - Tracks MULTIPLE trips
const [tripTrackingData, setTripTrackingData] = useState<Record<number, {
  startTime: Date;
  logId: string;
  isTracking: boolean;
}>>({});
```

Now when driver starts multiple routes:
1. Start Route for Task 1 → Shows in Active Trip Tracking ✅
2. Start Route for Task 2 → BOTH Task 1 AND Task 2 show ✅✅

---

## 📊 Data Structure

### Old Structure (Single Trip):
```typescript
{
  tripStartTime: Date,
  tripLogId: "TRIP-123-...",
  isLocationTracking: true
}
```

### New Structure (Multiple Trips):
```typescript
{
  123: {  // Task ID 123
    startTime: Date,
    logId: "TRIP-123-...",
    isTracking: true
  },
  456: {  // Task ID 456
    startTime: Date,
    logId: "TRIP-456-...",
    isTracking: true
  }
}
```

---

## 🔄 Changes Made

### 1. State Management
```typescript
// OLD
const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
const [tripLogId, setTripLogId] = useState<string | null>(null);
const [isLocationTracking, setIsLocationTracking] = useState(false);

// NEW
const [tripTrackingData, setTripTrackingData] = useState<Record<number, {
  startTime: Date;
  logId: string;
  isTracking: boolean;
}>>({});
```

### 2. handleStartRoute Function
```typescript
// OLD - Overwrites previous trip
setTripStartTime(startTime);
setTripLogId(logId);
setIsLocationTracking(true);

// NEW - Stores per task ID
setTripTrackingData(prev => ({
  ...prev,
  [taskId]: {
    startTime: startTime,
    logId: logId,
    isTracking: true
  }
}));
```

### 3. handleUpdateTaskStatus Function
```typescript
// OLD - Clears all tracking
if (status === 'completed') {
  setIsLocationTracking(false);
  setTripStartTime(null);
  setTripLogId(null);
}

// NEW - Removes only completed task
if (status === 'completed') {
  setTripTrackingData(prev => {
    const updated = { ...prev };
    delete updated[taskId];
    return updated;
  });
}
```

### 4. Location Tracking Effect
```typescript
// OLD - Checks single flag
if (isLocationTracking) {
  // Start tracking
}

// NEW - Checks if ANY trip is tracking
const hasActiveTracking = Object.values(tripTrackingData).some(trip => trip.isTracking);
if (hasActiveTracking) {
  // Start tracking
}
```

### 5. Render Multiple Cards
```typescript
// OLD - Shows single card
<TripTrackingStatusCard
  task={activeTask}
  tripStartTime={tripStartTime}
  tripLogId={tripLogId}
  isLocationTracking={isLocationTracking}
/>

// NEW - Shows ALL active trips
{transportTasks
  .filter(task => 
    task.status !== 'pending' && 
    task.status !== 'completed' &&
    tripTrackingData[task.taskId]
  )
  .map(task => {
    const trackingData = tripTrackingData[task.taskId];
    return (
      <TripTrackingStatusCard
        key={task.taskId}
        task={task}
        tripStartTime={trackingData.startTime}
        tripLogId={trackingData.logId}
        isLocationTracking={trackingData.isTracking}
      />
    );
  })
}
```

### 6. Summary Badge
```typescript
// OLD - Shows "Tracking Active"
{isLocationTracking && (
  <Text>Tracking Active</Text>
)}

// NEW - Shows count "2 Trips Active"
{Object.keys(tripTrackingData).length > 0 && (
  <Text>
    {Object.keys(tripTrackingData).length} Trip{Object.keys(tripTrackingData).length > 1 ? 's' : ''} Active
  </Text>
)}
```

---

## 🎯 User Experience

### Scenario: Driver has 3 tasks today

**Step 1**: Driver starts Route for Task 1
- ✅ Active Trip Tracking card appears for Task 1
- ✅ Badge shows "1 Trip Active"

**Step 2**: Driver starts Route for Task 2
- ✅ Active Trip Tracking card for Task 1 REMAINS visible
- ✅ Active Trip Tracking card for Task 2 appears
- ✅ Badge shows "2 Trips Active"

**Step 3**: Driver completes Task 1
- ✅ Active Trip Tracking card for Task 1 disappears
- ✅ Active Trip Tracking card for Task 2 REMAINS visible
- ✅ Badge shows "1 Trip Active"

**Step 4**: Driver starts Route for Task 3
- ✅ Active Trip Tracking card for Task 2 REMAINS visible
- ✅ Active Trip Tracking card for Task 3 appears
- ✅ Badge shows "2 Trips Active"

---

## 📱 Visual Display

### Dashboard with Multiple Active Trips:

```
┌─────────────────────────────────────┐
│ 📊 Today's Overview  [2 Trips Active]│
│                                     │
│  3 Tasks | 15/20 Workers | KA01AB  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🚛 Active Trip Tracking             │
│ Trip ID: TRIP-123-1234567890        │
│ Started: 10:30:45 AM                │
│ Duration: 00:15:23                  │
│ Route: Morning Pickup Route 1       │
│ GPS: 🟢 Excellent (8m)              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🚛 Active Trip Tracking             │
│ Trip ID: TRIP-456-1234567920        │
│ Started: 10:45:12 AM                │
│ Duration: 00:00:51                  │
│ Route: Morning Pickup Route 2       │
│ GPS: 🟢 Good (15m)                  │
└─────────────────────────────────────┘

[Task Cards...]
[Route Map...]
[Worker Manifest...]
```

---

## 🔍 Technical Details

### Data Flow:

```
1. Driver clicks "Start Route" on Task 123
   ↓
2. handleStartRoute(123) called
   ↓
3. API updates task status to "ONGOING"
   ↓
4. Store tracking data:
   tripTrackingData[123] = {
     startTime: Date,
     logId: "TRIP-123-...",
     isTracking: true
   }
   ↓
5. Render TripTrackingStatusCard for Task 123
   ↓
6. Driver clicks "Start Route" on Task 456
   ↓
7. handleStartRoute(456) called
   ↓
8. API updates task status to "ONGOING"
   ↓
9. Store tracking data (KEEPS Task 123):
   tripTrackingData = {
     123: { ... },  // PRESERVED
     456: { ... }   // ADDED
   }
   ↓
10. Render TripTrackingStatusCard for BOTH tasks
```

---

## ✅ Benefits

1. **Multiple Active Trips**: Driver can track multiple routes simultaneously
2. **No Data Loss**: Starting a new route doesn't overwrite previous route data
3. **Independent Tracking**: Each trip has its own start time, trip ID, and tracking status
4. **Accurate Count**: Badge shows exact number of active trips
5. **Clean Completion**: Completing one trip doesn't affect other active trips
6. **Scalable**: Can handle any number of active trips

---

## 🧪 Testing Checklist

- [ ] Start Route for Task 1 → Card appears
- [ ] Start Route for Task 2 → Both cards visible
- [ ] Start Route for Task 3 → All three cards visible
- [ ] Complete Task 1 → Only Task 1 card disappears
- [ ] Complete Task 2 → Only Task 2 card disappears
- [ ] Badge shows correct count (0, 1, 2, 3+ trips)
- [ ] Location tracking continues for all active trips
- [ ] Each card shows correct trip ID and start time
- [ ] Elapsed time counter works for each trip independently

---

## 📝 Notes

- Trip tracking data is stored in component state (not persisted)
- On app restart, tracking data is lost (trips continue in database)
- Each trip has independent tracking status
- Location updates apply to ALL active trips
- Background tracking runs as long as ANY trip is active

---

**Last Updated**: February 11, 2026
**Status**: ✅ Fixed
**Issue**: Multiple active trips not showing
**Solution**: Track trips per task ID instead of single state
