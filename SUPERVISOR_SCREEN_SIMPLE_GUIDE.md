# Supervisor App - Simple Guide (What Happens When You Click)

This guide explains what happens behind the scenes when you use the supervisor app - in simple, everyday language.

---

## 📱 1. DASHBOARD - Your Command Center

### When you open the app:

**What you see:**
- Your projects
- Team attendance summary
- Task completion metrics
- Pending approvals count
- Workforce alerts

**What happens behind the scenes:**
1. App checks who you are
2. App finds all projects you supervise
3. App counts team members and their status
4. App counts completed vs pending tasks
5. App counts pending approvals
6. App checks for late/absent workers
7. App displays all metrics

**Where this information comes from:**
- Projects → Project Records
- Team members → Employee Records
- Attendance → Attendance Records
- Tasks → Task Assignment Records
- Approvals → Various Request Records

---

## 👥 2. VIEWING YOUR TEAM

### When you tap "Team Management":

**What you see:**
- List of all workers in your projects
- Each worker shows:
  - Name and photo
  - Attendance status (Present/Absent/Late)
  - Current task
  - GPS location status

**What happens behind the scenes:**
1. App finds all workers in your projects
2. For each worker, app gets:
   - Personal details
   - Today's attendance status
   - Current task assignment
   - GPS location
   - Distance from site
3. App checks if worker is inside or outside site boundary
4. App displays workers with color-coded status

**Where this information comes from:**
- Worker details → Employee Records
- Attendance → Attendance Records
- Tasks → Task Assignment Records
- GPS locations → Attendance Records
- Site boundaries → Approved Location Records

---

## 📞 3. SENDING MESSAGE TO WORKER

### When you tap "Send Message":

**What you see:**
- Message type selection
- Text box
- Priority level

**What happens behind the scenes:**
1. You select message type (Regular/Notification/Alert)
2. You type your message
3. You select priority level
4. When you tap "Send":
   - System creates work instruction
   - Message is saved
   - Worker receives notification immediately
   - If urgent, worker's phone rings/vibrates
5. Message appears in worker's app

**Where this is saved:**
- Work Instructions

**Why this matters:**
- Quick communication with workers
- Creates record of instructions
- Urgent messages get immediate attention

---

## 📋 4. CREATING NEW TASK

### When you tap "Create New Task":

**What you see:**
- Task creation form with multiple sections

**What happens behind the scenes:**
1. You fill in task details:
   - Task name and description
   - Select worker(s)
   - Set priority and deadline
   - Specify location
   - List required materials and tools
   - Add safety requirements
2. System checks:
   - Does worker have required skills?
   - Does worker have required certifications?
   - Is worker available?
3. When you tap "Assign Task":
   - System creates task record
   - System creates task assignment
   - Worker receives notification immediately
   - Task appears in worker's app
4. You can track task progress in real-time

**Where this is saved:**
- Task Records
- Task Assignment Records

**What gets checked:**
- Worker certifications → Certification Records
- Worker availability → Task Assignment Records

---

## ✅ 5. VERIFYING TASK COMPLETION

### When worker marks task complete:

**What you see:**
- Notification: "Worker completed task"
- Task shows "Pending Verification"

### When you tap "Verify Completion":

**What you see:**
- Task details
- Worker's completion report
- Photos uploaded by worker
- GPS location of completion
- Time taken vs estimated

**What happens behind the scenes:**
1. System shows all completion details
2. You review:
   - Work description
   - Photos
   - Location (was worker at site?)
   - Time taken
3. You decide:
   - **Approve**: Task officially complete
   - **Reject**: Task returns to worker with comments
   - **Request More Info**: Ask for clarification
4. When you approve:
   - Task status changes to "Completed"
   - Worker gets confirmation
   - Productivity metrics updated
5. When you reject:
   - Task returns to "In Progress"
   - Worker gets notification with reason
   - Worker must fix and resubmit

**Where this is saved:**
- Task Assignment Records (status updated)

---

## 📄 6. REVIEWING APPROVALS

### When you tap "View Approvals":

**What you see:**
- List of pending requests:
  - Leave requests
  - Material requests
  - Tool requests
  - Overtime requests
  - Advance payment requests
  - Reimbursement requests
- Each shows urgency level

**What happens behind the scenes:**
1. App finds all pending requests from your team
2. For each request, app gets:
   - Requester details
   - Request type and details
   - Submission date
   - Urgency level
3. App sorts by urgency (urgent first)
4. App displays count of each type

**Where this information comes from:**
- Leave Request Records
- Material Request Records
- Tool Request Records
- Overtime Request Records
- Advance Payment Request Records
- Reimbursement Request Records

---

## 🏖️ 7. APPROVING LEAVE REQUEST

### When you tap on a leave request:

**What you see:**
- Worker details
- Leave type (Annual/Medical/Emergency)
- Dates requested
- Reason
- Supporting documents
- Worker's leave balance
- Impact on current tasks

**What happens behind the scenes:**
1. System shows complete request details
2. System checks:
   - Worker's current leave balance
   - Worker's current tasks
   - Team availability during those dates
   - Project deadlines
3. You decide: Approve or Reject

### If you tap "Approve":
1. System updates leave request status to "Approved"
2. System deducts days from worker's leave balance
3. System marks dates in attendance calendar
4. System checks worker's tasks:
   - If tasks scheduled during leave, may need reassignment
5. Worker receives approval notification
6. HR department gets notification

### If you tap "Reject":
1. You must provide reason
2. System updates status to "Rejected"
3. Worker receives notification with reason
4. Leave balance unchanged

**Where this is saved:**
- Leave Request Records (status updated)
- Leave Balance Records (if approved)
- Attendance Records (leave dates marked)

---

## 🧱 8. APPROVING MATERIAL REQUEST

### When you tap on a material request:

**What you see:**
- Worker details
- Materials requested
- Quantities
- Required date
- Purpose/justification
- Estimated cost
- Current inventory status
- Project budget status

**What happens behind the scenes:**
1. System shows request details
2. System checks:
   - Current inventory (do we have it?)
   - Project budget (can we afford it?)
   - Request justification (is it needed?)
3. You decide: Approve, Reject, or Modify

### If you tap "Approve":
1. System updates request status to "Approved"
2. Request forwarded to:
   - Procurement team (to order)
   - Store keeper (to prepare delivery)
3. Worker receives approval notification
4. When materials delivered, you acknowledge delivery

### If you tap "Reject":
1. You provide reason
2. Worker receives notification
3. Can discuss alternative solutions

**Where this is saved:**
- Material Request Records (status updated)

---

## 🔨 9. APPROVING TOOL REQUEST

### When you tap on a tool request:

**What you see:**
- Worker details
- Tools requested
- Usage period
- Purpose
- Worker's certifications
- Tool availability

**What happens behind the scenes:**
1. System shows request details
2. System checks:
   - Does worker have required certification?
   - Are tools available?
   - Is usage period reasonable?
3. You decide: Approve or Reject

### If you tap "Approve":
1. System updates request status
2. System creates tool allocation
3. Tool status changes to "Allocated"
4. Worker receives notification to collect tool
5. Tool store prepares tool for collection
6. Return date is tracked

### If you tap "Reject":
1. You provide reason (e.g., "Need certification first")
2. Worker receives notification

**Where this is saved:**
- Tool Request Records (status updated)
- Tool Allocation Records (if approved)
- Tool Records (status updated)

---

## ⏰ 10. APPROVING OVERTIME

### When you tap on overtime request:

**What you see:**
- Worker details
- Date and hours requested
- Reason for overtime
- Worker's overtime this week/month
- Project overtime budget

**What happens behind the scenes:**
1. System shows request details
2. System checks:
   - Worker's total overtime this month
   - Project overtime budget remaining
   - Justification for overtime
3. You decide: Approve or Reject

### If you tap "Approve":
1. System updates request status
2. Overtime hours linked to attendance record
3. Worker can work overtime hours
4. Overtime counted for payroll (usually 1.5x pay)
5. Worker receives approval notification

