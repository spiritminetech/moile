# How to Update Daily Job Targets - Navigation Guide

**Date**: February 7, 2026  
**Feature**: Update Daily Job Targets  
**User Role**: Supervisor

---

## 📱 Step-by-Step Navigation

### Method 1: Via Task Management Screen (Primary Method)

#### Step 1: Login as Supervisor
- Open the Construction ERP Mobile App
- Login with supervisor credentials
- You'll land on the Supervisor Dashboard

#### Step 2: Navigate to Task Management
**Option A - From Dashboard:**
- Tap on "Task Management" card on the dashboard

**Option B - From Bottom Navigation:**
- Tap the "Tasks" tab in the bottom navigation bar

#### Step 3: View Active Task Assignments
- You'll see the "Task Management" screen
- Scroll down to the "Active Task Assignments" section
- You'll see a list of all active task assignments with:
  - Task name
  - Worker name
  - Status badge
  - Priority badge
  - Current daily target (if set)
  - Time estimate

#### Step 4: Update Daily Target
- Find the task assignment you want to update
- Tap the **"Update"** button on the task card
- A modal will open: "Update Task Assignment"

#### Step 5: Edit Daily Target Fields
In the update modal, you'll see:

**Daily Target Section:**
```
Daily Target:
┌─────────────┬─────────────┐
│  Quantity   │    Unit     │
│   [  50  ]  │  [panels]   │
└─────────────┴─────────────┘
```

**Fields to Edit:**
1. **Quantity** (numeric input)
   - Enter the target quantity (e.g., 50, 100, 25)
   - Example: 50 panels, 100 meters, 25 items

2. **Unit** (text input)
   - Enter the unit of measurement
   - Examples: "panels", "meters", "items", "sq ft", "pieces"

**Other Editable Fields in Same Modal:**
- Work Area (e.g., "Zone A", "Building 1")
- Floor (e.g., "Floor 3", "Ground Floor")
- Zone (e.g., "North Wing", "Section B")
- Priority (LOW, MEDIUM, HIGH)
- Time Estimate (Hours and Minutes)

#### Step 6: Save Changes
- After editing the daily target fields
- Tap the **"Update"** button at the bottom of the modal
- You'll see a success message
- The task list will refresh automatically
- The updated daily target will be visible on the task card

---

## 🎯 Visual Location of Daily Target

### On Task Card (Before Update):
```
┌─────────────────────────────────────────┐
│ Install Ceiling Panels                  │
│ Worker: John Doe                        │
│                                         │
│ Sequence: #1                            │
│ Area: Zone A                            │
│ Floor: Floor 3                          │
│                                         │
│ Estimated: 8h 0m                        │
│ Target: 50 panels  ← CURRENT TARGET     │
│                                         │
│ [Update] [Remove]                       │
└─────────────────────────────────────────┘
```

### In Update Modal:
```
┌─────────────────────────────────────────┐
│     Update Task Assignment              │
│                                         │
│ Install Ceiling Panels - John Doe      │
│                                         │
│ Work Area:                              │
│ [Zone A                              ]  │
│                                         │
│ Floor:                                  │
│ [Floor 3                             ]  │
│                                         │
│ Zone:                                   │
│ [North Wing                          ]  │
│                                         │
│ Priority:                               │
│ [LOW] [MEDIUM] [HIGH]                   │
│                                         │
│ Time Estimate:                          │
│ [8]h [0]m                               │
│                                         │
│ Daily Target:  ← UPDATE HERE            │
│ ┌──────────┬──────────┐                │
│ │   [50]   │ [panels] │                │
│ └──────────┴──────────┘                │
│                                         │
│ [Cancel]          [Update]              │
└─────────────────────────────────────────┘
```

---

## 📊 What You Can Update

### Daily Target Structure:
```typescript
{
  quantity: number,    // e.g., 50
  unit: string        // e.g., "panels"
}
```

### Common Examples:

| Task Type | Quantity | Unit |
|-----------|----------|------|
| Install Ceiling Panels | 50 | panels |
| Lay Concrete | 100 | sq meters |
| Install Electrical Outlets | 25 | outlets |
| Paint Walls | 200 | sq ft |
| Install Pipes | 150 | meters |
| Brick Laying | 500 | bricks |
| Welding | 30 | joints |
| Excavation | 75 | cubic meters |

---

## 🔄 Alternative Method: Via EnhancedTaskManagementScreen

If your app uses the alternative task management screen:

### Navigation:
1. Login as Supervisor
2. Go to Task Management
3. Select a project from the project selector at the top
4. View "Active Task Assignments" section
5. Tap "Update" on any task card
6. Edit the "Daily Target" fields (Quantity and Unit)
7. Tap "Update" to save

---

## 💡 Tips & Best Practices

### Setting Realistic Targets:
- ✅ Base targets on worker skill level
- ✅ Consider task complexity
- ✅ Account for site conditions
- ✅ Review historical completion rates
- ✅ Adjust based on weather/conditions

### Common Units to Use:
- **Area**: sq meters, sq ft, acres
- **Length**: meters, feet, kilometers
- **Volume**: cubic meters, cubic feet, liters
- **Count**: pieces, items, units, panels
- **Weight**: kg, tons, pounds
- **Time-based**: hours, days

### When to Update Targets:
- ✅ At the start of each day
- ✅ When site conditions change
- ✅ When worker assignments change
- ✅ After reviewing previous day's progress
- ✅ When project priorities shift

---

## 🔍 Verification

### After Updating, Verify:
1. **On Task Card**: Check that the new target is displayed
   - Look for: "Target: [quantity] [unit]"

2. **Worker Can See It**: The worker will see the updated target in their mobile app
   - Workers see it in "Today's Tasks" screen
   - Shows as "Daily Target: [quantity] [unit]"

3. **Progress Tracking**: Target is used for progress calculation
   - Progress % = (Completed / Target) × 100

---

## 🚨 Troubleshooting

### Issue: "Update" button not visible
**Solution**: 
- Make sure you're logged in as a Supervisor
- Check that the task status is not "completed"
- Only "queued" and "in_progress" tasks can be updated

### Issue: Changes not saving
**Solution**:
- Check your internet connection
- Ensure both Quantity and Unit fields are filled
- Quantity must be a positive number
- Try refreshing the screen (pull down to refresh)

### Issue: Daily target not showing on task card
**Solution**:
- The target only shows if both quantity and unit are set
- Pull down to refresh the task list
- Check if the task was recently created (may need migration)

---

## 📱 Screen Names in Code

For developers or testers:

**Primary Screen**: `EnhancedTaskManagementScreen.tsx`
- Location: `ConstructionERPMobile/src/screens/supervisor/`
- Component: Task Management
- Modal: Update Task Assignment Modal

**Alternative Screen**: `TaskAssignmentScreen.tsx`
- Location: `ConstructionERPMobile/src/screens/supervisor/`
- Component: Task Assignment
- Note: May have different UI but same functionality

**API Endpoint**: 
- `PUT /api/supervisor/daily-targets`
- Service: `SupervisorApiService.updateDailyTargets()`

---

## 📸 Quick Visual Guide

```
Supervisor Dashboard
        ↓
   [Task Management]
        ↓
Active Task Assignments
        ↓
   [Update Button]
        ↓
Update Task Assignment Modal
        ↓
   Daily Target Section
   ┌──────────┬──────────┐
   │ Quantity │   Unit   │
   │  [Edit]  │  [Edit]  │
   └──────────┴──────────┘
        ↓
   [Update Button]
        ↓
   ✅ Target Updated!
```

---

## ✅ Summary

**To update daily job targets:**
1. Go to Task Management screen
2. Find the task in "Active Task Assignments"
3. Tap "Update" button
4. Edit "Quantity" and "Unit" in Daily Target section
5. Tap "Update" to save
6. Verify the new target appears on the task card

**That's it!** The daily target is now updated and visible to both supervisor and worker.

---

**Last Updated**: February 7, 2026  
**Version**: 1.0  
**Tested**: ✅ Verified Working
