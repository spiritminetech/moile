# Worker App - Simple Guide (What Happens When You Click)

This guide explains what happens behind the scenes when you use the worker app - in simple, everyday language.

---

## 📱 1. DASHBOARD - Your Home Screen

### When you open the app:

**What you see:**
- Today's date and time
- Your project assignment
- Attendance status (Clocked In or Not)
- Today's tasks summary
- Work instructions from supervisor

**What happens behind the scenes:**
1. App checks who you are
2. App looks up which project you're assigned to
3. App checks if you've clocked in today
4. App counts your tasks
5. App gets messages from your supervisor
6. App checks if certificates are expiring soon

**Where this information comes from:**
- Your details → Employee Records
- Attendance status → Attendance Records
- Tasks → Task Assignment Records
- Project info → Project Records
- Messages → Work Instructions
- Certificates → Certification Records

---

## 🕐 2. CLOCKING IN FOR WORK

### When you tap "Clock In":

**What you see:**
- Current time
- Your GPS location
- GPS accuracy (Excellent/Good/Poor)
- "Clocked In Successfully" message

**What happens behind the scenes:**
1. App gets your GPS location
2. App checks if you're at the construction site
3. If you're within site boundary:
   - Creates attendance record
   - Records check-in time
   - Records GPS location
   - Marks you as "Present"
4. If outside boundary:
   - Shows error message
   - Shows how far you are from site

**Where this is saved:**
- Attendance Records

**Why this matters:**
- Proves you arrived at work
- Tracks work hours for salary
- Prevents fake clock-ins

---

## 🕐 3. CLOCKING OUT

### When you tap "Clock Out":

**What you see:**
- Summary of your work day
- Total work hours
- Lunch break time
- Regular hours
- Overtime

**What happens behind the scenes:**
1. App records clock-out time
2. Calculates total hours worked
3. Subtracts lunch break
4. Calculates overtime if any
5. Updates attendance record

**Where this is saved:**
- Attendance Records

---

## 📋 4. VIEWING YOUR TASKS

### When you tap "View Today's Tasks":

**What you see:**
- List of all your tasks
- Priority levels
- Progress percentages
- Deadlines
- Locations

**What happens behind the scenes:**
1. App finds all tasks assigned to you
2. Gets task details for each one
3. Checks if tasks are blocked
4. Shows tasks in priority order

**Where this comes from:**
- Task Assignment Records
- Task Records

---

## 📊 5. UPDATING TASK PROGRESS

### When you tap "Update Progress":

**What you see:**
- Progress slider
- Text boxes for description

**What happens behind the scenes:**
1. You set new progress percentage
2. You describe what you did
3. App records time and GPS
4. Updates task progress
5. Supervisor gets notification

**Where this is saved:**
- Task Progress Records

---

## ✅ 6. COMPLETING A TASK

### When you tap "Mark Complete":

**What you see:**
- Confirmation popup

**What happens behind the scenes:**
1. App checks if progress is 100%
2. Records completion time and GPS
3. Changes task status to "Completed"
4. Supervisor gets notification for verification

**Where this is saved:**
- Task Assignment Records

---

## � 7. REPORTING AN ISSUE

### When you tap "Report Issue":

**What you see:**
- Issue type selection
- Severity level
- Description box
- Photo upload

**What happens behind the scenes:**
1. You select issue type and severity
2. You describe and photograph issue
3. Creates issue report
4. Uploads photos
5. Sends alert to supervisor

**Where this is saved:**
- Issue Records

---

## 📝 8. SUBMITTING DAILY REPORT

### When you tap "Submit Daily Report":

**What you see:**
- Form with multiple sections

**What happens behind the scenes:**
1. System auto-fills some information
2. You add work description and photos
3. Report is saved and sent to supervisor
4. Report is locked after submission

**Where this is saved:**
- Daily Report Records

---

## 🏖️ 9. REQUESTING LEAVE

### When you tap "Submit Leave Request":

**What you see:**
- Leave type selection
- Date picker
- Reason box
- Leave balance

**What happens behind the scenes:**
1. You select dates and type reason
2. System checks leave balance
3. Creates leave request
4. Sends to supervisor for approval

**Where this is saved:**
- Leave Request Records

---

## 🧱 10. REQUESTING MATERIALS

### When you tap "Submit Material Request":

**What you see:**
- Material details form

**What happens behind the scenes:**
1. You enter material details
2. Creates material request
3. Sends to supervisor and procurement

**Where this is saved:**
- Material Request Records

---

## 🔨 11. REQUESTING TOOLS

### When you tap "Submit Tool Request":

**What you see:**
- Tool details form

**What happens behind the scenes:**
1. You enter tool details
2. System checks your certifications
3. Creates tool request
4. Sends to supervisor

**Where this is saved:**
- Tool Request Records

---

## � 12. REQUESTING ADVANCE PAYMENT

### When you tap "Submit Advance Request":

**What you see:**
- Salary information
- Amount slider
- Repayment options

**What happens behind the scenes:**
1. System shows eligibility
2. You enter amount and reason
3. Creates advance request
4. Sends to HR for approval

**Where this is saved:**
- Advance Payment Request Records

---

## 💵 13. REQUESTING REIMBURSEMENT

### When you tap "Submit Reimbursement Request":

**What you see:**
- Expense details form
- Receipt upload

**What happens behind the scenes:**
1. You enter expense details
2. Upload receipt photo
3. Creates reimbursement request
4. Sends to supervisor and finance

**Where this is saved:**
- Reimbursement Request Records

---

## 📊 14. VIEWING ATTENDANCE HISTORY

### When you tap "Attendance History":

**What you see:**
- Calendar with color-coded days
- Summary statistics

**What happens behind the scenes:**
1. App gets all your attendance records
2. Color-codes each day
3. Calculates summary

**Where this comes from:**
- Attendance Records

---

## 👤 15. VIEWING YOUR PROFILE

### When you tap "Profile":

**What you see:**
- Personal information
- Certifications
- Work pass details

**What happens behind the scenes:**
1. System loads your complete profile
2. Checks for expiring certificates
3. Shows warning badges if needed

**Where this comes from:**
- Employee Records
- Certification Records

---

## 🔔 NOTIFICATIONS

You receive notifications when:
- New task assigned
- Task deadline approaching
- Supervisor sends message
- Leave approved/rejected
- Material/Tool approved
- Certificate expiring soon

---

## ⚠️ ERROR MESSAGES

**"You must be at site to clock in"**
- Move closer to construction site

**"GPS accuracy too low"**
- Move to open area for better signal

**"You must clock in first"**
- Clock in before updating tasks

**"Insufficient leave balance"**
- Check your leave balance

---

## 📋 QUICK REFERENCE

| Action | What Gets Saved |
|--------|----------------|
| Clock In | Time, GPS location |
| Clock Out | Time, total hours |
| Update Task | Progress, description |
| Complete Task | Completion time, GPS |
| Report Issue | Issue details, photos |
| Submit Report | Work description, photos |
| Request Leave | Dates, reason |
| Request Material | Material details |
| Request Tool | Tool details |
| Request Advance | Amount, reason |

---

**Remember: The app records everything to ensure accurate payment and track your work!**
