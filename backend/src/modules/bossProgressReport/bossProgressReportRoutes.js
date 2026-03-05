import express from 'express';
import { getBossProgressReports } from './bossProgressReportController.js';

const router = express.Router();

// GET /api/boss/progress-reports?companyId=1&date=YYYY-MM-DD
router.get('/progress-reports', getBossProgressReports);

export default router;
