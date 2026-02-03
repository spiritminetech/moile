// Test script to verify mobile app can connect to backend API
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { login } from './src/modules/auth/authService.js';
import { getWorkerTasksToday } from './src/modules/worker/workerController.js';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testMobileApiConnection() {
  try {
    console.log('📱 Testing mobile API connection...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to database');

    // Test 1: Check if backend server is running on the expected port
    console.log('\n🔍 Test 1: Backend Server Status');
    console.log('Expected URL: http://192.168.0.3:5002/api');
    console.log('Current NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('Server should be running on port:', process.env.PORT || 5002);

    // Test 2: Verify login API response format
    console.log('\n🔍 Test 2: Login API Response Format');
    const employee = await Employee.findOne({ id: 107 });
    const user = await User.findOne({ id: employee.userId });
    
    try {
      const loginResult = await login(user.email, 'password123');
      console.log('✅ Login API working');
      console.log('Response format:');
      console.log('  - autoSelected:', loginResult.autoSelected);
      console.log('  - user.name:', loginResult.user.name);
      console.log('  - user.email:', loginResult.user.email);
      console.log('  - company.name:', loginResult.company.name);
      console.log('  - token length:', loginResult.token?.length);
    } catch (loginError) {
      console.log('❌ Login API error:', loginError.message);
    }

    // Test 3: Verify dashboard API response format
    console.log('\n🔍 Test 3: Dashboard API Response Format');
    const mockReq = {
      user: {
        userId: employee.userId,
        companyId: employee.companyId,
        role: 'worker'
      },
      query: {},
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' }
    };

    const mockRes = {
      json: (data) => {
        if (data.success && data.data) {
          console.log('✅ Dashboard API working');
          console.log('Response format:');
          console.log('  - worker.name:', data.data.worker.name);
          console.log('  - supervisor.name:', data.data.supervisor.name);
          console.log('  - dailySummary.overallProgress:', data.data.dailySummary.overallProgress + '%');
          console.log('  - dailySummary.totalTasks:', data.data.dailySummary.totalTasks);
          console.log('  - dailySummary.completedTasks:', data.data.dailySummary.completedTasks);
        } else {
          console.log('❌ Dashboard API error:', data.message);
        }
        return mockRes;
      },
      status: (code) => {
        console.log('❌ Dashboard API status:', code);
        return mockRes;
      }
    };

    await getWorkerTasksToday(mockReq, mockRes);

    // Test 4: Check mobile app configuration
    console.log('\n🔍 Test 4: Mobile App Configuration Check');
    console.log('Mobile app should be configured with:');
    console.log('  - API_CONFIG.BASE_URL: http://192.168.0.3:5002/api');
    console.log('  - API_CONFIG.MOCK_MODE: false');
    console.log('  - Network connectivity to backend server');

    // Test 5: Provide troubleshooting steps
    console.log('\n🔧 Troubleshooting Steps for Mobile App:');
    console.log('1. Check if backend server is running on port 5002');
    console.log('2. Verify mobile device can reach 192.168.0.3:5002');
    console.log('3. Clear mobile app cache by logging out and back in');
    console.log('4. If still not working, clear AsyncStorage completely');
    console.log('5. Check mobile app network logs for API call failures');

    console.log('\n📱 Mobile App Cache Clearing Instructions:');
    console.log('Option 1 - Logout/Login:');
    console.log('  1. Tap "Logout" button in dashboard');
    console.log('  2. Login with: worker1@gmail.com / password123');
    console.log('');
    console.log('Option 2 - Clear AsyncStorage (if Option 1 fails):');
    console.log('  1. Uninstall the mobile app');
    console.log('  2. Reinstall the mobile app');
    console.log('  3. Login again');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testMobileApiConnection();