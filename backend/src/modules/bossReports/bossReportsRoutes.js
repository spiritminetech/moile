import express from 'express';

import {
  getAttendanceSummary,
  getWorkerComparison,
  getProjectUtilization,
  approveReport,
  exportReport
} from './bossReportsController.js';

const router = express.Router();

router.get(
  '/boss/reports/attendance-summary',
  getAttendanceSummary
);

router.get(
  '/boss/reports/worker-comparison',
  getWorkerComparison
);

router.get(
  '/boss/reports/project-utilization',
  getProjectUtilization
);

router.post(
  '/boss/reports/approve',
  approveReport
);

router.post(
  '/boss/reports/export',
  exportReport
);

export default router;
