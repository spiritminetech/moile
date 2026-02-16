# Pause Dialog Troubleshooting

## Current Status

You're seeing: **"Error, you have another task in progress"**

This means:
- ✅ Backend is detecting the active task correctly
- ✅ Backend is returning an error
- ❌ Frontend is NOT showing the pause-and-start dialog
- ❌ Frontend is showing a generic error instead

---

## Why This Happens

The frontend code checks for `response.error === 'ANOTHER_TASK_ACTIVE'` but it's not matching. This could be because:

1. The `error` field is not being set in the response
2. The `error` field has a different value
3. The response structure is different than expected

---

## Debug Steps

I've added debug logging to the code. Now:

1. **Reload the app** (clear cache if needed)
2. **Try to start a task** while another is active
3. **Check the console** - you should see:
   ```
   🔍 START TASK RESPONSE: {
     "success": false,
     "error": "...",
     "message": "...",
     "data": {...}
   }
   ```

4. **Share the console output** with me

---

## Expected Response Format

The backend should return:

```json
{
  "success": false,
  "message": "You have another task in progress",
  "error": "ANOTHER_TASK_ACTIVE",
  "data": {
    "activeTaskId": 7034,
    "activeTaskName": "Install LED Lights",
    "activeTaskAssignmentId": 7034,
    "requiresPause": true
  }
}
```

---

## Quick Fix Options

### Option 1: Check API Response Format

The API service might be transforming the response. Let me check the workerApiService.ts file.

### Option 2: Add Fallback Check

If the error field is missing, we can check the message text:

```typescript
} else if (response.error === 'ANOTHER_TASK_ACTIVE' || 
           response.message?.includes('another task in progress')) {
  // Show pause dialog
}
```

### Option 3: Check Network Tab

In your browser/app dev tools:
1. Open Network tab
2. Try to start a task
3. Find the `startTask` API call
4. Check the response body
5. Share what you see

---

## Next Steps

1. **Check console logs** after trying to start a task
2. **Share the output** - specifically the "START TASK RESPONSE" log
3. I'll fix the issue based on what the actual response looks like

---

## Temporary Workaround

If you want to test the pause functionality manually:

1. Open browser console
2. Run this command to pause the active task:
   ```javascript
   fetch('http://localhost:5002/api/worker/tasks/7034/pause', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer YOUR_TOKEN'
     },
     body: JSON.stringify({
       location: { latitude: 0, longitude: 0 }
     })
   })
   ```

3. Then try starting another task

---

## Files Modified

- `ConstructionERPMobile/src/screens/worker/TodaysTasksScreen.tsx`
  - Added debug logging at line 351-356

**Action Required:** Reload the app and check console logs when you try to start a task.
