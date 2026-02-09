/**
 * Test script for Driver Attendance Endpoints
 * Run this after starting the backend server
 */

const BASE_URL = 'http://localhost:5002/api';

// You'll need to replace this with a valid driver token
const DRIVER_TOKEN = 'YOUR_DRIVER_TOKEN_HERE';

const testEndpoints = async () => {
  console.log('🧪 Testing Driver Attendance Endpoints\n');

  // Test 1: Clock In
  console.log('1️⃣ Testing POST /driver/attendance/clock-in');
  try {
    const clockInResponse = await fetch(`${BASE_URL}/driver/attendance/clock-in`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DRIVER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vehicleId: 1,
        preCheckCompleted: true,
        mileageReading: 12500,
        location: {
          latitude: 25.2048,
          longitude: 55.2708,
          accuracy: 10,
          timestamp: new Date().toISOString()
        }
      })
    });
    const clockInData = await clockInResponse.json();
    console.log('✅ Clock In Response:', JSON.stringify(clockInData, null, 2));
  } catch (error) {
    console.error('❌ Clock In Error:', error.message);
  }

  console.log('\n');

  // Test 2: Get Attendance Summary
  console.log('2️⃣ Testing GET /driver/attendance/summary');
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    const summaryResponse = await fetch(
      `${BASE_URL}/driver/attendance/summary?month=${month}&year=${year}`,
      {
        headers: {
          'Authorization': `Bearer ${DRIVER_TOKEN}`
        }
      }
    );
    const summaryData = await summaryResponse.json();
    console.log('✅ Attendance Summary Response:', JSON.stringify(summaryData, null, 2));
  } catch (error) {
    console.error('❌ Attendance Summary Error:', error.message);
  }

  console.log('\n');

  // Test 3: Get Trip History
  console.log('3️⃣ Testing GET /driver/attendance/trip-history');
  try {
    const historyResponse = await fetch(
      `${BASE_URL}/driver/attendance/trip-history?page=1&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${DRIVER_TOKEN}`
        }
      }
    );
    const historyData = await historyResponse.json();
    console.log('✅ Trip History Response:', JSON.stringify(historyData, null, 2));
  } catch (error) {
    console.error('❌ Trip History Error:', error.message);
  }

  console.log('\n');

  // Test 4: Clock Out
  console.log('4️⃣ Testing POST /driver/attendance/clock-out');
  try {
    const clockOutResponse = await fetch(`${BASE_URL}/driver/attendance/clock-out`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DRIVER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vehicleId: 1,
        postCheckCompleted: true,
        mileageReading: 12650,
        fuelLevel: 75,
        location: {
          latitude: 25.2048,
          longitude: 55.2708,
          accuracy: 10,
          timestamp: new Date().toISOString()
        }
      })
    });
    const clockOutData = await clockOutResponse.json();
    console.log('✅ Clock Out Response:', JSON.stringify(clockOutData, null, 2));
  } catch (error) {
    console.error('❌ Clock Out Error:', error.message);
  }

  console.log('\n✅ All tests completed!');
};

// Run tests
testEndpoints().catch(console.error);
