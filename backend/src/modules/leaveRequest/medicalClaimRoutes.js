import express from 'express';
import { verifyToken } from '../../middleware/authMiddleware.js';
import { uploadLeaveDocuments } from '../../middleware/leaveUploadMiddleware.js';
import {
    createMedicalClaim,
    getMyMedicalClaims,
    getPendingMedicalClaims,
    approveMedicalClaim,
    rejectMedicalClaim,
    markMedicalClaimProcessed
} from './medicalClaimController.js';

const router = express.Router();

// Worker routes
router.post('/', verifyToken, uploadLeaveDocuments, createMedicalClaim);
router.get('/my-claims', verifyToken, getMyMedicalClaims);

// Supervisor/Admin routes
router.get('/pending', verifyToken, getPendingMedicalClaims);
router.put('/:id/approve', verifyToken, approveMedicalClaim);
router.put('/:id/reject', verifyToken, rejectMedicalClaim);
router.put('/:id/processed', verifyToken, markMedicalClaimProcessed);

export default router;