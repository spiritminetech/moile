# Worker Check-In and Check-Out Button Functionality Explanation

## Overview
The Worker Manifest screen shows CHECK-IN and CHECK-OUT buttons for managing worker attendance during transport tasks. This document explains their purpose and functionality.

---

## 🔍 What Are These Buttons?

### ✅ CHECK-IN Button
**Purpose**: Mark a worker as present and on the vehicle at a pickup location

**When It Appears**:
- At PICKUP locations only
- For workers who are NOT yet checked in
- Before pickup completion

**What It Does**:
1. Records worker as present at pickup location
2. Captures GPS location and timestamp
3. Saves optional notes about the worker
4. Updates worker status to "checked in"
5. Updates backend database (FleetTaskPassengers collection)

**Example Use Case**:
```
Driver arrives at Pickup Location A
- Worker 1: John ☐ [✅ Check In] ← Click this
- Worker 2: Mary ☐ [✅ Check In]
- Worker 3: Bob ☐ [✅ Check In]

After clicking "Check In" for John:
- Worker 1: John ✅ (Checked in at 8:30 AM)
- Worker 2: Mary ☐ [✅ Check In]
- Worker 3: Bob ☐ [✅ Check In]
```

---

### ❌ CHECK-OUT Button
**Purpose**: Remove a worker from the vehicle if they were checked in by mistake

**When It Appears**:
- At PICKUP locations only
- For workers who ARE already checked in
- Before pickup completion
- **RARELY USED** - only for error correction

**What It Does**:
1. Reverses the check-in action
2. Marks worker as NOT present
3. Removes check-in timestamp
4. Updates backend database

**Example Use Case**:
```
Driver accidentally checked in wrong worker:
- Worker 1: John ✅ (Checked in at 8:30 AM) [❌ Check Out] ← Click to undo
- Worker 2: Mary ☐ [✅ Check In]
- Worker 3: Bob ☐ [✅ Check In]

After clicking "Check Out" for John:
- Worker 1: John ☐ [✅ Check In] ← Back to unchecked
- Worker 2: Mary ☐ [✅ Check In]
- Worker 3: Bob ☐ [✅ Check In]
```

---

## 🚫 Why These Buttons DON'T Appear at Dropoff

At DROPOFF locations, these buttons are NOT shown because:

1. **Workers are already on vehicle** - They were checked in at pickup
2. **No need to check in again** - They're already confirmed passengers
3. **Dropoff uses selection checkboxes** - Driver selects which workers to drop off
4. **Different workflow** - Dropoff is about delivery, not attendance

**Dropoff Flow**:
```
At Drop-off Location:
- Worker 1: John ☐ ← Click checkbox to select for dropoff
- Worker 2: Mary ☐ ← Click checkbox to select for dropoff
- Worker 3: Bob ☐ ← Click checkbox to select for dropoff

Then click: [✅ Complete Drop-off (2 Selected)]
```

---

## 📊 Complete Workflow Example

### Scenario: Transport 3 workers from Camp to Site A

#### Step 1: Start Route
```
Dashboard → Click "Start Route" button
Status: PLANNED → ONGOING
```

#### Step 2: Navigate to Pickup Location (Camp)
```
Navigation Screen → Click "📍 Select" for Camp location
Opens Worker Manifest Screen
```

#### Step 3: Check In Workers at Pickup
```
Worker Manifest Screen (Camp):
- Worker 1: John ☐ [✅ Check In] ← Click
- Worker 2: Mary ☐ [✅ Check In] ← Click
- Worker 3: Bob ☐ [✅ Check In] ← Skip (Bob is absent)

Result:
- Worker 1: John ✅ (Checked in at 8:30 AM)
- Worker 2: Mary ✅ (Checked in at 8:31 AM)
- Worker 3: Bob ☐ [✅ Check In]

Progress: 2/3 workers checked in
```

#### Step 4: Complete Pickup
```
Click: [✅ Complete Pickup (2 Checked In)]
- Takes photo (optional)
- Confirms pickup
- Status: ONGOING → PICKUP_COMPLETE
```

#### Step 5: Navigate Back to Pickup (After Completion)
```
Navigation Screen → Click "📍 Select" for Camp location
Opens Worker Manifest Screen (READ-ONLY)

✅ Pickup completed at this location
2 of 3 workers were checked in

- Worker 1: John ✅ (Read-only, no buttons)
- Worker 2: Mary ✅ (Read-only, no buttons)
- Worker 3: Bob ❌ (Missed, no buttons)

NO CHECK-IN/CHECK-OUT BUTTONS (Pickup already completed)
```

#### Step 6: Navigate to Dropoff Location (Site A)
```
Navigation Screen → Click "📍 Select" for Site A
Opens Worker Manifest Screen (Dropoff)

Drop-off - Site A
- Worker 1: John ☐ ← Checkbox for selection
- Worker 2: Mary ☐ ← Checkbox for selection

NO CHECK-IN/CHECK-OUT BUTTONS (Dropoff uses checkboxes)
```

