// routes/projectManagerDashboardRoutes.js
import express from "express";
import { getProjectManagerDashboard } from "./ManagerDashboardController.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/manager/dashboard
router.get("/pm/dashboard", authMiddleware, getProjectManagerDashboard);

export default router;
