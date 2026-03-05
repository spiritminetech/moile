import express from 'express';
import {
  getPermissions,
  createPermission,
  updatePermission,
  togglePermissionStatus,
  deletePermission
} from './permissionController.js';

const router = express.Router();

/**
 * @route   GET /api/admin/permissions
 * @desc    Get all permissions for management
 * @access  Admin/Boss
 */
router.get('/', getPermissions);

/**
 * @route   POST /api/admin/permissions
 * @desc    Create new permission
 * @access  Admin/Boss
 * @body    {string} module - Permission module
 * @body    {string} action - Permission action
 * @body    {string} code - Permission code
 */
router.post('/', createPermission);

/**
 * @route   PUT /api/admin/permissions/:permissionId
 * @desc    Update permission
 * @access  Admin/Boss
 * @param   {number} permissionId - Permission ID
 * @body    {string} [module] - Permission module
 * @body    {string} [action] - Permission action
 * @body    {string} [code] - Permission code
 * @body    {boolean} [isActive] - Active status
 */
router.put('/:permissionId', updatePermission);

/**
 * @route   PUT /api/admin/permissions/:permissionId/toggle
 * @desc    Toggle permission active status
 * @access  Admin/Boss
 * @param   {number} permissionId - Permission ID
 */
router.put('/:permissionId/toggle', togglePermissionStatus);

/**
 * @route   DELETE /api/admin/permissions/:permissionId
 * @desc    Delete permission (only if not assigned to any role)
 * @access  Admin/Boss
 * @param   {number} permissionId - Permission ID
 */
router.delete('/:permissionId', deletePermission);

export default router;