### If you tap "Reject":
1. Worker must clock out at regular time
2. Worker receives notification with reason

**Where this is saved:**
- Overtime Request Records (status updated)
- Attendance Records (overtime linked)

---

## 🕐 11. MONITORING ATTENDANCE

### When you tap "Monitor Attendance":

**What you see:**
- Real-time attendance dashboard
- Present workers (green)
- Late workers (yellow)
- Absent workers (red)
- Workers outside geofence (orange)

**What happens behind the scenes:**
1. App gets today's attendance for all team members
2. For each worker, app checks:
   - Have they clocked in?
   - Were they on time?
   - Are they at site (GPS check)?
   - Are they on approved leave?
3. App categorizes workers:
   - Present and on-time
   - Present but late
   - Absent without leave
   - Absent with approved leave
   - Outside site boundary
4. App displays real-time status
5. Updates every few minutes

**Where this information comes from:**
- Attendance Records
- Employee Records
- Leave Request Records
- Approved Location Records (for geofence)

---

## 📍 12. CHECKING GEOFENCE VIOLATIONS

### When you tap "Geofence Violations":

**What you see:**
- List of workers outside site boundary
- Each shows:
  - Worker name
  - Distance from site
  - Last GPS update time
  - Current status

**What happens behind the scenes:**
1. App gets GPS location of all clocked-in workers
2. App gets site boundary coordinates
3. For each worker, app calculates:
   - Distance from site center
   - Is worker inside or outside boundary?
4. App lists workers outside boundary
5. Shows how far they are from site

**What you can do:**
- Call worker to check situation
- Send alert message
- View worker's location on map

**Where this information comes from:**
- Attendance Records (GPS locations)
- Approved Location Records (site boundaries)

---

## ✏️ 13. MANUAL ATTENDANCE OVERRIDE

### When you tap "Manual Attendance Override":

**What you see:**
- Worker selection
- Date selection
- Time entry fields
- Reason text box

**What happens behind the scenes:**
1. You select worker and date
2. You enter clock-in and clock-out times
3. You provide reason for manual entry
4. When you tap "Submit":
   - System creates or updates attendance record
   - Records that you (supervisor) made manual entry
   - Records reason for override
   - Worker receives notification
   - HR department gets notification
5. Manual entry is flagged for audit

**Where this is saved:**
- Attendance Records (with supervisor override flag)

**Why this is needed:**
- Worker forgot to clock in/out
- GPS/app issues
- Emergency situations
- Attendance corrections

---

## ✅ 14. APPROVING ATTENDANCE CORRECTION

### When worker requests attendance correction:

**What you see:**
- Worker's correction request
- Original attendance record
- Requested changes
- Reason for correction
- GPS history (if available)

**What happens behind the scenes:**
1. System shows original vs requested times
2. System shows GPS history to verify
3. You review:
   - Is request reasonable?
   - Does GPS history support it?
   - Is reason valid?
4. You decide: Approve or Reject

### If you tap "Approve":
1. Attendance record is updated
2. Corrected times are saved
3. Work hours recalculated
4. Worker receives confirmation

### If you tap "Reject":
1. Original record remains unchanged
2. Worker receives notification with reason

**Where this is saved:**
- Attendance Correction Records (status updated)
- Attendance Records (if approved)

---

## 📊 15. CREATING DAILY REPORT

### When you tap "Create Daily Report":

**What you see:**
- Report form with sections:
  - Work summary
  - Manpower utilization
  - Task progress
  - Material consumption
  - Issues encountered
  - Photo documentation

**What happens behind the scenes:**
1. System auto-fills some information:
   - Team attendance statistics
   - Tasks completed today
   - Work hours
2. You add:
   - Work summary description
   - Materials used
   - Issues faced
   - Photos of progress
3. When you tap "Submit":
   - System saves complete report
   - Photos are uploaded
   - Report sent to:
     - Project manager
     - Office admin
     - Management
   - Report is locked (cannot edit)
4. Report available in history

**Where this is saved:**
- Supervisor Daily Report Records

---

## 🧱 16. ACKNOWLEDGING MATERIAL DELIVERY

