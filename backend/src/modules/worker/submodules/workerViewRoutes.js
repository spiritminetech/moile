import express from "express";
import { getWorkerList, getWorkerProfile } from "./workerViewController.js";

const router = express.Router();

/* Worker list for UI */
router.get("/", getWorkerList);

/* Worker profile for UI modal */
router.get("/:workerId", getWorkerProfile);

export default router;
