import bcrypt from 'bcrypt';
import { generateToken } from '../../../utils/jwtUtil.js';

import User from '../user/UserModel.js';
import CompanyUser from '../companyUser/CompanyUserModel.js';
import Company from '../company/CompanyModel.js';
import Role from '../role/RoleModel.js';
import RolePermission from '../rolePermission/RolePermissionModel.js';
import Permission from '../Permission/PermissionModel.js';

/**
 * LOGIN
 */
export const login = async (email, password) => {
  const user = await User.findOne({ email, isActive: true });
  if (!user) throw new Error('Invalid credentials');

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new Error('Invalid credentials');

  console.log("user",user);
  const mappings = await CompanyUser.find({
    userId: user.id,
    isActive: true
  });

  if (!mappings.length) throw new Error('No company access');

  if (mappings.length === 1) {
    return issueToken(user, mappings[0], true);
  }

  const companies = [];

  for (const m of mappings) {
    const company = await Company.findOne({ id: m.companyId, isActive: true });
    const role = await Role.findOne({ id: m.roleId });

    if (!company || !role) continue;

    companies.push({
      companyId: company.id,
      companyName: company.name,
      role: role.name
    });
  }

  if (!companies.length) throw new Error('No active company access');

  return {
    autoSelected: false,
    companies
  };
};

/**
 * SELECT COMPANY
 */
export const selectCompany = async (userId, companyId) => {
  const mapping = await CompanyUser.findOne({
    userId,
    companyId,
    isActive: true
  });

  if (!mapping) throw new Error('Unauthorized company');

  return issueToken({ id: userId }, mapping, false);
};

/**
 * ISSUE TOKEN
 */
const issueToken = async (user, mapping, autoSelected) => {
  const company = await Company.findOne({
    id: mapping.companyId,
    isActive: true
  });
  if (!company) throw new Error('Company inactive');

  const role = await Role.findOne({ id: mapping.roleId });
  if (!role) throw new Error('Invalid role');

  // 1️⃣ Get role → permission mappings
  const rolePerms = await RolePermission.find({ roleId: role.id });
  if (!rolePerms.length) {
    return buildResponse(user, company, role, [], autoSelected);
  }

  // 2️⃣ Fetch actual permissions
  const permissionIds = rolePerms.map(rp => rp.permissionId);
  console.log("permissionIds",permissionIds)

  const permissions = await Permission.find({
    id: { $in: permissionIds },
    isActive: true
  }).select('code');
   console.log("permissions",permissions)
  const permissionCodes = permissions.map(p => p.code);

  const token = generateToken({
    userId: user.id,
    companyId: company.id,
    roleId: role.id,
    role: role.name,
    permissions: permissionCodes
  });

  return {
    autoSelected,
    token,
    company: {
      id: company.id,
      name: company.name,
      role: role.name
    },
    permissions: permissionCodes
  };
};

/**
 * RESPONSE BUILDER
 */
const buildResponse = (user, company, role, permissions, autoSelected) => {
  const token = generateToken({
    userId: user.id,
    companyId: company.id,
    roleId: role.id,
    role: role.name,
    permissions
  });

  return {
    autoSelected,
    token,
    company: {
      id: company.id,
      name: company.name,
      role: role.name
    },
    permissions
  };
};
