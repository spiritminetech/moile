import express from 'express';
import {
  createQuotationTerm,
  updateQuotationTerm,
  deleteQuotationTerm,
  reorderQuotationTerms
} from './quotationTermController.js';

const router = express.Router();

// POST /api/quotation-terms - Create a new term
router.post('/quotation-terms', createQuotationTerm);

// PUT /api/quotation-terms/reorder - Reorder terms (MUST be before the :id route)
router.put('/quotation-terms/reorder', reorderQuotationTerms);

// PUT /api/quotation-terms/:id - Update a term
router.put('/quotation-terms/:id', updateQuotationTerm);

// DELETE /api/quotation-terms/:id - Delete a term
router.delete('/quotation-terms/:id', deleteQuotationTerm);

export default router;