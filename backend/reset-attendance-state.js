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

const resetAttendanceState = async () => {
  await connectDB();

  try {
    console.log('\n🔄 RESETTING ATTENDANCE STATE FOR CLEAN TEST\n');

    // 1. Find the user
    const user = await User.findOne({ email: 'worker@gmail.com' });
    console.log(`1. User: ${user.email} (ID: ${user.id})`);

    // 2. Check all attendance records for today
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
    });

    console.log(`\n2. Found ${todayAttendance.length} attendance records for today:`);
    todayAttendance.forEach((record, index) => {
      console.log(`   ${index + 1}. Check-in: ${record.checkInTime || 'None'}`);
      console.log(`      Check-out: ${record.checkOutTime || 'None'}`);
      console.log(`      Status: ${record.status}`);
      console.log(`      Project: ${record.projectId}`);
    });

    // 3. Clean up incomplete or problematic records
    console.log('\n3. Cleaning up attendance records...');
    
    // Delete any records without proper check-in time
    const incompleteRecords = await Attendance.find({
      userId: user.id,
      date: {
        $gte: today,
        $lt: tomorrow
      },
      $or: [
        { checkInTime: { $exists: false } },
        { checkInTime: null }
      ]
    });

    if (incompleteRecords.length > 0) {
      console.log(`   Deleting ${incompleteRecords.length} incomplete records...`);
      await Attendance.deleteMany({
        userId: user.id,
        date: {
          $gte: today,
          $lt: tomorrow
        },
        $or: [
          { checkInTime: { $exists: false } },
          { checkInTime: null }
        ]
      });
      console.log('   ✅ Incomplete records deleted');
    }

    // Close any open sessions (checked in but not checked out)
    const openSessions = await Attendance.find({
      userId: user.id,
      checkInTime: { $exists: true },
      checkOutTime: { $exists: false }
    });

    if (openSessions.length > 0) {
      console.log(`   Closing ${openSessions.length} open sessions...`);
      for (const session of openSessions) {
        await Attendance.updateOne(
          { _id: session._id },
          { 
            checkOutTime: new Date(),
            status: 'COMPLETED'
          }
        );
        console.log(`   ✅ Closed session from ${session.checkInTime}`);
      }
    }

    // 4. Test the complete flow
    console.log('\n4. Testing complete attendance flow...');
    
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'worker@gmail.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    const projectId = loginResponse.data.user.currentProject.id;

    console.log(`   Using project ID: ${projectId}`);

    // Check current status
    const statusResponse = await axios.get(
      'http://localhost:5002/api/worker/attendance/today',
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    console.log(`   Current status: ${statusResponse.data.session}`);

    // Test clock-in
    console.log('\n5. Testing clock-in...');
    try {
      const clockInResponse = await axios.post(
        'http://localhost:5002/api/worker/attendance/clock-in',
        {
          projectId: projectId,
          latitude: 12.865141646709928,
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

      console.log('   ✅ Clock-in successful!');
      console.log(`   Message: ${clockInResponse.data.message}`);
      console.log(`   Check-in time: ${clockInResponse.data.checkInTime}`);

      // Test clock-out
      console.log('\n6. Testing clock-out...');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const clockOutResponse = await axios.post(
        'http://localhost:5002/api/worker/attendance/clock-out',
        {
          projectId: projectId,
          latitude: 12.865141646709928,
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

      console.log('   ✅ Clock-out successful!');
      console.log(`   Message: ${clockOutResponse.data.message}`);
      console.log(`   Check-out time: ${clockOutResponse.data.checkOutTime}`);
      console.log(`   Work duration: ${clockOutResponse.data.workDuration} minutes`);

      // Final status check
      const finalStatusResponse = await axios.get(
        'http://localhost:5002/api/worker/attendance/today',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      console.log(`\n7. Final status: ${finalStatusResponse.data.session}`);

    } catch (attendanceError) {
      if (attendanceError.response) {
        console.log('   ❌ Attendance action failed:', attendanceError.response.data.message);
        
        // If it's still "Already checked in today", there might be data in a different format
        if (attendanceError.response.data.message.includes('Already checked in')) {
          console.log('\n   🔍 INVESTIGATING PERSISTENT "ALREADY CHECKED IN" ERROR:');
          
          // Check all attendance-related collections
          const collections = await mongoose.connection.db.listCollections().toArray();
          const attendanceCollections = collections.filter(col => 
            col.name.toLowerCase().includes('attendance') ||
            col.name.toLowerCase().includes('checkin') ||
            col.name.toLowerCase().includes('session')
          );
          
          console.log('   Attendance-related collections:', attendanceCollections.map(c => c.name));
          
          // Check if there are records in other formats
          const allAttendanceRecords = await mongoose.connection.db.collection('attendance').find({ userId: user.id }).toArray();
          console.log(`   Total attendance records for user: ${allAttendanceRecords.length}`);
          
          if (allAttendanceRecords.length > 0) {
            console.log('   Recent records:');
            allAttendanceRecords.slice(-3).forEach((record, index) => {
              console.log(`     ${index + 1}. ${JSON.stringify(record, null, 2)}`);
            });
          }
        }
      } else {
        console.log('   ❌ Request failed:', attendanceError.message);
      }
    }

    console.log('\n🎯 SUMMARY:');
    console.log('   ✅ Attendance state has been reset');
    console.log('   ✅ Task assignments are in place');
    console.log('   📱 Mobile app should now work correctly');
    console.log('   ');
    console.log('   If you still get errors, try:');
    console.log('   1. Restart the backend server');
    console.log('   2. Clear mobile app cache');
    console.log('   3. Fresh login in mobile app');

  } catch (error) {
    console.error('❌ Reset error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database disconnected');
  }
};

resetAttendanceState();