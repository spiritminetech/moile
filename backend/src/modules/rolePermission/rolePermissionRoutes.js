import express from 'express';
import {
  getRolesForMapping,
  getPermissionsForRole,
  updateRolePermissions,
  assignPermissionsToRole,
  revokePermissionsFromRole,
  getRolePermissionsSummary,
  // Legacy functions
  getRolePermissions,
  assignPermissions,
  revokePermissions
} from './rolePermissionController.js';

const router = express.Router();

/**
 * @route   GET /api/admin/role-permissions/roles
 * @desc    Get all roles for permission mapping dropdown
 * @access  Admin/Boss
 */
router.get('/roles', getRolesForMapping);

/**
 * @route   GET /api/admin/role-permissions/summary
 * @desc    Get role permissions summary for admin overview
 * @access  Admin/Boss
 */
router.get('/summary', getRolePermissionsSummary);

/**
 * @route   GET /api/admin/role-permissions/:roleId
 * @desc    Get permissions with assignment status for a specific role
 * @access  Admin/Boss
 * @param   {number} roleId - Role ID
 */
router.get('/:roleId', getPermissionsForRole);

/**
 * @route   PUT /api/admin/role-permissions/:roleId
 * @desc    Update role permissions (replace all assignments)
 * @access  Admin/Boss
 * @param   {number} roleId - Role ID
 * @body    {number[]} permissionIds - Array of permission IDs to assign
 */
router.put('/:roleId', updateRolePermissions);

/**
 * @route   POST /api/admin/role-permissions/:roleId/assign
 * @desc    Assign specific permissions to role
 * @access  Admin/Boss
 * @param   {number} roleId - Role ID
 * @body    {number[]} permissionIds - Array of permission IDs to assign
 */
router.post('/:roleId/assign', assignPermissionsToRole);

/**
 * @route   POST /api/admin/role-permissions/:roleId/revoke
 * @desc    Revoke specific permissions from role
 * @access  Admin/Boss
 * @param   {number} roleId - Role ID
 * @body    {number[]} permissionIds - Array of permission IDs to revoke
 */
router.post('/:roleId/revoke', revokePermissionsFromRole);

// Legacy routes for backward compatibility
router.get('/legacy/:roleId', getRolePermissions);
router.post('/legacy/assign', assignPermissions);
router.post('/legacy/revoke', revokePermissions);

export default router;