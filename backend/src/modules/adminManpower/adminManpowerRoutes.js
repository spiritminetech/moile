import express from "express";
import { getDailyManpowerStatus } from "./adminManpowerController.js";

const router = express.Router();

router.get("/manpower-status", getDailyManpowerStatus);

export default router;
