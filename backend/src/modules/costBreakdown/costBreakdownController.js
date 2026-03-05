import QuotationItem from '../quotation/models/QuotationItemModel.js';
import Quotation from '../quotation/models/QuotationModel.js';

// GET /api/cost-breakdown - List all cost breakdown items with filters
export const getCostBreakdownItems = async (req, res) => {
  try {
    const { 
      quotationId, 
      category, 
      page = 1, 
      limit = 50,
      search 
    } = req.query;

    const filter = {};
    
    if (quotationId) filter.quotationId = quotationId;
    if (category) filter.category = category;
    
    if (search) {
      filter.$or = [
        { trade: { $regex: search, $options: 'i' } },
        { itemName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const items = await QuotationItem.find(filter)
      .sort({ quotationId: 1, category: 1, createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get quotation details for each item
    const quotationIds = [...new Set(items.map(item => item.quotationId))];
    const quotations = await Quotation.find({ 
      _id: { $in: quotationIds } 
    }).select('quotationCode projectName status').lean();

    const quotationMap = {};
    quotations.forEach(q => {
      quotationMap[q._id.toString()] = q;
    });

    const enrichedItems = items.map(item => ({
      ...item,
      quotation: quotationMap[item.quotationId.toString()] || null
    }));

    const total = await QuotationItem.countDocuments(filter);

    res.json({
      success: true,
      data: enrichedItems,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching cost breakdown items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cost breakdown items',
      error: error.message
    });
  }
};

// GET /api/cost-breakdown/:id - Get single cost breakdown item
export const getCostBreakdownItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await QuotationItem.findById(id).lean();
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cost breakdown item not found'
      });
    }

    // Get quotation details
    const quotation = await Quotation.findById(item.quotationId)
      .select('quotationCode projectName status')
      .lean();

    const enrichedItem = {
      ...item,
      quotation: quotation || null
    };

    res.json({
      success: true,
      data: enrichedItem
    });
  } catch (error) {
    console.error('Error fetching cost breakdown item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cost breakdown item',
      error: error.message
    });
  }
};

// POST /api/cost-breakdown - Create new cost breakdown item
export const createCostBreakdownItem = async (req, res) => {
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

    // Verify quotation exists and is editable
    const quotation = await Quotation.findById(quotationId);
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

    // Create new item
    const newItem = new QuotationItem({
      quotationId,
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

    // Update quotation totals
    await updateQuotationTotals(quotationId);

    res.status(201).json({
      success: true,
      message: 'Cost breakdown item created successfully',
      data: newItem
    });
  } catch (error) {
    console.error('Error creating cost breakdown item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create cost breakdown item',
      error: error.message
    });
  }
};

// PUT /api/cost-breakdown/:id - Update cost breakdown item
export const updateCostBreakdownItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const item = await QuotationItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cost breakdown item not found'
      });
    }

    // Verify quotation is editable
    const quotation = await Quotation.findById(item.quotationId);
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
      message: 'Cost breakdown item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error updating cost breakdown item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cost breakdown item',
      error: error.message
    });
  }
};

// DELETE /api/cost-breakdown/:id - Delete cost breakdown item
export const deleteCostBreakdownItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await QuotationItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cost breakdown item not found'
      });
    }

    // Verify quotation is editable
    const quotation = await Quotation.findById(item.quotationId);
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
      message: 'Cost breakdown item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cost breakdown item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete cost breakdown item',
      error: error.message
    });
  }
};

// GET /api/cost-breakdown/summary - Get cost breakdown summary by quotation
export const getCostBreakdownSummary = async (req, res) => {
  try {
    const { quotationId } = req.query;

    if (!quotationId) {
      return res.status(400).json({
        success: false,
        message: 'quotationId is required'
      });
    }

    const items = await QuotationItem.find({ quotationId });
    
    const summary = {
      totalManpowerCost: 0,
      totalMaterialCost: 0,
      totalToolCost: 0,
      totalTransportCost: 0,
      totalWarrantyCost: 0,
      totalCertificationCost: 0,
      itemCounts: {
        Manpower: 0,
        Material: 0,
        Tool: 0,
        Transport: 0,
        Warranty: 0,
        Certification: 0
      }
    };

    items.forEach(item => {
      summary.itemCounts[item.category]++;
      
      switch (item.category) {
        case 'Manpower':
          summary.totalManpowerCost += item.totalAmount;
          break;
        case 'Material':
          summary.totalMaterialCost += item.totalAmount;
          break;
        case 'Tool':
          summary.totalToolCost += item.totalAmount;
          break;
        case 'Transport':
          summary.totalTransportCost += item.totalAmount;
          break;
        case 'Warranty':
          summary.totalWarrantyCost += item.totalAmount;
          break;
        case 'Certification':
          summary.totalCertificationCost += item.totalAmount;
          break;
      }
    });

    summary.grandTotal = Object.values(summary)
      .filter(val => typeof val === 'number')
      .reduce((sum, total) => sum + total, 0);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching cost breakdown summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cost breakdown summary',
      error: error.message
    });
  }
};

// Helper function to update quotation totals
const updateQuotationTotals = async (quotationId) => {
  try {
    const items = await QuotationItem.find({ quotationId });
    
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

    await Quotation.findByIdAndUpdate(quotationId, {
      ...totals,
      grandTotal
    });
  } catch (error) {
    console.error('Error updating quotation totals:', error);
    throw error;
  }
};