import axios from '../axios';

const API_BASE = '/user-management';

export const userManagementApi = {
  // Get all users with their roles and companies
  getUsers: async () => {
    try {
      const response = await axios.get(`${API_BASE}/users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get roles for dropdown (excluding Boss for non-Boss users)
  getRoles: async (userRole = '') => {
    try {
      const response = await axios.get(`${API_BASE}/roles`, {
        params: { userRole }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  // Get companies for dropdown
  getCompanies: async () => {
    try {
      const response = await axios.get(`${API_BASE}/companies`);
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  // Create new user with role and company assignment
  createUser: async (userData) => {
    try {
      const response = await axios.post(`${API_BASE}/users`, userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Get user details for editing
  getUserForEdit: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user for edit:', error);
      throw error;
    }
  },

  // Update user role and status
  updateUser: async (userId, userData) => {
    try {
      const response = await axios.put(`${API_BASE}/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Disable user account
  disableUser: async (userId) => {
    try {
      const response = await axios.put(`${API_BASE}/users/${userId}/disable`);
      return response.data;
    } catch (error) {
      console.error('Error disabling user:', error);
      throw error;
    }
  },

  // Enable user account
  enableUser: async (userId) => {
    try {
      const response = await axios.put(`${API_BASE}/users/${userId}/enable`);
      return response.data;
    } catch (error) {
      console.error('Error enabling user:', error);
      throw error;
    }
  }
};

export default userManagementApi;