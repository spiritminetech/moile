// Test dashboard attendance integration
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import Attendance from './src/modules/attendance/Attendance.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

// Simulate the getAttendanceStatus function logic
async function simulateGetAttendanceStatus(userId, companyId) {
  const employee = await Employee.findOne({ userId, companyId });
  if (!employee) {
    return { error: 'Employee not found' };
  }

  const today = new Date().toISOString().split("T")[0];
  const attendance = await Attendance.findOne({
    employeeId: employee.id,
    date: today
  });

  if (!attendance) {
    return {
      status: 'NOT_CLOCKED_IN',
      session: 'NOT_LOGGED_IN',
      checkInTime: null,
      checkOutTime: null,
      lunchStartTime: null,
      lunchEndTime: null,
      overtimeStartTime: null,
      date: today,
      projectId: null,
      workDuration: 0,
      lunchDuration: 0,
      isOnLunchBreak: false
    };
  }

  // Calculate durations
  let workDuration = 0;
  let lunchDuration = 0;
  
  if (attendance.checkIn) {
    const endTime = attendance.checkOut || new Date();
    workDuration = Math.round((endTime - attendance.checkIn) / (1000 * 60)); // minutes
  }

  if (attendance.lunchStartTime && attendance.lunchEndTime) {
    lunchDuration = Math.round((attendance.lunchEndTime - attendance.lunchStartTime) / (1000 * 60)); // minutes
  }

  // Determine current status
  let status = 'NOT_CLOCKED_IN';
  let session = 'NOT_LOGGED_IN';
  let isOnLunchBreak = false;

  if (attendance.checkOut) {
    status = 'CLOCKED_OUT';
    session = 'CHECKED_OUT';
  } else if (attendance.checkIn) {
    if (attendance.lunchStartTime && !attendance.lunchEndTime) {
      status = 'ON_LUNCH_BREAK';
      session = 'ON_LUNCH';
      isOnLunchBreak = true;
    } else {
      status = 'CLOCKED_IN';
      session = 'CHECKED_IN';
    }
  }

  return {
    status: status,
    session: session,
    checkInTime: attendance.checkIn,
    checkOutTime: attendance.checkOut,
    lunchStartTime: attendance.lunchStartTime || null,
    lunchEndTime: attendance.lunchEndTime || null,
    overtimeStartTime: attendance.overtimeStartTime || null,
    date: attendance.date,
    projectId: attendance.projectId,
    workDuration: workDuration,
    lunchDuration: lunchDuration,
    isOnLunchBreak: isOnLunchBreak,
    pendingCheckout: attendance.pendingCheckout || false
  };
}

async function testDashboardAttendanceIntegration() {
  console.log('🧪 Testing Dashboard Attendance Integration');
  console.log('==========================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test with Employee 107 (userId: 64, companyId: 1)
    const userId = 64;
    const companyId = 1;

    console.log('\n1️⃣ Simulating getCurrentAttendanceStatus API call...');
    console.log(`   User ID: ${userId}, Company ID: ${companyId}`);

    const attendanceStatus = await simulateGetAttendanceStatus(userId, companyId);
    
    if (attendanceStatus.error) {
      console.log('❌ Error:', attendanceStatus.error);
      return;
    }

    console.log('\n2️⃣ API Response (what dashboard will receive):');
    console.log('   Status:', attendanceStatus.status);
    console.log('   Session:', attendanceStatus.session);
    console.log('   Check In Time:', attendanceStatus.checkInTime);
    console.log('   Check Out Time:', attendanceStatus.checkOutTime);
    console.log('   Work Duration (minutes):', attendanceStatus.workDuration);
    console.log('   Is On Lunch Break:', attendanceStatus.isOnLunchBreak);
    console.log('   Project ID:', attendanceStatus.projectId);

    console.log('\n3️⃣ Dashboard Transformation:');
    
    // Simulate what the dashboard hook will do
    const attendanceRecord = attendanceStatus.status !== 'NOT_CLOCKED_IN' ? {
      id: Date.now(),
      employeeId: 107, // This would come from transformedData.worker?.id
      projectId: attendanceStatus.projectId || 0,
      date: attendanceStatus.date,
      loginTime: attendanceStatus.checkInTime || '', // Map checkInTime to loginTime
      logoutTime: attendanceStatus.checkOutTime || '', // Map checkOutTime to logoutTime
      lunchStartTime: attendanceStatus.lunchStartTime || '',
      lunchEndTime: attendanceStatus.lunchEndTime || '',
      overtimeStartTime: attendanceStatus.overtimeStartTime || null,
      sessionType: attendanceStatus.isOnLunchBreak ? 'lunch' : 'regular',
      location: {
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        timestamp: new Date()
      }
    } : null;

    const currentSessionDuration = attendanceStatus.status === 'CLOCKED_IN' && attendanceStatus.checkInTime
      ? Math.floor((new Date().getTime() - new Date(attendanceStatus.checkInTime).getTime()) / (1000 * 60))
      : 0;

    const workingHours = {
      currentSessionDuration,
      totalHours: attendanceStatus.workDuration || 0
    };

    console.log('   Attendance Record:', {
      hasRecord: !!attendanceRecord,
      loginTime: attendanceRecord?.loginTime,
      logoutTime: attendanceRecord?.logoutTime,
      sessionType: attendanceRecord?.sessionType
    });

    console.log('   Working Hours:', workingHours);

    console.log('\n4️⃣ Dashboard Display (what user will see):');
    const isLoggedIn = attendanceRecord && !attendanceRecord.logoutTime;
    console.log(`   Status: ${isLoggedIn ? 'LOGGED IN' : 'LOGGED OUT'}`);
    console.log(`   Current Session: ${Math.floor(workingHours.currentSessionDuration / 60)}h ${workingHours.currentSessionDuration % 60}m`);
    console.log(`   Total Today: ${Math.floor(workingHours.totalHours / 60)}h ${workingHours.totalHours % 60}m`);

    if (attendanceRecord) {
      console.log(`   Login Time: ${attendanceRecord.loginTime ? new Date(attendanceRecord.loginTime).toLocaleTimeString() : 'N/A'}`);
      console.log(`   Logout Time: ${attendanceRecord.logoutTime ? new Date(attendanceRecord.logoutTime).toLocaleTimeString() : 'N/A'}`);
      console.log(`   Session Type: ${attendanceRecord.sessionType.toUpperCase()}`);
    }

    console.log('\n✅ Dashboard should now display attendance status correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testDashboardAttendanceIntegration();