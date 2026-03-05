import express from 'express';
import { getAdminDashboard } from './adminDashboardController.js';

const router = express.Router();

// GET /api/admin/dashboard?companyId=1&date=2026-01-09
router.get('/dashboard', getAdminDashboard);

export default router;
