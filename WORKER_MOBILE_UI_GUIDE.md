# Worker Mobile App - Complete UI Guide
## Understanding Your Daily Work Flow

This guide explains how the worker mobile app works from your perspective as a construction worker. It shows you what you'll see on each screen and how to complete your daily work tasks.

---

## 📱 **1. WORKER DASHBOARD - Your Home Screen**

### What You See When You Open the App

**Top Section - Today's Summary:**
- 📅 **Current Date and Day**
- ⏰ **Current Time**
- 🏗️ **Your Project Assignment**
  - Project name (e.g., "Tower A Construction")
  - Your supervisor's name
  - Site location

**Attendance Status Card:**
- If NOT clocked in:
  - 🔴 "Not Clocked In"
  - Big green button: "🕐 Clock In Now"
  - Message: "You need to clock in to start work"
  
- If clocked in:
  - 🟢 "Clocked In"
  - Clock-in time: "✅ Clocked in at: 07:00 AM"
  - Work duration: "Working for: 2h 30m"
  - Big red button: "🕐 Clock Out"

**Work Instructions Card:**
Shows important messages from your supervisor:
- 📍 "Report to Project A – Tower B, Level 5"
- 🚌 "Use company transport – Bus No. 3"
- ⚠️ "Safety briefing at 8:00 AM"
- Each instruction shows:
  - Priority badge (🔴 High / 🟡 Medium / 🟢 Low)
  - Time received
  - Sender name (Project Manager, Supervisor)

**Today's Tasks Summary:**
- 📋 Total tasks assigned: 5
- ✅ Completed: 2
- 🔄 In Progress: 2
- ⏳ Pending: 1
- Progress bar showing completion percentage

**Quick Action Cards:**

Four main action buttons:

1. **📋 View Today's Tasks**
   - See all your assigned tasks
   - Update task progress
   - Mark tasks complete

2. **🕐 Mark Attendance**
   - Clock in/out
   - Take lunch breaks
   - Record overtime

3. **📝 Submit Daily Report**
   - Report work completed
   - Log issues or problems
   - Upload work photos

4. **📄 Make Requests**
   - Request leave
   - Request materials
   - Request tools
   - Request advance payment

**Certification Alerts** (if any):
- ⚠️ "Safety Certificate expiring in 15 days"
- 🔴 "Work Pass expires on 31 Dec 2024"
- Tap to view details

**Tools & Materials Allocated:**
- Shows tools assigned to you today
- Shows materials you're responsible for
- Tap to view full list

---

## 🕐 **2. ATTENDANCE SCREEN - Clocking In and Out**

### Morning - Arriving at Site

**What You See:**
- 📅 Today's date
- ⏰ Current time
- 📍 Your current GPS location
- 🎯 GPS accuracy indicator:
  - 🟢 "Excellent" (±5-10m)
  - 🟡 "Good" (±10-30m)
  - 🔴 "Poor" (±50m+)

**Location Validation Card:**
Shows if you're at the correct location:
- ✅ "Within site boundary" (green)
  - Distance from site center: "15m from site"
  - You can clock in
  
- ❌ "Outside site boundary" (red)
  - Distance from site: "250m from site"
  - Cannot clock in
  - Message: "You must be within 100m of the site to clock in"

**Time Window Status:**
- 🟢 "On Time" (within scheduled hours)
- 🟡 "Early" (before scheduled start)
- 🔴 "Late" (after grace period)
- Shows: "Scheduled: 07:00 AM | Grace Period: 15 minutes"

**Clock In Button:**
- Big green button: "🕐 Clock In"
- Only enabled when:
  - ✅ You're within site boundary
  - ✅ GPS accuracy is good
  - ✅ You haven't already clocked in

### What Happens When You Tap "Clock In"

**Confirmation Popup:**
- "Clock in at [Site Name]?"
- Shows your GPS location
- Shows current time
- Cancel / Confirm buttons

**When You Tap "Confirm":**
- System records:
  - ✅ Clock-in time
  - ✅ GPS coordinates
  - ✅ GPS accuracy
  - ✅ Site location
- Success message: "✅ Clocked in successfully at 07:05 AM"
- Screen updates to show:
  - 🟢 "Clocked In" status
  - Work duration timer (counting up)
  - "Clock Out" button appears

**If You're Late:**
- Warning message: "You are 20 minutes late"
- System checks for:
  - Transport delay (automatic grace period)
  - Approved late arrival
  - Uninformed late (penalty may apply)
- Still allows clock-in but flags for supervisor review


### During Work - Lunch Break

**After Clocking In, You See:**
- 🟢 "Working" status
- Work duration: "2h 30m"
- Two buttons:
  - 🍽️ "Start Lunch Break"
  - 🕐 "Clock Out"

**Tap "Start Lunch Break":**
- Confirmation: "Start lunch break?"
- System records lunch start time
- Status changes to: 🟡 "On Lunch Break"
- Lunch timer starts counting
- Button changes to: "End Lunch Break"

**Tap "End Lunch Break":**
- Confirmation: "End lunch break?"
- System records lunch end time
- Calculates lunch duration (e.g., "45 minutes")
- Status changes back to: 🟢 "Working"
- Work timer resumes

**Lunch Break Rules:**
- Standard lunch: 30-60 minutes
- If longer than 60 minutes:
  - ⚠️ Warning: "Lunch break exceeded standard duration"
  - Supervisor gets notification
- Lunch time is unpaid (deducted from work hours)

### Evening - Clocking Out

**When Ready to Leave:**
- Tap "🕐 Clock Out" button
- Must be within site boundary (same as clock-in)

**Clock Out Confirmation:**
- "Clock out from [Site Name]?"
- Shows:
  - Clock-in time: 07:05 AM
  - Current time: 17:00 PM
  - Total work hours: 9h 10m
  - Lunch break: 45m
  - Net work hours: 8h 25m
- Cancel / Confirm buttons

