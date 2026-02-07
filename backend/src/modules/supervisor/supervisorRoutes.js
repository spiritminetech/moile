import express from 'express';
import { 
  getAssignedWorkers, 
  getSupervisorProjects,
  getCheckedInWorkers,
  getProjectTasks,
  assignTask,
  completeTask,
  getWorkerTasksForDay,
  getActiveTasks, 
  updateTaskAssignment,
  sendOvertimeInstructions,
  updateDailyTargets, 
  getLateAbsentWorkers,
  sendAttendanceAlert,
  getGeofenceViolations,
  getManualAttendanceWorkers,
  submitManualAttendanceOverride, 
  getAttendanceMonitoring,
  exportReport,
  refreshAttendance,
  getDashboardData,
  getSupervisorProfile, 
  updateSupervisorProfile,
  changeSupervisorPassword,
  uploadSupervisorPhoto, 
  supervisorUpload, 
  getPendingApprovalsSummary
} from './supervisorController.js';
import {getTodayWorkerSubmissions,reviewWorkerProgress} from "./submodules/supervisorReviewController.js";
import {
  getPendingLeaveRequests,
  approveLeaveRequest,
  getPendingAdvanceRequests,
  approveAdvanceRequest,
  getPendingMaterialRequests,
  approveMaterialRequest,
  getPendingToolRequests,
  approveToolRequest,
  escalateIssue
} from './supervisorRequestController.js';
import {
  requestMaterials,
  acknowledgeDelivery,
  returnMaterials,
  getToolUsageLog,
  logToolUsage,
  getMaterialReturns,
  getMaterialInventory
} from './supervisorMaterialsToolsController.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Dashboard endpoint
router.get('/dashboard', getDashboardData);

/**
 * Route to get pending approvals summary for dashboard
 * GET /api/supervisor/pending-approvals
 * GET /api/supervisor/approvals/pending (alias for mobile app compatibility)
 */
router.get('/pending-approvals', verifyToken, getPendingApprovalsSummary);
router.get('/approvals/pending', verifyToken, getPendingApprovalsSummary);




// Get checked-in workers for a project
router.get('/checked-in-workers/:projectId', getCheckedInWorkers);

// Get tasks for a project
router.get('/projects/:projectId/tasks', getProjectTasks);

// Get supervisor projects
router.get('/projects', getSupervisorProjects);

/**
 * ========================================
 * TASK MANAGEMENT - 4 ESSENTIAL APIs ONLY
 * ========================================
 */

/**
 * 1. Get active tasks for a project
 * GET /api/supervisor/active-tasks/:projectId
 * Returns: Task completion status with worker details
 */
router.get('/active-tasks/:projectId', getActiveTasks);

/**
 * 2. Assign tasks to workers
 * POST /api/supervisor/assign-task
 * Body: { employeeId, projectId, taskIds, date }
 */
router.post('/assign-task', verifyToken, assignTask);

/**
 * 3. Update task assignment (reassign workers, modify details)
 * PUT /api/supervisor/update-assignment
 * Body: { assignmentId, changes }
 */
router.put('/update-assignment', verifyToken, updateTaskAssignment);

/**
 * 4. Update daily targets for assignments
 * PUT /api/supervisor/daily-targets
 * Body: { assignmentUpdates: [{ assignmentId, dailyTarget }] }
 */
router.put('/daily-targets', verifyToken, updateDailyTargets);

// Send overtime instructions to workers
router.post('/overtime-instructions', verifyToken, sendOvertimeInstructions);

router.post("/complete",  completeTask);
router.get("/worker/daily",  getWorkerTasksForDay);

/**
 * Route to fetch workers assigned to a specific project
 * GET /api/supervisor/workers-assigned
 */
router.get('/workers-assigned', getAssignedWorkers);

/**
 * Route to fetch late and absent workers for a project
 * GET /api/supervisor/late-absent-workers
 */
router.get('/late-absent-workers', getLateAbsentWorkers);

/**
 * Route to send attendance alert to workers
 * POST /api/supervisor/send-attendance-alert
 */
