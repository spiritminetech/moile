import express from 'express';
const router = express.Router();

import {
  getApprovedLocations,
  createApprovedLocation,
  updateApprovedLocation,
  deleteApprovedLocation
} from './approvedLocationController.js';

import { verifyToken } from '../../middleware/authMiddleware.js';

// All routes require authentication
router.get('/', verifyToken, getApprovedLocations);
router.post('/', verifyToken, createApprovedLocation);
router.put('/:id', verifyToken, updateApprovedLocation);
router.delete('/:id', verifyToken, deleteApprovedLocation);

export default router;