**When You Tap "Confirm":**
- System records:
  - ✅ Clock-out time
  - ✅ GPS coordinates
  - ✅ Total work hours
  - ✅ Lunch duration
- Success message: "✅ Clocked out successfully"
- Shows summary:
  - "Today's work: 8h 25m"
  - "Regular hours: 8h"
  - "Overtime: 25m"

**If You Forgot to Clock Out:**
- Next day, you see alert:
  - ⚠️ "Forgotten Checkout Detected"
  - "You didn't clock out yesterday"
  - "Last clock-in: 07:05 AM"
  - Button: "Submit Correction Request"
- Tap button to request manual clock-out time
- Supervisor must approve

### Overtime Work

**If Working Beyond Regular Hours:**
- System detects overtime automatically
- Popup appears: "⏰ Overtime Detected"
- "You've worked 8 hours. Continue for overtime?"
- Options:
  - "Yes, Continue" - Starts overtime tracking
  - "No, Clock Out" - Regular clock-out

**If You Select "Yes, Continue":**
- Status changes to: 🟠 "Overtime"
- Overtime timer starts
- Shows: "Overtime: 1h 30m"
- Requires supervisor approval:
  - ⏳ "Pending Approval"
  - ✅ "Approved" (overtime counted)
  - ❌ "Rejected" (overtime not counted)

---

## 📋 **3. TODAY'S TASKS SCREEN - Your Daily Work**

### What You See

**Task Filter Tabs:**
- 📊 All (5)
- ⏳ Pending (1)
- 🔄 In Progress (2)
- ✅ Completed (2)

**Task List:**

Each task card shows:
- Task title: "Install steel beams - Section A"
- Priority badge:
  - 🔴 High
  - 🟡 Medium
  - 🟢 Low
- Status badge:
  - ⏳ "Not Started"
  - 🔄 "In Progress"
  - ✅ "Completed"
- Progress bar: 60% complete
- Location: "Tower B, Level 5"
- Deadline: "Due: 5:00 PM"
- Assigned by: "Supervisor: John Smith"

**Task Dependencies:**
- If task has dependencies:
  - 🔒 "Blocked" badge
  - Message: "Waiting for: Concrete pouring completion"
  - Cannot start until dependency complete

**Tap a Task Card:**
Opens task details screen


### Task Details Screen

**Task Information:**
- Full task description
- Location details with map
- Start date and deadline
- Estimated hours: "4 hours"
- Materials needed
- Tools required
- Safety requirements
- Special instructions

**Progress Section:**
- Current progress: 60%
- Progress slider (0% to 100%)
- Drag slider to update progress
- Description field: "What did you complete?"
- Notes field: "Any issues or comments?"

**Action Buttons:**

1. **📍 View Location**
   - Opens map showing task location
   - Shows distance from your current location
   - "Navigate" button to open Google Maps

2. **📊 Update Progress**
   - Opens progress update form
   - Slider to set completion percentage
   - Text fields for description and notes
   - "Submit Update" button

3. **✅ Mark Complete**
   - Only enabled when progress is 100%
   - Requires GPS location (must be at site)
   - Confirmation popup
   - Records completion time and location

4. **🚨 Report Issue**
   - Opens issue reporting form
   - Select issue type:
     - ⚠️ Safety Hazard
     - 🔧 Equipment Problem
     - 📦 Material Shortage
     - 👷 Need Assistance
     - 🔴 Emergency
   - Add description and photos
   - Sends alert to supervisor

### Updating Task Progress

**Tap "Update Progress":**

**Progress Update Form:**
1. **Progress Slider:**
   - Drag to set percentage: 0% to 100%
   - Shows current: "60%" → New: "80%"
   - Visual progress bar updates

2. **Work Description:**
   - Text box: "Describe what you completed"
   - Example: "Installed 15 steel beams in Section A"
   - Character limit: 500

3. **Notes (Optional):**
   - Text box: "Any issues or comments?"
   - Example: "Need more welding rods for tomorrow"

4. **GPS Location:**
   - Automatically captured
   - Shows: "📍 Lat: 25.2048, Lng: 55.2708"
   - Accuracy: "±8m"

**Tap "Submit Update":**
- Confirmation: "Update task progress to 80%?"
- System records:
  - ✅ New progress percentage
  - ✅ Description of work done
  - ✅ GPS location
  - ✅ Timestamp
- Success message: "✅ Progress updated successfully"
- Supervisor gets notification
- Task card updates to show new progress

### Completing a Task

**When Task is 100% Complete:**
- "✅ Mark Complete" button becomes active
- Tap button

**Completion Confirmation:**
- "Mark task as complete?"
- Shows:
  - Task name
  - Final progress: 100%
  - Your location
  - Completion time
- Requires:
  - ✅ Must be at site location
  - ✅ GPS accuracy must be good
  - ✅ All required fields filled
- Cancel / Confirm buttons

**When You Tap "Confirm":**
- System records:
  - ✅ Completion time
  - ✅ GPS location
  - ✅ Total time spent
  - ✅ Your worker ID
- Success message: "✅ Task completed successfully"
- Task moves to "Completed" tab
- Supervisor gets notification
- Next task (if any) becomes available

---

## 📝 **4. DAILY REPORT SCREEN - End of Day Report**

### What You See

**Report Header:**
- 📅 Date: Today's date
- 🏗️ Project: Your assigned project
- 👷 Worker: Your name
- ⏰ Report Time: Current time

**Report Sections:**

### 1. Tasks Completed Today

**Task List:**
- Shows all tasks you completed today
- Each task shows:
  - ✅ Task name
  - ⏰ Time spent: "3h 30m"
  - 📍 Location
  - 📊 Progress: 100%
- Auto-populated from your task updates
- Can add additional tasks manually:
  - Tap "+ Add Task"
  - Enter task description
  - Enter time spent

### 2. Work Description

**Text Field:**
- "Describe your work today in detail"
- Example: "Installed steel beams in Tower B Level 5. Completed welding of 20 joints. Prepared area for concrete pouring tomorrow."
- Character limit: 1000
- Required field

### 3. Materials Used

**Material List:**
- Shows materials allocated to you
- For each material:
  - Material name: "Steel Beams - 6m"
  - Quantity allocated: 25
  - Quantity used: 20
  - Remaining: 5
- Can add materials not in list:
  - Tap "+ Add Material"
  - Enter material name
  - Enter quantity used

### 4. Issues Encountered

**Issue List:**
- Tap "+ Add Issue" to report problems
- For each issue:
  - Issue type dropdown:
    - ⚠️ Safety Concern
    - 🔧 Equipment Malfunction
    - 📦 Material Shortage
    - 🌧️ Weather Delay
    - 👷 Manpower Issue
    - 🔴 Other
  - Description: "Welding machine overheating"
  - Severity:
    - 🟢 Low - Minor issue
    - 🟡 Medium - Needs attention
    - 🔴 High - Urgent
  - Resolution status:
    - ⏳ Pending
    - 🔄 In Progress
    - ✅ Resolved

### 5. Work Hours Summary

**Auto-calculated from attendance:**
- Clock-in time: 07:05 AM
- Clock-out time: 17:00 PM
- Lunch break: 45m
- Regular hours: 8h
- Overtime: 25m
- Total work: 8h 25m

**Can adjust if needed:**
- Tap "Edit Hours"
- Adjust start/end times
- Add reason for adjustment
- Requires supervisor approval


### 6. Photo Documentation

**Photo Section:**
- 📷 "Add Photos" button
- Can add up to 10 photos
- For each photo:
  - Take new photo or select from gallery
  - Add caption: "Steel beam installation - Section A"
  - Auto-tagged with:
    - GPS location
    - Timestamp
    - Your worker ID
- Photo preview shows after capture
- ✕ "Remove" button to delete

**Photo Categories:**
- 🏗️ Work Progress
- ✅ Completed Work
- ⚠️ Safety Issue
- 🔧 Equipment Problem
- 📦 Material Delivery
- 🔴 Incident/Accident

### Submitting Daily Report

**Bottom Buttons:**
- "💾 Save Draft" - Save without submitting
- "📤 Submit Report" - Submit to supervisor

**Tap "Submit Report":**

**Validation Check:**
- ✅ Work description filled
- ✅ At least one task listed
- ✅ Work hours recorded
- ⚠️ No photos (optional warning)

**Confirmation Popup:**
- "Submit daily report?"
- Shows summary:
  - Tasks completed: 3
  - Work hours: 8h 25m
  - Issues reported: 1
  - Photos attached: 5
- Cancel / Submit buttons

**When You Tap "Submit":**
- System records:
  - ✅ Report submission time
  - ✅ All report data
  - ✅ Photos uploaded
- Success message: "✅ Daily report submitted successfully"
- Report sent to:
  - Your supervisor
  - Project manager
  - Office admin
- Report locked (cannot edit after submission)
- Can view submitted report in history

---

## 📄 **5. REQUESTS SCREEN - Making Requests**

### What You See

**Request Type Cards:**

Five main request types:

### 1. 🏖️ Leave Request
- "Request time off for personal, medical, or emergency reasons"
- Shows your leave balance:
  - Annual Leave: 15 days remaining
  - Medical Leave: 10 days remaining
- Tap to open leave request form

### 2. 🧱 Material Request
- "Request construction materials and supplies"
- For materials you need for work
- Tap to open material request form

### 3. 🔨 Tool Request
- "Request tools and equipment for work"
- For tools not currently allocated to you
- Tap to open tool request form

### 4. 💰 Advance Payment Request
- "Request advance on your salary"
- For emergency financial needs
- Shows available advance amount
- Tap to open advance request form

### 5. 💵 Reimbursement Request
- "Request reimbursement for work expenses"
- For expenses you paid from your pocket
- Upload receipts required
- Tap to open reimbursement form

**Your Recent Requests:**
- Shows last 5 requests
- Each shows:
  - Request type icon
  - Request title
  - Status badge:
    - ⏳ Pending
    - 👀 Under Review
    - ✅ Approved
    - ❌ Rejected
  - Submission date
- Tap to view details

**"View All Requests" Button:**
- Opens request history screen
- Shows all past requests with filters

---

## 🏖️ **6. LEAVE REQUEST SCREEN**

### What You See

**Leave Balance Card:**
- 📊 Annual Leave: 15 days remaining
- 🏥 Medical Leave: 10 days remaining
- 🚨 Emergency Leave: 5 days remaining

**Leave Request Form:**

### 1. Leave Type (Required)
Select one:
- 🏖️ **Annual Leave**
  - "Planned vacation or personal time off"
  - Requires advance notice (usually 7 days)
  
- 🏥 **Medical Leave**
  - "Medical illness or health-related absence"
  - Requires medical certificate
  
- 🚨 **Emergency Leave**
  - "Urgent family or personal emergency"
  - Immediate approval process

### 2. Date Selection (Required)

**Start Date:**
- Tap calendar icon
- Select start date
- Shows: "15 Dec 2024"

**End Date:**
- Tap calendar icon
- Select end date
- Shows: "17 Dec 2024"

**Duration Calculated:**
- Shows: "3 days"
- Excludes weekends and holidays
- Updates leave balance preview:
  - "After approval: 12 days remaining"

### 3. Reason (Required)
- Text box: "Explain reason for leave"
- Example: "Family wedding in home country"
- Character limit: 500
- Be specific and honest

### 4. Supporting Documents (Optional for Annual, Required for Medical)

**Attachment Section:**
- 📎 "Add Attachment" button
- Can attach:
  - Medical certificates
  - Flight tickets
  - Emergency documents
- Multiple files allowed
- File types: PDF, JPG, PNG
- Max size: 5MB per file

**For each attachment:**
- File name shown
- File size shown
- Preview icon
- ✕ "Remove" button

