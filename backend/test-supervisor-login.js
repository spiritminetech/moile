import mongoose from 'mongoose';
import { login } from './src/modules/auth/authService.js';
import jwt from 'jsonwebtoken';

async function testSupervisorLogin() {
  try {
    await mongoose.connect('mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp');
    console.log('✅ Connected to MongoDB');
    
    // Test login
    console.log('🔐 Testing supervisor login...');
    const loginResult = await login('supervisor@gmail.com', 'password123');
    
    console.log('📋 Login Result:', {
      autoSelected: loginResult.autoSelected,
      hasToken: !!loginResult.token,
      hasRefreshToken: !!loginResult.refreshToken
    });
    
    if (loginResult.token) {
      // Decode the token to see what's inside
      const decoded = jwt.verify(loginResult.token, process.env.JWT_SECRET);
      console.log('🔍 Token Contents:', {
        userId: decoded.userId,
        companyId: decoded.companyId,
        roleId: decoded.roleId,
        role: decoded.role,
        email: decoded.email,
        permissions: decoded.permissions?.slice(0, 3) + '...' // Show first 3 permissions
      });
      
      // Test middleware role check
      console.log('\n🧪 Middleware Role Check:');
      console.log('   Expected roles: [supervisor, admin, company_admin]');
      console.log('   Token role:', decoded.role);
      console.log('   Role matches (case-sensitive):', ['supervisor', 'admin', 'company_admin'].includes(decoded.role));
      console.log('   Role matches (lowercase):', ['supervisor', 'admin', 'company_admin'].includes(decoded.role.toLowerCase()));
      
      // Show the issue
      if (decoded.role === 'SUPERVISOR') {
        console.log('\n❌ ISSUE FOUND: Role is "SUPERVISOR" (uppercase) but middleware expects "supervisor" (lowercase)');
      }
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSupervisorLogin();