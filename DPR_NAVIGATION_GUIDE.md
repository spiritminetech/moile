# 📱 How to Navigate and See All New DPR Fields

**Complete Step-by-Step Guide**

---

## 🚀 STEP 1: REBUILD THE APP (REQUIRED FIRST!)

**Before you can see the fields, you MUST rebuild:**

```cmd
cd ConstructionERPMobile
npm start -- --clear
```

Then press `a` (Android), `i` (iOS), or `w` (Web)

⚠️ **Without rebuilding, you won't see any new fields!**

---

## 📱 STEP 2: LOGIN AS SUPERVISOR

1. Open the app
2. Enter supervisor credentials:
   - Email: `supervisor@gmail.com` (or your supervisor email)
   - Password: Your password
3. Tap **Login**

---

## 🏠 STEP 3: NAVIGATE TO PROGRESS REPORTS

### From Supervisor Dashboard:

**Option A: Bottom Tab Navigation**
- Look at the bottom of the screen
- Tap the **"Reports"** or **"Progress"** tab icon

**Option B: Main Menu**
- Tap the menu icon (☰) if available
- Select **"Progress Reports"** or **"Daily Reports"**

**Option C: Dashboard Card**
- Look for a card labeled **"Daily Progress"** or **"Reports"**
- Tap on it

---

## ➕ STEP 4: CREATE NEW REPORT

1. You should now see the **Progress Reports** screen
2. Look for a button at the top right or bottom
3. Tap **"Create Report"** or **"+ New Report"**

This opens the **Daily Progress Report Form**

---

## 📋 STEP 5: SEE MANPOWER FIELDS (7 TOTAL)

### Scroll to "👥 Manpower Utilization" Section

You should see these fields **in order**:

#### Row 1 (Side by Side):
1. **Total Workers** - Number input
2. **Active Workers** - Number input

#### Row 2 (Side by Side):
3. **Productivity %** - Number input
4. **Efficiency %** - Number input

#### Row 3 (Side by Side): ✨ NEW FIELDS
5. **Overtime Hours** ← NEW! 
6. **Absent Workers** ← NEW!

#### Row 4 (Full Width): ✨ NEW FIELD
7. **Late Workers** ← NEW!

### How to Test:
- Tap each field
- Enter a number (e.g., 25, 23, 85, 90, 4, 2, 3)
- Verify numeric keyboard appears
- All 7 fields should be visible

---

## 📊 STEP 6: SEE PROGRESS FIELDS (4 TOTAL)

### Scroll to "📊 Progress Metrics" Section

You should see:

1. **Overall Progress %** - Number input (0-100)
2. **Milestones Completed** - Number input
3. **Tasks Completed** - Number input  
4. **Total Hours Worked** - Number input

*(No new fields here - already complete)*

---

## ⚠️ STEP 7: SEE ISSUE FIELDS (7 FIELDS PER ISSUE)

### Scroll to "⚠️ Issues & Incidents" Section

1. Tap **"Add Issue"** button
2. You should see a form with these fields:

#### Existing Fields:
1. **Issue Type** - Dropdown (Safety, Quality, Delay, Resource)
2. **Severity** - Dropdown (Low, Medium, High, Critical)
3. **Description** - Multiline text (required)

#### NEW FIELDS: ✨
4. **Location (Optional)** ← NEW!
   - Text input
   - Placeholder: "e.g., Block A, Floor 3, Zone 2"
   
5. **Action Taken (Optional)** ← NEW!
   - Multiline text input
   - Placeholder: "Describe action taken..."

### How to Test:
1. Select issue type: **Safety**
2. Select severity: **High**
3. Enter description: "Worker not wearing helmet"
4. Enter location: "Block A, Floor 3" ← NEW FIELD
5. Enter action: "Issued warning and provided helmet" ← NEW FIELD
6. Tap **"Add Issue"**

### Verify Display:
After adding, the issue card should show:
- Issue type with icon (⚠️)
- Severity with color (🟠)
- Description
- **📍 Location: Block A, Floor 3** ← NEW
- **✅ Action: Issued warning and provided helmet** ← NEW

---

## 📦 STEP 8: SEE MATERIAL FIELDS (7 FIELDS PER MATERIAL)

### Scroll to "📦 Material Consumption" Section

1. Tap **"Add Material"** button
2. You should see a form with these fields:

#### Row 1 (Full Width):
1. **Material Name** - Text input (required)

#### Row 2 (Three Columns):
2. **Consumed** - Number input (required)
3. **Remaining** - Number input (required)
4. **Unit** - Dropdown (kg, t, pcs, m, m², m³, L, bags)

#### Row 3 (Two Columns): ✨ NEW FIELDS
5. **Planned (Optional)** ← NEW!
6. **Wastage (Optional)** ← NEW!

#### Row 4 (Full Width): ✨ NEW FIELD
7. **Notes (Optional)** ← NEW!
   - Multiline text input
   - Placeholder: "Additional notes about material usage..."

### How to Test:
1. Enter name: "Cement"
2. Enter consumed: "50"
3. Enter remaining: "150"
4. Select unit: "bags"
5. Enter planned: "45" ← NEW FIELD
6. Enter wastage: "5" ← NEW FIELD
7. Enter notes: "Over-ordered due to weather delay" ← NEW FIELD
8. Tap **"Add Material"**