### 5. Emergency Contact (For Emergency Leave)
- Contact name
- Relationship
- Phone number
- "In case we need to reach someone"


### Submitting Leave Request

**Bottom Buttons:**
- "Cancel" - Discard request
- "Submit Request" - Send to supervisor

**Tap "Submit Request":**

**Validation:**
- ✅ Leave type selected
- ✅ Dates selected
- ✅ Reason provided
- ✅ Documents attached (if required)
- ✅ Sufficient leave balance

**Confirmation:**
- "Submit leave request?"
- Shows summary:
  - Leave type: Annual Leave
  - Duration: 3 days (15-17 Dec)
  - Reason: Family wedding
  - Documents: 2 attached
- Cancel / Confirm buttons

**When You Tap "Confirm":**
- System records:
  - ✅ Request details
  - ✅ Submission time
  - ✅ Documents uploaded
- Success message: "✅ Leave request submitted"
- Request sent to:
  - Your supervisor (for approval)
  - HR department (for records)
- You receive notification when:
  - Request is reviewed
  - Request is approved/rejected
- Status shows: ⏳ "Pending Approval"

**Approval Process:**
1. Supervisor reviews request
2. Supervisor can:
   - ✅ Approve - Leave granted
   - ❌ Reject - Leave denied (with reason)
   - 💬 Request more info
3. You get notification of decision
4. If approved:
   - Leave balance updated
   - Calendar marked
   - Attendance system updated

---

## 🧱 **7. MATERIAL REQUEST SCREEN**

### What You See

**Material Request Form:**

### 1. Material Category (Required)
Select category:
- 🧱 Building Materials (cement, bricks, blocks)
- 🔩 Hardware (screws, nails, bolts)
- ⚡ Electrical (wires, switches, fixtures)
- 🚰 Plumbing (pipes, fittings, valves)
- 🎨 Finishing (paint, tiles, flooring)
- 🛡️ Safety Equipment (helmets, gloves, vests)
- 🔧 Other

### 2. Material Details (Required)

**For Each Material:**
- Material name: "Steel Beams - 6m"
- Specification: "Grade A, 6 meters length"
- Quantity needed: "25 pieces"
- Unit: "pieces" / "kg" / "liters" / "meters"
- Purpose: "Tower B Level 5 construction"

**Add Multiple Materials:**
- Tap "+ Add Another Material"
- Can request multiple items in one request

### 3. Required Date (Required)
- When do you need it?
- Calendar picker
- Shows: "18 Dec 2024"
- Urgency indicator:
  - 🟢 Normal (7+ days)
  - 🟡 Urgent (3-7 days)
  - 🔴 Critical (< 3 days)

### 4. Justification (Required)
- Text box: "Why do you need these materials?"
- Example: "Current stock depleted. Need for scheduled work on Level 5."
- Character limit: 500

### 5. Delivery Location (Required)
- Project site (auto-filled)
- Specific location: "Tower B, Level 5, Section A"
- Storage area if applicable

**Submit Button:**
- "Submit Material Request"
- Validation checks all required fields
- Sends to:
  - Supervisor (for approval)
  - Procurement team (for ordering)
  - Store keeper (for delivery)

---

## 🔨 **8. TOOL REQUEST SCREEN**

### What You See

**Currently Allocated Tools:**
- Shows tools already assigned to you
- Each tool shows:
  - Tool name: "Power Drill - Makita"
  - Tool ID: "TOOL-12345"
  - Condition: Good / Fair / Needs Repair
  - Return date: "20 Dec 2024"

**Tool Request Form:**

### 1. Tool Category (Required)
Select category:
- 🔨 Hand Tools (hammers, wrenches, screwdrivers)
- ⚡ Power Tools (drills, saws, grinders)
- 📏 Measuring Tools (levels, tape measures)
- 🛡️ Safety Equipment (harnesses, goggles)
- 🏗️ Heavy Equipment (scaffolding, ladders)
- 🔧 Specialized Tools

### 2. Tool Details (Required)

**For Each Tool:**
- Tool name: "Angle Grinder"
- Specifications: "4.5 inch, 850W"
- Quantity: "2 units"
- Brand preference (optional): "Bosch / Makita"

**Add Multiple Tools:**
- Tap "+ Add Another Tool"
- Can request multiple tools

### 3. Usage Period (Required)
- Start date: When you need it
- End date: When you'll return it
- Duration calculated: "5 days"

### 4. Purpose (Required)
- Text box: "What will you use these tools for?"
- Example: "Cutting steel reinforcement bars for Level 5 slab"
- Links to task (optional): Select from your tasks

### 5. Safety Certification
- For specialized tools:
  - ✅ "I am certified to use this tool"
  - Shows your certifications
  - If not certified:
    - ⚠️ Warning: "Certification required"
    - Cannot request without certification

**Submit Button:**
- "Submit Tool Request"
- Sends to:
  - Supervisor (for approval)
  - Tool store (for allocation)
- You get notification when:
  - Request approved
  - Tools ready for collection
  - Collection location and time

---

## 💰 **9. ADVANCE PAYMENT REQUEST SCREEN**

### What You See

**Salary Information:**
- Monthly salary: $2,500
- Last payment date: 25 Nov 2024
- Next payment date: 25 Dec 2024

**Advance Eligibility:**
- Maximum advance: $1,000 (40% of salary)
- Current advance balance: $0
- Available for advance: $1,000

**Advance Request Form:**

### 1. Amount Requested (Required)
- Enter amount: "$500"
- Slider shows percentage: 20% of salary
- Validation:
  - ❌ Cannot exceed maximum
  - ❌ Cannot request if existing advance unpaid
  - ✅ Within limits

### 2. Reason (Required)
Select reason:
- 🏥 Medical Emergency
- 👨‍👩‍👧 Family Emergency
- 🏠 Housing/Rent
- 🎓 Education Expenses
- 💳 Debt Payment
- 🔧 Other (specify)

