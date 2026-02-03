// Test attendance API endpoints that dashboard should use
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import Attendance from './src/modules/attendance/Attendance.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function testAttendanceApiForDashboard() {
  console.log('🧪 Testing Attendance API for Dashboard');
  console.log('=====================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get Employee 107 data
    const employee107 = await Employee.findOne({ id: 107 });
    if (!employee107) {
      console.log('❌ Employee 107 not found');
      return;
    }

    console.log('\n1️⃣ Employee 107 Data:');
    console.log(`   Employee ID: ${employee107.id}`);
    console.log(`   Name: ${employee107.fullName}`);
    console.log(`   User ID: ${employee107.userId}`);

    // Check today's attendance records for Employee 107
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    console.log('\n2️⃣ Checking Today\'s Attendance Records...');
    console.log(`   Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    const todaysAttendance = await Attendance.find({
      employeeId: employee107.id,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).sort({ createdAt: -1 });

    console.log(`   Found ${todaysAttendance.length} attendance records for today`);

    if (todaysAttendance.length > 0) {
      const latestRecord = todaysAttendance[0];
      console.log('\n3️⃣ Latest Attendance Record:');
      console.log(`   Employee ID: ${latestRecord.employeeId}`);
      console.log(`   Project ID: ${latestRecord.projectId}`);
      console.log(`   Date: ${latestRecord.date}`);
      console.log(`   Login Time: ${latestRecord.loginTime}`);
      console.log(`   Logout Time: ${latestRecord.logoutTime || 'Not logged out'}`);
      console.log(`   Lunch Start: ${latestRecord.lunchStartTime || 'N/A'}`);
      console.log(`   Lunch End: ${latestRecord.lunchEndTime || 'N/A'}`);
      console.log(`   Session Type: ${latestRecord.sessionType || 'regular'}`);

      // Calculate current session duration
      const isLoggedIn = latestRecord.loginTime && !latestRecord.logoutTime;
      let currentSessionDuration = 0;
      let totalHours = 0;

      if (isLoggedIn) {
        const loginTime = new Date(latestRecord.loginTime);
        const now = new Date();
        currentSessionDuration = Math.floor((now.getTime() - loginTime.getTime()) / (1000 * 60)); // in minutes
        
        console.log('\n4️⃣ Working Hours Calculation:');
        console.log(`   Status: LOGGED IN`);
        console.log(`   Login Time: ${loginTime.toLocaleTimeString()}`);
        console.log(`   Current Session Duration: ${Math.floor(currentSessionDuration / 60)}h ${currentSessionDuration % 60}m`);
      } else if (latestRecord.logoutTime) {
        const loginTime = new Date(latestRecord.loginTime);
        const logoutTime = new Date(latestRecord.logoutTime);
        totalHours = Math.floor((logoutTime.getTime() - loginTime.getTime()) / (1000 * 60)); // in minutes
        
        console.log('\n4️⃣ Working Hours Calculation:');
        console.log(`   Status: LOGGED OUT`);
        console.log(`   Login Time: ${loginTime.toLocaleTimeString()}`);
        console.log(`   Logout Time: ${logoutTime.toLocaleTimeString()}`);
        console.log(`   Total Hours Today: ${Math.floor(totalHours / 60)}h ${totalHours % 60}m`);
      }

      // Simulate what the dashboard should show
      console.log('\n5️⃣ Dashboard Attendance Status Data:');
      const dashboardData = {
        attendanceStatus: {
          id: latestRecord._id,
          employeeId: latestRecord.employeeId,
          projectId: latestRecord.projectId,
          date: latestRecord.date,
          loginTime: latestRecord.loginTime,
          logoutTime: latestRecord.logoutTime,
          lunchStartTime: latestRecord.lunchStartTime,
          lunchEndTime: latestRecord.lunchEndTime,
          sessionType: latestRecord.sessionType || 'regular',
          location: {
            latitude: latestRecord.latitude || 0,
            longitude: latestRecord.longitude || 0,
            accuracy: 0,
            timestamp: new Date()
          }
        },
        workingHours: {
          currentSessionDuration: isLoggedIn ? currentSessionDuration : 0,
          totalHours: isLoggedIn ? currentSessionDuration : totalHours
        }
      };

      console.log('   Attendance Status:', {
        isLoggedIn: isLoggedIn,
        loginTime: latestRecord.loginTime,
        logoutTime: latestRecord.logoutTime || null,
        sessionType: latestRecord.sessionType || 'regular'
      });
      console.log('   Working Hours:', dashboardData.workingHours);

      console.log('\n✅ Dashboard should display:');
      console.log(`   Status: ${isLoggedIn ? 'LOGGED IN' : 'LOGGED OUT'}`);
      console.log(`   Current Session: ${Math.floor(dashboardData.workingHours.currentSessionDuration / 60)}h ${dashboardData.workingHours.currentSessionDuration % 60}m`);
      console.log(`   Total Today: ${Math.floor(dashboardData.workingHours.totalHours / 60)}h ${dashboardData.workingHours.totalHours % 60}m`);

    } else {
      console.log('\n❌ No attendance records found for today');
      console.log('   Dashboard should show: NOT_LOGGED_IN status');
    }

    // Check all attendance records for Employee 107 (last 5)
    console.log('\n6️⃣ Recent Attendance History (Last 5 records):');
    const recentAttendance = await Attendance.find({
      employeeId: employee107.id
    }).sort({ createdAt: -1 }).limit(5);

    for (const record of recentAttendance) {
      console.log(`   - Date: ${record.date}, Login: ${record.loginTime}, Logout: ${record.logoutTime || 'N/A'}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAttendanceApiForDashboard();