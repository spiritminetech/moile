# Attendance Monitoring Display Test Data Guide

**Purpose**: Create comprehensive test data to verify all new attendance monitoring features are displaying correctly in the mobile app.

---

## Quick Start

### 1. Run the Test Data Script

```bash
cd backend
node test-attendance-monitoring-display.js
```

### 2. What This Creates

The script creates **6 different attendance scenarios** for today's date:

| Scenario | Check-in | Lunch | Check-out | Regular Hrs | OT Hrs | Status | Absence Reason |
|----------|----------|-------|-----------|-------------|--------|--------|----------------|
| **Worker 1** | 7:00 AM | 12:00-1:00 PM | 5:00 PM | 9h | 0h | CHECKED_OUT | - |
| **Worker 2** | 7:00 AM | 12:00-1:00 PM | 8:00 PM | 9h | 3h | CHECKED_OUT | - |
| **Worker 3** | 9:00 AM (Late) | 12:30-1:30 PM | Still working | 0h | 0h | CHECKED_IN | - |
| **Worker 4** | Absent | - | - | 0h | 0h | ABSENT | LEAVE_APPROVED |
| **Worker 5** | Absent | - | - | 0h | 0h | ABSENT | UNAUTHORIZED |
| **Worker 6** | 7:30 AM | Started 12:00 PM | Still working | 0h | 0h | CHECKED_IN | - |

---

## What to Verify in Mobile App

### Step 1: Open Attendance Monitoring Screen

1. Login as supervisor
2. Navigate to **Attendance Monitoring**
3. You should see 6 worker cards

### Step 2: Verify Display Elements

#### ✅ Worker 1 - Complete Day with Lunch
- Check-in: 7:00 AM
- **Lunch Start: 12:00 PM** ⭐
- **Lunch End: 1:00 PM** ⭐
- **Lunch Duration: 1h 0m** ⭐
- **Regular Hours: 9h 0m (green)** ⭐
- Total Hours: 9h 0m
- Check-out: 5:00 PM

#### ✅ Worker 2 - With Overtime
- Check-in: 7:00 AM
- **Lunch Start: 12:00 PM** ⭐
- **Lunch End: 1:00 PM** ⭐
- **Lunch Duration: 1h 0m** ⭐
- **Regular Hours: 9h 0m (green)** ⭐
- **OT Hours: 3h 0m (orange, bold)** ⭐
- Total Hours: 12h 0m
- Check-out: 8:00 PM

#### ✅ Worker 3 - Late Arrival
- Check-in: 9:00 AM
- **Late by: 120 minutes (warning color)** ⭐
- **Lunch Start: 12:30 PM** ⭐
- **Lunch End: 1:30 PM** ⭐
- Status: CHECKED_IN (still working)
- **Issues section should show "LATE ARRIVAL"** ⭐
- **"Escalate" button should appear** ⭐

#### ✅ Worker 4 - Approved Leave
- Status: ABSENT
- **Absence Reason Badge: "LEAVE APPROVED" (green)** ⭐
- **Notes: "Medical appointment - approved by supervisor"** ⭐
- **"Mark Reason" button should appear** ⭐

#### ✅ Worker 5 - Unauthorized Absence
- Status: ABSENT
- **Absence Reason Badge: "UNAUTHORIZED" (red)** ⭐
- **Notes: "No prior notice given"** ⭐
- **"Mark Reason" button should appear** ⭐
- **"Escalate" button should appear** ⭐

#### ✅ Worker 6 - Currently on Lunch
- Check-in: 7:30 AM
- **Lunch Start: 12:00 PM** ⭐
- Lunch End: -- (still on lunch)
- Status: CHECKED_IN

---

## Test Modal Interactions

### Test 1: Mark Absence Reason Modal

1. Find Worker 4 or Worker 5 (ABSENT status)
2. Click **"Mark Reason"** button
3. Verify modal opens with:
   - Title: "Mark Absence Reason"
   - Worker name displayed
   - 4 reason buttons: LEAVE_APPROVED, LEAVE_NOT_INFORMED, MEDICAL, UNAUTHORIZED
   - Notes input field
   - Cancel and Save buttons
4. Select a reason (button should highlight)
5. Add notes
6. Click Save
7. Verify success message

### Test 2: Escalation Modal

