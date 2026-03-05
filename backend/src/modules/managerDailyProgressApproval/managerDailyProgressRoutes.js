import express from "express";
import {
  getPendingDailyProgress,
  getDailyProgressDetail,
  approveDailyProgress,
  rejectDailyProgress
} from "./dailyProgressApprovalController.js";
import authMiddleware from "../../middleware/authMiddleware.js";

// import { requireAuth, requireManager } from "../middleware/auth.js";

const router = express.Router();

// router.use(requireAuth, requireManager);

router.get("/pending", getPendingDailyProgress);
router.get("/:id", getDailyProgressDetail);
router.post("/:id/approve",authMiddleware, approveDailyProgress);
router.post("/:id/reject",authMiddleware, rejectDailyProgress);

export default router;
