// Test worker login to verify JWT token generation
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { login } from './src/modules/auth/authService.js';

dotenv.config();

async function testWorkerLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test login
    console.log('\n🔐 Testing worker login...');
    const loginResult = await login('worker1@gmail.com', 'password123');
    
    console.log('📊 Login result:');
    console.log(`  Auto-selected: ${loginResult.autoSelected}`);
    console.log(`  Token exists: ${!!loginResult.token}`);
    console.log(`  User ID: ${loginResult.user?.id}`);
    console.log(`  Company ID: ${loginResult.company?.id}`);
    console.log(`  Role: ${loginResult.company?.role}`);
    console.log(`  Employee ID: ${loginResult.employee?.id}`);
    console.log(`  Current Project: ${JSON.stringify(loginResult.user?.currentProject)}`);

    // Decode the JWT token to see what's inside
    if (loginResult.token) {
      console.log('\n🔍 JWT Token contents:');
      const decoded = jwt.decode(loginResult.token);
      console.log(`  User ID: ${decoded.userId}`);
      console.log(`  Company ID: ${decoded.companyId}`);
      console.log(`  Role ID: ${decoded.roleId}`);
      console.log(`  Role: ${decoded.role}`);
      console.log(`  Email: ${decoded.email}`);
      console.log(`  Permissions: ${decoded.permissions?.join(', ') || 'None'}`);
      
      // Test if this token would work for project lookup
      console.log('\n🧪 Testing project lookup with this token:');
      if (decoded.companyId) {
        console.log(`✅ Token contains companyId: ${decoded.companyId}`);
        console.log('✅ Project lookup should work now!');
      } else {
        console.log('❌ Token missing companyId - project lookup will fail');
      }
    }

  } catch (error) {
    console.error('❌ Login test error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testWorkerLogin();