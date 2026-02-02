import express from 'express';
import { verifyToken } from '../../middleware/authMiddleware.js';
import upload from '../../middleware/upload.js';
import {
    submitLeaveRequest,
    submitMaterialRequest,
    submitToolRequest,
    submitReimbursementRequest,
    submitAdvancePaymentRequest,
    uploadRequestAttachments,
    getRequests,
    getSpecificRequest,
    cancelRequest
} from './workerRequestController.js';

const router = express.Router();

// Submit different types of requests
router.post('/leave', verifyToken, upload.array('attachments', 5), submitLeaveRequest);
router.post('/material', verifyToken, upload.array('attachments', 5), submitMaterialRequest);
router.post('/tool', verifyToken, upload.array('attachments', 5), submitToolRequest);
router.post('/reimbursement', verifyToken, upload.array('attachments', 5), submitReimbursementRequest);
router.post('/advance-payment', verifyToken, upload.array('attachments', 5), submitAdvancePaymentRequest);

// Upload attachments to existing request
router.post('/:requestId/attachments', verifyToken, upload.array('attachments', 5), uploadRequestAttachments);

// Get requests with filtering
router.get('/', verifyToken, getRequests);

// Get specific request
router.get('/:requestId', verifyToken, getSpecificRequest);

// Cancel request
router.post('/:requestId/cancel', verifyToken, cancelRequest);

export default router;