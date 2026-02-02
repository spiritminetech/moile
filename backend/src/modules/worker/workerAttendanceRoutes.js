// routes/workerAttendanceRoutes.js
import express from 'express';
import { 
  validateLocation,
  clockIn,
  clockOut,
  lunchStart,
  lunchEnd,
  getAttendanceStatus,
  getAttendanceHistory,
  getTodayAttendance
} from './workerAttendanceController.js';

import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Worker-specific attendance endpoints
router.post('/validate-location', verifyToken, validateLocation);
router.post('/clock-in', verifyToken, clockIn);
router.post('/clock-out', verifyToken, clockOut);
router.post('/lunch-start', verifyToken, lunchStart);
router.post('/lunch-end', verifyToken, lunchEnd);
router.get('/status', verifyToken, getAttendanceStatus);
router.get('/today', verifyToken, getTodayAttendance);
router.get('/history', verifyToken, getAttendanceHistory);

export default router;