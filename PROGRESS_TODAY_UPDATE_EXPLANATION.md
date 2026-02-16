# Progress Today - How It Updates

## Overview

The "Progress Today" section shows real-time progress of daily work completion. It updates when workers report completed units through the mobile app.

## Current State (Assignment 7035)

```
Progress Today:
Completed: 5 / 25 LED Lighting Installations
Progress: 20%
```

This means:
- **Target for today**: 25 LED lighting installations
- **Completed so far**: 5 installations
- **Progress percentage**: 20% (calculated as 5 ÷ 25 × 100)

---

## How Progress Changes

### Example Progression Throughout the Day

#### Morning (8:00 AM - Start)
```
Completed: 0 / 25 LED Lighting Installations
Progress: 0%
```
Worker starts the day, no units completed yet.

#### Mid-Morning (10:30 AM - After 2.5 hours)
```
Completed: 2 / 25 LED Lighting Installations
Progress: 8%
```
Worker completes 2 installations and updates progress.

#### Before Lunch (12:00 PM - After 4 hours)
```
Completed: 5 / 25 LED Lighting Installations
Progress: 20%
```
Worker completes 3 more installations (total 5).

#### Afternoon (3:00 PM - After 7 hours)
```
Completed: 10 / 25 LED Lighting Installations
Progress: 40%
```
Worker completes 5 more installations (total 10).

#### End of Day (5:00 PM - After 9 hours)
```
Completed: 25 / 25 LED Lighting Installations
Progress: 100%
✅ TASK COMPLETED!
```
Worker completes all remaining 15 installations.

---

## Update Mechanism

### Step-by-Step Process

1. **Worker Opens Task Card**
   - Taps on task in "Today's Tasks" screen
   - Card expands to show full details
   - Sees current progress

2. **Worker Taps "Update Progress" Button**
   - Button appears for tasks with status "in_progress"
   - Opens progress update form

3. **Worker Enters Completed Quantity**
   - Input field: "Units completed today"
   - Worker enters: "5"
   - Optionally adds notes about work done

4. **Backend Processes Update**
   ```javascript
   // Backend calculation
   const completed = 5;
   const total = 25;
   const percentage = Math.round((completed / total) * 100);
   // Result: 20%
   ```

5. **Database Updated**
   ```javascript
   {
     dailyTarget: {
       progressToday: {
         completed: 5,
         total: 25,
         percentage: 20
       }
     }
   }
   ```

6. **Mobile App Refreshes**
   - API returns updated data
   - UI re-renders with new values
   - Progress bar updates visually

---

## Progress Bar Color Logic

The progress bar changes color based on completion percentage:

### Red (0-49%) - Behind Schedule
```
Completed: 5 / 25 (20%)
[████░░░░░░░░░░░░░░░░] RED
```
Worker is behind the expected pace.

### Orange (50-74%) - On Track
```
Completed: 15 / 25 (60%)
[████████████░░░░░░░░] ORANGE
```
Worker is making good progress.

### Green (75-100%) - Ahead of Schedule
```
Completed: 20 / 25 (80%)
[████████████████░░░░] GREEN
```
Worker is ahead of schedule or nearly complete.

---

## Calculation Examples

### Example 1: Small Progress
```
Target: 25 units
Completed: 2 units
Percentage: (2 ÷ 25) × 100 = 8%
```

### Example 2: Half Complete
```
Target: 25 units
Completed: 12 units
Percentage: (12 ÷ 25) × 100 = 48%
```

### Example 3: Nearly Done
```
Target: 25 units
Completed: 23 units
Percentage: (23 ÷ 25) × 100 = 92%
```

### Example 4: Complete
```
Target: 25 units
Completed: 25 units
Percentage: (25 ÷ 25) × 100 = 100%
```

---

## API Endpoint

### Update Progress Request

**Endpoint:** `PUT /api/worker/tasks/{taskId}/progress`

**Request Body:**
```json
{
  "progressPercent": 20,
  "description": "Completed 5 LED installations in Tower A Level 2",
  "completedQuantity": 5,
  "location": {
    "latitude": 1.3521,
    "longitude": 103.8198,
    "timestamp": "2026-02-15T10:30:00Z"
  },
  "notes": "All installations tested and working",
  "issuesEncountered": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "progressId": 12345,
    "assignmentId": 7035,
    "progressPercent": 20,
    "submittedAt": "2026-02-15T10:30:15Z",
    "status": "in_progress",
    "nextAction": "Continue work",
    "taskStatus": "in_progress",
    "previousProgress": 8,
    "progressDelta": 12
  },
  "message": "Progress updated successfully"
}
```

---

## Database Schema

### WorkerTaskAssignment Model

```javascript
{
  id: 7035,
  employeeId: 2,
  taskId: 1001,
  date: "2026-02-15",
  status: "in_progress",
  dailyTarget: {
    description: "Install LED lighting fixtures",
    quantity: 25,
    unit: "LED Lighting Installations",
    targetCompletion: 100,
    targetType: "Quantity Based",
    areaLevel: "Tower A – Level 2",
    startTime: "08:00 AM",
    expectedFinish: "05:00 PM",
    progressToday: {
      completed: 5,      // ← Updates when worker reports progress
      total: 25,         // ← Fixed daily target
      percentage: 20     // ← Calculated: (5/25) × 100
    }
  }
}
```

---

## Mobile App UI Code

### Progress Display (TaskCard.tsx - Lines 634-677)

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

---

## Testing the Update

### Run Demo Script

```bash
cd backend
node update-progress-today-demo.js
```

This script:
1. Shows current progress state
2. Demonstrates 4 scenarios (2, 5, 10, 25 units)
3. Updates database to Scenario 2 (5 units, 20%)
4. Verifies the update

### Verify in Mobile App

1. Rebuild the mobile app:
   ```bash
   cd ConstructionERPMobile
   npx expo start --clear
   ```

2. Log in with `worker@gmail.com` / `password123`

3. Navigate to "Today's Tasks"

4. Tap on "LED Lighting Installation" task to expand

5. Scroll to "🎯 DAILY JOB TARGET" section

6. You should now see:
   ```
   Progress Today:
   Completed: 5 / 25 LED Lighting Installations
   Progress: 20%
   ```

---

## Real-World Usage

### Supervisor's Perspective

Supervisors can monitor progress in real-time:
- See which workers are on track
- Identify workers who need help
- Reallocate resources if needed

### Worker's Perspective

Workers update progress throughout the day:
- After completing each batch of work
- Before lunch break
- At end of day

### Benefits

1. **Real-time visibility**: Supervisors see progress instantly
2. **Accountability**: Workers track their own output
3. **Planning**: Helps estimate completion time
4. **Performance tracking**: Historical data for productivity analysis

---

## Summary

The "Progress Today" feature:
- Shows completed units vs. daily target
- Calculates percentage automatically
- Updates when worker reports progress
- Uses color-coded progress bar
- Provides real-time visibility to supervisors

**Current database state**: 5 / 25 units completed (20%)

To see this in the mobile app, rebuild it with `npx expo start --clear`.