router.post('/send-attendance-alert', verifyToken, sendAttendanceAlert);

/**
 * Route to get real-time geofence violations
 * GET /api/supervisor/geofence-violations
 */
router.get('/geofence-violations', getGeofenceViolations);

/**
 * Route to get workers for manual attendance override
 * GET /api/supervisor/manual-attendance-workers
 */
router.get('/manual-attendance-workers', getManualAttendanceWorkers);

/**
 * Route to submit manual attendance override
 * POST /api/supervisor/manual-attendance-override
 */
router.post('/manual-attendance-override', verifyToken, submitManualAttendanceOverride);

/**
 * Route to get comprehensive attendance monitoring data
 * GET /api/supervisor/attendance-monitoring
 */
router.get('/attendance-monitoring', getAttendanceMonitoring);

/**
 * Route to export the daily attendance report (CSV/PDF)
 * GET /api/supervisor/export-report
 */
router.get('/export-report', exportReport);

/**
 * Route to refresh workers' attendance data for UI updates
 * GET /api/supervisor/refresh-attendance
 */
router.get('/refresh-attendance', refreshAttendance);

router.get(
  "/projects/:projectId/worker-submissions/today",

  getTodayWorkerSubmissions
);


router.patch(
  "/worker-progress/:progressId/review",

  reviewWorkerProgress
);

/**
 * ========================================
 * REQUESTS & APPROVALS MANAGEMENT
 * ========================================
 */

/**
 * Route to get pending leave requests for supervisor's workers
 * GET /api/supervisor/pending-leave-requests
 */
router.get('/pending-leave-requests', verifyToken, getPendingLeaveRequests);

/**
 * Route to approve or reject leave request
 * POST /api/supervisor/approve-leave/:requestId
 * Body: { action: 'approve' | 'reject', remarks?: string }
 */
router.post('/approve-leave/:requestId', verifyToken, approveLeaveRequest);

/**
 * Route to get pending advance payment requests for supervisor's workers
 * GET /api/supervisor/pending-advance-requests
 */
router.get('/pending-advance-requests', verifyToken, getPendingAdvanceRequests);

/**
 * Route to approve or reject advance payment request
 * POST /api/supervisor/approve-advance/:requestId
 * Body: { action: 'approve' | 'reject', approvedAmount?: number, remarks?: string }
 */
router.post('/approve-advance/:requestId', verifyToken, approveAdvanceRequest);

/**
 * Route to get pending material requests for supervisor's projects
 * GET /api/supervisor/pending-material-requests
 */
router.get('/pending-material-requests', verifyToken, getPendingMaterialRequests);

/**
 * Route to approve or reject material request
 * POST /api/supervisor/approve-material/:requestId
 * Body: { action: 'approve' | 'reject', approvedQuantity?: number, pickupLocation?: string, pickupInstructions?: string, remarks?: string }
 */
router.post('/approve-material/:requestId', verifyToken, approveMaterialRequest);

/**
 * Route to get pending tool requests for supervisor's projects
 * GET /api/supervisor/pending-tool-requests
 */
router.get('/pending-tool-requests', verifyToken, getPendingToolRequests);

/**
 * Route to approve or reject tool request
 * POST /api/supervisor/approve-tool/:requestId
 * Body: { action: 'approve' | 'reject', approvedQuantity?: number, pickupLocation?: string, pickupInstructions?: string, remarks?: string }
 */
router.post('/approve-tool/:requestId', verifyToken, approveToolRequest);

/**
 * Route to escalate issue to manager
 * POST /api/supervisor/escalate-issue/:issueId
 * Body: { escalationReason?: string, urgency?: string, additionalNotes?: string }
 */
router.post('/escalate-issue/:issueId', verifyToken, escalateIssue);

/**
 * ========================================
 * MATERIALS & TOOLS MANAGEMENT
 * ========================================
 */

/**
 * Route to get material inventory for supervisor's projects
 * GET /api/supervisor/materials/inventory
 * Query: { projectId?: number, lowStock?: boolean }
 */
router.get('/materials/inventory', verifyToken, getMaterialInventory);

