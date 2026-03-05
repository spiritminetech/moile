import express from "express";
import {
  initTransportAssignment,
  validateTransport,
  assignTransport
} from "./transportAssignmentController.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/assignment/init", initTransportAssignment);
router.post("/assignment/validate", validateTransport);
router.post("/assignment/assign",authMiddleware, assignTransport);

export default router;
