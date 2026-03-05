import axios from '../axios';

const ROLE_PERMISSION_API_BASE = '/admin/role-permissions';

const rolePermissionApi = {
  // Get all roles for dropdown
  getRoles: async () => {
    try {
      const response = await axios.get(`${ROLE_PERMISSION_API_BASE}/roles`);
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  // Get permissions for a specific role
  getRolePermissions: async (roleId) => {
    try {
      const response = await axios.get(`${ROLE_PERMISSION_API_BASE}/${roleId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      throw error;
    }
  },

  // Update role permissions
  updateRolePermissions: async (roleId, permissionIds) => {
    try {
      const response = await axios.put(`${ROLE_PERMISSION_API_BASE}/${roleId}`, {
        permissionIds
      });
      return response.data;
    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw error;
    }
  }
};

export default rolePermissionApi;