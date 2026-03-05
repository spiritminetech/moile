// routes/adminAttendanceRoutes.js
import express from "express";
import { getAdminTodayAttendance } from "./adminAttendanceController.js";

const router = express.Router();

router.get("/attendance/today", getAdminTodayAttendance);

export default router;
