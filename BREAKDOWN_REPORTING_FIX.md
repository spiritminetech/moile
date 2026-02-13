# Breakdown Reporting Fix & Auto-Refresh Stop

## Issues Fixed

### Issue 1: Breakdown Reporting Error
**Problem**: When clicking "Vehicle Breakdown" → "Flat Tire", an error occurred: "breakdown types and description are required"

**Root Cause**: The API requires `breakdownType`, `severity`, and `description` parameters, but the code was only passing `reason`.

**API Requirements**:
```typescript
async reportBreakdown(
  taskId: number,
  breakdownData: {
    breakdownType: string,      // ✅ Required
    severity: string,            // ✅ Required
    requiresAssistance: boolean, // ✅ Required
    location?: { latitude, longitude },
    description?: string,        // ✅ Required
    photoUrls?: string[]
  }
)
```

**Solution**: Implemented two-step breakdown reporting process:

#### Step 1: Breakdown Type Selection
```typescript
const breakdownReasons = [
  'Engine Problem',
  'Flat Tire',
  'Battery Dead',
  'Overheating',
  'Brake Issue',
  'Transmission Problem',
  'Other Mechanical Issue'
];
```

#### Step 2: Severity Selection
```typescript
Alert.alert(
  '⚠️ Breakdown Severity',
  'How severe is the breakdown?',
  [
    { text: 'Minor - Can continue slowly' },
    { text: 'Moderate - Need assistance soon' },
    { text: 'Severe - Cannot continue' }
  ]
);
```

#### Step 3: Submit with All Required Fields
```typescript
const response = await driverApiService.reportBreakdown(selectedTask.taskId, {
  breakdownType,                    // ✅ Provided
  severity,                         // ✅ Provided
  requiresAssistance: severity === 'moderate' || severity === 'severe',
  location: locationState.currentLocation || undefined,
  description: `Driver reported ${breakdownType} with ${severity} severity`, // ✅ Provided
});
```

### Issue 2: Auto-Refresh Disrupting Navigation Screen
**Problem**: The 15-second auto-refresh was disrupting the navigation screen, causing UI updates while driver was viewing route information.

**Solution**: Stop auto-refresh when navigation screen is active.

```typescript
// ❌ BEFORE
useEffect(() => {
  const hasActiveTasks = transportTasks.some(task => 
    task.status !== 'completed' && task.status !== 'pending'
  );

  if (!hasActiveTasks) {
    return; // No auto-refresh if no active tasks
  }

  // Auto-refresh runs even on navigation screen
  const autoRefreshInterval = setInterval(() => {
    loadTransportTasks(false);
  }, 15000);

  return () => clearInterval(autoRefreshInterval);
}, [transportTasks, loadTransportTasks]);

// ✅ AFTER
useEffect(() => {
  const hasActiveTasks = transportTasks.some(task => 
    task.status !== 'completed' && task.status !== 'pending'
  );

  // ✅ Stop auto-refresh when navigation screen is active
  if (!hasActiveTasks || activeView === 'navigation') {
    return; // No auto-refresh if no active tasks or on navigation screen
  }

  const autoRefreshInterval = setInterval(() => {
    loadTransportTasks(false);
  }, 15000);

  return () => clearInterval(autoRefreshInterval);
}, [transportTasks, loadTransportTasks, activeView]); // ✅ Added activeView dependency
```

## User Experience Flow

### Breakdown Reporting (Fixed):
1. Driver clicks "🚨 Report Delay/Breakdown" button
2. Selects "🔧 Vehicle Breakdown"
3. Chooses breakdown type (e.g., "Flat Tire")
4. **NEW**: Selects severity level:
   - Minor - Can continue slowly
   - Moderate - Need assistance soon
   - Severe - Cannot continue
5. System submits report with all required fields:
   - ✅ breakdownType: "Flat Tire"
   - ✅ severity: "moderate"
   - ✅ description: "Driver reported Flat Tire with moderate severity"
   - ✅ requiresAssistance: true (for moderate/severe)
   - ✅ location: GPS coordinates
6. Confirmation shown with Incident ID
7. Dispatch contacted based on severity
8. Task list refreshes to show updated status

### Auto-Refresh Behavior (Fixed):
- **Tasks Screen**: Auto-refresh every 15 seconds ✅
- **Navigation Screen**: Auto-refresh STOPPED ✅
- **Workers Screen**: Auto-refresh every 15 seconds ✅
- **Completed Tasks**: No auto-refresh ✅

## Severity Levels

### Minor:
- Can continue driving slowly
- Assistance not immediately required
- Dispatch notified for monitoring
- Example: Minor oil leak, small dent

### Moderate:
- Need assistance soon
- Can continue for short distance
- Assistance automatically requested
- Dispatch contacted
- Example: Flat tire, overheating warning

### Severe:
- Cannot continue driving
- Emergency assistance required
- Immediate dispatch notification
- High priority response
- Example: Engine failure, brake failure, major accident

## Technical Details

### Breakdown Report Data Structure:
```typescript
{
  incidentId: number,
  incidentType: 'breakdown',
  breakdownType: string,        // e.g., "Flat Tire"
  severity: 'minor' | 'moderate' | 'severe',
  status: string,
  reportedAt: string,
  currentLocation: { latitude, longitude },
  description: string,
  requiresAssistance: boolean,
  photoUrls: string[]
}
```

### Auto-Refresh Logic:
```typescript
// Conditions for auto-refresh:
1. Has active tasks (not completed or pending)
2. NOT on navigation screen (activeView !== 'navigation')
3. Interval: 15 seconds

// When stopped:
- Navigation screen active
- No active tasks
- Component unmounted
```

## Error Handling

### Before Fix:
```
❌ Error: breakdown types and description are required
```

### After Fix:
```
✅ Breakdown report submitted successfully
✅ All required fields provided
✅ Proper error messages if API fails
✅ Fallback instructions (call dispatch)
```

## Benefits

### Breakdown Reporting:
- ✅ No more "required fields" errors
- ✅ Severity assessment helps dispatch prioritize
- ✅ Automatic assistance request based on severity
- ✅ Better description generation
- ✅ Proper API parameter mapping

### Auto-Refresh:
- ✅ No disruption on navigation screen
- ✅ Driver can view route information without interruption
- ✅ Still refreshes on tasks screen for updates
- ✅ Better user experience
- ✅ Prevents UI flickering during navigation

## Testing Recommendations

1. **Test Breakdown Reporting**:
   - ✅ Select each breakdown type
   - ✅ Select each severity level
   - ✅ Verify no "required fields" error
   - ✅ Check incident ID returned
   - ✅ Confirm dispatch notified

2. **Test Auto-Refresh**:
   - ✅ On tasks screen: verify auto-refresh works
   - ✅ On navigation screen: verify auto-refresh stops
   - ✅ Switch between screens: verify refresh resumes/stops
   - ✅ Check console logs for refresh activity

3. **Test Severity Levels**:
   - ✅ Minor: verify assistance not auto-requested
   - ✅ Moderate: verify assistance requested
   - ✅ Severe: verify emergency notification
   - ✅ Check confirmation messages match severity

4. **Test Error Handling**:
   - ✅ Test with no network
   - ✅ Test with invalid task
   - ✅ Verify error messages
   - ✅ Check fallback instructions

## Notes

- Severity selection helps dispatch prioritize responses
- Auto-refresh stops only on navigation screen to prevent disruption
- All required API fields are now properly provided
- GPS location automatically captured when available
- Description automatically generated from breakdown type and severity
- Emergency assistance automatically requested for moderate/severe breakdowns
