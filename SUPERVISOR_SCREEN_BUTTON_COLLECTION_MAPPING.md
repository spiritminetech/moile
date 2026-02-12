# Supervisor Screen - Button to Collection Mapping

This document shows which button triggers which API call and which database collections are accessed.

---

## 1. Supervisor Dashboard

### Button: "Load Dashboard" / View Dashboard
- **API**: `GET /api/supervisor/dashboard`
- **Collections Used**:
  - `Project` - Get assigned projects
  - `Employee` - Get team members count
  - `Attendance` - Get today's attendance statistics
  - `WorkerTaskAssignment` - Get task completion metrics
  - `LeaveRequest` - Count pending leave approvals
  - `MaterialRequest` - Count pending material approvals
  - `ToolRequest` - Count pending tool approvals
  - `AdvancePaymentRequest` - Count pending advance approvals
  - `ReimbursementRequest` - Count pending reimbursement approvals
  - `OvertimeRequest` - Count pending overtime approvals

### Button: "View Approvals"
- **API**: `GET /api/supervisor/approvals/pending`
- **Collections Used**:
  - `LeaveRequest` - Get pending leave requests
  - `MaterialRequest` - Get pending material requests
  - `ToolRequest` - Get pending tool requests
  - `AdvancePaymentRequest` - Get pending advance requests
  - `ReimbursementRequest` - Get pending reimbursement requests
  - `OvertimeRequest` - Get pending overtime requests
  - `Employee` - Get requester details

---

## 2. Team Management Screen

### Button: "Load Team Members"
- **API**: `GET /api/supervisor/workers-assigned`
- **Collections Used**:
  - `Employee` - Get all workers in supervisor's projects
  - `Attendance` - Get today's attendance status for each worker
  - `WorkerTaskAssignment` - Get current task for each worker
  - `Project` - Get project assignments
  - `ApprovedLocation` - Get worker GPS locations and geofence status

### Button: "View Worker Details"
- **API**: `GET /api/supervisor/workers/:workerId`
- **Collections Used**:
  - `Employee` - Get worker personal information
  - `Attendance` - Get today's attendance details
  - `WorkerTaskAssignment` - Get current and recent tasks
  - `TaskProgress` - Get performance metrics
  - `EmployeeCertification` - Get certifications
  - `ToolAllocation` - Get allocated tools

### Button: "Send Message to Worker"
- **API**: `POST /api/supervisor/workers/:workerId/message`
- **Collections Used**:
  - `WorkInstruction` - Create work instruction/message
  - `Employee` - Get worker and supervisor details
  - `Project` - Get project context
  - Sends push notification to worker

### Button: "Track Worker Location"
- **API**: `GET /api/supervisor/workers/:workerId/location`
- **Collections Used**:
  - `Attendance` - Get latest GPS coordinates
  - `ApprovedLocation` - Get site boundaries
  - `Employee` - Get worker details
  - Calculates distance from site

---

## 3. Task Assignment Screen

### Button: "Load All Tasks"
- **API**: `GET /api/supervisor/tasks`
- **Collections Used**:
  - `WorkerTaskAssignment` - Get all task assignments
  - `Task` - Get task definitions
  - `Employee` - Get assigned worker details
  - `Project` - Get project information

### Button: "Create New Task"
- **API**: `POST /api/supervisor/tasks/assign`
- **Collections Used**:
  - `Task` - Create task definition
  - `WorkerTaskAssignment` - Create task assignment
  - `Employee` - Get worker details and validate skills
  - `EmployeeCertification` - Verify required certifications
  - `Material` - Link required materials
  - `Tool` - Link required tools
  - `Project` - Get project context
  - Sends notification to assigned worker(s)

### Button: "Verify Task Completion"
- **API**: `POST /api/supervisor/tasks/:taskId/verify`
- **Collections Used**:
  - `WorkerTaskAssignment` - Update verification status
  - `TaskProgress` - Get completion details and photos
  - `Employee` - Get worker details
  - `Attendance` - Verify completion location
  - Sends notification to worker (approved/rejected)

### Button: "Reassign Task"
- **API**: `PUT /api/supervisor/tasks/:taskId/reassign`
- **Collections Used**:
  - `WorkerTaskAssignment` - Update assigned worker
  - `Employee` - Get new worker details
  - Sends notifications to both old and new workers

---

## 4. Approvals Screen

### Button: "Load Pending Approvals"
- **API**: `GET /api/supervisor/approvals/pending`
- **Collections Used**:
  - `LeaveRequest` - Get pending leave requests
  - `MaterialRequest` - Get pending material requests
  - `ToolRequest` - Get pending tool requests
  - `AdvancePaymentRequest` - Get pending advance requests
  - `ReimbursementRequest` - Get pending reimbursement requests
  - `OvertimeRequest` - Get pending overtime requests
  - `Employee` - Get requester details

