import express from 'express';
import {
  getCostBreakdownItems,
  getCostBreakdownItemById,
  createCostBreakdownItem,
  updateCostBreakdownItem,
  deleteCostBreakdownItem,
  getCostBreakdownSummary
} from './costBreakdownController.js';

const router = express.Router();

// Apply auth middleware to all routes if needed
// router.use(authMiddleware);

// GET /api/cost-breakdown - List all cost breakdown items with filters
router.get('/', getCostBreakdownItems);

// GET /api/cost-breakdown/summary - Get cost breakdown summary
router.get('/summary', getCostBreakdownSummary);

// GET /api/cost-breakdown/:id - Get single cost breakdown item
router.get('/:id', getCostBreakdownItemById);

// POST /api/cost-breakdown - Create new cost breakdown item
router.post('/', createCostBreakdownItem);

// PUT /api/cost-breakdown/:id - Update cost breakdown item
router.put('/:id', updateCostBreakdownItem);

// DELETE /api/cost-breakdown/:id - Delete cost breakdown item
router.delete('/:id', deleteCostBreakdownItem);

export default router;