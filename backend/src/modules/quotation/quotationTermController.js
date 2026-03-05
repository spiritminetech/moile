import QuotationTerm from './models/QuotationTermModel.js';
import mongoose from 'mongoose';

// GET /api/quotations/:id/terms - Get all terms for a quotation
export const getQuotationTerms = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Convert to appropriate type based on the ID format
    let quotationId = id;
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      // It's a MongoDB ObjectId
      quotationId = id;
    } else if (!isNaN(Number(id))) {
      // It's a numeric ID
      quotationId = parseInt(id);
    }
    
    console.log('Fetching terms for quotationId:', quotationId, 'Type:', typeof quotationId);
    
    const terms = await QuotationTerm.find({ quotationId: quotationId })
      .sort({ sortOrder: 1, createdAt: 1 });
    
    console.log('Found terms:', terms.length);
    
    res.status(200).json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Error fetching quotation terms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotation terms',
      error: error.message
    });
  }
};

// POST /api/quotation-terms - Create a new term
// POST /api/quotation-terms
export const createQuotationTerm = async (req, res) => {
  try {
    const { quotationId, termType, title, description, sortOrder } = req.body;

    // Validate required fields
    if (!quotationId || !termType || !description) {
      return res.status(400).json({
        success: false,
        message: 'quotationId, termType, and description are required'
      });
    }

    // Handle both ObjectId and numeric quotationId
    let finalQuotationId = quotationId;
    if (mongoose.Types.ObjectId.isValid(quotationId) && quotationId.length === 24) {
      // It's a MongoDB ObjectId
      finalQuotationId = quotationId;
    } else if (!isNaN(Number(quotationId))) {
      // It's a numeric ID
      finalQuotationId = parseInt(quotationId);
    }

    console.log('Creating term for quotationId:', finalQuotationId, 'Type:', typeof finalQuotationId);

    // Generate next sequential ID
    const lastTerm = await QuotationTerm.findOne().sort({ id: -1 });
    const nextId = lastTerm ? lastTerm.id + 1 : 1;

    // Auto-generate sortOrder if not provided
    let finalSortOrder;

    if (sortOrder !== undefined && sortOrder !== null) {
      finalSortOrder = Number(sortOrder);
    } else {
      const lastSort = await QuotationTerm
        .findOne({ quotationId: finalQuotationId })
        .sort({ sortOrder: -1 });

      finalSortOrder = lastSort ? lastSort.sortOrder + 1 : 1;
    }

    // Create new term
    const newTerm = new QuotationTerm({
      id: nextId,
      quotationId: finalQuotationId,
      termType,
      title: title || '',
      description,
      sortOrder: finalSortOrder
    });

    const savedTerm = await newTerm.save();

    return res.status(201).json({
      success: true,
      message: 'Quotation term created successfully',
      data: savedTerm
    });

  } catch (error) {
    console.error('Error creating quotation term:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create quotation term',
      error: error.message
    });
  }
};


// PUT /api/quotation-terms/:id - Update a term
export const updateQuotationTerm = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedTerm = await QuotationTerm.findOneAndUpdate(
      { id: parseInt(id) },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTerm) {
      return res.status(404).json({
        success: false,
        message: 'Quotation term not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quotation term updated successfully',
      data: updatedTerm
    });
  } catch (error) {
    console.error('Error updating quotation term:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quotation term',
      error: error.message
    });
  }
};

// DELETE /api/quotation-terms/:id - Delete a term
export const deleteQuotationTerm = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTerm = await QuotationTerm.findOneAndDelete({ id: parseInt(id) });

    if (!deletedTerm) {
      return res.status(404).json({
        success: false,
        message: 'Quotation term not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quotation term deleted successfully',
      data: deletedTerm
    });
  } catch (error) {
    console.error('Error deleting quotation term:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quotation term',
      error: error.message
    });
  }
};

// PUT /api/quotation-terms/reorder - Reorder terms (for drag & drop functionality)
export const reorderQuotationTerms = async (req, res) => {
  try {
    const { terms } = req.body; // Array of { id, sortOrder }

    if (!Array.isArray(terms)) {
      return res.status(400).json({
        success: false,
        message: 'Terms array is required'
      });
    }

    // Update sort order for each term
    const updatePromises = terms.map(term => 
      QuotationTerm.findOneAndUpdate(
        { id: parseInt(term.id) },
        { sortOrder: term.sortOrder },
        { new: true }
      )
    );

    const updatedTerms = await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Terms reordered successfully',
      data: updatedTerms
    });
  } catch (error) {
    console.error('Error reordering quotation terms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder quotation terms',
      error: error.message
    });
  }
};