### Verify Display:
After adding, the material card should show:
- Material name: **Cement**
- **Consumed: 50 bags | Remaining: 150 bags**
- **Planned: 45 bags** ← NEW
- **Wastage: 5 bags** ← NEW
- **Note: Over-ordered due to weather delay** ← NEW

---

## 📷 STEP 9: SEE PHOTO SECTION

### Scroll to "📷 Photo Documentation" Section

You should see:
- **Camera** button - Take new photo
- **Gallery** button - Select existing photo
- Photo thumbnails (if any added)
- Max 20 photos indicator

*(No new fields here - already complete)*

---

## 💾 STEP 10: SAVE OR SUBMIT

At the bottom of the form:

1. **Cancel** - Discard changes
2. **Save Draft** - Save without submitting
3. **Submit Report** - Finalize and send

---

## ✅ COMPLETE FIELD CHECKLIST

### Manpower Utilization (7 fields)
- [ ] Total Workers
- [ ] Active Workers
- [ ] Productivity %
- [ ] Efficiency %
- [ ] Overtime Hours ← NEW
- [ ] Absent Workers ← NEW
- [ ] Late Workers ← NEW

### Progress Metrics (4 fields)
- [ ] Overall Progress %
- [ ] Milestones Completed
- [ ] Tasks Completed
- [ ] Total Hours Worked

### Issues & Incidents (7 fields per issue)
- [ ] Issue Type
- [ ] Severity
- [ ] Status
- [ ] Description
- [ ] Location (Optional) ← NEW
- [ ] Action Taken (Optional) ← NEW

### Material Consumption (7 fields per material)
- [ ] Material Name
- [ ] Consumed
- [ ] Remaining
- [ ] Unit
- [ ] Planned (Optional) ← NEW
- [ ] Wastage (Optional) ← NEW
- [ ] Notes (Optional) ← NEW

### Photo Documentation
- [ ] Camera button
- [ ] Gallery button
- [ ] Photo preview

---

## 🔍 TROUBLESHOOTING

### "I don't see the new fields!"

**1. Did you rebuild the app?**
```cmd
cd ConstructionERPMobile
npm start -- --clear
```

**2. Try hard reload:**
- Shake device (physical)
- Or press Cmd+D (iOS) / Cmd+M (Android)
- Select "Reload"

**3. Check you're on the right screen:**
- Must be in **Progress Reports** → **Create Report**
- Not in edit mode of old report

**4. Scroll down:**
- New manpower fields are below existing ones
- Issue/material fields are in the add forms

### "I see some but not all fields!"

**Check each section separately:**
- Manpower: Scroll to see Overtime, Absent, Late
- Issues: Tap "Add Issue" to see Location and Action
- Materials: Tap "Add Material" to see Planned, Wastage, Notes

### "Fields are there but not saving!"

**Backend should be running:**
```cmd
cd backend
npm start
```

---

## 📸 VISUAL GUIDE

### What You Should See:

**Manpower Section:**
```
👥 Manpower Utilization

[Total Workers    ] [Active Workers   ]
[Productivity %   ] [Efficiency %     ]
[Overtime Hours   ] [Absent Workers   ] ← NEW ROW
[Late Workers                         ] ← NEW FIELD
```

**Issue Form:**
```
Add New Issue

Issue Type: [Safety ▼]
Severity: [High ▼]
Description: [Worker not wearing helmet...]
Location (Optional): [Block A, Floor 3] ← NEW
Action Taken (Optional): [Issued warning...] ← NEW

[Add Issue]
```

**Material Form:**
```
Add Material Consumption

Material Name: [Cement]
[Consumed] [Remaining] [Unit ▼]
[Planned ] [Wastage  ] ← NEW ROW
[Notes: Over-ordered due to...] ← NEW

[Add Material]
```

---

## 🎯 QUICK TEST SCENARIO

**Complete this to verify all fields:**

1. ✅ Rebuild app
2. ✅ Login as supervisor
3. ✅ Navigate to Progress Reports
4. ✅ Tap Create Report
5. ✅ Fill manpower: 25, 23, 85, 90, 4, 2, 3
6. ✅ Fill progress: 45, 3, 12, 184
7. ✅ Add issue with location and action
8. ✅ Add material with planned, wastage, notes
9. ✅ Add 2 photos
10. ✅ Save draft or submit

If you can complete all 10 steps, all fields are working!

---

## 📞 STILL NEED HELP?

**Check these files:**
1. **REBUILD_APP_TO_SEE_DPR_FIELDS.md** - Rebuild instructions
2. **WHY_FIELDS_NOT_VISIBLE.md** - Common issues
3. **DPR_USER_GUIDE.md** - Complete user guide

**Or verify code:**
```cmd
findstr /n "overtimeHours" ConstructionERPMobile\src\components\supervisor\ProgressReportForm.tsx
```

Should show multiple matches if code is correct.

---

**Remember:** You MUST rebuild the app first! The fields are in the code but won't show until you rebuild.

---

**Created:** February 8, 2026  
**Purpose:** Step-by-step navigation to see all new DPR fields  
**Prerequisite:** App must be rebuilt first!
