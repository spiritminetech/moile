import express from 'express';
import { verifyToken } from '../../middleware/authMiddleware.js';
import {
    createPaymentRequest,
    getMyPaymentRequests,
    getPendingPaymentRequests,
    approvePaymentRequest,
    rejectPaymentRequest,
    markPaymentProcessed
} from './paymentRequestController.js';

const router = express.Router();

// Worker routes
router.post('/', verifyToken, createPaymentRequest);
router.get('/my-requests', verifyToken, getMyPaymentRequests);

// Supervisor/Admin routes
router.get('/pending', verifyToken, getPendingPaymentRequests);
router.put('/:id/approve', verifyToken, approvePaymentRequest);
router.put('/:id/reject', verifyToken, rejectPaymentRequest);
router.put('/:id/processed', verifyToken, markPaymentProcessed);

export default router;