/**
 * Route to request materials or tools for a project
 * POST /api/supervisor/request-materials
 * Body: { projectId: number, requestType: 'MATERIAL' | 'TOOL', itemName: string, itemCategory?: string, quantity: number, unit?: string, urgency?: string, requiredDate: Date, purpose: string, justification?: string, specifications?: string, estimatedCost?: number }
 */
router.post('/request-materials', verifyToken, requestMaterials);

/**
 * Route to acknowledge material/tool delivery
 * POST /api/supervisor/acknowledge-delivery/:requestId
 * Body: { deliveredQuantity?: number, deliveryCondition?: string, receivedBy?: string, deliveryNotes?: string }
 */
router.post('/acknowledge-delivery/:requestId', verifyToken, acknowledgeDelivery);

/**
 * Route to process material/tool returns
 * POST /api/supervisor/return-materials
 * Body: { requestId: number, returnQuantity: number, returnReason: string, returnCondition?: string, returnNotes?: string }
 */
router.post('/return-materials', verifyToken, returnMaterials);

/**
 * Route to get tool usage log
 * GET /api/supervisor/tool-usage-log
 * Query: { projectId?: number, toolId?: number, status?: string }
 */
router.get('/tool-usage-log', verifyToken, getToolUsageLog);

/**
 * Route to log tool usage (check-out/check-in)
 * POST /api/supervisor/log-tool-usage
 * Body: { toolId: number, action: 'check_out' | 'check_in', employeeId: number, quantity?: number, condition?: string, location?: string, notes?: string }
 */
router.post('/log-tool-usage', verifyToken, logToolUsage);

/**
 * Route to get material returns history
 * GET /api/supervisor/material-returns
 * Query: { projectId?: number, startDate?: Date, endDate?: Date }
 */
router.get('/material-returns', verifyToken, getMaterialReturns);

/**
 * ========================================
 * PROFILE MANAGEMENT
 * ========================================
 */

/**
 * Route to get supervisor profile information
 * GET /api/supervisor/profile
 */
router.get('/profile', verifyToken, getSupervisorProfile);

/**
 * Route to update supervisor profile information
 * PUT /api/supervisor/profile
 * Body: { phoneNumber?: string, emergencyContact?: object, preferences?: object }
 */
router.put('/profile', verifyToken, updateSupervisorProfile);

/**
 * Route to change supervisor password
 * PUT /api/supervisor/profile/password
 * Body: { oldPassword: string, newPassword: string }
 */
router.put('/profile/password', verifyToken, changeSupervisorPassword);

/**
 * Route to upload supervisor profile photo
 * POST /api/supervisor/profile/photo
 * Body: multipart/form-data with 'photo' field
 */
router.post('/profile/photo', verifyToken, supervisorUpload.single('photo'), uploadSupervisorPhoto);

/**
 * ========================================
 * ALIAS ROUTES FOR MOBILE APP COMPATIBILITY
 * ========================================
 */

/**
 * Route to get assigned sites (alias for /projects)
 * GET /api/supervisor/assigned-sites
 * This is an alias for backward compatibility with mobile app
 */
router.get('/assigned-sites', verifyToken, getSupervisorProjects);

/**
 * Route to get team list (alias for /workers-assigned)
 * GET /api/supervisor/team-list
 * Query: { projectId: number, date?: string }
 * This is an alias for backward compatibility with mobile app
 */
router.get('/team-list', verifyToken, getAssignedWorkers);

// router.post(
//   "/supervisor/daily-progress",

//   submitDailyProgress
// );

// /**
//  * Upload site photos
//  */
// router.post(
//   "/supervisor/daily-progress/photos",

//   upload.array("photos", 10),
//   uploadDailyProgressPhotos
// );

// /**
//  * Manager / Client view (single day)
//  */
// router.get(
//   "/supervisor/daily-progress/:projectId/:date",

//   getDailyProgressByDate
// );

// /**
//  * Manager / Client view (date range)
//  */
// router.get(
//   "/supervisor/daily-progress/:projectId",
//   getDailyProgressRange
// );


export default router; 