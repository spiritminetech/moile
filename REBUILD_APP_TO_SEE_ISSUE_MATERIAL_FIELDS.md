# Rebuild App to See Issue & Material Fields

## ✅ Fields Are Already in the Code!

The Location, Action Taken, Planned, Wastage, and Notes fields **are already added** to the code. You just need to rebuild the app to see them.

---

## 🔄 How to Rebuild the App

### Option 1: Quick Reload (Try This First)
1. In the running Expo app, press `r` in the terminal
2. Or shake your device and tap "Reload"

### Option 2: Clear Cache and Restart
```bash
cd ConstructionERPMobile
npm start -- --clear
```

### Option 3: Full Rebuild (If above doesn't work)
```bash
cd ConstructionERPMobile
# Stop the current server (Ctrl+C)
npm start
```

---

## 📍 Where to Find the New Fields

### **Issue Modal** (Tap "Add Issue" button)
You should see these fields **in order**:
1. Issue Type
2. Description (multiline)
3. Severity
4. **Location (Optional)** ← NEW FIELD
5. **Action Taken (Optional)** ← NEW FIELD (multiline)

### **Material Modal** (Tap "Add Material" button)
You should see these fields **in order**:
1. Material Name
2. Row: Consumed | Remaining
3. Unit
4. **Row: Planned (Optional) | Wastage (Optional)** ← NEW FIELDS
5. **Notes (Optional)** ← NEW FIELD (multiline)

---

## 🔍 Verification Steps

### Test Issue Fields:
1. Navigate to Reports → Create Report
2. Scroll to "Issues & Safety Incidents"
3. Tap "Add Issue" button
4. **Scroll down in the modal** to see:
   - Location field (after Severity)
   - Action Taken field (after Location)

### Test Material Fields:
1. In the same Create Report screen
2. Scroll to "Material Consumption"
3. Tap "Add Material" button
4. **Scroll down in the modal** to see:
   - Planned and Wastage fields (after Unit)
   - Notes field (after Planned/Wastage)

---

## ⚠️ Important Notes

### The modals are scrollable!
If you don't see the fields, **scroll down inside the modal**. The new fields are at the bottom.

### Code Verification:
The fields are definitely in the code at these lines:
- **Issue Modal:** Lines 895-907 (Location & Action Taken)
- **Material Modal:** Lines 960-985 (Planned, Wastage, Notes)

---

## 🐛 If You Still Don't See Them

### 1. Check if the modal is scrollable
The modal might be too tall for your screen. Try scrolling down inside the modal.

### 2. Verify the code was saved
Check that `ProgressReportScreen.tsx` has the changes:
```bash
# Search for the new fields
grep -n "Location (Optional)" ConstructionERPMobile/src/screens/supervisor/ProgressReportScreen.tsx
grep -n "Action Taken (Optional)" ConstructionERPMobile/src/screens/supervisor/ProgressReportScreen.tsx
grep -n "Planned (Optional)" ConstructionERPMobile/src/screens/supervisor/ProgressReportScreen.tsx
```

### 3. Hard reload
- iOS: Cmd+R (simulator) or shake device → Reload
- Android: RR (emulator) or shake device → Reload

### 4. Clear Metro bundler cache
```bash
cd ConstructionERPMobile
rm -rf node_modules/.cache
npm start -- --reset-cache
```

---

## ✅ Expected Behavior After Rebuild

### Issue Modal Should Show:
```
┌─────────────────────────────┐
│ Add Issue                   │
├─────────────────────────────┤
│ Issue Type: [input]         │
│ Description: [multiline]    │
│ Severity: [input]           │
│ Location (Optional): [input]│ ← NEW
│ Action Taken (Optional):    │ ← NEW
│ [multiline input]           │
│                             │
│ [Cancel] [Add Issue]        │
└─────────────────────────────┘
```

### Material Modal Should Show:
```
┌─────────────────────────────┐
│ Add Material                │
├─────────────────────────────┤
│ Material Name: [input]      │
│ Consumed: [#] Remaining: [#]│
│ Unit: [input]               │
│ Planned: [#] Wastage: [#]   │ ← NEW
│ Notes (Optional):           │ ← NEW
│ [multiline input]           │
│                             │
│ [Cancel] [Add Material]     │
└─────────────────────────────┘
```

---

## 📱 Quick Test Script

After rebuilding, test with this data:

### Test Issue:
- Type: safety
- Description: "Scaffolding unstable"
- Severity: high
- **Location: "Block A, Floor 3"** ← Test this
- **Action Taken: "Secured with additional braces"** ← Test this

### Test Material:
- Name: "Cement"
- Consumed: 50
- Remaining: 150
- Unit: "bags"
- **Planned: 60** ← Test this
- **Wastage: 2** ← Test this
- **Notes: "High quality Portland cement"** ← Test this

---

## 🎯 Summary

**The fields ARE in the code!** You just need to:
1. Rebuild/reload the app
2. Scroll down in the modals to see the new fields
3. Test adding issues and materials with the new fields

**Status:** Code is complete ✅ | Just needs app reload 🔄

---

**Date:** February 8, 2026
**Action Required:** Rebuild the mobile app to see the new fields
