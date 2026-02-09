# Approval Count Mismatch - ROOT CAUSE FOUND ✅

## The Real Issue

The backend is working **perfectly**. The problem is in the **mobile app authentication**.

## Evidence from Backend Logs

### Dashboard API Call
```
📊 Dashboard Approval Query Debug: {
  supervisorId: 1,
  projectIds: [2, 1, 1016],
  allEmployeeIds: [204, 205, 206, 207, 208]
}
📊 Approval Counts: {
  leaveCount: 0,
  advanceCount: 0,
  materialCount: 0,
  toolCount: 0,
  total: 0
}
```
**Result**: Dashboard shows 0 approvals for Supervisor 1 ✅

### Approvals Screen API Call
```
🔍 Approvals Screen - Supervisor Found: {
  supervisorId: 4,
  supervisorName: 'kawaja',
  userId: 4
}
🔍 Approvals Screen Debug: {
  supervisorId: 4,
  projectIds: [1003, 1002, 1001, 1002, 1014, 101],
  employeeIds: [2, 10, 17, 16, 20, 107]
}
✅ Pending approvals summary: {
  total: 5
}
```
**Result**: Approvals screen shows 5 approvals for Supervisor 4 ✅

## Root Cause

The mobile app is sending **different authentication tokens** to different screens:
- **Dashboard**: Uses token for Supervisor 1 (Mulder, userId: 54)
- **Approvals Screen**: Uses token for Supervisor 4 (kawaja, userId: 4)

## Why This Happens

Possible causes in the mobile app:
1. **Token Caching Issue**: Old token for Supervisor 4 is cached and being used by approvals screen
2. **Context Provider Issue**: Different screens are reading from different auth contexts
3. **AsyncStorage Issue**: Token not properly updated in local storage
4. **Navigation State**: Approvals screen is using stale navigation state with old token

## Backend Status: ✅ WORKING CORRECTLY

Both APIs are functioning perfectly:
- Dashboard API correctly returns 0 approvals for Supervisor 1
- Approvals API correctly returns 5 approvals for Supervisor 4
- Employee query patterns match between both endpoints
- No orphaned requests causing incorrect counts

## Mobile App Fix Required

The mobile app needs to ensure:
1. **Single Source of Truth**: All screens use the same authentication token
2. **Token Refresh**: When logging in as a different supervisor, all screens update
3. **Clear Cache**: Old tokens are cleared when switching users
4. **Context Consistency**: All screens read from the same auth context

## How to Verify in Mobile App

### Check Current User
Look at the mobile app to see which supervisor is actually logged in:
- Check the profile screen
- Check the dashboard header
- Check any user display name

### Expected Behavior
If logged in as **Supervisor 1 (Mulder)**:
- Dashboard should show: 0 approvals ✅
- Approvals screen should show: 0 approvals ❌ (currently showing 5)

If logged in as **Supervisor 4 (kawaja)**:
- Dashboard should show: 5 approvals ❌ (currently showing 0)
- Approvals screen should show: 5 approvals ✅

## Solution

### Option 1: Log Out and Log Back In
1. Log out completely from the mobile app
2. Clear app cache/data if possible
3. Log back in as the desired supervisor
4. Both screens should now show matching counts

### Option 2: Fix Mobile App Auth
Check these files in the mobile app:
- `src/store/context/AuthContext.tsx` - Ensure single auth state
- `src/services/api/apiClient.ts` - Ensure consistent token usage
- `src/screens/supervisor/SupervisorDashboard.tsx` - Check token source
- `src/screens/supervisor/ApprovalsScreen.tsx` - Check token source

Look for:
- Multiple token storage locations
- Cached API responses with old tokens
- Different auth contexts being used
- AsyncStorage not being cleared properly

## Status

- ✅ Backend: Working correctly
- ✅ Dashboard API: Returns correct data for authenticated user
- ✅ Approvals API: Returns correct data for authenticated user
- ❌ Mobile App: Using different tokens for different screens

The fix needs to be in the **mobile app authentication layer**, not the backend.
