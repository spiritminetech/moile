import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import Attendance from './src/modules/attendance/Attendance.js';
import axios from 'axios';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixAttendanceStateIssue = async () => {
  await connectDB();

  try {
    console.log('\n🔧 FIXING ATTENDANCE STATE ISSUE FOR WORKER@GMAIL.COM\n');

    // 1. Find the user
    const user = await User.findOne({ email: 'worker@gmail.com' });
    console.log(`1. User found: ${user.email} (ID: ${user.id})`);

    // 2. Check current attendance records
    console.log('\n2. Checking current attendance records...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.find({
      userId: user.id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ createdAt: -1 });

    console.log(`   Found ${todayAttendance.length} attendance records for today`);
    
    if (todayAttendance.length > 0) {
      console.log('   Recent attendance records:');
      todayAttendance.forEach((record, index) => {
        console.log(`     ${index + 1}. ${record.checkInTime ? 'IN' : ''}${record.checkOutTime ? ' OUT' : ''} - Project: ${record.projectId}`);
        console.log(`        Check-in: ${record.checkInTime || 'None'}`);
        console.log(`        Check-out: ${record.checkOutTime || 'None'}`);
        console.log(`        Status: ${record.status}`);
      });
    } else {
      console.log('   No attendance records found for today');
    }

    // 3. Check if user is currently clocked in
    const activeAttendance = await Attendance.findOne({
      userId: user.id,
      checkInTime: { $exists: true },
      checkOutTime: { $exists: false }
    }).sort({ createdAt: -1 });

    if (activeAttendance) {
      console.log('\n3. ✅ User is currently CLOCKED IN');
      console.log(`   Active session since: ${activeAttendance.checkInTime}`);
      console.log(`   Project: ${activeAttendance.projectId}`);
      console.log('   → User can now CLOCK OUT');
    } else {
      console.log('\n3. ❌ User is currently CLOCKED OUT');
      console.log('   → User needs to CLOCK IN first');
    }

    // 4. Test the attendance API to see current status
    console.log('\n4. Testing attendance status API...');
    
    try {
      // First, login to get a fresh token
      const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
        email: 'worker@gmail.com',
        password: 'password123'
      });

      const token = loginResponse.data.token;
      const projectId = loginResponse.data.user.currentProject.id;

      // Test attendance status
      try {
        const statusResponse = await axios.get(
          'http://localhost:5002/api/worker/attendance/status',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('   ✅ Attendance status API response:');
        console.log(`   Status: ${statusResponse.data.status}`);
        console.log(`   Session: ${statusResponse.data.session}`);
        console.log(`   Check-in time: ${statusResponse.data.checkInTime || 'None'}`);
        console.log(`   Project: ${statusResponse.data.projectId || 'None'}`);

      } catch (statusError) {
        console.log('   ❌ Attendance status API failed:', statusError.response?.data || statusError.message);
      }

      // 5. Provide solution based on current state
      console.log('\n5. 🎯 SOLUTION:');
      
      if (activeAttendance) {
        console.log('   The user is already clocked in. The mobile app should show:');
        console.log('   ✅ CLOCK OUT button (enabled)');
        console.log('   ❌ CLOCK IN button (disabled)');
        console.log('   ');
        console.log('   If the mobile app is showing CLOCK IN instead of CLOCK OUT,');
        console.log('   the app needs to refresh its attendance status.');
      } else {
        console.log('   The user is clocked out. The mobile app should show:');
        console.log('   ✅ CLOCK IN button (enabled)');
        console.log('   ❌ CLOCK OUT button (disabled)');
        console.log('   ');
        console.log('   User should CLOCK IN first, then CLOCK OUT.');
      }

      // 6. Test clock-in if user is not clocked in
      if (!activeAttendance) {
        console.log('\n6. Testing CLOCK IN...');
        
        try {
          const clockInResponse = await axios.post(
            'http://localhost:5002/api/worker/attendance/clock-in',
            {
              projectId: projectId,
              latitude: 12.865141646709928, // Bangalore coordinates
              longitude: 77.6467982341202,
              accuracy: 10
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('   ✅ CLOCK IN successful!');
          console.log(`   Message: ${clockInResponse.data.message}`);
          console.log(`   Check-in time: ${clockInResponse.data.checkInTime}`);
          console.log('   ');
          console.log('   Now you can test CLOCK OUT from the mobile app.');

        } catch (clockInError) {
          console.log('   ❌ CLOCK IN failed:', clockInError.response?.data || clockInError.message);
        }
      }

    } catch (loginError) {
      console.log('   ❌ Login failed:', loginError.response?.data || loginError.message);
    }

    // 7. Mobile app guidance
    console.log('\n7. 📱 MOBILE APP GUIDANCE:');
    console.log('   The mobile app should:');
    console.log('   1. Check attendance status on app start/resume');
    console.log('   2. Show correct button based on current state');
    console.log('   3. Refresh status after each attendance action');
    console.log('   ');
    console.log('   Attendance Flow:');
    console.log('   CLOCKED OUT → [CLOCK IN] → CLOCKED IN → [CLOCK OUT] → CLOCKED OUT');

  } catch (error) {
    console.error('❌ Fix error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
};

fixAttendanceStateIssue();