#### Step 7: Select Workers for Dropoff
```
Click checkboxes:
- Worker 1: John ☑️ ← Selected
- Worker 2: Mary ☑️ ← Selected

Click: [✅ Complete Drop-off (2 Selected)]
- Takes photo (optional)
- Confirms dropoff
- Status: PICKUP_COMPLETE → COMPLETED
```

#### Step 8: Navigate Back to Dropoff (After Completion)
```
Navigation Screen → Click "📍 Select" for Site A
Opens Worker Manifest Screen (READ-ONLY)

✅ Drop-off completed at this location
2 workers were dropped off

- Worker 1: John ✅ (Read-only, no buttons)
- Worker 2: Mary ✅ (Read-only, no buttons)

NO CHECKBOXES, NO BUTTONS (Dropoff already completed)
```

---

## 🎯 Key Differences: Pickup vs Dropoff

| Feature | Pickup Location | Dropoff Location |
|---------|----------------|------------------|
| **Purpose** | Confirm worker attendance | Deliver workers to site |
| **Buttons** | ✅ Check In / ❌ Check Out | None (uses checkboxes) |
| **Selection** | Individual buttons | Checkbox selection |
| **Workflow** | Check in → Complete Pickup | Select workers → Complete Dropoff |
| **After Completion** | Read-only view (✅/❌) | Read-only view (✅) |
| **Can Undo?** | Yes (Check Out button) | No (after completion) |

---

## 🔧 Technical Details

### Database Updates

**Check-In Action**:
```javascript
// Updates FleetTaskPassengers collection
{
  fleetTaskId: 123,
  workerId: 456,
  pickupStatus: 'confirmed',  // ← Changed from 'pending'
  pickupConfirmedAt: '2024-02-12T08:30:00Z',
  pickupLocation: { lat: 12.34, lng: 56.78 },
  pickupNotes: 'Worker ready'
}
```

**Check-Out Action**:
```javascript
// Reverses the check-in
{
  fleetTaskId: 123,
  workerId: 456,
  pickupStatus: 'pending',  // ← Changed back to 'pending'
  pickupConfirmedAt: null,  // ← Cleared
  pickupLocation: null,
  pickupNotes: null
}
```

**Complete Pickup**:
```javascript
// Updates FleetTask status
{
  taskId: 123,
  status: 'PICKUP_COMPLETE',  // ← Changed from 'ONGOING'
  pickupCompletedAt: '2024-02-12T08:35:00Z'
}
```

**Complete Dropoff**:
```javascript
// Updates FleetTaskPassengers for selected workers
{
  fleetTaskId: 123,
  workerId: 456,
  dropoffStatus: 'confirmed',  // ← Changed from 'pending'
  dropoffConfirmedAt: '2024-02-12T09:00:00Z',
  dropoffLocation: { lat: 12.34, lng: 56.78 }
}

// Updates FleetTask status
{
  taskId: 123,
  status: 'COMPLETED',  // ← Changed from 'PICKUP_COMPLETE'
  dropoffCompletedAt: '2024-02-12T09:00:00Z'
}
```

---

## ❓ Common Questions

### Q: Why do we need Check-In buttons? Can't we just use checkboxes?
**A**: Check-In buttons provide:
- Individual worker confirmation with timestamp
- GPS location capture per worker
- Optional notes per worker
- Clear audit trail for attendance
- Ability to undo mistakes (Check-Out)

### Q: Why don't we have Check-In buttons at dropoff?
**A**: At dropoff:
- Workers are already confirmed (checked in at pickup)
- We just need to select which workers to drop
- Checkboxes are simpler for selection
- No need for individual timestamps (one dropoff time for all)

### Q: What if a worker is checked in by mistake?
**A**: Use the "❌ Check Out" button to undo the check-in BEFORE completing pickup.

### Q: Can I change check-ins after completing pickup?
**A**: No. After clicking "Complete Pickup", the screen becomes read-only. This prevents accidental changes and maintains data integrity.

### Q: What happens if I don't check in all workers?
**A**: You'll see a warning:
```
⚠️ Incomplete Check-in
1 worker(s) not checked in.
Checked in: 2/3
Continue with pickup?
[Cancel] [Continue Anyway]
```

---

## ✅ Summary

**CHECK-IN Button**:
- Used at PICKUP locations
- Confirms worker is present and on vehicle
- Records GPS, timestamp, and notes
- Can be undone with CHECK-OUT button

**CHECK-OUT Button**:
- Used at PICKUP locations (rarely)
- Reverses accidental check-ins
- Only available before pickup completion

**After Completion**:
- Both pickup and dropoff become READ-ONLY
- No buttons or checkboxes shown
- Shows ✅ (completed) or ❌ (missed) status
- Professional, clean interface

This design ensures:
- Clear attendance tracking
- Mistake correction capability
- Data integrity after completion
- Professional user experience
