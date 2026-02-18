// Test script to verify enhanced daily target fields in API response
import axios from 'axios';

const BASE_URL = 'http://localhost:5002/api';

async function testEnhancedDailyTargetAPI() {
  try {
    console.log('🔐 Step 1: Login as worker@gmail.com...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    console.log('\n📋 Step 2: Fetching today\'s tasks...');
    const tasksResponse = await axios.get(`${BASE_URL}/worker/tasks/today`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!tasksResponse.data.success) {
      console.error('❌ Failed to fetch tasks:', tasksResponse.data.message);
      return;
    }

    console.log('Full response:', JSON.stringify(tasksResponse.data, null, 2));
    
    const responseData = tasksResponse.data.data;
    const tasks = responseData.tasks || [];
    
    console.log(`✅ Fetched ${tasks.length} tasks`);

    // Check assignment 7035 (LED Lighting)
    const task7035 = tasks.find(t => t.assignmentId === 7035);
    
    if (!task7035) {
      console.error('❌ Assignment 7035 not found in response');
      return;
    }

    console.log('\n🎯 Step 3: Checking Daily Job Target fields for Assignment 7035...');
    console.log('Task Name:', task7035.taskName);
    
    if (!task7035.dailyTarget) {
      console.error('❌ dailyTarget object is missing!');
      return;
    }

    console.log('\n📊 Basic Fields:');
    console.log('  description:', task7035.dailyTarget.description || 'MISSING');
    console.log('  quantity:', task7035.dailyTarget.quantity || 'MISSING');
    console.log('  unit:', task7035.dailyTarget.unit || 'MISSING');
    console.log('  targetCompletion:', task7035.dailyTarget.targetCompletion || 'MISSING');

    console.log('\n✨ Enhanced Fields:');
    console.log('  targetType:', task7035.dailyTarget.targetType || '❌ MISSING');
    console.log('  areaLevel:', task7035.dailyTarget.areaLevel || '❌ MISSING');
    console.log('  startTime:', task7035.dailyTarget.startTime || '❌ MISSING');
    console.log('  expectedFinish:', task7035.dailyTarget.expectedFinish || '❌ MISSING');
    console.log('  progressToday:', task7035.dailyTarget.progressToday ? 'Present' : '❌ MISSING');

    if (task7035.dailyTarget.progressToday) {
      console.log('\n📈 Progress Today Details:');
      console.log('  completed:', task7035.dailyTarget.progressToday.completed);
      console.log('  total:', task7035.dailyTarget.progressToday.total);
      console.log('  percentage:', task7035.dailyTarget.progressToday.percentage + '%');
    }

    // Verify all enhanced fields are present
    const hasAllFields = 
      task7035.dailyTarget.targetType &&
      task7035.dailyTarget.areaLevel &&
      task7035.dailyTarget.startTime &&
      task7035.dailyTarget.expectedFinish &&
      task7035.dailyTarget.progressToday;

    if (hasAllFields) {
      console.log('\n✅ SUCCESS: All enhanced daily target fields are present in API response!');
      console.log('\n📱 Mobile app should now display the comprehensive Daily Job Target section.');
    } else {
      console.log('\n❌ FAILURE: Some enhanced fields are missing from API response.');
      console.log('Backend controller may need to be updated or restarted.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testEnhancedDailyTargetAPI();