### When materials are delivered:

**What you see:**
- Delivery notification
- Order details
- Expected vs received quantities

### When you tap "Acknowledge Delivery":

**What you see:**
- Delivery verification form
- Checklist of materials
- Quality check questions
- Photo upload

**What happens behind the scenes:**
1. You verify each material:
   - Quantity correct?
   - Quality acceptable?
   - Any damage?
2. You take photos of:
   - Delivered materials
   - Delivery note
   - Any damage
3. When you tap "Confirm":
   - System records delivery
   - Material request status updated
   - Inventory updated
   - Photos uploaded
   - Worker who requested gets notification
   - Procurement team gets confirmation

### If there's a problem:
1. You tap "Report Issue"
2. Select issue type (shortage/damage/wrong items)
3. Add photos and description
4. Issue escalated to procurement

**Where this is saved:**
- Material Delivery Records
- Material Request Records (status updated)
- Material Records (inventory updated)

---

## 🔧 17. ALLOCATING TOOLS

### When you tap "Allocate Tool":

**What you see:**
- Tool selection
- Worker selection
- Return date picker
- Purpose text box

**What happens behind the scenes:**
1. You select tool from available tools
2. You select worker
3. You set return date
4. System checks worker's certifications
5. When you tap "Confirm":
   - System creates tool allocation
   - Tool status changes to "Allocated"
   - Worker receives notification
   - Tool store prepares tool
   - Return date is tracked
6. If tool not returned on time:
   - System sends reminder to worker
   - You get notification

**Where this is saved:**
- Tool Allocation Records
- Tool Records (status updated)

---

## 📥 18. PROCESSING TOOL RETURN

### When worker returns tool:

**What you see:**
- Tool details
- Allocation details
- Condition checklist
- Photo upload

**What happens behind the scenes:**
1. You inspect tool condition
2. You check:
   - All parts present?
   - Any damage?
   - Needs maintenance?
3. You take photo of tool
4. When you tap "Confirm Return":
   - Tool allocation status updated to "Returned"
   - Tool status changes to "Available" (or "Maintenance" if damaged)
   - Worker's tool list updated
   - Tool available for next allocation

**Where this is saved:**
- Tool Allocation Records (status updated)
- Tool Records (status and condition updated)

---

## 🚨 19. ESCALATING ISSUES

### When you tap "Escalate Issue":

**What you see:**
- Issue escalation form
- Issue type selection
- Severity level
- Description box
- Photo upload

**What happens behind the scenes:**
1. You select issue type (Manpower/Safety/Material/Equipment)
2. You select severity (Low/Medium/High/Critical)
3. You describe the issue
4. You upload photos
5. You select who to escalate to (Project Manager/Admin/Management)
6. When you tap "Submit":
   - System creates escalation record
   - Photos uploaded
   - If Critical:
     - Recipient gets phone call alert
     - SMS sent
     - Email sent
   - If High:
     - Urgent notification sent
   - Issue tracked until resolved
7. You receive tracking number

**Where this is saved:**
- Issue Escalation Records

**Why this is needed:**
- Problems beyond your authority
- Safety emergencies
- Resource shortages
- Major delays

---

## 📊 20. VIEWING TEAM PERFORMANCE

### When you tap "Team Performance":

**What you see:**
- Team statistics:
  - Task completion rate
  - Average productivity
  - On-time performance
  - Attendance rate
- Individual worker metrics
- Comparison charts

**What happens behind the scenes:**
1. System analyzes data for selected period
2. Calculates metrics:
   - Tasks completed vs assigned
   - Average time per task
   - Late arrivals count
   - Absent days
   - Overtime hours
3. Generates charts and graphs
4. Ranks workers by performance

**Where this information comes from:**
- Task Assignment Records
- Task Progress Records
- Attendance Records

---

## 🔔 NOTIFICATIONS - What Triggers Them

You receive notifications when:

1. **Worker completes task**
   - Needs your verification

2. **New approval request**
   - Worker submits request

3. **Worker reports issue**
   - Especially urgent/safety issues

4. **Worker is late/absent**
   - Attendance alerts

