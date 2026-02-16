# How to See the Updated Today's Tasks Screen

## The Problem
The code has been updated in the file, but React Native apps cache the JavaScript bundle. You need to force a reload.

## Solution - Try These Steps in Order

### Step 1: Simple Reload (Try This First)
1. In your terminal where Metro bundler is running, press `r` (lowercase)
2. Or shake your device and tap "Reload"

### Step 2: Clear Cache and Reload
If Step 1 doesn't work, clear the cache:

```bash
cd ConstructionERPMobile
npm start -- --reset-cache
```

Then press `a` for Android or `i` for iOS

### Step 3: Full Rebuild
If the above doesn't work, do a full rebuild:

```bash
cd ConstructionERPMobile
npm run android
# or
npm run ios
```

### Step 4: Nuclear Option (If Nothing Else Works)
Clear everything and rebuild:

```bash
cd ConstructionERPMobile
rm -rf node_modules
npm install
npm start -- --reset-cache
```

Then in another terminal:
```bash
cd ConstructionERPMobile
npm run android
```

## What You Should See

After reloading, the Today's Tasks screen header should show:

```
👷 TODAY'S TASKS
Date: 14 Feb 2026
Total Tasks Assigned: 3
Client: [Client Name if available]
```

## Verification

The changes are confirmed in the file at:
- `ConstructionERPMobile/src/screens/worker/TodaysTasksScreen.tsx`
- Lines 443-453 (header JSX)
- Lines 509-533 (header styles)

## Common Issues

1. **Metro bundler not running**: Make sure `npm start` is running
2. **Old bundle cached**: Use `--reset-cache` flag
3. **App not connected**: Check if device/emulator is connected
4. **Wrong screen**: Make sure you're on the "Today's Tasks" screen, not the dashboard

## Quick Test
To verify the file is correct, check line 443 in TodaysTasksScreen.tsx - it should say:
```tsx
<Text style={styles.headerTitle}>👷 TODAY'S TASKS</Text>
```

This is confirmed to be in the file. The issue is just that the app needs to reload the updated code.
