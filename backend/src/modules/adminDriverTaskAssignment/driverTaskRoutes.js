import express from "express";
import {
  getDriverTasks
} from "./driverTasksController.js";

const router = express.Router();

/**
 * GET /api/transport/driver-tasks?date=YYYY-MM-DD
 */
router.get("/driver-tasks", getDriverTasks);

export default router;
