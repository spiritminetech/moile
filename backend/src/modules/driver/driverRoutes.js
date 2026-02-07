import express from 'express';
const router = express.Router();

import {
  getTodaysTasks, 
  getTripHistory,
  getTaskDetails, 
  confirmPickup,
  confirmDrop,
  getTripSummary,
  getDriverProfile,
  changeDriverPassword,
  uploadDriverPhoto,
  upload,
  getDashboardSummary,
  getVehicleDetails,
  reportDelay,
  reportBreakdown,
  uploadTripPhoto,
  uploadTripPhotos,
  validateWorkerCount,
  logoutDriver,
  getLicenseDetails,
  updateLicenseDetails,
  uploadLicensePhotoHandler,
  uploadLicensePhoto
} from './driverController.js';

import { verifyToken } from '../../middleware/authMiddleware.js';

// 🔹 Dashboard Routes
router.get("/dashboard/summary", verifyToken, getDashboardSummary);
router.get("/dashboard/vehicle", verifyToken, getVehicleDetails);

// 🔹 Driver Profile Routes
router.get("/profile", verifyToken, getDriverProfile);
router.put("/profile/password", verifyToken, changeDriverPassword);
router.post("/profile/photo", verifyToken, upload.single('photo'), uploadDriverPhoto);

// 🔹 Driver License Routes
router.get("/profile/license", verifyToken, getLicenseDetails);
router.put("/profile/license", verifyToken, updateLicenseDetails);
router.post("/profile/license/photo", verifyToken, uploadLicensePhoto.single('photo'), uploadLicensePhotoHandler);

// 🔹 Driver Task Routes
router.get("/tasks/today", verifyToken, getTodaysTasks);
router.get("/trips/history", verifyToken, getTripHistory);
router.get("/tasks/:taskId", verifyToken, getTaskDetails);
router.post("/tasks/:taskId/pickup", verifyToken, confirmPickup);
router.post("/tasks/:taskId/drop", verifyToken, confirmDrop);
router.get("/tasks/:taskId/summary", verifyToken, getTripSummary);

// 🔹 Trip Updates Routes
router.post("/tasks/:taskId/delay", verifyToken, reportDelay);
router.post("/tasks/:taskId/breakdown", verifyToken, reportBreakdown);
router.post("/tasks/:taskId/photos", verifyToken, uploadTripPhotos.array('photos', 10), uploadTripPhoto);
router.post("/tasks/:taskId/validate-count", verifyToken, validateWorkerCount);

// 🔹 Vehicle Info Routes
router.get("/vehicle", verifyToken, getVehicleDetails);

// 🔹 Attendance Routes
router.post("/attendance/logout", verifyToken, logoutDriver);

export default router;
