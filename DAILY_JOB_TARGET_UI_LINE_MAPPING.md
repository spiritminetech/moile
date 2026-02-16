# Daily Job Target - UI Line Mapping Guide

## Complete Visual Breakdown of Where Each Field Appears

This document shows exactly where each Daily Job Target field is displayed in the TaskCard component.

---

## File: `ConstructionERPMobile/src/components/cards/TaskCard.tsx`

### Section Location: Lines 586-685 (Daily Job Target Section)

---

## Field-by-Field Breakdown

### 1. Section Title
**Line 588:**
```tsx
<Text style={styles.sectionTitle}>🎯 DAILY JOB TARGET</Text>
```
**Displays:** "🎯 DAILY JOB TARGET"

---

### 2. Target Type
**Lines 591-596:**
```tsx
{task.dailyTarget.targetType && (
  <View style={styles.targetRow}>
    <Text style={styles.targetLabel}>Target Type:</Text>
    <Text style={styles.targetValue}>{task.dailyTarget.targetType}</Text>
  </View>
)}
```
**Displays:** "Target Type:        Quantity Based"
**Condition:** Only shows if `task.dailyTarget.targetType` exists

---

### 3. Expected Output
**Lines 599-604:**
```tsx
<View style={styles.targetRow}>
  <Text style={styles.targetLabel}>Expected Output:</Text>
  <Text style={styles.targetValueHighlight}>
    {task.dailyTarget.quantity} {task.dailyTarget.unit}
  </Text>
</View>
```
**Displays:** "Expected Output:    25 LED Lighting Installations"
**Condition:** Always shows (uses basic dailyTarget fields)

---

### 4. Area/Level
**Lines 607-612:**
```tsx
{task.dailyTarget.areaLevel && (
  <View style={styles.targetRow}>
    <Text style={styles.targetLabel}>Area/Level:</Text>
    <Text style={styles.targetValue}>{task.dailyTarget.areaLevel}</Text>
  </View>
)}
```
**Displays:** "Area/Level:         Tower A – Level 2"
**Condition:** Only shows if `task.dailyTarget.areaLevel` exists

---

### 5. Start Time
**Lines 616-621:**
```tsx
{task.dailyTarget.startTime && (
  <View style={styles.targetRow}>
    <Text style={styles.targetLabel}>Start Time:</Text>
    <Text style={styles.targetValue}>{task.dailyTarget.startTime}</Text>
  </View>
)}
```
**Displays:** "Start Time:         08:00 AM"
**Condition:** Only shows if `task.dailyTarget.startTime` exists

---

### 6. Expected Finish
**Lines 623-628:**
```tsx
{task.dailyTarget.expectedFinish && (
  <View style={styles.targetRow}>
    <Text style={styles.targetLabel}>Expected Finish:</Text>
    <Text style={styles.targetValue}>{task.dailyTarget.expectedFinish}</Text>
  </View>
)}
```
**Displays:** "Expected Finish:    05:00 PM"
**Condition:** Only shows if `task.dailyTarget.expectedFinish` exists

---

### 7. Progress Today Section
**Lines 634-677:**
```tsx
{task.dailyTarget.progressToday && (
  <View style={styles.progressTodaySection}>
    <Text style={styles.progressTodayTitle}>Progress Today:</Text>
    
    <View style={styles.progressStatsRow}>
      <View style={styles.progressStat}>
        <Text style={styles.progressStatLabel}>Completed:</Text>
        <Text style={styles.progressStatValue}>
          {task.dailyTarget.progressToday.completed} / {task.dailyTarget.progressToday.total} {task.dailyTarget.unit}
        </Text>
      </View>
    </View>

    {/* Progress Bar */}
    <View style={styles.progressBarContainer}>
      <View 
        style={[
          styles.progressBarFill, 
          { 
            width: `${task.dailyTarget.progressToday.percentage}%`,
            backgroundColor: task.dailyTarget.progressToday.percentage >= 75 ? '#4CAF50' :
                           task.dailyTarget.progressToday.percentage >= 50 ? '#FF9800' : '#F44336'
          }
        ]} 
      />
    </View>
    
    <Text style={styles.progressPercentage}>
      Progress: {task.dailyTarget.progressToday.percentage}%
    </Text>
  </View>
)}
```
**Displays:**
```
Progress Today:
Completed: 0 / 25 LED Lighting Installations
[Progress bar - colored based on percentage]
Progress: 0%
```
**Condition:** Only shows if `task.dailyTarget.progressToday` exists

