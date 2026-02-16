import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function testStartTaskAPI() {
  try {
    // First, verify the attendance record in database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const attendanceCollection = db.collection('attendances');

    console.log('🔍 Step 1: Verify Attendance Record in Database');
    console.log('=' .repeat(70));
    
    const attendance = await attendanceCollection.findOne({
      employeeId: 2,
      id: 1769696435731
    });

    if (attendance) {
      console.log('✅ Attendance record found:');
      console.log(`   ID: ${attendance.id}`);
      console.log(`   Employee ID: ${attendance.employeeId}`);
      console.log(`   Date: ${attendance.date} (${typeof attendance.date})`);
      console.log(`   Has checkIn field: ${attendance.checkIn !== undefined}`);
      console.log(`   checkIn value: ${attendance.checkIn}`);
      console.log(`   Has checkInTime field: ${attendance.checkInTime !== undefined}`);
      console.log(`   checkInTime value: ${attendance.checkInTime}`);
      console.log(`   Status: ${attendance.status}`);
    } else {
      console.log('❌ Attendance record not found!');
    }

    // Test the validation query that the API uses
    console.log('\n🔍 Step 2: Test Validation Query');
    console.log('=' .repeat(70));
    
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log(`Query date range: ${startOfToday.toISOString()} to ${startOfTomorrow.toISOString()}`);
    
    const validationResult = await attendanceCollection.findOne({
      employeeId: 2,
      checkIn: { $exists: true, $ne: null },
      date: { $gte: startOfToday, $lt: startOfTomorrow }
    });

    if (validationResult) {
      console.log('✅ Validation query PASSED - attendance found');
    } else {
      console.log('❌ Validation query FAILED - attendance not found');
      console.log('   This is why the API returns "must check in" error');
    }

    await mongoose.disconnect();

    // Now test the actual API
    console.log('\n🔍 Step 3: Test Start Task API');
    console.log('=' .repeat(70));

    // Login first to get token
    console.log('Logging in as worker@gmail.com...');
    const loginResponse = await axios.post('http://localhost:5000/auth/login', {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Try to start task 7036 (first queued task)
    console.log('\nAttempting to start task 7036...');
    
    try {
      const startTaskResponse = await axios.post(
        'http://localhost:5000/worker/tasks/7036/start',
        {
          location: {
            latitude: 12.9716,
            longitude: 77.5946
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Task started successfully!');
      console.log('Response:', JSON.stringify(startTaskResponse.data, null, 2));

    } catch (error) {
      if (error.response) {
        console.log('❌ API Error:');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message}`);
        console.log(`   Error Code: ${error.response.data.error}`);
        console.log('\nFull error response:');
        console.log(JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Request failed:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

testStartTaskAPI();
