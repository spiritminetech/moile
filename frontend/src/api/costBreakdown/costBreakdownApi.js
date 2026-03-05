import axios from '../axios';

const costBreakdownApi = {
  // Get all cost breakdown items with filters
  getCostBreakdownItems: async (params = {}) => {
    try {
      const response = await axios.get('/cost-breakdown', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single cost breakdown item by ID
  getCostBreakdownItemById: async (id) => {
    try {
      const response = await axios.get(`/cost-breakdown/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new cost breakdown item
  createCostBreakdownItem: async (itemData) => {
    try {
      const response = await axios.post('/cost-breakdown', itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update cost breakdown item
  updateCostBreakdownItem: async (id, itemData) => {
    try {
      const response = await axios.put(`/cost-breakdown/${id}`, itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete cost breakdown item
  deleteCostBreakdownItem: async (id) => {
    try {
      const response = await axios.delete(`/cost-breakdown/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get cost breakdown summary
  getCostBreakdownSummary: async (quotationId) => {
    try {
      const response = await axios.get('/cost-breakdown/summary', {
        params: { quotationId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default costBreakdownApi;