5. **Geofence violation**
   - Worker outside site boundary

6. **Tool overdue**
   - Worker hasn't returned tool

7. **Material delivered**
   - Needs your acknowledgment

8. **Management escalation response**
   - Your escalated issue resolved

---

## ⚠️ ERROR MESSAGES - What They Mean

**"Worker not certified for this tool"**
- Worker needs certification before using tool
- Reject request or arrange training

**"Insufficient project budget"**
- Material cost exceeds remaining budget
- Reject or modify request

**"Worker has pending tasks"**
- Worker already has too many tasks
- Consider workload before assigning more

**"Leave conflicts with project deadline"**
- Worker's leave overlaps critical deadline
- Discuss with worker or reject

---

## 💾 DATA STORAGE - Where Everything is Kept

Think of the system like a filing cabinet:

**Employee Records:**
- All worker details
- Your team members

**Attendance Records:**
- Clock-in/out times
- GPS locations
- Work hours

**Task Assignment Records:**
- All task assignments
- Progress tracking
- Completion status

**Request Records:**
- Leave requests
- Material requests
- Tool requests
- Overtime requests
- Advance requests
- Reimbursement requests

**Approval History:**
- All your approval decisions
- Reasons for rejection
- Approval timestamps

**Tool Allocation Records:**
- Tool assignments
- Return dates
- Tool conditions

**Material Delivery Records:**
- Delivery confirmations
- Quality checks
- Photos

**Issue Escalation Records:**
- Escalated problems
- Resolution status

---

## 🔄 REAL-TIME UPDATES

### How information stays current:

**When you approve request:**
1. Your app updates immediately
2. Information sent to server
3. Worker's app updates (sees approval)
4. Relevant systems updated (inventory, payroll, etc.)

**When worker updates task:**
1. Worker's app sends update
2. Server processes update
3. Your app receives notification
4. Dashboard metrics update

**When worker clocks in:**
1. Worker's app sends attendance
2. Server records attendance
3. Your attendance monitor updates
4. Team statistics recalculate

---

## 🔐 SECURITY AND PRIVACY

**Your Authority:**
- Can only see workers in your projects
- Can only approve requests from your team
- Cannot access other supervisors' data

**Worker Privacy:**
- GPS only tracked during work hours
- Personal information protected
- Salary details confidential

**Approval Records:**
- All decisions are logged
- Cannot delete approval history
- Audit trail maintained

---

## 📱 OFFLINE MODE

**You can still:**
- View data already loaded
- Take photos
- Draft reports

**You cannot:**
- Approve requests
- Assign tasks
- Send messages
- View real-time attendance

**When connection returns:**
- App syncs automatically
- Pending actions processed

---

## 🎯 SUMMARY - The Big Picture

**As a supervisor, the app helps you:**

1. **Monitor your team** - Real-time attendance and location
2. **Assign work** - Create and track tasks
3. **Approve requests** - Leave, materials, tools, overtime
4. **Track progress** - See task completion in real-time
5. **Manage resources** - Tools and materials
6. **Report to management** - Daily reports and escalations
7. **Ensure safety** - Monitor geofence, report issues

**Remember:**
- Check attendance daily
- Respond to approvals promptly
- Verify task completions
- Monitor geofence violations
- Submit daily reports
- Escalate serious issues

---

## 📋 QUICK REFERENCE

| Action | What Gets Saved |
|--------|----------------|
| Assign Task | Task record, assignment |
| Verify Completion | Task status updated |
| Approve Leave | Leave status, balance updated |
| Approve Material | Request status, forwarded to procurement |
| Approve Tool | Tool allocation created |
| Approve Overtime | Overtime linked to attendance |
| Manual Attendance | Attendance record with override flag |
| Acknowledge Delivery | Delivery record, inventory updated |
| Allocate Tool | Tool allocation, status updated |
| Process Return | Allocation closed, tool available |
| Escalate Issue | Escalation record created |
| Send Message | Work instruction created |

---

**Remember: You're the bridge between workers and management - the app helps you manage your team effectively and keep projects on track!**
