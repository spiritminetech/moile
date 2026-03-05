import axios from '../axios';

const PERMISSION_API_BASE = '/admin/permissions';
const ROLE_PERMISSION_API_BASE = '/admin/role-permissions';

const permissionApi = {
  // Get all permissions
  getPermissions: async () => {
    try {
      const response = await axios.get(PERMISSION_API_BASE);
      return response.data;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },

  // Create new permission
  createPermission: async (permissionData) => {
    try {
      const response = await axios.post(PERMISSION_API_BASE, permissionData);
      return response.data;
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  },

  // Update permission
  updatePermission: async (permissionId, permissionData) => {
    try {
      const response = await axios.put(`${PERMISSION_API_BASE}/${permissionId}`, permissionData);
      return response.data;
    } catch (error) {
      console.error('Error updating permission:', error);
      throw error;
    }
  },

  // Toggle permission status
  togglePermissionStatus: async (permissionId) => {
    try {
      const response = await axios.put(`${PERMISSION_API_BASE}/${permissionId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling permission status:', error);
      throw error;
    }
  },

  // Delete permission
  deletePermission: async (permissionId) => {
    try {
      const response = await axios.delete(`${PERMISSION_API_BASE}/${permissionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting permission:', error);
      throw error;
    }
  }
};

const rolePermissionApi = {
  // Get all roles for permission mapping
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
  getPermissionsForRole: async (roleId) => {
    try {
      const response = await axios.get(`${ROLE_PERMISSION_API_BASE}/${roleId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching permissions for role:', error);
      throw error;
    }
  },

  // Update role permissions (replace all)
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
  },

  // Assign permissions to role
  assignPermissionsToRole: async (roleId, permissionIds) => {
    try {
      const response = await axios.post(`${ROLE_PERMISSION_API_BASE}/${roleId}/assign`, {
        permissionIds
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning permissions to role:', error);
      throw error;
    }
  },

  // Revoke permissions from role
  revokePermissionsFromRole: async (roleId, permissionIds) => {
    try {
      const response = await axios.post(`${ROLE_PERMISSION_API_BASE}/${roleId}/revoke`, {
        permissionIds
      });
      return response.data;
    } catch (error) {
      console.error('Error revoking permissions from role:', error);
      throw error;
    }
  },

  // Get role permissions summary
  getRolePermissionsSummary: async () => {
    try {
      const response = await axios.get(`${ROLE_PERMISSION_API_BASE}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching role permissions summary:', error);
      throw error;
    }
  }
};

export { permissionApi, rolePermissionApi };