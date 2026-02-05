import express from 'express';
import { getAssignedWorkers,removeQueuedTask, exportReport, refreshAttendance, getSupervisorProjects,getCheckedInWorkers,getProjectTasks,getWorkerTasks ,assignTask,completeTask,getWorkerTasksForDay ,getActiveTasks, updateTaskAssignment, sendOvertimeInstructions, updateDailyTargets, getLateAbsentWorkers, sendAttendanceAlert, getGeofenceViolations, getManualAttendanceWorkers, submitManualAttendanceOverride, getAttendanceMonitoring, getDashboardData} from './supervisorController.js';
import {getTodayWorkerSubmissions,reviewWorkerProgress} from "../supervisor/submodules/supervisorReviewController.js";
const router = express.Router();
import { verifyToken } from '../../middleware/authMiddleware.js';

// Dashboard endpoint
router.get('/dashboard', getDashboardData);




// Get checked-in workers for a project
router.get('/checked-in-workers/:projectId', getCheckedInWorkers);

// Get tasks for a project
router.get('/projects/:projectId/tasks', getProjectTasks);



router.get('/projects', getSupervisorProjects);

router.get('/active-tasks/:projectId', getActiveTasks);
router.get("/worker-tasks", getWorkerTasks);
router.delete("/remove-queued-task", removeQueuedTask);




// Assign task to worker
router.post('/assign-task',verifyToken, assignTask);

// Update task assignment (modification/reassignment)
router.put('/update-assignment', verifyToken, updateTaskAssignment);

// Send overtime instructions to workers
router.post('/overtime-instructions', verifyToken, sendOvertimeInstructions);

// Update daily targets for multiple assignments
router.put('/daily-targets', verifyToken, updateDailyTargets);

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