### 3. Detailed Explanation (Required)
- Text box: "Explain your situation"
- Example: "Medical treatment for family member. Hospital requires immediate payment."
- Character limit: 500
- Be honest and specific

### 4. Repayment Plan (Required)
Select repayment option:
- 💵 Single deduction (next salary)
- 📅 2 installments (2 months)
- 📅 3 installments (3 months)
- Shows deduction amount per month

**Example:**
- Advance: $500
- Repayment: 2 installments
- Deduction: $250/month for 2 months

### 5. Supporting Documents (Optional but Recommended)
- Medical bills
- Rent receipts
- Emergency documents
- Helps approval process


**Submit Button:**
- "Submit Advance Request"
- Confirmation shows:
  - Amount: $500
  - Repayment: 2 months
  - Monthly deduction: $250
- Sends to:
  - HR department (for approval)
  - Finance team (for processing)
- Approval usually takes 2-3 days
- If approved:
  - Amount transferred to your account
  - Repayment starts next salary
  - Balance tracked in app

---

## 💵 **10. REIMBURSEMENT REQUEST SCREEN**

### What You See

**Reimbursement Request Form:**

### 1. Expense Category (Required)
Select category:
- 🚗 Transportation (taxi, fuel)
- 🍽️ Meals (work-related)
- 📱 Communication (phone, internet)
- 🏨 Accommodation (if traveling)
- 🔧 Tools/Materials (emergency purchase)
- 🏥 Medical (work injury)
- 🔧 Other

### 2. Expense Details (Required)

**For Each Expense:**
- Date of expense: Calendar picker
- Description: "Taxi from site to supplier"
- Amount: "$25.00"
- Currency: SGD / USD / AED
- Vendor/Shop: "City Taxi Service"

**Add Multiple Expenses:**
- Tap "+ Add Another Expense"
- Can claim multiple items
- Total calculated automatically

### 3. Justification (Required)
- Text box: "Why did you incur this expense?"
- Example: "Emergency trip to supplier to collect urgent materials for project deadline"
- Must be work-related
- Character limit: 500

### 4. Receipt Upload (Required)
- 📷 "Add Receipt" button
- Must upload receipt for each expense
- Can take photo or select from gallery
- Multiple receipts allowed
- Receipt must show:
  - ✅ Date
  - ✅ Amount
  - ✅ Vendor name
  - ✅ Items purchased

**For Each Receipt:**
- Photo preview
- Date and amount auto-detected (if clear)
- Can edit if auto-detection wrong
- ✕ "Remove" button

### 5. Approval Chain
- Shows who will approve:
  - 1️⃣ Your supervisor
  - 2️⃣ Finance department
- Both must approve for payment

**Submit Button:**
- "Submit Reimbursement Request"
- Validation:
  - ✅ All expenses have receipts
  - ✅ Amounts match receipts
  - ✅ Justification provided
- Sends to approval chain
- Payment processed after approval
- Usually takes 5-7 days
- Amount credited to your salary account

---

## 📊 **11. ATTENDANCE HISTORY SCREEN**

### What You See

**Calendar View:**
- Monthly calendar showing all days
- Each day color-coded:
  - 🟢 Green = Present (full day)
  - 🟡 Yellow = Late arrival
  - 🔴 Red = Absent
  - 🔵 Blue = Leave (approved)
  - ⚪ Gray = Weekend/Holiday
  - 🟠 Orange = Half day

**Month Selector:**
- Arrows to navigate: ← December 2024 →
- Tap any day to see details

**Summary Cards:**
- 📊 This Month:
  - Present: 20 days
  - Absent: 2 days
  - Late: 3 days
  - Leave: 1 day
  - Total work hours: 168h

**Filter Options:**
- Date range picker
- Session type:
  - 📊 All
  - 🕐 Regular Hours
  - ⏰ Overtime
  - 🍽️ Lunch Breaks
- Search by date

### Daily Attendance Details

**Tap Any Day:**

**Shows Complete Record:**
- 📅 Date: 15 Dec 2024
- 🕐 Clock In: 07:05 AM
  - 📍 Location: Tower B Site
  - 🎯 GPS: 25.2048, 55.2708
  - Accuracy: ±8m
  - Status: ⏰ 5 minutes late

- 🍽️ Lunch Break:
  - Start: 12:00 PM
  - End: 12:45 PM
  - Duration: 45 minutes

- 🕐 Clock Out: 17:00 PM
  - 📍 Location: Tower B Site
  - 🎯 GPS: 25.2048, 55.2710
  - Accuracy: ±6m

- ⏱️ Work Hours:
  - Total time: 9h 55m
  - Lunch break: 45m
  - Net work: 9h 10m
  - Regular: 8h
  - Overtime: 1h 10m

**Overtime Details:**
- Overtime hours: 1h 10m
- Approval status: ✅ Approved
- Approved by: Supervisor John
- Overtime rate: 1.5x

**If There Were Issues:**
- ⚠️ Late arrival: 5 minutes
- Reason: Transport delay
- Grace period applied: Yes
- Penalty: None

---

## 👤 **12. PROFILE SCREEN**

### What You See

**Profile Photo:**
- Your photo (if uploaded)
- 📷 "Change Photo" button
- Tap to take new photo or select from gallery

**Personal Information:**
- 👤 Name: Your full name
- 📧 Email: your.email@company.com
- 📱 Phone: +971 50 123 4567
- 🆔 Employee ID: EMP-12345
- 🏢 Company: ABC Construction
- 🏗️ Department: Construction
- 👷 Job Title: Carpenter
- 🌍 Nationality: Philippines

**Employment Details:**
- 📅 Join Date: 01 Jan 2023
- 📊 Employment Status: Active
- 💼 Contract Type: Full-time
- 📍 Work Location: Tower B Site

**Certifications:**

