# Start Route - Complete Data Flow

## When "Start Route" Button is Clicked

### Mobile App Action
**File:** `DriverDashboard.tsx` → `handleStartRoute()`

```javascript
const handleStartRoute = async (taskId: number) => {
  // API Call
  await driverApiService.updateTransportTaskStatus(
    taskId,
    'en_route_pickup',  // New status
    currentLocation,     // GPS coordinates
    'Route started from dashboard'  // Notes
  );
};
```

**API Request:**
```
PUT /api/v1/driver/transport-tasks/10003/status

Body:
{
  "status": "en_route_pickup",
  "location": {
    "latitude": 25.2048,
    "longitude": 5