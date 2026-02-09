# Manual Attendance Request - Navigation & UI Guide

## Date: February 7, 2026

---

## 📱 How to Access Manual Attendance Request UI

### Navigation Path

```
Supervisor Login
    ↓
Bottom Tab Navigation: "Team" Tab (👥)
    ↓
Team Management Screen
    ↓
Navigate to: "Attendance Monitoring"
    ↓
Attendance Monitoring Screen
    ↓
[Pending Corrections Alert Card appears when requests exist]
    ↓
Click: "Review Corrections" Button
    ↓
Manual Attendance Request Modal Opens
```

---

## Step-by-Step Navigation Instructions

### Step 1: Login as Supervisor
1. Open the Construction ERP Mobile app
2. Login with supervisor credentials
3. You'll be directed to the Supervisor Dashboard

### Step 2: Navigate to Team Tab
1. Look at the bottom tab bar
2. Tap on the **"Team"** tab (👥 icon)
3. This opens the Team Management screen

### Step 3: Access Attendance Monitoring
1. From Team Management screen
2. Navigate to **"Attendance Monitoring"** screen
   - This can be accessed via a button/link on Team Management
   - Or directly if it's in the navigation stack

### Step 4: View Pending Corrections Alert
When there are pending manual attendance requests, you'll see:

```
┌─────────────────────────────────────────┐
│  ⚠️  Pending Corrections                │
│                                         │
│  X attendance correction(s) awaiting    │
│  approval                               │
│                                         │
│  [Review Corrections]                   │
└─────────────────────────────────────────┘
```

- **Alert Card**: Yellow/warning styled card
- **Location**: Near the top of Attendance Monitoring screen
- **Visibility**: Only appears when `pendingCorrections.length > 0`

### Step 5: Open Manual Attendance Request Modal
1. Click the **"Review Corrections"** button
2. The Manual Attendance Request modal will open

---

## 🎯 Manual Attendance Request Modal UI

### Modal Layout

```
┌─────────────────────────────────────────────────┐
│                                                 │
│     Attendance Correction Request               │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Worker:           [Worker Name]                │
│  Request Type:     [CHECK IN / CHECK OUT /      │
│                     LUNCH START / LUNCH END]    │
│  Original Time:    [HH:MM AM/PM]                │
│  Requested Time:   [HH:MM AM/PM]                │
│  Reason:           [Worker's explanation]       │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Add notes (optional)...                   │ │
│  │                                           │ │
│  │                                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│   [  Reject  ]          [  Approve  ]          │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│              [  Cancel  ]                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📋 Modal Components Breakdown

### 1. Header Section
```typescript
<Text style={styles.modalTitle}>
  Attendance Correction Request
</Text>
```
- **Purpose**: Identifies the modal purpose
- **Style**: Bold, centered, headline text

### 2. Correction Details Section
Displays all request information:

```typescript
// Worker Name
Worker: John Doe

// Request Type (4 possible types)
Request Type: CHECK IN
- check_in
- check_out  
- lunch_start
- lunch_end

// Time Comparison
Original Time: 08:30 AM
Requested Time: 08:00 AM

// Worker's Reason
Reason: Traffic delay due to road construction
```

### 3. Supervisor Notes Input
```typescript
<TextInput
  style={styles.notesInput}
  placeholder="Add notes (optional)..."
  value={correctionNotes}
  onChangeText={setCorrectionNotes}
  multiline
  numberOfLines={3}
/>
```
- **Purpose**: Supervisor can add comments/notes
- **Optional**: Not required for approval/rejection
- **Multiline**: Supports longer explanations

### 4. Action Buttons

#### Reject Button (Red)
```typescript
<ConstructionButton
  title="Reject"
  variant="error"
  size="medium"
  onPress={() => handleCorrectionDecision(selectedCorrection, 'reject', correctionNotes)}
/>
```
- **Color**: Red (error variant)
- **Action**: Rejects the correction request
- **Result**: Worker's original time remains unchanged

#### Approve Button (Green)
```typescript
<ConstructionButton
  title="Approve"
  variant="success"
  size="medium"
  onPress={() => handleCorrectionDecision(selectedCorrection, 'approve', correctionNotes)}
/>
```
- **Color**: Green (success variant)
- **Action**: Approves the correction request
- **Result**: Attendance record updated to requested time

#### Cancel Button (Gray)
```typescript
<ConstructionButton
  title="Cancel"
  variant="secondary"
  size="medium"
  onPress={() => {
    setShowCorrectionModal(false);
    setSelectedCorrection(null);
    setCorrectionNotes('');
  }}
/>
```
- **Color**: Gray (secondary variant)
- **Action**: Closes modal without action
- **Result**: No changes made

---

## 🔄 Workflow Process

### Complete Approval Workflow

```
Worker submits manual attendance request
    ↓
Request stored in database as "pending"
    ↓
Supervisor logs in
    ↓
Navigates to Attendance Monitoring
    ↓
Sees "Pending Corrections" alert card
    ↓
Clicks "Review Corrections"
    ↓
Modal opens with first pending request
    ↓
Supervisor reviews details
    ↓
Supervisor adds notes (optional)
    ↓
Supervisor clicks "Approve" or "Reject"
    ↓
API call: POST /supervisor/approve-attendance-correction
    ↓
Success alert shown
    ↓
Modal closes
    ↓
Pending corrections list refreshed
    ↓
If more requests exist, alert card updates count
```

---

## 🔧 Technical Implementation

### State Management

```typescript
// Modal visibility state
const [showCorrectionModal, setShowCorrectionModal] = useState(false);

// Currently selected correction
const [selectedCorrection, setSelectedCorrection] = useState<AttendanceCorrection | null>(null);