### Button: "Approve Leave Request"
- **API**: `POST /api/supervisor/approvals/:approvalId/process`
- **Collections Used**:
  - `LeaveRequest` - Update status to approved
  - `LeaveBalance` - Deduct leave days
  - `Employee` - Get worker details
  - `Attendance` - Mark leave dates in attendance system
  - `WorkerTaskAssignment` - Check for task conflicts
  - Sends notification to worker

### Button: "Reject Leave Request"
- **API**: `POST /api/supervisor/approvals/:approvalId/process`
- **Collections Used**:
  - `LeaveRequest` - Update status to rejected
  - `Employee` - Get worker details
  - Sends notification to worker with rejection reason

### Button: "Approve Material Request"
- **API**: `POST /api/supervisor/approvals/:approvalId/process`
- **Collections Used**:
  - `MaterialRequest` - Update status to approved
  - `Material` - Check inventory availability
  - `Project` - Verify budget
  - `Employee` - Get requester details
  - Sends notification to worker and procurement team

### Button: "Approve Tool Request"
- **API**: `POST /api/supervisor/approvals/:approvalId/process`
- **Collections Used**:
  - `ToolRequest` - Update status to approved
  - `Tool` - Check tool availability
  - `ToolAllocation` - Create tool allocation
  - `EmployeeCertification` - Verify certifications
  - `Employee` - Get worker details
  - Sends notification to worker and tool store

### Button: "Approve Overtime"
- **API**: `POST /api/supervisor/approvals/:approvalId/process`
- **Collections Used**:
  - `OvertimeRequest` - Update status to approved
  - `Attendance` - Link overtime to attendance record
  - `Employee` - Get worker details
  - `Project` - Check overtime budget
  - Sends notification to worker and payroll

### Button: "Batch Approve"
- **API**: `POST /api/supervisor/approvals/batch-process`
- **Collections Used**:
  - Multiple request collections based on selected items
  - Updates multiple records in single transaction
  - Sends notifications to all affected workers

### Button: "View Approval History"
- **API**: `GET /api/supervisor/approvals/history`
- **Collections Used**:
  - All request collections (Leave, Material, Tool, etc.)
  - Filters by status: approved/rejected
  - `Employee` - Get requester and approver details

---

## 5. Attendance Monitoring Screen

### Button: "Load Attendance Monitoring"
- **API**: `GET /api/supervisor/attendance-monitoring`
- **Collections Used**:
  - `Attendance` - Get today's attendance for all team members
  - `Employee` - Get worker details
  - `Project` - Get project assignments
  - `ApprovedLocation` - Get geofence boundaries
  - `LeaveRequest` - Get approved leave for today

### Button: "View Late Workers"
- **API**: `GET /api/supervisor/late-absent-workers`
- **Collections Used**:
  - `Attendance` - Get workers who clocked in late
  - `Employee` - Get worker details
  - `Project` - Get shift schedules
  - Calculates late duration

### Button: "View Absent Workers"
- **API**: `GET /api/supervisor/late-absent-workers`
- **Collections Used**:
  - `Employee` - Get all assigned workers
  - `Attendance` - Check who hasn't clocked in
  - `LeaveRequest` - Filter out approved leave
  - `Project` - Get expected attendance

### Button: "View Geofence Violations"
- **API**: `GET /api/supervisor/geofence-violations`
- **Collections Used**:
  - `Attendance` - Get workers with GPS outside boundaries
  - `ApprovedLocation` - Get site boundaries
  - `Employee` - Get worker details
  - Calculates distance from site

### Button: "Manual Attendance Override"
- **API**: `POST /api/supervisor/manual-attendance-override`
- **Collections Used**:
  - `Attendance` - Create or update attendance record manually
  - `Employee` - Get worker details
  - `Project` - Get project context
  - Records supervisor override reason
  - Sends notification to worker and HR

### Button: "Approve Attendance Correction"
- **API**: `POST /api/supervisor/approve-attendance-correction`
- **Collections Used**:
  - `AttendanceCorrection` - Update correction request status
  - `Attendance` - Update attendance record with corrected time
  - `Employee` - Get worker details
  - Sends notification to worker

### Button: "Refresh Attendance"
- **API**: `GET /api/supervisor/refresh-attendance`
- **Collections Used**:
  - `Attendance` - Get latest attendance data
  - `Employee` - Get worker details
  - `ApprovedLocation` - Get latest GPS locations

### Button: "Export Attendance Report"
- **API**: `GET /api/supervisor/export-report`
- **Collections Used**:
  - `Attendance` - Get attendance records for date range
  - `Employee` - Get worker details
  - `Project` - Get project information
  - `LeaveRequest` - Include leave information
  - Generates Excel/PDF report

---

## 6. Progress Report Screen

### Button: "Create Daily Report"
- **API**: `POST /api/supervisor/reports/daily`
- **Collections Used**:
  - `SupervisorDailyReport` - Create daily report
  - `WorkerTaskAssignment` - Get completed tasks
  - `Attendance` - Get manpower utilization
  - `Material` - Get material consumption
  - `Issue` - Get reported issues
  - `Project` - Get project context
  - Uploads progress photos
  - Sends report to project manager