Each certification shows:
- Certificate name: "Safety Training Level 2"
- Issuer: "Ministry of Labor"
- Issue date: 15 Jan 2023
- Expiry date: 15 Jan 2025
- Status badge:
  - 🟢 Active (valid)
  - 🟡 Expiring Soon (< 30 days)
  - 🔴 Expired
- Certificate number
- 📄 "View Document" button

**Expiring Certifications Alert:**
- ⚠️ "Safety Certificate expiring in 15 days"
- Action required: "Renew before 31 Dec"
- Tap to see renewal process

**Work Pass Information:**
- Pass number: WP-123456
- Pass type: Work Permit
- Issue date: 01 Jan 2023
- Expiry date: 31 Dec 2024
- Status: 🟢 Active
- 📄 "View Pass" button

**Salary Information:**
- Monthly salary: $2,500
- Payment date: 25th of each month
- Payment method: Bank transfer
- Bank account: ****1234

**Emergency Contact:**
- Contact name: Maria Santos
- Relationship: Spouse
- Phone: +63 912 345 6789
- Address: Home country address

**Settings:**
- 🔔 Notification preferences
- 🌐 Language: English / Arabic / Filipino
- 🔐 Change password
- 📱 App version


---

## 📍 **13. TASK LOCATION SCREEN - Finding Your Work Area**

### What You See

**Map View:**
- Interactive map showing:
  - 📍 Your current location (blue dot)
  - 🎯 Task location (red pin)
  - 🔵 Site boundary (blue circle)
  - Route line connecting you to task

**Location Information Card:**
- Task location name: "Tower B, Level 5, Section A"
- Address: Full site address
- Distance from you: "150m away"
- Walking time: "2 minutes"
- GPS coordinates: 25.2048, 55.2708

**Your Current Location:**
- 📍 Current position
- 🎯 GPS accuracy: ±8m (Excellent)
- Distance to task: 150m
- Within site boundary: ✅ Yes

**Navigation Buttons:**

1. **🧭 Open in Google Maps**
   - Opens Google Maps app
   - Turn-by-turn navigation
   - Walking or driving directions

2. **🗺️ Open in Waze**
   - Opens Waze app
   - Real-time traffic updates
   - Alternative routes

3. **🍎 Open in Apple Maps** (iOS only)
   - Opens Apple Maps
   - Native iOS navigation

**Site Boundary Indicator:**
- If inside boundary:
  - ✅ "You are within the work site"
  - Green indicator
  
- If outside boundary:
  - ⚠️ "You are 250m from the work site"
  - Yellow/Red indicator
  - Distance to boundary shown

**Zoom Controls:**
- + / - buttons to zoom map
- 📍 "Center on Me" button
- 🎯 "Center on Task" button

---

## 🚨 **14. ISSUE REPORTING - Reporting Problems**

### What You See

**Issue Report Form:**

### 1. Issue Type (Required)
Select type:
- ⚠️ **Safety Hazard**
  - Unsafe conditions
  - Missing safety equipment
  - Dangerous situations
  - Priority: 🔴 High

- 🔧 **Equipment Problem**
  - Broken tools
  - Malfunctioning machinery
  - Equipment shortage
  - Priority: 🟡 Medium

- 📦 **Material Shortage**
  - Missing materials
  - Wrong materials delivered
  - Insufficient quantity
  - Priority: 🟡 Medium

- 👷 **Need Assistance**
  - Need help with task
  - Technical guidance needed
  - Additional manpower required
  - Priority: 🟢 Low

- 🔴 **Emergency**
  - Accident occurred
  - Immediate danger
  - Medical emergency
  - Priority: 🔴 Critical

### 2. Issue Description (Required)
- Text box: "Describe the issue in detail"
- Example: "Scaffolding on Level 5 is unstable and shaking. Workers afraid to use it."
- Character limit: 1000
- Be specific and clear

### 3. Location (Auto-captured)
- 📍 GPS location: Automatically recorded
- Site area: "Tower B, Level 5"
- Can manually adjust if needed

### 4. Severity Level (Required)
Select severity:
- 🟢 **Low** - Minor issue, can wait
- 🟡 **Medium** - Needs attention soon
- 🔴 **High** - Urgent, affects work
- 🚨 **Critical** - Emergency, immediate action

### 5. Photo Evidence (Highly Recommended)
- 📷 "Add Photos" button
- Can add up to 5 photos
- Photos help supervisor understand issue
- Each photo auto-tagged with:
  - GPS location
  - Timestamp
  - Your worker ID

### 6. Affected Workers (Optional)
- If issue affects others:
  - Select workers from list
  - Or enter number: "5 workers affected"

### 7. Immediate Action Taken (Optional)
- Text box: "What did you do?"
- Example: "Cordoned off area with safety tape. Informed nearby workers to avoid."

**Submit Button:**
- "🚨 Report Issue"
- For Critical/Emergency:
  - Instant notification to:
    - Supervisor
    - Safety officer
    - Site manager
  - Phone call option appears
  
- For other severities:
  - Notification to supervisor
  - Added to issue tracking system

**After Submission:**
- Issue ID generated: ISS-12345
- Status: ⏳ Reported
- You can track issue status
- Get notifications when:
  - Issue acknowledged
  - Action taken
  - Issue resolved

---

## 🔔 **15. NOTIFICATIONS SCREEN**

### What You See

**Notification Categories (Tabs):**
- 📬 All (15)
- 📋 Tasks (5)
- 🕐 Attendance (3)
- 📄 Requests (4)
- ⚠️ Alerts (3)

**Unread Badge:**
- Red circle with number: "8"
- Shows unread count

**Notification List:**

Each notification shows:
- Icon (based on type)
- Title (bold if unread)
- Message preview
- Timestamp: "2 hours ago"
- Priority indicator:
  - 🔴 High (red border)
  - 🟡 Medium (yellow border)
  - ⚪ Low (no border)

### Example Notifications:

