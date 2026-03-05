import RolePermission from './RolePermissionModel.js';
import Role from '../role/RoleModel.js';
import Permission from '../Permission/PermissionModel.js';

/**
 * GET all roles for permission mapping dropdown
 */
export const getRolesForMapping = async (req, res) => {
  try {
    const roles = await Role.find({}).lean();
    
    res.json({
      success: true,
      data: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description || `${role.name} role`
      }))
    });
  } catch (error) {
    console.error('Error fetching roles for mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles'
    });
  }
};

/**
 * GET permissions with assignment status for a specific role
 */
export const getPermissionsForRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await Role.findOne({ id: Number(roleId) });
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const permissions = await Permission.find({ isActive: true }).lean();
    const assigned = await RolePermission.find({ roleId: Number(roleId) });

    const assignedSet = new Set(assigned.map(rp => rp.permissionId));

    const result = permissions.map(p => ({
      id: p.id,
      module: p.module,
      action: p.action,
      code: p.code,
      isAssigned: assignedSet.has(p.id)
    }));

    res.json({
      success: true,
      data: {
        role: {
          id: role.id,
          name: role.name
        },
        permissions: result
      }
    });
  } catch (error) {
    console.error('Error fetching permissions for role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions for role'
    });
  }
};

/**
 * UPDATE role permissions (replace all assignments)
 */
export const updateRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        message: 'permissionIds must be an array'
      });
    }

    // Remove all existing permissions for this role
    await RolePermission.deleteMany({ roleId: Number(roleId) });

    // Add new permissions
    if (permissionIds.length > 0) {
      const docs = permissionIds.map(pid => ({
        roleId: Number(roleId),
        permissionId: Number(pid)
      }));

      await RolePermission.insertMany(docs);
    }

    res.json({
      success: true,
      message: 'Role permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role permissions'
    });
  }
};

/**
 * ASSIGN specific permissions to role
 */
export const assignPermissionsToRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        message: 'permissionIds must be an array'
      });
    }

    const docs = permissionIds.map(pid => ({
      roleId: Number(roleId),
      permissionId: Number(pid)
    }));

    await RolePermission.insertMany(docs, { ordered: false })
      .catch(() => {}); // ignore duplicates

    res.json({
      success: true,
      message: 'Permissions assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning permissions to role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign permissions'
    });
  }
};

/**
 * REVOKE specific permissions from role
 */
export const revokePermissionsFromRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        message: 'permissionIds must be an array'
      });
    }

    await RolePermission.deleteMany({
      roleId: Number(roleId),
      permissionId: { $in: permissionIds.map(id => Number(id)) }
    });

    res.json({
      success: true,
      message: 'Permissions revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking permissions from role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke permissions'
    });
  }
};

/**
 * GET role permissions summary
 */
export const getRolePermissionsSummary = async (req, res) => {
  try {
    const roles = await Role.find({}).lean();
    const rolePermissions = await RolePermission.find({}).lean();
    
    const summary = roles.map(role => {
      const assignedCount = rolePermissions.filter(rp => rp.roleId === role.id).length;
      return {
        roleId: role.id,
        roleName: role.name,
        assignedPermissions: assignedCount
      };
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching role permissions summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role permissions summary'
    });
  }
};

// Legacy functions for backward compatibility
/**
 * GET permissions mapped to a role (legacy)
 */
export const getRolePermissions = async (req, res) => {
  const { roleId } = req.params;

  const role = await Role.findOne({ id: Number(roleId) });
  if (!role) return res.status(404).json({ message: 'Role not found' });

  const permissions = await Permission.find({ isActive: true }).lean();
  const assigned = await RolePermission.find({ roleId: Number(roleId) });

  const assignedSet = new Set(assigned.map(rp => rp.permissionId));

  const result = permissions.map(p => ({
    permissionId: p.id,
    module: p.module,
    action: p.action,
    code: p.code,
    assigned: assignedSet.has(p.id)
  }));

  res.json({
    role: role.name,
    roleId: role.id,
    permissions: result
  });
};

/**
 * ASSIGN permissions (legacy)
 */
export const assignPermissions = async (req, res) => {
  const { roleId, permissionIds } = req.body;

  if (!Array.isArray(permissionIds)) {
    return res.status(400).json({ message: 'permissionIds must be array' });
  }

  const docs = permissionIds.map(pid => ({
    roleId,
    permissionId: pid
  }));

  await RolePermission.insertMany(docs, { ordered: false })
    .catch(() => {}); // ignore duplicates

  res.json({ message: 'Permissions assigned' });
};

/**
 * REVOKE permissions (legacy)
 */
export const revokePermissions = async (req, res) => {
  const { roleId, permissionIds } = req.body;

  await RolePermission.deleteMany({
    roleId,
    permissionId: { $in: permissionIds }
  });

  res.json({ message: 'Permissions revoked' });
};
