# Quick Guide: Finding "Update Daily Job Targets" Feature

## ✅ THE FEATURE EXISTS! Here's How to Find It:

### 📱 In the Mobile App:

```
1. Login as Supervisor
        ↓
2. Tap "Tasks" (bottom navigation)
   OR tap "Task Management" card on dashboard
        ↓
3. Scroll down to "Active Task Assignments"
        ↓
4. Find any task and tap "Update" button
        ↓
5. A modal opens: "Update Task Assignment"
        ↓
6. SCROLL DOWN in the modal ⬇️
        ↓
7. You'll see "Daily Target:" section
   with two input fields:
   ┌──────────────┬──────────────┐
   │  Quantity    │     Unit     │
   │   [  50  ]   │  [panels]    │
   └──────────────┴──────────────┘
        ↓
8. Edit the values and tap "Update"
```

## 🔍 Key Points:

1. **The feature IS implemented** - it's in the code at line ~510-520
2. **You need to SCROLL** - it's at the bottom of the update modal
3. **Only for Supervisors** - workers can't update daily targets
4. **Only for active tasks** - completed tasks can't be updated

## 📍 Exact Code Locations:

| Feature | Line Number |
|---------|-------------|
| Form Fields (UI) | ~510-520 |
| Display on Card | ~832-837 |
| State Declaration | ~1133 |
| Update Function | ~989 |
| Style Definition | ~264 |

## 🎯 What You Should See:

### In the Update Modal (scroll down to see):
```
┌─────────────────────────────────────┐
│  Update Task Assignment             │
│                                     │
│  Install Ceiling Panels - John Doe │
│                                     │
│  Work Area:                         │
│  [Zone A                         ]  │
│                                     │
│  Floor:                             │
│  [Floor 3                        ]  │
│                                     │
│  Zone:                              │
│  [North Wing                     ]  │
│                                     │
│  Priority:                          │
│  [LOW] [MEDIUM] [HIGH]              │
│                                     │
│  Time Estimate:                     │
│  [8]h [0]m                          │
│                                     │
│  Daily Target:  ← HERE IT IS!       │
│  ┌──────────┬──────────┐            │
│  │   [50]   │ [panels] │            │
│  └──────────┴──────────┘            │
│                                     │
│  [Cancel]          [Update]         │
└─────────────────────────────────────┘
```

### On the Task Card (after setting):
```
┌─────────────────────────────────────┐
│ Install Ceiling Panels              │
│ Worker: John Doe                    │
│                                     │
│ Sequence: #1                        │
│ Area: Zone A                        │
│ Floor: Floor 3                      │
│                                     │
│ Estimated: 8h 0m                    │
│ Target: 50 panels  ← SHOWS HERE     │
│                                     │
│ [Update] [Remove]                   │
└─────────────────────────────────────┘
```

## 🚨 Troubleshooting:

### "I don't see the Daily Target fields"
**Solution**: Scroll down in the update modal - they're at the bottom

### "The Update button doesn't work"
**Solution**: Make sure you're logged in as a Supervisor, not a Worker

### "I can't find the Task Management screen"
**Solution**: 
- Check bottom navigation for "Tasks" tab
- OR look for "Task Management" card on dashboard

### "The fields are there but not saving"
**Solution**: 
- Check internet connection
- Make sure both Quantity and Unit are filled
- Quantity must be a number

## ✅ Confirmation Checklist:

- [ ] Logged in as Supervisor
- [ ] On Task Management screen
- [ ] Can see "Active Task Assignments" section
- [ ] Tapped "Update" on a task
- [ ] Modal opened with task details
- [ ] Scrolled down in the modal
- [ ] Can see "Daily Target:" label
- [ ] Can see two input fields (Quantity and Unit)

If you've checked all these and still don't see it, the app might need to be rebuilt.

## 🔄 Rebuild the App:

```bash
cd ConstructionERPMobile
npm start
# Then press 'a' for Android or 'i' for iOS
```

---

**Bottom Line**: The feature is 100% implemented. You just need to:
1. Go to Task Management
2. Tap Update on any task
3. **Scroll down** in the modal
4. You'll see the Daily Target fields!
