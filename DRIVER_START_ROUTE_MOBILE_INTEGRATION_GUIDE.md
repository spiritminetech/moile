# Driver "Start Route" - Mobile App Integration Guide

**For:** Mobile App Development Team  
**Date:** February 11, 2026  
**Backend Version:** v2.0 (Enhanced with validation & notifications)

---

## 🎯 Quick Overview

The backend now includes enhanced validation and notifications for the "Start Route" flow. Your mobile app needs to handle three new scenarios:

1. ✅ **Success** - Route started successfully
2. ❌ **Not Logged In** - Driver must clock in first (403 error)
3. ❌ **Task In Progress** - Driver has incomplete task (400 error)

---

## 📡 API Endpoint

### Update Task Status
```
POST /api/driver/tasks/:taskId/status
Authorization: Bearer {token}
Content-Type: application/json
```

### Request Body
```json
{
  "status": "en_route_pickup",
  "location": {
    "latitude": 1.3521,
    "longitude": 103.8198,
    "timestamp": "2026-02-11T10:30:00.000Z"
  },
  "notes": "Starting route to pickup location"
}
```

**Status Values:**
- `pending` → Backend: `PLANNED`
- `en_route_pickup` → Backend: `ONGOING` ⭐ (This is "Start Route")
- `pickup_complete` → Backend: `PICKUP_COMPLETE`
- `en_route_dropoff` → Backend: `EN_ROUTE_DROPOFF`
- `completed` → Backend: `COMPLETED`
- `cancelled` → Backend: `CANCELLED`

---

## ✅ Success Response (200 OK)

```json
{
  "success": true,
  "message": "Task status updated successfully",
  "data": {
    "taskId": 123,
    "status": "ONGOING",
    "actualStartTime": "2026-02-11T10:30:00.000Z",
    "updatedAt": "2026-02-11T10:30:00.000Z"
  }
}
```

### Mobile App Actions:
1. ✅ Show success message: "Route started successfully"
2. ✅ Update task status to "En Route to Pickup"
3. ✅ Enable location tracking
4. ✅ Show pickup location and navigation
5. ✅ Update UI to show "In Progress" state

