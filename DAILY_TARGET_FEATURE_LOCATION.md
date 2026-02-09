# Daily Target Update Feature - Location Guide

## ✅ Feature Status: **IMPLEMENTED**

The "Update Daily Job Targets" feature **IS IMPLEMENTED** in the mobile app.

## 📍 Location in Code

### File Path
```
ConstructionERPMobile/src/screens/supervisor/EnhancedTaskManagementScreen.tsx
```

### Line Numbers
- **Daily Target State**: Line ~1133
- **Daily Target Form Fields**: Lines ~510-520
- **Daily Target Display on Card**: Lines ~832-837
- **Daily Target in Update Function**: Line ~989

## 🎯 How to Access in the App

### Step-by-Step Navigation:

1. **Login as Supervisor**
   - Use supervisor credentials

2. **Go to Task Management**
   - From Dashboard: Tap "Task Management" card
   - OR from Bottom Nav: Tap "Tasks" tab

3. **Find Active Task Assignments**
   - Scroll down to "Active Task Assignments" section
   - You'll see a list of assigned tasks

4. **Tap "Update" Button**
   - Each task card has an "Update" button
   - Tap it to open the update modal

5. **Edit Daily Target**
   - In the modal, scroll down to find "Daily Target:" section
   - You'll see two input fields:
     - **Quantity** (numeric input)
     - **Unit** (text input)

6. **Save Changes**
   - Tap "Update" button at bottom of modal
   - Changes will be saved

## 📋 Code Structure

### State Management
```typescript
const [dailyTarget, setDailyTarget] = useState({ 
  quantity: 1, 
  unit: 'task' 
});
```

### Form Fields in Update Modal
```tsx
<View style={styles.formGroup}>
  <Text style={styles.formLabel}>Daily Target:</Text>
  <View style={styles.targetInputs}>
    <TextInput
      style={styles.targetInput}
      value={dailyTarget.quantity.toString()}
      onChangeText={(text) => setDailyTarget(prev => ({ 
        ...prev, 
        quantity: parseInt(text) || 0 
      }))}
      placeholder="Quantity"
      keyboardType="numeric"
    />
    <TextInput
      style={styles.targetInput}
      value={dailyTarget.unit}
      onChangeText={(text) => setDailyTarget(prev => ({ 
        ...prev, 
        unit: text 
      }))}
      placeholder="Unit"
    />
  </View>
</View>
```

### Display on Task Card
```tsx
{item.dailyTarget && (
  <Text style={styles.dailyTarget}>
    Target: {item.dailyTarget.quantity} {item.dailyTarget.unit}
  </Text>
)}
```

## 🔧 Update Function

The daily target is included in the update API call:

```typescript
const updateTaskAssignment = async () => {
  // ... other code ...
  
  if (dailyTarget) changes.dailyTarget = dailyTarget;
  
  const response = await supervisorApiService.updateTaskAssignment({
    assignmentId: selectedAssignment.assignmentId,
    ...changes
  });
  
  // ... handle response ...
};
```

## 🎨 Visual Layout in Modal

The update modal contains these fields in order:

1. **Work Area** (text input)
2. **Floor** (text input)
3. **Zone** (text input)
4. **Priority** (LOW/MEDIUM/HIGH buttons)
5. **Time Estimate** (hours and minutes inputs)
6. **Daily Target** ← THIS IS WHERE IT IS
   - Quantity (numeric)
   - Unit (text)

## 🔍 Why You Might Not See It

### Possible Reasons:

1. **Not Scrolling in Modal**
   - The modal has a ScrollView
   - Daily Target is near the bottom
   - **Solution**: Scroll down in the update modal

2. **Using Different Screen**
   - There might be multiple task management screens
   - Make sure you're on `EnhancedTaskManagementScreen`
   - **Solution**: Check which screen is being used in navigation

3. **Task Has No Daily Target Set**
   - The display only shows if `dailyTarget` exists
   - **Solution**: Update a task to set the daily target first

4. **Code Not Deployed**
   - Changes might not be in your running version
   - **Solution**: Rebuild the app

## 🧪 Testing the Feature

### Quick Test:
```bash
# In mobile app directory
cd ConstructionERPMobile

# Rebuild the app
npm start

# Or for specific platform
npm run android
npm run ios
```

### Verify in Code:
```bash
# Search for daily target in the file
grep -n "Daily Target" src/screens/supervisor/EnhancedTaskManagementScreen.tsx

# Should show line ~510 with the form field
```

## 📱 Backend API

The backend endpoint that handles this:

**Endpoint**: `PUT /api/supervisor/task-assignments/:assignmentId`

**Request Body**:
```json
{
  "workArea": "Zone A",
  "floor": "Floor 3",
  "zone": "North Wing",
  "priority": "HIGH",
  "timeEstimate": { "hours": 8, "minutes": 0 },
  "dailyTarget": { "quantity": 50, "unit": "panels" }
}
```

## ✅ Confirmation

The feature is **100% implemented** in:
- ✅ Mobile app UI (form fields)
- ✅ State management (useState)
- ✅ API integration (update function)
- ✅ Display on task cards
- ✅ Backend API support

## 📞 Need Help?

If you still can't find it:

1. Make sure you're logged in as a **Supervisor**
2. Go to **Task Management** screen
3. Look for **Active Task Assignments** section
4. Tap **Update** on any task
5. **Scroll down** in the modal
6. You should see **"Daily Target:"** with two input fields

The feature is there - it's just a matter of finding the right screen and scrolling to see it!
