import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import Role from './src/modules/role/Role.js';
import { generateToken } from './src/modules/auth/authService.js';

async function debugSupervisorToken() {
  try {
    await mongoose.connect('mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp');
    console.log('✅ Connected to MongoDB');
    
    // Find supervisor user
    const supervisorUser = await User.findOne({ email: 'supervisor@gmail.com' });
    if (!supervisorUser) {
      console.log('❌ Supervisor user not found');
      return;
    }
    
    console.log('👤 Supervisor User:', {
      id: supervisorUser.id,
      email: supervisorUser.email,
      name: supervisorUser.name
    });
    
    // Get company user mapping
    const companyUser = await CompanyUser.findOne({ userId: supervisorUser.id });
    if (!companyUser) {
      console.log('❌ Company user mapping not found');
      return;
    }
    
    console.log('🏢 Company User:', {
      companyId: companyUser.companyId,
      roleId: companyUser.roleId,
      isPrimary: companyUser.isPrimary
    });
    
    // Get role information
    const role = await Role.findOne({ id: companyUser.roleId });
    if (!role) {
      console.log('❌ Role not found');
      return;
    }
    
    console.log('👔 Role:', {
      id: role.id,
      name: role.name,
      level: role.level
    });
    
    // Generate a token like the auth service would
    console.log('\n🔑 Generating JWT token...');
    
    // Check what generateToken function expects
    const tokenPayload = {
      userId: supervisorUser.id,
      email: supervisorUser.email,
      companyId: companyUser.companyId,
      role: role.name.toLowerCase(), // This might be the issue - need to check what role name is expected
      roleId: role.id
    };
    
    console.log('📋 Token Payload:', tokenPayload);
    
    // Generate token
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });
    console.log('🎫 Generated Token:', token.substring(0, 50) + '...');
    
    // Decode token to verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 Decoded Token:', decoded);
    
    // Test what the middleware expects
    console.log('\n🧪 Middleware Role Check:');
    console.log('   Expected roles: [supervisor, admin, company_admin]');
    console.log('   Token role:', decoded.role);
    console.log('   Role matches:', ['supervisor', 'admin', 'company_admin'].includes(decoded.role));
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugSupervisorToken();