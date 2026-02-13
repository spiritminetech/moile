# Infinite Loop Fix - Maximum Update Depth Exceeded ✅

## Error Message
```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

## Root Cause

### The Problem:
```typescript
// loadWorkerManifests function
const loadWorkerManifests = useCallback(async (taskId: number) => {
  // ... fetch data ...
  
  // ❌ PROBLEM: This updates selectedTask
  setSelectedTask(prevTask => {
    return {
      ...prevTask,
      pickupLocations: updatedPickupLocations,
      totalWorkers,
      checkedInWorkers,
    };
  });
}, []); // Function is stable

// useEffect watching selectedTask
useEffect(() => {
  if (selectedTask?.taskId) {
    // ... some logic ...
    loadWorkerManifests(selectedTask.taskId); // ❌ Calls function that updates selectedTask
  }
}, [selectedTask?.taskId]); // ❌ Watches selectedTask.taskId
```

### The Infinite Loop:
1. `useEffect` runs when `selectedTask.taskId` changes
2. Calls `loadWorkerManifests(taskId)`
3. `loadWorkerManifests` calls `setSelectedTask(...)` 
4. `setSelectedTask` creates a NEW object (even though taskId is same)
5. React sees `selectedTask` changed (new object reference)
6. `useEffect` dependency `selectedTask?.taskId` is re-evaluated
7. Even though taskId value is same, React re-runs the effect
8. Back to step 2 → **INFINITE LOOP** 🔄

## The Fix

### Solution: Add `loadWorkerManifests` to dependency array

```typescript
// ✅ FIXED: Wrap in useCallback with empty deps
const loadWorkerManifests = useCallback(async (taskId: number) => {
  // ... fetch data ...
  setSelectedTask(prevTask => {
    return {
      ...prevTask,
      pickupLocations: updatedPickupLocations,
      totalWorkers,
      checkedInWorkers,
    };
  });
}, []); // ✅ Empty dependency - function doesn't depend on any state

// ✅ FIXED: Include loadWorkerManifests in dependency array
useEffect(() => {
  if (selectedTask?.taskId) {
    // ... some logic ...
    loadWorkerManifests(selectedTask.taskId);
  }
}, [selectedTask?.taskId, loadWorkerManifests]); // ✅ Include loadWorkerManifests
```

### Why This Works:

1. `loadWorkerManifests` is wrapped in `useCallback` with empty deps `[]`
2. This means the function reference is **stable** (doesn't change between renders)
3. Adding it to the dependency array satisfies React's exhaustive-deps rule
4. Since the function reference is stable, it doesn't cause re-renders
5. The effect only runs when `selectedTask.taskId` actually changes
6. **No more infinite loop!** ✅

## Technical Explanation

### React's Dependency Comparison:

React uses `Object.is()` to compare dependencies:

```typescript
// When selectedTask changes:
const oldTaskId = 10005;
const newTaskId = 10005;

Object.is(oldTaskId, newTaskId); // true - same value

// But the object reference changed:
const oldTask = { taskId: 10005, status: 'ONGOING' };
const newTask = { taskId: 10005, status: 'ONGOING' };

Object.is(oldTask, newTask); // false - different objects!
```

### The Key Insight:

Even though we only watch `selectedTask?.taskId` (the primitive value), React still evaluates this expression on every render. If `selectedTask` is a new object, React re-evaluates the expression, and even though the taskId value is the same, the effect might run again due to how React's dependency tracking works internally.

### The Solution:

By including `loadWorkerManifests` in the dependency array AND wrapping it in `useCallback` with stable dependencies, we ensure:

1. The function reference is stable (doesn't change)
2. React's exhaustive-deps rule is satisfied
3. The effect only runs when taskId actually changes
4. No infinite loops

## Before vs After

### Before (Infinite Loop):
```typescript
useEffect(() => {
  if (selectedTask?.taskId) {
    loadWorkerManifests(selectedTask.taskId);
  }
}, [selectedTask?.taskId]); // ❌ Missing loadWorkerManifests

// Result:
// 1. Effect runs
// 2. Calls loadWorkerManifests
// 3. Updates selectedTask
// 4. Effect runs again
// 5. Infinite loop! 💥
```

### After (Fixed):
```typescript
useEffect(() => {
  if (selectedTask?.taskId) {
    loadWorkerManifests(selectedTask.taskId);
  }
}, [selectedTask?.taskId, loadWorkerManifests]); // ✅ Includes loadWorkerManifests

// Result:
// 1. Effect runs
// 2. Calls loadWorkerManifests
// 3. Updates selectedTask
// 4. Effect checks dependencies
// 5. taskId same, loadWorkerManifests same
// 6. Effect doesn't run again
// 7. No loop! ✅
```

## Testing

### How to Verify the Fix:

1. **Open the app**
2. **Navigate to Transport Tasks**
3. **Select a task**
4. **Check console logs**:
   - Should see: `🔍 useEffect manifest check` ONCE
   - Should see: `👥 Loading worker manifests` ONCE
   - Should NOT see repeated logs
5. **Check for errors**:
   - Should NOT see "Maximum update depth exceeded"
   - App should be responsive
   - No freezing or lag

### Signs of Infinite Loop (Before Fix):
- ❌ Console logs repeating rapidly
- ❌ App freezes or becomes unresponsive
- ❌ "Maximum update depth exceeded" error
- ❌ High CPU usage
- ❌ Battery drain

### Signs of Fixed (After Fix):
- ✅ Console logs appear once
- ✅ App is responsive
- ✅ No errors
- ✅ Normal CPU usage
- ✅ Smooth performance

## Additional Notes

### Why Empty Dependency Array for useCallback?

```typescript
const loadWorkerManifests = useCallback(async (taskId: number) => {
  // This function doesn't use any state or props
  // It only uses the taskId parameter
  // So it doesn't need any dependencies
}, []); // ✅ Empty - function is stable
```

### When to Include Functions in useEffect Dependencies:

**Always include functions** that are called inside useEffect, UNLESS:
- The function is defined outside the component
- The function is from a library (like `console.log`)
- The function is wrapped in `useCallback` with stable dependencies

### React's Exhaustive-Deps Rule:

The ESLint rule `react-hooks/exhaustive-deps` warns about missing dependencies. This is to prevent:
- Stale closures
- Bugs from outdated state
- Infinite loops (like this one!)

## Summary

### Problem:
- `useEffect` called `loadWorkerManifests`
- `loadWorkerManifests` updated `selectedTask`
- `useEffect` watched `selectedTask.taskId`
- Created infinite loop

### Solution:
- Wrapped `loadWorkerManifests` in `useCallback` with empty deps
- Added `loadWorkerManifests` to `useEffect` dependency array
- Function reference is stable, no infinite loop

### Result:
- ✅ No more "Maximum update depth exceeded" error
- ✅ App is responsive and performant
- ✅ Worker manifests load correctly
- ✅ No infinite loops

The fix ensures that the effect only runs when the taskId actually changes, not on every render!
