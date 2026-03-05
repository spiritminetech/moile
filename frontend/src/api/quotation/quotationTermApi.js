import axios from '../axios';

const quotationTermApi = {
  // Get all terms for a quotation
  getQuotationTerms: async (quotationId) => {
    try {
      const response = await axios.get(`/quotations/${quotationId}/terms`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create a new term
  createTerm: async (termData) => {
    try {
      const response = await axios.post('/quotation-terms', termData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update a term
  updateTerm: async (termId, updateData) => {
    try {
      const response = await axios.put(`/quotation-terms/${termId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete a term
  deleteTerm: async (termId) => {
    try {
      const response = await axios.delete(`/quotation-terms/${termId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reorder terms
  reorderTerms: async (termOrder) => {
    try {
      const response = await axios.put('/quotation-terms/reorder', { terms: termOrder });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default quotationTermApi;