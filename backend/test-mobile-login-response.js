// Test script to verify what the mobile app receives from login API
import mongoose from 'mongoose';
import { login } from './src/modules/auth/authService.js';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testMobileLoginResponse() {
  try {
    console.log('📱 Testing mobile login response...');
    
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

    // Find the corresponding user
    const user = await User.findOne({ id: employee.userId });
    if (!user) {
      console.log('❌ User not found for employee 107');
      return;
    }
    
    console.log('👤 User data:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);

    // Test login with the user's credentials
    try {
      console.log('\n🔐 Testing login API response...');
      const loginResult = await login(user.email, 'password123');
      
      console.log('📱 Login API Response:');
      console.log('  - Success:', !!loginResult.user);
      console.log('  - Auto Selected:', loginResult.autoSelected);
      
      if (loginResult.user) {
        console.log('👤 User object in response:');
        console.log('  - ID:', loginResult.user.id);
        console.log('  - Email:', loginResult.user.email);
        console.log('  - Name:', loginResult.user.name);
        console.log('  - Current Project:', loginResult.user.currentProject);
        
        console.log('\n🏢 Company object in response:');
        console.log('  - ID:', loginResult.company.id);
        console.log('  - Name:', loginResult.company.name);
        console.log('  - Role:', loginResult.company.role);
        
        console.log('\n📱 What mobile app will display:');
        console.log('  - Dashboard greeting: "Hello ' + loginResult.user.name + '"');
        console.log('  - Expected: "Hello Raj Kumar"');
        console.log('  - Match:', loginResult.user.name === 'Raj Kumar' ? '✅ YES' : '❌ NO');
        
        if (loginResult.user.name !== 'Raj Kumar') {
          console.log('  - Actual name received:', `"${loginResult.user.name}"`);
          console.log('  - Name type:', typeof loginResult.user.name);
          console.log('  - Name length:', loginResult.user.name?.length);
        }
      } else if (loginResult.companies) {
        console.log('🏢 Multiple companies found, need to select company');
        console.log('Available companies:', loginResult.companies.length);
      }
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testMobileLoginResponse();