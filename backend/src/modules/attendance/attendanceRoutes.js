import express from 'express';
import { 
  validateAttendanceGeofence, 
  logLocation, 
  submitAttendance, 
  getAttendanceHistory, 
  getTodayAttendance,
  checkAttendanceAlerts,
  sendLunchBreakReminder,
  sendOvertimeAlert
} from './attendanceController.js';

import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Clock in / out
router.post('/validate-geofence', verifyToken, validateAttendanceGeofence);
router.post('/log-location',verifyToken, logLocation);
router.post('/submit',verifyToken, submitAttendance);
router.get('/history',verifyToken, getAttendanceHistory);
router.get('/today',verifyToken, getTodayAttendance);

// Attendance alert notifications
router.post('/check-alerts', verifyToken, checkAttendanceAlerts);
router.post('/send-lunch-reminder', verifyToken, sendLunchBreakReminder);
router.post('/send-overtime-alert', verifyToken, sendOvertimeAlert);


export default router;
