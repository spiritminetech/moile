import User from './UserModel.js';
import Role from '../role/RoleModel.js';
import Company from '../company/CompanyModel.js';
import CompanyUser from '../companyUser/CompanyUserModel.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendEmailNotification } from '../../../utils/emailService.js';

/**
 * Generate temporary password
 */
const generateTemporaryPassword = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

/**
 * Get next available user ID
 */
const getNextUserId = async () => {
  const lastUser = await User.findOne().sort({ id: -1 }).select('id');
  return lastUser ? lastUser.id + 1 : 1;
};

/**
 * Get next available company user ID
 */
const getNextCompanyUserId = async () => {
  const lastCompanyUser = await CompanyUser.findOne().sort({ id: -1 }).select('id');
  return lastCompanyUser ? lastCompanyUser.id + 1 : 1;
};

/**
 * Send invitation email to new user
 */
const sendInvitationEmail = async (email, tempPassword, companyName, roleName) => {
  const subject = 'Welcome to Fleet Management System';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to Fleet Management System</h2>
      <p>Your account has been created successfully!</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Login Details:</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Role:</strong> ${roleName}</p>
      </div>
      
      <p style="color: #666;">Please login and change your password immediately for security.</p>
      <p>Best regards,<br>Fleet Management Team</p>
    </div>
  `;
  
  return await sendEmailNotification(email, subject, html);
};

/**
 * Get all users with their roles and companies for user management
 */
const getUsersForManagement = async (req, res) => {
  try {
    console.log('🔍 Fetching users for management...');

    // Get users with their company and role information
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'companyUsers',
          localField: 'id',
          foreignField: 'userId',
          as: 'companyUser'
        }
      },
      {
        $unwind: {
          path: '$companyUser',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'companyUser.companyId',
          foreignField: 'id',
          as: 'company'
        }
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'companyUser.roleId',
          foreignField: 'id',
          as: 'role'
        }
      },
      {
        $project: {
          id: 1,
          email: 1,
          isActive: 1,
          createdAt: 1,
          companyName: { $arrayElemAt: ['$company.name', 0] },
          roleName: { $arrayElemAt: ['$role.name', 0] },
          roleLevel: { $arrayElemAt: ['$role.level', 0] },
          companyId: '$companyUser.companyId',
          roleId: '$companyUser.roleId'
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    console.log(`✅ Found ${users.length} users for management`);

    res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('❌ Error fetching users for management:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * Get roles for dropdown (excluding Boss for non-Boss users)
 */
const getRolesForDropdown = async (req, res) => {
  try {
    const { userRole } = req.query; // Current user's role
    
    let filter = {};
    
    // If user is not Boss, exclude Boss role
    if (userRole !== 'Boss') {
      filter = { name: { $ne: 'Boss' } };
    }

    const roles = await Role.find(filter)
      .select('id name level')
      .sort({ level: 1 });

    res.json({
      success: true,
      data: roles
    });

  } catch (error) {
    console.error('❌ Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      error: error.message
    });
  }
};

/**
 * Get companies for dropdown
 */
const getCompaniesForDropdown = async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .select('id name tenantCode')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: companies
    });

  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error.message
    });
  }
};

/**
 * Create new user with role and company assignment
 */
const createUserWithRole = async (req, res) => {
  try {
    const { email, roleId, companyId } = req.body;

    console.log('👤 Creating new user:', { email, roleId, companyId });

    // Validate required fields
    if (!email || !roleId || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Email, role, and company are required'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Get role and company details
    const [role, company] = await Promise.all([
      Role.findOne({ id: roleId }),
      Company.findOne({ id: companyId })
    ]);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Get next user ID
    const userId = await getNextUserId();

    // Create user
    const newUser = new User({
      id: userId,
      email: email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      tenantCode: company.tenantCode,
      isActive: true
    });

    await newUser.save();

    // Create company-user relationship
    const companyUserId = await getNextCompanyUserId();
    const companyUser = new CompanyUser({
      id: companyUserId,
      companyId: companyId,
      userId: userId,
      roleId: roleId,
      isPrimary: true,
      isActive: true,
      status: 'ACTIVE'
    });

    await companyUser.save();

    // Send invitation email
    const emailResult = await sendInvitationEmail(
      email, 
      tempPassword, 
      company.name, 
      role.name
    );

    console.log(`✅ User created successfully: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        userId: userId,
        email: email,
        role: role.name,
        company: company.name,
        emailSent: emailResult.success
      }
    });

  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

/**
 * Update user role and status
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId, isActive } = req.body;

    console.log(`✏️ Updating user ${userId}:`, { roleId, isActive });

    // Validate user exists
    const user = await User.findOne({ id: parseInt(userId) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user status if provided
    if (isActive !== undefined) {
      await User.updateOne(
        { id: parseInt(userId) },
        { isActive: isActive }
      );
    }

    // Update role if provided
    if (roleId) {
      const role = await Role.findOne({ id: roleId });
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      await CompanyUser.updateOne(
        { userId: parseInt(userId) },
        { roleId: roleId }
      );
    }

    console.log(`✅ User ${userId} updated successfully`);

    res.json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

/**
 * Disable user account
 */
const disableUser = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`🚫 Disabling user ${userId}`);

    const result = await User.updateOne(
      { id: parseInt(userId) },
      { isActive: false }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ User ${userId} disabled successfully`);

    res.json({
      success: true,
      message: 'User disabled successfully'
    });

  } catch (error) {
    console.error('❌ Error disabling user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable user',
      error: error.message
    });
  }
};

/**
 * Enable user account
 */
const enableUser = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`✅ Enabling user ${userId}`);

    const result = await User.updateOne(
      { id: parseInt(userId) },
      { isActive: true }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ User ${userId} enabled successfully`);

    res.json({
      success: true,
      message: 'User enabled successfully'
    });

  } catch (error) {
    console.error('❌ Error enabling user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable user',
      error: error.message
    });
  }
};

/**
 * Get user details for editing
 */
const getUserForEdit = async (req, res) => {
  try {
    const { userId } = req.params;

    const userDetails = await User.aggregate([
      {
        $match: { id: parseInt(userId) }
      },
      {
        $lookup: {
          from: 'companyUsers',
          localField: 'id',
          foreignField: 'userId',
          as: 'companyUser'
        }
      },
      {
        $unwind: '$companyUser'
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'companyUser.companyId',
          foreignField: 'id',
          as: 'company'
        }
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'companyUser.roleId',
          foreignField: 'id',
          as: 'role'
        }
      },
      {
        $project: {
          id: 1,
          email: 1,
          isActive: 1,
          companyId: '$companyUser.companyId',
          roleId: '$companyUser.roleId',
          companyName: { $arrayElemAt: ['$company.name', 0] },
          roleName: { $arrayElemAt: ['$role.name', 0] }
        }
      }
    ]);

    if (userDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: userDetails[0]
    });

  } catch (error) {
    console.error('❌ Error fetching user for edit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
};

export {
  getUsersForManagement,
  getRolesForDropdown,
  getCompaniesForDropdown,
  createUserWithRole,
  updateUserRole,
  disableUser,
  enableUser,
  getUserForEdit
};