// Supervisor's notes
const [correctionNotes, setCorrectionNotes] = useState('');

// List of pending corrections
const [pendingCorrections, setPendingCorrections] = useState<AttendanceCorrection[]>([]);
```

### Opening the Modal

```typescript
// When "Review Corrections" button is clicked
<ConstructionButton
  title="Review Corrections"
  variant="warning"
  size="small"
  onPress={() => {
    if (pendingCorrections.length > 0) {
      setSelectedCorrection(pendingCorrections[0]); // Show first request
      setShowCorrectionModal(true); // Open modal
    }
  }}
/>
```

### Handling Approval/Rejection

```typescript
const handleCorrectionDecision = async (
  correction: AttendanceCorrection,
  action: 'approve' | 'reject',
  notes: string
) => {
  try {
    const response = await supervisorApiService.approveAttendanceCorrection(
      correction.correctionId,
      {
        action,
        notes,
        correctedTime: action === 'approve' ? correction.requestedTime : undefined,
      }
    );

    if (response.success) {
      Alert.alert(
        'Success',
        `Attendance correction ${action}d successfully`
      );
      loadPendingCorrections(); // Refresh list
      setShowCorrectionModal(false); // Close modal
      setSelectedCorrection(null); // Clear selection
      setCorrectionNotes(''); // Clear notes
    } else {
      Alert.alert('Error', response.message || `Failed to ${action} correction`);
    }
  } catch (error) {
    handleApiError(error, 'Process Correction');
  }
};
```

---

## 📊 Data Structure

### AttendanceCorrection Interface

```typescript
interface AttendanceCorrection {
  correctionId: number;           // Unique ID for the request
  workerId: number;                // Worker's employee ID
  workerName: string;              // Worker's full name
  requestType: 'check_in' | 'check_out' | 'lunch_start' | 'lunch_end';
  originalTime: string;            // Current recorded time (ISO format)
  requestedTime: string;           // Worker's requested time (ISO format)
  reason: string;                  // Worker's explanation
  requestedAt: string;             // When request was submitted
  status: 'pending' | 'approved' | 'rejected';
}
```

### Example Data

```json
{
  "correctionId": 123,
  "workerId": 107,
  "workerName": "John Doe",
  "requestType": "check_in",
  "originalTime": "2026-02-07T08:30:00Z",
  "requestedTime": "2026-02-07T08:00:00Z",
  "reason": "Traffic delay due to road construction on Main Street",
  "requestedAt": "2026-02-07T09:15:00Z",
  "status": "pending"
}
```

---

## 🎨 Visual Indicators

### Alert Card Styling
- **Background**: Light yellow/warning color
- **Border**: Warning color border
- **Icon**: ⚠️ Warning icon
- **Text**: Bold count of pending requests

### Modal Styling
- **Overlay**: Semi-transparent dark background (rgba(0, 0, 0, 0.5))
- **Content**: White card with rounded corners
- **Shadow**: Large elevation shadow
- **Width**: Full width with padding, max 400px

### Button Colors
- **Reject**: Red (#D32F2F) - Error variant
- **Approve**: Green (#388E3C) - Success variant
- **Cancel**: Gray (#757575) - Secondary variant

---

## 🔔 Notifications & Feedback

### Success Message
```typescript
Alert.alert(
  'Success',
  'Attendance correction approved successfully'
);
```

### Error Message
```typescript
Alert.alert(
  'Error',
  'Failed to approve correction. Please try again.'
);
```

### Loading State
- Modal shows loading indicator during API call
- Buttons disabled during processing
- Prevents duplicate submissions

---

## 📱 User Experience Features

### 1. Auto-Refresh
- Pending corrections loaded on screen mount
- Refreshed after each approval/rejection
- Updates alert card count automatically

### 2. Multiple Requests Handling
- Shows first pending request when modal opens
- After processing, next request can be reviewed
- Alert card updates count in real-time

### 3. Keyboard Handling
- Notes input supports multiline text
- Keyboard dismisses when modal closes
- Proper text input focus management

### 4. Accessibility
- Large touch targets for buttons
- Clear visual hierarchy
- High contrast colors
- Readable font sizes

---

## 🚀 Quick Access Summary

### Fastest Path to Manual Attendance Requests:

1. **Login** → Supervisor account
2. **Tap** → Team tab (👥)
3. **Navigate** → Attendance Monitoring
4. **Look for** → Yellow "Pending Corrections" alert card
5. **Click** → "Review Corrections" button
6. **Review** → Request details in modal
7. **Action** → Approve or Reject

### Visual Cue:
The yellow warning card with the count of pending requests is your primary indicator that manual attendance requests need attention.

---

## 🔍 Troubleshooting

### Modal Not Appearing?
- **Check**: Are there pending corrections? (`pendingCorrections.length > 0`)
- **Verify**: API endpoint returning data
- **Confirm**: Modal state is being set correctly

### Alert Card Not Showing?
- **Reason**: No pending corrections in the system
- **Solution**: Worker must submit a manual attendance request first

### Can't See Team Tab?
- **Check**: Logged in as Supervisor role
- **Verify**: User has 'team_management' or 'attendance_monitoring' permissions
- **Confirm**: Navigation guard not blocking access

---

## 📝 Notes

- The modal is **embedded within** the Attendance Monitoring screen
- It's **not a separate screen** in the navigation stack
- It's a **Modal component** that overlays the current screen
- Only **one request** is shown at a time in the modal
- After processing, supervisor can review the **next pending request**

---

## ✅ Conclusion

The Manual Attendance Request UI is accessed through a **modal interface** within the Attendance Monitoring screen. It provides supervisors with a streamlined workflow to review and approve/reject worker attendance correction requests with full context and audit trail support.