---

## Complete Visual Output

When ALL fields are present, the section displays:

```
🎯 DAILY JOB TARGET
--------------------------------------------------
Target Type:        Quantity Based
Expected Output:    25 LED Lighting Installations
Area/Level:         Tower A – Level 2
Start Time:         08:00 AM
Expected Finish:    05:00 PM

Progress Today:
Completed: 0 / 25 LED Lighting Installations
[████░░░░░░░░░░░░░░░░] (Progress bar)
Progress: 0%
```

---

## Why You're Only Seeing "Expected Output"

### Root Cause
The mobile app's API service (`workerApiService.ts`) was **filtering out** the enhanced fields during data mapping.

### The Problem (Lines 227-231 in workerApiService.ts - BEFORE FIX):
```typescript
dailyTarget: task.dailyTarget ? {
  description: task.dailyTarget.description || '',
  quantity: task.dailyTarget.quantity || 0,
  unit: task.dailyTarget.unit || '',
  targetCompletion: task.dailyTarget.targetCompletion || 100
  // ❌ Enhanced fields were NOT being mapped!
} : undefined,
```

### The Fix (Lines 227-236 in workerApiService.ts - AFTER FIX):
```typescript
dailyTarget: task.dailyTarget ? {
  description: task.dailyTarget.description || '',
  quantity: task.dailyTarget.quantity || 0,
  unit: task.dailyTarget.unit || '',
  targetCompletion: task.dailyTarget.targetCompletion || 100,
  // ✅ Enhanced daily target fields NOW INCLUDED
  targetType: task.dailyTarget.targetType || undefined,
  areaLevel: task.dailyTarget.areaLevel || undefined,
  startTime: task.dailyTarget.startTime || undefined,
  expectedFinish: task.dailyTarget.expectedFinish || undefined,
  progressToday: task.dailyTarget.progressToday || undefined
} : undefined,
```

---

## Data Flow Summary

### 1. Database (MongoDB)
```javascript
{
  dailyTarget: {
    quantity: 25,
    unit: "LED Lighting Installations",
    targetType: "Quantity Based",
    areaLevel: "Tower A – Level 2",
    startTime: "08:00 AM",
    expectedFinish: "05:00 PM",
    progressToday: { completed: 0, total: 25, percentage: 0 }
  }
}
```

### 2. Backend API (workerController.js - Line 985-1005)
✅ Returns all fields correctly

### 3. Mobile App API Service (workerApiService.ts - Line 227-236)
✅ NOW maps all fields correctly (AFTER FIX)

### 4. TaskCard Component (TaskCard.tsx - Lines 586-685)
✅ Displays all fields correctly

---

## What You Need to Do

Since the fix was in the mobile app code (`workerApiService.ts`), you need to **rebuild the app**:

```bash
cd ConstructionERPMobile
npx expo start --clear
```

Then press 'a' for Android or 'i' for iOS.

After rebuilding:
1. Log in with worker@gmail.com / password123
2. Navigate to "Today's Tasks"
3. **Tap on a task card to expand it**
4. Scroll down to see the complete Daily Job Target section
5. All 7 components should now be visible

---

## Conditional Display Logic

Each enhanced field has a conditional check:

| Field | Condition | Line |
|-------|-----------|------|
| Target Type | `task.dailyTarget.targetType` exists | 591 |
| Expected Output | Always shows | 599 |
| Area/Level | `task.dailyTarget.areaLevel` exists | 607 |
| Start Time | `task.dailyTarget.startTime` exists | 616 |
| Expected Finish | `task.dailyTarget.expectedFinish` exists | 623 |
| Progress Today | `task.dailyTarget.progressToday` exists | 634 |

If a field doesn't exist in the data, it won't be displayed (graceful degradation).

---

## Styles Used

All styles are defined at the bottom of TaskCard.tsx:

- `dailyJobTargetSection` - Container with green background
- `targetRow` - Row layout for label + value
- `targetLabel` - Left-aligned label text
- `targetValue` - Right-aligned value text
- `targetValueHighlight` - Highlighted value (for Expected Output)
- `progressTodaySection` - Progress subsection
- `progressBarContainer` - Progress bar container
- `progressBarFill` - Colored progress bar fill
- `progressPercentage` - Percentage text below bar

The section has a distinctive green background (`backgroundColor: '#E8F5E9'`) to make it stand out.