**Task Notifications:**
1. 📋 "New Task Assigned"
   - "You have been assigned: Install steel beams - Section A"
   - "2 hours ago"
   - 🟡 Medium priority
   - Tap to view task details

2. ✅ "Task Approved"
   - "Your completed task 'Concrete pouring' has been approved"
   - "Yesterday"
   - ⚪ Low priority

**Attendance Notifications:**
3. ⏰ "Overtime Approved"
   - "Your overtime request for 15 Dec has been approved (1h 30m)"
   - "1 day ago"
   - 🟢 Approved

4. ⚠️ "Late Arrival Warning"
   - "You were 15 minutes late today. Please arrive on time."
   - "Today"
   - 🟡 Medium priority

**Request Notifications:**
5. ✅ "Leave Request Approved"
   - "Your annual leave request (15-17 Dec) has been approved"
   - "2 days ago"
   - 🟢 Approved

6. ❌ "Material Request Rejected"
   - "Your material request has been rejected. Reason: Items already allocated"
   - "3 days ago"
   - 🔴 Rejected

**Alert Notifications:**
7. ⚠️ "Certificate Expiring"
   - "Your Safety Certificate expires in 15 days. Please renew."
   - "1 week ago"
   - 🔴 High priority

8. 🚨 "Safety Alert"
   - "Safety briefing mandatory tomorrow at 8:00 AM"
   - "Today"
   - 🔴 High priority

**Actions:**
- Tap notification to view details
- Swipe left to delete
- "Mark All as Read" button at top
- Pull down to refresh

---

## 🎯 **KEY FEATURES SUMMARY**

### Location & GPS Features
- ✅ GPS-based attendance (must be at site)
- ✅ Geofence validation (within site boundary)
- ✅ GPS accuracy indicator
- ✅ Distance calculation to task locations
- ✅ Navigation integration (Google Maps, Waze)
- ✅ All actions tagged with GPS coordinates

### Attendance Management
- ✅ Clock in/out with GPS validation
- ✅ Lunch break tracking
- ✅ Overtime recording and approval
- ✅ Late arrival grace periods
- ✅ Forgotten checkout alerts
- ✅ Work hours calculation (regular vs overtime)
- ✅ Attendance history with calendar view

### Task Management
- ✅ Daily task list with priorities
- ✅ Task progress tracking (0-100%)
- ✅ Task completion with GPS verification
- ✅ Task dependencies
- ✅ Task location mapping
- ✅ Issue reporting for tasks
- ✅ Photo documentation

### Request System
- ✅ Leave requests with balance tracking
- ✅ Material requests
- ✅ Tool requests with certification check
- ✅ Advance payment requests
- ✅ Reimbursement requests with receipts
- ✅ Request status tracking
- ✅ Approval workflow visibility

### Reporting & Documentation
- ✅ Daily work reports
- ✅ Photo uploads with GPS tagging
- ✅ Issue reporting with severity levels
- ✅ Material usage tracking
- ✅ Work hours documentation
- ✅ Safety incident reporting

### Profile & Certifications
- ✅ Personal information display
- ✅ Certification tracking
- ✅ Expiry alerts
- ✅ Work pass information
- ✅ Salary information
- ✅ Emergency contacts

### Offline Support
- ✅ Works without internet
- ✅ Data syncs when online
- ✅ Offline indicator shown
- ✅ Queue actions for sync
- ✅ Cached data for viewing


---

## 📱 **SCREEN NAVIGATION FLOW**

```
Worker Dashboard (Home)
├── Attendance
│   ├── Clock In (GPS validation required)
│   ├── Start/End Lunch Break
│   ├── Clock Out (GPS validation required)
│   └── View Attendance History
│       └── Calendar view with daily details
│
├── Today's Tasks
│   ├── View Task List (All/Pending/In Progress/Completed)
│   ├── Task Details
│   │   ├── View Location (Map)
│   │   ├── Update Progress (Slider 0-100%)
│   │   ├── Mark Complete (GPS required)
│   │   └── Report Issue
│   └── Task History
│
├── Daily Report
│   ├── Tasks Completed
│   ├── Work Description
│   ├── Materials Used
│   ├── Issues Encountered
│   ├── Work Hours Summary
│   ├── Photo Documentation
│   └── Submit Report
│
├── Requests
│   ├── Leave Request
│   │   ├── Select leave type
│   │   ├── Choose dates
│   │   ├── Provide reason
│   │   ├── Attach documents
│   │   └── Submit
│   ├── Material Request
│   │   ├── Select category
│   │   ├── Specify materials
│   │   ├── Set required date
│   │   └── Submit
│   ├── Tool Request
│   │   ├── Select tools
│   │   ├── Check certification
│   │   ├── Set usage period
│   │   └── Submit
│   ├── Advance Payment
│   │   ├── Enter amount
│   │   ├── Select reason
│   │   ├── Choose repayment plan
│   │   └── Submit
│   ├── Reimbursement
│   │   ├── Enter expenses
│   │   ├── Upload receipts
│   │   ├── Provide justification
│   │   └── Submit
│   └── Request History
│       └── View all past requests with status
│
├── Profile
│   ├── Personal Information
│   ├── Certifications (with expiry alerts)
│   ├── Work Pass Details
│   ├── Salary Information
│   ├── Emergency Contact
│   └── Settings
│       ├── Change Password
│       ├── Language Selection
│       └── Notification Preferences
│
└── Notifications
    ├── All Notifications
    ├── Tasks
    ├── Attendance
    ├── Requests
    └── Alerts
```

---

## ✅ **WHAT MAKES THIS SYSTEM WORK**

### For You (Worker):
- 📱 Simple, easy-to-use interface
- 🗺️ GPS-based attendance (no buddy punching)
- 📋 Clear task assignments
- 📊 Track your own progress
- 📸 Photo documentation
- 📄 Easy request submission
- 🔔 Real-time notifications
- 📊 View your attendance history
- 💰 Track leave balance and salary

