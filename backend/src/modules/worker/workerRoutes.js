// routes/workerRoutes.js
import express from "express";
import { 
  getWorkerTodayTrip, 
  getWorkerTodayTask, 
  getWorkerTasksToday, 
  getWorkerTaskDetails,
  validateWorkerGeofence, 
  startWorkerTask, 
  startWorkerTaskById,
  submitWorkerTaskProgress, 
  updateWorkerTaskProgress,
  completeWorkerTask,
  pauseWorkerTask,
  resumeWorkerTask,
  getWorkerTaskHistory,
  uploadWorkerTaskPhotos, 
  reportWorkerTaskIssue,
  getWorkerProfile,
  changeWorkerPassword,
  uploadWorkerPhoto,
  getWorkerCertificationAlerts,
  markInstructionsAsRead,
  acknowledgeInstructions,
  getWorkerPerformance,
  upload as workerUpload
} from "./workerController.js";
import { verifyToken } from "../../middleware/authMiddleware.js";
import upload from "../../middleware/upload.js";

const router = express.Router();

// Worker Profile Routes
router.get("/profile", verifyToken, getWorkerProfile);
router.put("/profile/password", verifyToken, changeWorkerPassword);
router.post("/profile/photo", verifyToken, workerUpload.single('photo'), uploadWorkerPhoto);
router.get("/profile/certification-alerts", verifyToken, getWorkerCertificationAlerts);

// Worker Portal - Today's Trip
router.get("/today-trip",
  verifyToken,
  getWorkerTodayTrip
);

// Enhanced endpoint for mobile app - Today's Tasks with comprehensive details
router.get("/tasks/today",
  verifyToken,
  getWorkerTasksToday
);

// Get task history with filtering and pagination (MUST come before /tasks/:taskId)
router.get("/tasks/history",
  verifyToken,
  getWorkerTaskHistory
);

// Get individual task details
router.get("/tasks/:taskId",
  verifyToken,
  getWorkerTaskDetails
);

// Legacy endpoint - keeping for backward compatibility
router.get(
  "/my-task/today",
  verifyToken,
  getWorkerTodayTask
);

// Validate geofence location
router.get(
  "/geofence/validate",
  verifyToken,
  validateWorkerGeofence
);

// Start a task with geofence validation (new RESTful endpoint)
router.post(
  "/tasks/:taskId/start",
  verifyToken,
  startWorkerTaskById
);

// Update task progress (new RESTful endpoint)
router.put(
  "/tasks/:taskId/progress",
  verifyToken,
  updateWorkerTaskProgress
);

// Complete a task (new endpoint)
router.post(
  "/tasks/:taskId/complete",
  verifyToken,
  completeWorkerTask
);

// Pause a task (new endpoint)
router.post(
  "/tasks/:taskId/pause",
  verifyToken,
  pauseWorkerTask
);

// Resume a paused task (new endpoint)
router.post(
  "/tasks/:taskId/resume",
  verifyToken,
  resumeWorkerTask
);

// Mark instructions as read
router.post(
  "/tasks/:assignmentId/instructions/read",
  verifyToken,
  markInstructionsAsRead
);

// Acknowledge instructions
router.post(
  "/tasks/:assignmentId/instructions/acknowledge",
  verifyToken,
  acknowledgeInstructions
);

// Get worker performance metrics
router.get(
  "/performance",
  verifyToken,
  getWorkerPerformance
);

// Legacy endpoints - keeping for backward compatibility
router.post(
  "/task/start",
  verifyToken,
  startWorkerTask
);

router.post(
  "/task-progress",
  verifyToken,
  submitWorkerTaskProgress
);

router.post(
  "/task/issue",
  verifyToken,
  reportWorkerTaskIssue
);

router.post(
  "/task/photo",
  verifyToken,
  upload.array("photos", 5),
  uploadWorkerTaskPhotos
);

export default router;