### Button: "Load Report History"
- **API**: `GET /api/supervisor/reports/history`
- **Collections Used**:
  - `SupervisorDailyReport` - Get historical reports
  - `Project` - Get project information
  - `Employee` - Get supervisor details

---

## 7. Materials & Tools Screen

### Button: "View Pending Material Requests"
- **API**: `GET /api/supervisor/material-requests/pending`
- **Collections Used**:
  - `MaterialRequest` - Get pending requests
  - `Employee` - Get requester details
  - `Material` - Get material details
  - `Project` - Get project budget

### Button: "Acknowledge Material Delivery"
- **API**: `POST /api/supervisor/materials/acknowledge-delivery`
- **Collections Used**:
  - `MaterialDelivery` - Create delivery record
  - `MaterialRequest` - Update request status
  - `Material` - Update inventory
  - `Project` - Update material tracking
  - Uploads delivery photos and documents

### Button: "Allocate Tool"
- **API**: `POST /api/supervisor/tools/allocate`
- **Collections Used**:
  - `ToolAllocation` - Create tool allocation
  - `Tool` - Update tool status
  - `Employee` - Get worker details
  - `EmployeeCertification` - Verify certifications
  - Sends notification to worker

### Button: "Process Tool Return"
- **API**: `POST /api/supervisor/tools/return`
- **Collections Used**:
  - `ToolAllocation` - Update allocation status
  - `Tool` - Update tool status and condition
  - `Employee` - Get worker details
  - Records tool condition and maintenance needs

### Button: "View Inventory"
- **API**: `GET /api/supervisor/inventory`
- **Collections Used**:
  - `Material` - Get all materials with stock levels
  - `Tool` - Get all tools with availability
  - `Project` - Get project allocations
  - Shows low stock alerts

### Button: "Request Material Reorder"
- **API**: `POST /api/supervisor/materials/reorder-request`
- **Collections Used**:
  - `MaterialRequest` - Create reorder request
  - `Material` - Get material details
  - `Project` - Get project context
  - Sends request to procurement

---

## 8. Issue Escalation Screen

### Button: "Escalate Issue"
- **API**: `POST /api/supervisor/issue-escalation`
- **Collections Used**:
  - `IssueEscalation` - Create escalation record
  - `Issue` - Link to original issue (if applicable)
  - `Project` - Get project context
  - `Employee` - Get supervisor details
  - Uploads evidence photos
  - Sends alert to project manager/management

### Button: "View Escalation History"
- **API**: `GET /api/supervisor/issue-escalations`
- **Collections Used**:
  - `IssueEscalation` - Get escalation records
  - `Project` - Get project information
  - `Employee` - Get supervisor and resolver details
  - Filters by status and severity

---

## 9. Profile Screen

### Button: "Load Profile"
- **API**: `GET /api/supervisor/profile`
- **Collections Used**:
  - `Employee` - Get supervisor personal information
  - `User` - Get user account details
  - `Company` - Get company information
  - `Project` - Get assigned projects
  - `EmployeeCertification` - Get certifications
  - `WorkerTaskAssignment` - Calculate performance metrics

### Button: "View Team Information"
- **API**: `GET /api/supervisor/team`
- **Collections Used**:
  - `Employee` - Get team members
  - `Project` - Get project assignments
  - `Attendance` - Get team attendance statistics
  - `WorkerTaskAssignment` - Get team productivity metrics

---

## Quick Reference: Collections by Feature

### Core Supervisor Data
- `Employee` - Worker and supervisor details
- `User` - User account and authentication
- `Project` - Project assignments and details
- `Company` - Company information

### Team Management
- `Attendance` - Worker attendance tracking
- `ApprovedLocation` - Geofence boundaries and GPS
- `WorkInstruction` - Messages to workers
- `AttendanceCorrection` - Attendance correction requests

### Task Management
- `Task` - Task definitions
- `WorkerTaskAssignment` - Task assignments
- `TaskProgress` - Progress tracking
- `EmployeeCertification` - Worker certifications

### Approvals
- `LeaveRequest` - Leave applications
- `MaterialRequest` - Material requests
- `ToolRequest` - Tool requests
- `AdvancePaymentRequest` - Advance payment requests
- `ReimbursementRequest` - Reimbursement claims
- `OvertimeRequest` - Overtime requests
- `LeaveBalance` - Leave entitlements

### Resources
- `Material` - Materials and inventory
- `Tool` - Tools and equipment
- `ToolAllocation` - Tool assignments
- `MaterialDelivery` - Material deliveries

### Reporting
- `SupervisorDailyReport` - Daily progress reports
- `Issue` - Issue reports
- `IssueEscalation` - Escalated issues
- `DailyReport` - Worker daily reports

---

## Data Flow Summary

1. **Button Click** → Triggers API call
2. **API Endpoint** → Calls backend controller (supervisorController.js)
3. **Backend Controller** → Queries database collections
4. **Database Collections** → Return data
5. **Response** → Sent back to mobile app
6. **UI Update** → Display data to supervisor
7. **Notifications** → Sent to affected workers/managers