### For Your Supervisor:
- 📊 Real-time worker location tracking
- ✅ Instant task completion notifications
- 🚨 Immediate issue alerts
- 📈 Progress monitoring
- ⏰ Attendance verification
- 📋 Daily report reviews
- 👍 Quick approval process

### For The Company:
- 📊 Accurate attendance records
- ⏰ Precise work hours tracking
- 💰 Automated payroll data
- 📈 Productivity monitoring
- 🛡️ Safety compliance
- 📋 Complete audit trail
- 💼 Reduced administrative work

### For Payroll:
- ⏰ Exact work hours (regular + overtime)
- 🍽️ Lunch break deductions
- ⏰ Late arrival tracking
- 🏖️ Leave days recorded
- 💰 Advance payments tracked
- 💵 Reimbursements documented
- 📊 All data GPS-verified

---

## 🎓 **TIPS FOR WORKERS**

### Attendance Tips:
1. **Always Check GPS Signal:**
   - Wait for green GPS indicator
   - Poor GPS = cannot clock in/out
   - Move to open area if signal weak

2. **Clock In On Time:**
   - Arrive 10 minutes early
   - Grace period is 15 minutes
   - Late arrivals get flagged
   - Transport delays get automatic grace

3. **Don't Forget to Clock Out:**
   - Clock out before leaving site
   - Forgotten checkout = correction request needed
   - Supervisor must approve corrections

4. **Take Lunch Breaks Properly:**
   - Standard lunch: 30-60 minutes
   - Longer breaks get flagged
   - Lunch time is unpaid

### Task Management Tips:
1. **Update Progress Regularly:**
   - Update at least twice daily
   - Helps supervisor track work
   - Shows you're actively working

2. **Complete Tasks Properly:**
   - Must be at site location
   - Take completion photos
   - Add notes about work done

3. **Report Issues Immediately:**
   - Don't wait for problems to worsen
   - Take photos of issues
   - Safety issues = highest priority

4. **Check Task Dependencies:**
   - Some tasks can't start until others complete
   - Check task list for blocked tasks
   - Coordinate with other workers

### Request Tips:
1. **Leave Requests:**
   - Submit at least 7 days in advance
   - Attach supporting documents
   - Check leave balance first
   - Medical leave needs certificate

2. **Material/Tool Requests:**
   - Request early (not last minute)
   - Be specific about what you need
   - Explain why you need it
   - Link to your tasks

3. **Advance Payment:**
   - Only for genuine emergencies
   - Provide honest explanation
   - Attach supporting documents
   - Remember repayment deductions

4. **Reimbursements:**
   - Keep all receipts
   - Submit within 30 days
   - Must be work-related
   - Clear photos of receipts

### Daily Report Tips:
1. **Submit Every Day:**
   - Don't skip daily reports
   - Submit before leaving site
   - Include all work done
   - Take progress photos

2. **Be Detailed:**
   - Describe work clearly
   - List materials used
   - Report any issues
   - Add photos as proof

3. **Report Issues Honestly:**
   - Don't hide problems
   - Explain what went wrong
   - Suggest solutions if possible
   - Safety issues = report immediately

### General Tips:
1. **Keep Phone Charged:**
   - GPS drains battery
   - Carry power bank
   - Charge during lunch

2. **Enable Location Always:**
   - App needs location access
   - Set to "Always Allow"
   - Don't disable GPS

3. **Check Notifications:**
   - Check app daily
   - Read supervisor messages
   - Respond to urgent alerts
   - Don't ignore warnings

4. **Keep Certifications Updated:**
   - Check expiry dates
   - Renew before expiry
   - Upload new certificates
   - Expired = cannot work

5. **Take Good Photos:**
   - Clear, well-lit photos
   - Show full work area
   - Include reference points
   - Photos are proof of work

6. **Be Honest:**
   - GPS tracks everything
   - Don't try to cheat system
   - Report actual work hours
   - Honesty builds trust

---

## 🚨 **IMPORTANT REMINDERS**

### GPS & Location:
- ⚠️ **You MUST be at the site to clock in/out**
- ⚠️ **GPS must be enabled always**
- ⚠️ **System tracks your location during work hours**
- ⚠️ **Cannot fake location - system detects it**

### Attendance Rules:
- ⚠️ **Late arrivals are recorded**
- ⚠️ **Forgotten checkouts need supervisor approval**
- ⚠️ **Lunch breaks are unpaid**
- ⚠️ **Overtime needs approval**

### Task Completion:
- ⚠️ **Must be at site to complete tasks**
- ⚠️ **Photos required for completion**
- ⚠️ **Cannot complete blocked tasks**
- ⚠️ **Progress updates are monitored**

### Requests:
- ⚠️ **Leave requests need advance notice**
- ⚠️ **Medical leave needs certificate**
- ⚠️ **Advance payments have limits**
- ⚠️ **Reimbursements need receipts**

### Safety:
- ⚠️ **Report safety issues immediately**
- ⚠️ **Don't work without proper certification**
- ⚠️ **Use assigned safety equipment**
- ⚠️ **Follow all safety procedures**

---

## 📞 **GETTING HELP**

### If You Have Problems:

**Technical Issues:**
- App not working?
- GPS not accurate?
- Cannot clock in/out?
- Photos not uploading?

**Contact:**
- IT Support: +971 50 XXX XXXX
- Email: support@company.com
- Help button in app

**Work Issues:**
- Task unclear?
- Need materials?
- Safety concern?
- Need assistance?

**Contact:**
- Your Supervisor (shown in app)
- Site Manager
- Safety Officer
- Use "Report Issue" in app

**HR Issues:**
- Leave questions?
- Salary questions?
- Certificate renewal?
- Work pass issues?

**Contact:**
- HR Department: +971 50 XXX XXXX
- Email: hr@company.com
- Visit HR office

---

**This guide covers all screens and features you'll use as a worker. The system is designed to make your work easier, track your attendance accurately, and ensure you get paid correctly for all your work hours.**
