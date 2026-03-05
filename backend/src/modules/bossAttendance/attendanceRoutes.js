
import express from 'express';
import {
  getTodayProjectAttendance,
  getTodayWorkerAttendance
} from './attendanceController.js';
//import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();



router.get('/today/projects', getTodayProjectAttendance);
router.get('/today/projects/:projectId/workers', getTodayWorkerAttendance);

export default router;

