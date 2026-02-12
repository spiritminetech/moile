# Worker Screen - Button to Collection Mapping

This document shows which button triggers which API call and which database collections are accessed.

---

## 1. Worker Dashboard

### Button: "Load Dashboard" / View Dashboard
- **API**: `GET /api/worker/dashboard`
- **Collections Used**:
  - `Employee` - Get worker personal information
  - `Attendance` - Get today's attendance status (clocked in/out)
  - `WorkerTaskAssignment` - Get today's tasks summary
  - `Project` - Get assigned project details
  - `WorkInstruction` - Get work instructions from supervisor
  - `EmployeeCertification` - Check certification expiry alerts

---

## 2. Attendance Screen

### Button: "Clock In"
- **API**: `POST /api/worker/attendance/clock-in`
- **Collections Used**:
  - `Attendance` - Create new attendance record with check-in time
  - `ApprovedLocation` - Validate worker is within geofence
  - `Employee` - Get worker details
  - `Project` - Get assigned project for attendance

### Button: "Clock Out"
- **API**: `POST /api/worker/attendance/clock-out`
- **Collections Used**:
  - `Attendance` - Update attendance record with check-out time
  - `ApprovedLocation` - Validate worker is within geofence
  - Calculate work hours (regular + overtime)

### Button: "Start Lunch Break"
- **API**: `POST /api/worker/attendance/lunch-start`
- **Collections Used**:
  - `Attendance` - Update attendance record with lunch start time

### Button: "End Lunch Break"
- **API**: `POST /api/worker/attendance/lunch-end`
- **Collections Used**:
  - `Attendance` - Update attendance record with lunch end time
  - Calculate lunch duration

### Button: "Submit Attendance Correction"
- **API**: `POST /api/worker/attendance/correction-request`
- **Collections Used**:
  - `AttendanceCorrection` - Create correction request
  - `Attendance` - Reference original attendance record
  - Sends notification to supervisor for approval

---

## 3. Today's Tasks Screen

### Button: "Load Today's Tasks"
- **API**: `GET /api/worker/tasks/today`
- **Collections Used**:
  - `WorkerTaskAssignment` - Get tasks assigned to worker for today
  - `Task` - Get task details
  - `Project` - Get project information
  - `Employee` - Get supervisor/assigner details

### Button: "View Task Details"
- **API**: `GET /api/worker/tasks/:taskId`
- **Collections Used**:
  - `WorkerTaskAssignment` - Get specific task assignment
  - `Task` - Get complete task details
  - `Project` - Get project information
  - `Employee` - Get supervisor details
  - `Material` - Get required materials
  - `Tool` - Get required tools

### Button: "Update Progress"
- **API**: `PUT /api/worker/tasks/:taskId/progress`
- **Collections Used**:
  - `WorkerTaskAssignment` - Update progress percentage
  - `TaskProgress` - Create progress log entry
  - Records GPS location and timestamp
  - Sends notification to supervisor

### Button: "Mark Complete"
- **API**: `POST /api/worker/tasks/:taskId/complete`
- **Collections Used**:
  - `WorkerTaskAssignment` - Update status to completed
  - `TaskProgress` - Create completion log
  - `Attendance` - Verify worker is clocked in
  - `ApprovedLocation` - Validate completion location
  - Sends notification to supervisor for verification

### Button: "Report Issue"
- **API**: `POST /api/worker/tasks/:taskId/report-issue`
- **Collections Used**:
  - `Issue` - Create new issue record
  - `WorkerTaskAssignment` - Link issue to task
  - `Project` - Get project context
  - Sends alert to supervisor

---

## 4. Daily Report Screen

### Button: "Submit Daily Report"
- **API**: `POST /api/worker/reports/daily`
- **Collections Used**:
  - `DailyReport` - Create daily report record
  - `WorkerTaskAssignment` - Get completed tasks for the day
  - `Material` - Record materials used
  - `Issue` - Link reported issues
  - `Attendance` - Get work hours summary
  - Sends notification to supervisor

### Button: "Load Report History"
- **API**: `GET /api/worker/reports/daily`
- **Collections Used**:
  - `DailyReport` - Get historical reports
  - `Employee` - Get worker details
  - `Project` - Get project information

---

## 5. Leave Request Screen

### Button: "Submit Leave Request"
- **API**: `POST /api/worker/requests/leave`
- **Collections Used**:
  - `LeaveRequest` - Create leave request
  - `Employee` - Get worker details and leave balance
  - `LeaveBalance` - Check available leave days
  - `LeaveType` - Get leave type details
  - Sends notification to supervisor for approval

### Button: "View Leave Balance"
- **API**: `GET /api/worker/leave/balance`
- **Collections Used**:
  - `LeaveBalance` - Get current leave balances
  - `LeaveRequest` - Get approved/pending leave requests
  - `LeaveType` - Get leave type configurations

---

## 6. Material Request Screen

### Button: "Submit Material Request"
- **API**: `POST /api/worker/requests/material`
- **Collections Used**:
  - `MaterialRequest` - Create material request
  - `Material` - Get material details
  - `Project` - Get project context
  - `Employee` - Get worker details
  - Sends notification to supervisor for approval

