import express from 'express';
import {
  getQuotationItems,
  createQuotationItem,
  updateQuotationItem,
  deleteQuotationItem
} from './quotationItemController.js';

const router = express.Router();

// GET /api/quotations/:quotationId/items - Get all items for a quotation
router.get('/:quotationId/items', getQuotationItems);

// POST /api/quotation-items - Create new quotation item
router.post('/items', createQuotationItem);

// PUT /api/quotation-items/:id - Update quotation item
router.put('/items/:id', updateQuotationItem);

// DELETE /api/quotation-items/:id - Delete quotation item
router.delete('/items/:id', deleteQuotationItem);

export default router;