# Worker Update Progress - Step-by-Step Guide

## What Worker Needs to Do in Today's Tasks Screen

### Current Progress Display
```
Progress Today:
Completed: 5 / 25 LED Lighting Installations
Progress: 20%
```

---

## Step-by-Step Instructions

### Step 1: Open Today's Tasks Screen
1. Worker logs into the mobile app
2. Taps on "Today's Tasks" from the bottom navigation
3. Sees list of assigned tasks for the day

### Step 2: Find the Task Card
Worker sees task cards in collapsed view:
```
┌─────────────────────────────────────────┐
│ LED Lighting Installation          [▼] │
│ 🔴 High Priority              #2        │
│ 📋 Project: Project 1003 - Tower A     │
│                                         │
│ [▶️ Start Task]  [🗺️ View on Map]     │
└─────────────────────────────────────────┘
```

### Step 3: Expand the Task Card
**Action:** Tap anywhere on the task card

The card expands to show full details including:
- Project information
- Work location
- Supervisor contact
- Nature of work
- Supervisor instructions
- **🎯 DAILY JOB TARGET** (with current progress)

### Step 4: Locate the Update Progress Button

For tasks with status "in_progress", worker will see:

```
┌─────────────────────────────────────────┐
│ 🎯 DAILY JOB TARGET                     │
│ ──────────────────────────────────────  │
│ Target Type:        Quantity Based      │
│ Expected Output:    25 LED Lighting     │
│                     Installations       │
│ Area/Level:         Tower A – Level 2   │
│ Start Time:         08:00 AM            │
│ Expected Finish:    05:00 PM            │
│                                         │
│ Progress Today:                         │
│ Completed: 5 / 25 LED Lighting          │
│            Installations                │
│ [████░░░░░░░░░░░░░░░░]                 │
│ Progress: 20%                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ [📊 Update Progress]  [🗺️ View on Map] │
└─────────────────────────────────────────┘
```

**Action:** Tap the "📊 Update Progress" button

### Step 5: Progress Update Screen Opens

Worker is taken to the **Task Progress Screen** with:

```
┌─────────────────────────────────────────┐
│ ← Update Task Progress                  │
├─────────────────────────────────────────┤
│                                         │
│ Task: LED Lighting Installation         │
│ Current Progress: 20%                   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Progress Percentage                 │ │
│ │                                     │ │
│ │ 0%  ●────────────────────  100%    │ │
│ │         [Slider at 20%]            │ │
│ │                                     │ │
│ │ Current: 20%                        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Completed Quantity                  │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ 5                               │ │ │
│ │ └─────────────────────────────────┘ │ │
│ │ Units completed today               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Work Description                    │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ Completed 5 LED installations   │ │ │
│ │ │ in Tower A Level 2              │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Additional Notes (Optional)         │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ All installations tested and    │ │ │
│ │ │ working properly                │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📍 GPS Location: Enabled ✓              │
│ Accuracy: 5 meters                      │
│                                         │
│ [Submit Progress Update]                │
│                                         │
└─────────────────────────────────────────┘
```

### Step 6: Update the Progress

Worker has two options:

#### Option A: Use Slider
1. Drag the slider to new percentage (e.g., 40%)
2. The percentage updates in real-time

#### Option B: Enter Completed Quantity
1. Tap on "Completed Quantity" field
2. Enter number of units completed (e.g., "10")
3. System calculates: (10 ÷ 25) × 100 = 40%

### Step 7: Add Description (Required)
1. Tap on "Work Description" field
2. Enter what was completed:
   ```
   Completed 10 LED installations in Tower A Level 2.
   Tested all connections.
   ```

### Step 8: Add Notes (Optional)
1. Tap on "Additional Notes" field
2. Add any extra information:
   ```
   All installations tested and working properly.
   No issues encountered.
   ```

### Step 9: Verify GPS Location
The screen shows:
```
📍 GPS Location: Enabled ✓
Accuracy: 5 meters
```

If GPS is not enabled:
```
📍 GPS Location: Disabled ✗
Please enable location services
```

