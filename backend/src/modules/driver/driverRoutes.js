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
  updateDriverProfile,
  changeDriverPassword,
  uploadDriverPhoto,
  upload,
  getDashboardSummary,
  getDriverPerformanceMetrics,
  getVehicleDetails,
  getMaintenanceAlerts,
  reportDelay,
  reportBreakdown,
  requestAlternateVehicle,
  uploadTripPhoto,
  uploadTripPhotos,
  validateWorkerCount,
  clockInDriver,
  clockOutDriver,
  loginDriver,
  logoutDriver,
  getTodaysAttendance,
  getAttendanceSummary,
  getAttendanceHistory,
  getAttendanceTripHistory,
  getLicenseDetails,
  updateLicenseDetails,
  uploadLicensePhotoHandler,
  uploadLicensePhoto,
  updateTaskStatus,
  getWorkerManifests,
  getPickupList,
  getDropLocations,
  confirmWorkerCount,
  optimizeRoute,
  getNavigation,
  checkInWorker,
  checkOutWorker,
  getNavigationLinks,
  reportRouteDeviation,
  getRouteDeviationHistory,
  getTransportAttendanceImpact,
  linkDelayToAttendance,
  getDelayAuditTrail,
  uploadPickupPhoto,
  uploadDropoffPhoto,
  uploadPickupPhotoMulter,
  uploadDropoffPhotoMulter,
  logGeofenceViolation,
  submitWorkerMismatch,
  submitFuelLog,
  getFuelLogHistory,
  getVehicleFuelLog,
  reportVehicleIssue,
  getVehicleIssues,
  submitVehicleInspection,
  getVehicleInspections,
  getVehicleInspectionDetails
} from './driverController.js';

import { verifyToken } from '../../middleware/authMiddleware.js';

// 🔹 Dashboard Routes
router.get("/dashboard/summary", verifyToken, getDashboardSummary);
router.get("/dashboard", verifyToken, getDashboardSummary); // Alias for /dashboard/summary
router.get("/dashboard/vehicle", verifyToken, getVehicleDetails);

// 🔹 Performance Routes
router.get("/performance/metrics", verifyToken, getDriverPerformanceMetrics);

// 🔹 Driver Profile Routes
router.get("/profile", verifyToken, getDriverProfile);
router.put("/profile", verifyToken, updateDriverProfile);
router.put("/profile/password", verifyToken, changeDriverPassword);
router.post("/profile/photo", verifyToken, upload.single('photo'), uploadDriverPhoto);

// 🔹 Driver License Routes
router.get("/profile/license", verifyToken, getLicenseDetails);
router.put("/profile/license", verifyToken, updateLicenseDetails);
router.post("/profile/license/photo", verifyToken, uploadLicensePhoto.single('photo'), uploadLicensePhotoHandler);

// 🔹 Driver Task Routes
router.get("/tasks/today", verifyToken, getTodaysTasks);
router.get("/transport-tasks", verifyToken, getTodaysTasks); // Alias for transport tasks screen
router.get("/trips/history", verifyToken, getTripHistory);
router.get("/tasks/:taskId", verifyToken, getTaskDetails);
router.get("/transport-tasks/:taskId", verifyToken, getTaskDetails); // Alias for transport task details
router.post("/tasks/:taskId/pickup", verifyToken, confirmPickup);
router.post("/tasks/:taskId/drop", verifyToken, confirmDrop);
router.post("/transport-tasks/:taskId/pickup-complete", verifyToken, uploadTripPhotos.single('photo'), confirmPickup); // Alias for pickup complete with photo upload
router.post("/transport-tasks/:taskId/dropoff-complete", verifyToken, uploadTripPhotos.single('photo'), confirmDrop); // Alias for dropoff complete with photo upload
router.get("/tasks/:taskId/summary", verifyToken, getTripSummary);

