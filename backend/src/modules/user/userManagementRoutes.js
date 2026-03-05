import express from 'express';
import {
  getUsersForManagement,
  getRolesForDropdown,
  getCompaniesForDropdown,
  createUserWithRole,
  updateUserRole,
  disableUser,
  enableUser,
  getUserForEdit
} from './userManagementController.js';

const router = express.Router();

/**
 * @route   GET /api/user-management/users
 * @desc    Get all users with their roles and companies for management
 * @access  Admin/Boss
 */
router.get('/users', getUsersForManagement);

/**
 * @route   GET /api/user-management/roles
 * @desc    Get roles for dropdown (excluding Boss for non-Boss users)
 * @access  Admin/Boss
 * @query   {string} userRole - Current user's role
 */
router.get('/roles', getRolesForDropdown);

/**
 * @route   GET /api/user-management/companies
 * @desc    Get companies for dropdown
 * @access  Admin/Boss
 */
router.get('/companies', getCompaniesForDropdown);

/**
 * @route   POST /api/user-management/users
 * @desc    Create new user with role and company assignment
 * @access  Admin/Boss
 * @body    {string} email - User email
 * @body    {number} roleId - Role ID
 * @body    {number} companyId - Company ID
 */
router.post('/users', createUserWithRole);

/**
 * @route   GET /api/user-management/users/:userId
 * @desc    Get user details for editing
 * @access  Admin/Boss
 * @param   {number} userId - User ID
 */
router.get('/users/:userId', getUserForEdit);

/**
 * @route   PUT /api/user-management/users/:userId
 * @desc    Update user role and status
 * @access  Admin/Boss
 * @param   {number} userId - User ID
 * @body    {number} [roleId] - New role ID
 * @body    {boolean} [isActive] - Active status
 */
router.put('/users/:userId', updateUserRole);

/**
 * @route   PUT /api/user-management/users/:userId/disable
 * @desc    Disable user account
 * @access  Admin/Boss
 * @param   {number} userId - User ID
 */
router.put('/users/:userId/disable', disableUser);

/**
 * @route   PUT /api/user-management/users/:userId/enable
 * @desc    Enable user account
 * @access  Admin/Boss
 * @param   {number} userId - User ID
 */
router.put('/users/:userId/enable', enableUser);

export default router;