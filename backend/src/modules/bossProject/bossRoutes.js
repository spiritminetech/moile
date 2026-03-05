import express from 'express';

import {
  getProjectOverview,
  getProjectProgressTimeline,
  getAttendanceSnapshot,
} from './bossProjectController.js';

import {
  getFullProjectList,
} from './bossProjectListController.js';

const router = express.Router();

// Project overview
router.get(
  '/boss/projects/:projectId/overview',
  getProjectOverview
);

// Project progress timeline
router.get(
  '/boss/projects/:projectId/progress-timeline',
  getProjectProgressTimeline
);

// Attendance snapshot
router.get(
  '/boss/projects/:projectId/attendance-snapshot',
  getAttendanceSnapshot
);

// Full project list
router.get(
  '/boss/projectList',
  getFullProjectList
);

export default router;
