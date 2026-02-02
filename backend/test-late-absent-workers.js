// Test script for Late/Absent Workers API endpoint
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Test credentials - replace with actual supervisor credentials
const TEST_CREDENTIALS = {
  email: 'supervisor@company.com',
  password: 'password123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in as supervisor...');
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, TEST_CREDENTIALS);
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed - no token received');
      return false;
    }
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testLateAbsentWorkersAPI() {
  try {
    console.log('\n📊 Testing Late/Absent Workers API...');
    
    // Test with project ID 1 and today's date
    const projectId = 1;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const response = await axios.get(
      `${API_BASE_URL}/api/supervisor/late-absent-workers?projectId=${projectId}&date=${date}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ API Response received');
    console.log('📈 Summary:', response.data.summary);
    console.log('⏰ Late Workers:', response.data.lateWorkers?.length || 0);
    console.log('❌ Absent Workers:', response.data.absentWorkers?.length || 0);
    console.log('🏗️ Project:', response.data.projectName);

    if (response.data.lateWorkers?.length > 0) {
      console.log('\n⏰ Late Workers Details:');
      response.data.lateWorkers.forEach((worker, index) => {
        console.log(`  ${index + 1}. ${worker.workerName} - ${worker.minutesLate} minutes late`);
      });
    }

    if (response.data.absentWorkers?.length > 0) {
      console.log('\n❌ Absent Workers Details:');
      response.data.absentWorkers.forEach((worker, index) => {
        console.log(`  ${index + 1}. ${worker.workerName} - ${worker.role}`);
      });
    }

    return response.data;

  } catch (error) {
    console.log('❌ API Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status === 404) {
      console.log('💡 Tip: Make sure project ID 1 exists and has worker assignments for today');
    }
    return null;
  }
}

async function testSendAttendanceAlert(workerIds) {
  try {
    console.log('\n📢 Testing Send Attendance Alert API...');
    
    if (!workerIds || workerIds.length === 0) {
      console.log('⚠️ No worker IDs provided, skipping alert test');
      return;
    }

    const alertData = {
      workerIds: workerIds.slice(0, 2), // Test with first 2 workers only
      message: 'This is a test attendance alert. Please check your attendance status.',
      projectId: 1
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/supervisor/send-attendance-alert`,
      alertData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Alert sent successfully');
    console.log('📊 Alert Summary:', response.data.summary);

  } catch (error) {
    console.log('❌ Send Alert failed:', error.response?.data?.message || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Late/Absent Workers API Tests\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Step 2: Test Late/Absent Workers API
  const workersData = await testLateAbsentWorkersAPI();
  
  // Step 3: Test Send Alert API (if we have workers)
  if (workersData) {
    const allWorkerIds = [
      ...(workersData.lateWorkers?.map(w => w.employeeId) || []),
      ...(workersData.absentWorkers?.map(w => w.employeeId) || [])
    ];
    
    if (allWorkerIds.length > 0) {
      await testSendAttendanceAlert(allWorkerIds);
    }
  }

  console.log('\n✅ Tests completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Access the UI at: http://localhost:3000/supervisor/late-absent');
  console.log('2. Select a project and date to view late/absent workers');
  console.log('3. Use the Send Alert feature to notify workers');
}

// Run the tests
runTests().catch(console.error);