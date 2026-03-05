import Permission from './PermissionModel.js';
import RolePermission from '../rolePermission/RolePermissionModel.js';

/**
 * Get next available permission ID
 */
const getNextPermissionId = async () => {
  const lastPermission = await Permission.findOne().sort({ id: -1 }).select('id');
  return lastPermission ? lastPermission.id + 1 : 1;
};

/**
 * Get all permissions for management
 */
const getPermissions = async (req, res) => {
  try {
    console.log('🔍 Fetching permissions...');

    const permissions = await Permission.find()
      .select('id module action code isActive createdAt')
      .sort({ module: 1, action: 1 });

    console.log(`✅ Found ${permissions.length} permissions`);

    res.json({
      success: true,
      data: permissions,
      count: permissions.length
    });

  } catch (error) {
    console.error('❌ Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions',
      error: error.message
    });
  }
};

/**
 * Create new permission
 */
const createPermission = async (req, res) => {
  try {
    const { module, action, code } = req.body;

    console.log('🔐 Creating new permission:', { module, action, code });

    // Validate required fields
    if (!module || !action || !code) {
      return res.status(400).json({
        success: false,
        message: 'Module, action, and code are required'
      });
    }

    // Check if code already exists
    const existingPermission = await Permission.findOne({ code: code.toUpperCase() });
    if (existingPermission) {
      return res.status(409).json({
        success: false,
        message: 'Permission code already exists'
      });
    }

    // Get next permission ID
    const permissionId = await getNextPermissionId();

    // Create permission
    const newPermission = new Permission({
      id: permissionId,
      module: module.trim(),
      action: action.trim(),
      code: code.toUpperCase().trim(),
      isActive: true
    });

    await newPermission.save();

    console.log(`✅ Permission created successfully: ${code}`);

    res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      data: newPermission
    });

  } catch (error) {
    console.error('❌ Error creating permission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create permission',
      error: error.message
    });
  }
};

/**
 * Update permission
 */
const updatePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { module, action, code, isActive } = req.body;

    console.log(`✏️ Updating permission ${permissionId}:`, { module, action, code, isActive });

    // Check if permission exists
    const permission = await Permission.findOne({ id: parseInt(permissionId) });
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Check if code already exists (excluding current permission)
    if (code && code !== permission.code) {
      const existingPermission = await Permission.findOne({ 
        code: code.toUpperCase(),
        id: { $ne: parseInt(permissionId) }
      });
      if (existingPermission) {
        return res.status(409).json({
          success: false,
          message: 'Permission code already exists'
        });
      }
    }

    // Update permission
    const updateData = {};
    if (module) updateData.module = module.trim();
    if (action) updateData.action = action.trim();
    if (code) updateData.code = code.toUpperCase().trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    await Permission.updateOne(
      { id: parseInt(permissionId) },
      updateData
    );

    console.log(`✅ Permission ${permissionId} updated successfully`);

    res.json({
      success: true,
      message: 'Permission updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating permission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permission',
      error: error.message
    });
  }
};

/**
 * Toggle permission active status
 */
const togglePermissionStatus = async (req, res) => {
  try {
    const { permissionId } = req.params;

    console.log(`🔄 Toggling permission status for ${permissionId}`);

    const permission = await Permission.findOne({ id: parseInt(permissionId) });
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Toggle status
    const newStatus = !permission.isActive;
    await Permission.updateOne(
      { id: parseInt(permissionId) },
      { isActive: newStatus }
    );

    console.log(`✅ Permission ${permissionId} status changed to ${newStatus ? 'active' : 'inactive'}`);

    res.json({
      success: true,
      message: `Permission ${newStatus ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('❌ Error toggling permission status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle permission status',
      error: error.message
    });
  }
};

/**
 * Delete permission (only if not assigned to any role)
 */
const deletePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;

    console.log(`🗑️ Attempting to delete permission ${permissionId}`);

    // Check if permission exists
    const permission = await Permission.findOne({ id: parseInt(permissionId) });
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Check if permission is assigned to any role
    const rolePermissions = await RolePermission.find({ permissionId: parseInt(permissionId) });
    if (rolePermissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete permission that is assigned to roles. Please remove from roles first.'
      });
    }

    // Delete permission
    await Permission.deleteOne({ id: parseInt(permissionId) });

    console.log(`✅ Permission ${permissionId} deleted successfully`);

    res.json({
      success: true,
      message: 'Permission deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting permission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete permission',
      error: error.message
    });
  }
};

export {
  getPermissions,
  createPermission,
  updatePermission,
  togglePermissionStatus,
  deletePermission
};