1. Find Worker 3 (late) or Worker 5 (unauthorized absence)
2. Click **"Escalate"** button
3. Verify modal opens with:
   - Title: "Create Escalation"
   - Worker name displayed
   - Escalation Type selector (4 options)
   - Severity selector (LOW, MEDIUM, HIGH, CRITICAL) with color-coded borders
   - Escalate To selector (ADMIN, MANAGER, HR)
   - Description input field
   - Notes input field
   - Cancel and Escalate buttons
4. Select options
5. Add description
6. Click Escalate
7. Verify success message

### Test 3: Export Report

1. Click **"Export Report"** button at bottom
2. Verify alert shows format options:
   - JSON
   - CSV
   - Cancel
3. Select JSON
4. Verify report summary alert displays:
   - Project name
   - Date
   - Total workers
   - Present count
   - Absent count
   - Total hours
   - OT hours

---

## Visual Verification Checklist

### Colors
- [ ] Regular hours displayed in **green**
- [ ] OT hours displayed in **orange/warning color**
- [ ] OT hours text is **bold**
- [ ] "LEAVE_APPROVED" badge is **green**
- [ ] Other absence reasons are **red**
- [ ] Absence section has **light orange background**
- [ ] Late arrival shows **warning color**

### Layout
- [ ] Lunch times appear in time information section
- [ ] Regular hours appear before OT hours
- [ ] OT hours only show when > 0
- [ ] Absence badge appears after task assignment
- [ ] Action buttons appear at bottom of card
- [ ] "Mark Reason" only shows for ABSENT workers
- [ ] "Escalate" shows for workers with issues

### Conditional Display
- [ ] Lunch info only shows when both start and end times exist
- [ ] OT hours only show when > 0
- [ ] Absence badge only shows when reason is not "PRESENT"
- [ ] Action buttons only show when applicable

---

## Troubleshooting

### No Workers Showing
- Ensure you have a test project in the database
- Ensure you have employees linked to that project
- Check the script output for errors

### Fields Not Displaying
- Rebuild the mobile app: `npm start` then press `r`
- Clear app cache
- Check that backend is running
- Verify API is returning new fields

### Modals Not Opening
- Check console for errors
- Verify state variables are initialized
- Check that button onPress handlers are connected

### Colors Not Showing
- Verify ConstructionTheme is imported
- Check that style objects reference theme colors
- Ensure styles are applied to Text components

---

## Expected Script Output

```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Found 6 employees for project: Test Project
🗑️  Cleared existing attendance records for today

📝 Creating attendance records...

✅ Worker with Lunch & Regular Hours
   Employee: John Doe
   Status: CHECKED_OUT
   Check-in: 7:00:00 AM
   Lunch Start: 12:00:00 PM
   Lunch End: 1:00:00 PM
   Check-out: 5:00:00 PM
   Regular Hours: 9h

✅ Worker with OT Hours
   Employee: Jane Smith
   Status: CHECKED_OUT
   Check-in: 7:00:00 AM
   Lunch Start: 12:00:00 PM
   Lunch End: 1:00:00 PM
   Check-out: 8:00:00 PM
   Regular Hours: 9h
   OT Hours: 3h

... (more workers)

✅ Test data created successfully!

📱 Now you can:
1. Open the mobile app
2. Login as supervisor
3. Navigate to Attendance Monitoring
4. Verify all new fields are displaying
```

---

## Clean Up

To remove test data and start fresh:

```bash
# The script automatically clears today's attendance before creating new data
# Just run it again to reset
node test-attendance-monitoring-display.js
```

---

## Next Steps After Verification

1. ✅ Verify all fields display correctly
2. ✅ Test all modal interactions
3. ✅ Test export functionality
4. ✅ Verify color coding
5. ✅ Test with real data
6. ✅ Test on both iOS and Android
7. ✅ Test with different screen sizes

---

## Summary

This test data script creates a comprehensive set of attendance records that showcase **all 5 new features**:

1. ✅ **Lunch Break Tracking** - Multiple workers with lunch times
2. ✅ **Regular Hours Display** - Shown in green
3. ✅ **OT Hours Display** - Shown in orange/bold
4. ✅ **Absence Reason Management** - Two workers with different reasons
5. ✅ **Escalation Workflow** - Workers with issues to escalate

Run the script, open the app, and verify everything displays as expected!
