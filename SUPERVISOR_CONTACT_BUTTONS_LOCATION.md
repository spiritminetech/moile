# Supervisor Contact Buttons Location ✅

## Location Found

The **Supervisor Contact Buttons** are implemented in the **TaskCard component** and are displayed in the **Today's Tasks Screen** when a task is expanded.

## File Locations

### 1. TaskCard Component (Implementation)
**File:** `ConstructionERPMobile/src/components/cards/TaskCard.tsx`

**Lines:** 209-224, 489-510

### 2. Today's Tasks Screen (Usage)
**File:** `ConstructionERPMobile/src/screens/worker/TodaysTasksScreen.tsx`

**Lines:** 365-375 (TaskCard is rendered here)

## How It Works

### Display Logic
The supervisor contact buttons are shown when:
1. The task card is **expanded** (user taps on the card)
2. The task has **supervisor information** available:
   - `task.supervisorName` (optional)
   - `task.supervisorContact` (required for buttons)

### Button Implementation

```typescript
// Handler functions (lines 209-224)
const handleCallSupervisor = () => {
  if (task.supervisorContact) {
    Linking.openURL(`tel:${task.supervisorContact}`);
  } else {
    Alert.alert('No Contact', 'Supervisor contact number not available');
  }
};

const handleMessageSupervisor = () => {
  if (task.supervisorContact) {
    Linking.openURL(`sms:${task.supervisorContact}`);
  } else {
    Alert.alert('No Contact', 'Supervisor contact number not available');
  }
};
```

### UI Section (lines 489-510)

```typescript
{/* Reporting Supervisor Section */}
{(task.supervisorName || task.supervisorContact) && (
  <View style={styles.supervisorContactSection}>
    <Text style={styles.sectionTitle}>👨‍🔧 REPORTING SUPERVISOR</Text>
    {task.supervisorName && (
      <Text style={styles.supervisorName}>{task.supervisorName}</Text>
    )}
    {task.supervisorContact && (
      <>
        <Text style={styles.supervisorContact}>{task.supervisorContact}</Text>
        <View style={styles.contactButtons}>
          <ConstructionButton
            title="📞 Call"
            onPress={handleCallSupervisor}
            variant="primary"
            size="small"
            style={styles.contactButton}
          />
          <ConstructionButton
            title="💬 Message"
            onPress={handleMessageSupervisor}
            variant="neutral"
            size="small"
            style={styles.contactButton}
          />
        </View>
      </>
    )}
  </View>
)}
```

## User Flow

1. **Worker opens Today's Tasks Screen**
   - Sees list of assigned tasks (collapsed by default)

2. **Worker taps on a task card**
   - Task card expands to show full details

3. **Expanded view shows multiple sections:**
   - 📌 Assigned Project
   - 📍 Work Location
   - **👨‍🔧 Reporting Supervisor** ← Contact buttons here
   - 🛠️ Nature of Work (if task started)
   - 🎯 Daily Target (if available)
   - 📊 Progress (if task in progress)

4. **Supervisor Contact Section displays:**
   - Supervisor name (if available)
   - Supervisor phone number
   - **📞 Call button** - Opens phone dialer
   - **💬 Message button** - Opens SMS app

## Features

### Call Button
- **Icon:** 📞
- **Action:** Opens device phone dialer with supervisor's number
- **Variant:** Primary (blue)
- **Size:** Small

### Message Button
- **Icon:** 💬
- **Action:** Opens device SMS app with supervisor's number
- **Variant:** Neutral (gray)
- **Size:** Small

### Error Handling
- If `task.supervisorContact` is missing, shows alert: "Supervisor contact number not available"
- Section only renders if supervisor name OR contact exists

## Data Requirements

The buttons require the following data from the backend API:

```typescript
interface TaskAssignment {
  // ... other fields
  supervisorName?: string;      // Optional - supervisor's name
  supervisorContact?: string;   // Required for buttons - phone number
}
```

## Testing

To test the supervisor contact buttons:

1. Ensure task data includes `supervisorContact` field
2. Open Today's Tasks Screen
3. Tap on a task card to expand it
4. Scroll down to "👨‍🔧 REPORTING SUPERVISOR" section
5. Verify both buttons are visible
6. Test Call button - should open phone dialer
7. Test Message button - should open SMS app

## Status: ✅ IMPLEMENTED

The supervisor contact buttons are fully implemented and functional in the Today's Tasks Screen via the TaskCard component's expanded view.