### Example Code (React Native):
```javascript
const startRoute = async (taskId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/driver/tasks/${taskId}/status`,
      {
        status: 'en_route_pickup',
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timestamp: new Date().toISOString()
        },
        notes: 'Starting route to pickup location'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      // Success - update UI
      showSuccessMessage('Route started successfully');
      updateTaskStatus(taskId, 'ONGOING');
      startLocationTracking();
      navigateToPickupScreen(taskId);
    }

  } catch (error) {
    handleStartRouteError(error);
  }
};
```

---

## ❌ Error Response 1: Not Logged In (403 Forbidden)

```json
{
  "success": false,
  "message": "You must clock in before starting a route",
  "error": "DRIVER_NOT_LOGGED_IN",
  "requiresAction": "CLOCK_IN"
}
```

### Mobile App Actions:
1. ❌ Show error alert: "You must clock in before starting a route"
2. 🔘 Show "Clock In Now" button
3. 🔘 Navigate to Attendance/Clock In screen when button pressed
4. ⏸️ Keep task in "Pending" state

### Example Code (React Native):
```javascript
const handleStartRouteError = (error) => {
  if (error.response?.status === 403 && 
      error.response?.data?.error === 'DRIVER_NOT_LOGGED_IN') {
    
    // Show alert with action button
    Alert.alert(
      'Clock In Required',
      'You must clock in before starting a route',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clock In Now',
          onPress: () => navigation.navigate('AttendanceScreen')
        }
      ]
    );
  }
};
```

### UI Design Suggestion:
```
┌─────────────────────────────────────┐
│  ⚠️  Clock In Required              │
│                                     │
│  You must clock in before starting  │
│  a route.                           │
│                                     │
│  ┌───────────┐  ┌────────────────┐ │
│  │  Cancel   │  │  Clock In Now  │ │
│  └───────────┘  └────────────────┘ │
└─────────────────────────────────────┘
```

---

## ❌ Error Response 2: Task In Progress (400 Bad Request)

```json
{
  "success": false,
  "message": "Complete your current task before starting a new route",
  "error": "TASK_IN_PROGRESS",
  "currentTask": {
    "id": 122,
    "status": "ONGOING",
    "projectId": 1
  }
}
```

### Mobile App Actions:
1. ❌ Show error alert: "Complete your current task first"
2. 🔘 Show "View Current Task" button
3. 🔘 Navigate to current task details when button pressed
4. ⏸️ Keep new task in "Pending" state

### Example Code (React Native):
```javascript
const handleStartRouteError = (error) => {
  if (error.response?.status === 400 && 
      error.response?.data?.error === 'TASK_IN_PROGRESS') {
    
    const currentTask = error.response.data.currentTask;
    
    // Show alert with action button
    Alert.alert(
      'Task In Progress',
      `You have an incomplete task (ID: ${currentTask.id}). Complete it before starting a new route.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'View Current Task',
          onPress: () => navigation.navigate('TaskDetails', { 
            taskId: currentTask.id 
          })
        }
      ]
    );
  }
};
```

### UI Design Suggestion:
```
┌─────────────────────────────────────┐
│  ⚠️  Task In Progress               │
│                                     │
│  You have an incomplete task        │
│  (ID: 122). Complete it before      │
│  starting a new route.              │
│                                     │
│  ┌───────────┐  ┌────────────────┐ │
│  │  Cancel   │  │ View Current   │ │
│  │           │  │     Task       │ │
│  └───────────┘  └────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🔄 Complete Error Handling Function

```javascript
const handleStartRouteError = (error) => {
  // Case 1: Not Logged In (403)
  if (error.response?.status === 403 && 
      error.response?.data?.error === 'DRIVER_NOT_LOGGED_IN') {
    
    Alert.alert(
      'Clock In Required',
      'You must clock in before starting a route',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clock In Now',
          onPress: () => navigation.navigate('AttendanceScreen')
        }
      ]
    );
    return;
  }

  // Case 2: Task In Progress (400)
  if (error.response?.status === 400 && 
      error.response?.data?.error === 'TASK_IN_PROGRESS') {
    
    const currentTask = error.response.data.currentTask;
    
    Alert.alert(
      'Task In Progress',
      `You have an incomplete task (ID: ${currentTask.id}). Complete it before starting a new route.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Current Task',
          onPress: () => navigation.navigate('TaskDetails', { 
            taskId: currentTask.id 
          })
        }
      ]
    );
    return;
  }

  // Case 3: Task Not Found (404)
  if (error.response?.status === 404) {
    Alert.alert(
      'Task Not Found',
      'This task is not assigned to you or does not exist.',
      [{ text: 'OK' }]
    );
    return;
  }

  // Case 4: Server Error (500)
  if (error.response?.status === 500) {
    Alert.alert(
      'Server Error',
      'Unable to start route. Please try again later.',
      [{ text: 'OK' }]
    );
    return;
  }

  // Case 5: Network Error
  if (!error.response) {
    Alert.alert(
      'Network Error',
      'Unable to connect to server. Check your internet connection.',
      [{ text: 'OK' }]
    );
    return;
  }

  // Default error
  Alert.alert(
    'Error',
    error.response?.data?.message || 'Failed to start route',
    [{ text: 'OK' }]
  );
};
```

---

## 🧪 Testing Checklist

### Test Scenario 1: Successful Route Start ✅
- [ ] Driver is logged in (attendance checked in)
- [ ] No other tasks in progress
- [ ] GPS location available
- [ ] API call succeeds (200)
- [ ] UI updates to "In Progress"
- [ ] Location tracking starts
- [ ] Navigation to pickup screen works

### Test Scenario 2: Not Logged In ❌
- [ ] Driver is NOT logged in
- [ ] Try to start route
- [ ] API returns 403 error
- [ ] Alert shows "Clock In Required"
- [ ] "Clock In Now" button appears
- [ ] Button navigates to attendance screen
- [ ] Task remains in "Pending" state

### Test Scenario 3: Task In Progress ❌
- [ ] Driver has active task (status: ONGOING)
- [ ] Try to start another route
- [ ] API returns 400 error
- [ ] Alert shows "Task In Progress"
- [ ] "View Current Task" button appears
- [ ] Button navigates to current task details
- [ ] New task remains in "Pending" state

### Test Scenario 4: Network Error 🌐
- [ ] Disable internet connection
- [ ] Try to start route
- [ ] Network error alert appears
- [ ] Retry mechanism works
- [ ] Offline queue functionality (if implemented)

---

## 📱 UI/UX Recommendations

### Start Route Button States

#### 1. Ready to Start (Default)
```
┌─────────────────────────────────┐
│  🚗  Start Route                │
└─────────────────────────────────┘
```
- Background: Primary color (e.g., blue)
- Text: White
- Enabled: Yes

#### 2. Loading (API Call in Progress)
```
┌─────────────────────────────────┐
│  ⏳  Starting Route...          │
└─────────────────────────────────┘
```
- Background: Primary color (dimmed)
- Text: White
- Enabled: No
- Show loading spinner

#### 3. Success (Route Started)
```
┌─────────────────────────────────┐
│  ✅  Route Started              │
└─────────────────────────────────┘
```
- Background: Green
- Text: White
- Enabled: No
- Auto-navigate after 1 second

#### 4. Error (Validation Failed)
```
┌─────────────────────────────────┐
│  ❌  Start Route                │
└─────────────────────────────────┘
```
- Background: Red
- Text: White
- Enabled: Yes (can retry)
- Show error message above button

---

## 🔔 Notifications

### What Happens When Route Starts:

1. **Supervisor Receives:**
   - Title: "Transport Route Started"
   - Message: "John Doe has started route for Project Alpha (Vehicle: ABC-123)"
   - Priority: HIGH
   - Action: View task details

2. **Admin/Manager Receives:**
   - Title: "Driver En Route"
   - Message: "John Doe is en route to pickup location for Project Alpha"
   - Priority: NORMAL
   - Action: View dashboard

**Note:** These notifications are sent by the backend automatically. No mobile app action required.

---

## 🐛 Common Issues & Solutions

### Issue 1: "Clock In Required" but driver is logged in
**Cause:** Attendance record not found for today  
**Solution:** 
- Check attendance date format (must be UTC start of day)
- Verify attendance record has `checkIn` field populated
- Check project ID matches

### Issue 2: "Task In Progress" but no active task visible
**Cause:** Previous task not properly completed  
**Solution:**
- Check task status in database
- Manually complete stuck task
- Add "View All Tasks" button to help driver find incomplete task

### Issue 3: Notifications not received
**Cause:** Notification service configuration  
**Solution:**
- Verify Firebase credentials
- Check device token registration
- Review notification permissions

---

## 📞 Support Contacts

### Backend Team:
- For API issues, error codes, or validation logic
- Review: `backend/src/modules/driver/driverController.js`

### Mobile Team:
- For UI/UX implementation
- Error handling and user flows

### QA Team:
- For testing scenarios and edge cases
- Use test file: `backend/test-driver-start-route-complete.js`

---

## 📚 Related Documentation

- [Driver Start Route Flow Verification](./DRIVER_START_ROUTE_FLOW_VERIFICATION.md)
- [Driver Start Route Implementation Complete](./DRIVER_START_ROUTE_IMPLEMENTATION_COMPLETE.md)
- [Driver API Integration Status](./DRIVER_API_INTEGRATION_STATUS.md)

---

**Document Version:** 1.0  
**Last Updated:** February 11, 2026  
**Backend Version:** v2.0 (Enhanced)  
**Status:** ✅ Ready for Mobile Integration