---

## 7. Tool Request Screen

### Button: "Submit Tool Request"
- **API**: `POST /api/worker/requests/tool`
- **Collections Used**:
  - `ToolRequest` - Create tool request
  - `Tool` - Get tool details and availability
  - `ToolAllocation` - Check current allocations
  - `EmployeeCertification` - Verify worker has required certifications
  - Sends notification to supervisor for approval

### Button: "View Allocated Tools"
- **API**: `GET /api/worker/tools/allocated`
- **Collections Used**:
  - `ToolAllocation` - Get tools currently allocated to worker
  - `Tool` - Get tool details
  - `Employee` - Get worker details

---

## 8. Advance Payment Request Screen

### Button: "Submit Advance Request"
- **API**: `POST /api/worker/requests/advance-payment`
- **Collections Used**:
  - `AdvancePaymentRequest` - Create advance request
  - `Employee` - Get worker salary and eligibility
  - `AdvancePayment` - Check existing advance balance
  - `Payroll` - Get salary information
  - Sends notification to HR/Finance for approval

---

## 9. Reimbursement Request Screen

### Button: "Submit Reimbursement Request"
- **API**: `POST /api/worker/requests/reimbursement`
- **Collections Used**:
  - `ReimbursementRequest` - Create reimbursement request
  - `Employee` - Get worker details
  - `Project` - Get project context
  - Uploads receipt images
  - Sends notification to supervisor and finance

---

## 10. Attendance History Screen

### Button: "Load Attendance History"
- **API**: `GET /api/worker/attendance/history`
- **Collections Used**:
  - `Attendance` - Get attendance records for date range
  - `Employee` - Get worker details
  - `Project` - Get project information
  - `LeaveRequest` - Get approved leave dates

### Button: "View Daily Details"
- **API**: `GET /api/worker/attendance/:date`
- **Collections Used**:
  - `Attendance` - Get specific day's attendance
  - `ApprovedLocation` - Get check-in/out locations
  - Shows GPS coordinates and work hours breakdown

---

## 11. Profile Screen

### Button: "Load Profile"
- **API**: `GET /api/worker/profile`
- **Collections Used**:
  - `Employee` - Get worker personal information
  - `User` - Get user account details
  - `Company` - Get company information
  - `EmployeeCertification` - Get certifications
  - `WorkPass` - Get work pass details
  - `EmergencyContact` - Get emergency contact info

### Button: "Update Profile Photo"
- **API**: `POST /api/worker/profile/photo`
- **Collections Used**:
  - `Employee` - Update photo URL
  - Uploads photo to storage

---

## 12. Task Location Screen

### Button: "View Task Location"
- **API**: `GET /api/worker/tasks/:taskId/location`
- **Collections Used**:
  - `WorkerTaskAssignment` - Get task location
  - `ApprovedLocation` - Get site boundary
  - `Project` - Get project location details

### Button: "Validate Geofence"
- **API**: `GET /api/worker/geofence/validate`
- **Collections Used**:
  - `ApprovedLocation` - Get approved locations
  - `Project` - Get project boundaries
  - Calculates distance from worker to site

---

## 13. Issue Reporting Screen

### Button: "Submit Issue Report"
- **API**: `POST /api/worker/issues/report`
- **Collections Used**:
  - `Issue` - Create issue record
  - `Employee` - Get worker details
  - `Project` - Get project context
  - `WorkerTaskAssignment` - Link to task (if applicable)
  - Uploads issue photos
  - Sends alert to supervisor (urgent issues get immediate notification)

---

## Quick Reference: Collections by Feature

### Core Worker Data
- `Employee` - Worker personal and employment details
- `User` - User account and authentication
- `Attendance` - Check-in/check-out records
- `WorkerTaskAssignment` - Task assignments and progress

### Task Management
- `Task` - Task definitions
- `TaskProgress` - Progress tracking logs
- `WorkInstruction` - Supervisor instructions

### Requests & Approvals
- `LeaveRequest` - Leave applications
- `MaterialRequest` - Material requests
- `ToolRequest` - Tool requests
- `AdvancePaymentRequest` - Advance payment requests
- `ReimbursementRequest` - Reimbursement claims

### Resources
- `Material` - Materials and inventory
- `Tool` - Tools and equipment
- `ToolAllocation` - Tool assignments

### Supporting Data
- `Project` - Project information
- `Company` - Company details
- `ApprovedLocation` - Geofence boundaries
- `LeaveBalance` - Leave entitlements
- `LeaveType` - Leave type configurations
- `EmployeeCertification` - Worker certifications
- `WorkPass` - Work permit details
- `Issue` - Issue reports
- `DailyReport` - Daily work reports

---

## Data Flow Summary

1. **Button Click** → Triggers API call
2. **API Endpoint** → Calls backend controller (workerController.js)
3. **Backend Controller** → Queries database collections
4. **Database Collections** → Return data
5. **Response** → Sent back to mobile app
6. **UI Update** → Display data to worker
