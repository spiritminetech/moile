// routes/adminProgressRoutes.js
import express from "express";
import { getProgressDashboard } from "./adminProgressController.js";

const router = express.Router();

router.get("/progress-dashboard", getProgressDashboard);

export default router;
