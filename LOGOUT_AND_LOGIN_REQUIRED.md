# ⚠️ LOGOUT AND LOGIN REQUIRED

## Current Situation

### ✅ Database is Correct
The database has the RIGHT assignments:
- 9001: Wall Plastering - Ground Floor (150 sqm)
- 9002: Floor Tiling - First Floor (80 sqm)
- 9003: Painting - Exterior Walls (200 sqm)

### ❌ Mobile App is Showing Wrong Data
Your mobile app is showing OLD assignments:
- 7034-7043: Various tasks (these don't exist in the database anymore)

## Root Cause: Stale JWT Token

Your JWT token (authentication token) was created BEFORE we fixed the employee ID linking. The token contains:
- Old employee ID (possibly 2 or wrong ID)
- Old user data
- Old permissions

The backend is using this old token to query for the wrong employee ID, which is why you're getting old/cached data.

## SOLUTION: Logout and Login Again

### Step 1: Logout from Mobile App
1. Open the mobile app
2. Go to Settings or Profile
3. Click "Logout"
4. Wait for logout to complete

### Step 2: Close the App Completely
- On Android: Swipe up from bottom → Swipe away the app
- On iOS: Double-click home → Swipe away the app
- Or just close the Expo app completely

### Step 3: Reopen and Login
1. Open the mobile app again
2. Login with:
   - Email: `worker@gmail.com`
   - Password: `password123`
3. Wait for login to complete

### Step 4: Navigate to Today's Tasks
After login, go to "Today's Tasks" screen

## What You Should See After Login

### Correct Data
```
📋 Today's Tasks (3)

1. Wall Plastering - Ground Floor
   Expected Output: 150 sqm
   Actual Output: 0 sqm
   Status: pending

2. Floor Tiling - First Floor
   Expected Output: 80 sqm
   Actual Output: 0 sqm
   Status: pending

3. Painting - Exterior Walls
   Expected Output: 200 sqm
   Actual Output: 0 sqm
   Status: pending
```

### Mobile App Logs Should Show
```
LOG  📊 TodaysTasksScreen - Tasks updated:
tasksLength: 3
assignmentId: 9001 (or 9002, 9003)
taskName: "Wall Plastering - Ground Floor"
dailyTarget: { quantity: 150, unit: "sqm" }
```

## Why This Happens

When you login, the backend creates a JWT token that contains:
```json
{
  "userId": "...",
  "employeeId": 107,
  "email": "worker@gmail.com",
  "role": "worker"
}
```

This token is stored in your mobile app and sent with every API request.

If you logged in BEFORE we fixed the employee ID, your token has the WRONG employee ID, so the backend queries for the wrong data.

Logging out and logging in again creates a NEW token with the CORRECT employee ID.

## Alternative: Clear AsyncStorage

If logout doesn't work, you can clear all app data:

1. Shake device or press `Ctrl+M` (Android) / `Cmd+D` (iOS)
2. Select "Debug Remote JS"
3. In Chrome DevTools Console, run:
   ```javascript
   AsyncStorage.clear().then(() => console.log('Cleared!'))
   ```
4. Reload the app
5. Login again

## Verification Checklist

After logout and login:
- [ ] Mobile app shows 3 tasks (not 10)
- [ ] Assignment IDs are 9001, 9002, 9003 (not 7034-7043)
- [ ] Task names are visible (not "undefined")
- [ ] Expected Output shows 150, 80, 200 sqm (not 0)
- [ ] Can click "Update Progress" button
- [ ] Can submit progress successfully

## If Still Not Working

If you still see the old assignments after logout/login:

1. **Check backend logs** - Look for the employee ID being queried
2. **Check JWT token** - The backend should log the decoded token
3. **Clear app cache completely** - Use AsyncStorage.clear()
4. **Reinstall the app** - Delete and reinstall the Expo app

## Summary

The database is correct. You just need to:
1. **Logout** from the mobile app
2. **Close** the app completely
3. **Reopen** and **login** again with worker@gmail.com / password123

This will get you a fresh JWT token with the correct employee ID, and you'll see the right assignments with proper daily targets.
