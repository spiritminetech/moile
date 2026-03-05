import express from 'express';
import { getDashboardSummary } from './bossDashboardController.js';
import  authMiddleware  from '../../middleware/authMiddleware.js';
import  permissionMiddleware  from '../../middleware/permissionMiddleware.js';

const router = express.Router();

router.get(
  '/boss/dashboard/summary',
//   authMiddleware,
//   permissionMiddleware('DASHBOARD_VIEW'),
  getDashboardSummary
);

export default router;
