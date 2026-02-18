// Test script to check what the API returns for assignment 7035

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5002/api';

async function testAssignment7035() {
  try {
    console.log('🔍 Testing API response for assignment 7035...\n');

    // Login as worker@gmail.com
    console.log('1️⃣ Logging in as worker@gmail.com...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Get today's tasks
    console.log('2️⃣ Fetching today\'s tasks...');
    const tasksResponse = await axios.get(`${API_BASE_URL}/worker/tasks/today`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Tasks fetched successfully\n');

    // Find assignment 7035
    const responseData = tasksResponse.data;
    console.log('Response structure:', Object.keys(responseData));
    
    let tasks = [];
    if (Array.isArray(responseData)) {
      tasks = responseData;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      tasks = responseData.data;
    } else if (responseData.tasks && Array.isArray(responseData.tasks)) {
      tasks = responseData.tasks;
    }
    
    console.log(`Found ${tasks.length} tasks\n`);
    
    const assignment7035 = tasks.find(t => t.assignmentId === 7035);

    if (!assignment7035) {
      console.log('❌ Assignment 7035 not found in API response');
      return;
    }

    console.log('📊 Assignment 7035 Data:\n');
    console.log('Task Name:', assignment7035.taskName);
    console.log('Status:', assignment7035.status);
    console.log('\n🎯 Daily Target Object:');
    console.log(JSON.stringify(assignment7035.dailyTarget, null, 2));

    console.log('\n📋 Daily Target Field Breakdown:');
    if (assignment7035.dailyTarget) {
      console.log(`  description: ${assignment7035.dailyTarget.description || 'MISSING'}`);
      console.log(`  quantity: ${assignment7035.dailyTarget.quantity || 'MISSING'}`);
      console.log(`  unit: ${assignment7035.dailyTarget.unit || 'MISSING'}`);
      console.log(`  targetCompletion: ${assignment7035.dailyTarget.targetCompletion || 'MISSING'}`);
      console.log(`  targetType: ${assignment7035.dailyTarget.targetType || 'MISSING'}`);
      console.log(`  areaLevel: ${assignment7035.dailyTarget.areaLevel || 'MISSING'}`);
      console.log(`  startTime: ${assignment7035.dailyTarget.startTime || 'MISSING'}`);
      console.log(`  expectedFinish: ${assignment7035.dailyTarget.expectedFinish || 'MISSING'}`);
      
      if (assignment7035.dailyTarget.progressToday) {
        console.log(`  progressToday:`);
        console.log(`    - completed: ${assignment7035.dailyTarget.progressToday.completed}`);
        console.log(`    - total: ${assignment7035.dailyTarget.progressToday.total}`);
        console.log(`    - percentage: ${assignment7035.dailyTarget.progressToday.percentage}%`);
      } else {
        console.log(`  progressToday: MISSING`);
      }
    } else {
      console.log('  ❌ No dailyTarget object in API response');
    }

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAssignment7035();