// 🔹 Trip Updates Routes
router.post("/tasks/:taskId/delay", verifyToken, reportDelay);
router.post("/transport-tasks/:taskId/delay", verifyToken, reportDelay); // Alias for transport tasks
router.post("/tasks/:taskId/breakdown", verifyToken, reportBreakdown);
router.post("/transport-tasks/:taskId/breakdown", verifyToken, reportBreakdown); // Alias for transport tasks
router.post("/tasks/:taskId/vehicle-request", verifyToken, requestAlternateVehicle);
router.post("/transport-tasks/:taskId/vehicle-request", verifyToken, requestAlternateVehicle); // Alias for transport tasks
router.post("/tasks/:taskId/photos", verifyToken, uploadTripPhotos.array('photos', 10), uploadTripPhoto);
router.post("/transport-tasks/:taskId/photos", verifyToken, uploadTripPhotos.array('photos', 10), uploadTripPhoto); // Alias for transport tasks
router.post("/transport-tasks/:taskId/validate-count", verifyToken, validateWorkerCount);
router.put("/transport-tasks/:taskId/status", verifyToken, updateTaskStatus); // Update task status
router.get("/transport-tasks/:taskId/manifests", verifyToken, getWorkerManifests); // Get worker manifests
router.get("/transport-tasks/:taskId/pickup-list", verifyToken, getPickupList); // Get pickup list
router.get("/transport-tasks/:taskId/drop-locations", verifyToken, getDropLocations); // Get drop locations
router.post("/transport-tasks/:taskId/confirm-workers", verifyToken, confirmWorkerCount); // Confirm worker count
router.post("/transport-tasks/:taskId/optimize-route", verifyToken, optimizeRoute); // Optimize route
router.get("/transport-tasks/:taskId/navigation", verifyToken, getNavigation); // Get navigation
router.post("/transport-tasks/locations/:locationId/checkin", verifyToken, uploadTripPhotos.single('photo'), checkInWorker); // Check in worker
router.post("/transport-tasks/locations/:locationId/checkout", verifyToken, checkOutWorker); // Check out worker

// 🔹 GPS Navigation & Route Deviation Routes
router.get("/transport-tasks/:taskId/navigation-links", verifyToken, getNavigationLinks); // Get GPS navigation links
router.post("/transport-tasks/:taskId/route-deviation", verifyToken, reportRouteDeviation); // Report route deviation
router.get("/transport-tasks/:taskId/route-deviations", verifyToken, getRouteDeviationHistory); // Get deviation history
router.get("/transport-tasks/:taskId/delay-audit", verifyToken, getDelayAuditTrail); // Get delay audit trail

// 🔹 Transport Delay & Attendance Impact Routes
router.get("/transport-tasks/:taskId/attendance-impact", verifyToken, getTransportAttendanceImpact); // Get attendance impact
router.post("/transport-tasks/:taskId/link-attendance", verifyToken, linkDelayToAttendance); // Link delay to attendance

// 🔹 Photo Upload Routes (NEW)
router.post("/transport-tasks/:taskId/pickup-photo", verifyToken, uploadPickupPhotoMulter.single('photo'), uploadPickupPhoto); // Upload pickup photo
router.post("/transport-tasks/:taskId/dropoff-photo", verifyToken, uploadDropoffPhotoMulter.single('photo'), uploadDropoffPhoto); // Upload dropoff photo

// 🔹 Geofence Violation & Worker Mismatch Routes (NEW)
router.post("/transport-tasks/:taskId/geofence-violation", verifyToken, logGeofenceViolation); // Log geofence violation
router.post("/transport-tasks/:taskId/worker-mismatch", verifyToken, submitWorkerMismatch); // Submit worker mismatch

// 🔹 Vehicle Info Routes
router.get("/vehicle", verifyToken, getVehicleDetails);
router.get("/vehicle/maintenance-alerts", verifyToken, getMaintenanceAlerts);

// 🔹 Fuel Log Routes
router.post("/vehicle/fuel-log", verifyToken, submitFuelLog); // Submit fuel log entry
router.get("/vehicle/fuel-log", verifyToken, getFuelLogHistory); // Get fuel log history
router.get("/vehicle/:vehicleId/fuel-log", verifyToken, getVehicleFuelLog); // Get fuel log by vehicle

// 🔹 Vehicle Issue Reporting Routes
router.post("/vehicle/report-issue", verifyToken, reportVehicleIssue); // Report vehicle issue
router.get("/vehicle/issues", verifyToken, getVehicleIssues); // Get vehicle issues

// 🔹 Vehicle Inspection (Pre-Check) Routes
router.post("/vehicle/inspection", verifyToken, submitVehicleInspection); // Submit vehicle inspection
router.get("/vehicle/inspections", verifyToken, getVehicleInspections); // Get vehicle inspections
router.get("/vehicle/inspection/:id", verifyToken, getVehicleInspectionDetails); // Get inspection details

// 🔹 Attendance Routes
router.post("/attendance/clock-in", verifyToken, clockInDriver);
router.post("/attendance/clock-out", verifyToken, clockOutDriver);
router.post("/attendance/login", verifyToken, loginDriver);
router.post("/attendance/logout", verifyToken, logoutDriver);
router.get("/attendance/today", verifyToken, getTodaysAttendance);
router.get("/attendance/history", verifyToken, getAttendanceHistory);
router.get("/attendance/trip-history", verifyToken, getAttendanceTripHistory);
router.get("/attendance/summary", verifyToken, getAttendanceSummary);

export default router;
