import express from 'express';
import {
  raiseLeaveRequest,
  getMyLeaveRequests,
  getPendingLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest
} from './leaveRequestController.js';

import { uploadLeaveDocuments } from '../../middleware/leaveUploadMiddleware.js';
import { verifyToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

/* Worker */
router.post(
  '/',
  verifyToken,uploadLeaveDocuments,
  raiseLeaveRequest
);

router.get(
  '/my',
  getMyLeaveRequests
);

/* Supervisor */
router.get(
  '/pending',
  getPendingLeaveRequests
);

router.post(
  '/:id/approve',verifyToken,
  approveLeaveRequest
);

router.post(
  '/:id/reject',verifyToken,
  rejectLeaveRequest
);

export default router;