Worker must enable GPS before submitting.

### Step 10: Submit Progress Update
**Action:** Tap "Submit Progress Update" button

System:
1. Validates all fields
2. Checks GPS location
3. Sends update to backend
4. Shows success message
5. Returns to Today's Tasks screen

### Step 11: Verify Updated Progress

Back in Today's Tasks screen, worker expands the task card again and sees:

```
Progress Today:
Completed: 10 / 25 LED Lighting Installations
[████████░░░░░░░░░░░░]
Progress: 40%
```

The progress bar color changes:
- **Red (0-49%)**: Behind schedule
- **Orange (50-74%)**: On track  
- **Green (75-100%)**: Ahead of schedule

---

## Button Visibility Rules

### When "Update Progress" Button Appears

The "📊 Update Progress" button ONLY appears when:

1. ✅ Task status is "in_progress"
2. ✅ Worker is online (not in offline mode)
3. ✅ Task card is expanded

### When "Start Task" Button Appears

The "▶️ Start Task" button appears when:

1. ✅ Task status is "pending"
2. ✅ All dependencies are completed
3. ✅ Worker is inside geofence (if required)

### Button States

```
Task Status: pending
└─ [▶️ Start Task]

Task Status: in_progress
└─ [📊 Update Progress]

Task Status: completed
└─ [✓ Completed] (disabled, green)
```

---

## Real-World Example

### Morning (8:00 AM)
Worker starts the day:
```
Progress: 0 / 25 (0%)
Action: Tap [▶️ Start Task]
```

### Mid-Morning (10:30 AM)
After completing 2 installations:
```
1. Tap task card to expand
2. Tap [📊 Update Progress]
3. Enter: Completed Quantity = 2
4. Enter: Description = "Completed 2 LED installations"
5. Tap [Submit Progress Update]
Result: Progress: 2 / 25 (8%)
```

### Before Lunch (12:00 PM)
After completing 3 more (total 5):
```
1. Tap task card to expand
2. Tap [📊 Update Progress]
3. Enter: Completed Quantity = 5
4. Enter: Description = "Completed 5 LED installations"
5. Tap [Submit Progress Update]
Result: Progress: 5 / 25 (20%)
```

### Afternoon (3:00 PM)
After completing 5 more (total 10):
```
1. Tap task card to expand
2. Tap [📊 Update Progress]
3. Enter: Completed Quantity = 10
4. Enter: Description = "Completed 10 LED installations"
5. Tap [Submit Progress Update]
Result: Progress: 10 / 25 (40%)
```

### End of Day (5:00 PM)
After completing all 25:
```
1. Tap task card to expand
2. Tap [📊 Update Progress]
3. Enter: Completed Quantity = 25
4. Enter: Description = "Completed all 25 LED installations"
5. Tap [Submit Progress Update]
Result: Progress: 25 / 25 (100%) ✅
```

---

## Important Notes

### GPS Requirement
- Worker MUST have GPS enabled
- Location accuracy must be reasonable (< 50 meters)
- System validates worker is at correct site

### Offline Mode
- If worker is offline, "Update Progress" button is disabled
- Worker sees message: "Cannot update progress while offline"
- Must connect to internet to submit updates

### Progress Validation
- Cannot decrease progress (only increase)
- Cannot exceed 100%
- Must provide description of work done

### Supervisor Visibility
- Supervisor sees progress updates in real-time
- Can monitor which workers are on track
- Can identify workers who need assistance

---

## Summary

**What worker needs to do:**

1. Open "Today's Tasks" screen
2. Tap on task card to expand it
3. Tap "📊 Update Progress" button
4. Enter completed quantity or adjust slider
5. Enter work description
6. (Optional) Add notes
7. Ensure GPS is enabled
8. Tap "Submit Progress Update"
9. Verify updated progress in task card

**Result:** Progress Today updates from 5/25 (20%) to 10/25 (40%)

The process takes about 30-60 seconds and provides real-time visibility to supervisors.
