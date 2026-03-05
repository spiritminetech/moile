import QuotationItem from './models/QuotationItemModel.js';
import Quotation from './models/QuotationModel.js';

// GET /api/quotations/:quotationId/items - Get all items for a quotation
export const getQuotationItems = async (req, res) => {
  try {
    const { quotationId } = req.params;
    
    const items = await QuotationItem.find({ quotationId: parseInt(quotationId) })
      .sort({ category: 1, createdAt: 1 });
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching quotation items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotation items',
      error: error.message
    });
  }
};

// POST /api/quotation-items - Create new quotation item
export const createQuotationItem = async (req, res) => {
  try {
    const {
      quotationId,
      category,
      trade,
      itemName,
      description,
      quantity,
      unit,
      unitRate,
      meta
    } = req.body;

    // Validate required fields
    if (!quotationId || !category || !quantity || !unitRate) {
      return res.status(400).json({
        success: false,
        message: 'quotationId, category, quantity, and unitRate are required'
      });
    }

    // Verify quotation exists and is editable using numeric ID
    const quotation = await Quotation.findOne({ id: parseInt(quotationId) });
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (quotation.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only add items to draft quotations'
      });
    }

    // Calculate total amount
    const totalAmount = quantity * unitRate;

    // Create new item using numeric quotationId
    const newItem = new QuotationItem({
      quotationId: parseInt(quotationId),
      category,
      trade: trade || null,
      itemName: itemName || null,
      description: description || null,
      quantity: parseFloat(quantity),
      unit: unit || null,
      unitRate: parseFloat(unitRate),
      totalAmount,
      meta: meta || {}
    });

    await newItem.save();

    // Update quotation totals using numeric ID
    await updateQuotationTotals(parseInt(quotationId));

    res.status(201).json({
      success: true,
      message: 'Quotation item created successfully',
      data: newItem
    });
  } catch (error) {
    console.error('Error creating quotation item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quotation item',
      error: error.message
    });
  }
};

// PUT /api/quotation-items/:id - Update quotation item
export const updateQuotationItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const item = await QuotationItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Quotation item not found'
      });
    }

    // Verify quotation is editable using numeric ID
    const quotation = await Quotation.findOne({ id: item.quotationId });
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Associated quotation not found'
      });
    }

    if (quotation.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only edit items in draft quotations'
      });
    }

    // Recalculate total if quantity or unit rate changed
    if (updateData.quantity !== undefined || updateData.unitRate !== undefined) {
      const quantity = updateData.quantity !== undefined ? updateData.quantity : item.quantity;
      const unitRate = updateData.unitRate !== undefined ? updateData.unitRate : item.unitRate;
      updateData.totalAmount = quantity * unitRate;
    }

    const updatedItem = await QuotationItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Update quotation totals
    await updateQuotationTotals(item.quotationId);

    res.json({
      success: true,
      message: 'Quotation item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating quotation item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quotation item',
      error: error.message
    });
  }
};

// DELETE /api/quotation-items/:id - Delete quotation item
export const deleteQuotationItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await QuotationItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Quotation item not found'
      });
    }

    // Verify quotation is editable using numeric ID
    const quotation = await Quotation.findOne({ id: item.quotationId });
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Associated quotation not found'
      });
    }

    if (quotation.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete items from draft quotations'
      });
    }

    await QuotationItem.findByIdAndDelete(id);

    // Update quotation totals
    await updateQuotationTotals(item.quotationId);

    res.json({
      success: true,
      message: 'Quotation item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quotation item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quotation item',
      error: error.message
    });
  }
};

// Helper function to update quotation totals
const updateQuotationTotals = async (quotationId) => {
  try {
    const items = await QuotationItem.find({ quotationId: parseInt(quotationId) });
    
    const totals = {
      totalManpowerCost: 0,
      totalMaterialCost: 0,
      totalToolCost: 0,
      totalTransportCost: 0,
      totalWarrantyCost: 0,
      totalCertificationCost: 0
    };

    items.forEach(item => {
      switch (item.category) {
        case 'Manpower':
          totals.totalManpowerCost += item.totalAmount;
          break;
        case 'Material':
          totals.totalMaterialCost += item.totalAmount;
          break;
        case 'Tool':
          totals.totalToolCost += item.totalAmount;
          break;
        case 'Transport':
          totals.totalTransportCost += item.totalAmount;
          break;
        case 'Warranty':
          totals.totalWarrantyCost += item.totalAmount;
          break;
        case 'Certification':
          totals.totalCertificationCost += item.totalAmount;
          break;
      }
    });

    const grandTotal = Object.values(totals).reduce((sum, total) => sum + total, 0);

    // Update the quotation using numeric ID
    await Quotation.findOneAndUpdate(
      { id: parseInt(quotationId) },
      {
        ...totals,
        grandTotal
      }
    );
  } catch (error) {
    console.error('Error updating quotation totals:', error);
    throw error;
  }
};