# 🚀 DPR Quick Start - See New Fields

**3-Minute Guide to See All New Fields**

---

## ⚡ STEP 1: REBUILD (2 minutes)

```cmd
cd ConstructionERPMobile
npm start -- --clear
```

Press `a` (Android) or `i` (iOS) or `w` (Web)

**⚠️ MUST DO THIS FIRST!**

---

## 📱 STEP 2: NAVIGATE (30 seconds)

1. **Login** as supervisor
2. Tap **"Reports"** tab at bottom
3. Tap **"+ Create Report"** button

---

## 👀 STEP 3: SEE FIELDS (30 seconds)

### Scroll down to see:

**Manpower Section:**
- Look below "Efficiency %" field
- You'll see: **Overtime Hours**, **Absent Workers**, **Late Workers**

**Issues Section:**
- Tap **"Add Issue"** button
- You'll see: **Location (Optional)**, **Action Taken (Optional)**

**Materials Section:**
- Tap **"Add Material"** button
- You'll see: **Planned (Optional)**, **Wastage (Optional)**, **Notes (Optional)**

---

## ✅ QUICK TEST

Fill this sample data to verify:

**Manpower:**
- Total: 25
- Active: 23
- Productivity: 85
- Efficiency: 90
- **Overtime: 4** ← NEW
- **Absent: 2** ← NEW
- **Late: 3** ← NEW

**Add Issue:**
- Type: Safety
- Severity: High
- Description: "Worker not wearing helmet"
- **Location: "Block A, Floor 3"** ← NEW
- **Action: "Issued warning"** ← NEW

**Add Material:**
- Name: Cement
- Consumed: 50
- Remaining: 150
- Unit: bags
- **Planned: 45** ← NEW
- **Wastage: 5** ← NEW
- **Notes: "Over-ordered"** ← NEW

---

## 🎯 WHAT YOU SHOULD SEE

### Total Field Count:
- **Before:** 22 fields (67%)
- **After:** 33 fields (100%)

### New Fields (11 total):
- ✅ 3 in Manpower
- ✅ 2 in Issues
- ✅ 3 in Materials

---

## 🐛 NOT SEEING THEM?

### Did you rebuild?
```cmd
cd ConstructionERPMobile
npm start -- --clear
```

### Try hard reload:
- Shake device
- Or Cmd+D (iOS) / Cmd+M (Android)
- Select "Reload"

### Check location:
- Must be in "Create Report" screen
- Scroll down for manpower fields
- Tap "Add Issue" for issue fields
- Tap "Add Material" for material fields

---

## 📚 MORE HELP

- **DPR_NAVIGATION_GUIDE.md** - Detailed step-by-step
- **DPR_VISUAL_FIELD_MAP.md** - Visual diagrams
- **REBUILD_APP_TO_SEE_DPR_FIELDS.md** - Rebuild instructions

---

**Time to Complete:** 3 minutes  
**Difficulty:** Easy  
**Prerequisite:** App must be rebuilt first!
