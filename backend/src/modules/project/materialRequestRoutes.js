import express from 'express';
import { verifyToken } from '../../middleware/authMiddleware.js';
import upload from '../../middleware/upload.js';
import {
    createMaterialRequest,
    getMyMaterialRequests,
    getPendingMaterialRequests,
    approveMaterialRequest,
    rejectMaterialRequest,
    markMaterialRequestFulfilled
} from './materialRequestController.js';

const router = express.Router();

// Worker routes
router.post('/', verifyToken, upload.array('attachments', 5), createMaterialRequest);
router.get('/my-requests', verifyToken, getMyMaterialRequests);

// Supervisor/Admin routes
router.get('/pending', verifyToken, getPendingMaterialRequests);
router.put('/:id/approve', verifyToken, approveMaterialRequest);
router.put('/:id/reject', verifyToken, rejectMaterialRequest);
router.put('/:id/fulfilled', verifyToken, markMaterialRequestFulfilled);

export default router;