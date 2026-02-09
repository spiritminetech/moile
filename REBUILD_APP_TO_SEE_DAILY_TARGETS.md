# Quick Guide: Rebuild App to See Daily Target Feature

## ✅ Fix Applied

The navigation has been updated to use the correct screen (`EnhancedTaskManagementScreen`) that includes the daily target feature.

## 🔄 How to Rebuild and See the Changes

### Step 1: Stop Current App (if running)
```bash
# Press Ctrl+C in the terminal where the app is running
```

### Step 2: Navigate to Mobile App Directory
```bash
cd ConstructionERPMobile
```

### Step 3: Clear Cache (Recommended)
```bash
# Clear Metro bundler cache
npm start -- --reset-cache

# OR use the batch file
clear-cache.bat
```

### Step 4: Start the App
```bash
# Start Expo
npm start

# Then press:
# 'a' for Android
# 'i' for iOS
# 'w' for Web
```

### Alternative: Direct Platform Start
```bash
# For Android
npm run android

# For iOS
npm run ios
```

## 📱 What to Expect After Rebuild

### 1. Login as Supervisor
- Use your supervisor credentials

### 2. Navigate to Tasks
- Tap the "Tasks" tab (📋) in the bottom navigation

### 3. You Should Now See:

```
┌─────────────────────────────────────┐
│  Task Management                    │
│                                     │
│  📊 Summary Stats                   │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │  5  │ │  3  │ │  8  │           │
│  │Active│ │Workers│ │Total│         │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
│  🏗️ Projects                        │
│  [Project 1] [Project 2]            │
│                                     │
│  👷 Available Workers               │
│  [John] [Jane] [Mike]               │
│                                     │
│  📋 Active Task Assignments ← NEW!  │
│  ┌───────────────────────────────┐  │
│  │ Install Ceiling Panels        │  │
│  │ Worker: John Doe              │  │
│  │ Status: IN PROGRESS           │  │
│  │ Priority: HIGH                │  │
│  │ Sequence: #1                  │  │
│  │ Area: Zone A                  │  │
│  │ Floor: Floor 3                │  │
│  │ Estimated: 8h 0m              │  │
│  │ Target: 50 panels ← NEW!      │  │
│  │ [Update] [Remove]             │  │
│  └───────────────────────────────┘  │
│                                     │
│  (More task cards...)               │
└─────────────────────────────────────┘
```

### 4. Test Daily Target Update
1. Tap **"Update"** on any task card
2. Modal opens with task details
3. **Scroll down** in the modal
4. Find **"Daily Target:"** section
5. Edit **Quantity** and **Unit**
6. Tap **"Update"** to save

## 🚨 Troubleshooting

### Issue: Still seeing old screen
**Solution**: 
```bash
# Force clear everything
cd ConstructionERPMobile
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### Issue: App crashes on Tasks tab
**Solution**:
- Check if you have test data (tasks assigned to workers)
- Check backend is running
- Check network connection

### Issue: "Active Task Assignments" section is empty
**Solution**:
- This is normal if no tasks are assigned yet
- Create and assign a task first
- Or use the test data script:
```bash
cd backend
node create-attendance-monitoring-test-data.js
```

### Issue: Can't see Daily Target fields in modal
**Solution**:
- Make sure you're scrolling down in the modal
- The fields are at the bottom after:
  - Work Area
  - Floor
  - Zone
  - Priority
  - Time Estimate
  - **Daily Target** ← Here

## ✅ Verification Steps

After rebuild, check these:

1. [ ] App starts without errors
2. [ ] Can login as supervisor
3. [ ] Can see "Tasks" tab in bottom navigation
4. [ ] Tapping "Tasks" shows "Task Management" screen
5. [ ] Can see "Summary Stats" at top
6. [ ] Can see "Projects" selector
7. [ ] Can see "Available Workers" section
8. [ ] Can see "Active Task Assignments" section
9. [ ] Task cards show all details including daily target
10. [ ] Can tap "Update" button
11. [ ] Modal opens with form fields
12. [ ] Can scroll down to see "Daily Target:" section
13. [ ] Can edit Quantity and Unit
14. [ ] Can save changes

## 📞 Still Having Issues?

If you still can't see the feature after rebuilding:

1. **Check the file was actually changed**:
```bash
cd ConstructionERPMobile/src/navigation
grep "EnhancedTaskManagementScreen" SupervisorNavigator.tsx
# Should show the import and usage
```

2. **Check for TypeScript errors**:
```bash
cd ConstructionERPMobile
npm run type-check
```

3. **Check the screen file exists**:
```bash
ls -la src/screens/supervisor/EnhancedTaskManagementScreen.tsx
# Should show the file
```

## 🎉 Success!

Once you see the "Active Task Assignments" section with task cards that have "Update" buttons, you're all set! The daily target feature is now accessible.

---

**Quick Command Summary**:
```bash
cd ConstructionERPMobile
npm start -- --reset-cache
# Press 'a' for Android or 'i' for iOS
```

That's it! The feature is now available. 🚀
