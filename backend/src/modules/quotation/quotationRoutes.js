import express from 'express';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  cloneQuotation,
  submitQuotation,
  approveQuotation,
  rejectQuotation,
  convertToProject,
  deleteQuotation,
  getApprovalHistory
} from './quotationController.js';
import {
  getQuotationItems,
  createQuotationItem,
  updateQuotationItem,
  deleteQuotationItem
} from './quotationItemController.js';
import {
  getQuotationTerms
} from './quotationTermController.js';


const router = express.Router();

// Apply auth middleware to all routes


// GET /api/quotations - List quotations with filters
router.get('/', getQuotations);

// GET /api/quotations/:id - Get single quotation
router.get('/:id', getQuotationById);

// GET /api/quotations/:quotationId/items - Get quotation items
router.get('/:quotationId/items', getQuotationItems);

// GET /api/quotations/:id/terms - Get quotation terms
router.get('/:id/terms', getQuotationTerms);

// GET /api/quotations/:id/approvals - Get approval history
router.get('/:id/approvals', getApprovalHistory);

// POST /api/quotations - Create new quotation
router.post('/', createQuotation);

// POST /api/quotation-items - Create quotation item
router.post('/items', createQuotationItem);

// PUT /api/quotations/:id - Update quotation
router.put('/:id', updateQuotation);

// PUT /api/quotation-items/:id - Update quotation item
router.put('/items/:id', updateQuotationItem);

// POST /api/quotations/:id/clone - Clone quotation (new version)
router.post('/:id/clone', cloneQuotation);

// POST /api/quotations/:id/submit - Submit quotation for approval
router.post('/:id/submit', submitQuotation);

// POST /api/quotations/:id/approve - Approve quotation
router.post('/:id/approve', approveQuotation);

// POST /api/quotations/:id/reject - Reject quotation
router.post('/:id/reject', rejectQuotation);

// POST /api/quotations/:id/convert - Convert to project
router.post('/:id/convert', convertToProject);

// DELETE /api/quotations/:id - Delete quotation
router.delete('/:id', deleteQuotation);

// DELETE /api/quotation-items/:id - Delete quotation item
router.delete('/items/:id', deleteQuotationItem);

export default router;