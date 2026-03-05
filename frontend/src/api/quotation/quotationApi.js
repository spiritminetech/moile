import axios from '../axios';

const quotationApi = {
  // Get all quotations with filters
  getQuotations: async (params = {}) => {
    try {
      const response = await axios.get('/quotations', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single quotation by ID
  getQuotationById: async (id) => {
    try {
      const response = await axios.get(`/quotations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new quotation
  createQuotation: async (quotationData) => {
    try {
      const response = await axios.post('/quotations', quotationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update quotation
  updateQuotation: async (id, quotationData) => {
    try {
      const response = await axios.put(`/quotations/${id}`, quotationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Clone quotation (create new version)
  cloneQuotation: async (id) => {
    try {
      const response = await axios.post(`/quotations/${id}/clone`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Submit quotation for approval
  submitQuotation: async (id) => {
    try {
      const response = await axios.post(`/quotations/${id}/submit`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Approve quotation
  approveQuotation: async (id, remarks = '') => {
    try {
      const response = await axios.post(`/quotations/${id}/approve`, { remarks });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reject quotation
  rejectQuotation: async (id, remarks = '') => {
    try {
      const response = await axios.post(`/quotations/${id}/reject`, { remarks });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Convert quotation to project
  convertToProject: async (id) => {
    try {
      const response = await axios.post(`/quotations/${id}/convert`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete quotation
  deleteQuotation: async (id) => {
    try {
      const response = await axios.delete(`/quotations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ===== QUOTATION ITEMS =====

  // Get quotation items
  getQuotationItems: async (quotationId) => {
    try {
      const response = await axios.get(`/quotations/${quotationId}/items`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create quotation item
  createQuotationItem: async (itemData) => {
    try {
      const response = await axios.post('/quotations/items', itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update quotation item
  updateQuotationItem: async (id, itemData) => {
    try {
      const response = await axios.put(`/quotations/items/${id}`, itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete quotation item
  deleteQuotationItem: async (id) => {
    try {
      const response = await axios.delete(`/quotations/items/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ===== APPROVAL HISTORY =====

  // Get approval history
  getApprovalHistory: async (quotationId) => {
    try {
      const response = await axios.get(`/quotations/${quotationId}/approvals`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default quotationApi;