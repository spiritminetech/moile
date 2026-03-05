import React, { useState, useEffect } from 'react';
import quotationApi from '../../api/quotation/quotationApi';
import { toast } from '../../utils/toast';

const QuotationItemsTable = ({ quotationId, isEditable = true, onTotalChange }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    category: 'Manpower',
    trade: '',
    itemName: '',
    description: '',
    quantity: 1,
    unit: '',
    unitRate: 0
  });

  const categories = [
    { value: 'Manpower', label: 'Manpower', fields: ['trade', 'description'] },
    { value: 'Material', label: 'Material', fields: ['itemName', 'description'] },
    { value: 'Tool', label: 'Tool/Machinery', fields: ['itemName', 'description'] },
    { value: 'Transport', label: 'Transport', fields: ['description'] },
    { value: 'Warranty', label: 'Warranty', fields: ['description'] },
    { value: 'Certification', label: 'Certification', fields: ['description'] }
  ];

  const units = ['Day', 'Month', 'Hour', 'Nos', 'Lot', 'Sqm', 'Cum', 'Kg', 'Ton'];

  useEffect(() => {
    if (quotationId) {
      fetchItems();
    }
  }, [quotationId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await quotationApi.getQuotationItems(quotationId);
      setItems(response.data || []);
      
      // Calculate and notify parent of total
      const total = (response.data || []).reduce((sum, item) => sum + (item.totalAmount || 0), 0);
      if (onTotalChange) {
        onTotalChange(total);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to fetch quotation items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.quantity || !formData.unitRate) {
      toast.error('Quantity and unit rate are required');
      return;
    }

    try {
      const submitData = {
        ...formData,
        quotationId: parseInt(quotationId),
        quantity: parseFloat(formData.quantity),
        unitRate: parseFloat(formData.unitRate)
      };

      if (editingItem) {
        await quotationApi.updateQuotationItem(editingItem._id, submitData);
        toast.success('Item updated successfully');
      } else {
        await quotationApi.createQuotationItem(submitData);
        toast.success('Item added successfully');
      }

      // Reset form and refresh
      resetForm();
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error(error.message || 'Failed to save item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      trade: item.trade || '',
      itemName: item.itemName || '',
      description: item.description || '',
      quantity: item.quantity,
      unit: item.unit || '',
      unitRate: item.unitRate
    });
    setShowAddForm(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await quotationApi.deleteQuotationItem(item._id);
      toast.success('Item deleted successfully');
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(error.message || 'Failed to delete item');
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'Manpower',
      trade: '',
      itemName: '',
      description: '',
      quantity: 1,
      unit: '',
      unitRate: 0
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const getCurrentCategoryFields = () => {
    const category = categories.find(c => c.value === formData.category);
    return category ? category.fields : [];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getCategoryTotals = () => {
    const totals = {};
    categories.forEach(cat => {
      totals[cat.value] = items
        .filter(item => item.category === cat.value)
        .reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    });
    return totals;
  };

  const categoryTotals = getCategoryTotals();
  const grandTotal = Object.values(categoryTotals).reduce((sum, total) => sum + total, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Item Button */}
      {isEditable && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && isEditable && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h4>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Fields Based on Category */}
            {getCurrentCategoryFields().includes('trade') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
                <input
                  type="text"
                  value={formData.trade}
                  onChange={(e) => setFormData(prev => ({ ...prev, trade: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Electrician, Plumber"
                />
              </div>
            )}

            {getCurrentCategoryFields().includes('itemName') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Item name"
                />
              </div>
            )}

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Item description"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Unit</option>
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            {/* Unit Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Rate (SGD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitRate}
                onChange={(e) => setFormData(prev => ({ ...prev, unitRate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Total Amount (Calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input
                type="text"
                value={formatCurrency((formData.quantity || 0) * (formData.unitRate || 0))}
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600"
              />
            </div>

            {/* Form Actions */}
            <div className="md:col-span-2 lg:col-span-4 flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                {isEditable && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={isEditable ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                    No items added yet. {isEditable && 'Click "Add Item" to get started.'}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {item.trade && <span className="font-medium">{item.trade} - </span>}
                        {item.itemName && <span className="font-medium">{item.itemName} - </span>}
                        {item.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.unitRate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.totalAmount)}
                    </td>
                    {isEditable && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Category Totals */}
        {items.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
              {categories.map(cat => (
                <div key={cat.value} className="text-center">
                  <div className="text-gray-600">{cat.label}</div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(categoryTotals[cat.value])}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-right">
              <div className="text-lg font-bold text-gray-900">
                Grand Total: {formatCurrency(grandTotal)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationItemsTable;