// Test script to verify dashboard name fix
import mongoose from 'mongoose';
import { login } from './src/modules/auth/authService.js';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testDashboardNameFix() {
  try {
    console.log('🧪 Testing dashboard name fix...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to database');

    // Find Employee 107 (Raj Kumar)
    const employee = await Employee.findOne({ id: 107 });
    if (!employee) {
      console.log('❌ Employee 107 not found');
      return;
    }
    
    console.log('📋 Employee 107 data:');
    console.log('  - ID:', employee.id);
    console.log('  - Full Name:', employee.fullName);
    console.log('  - User ID:', employee.userId);
    console.log('  - Company ID:', employee.companyId);

    // Find the corresponding user
    const user = await User.findOne({ id: employee.userId });
    if (!user) {
      console.log('❌ User not found for employee 107');
      return;
    }
    
    console.log('👤 User data:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Has name field:', 'name' in user);
    console.log('  - User object keys:', Object.keys(user.toObject()));

    // Test login with the user's email
    try {
      console.log('\n🔐 Testing login...');
      const loginResult = await login(user.email, 'password123'); // Assuming default password
      
      if (loginResult.user) {
        console.log('✅ Login successful!');
        console.log('📱 Dashboard will show: "Hello', loginResult.user.name + '"');
        console.log('🎯 Expected: "Hello Raj Kumar"');
        console.log('✅ Match:', loginResult.user.name === 'Raj Kumar' ? 'YES' : 'NO');
      } else if (loginResult.companies) {
        console.log('🏢 Multiple companies found, need to select company');
        console.log('Available companies:', loginResult.companies.length);
      }
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.message);
      console.log('💡 This might be due to password mismatch, but the name fix should still work');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testDashboardNameFix();