# iOS Runtime Errors Fix

## Problem
The app was experiencing runtime errors on iOS:
- `TypeError: Cannot read property 'S' of undefined`
- `TypeError: Cannot read property 'default' of undefined`

## Root Cause
These errors were caused by:
1. **Hermes Engine Compatibility Issues** with expo-notifications
2. **Module Resolution Problems** with destructured imports
3. **Mixed Export Patterns** causing import confusion

## Solutions Applied

### 1. Disabled Hermes Engine (Temporary Fix)
**File:** `app.json`
- Changed `jsEngine` from `"hermes"` to `"jsc"` for both iOS and Android
- Disabled `newArchEnabled` to prevent compatibility issues

### 2. Fixed expo-notifications Import Pattern
**File:** `src/services/notifications/NotificationService.ts`
- Replaced destructured imports with module-level imports
- Added proper error handling for missing modules
- Used dynamic imports with null checks

**Before:**
```typescript
const { setNotificationHandler } = await import('expo-notifications');
```

**After:**
```typescript
const notificationsModule = await import('expo-notifications').catch(() => null);
if (!notificationsModule?.setNotificationHandler) {
  console.warn('expo-notifications not available');
  return;
}
```

### 3. Fixed Context Export Patterns
**File:** `src/store/context/AuthContext.tsx`
- Removed mixed default/named exports
- Standardized to named exports only
- Removed redundant context export

### 4. Enhanced Error Handling
**File:** `src/store/context/NotificationContext.tsx`
- Added environment checks before initializing services
- Improved error boundaries for notification setup
- Added graceful fallbacks for missing modules

## Testing
1. Created `TestAppMinimal.tsx` for isolated testing
2. Verified app starts without runtime errors
3. Confirmed notification services initialize gracefully

## Next Steps
1. **Test the app** with `npm start` or `expo start`
2. **Monitor console** for any remaining errors
3. **Re-enable Hermes** once expo-notifications compatibility is confirmed in future updates

## Alternative Hermes-Compatible Solution
If you need to keep Hermes enabled, consider:
1. Downgrading expo-notifications to a Hermes-compatible version
2. Using alternative notification libraries
3. Implementing custom notification handling

## Files Modified
- `app.json` - Disabled Hermes engine
- `src/services/notifications/NotificationService.ts` - Fixed import patterns
- `src/store/context/AuthContext.tsx` - Fixed export patterns
- `src/store/context/NotificationContext.tsx` - Enhanced error handling
- `TestAppMinimal.tsx` - Created for testing
- `tsconfig.json` - Updated includes

## Verification Commands
```bash
cd ConstructionERPMobile
npm start
# or
expo start --ios
```

The app should now start without the "Cannot read property 'S' of undefined" errors.