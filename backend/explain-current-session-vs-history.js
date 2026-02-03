// Explain the difference between current session and history sessions
import mongoose from 'mongoose';
import Attendance from './src/modules/attendance/Attendance.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function explainCurrentSessionVsHistory() {
  console.log('📊 Explaining Current Session vs History Sessions');
  console.log('================================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get Employee 107's attendance records
    const attendanceRecords = await Attendance.find({
      employeeId: 107
    }).sort({ date: -1 }).limit(5);

    console.log(`\n📋 Found ${attendanceRecords.length} attendance records for Employee 107:`);

    for (let i = 0; i < attendanceRecords.length; i++) {
      const record = attendanceRecords[i];
      const isToday = record.date.toDateString() === new Date().toDateString();
      
      console.log(`\n${i + 1}️⃣ ${isToday ? '📅 TODAY\'S' : '📆 PAST'} Record:`);
      console.log(`   Date: ${record.date.toDateString()}`);
      console.log(`   Check In: ${record.checkIn ? record.checkIn.toLocaleString() : 'Not checked in'}`);
      console.log(`   Check Out: ${record.checkOut ? record.checkOut.toLocaleString() : 'Not checked out'}`);
      
      // Calculate session status
      const hasCheckedIn = !!record.checkIn;
      const hasCheckedOut = !!record.checkOut;
      
      let sessionStatus = '';
      let sessionDuration = 0;
      
      if (hasCheckedIn && hasCheckedOut) {
        sessionStatus = '✅ COMPLETED SESSION';
        sessionDuration = Math.round((record.checkOut - record.checkIn) / (1000 * 60)); // minutes
      } else if (hasCheckedIn && !hasCheckedOut) {
        sessionStatus = '🟡 ACTIVE SESSION (not checked out)';
        sessionDuration = Math.round((new Date() - record.checkIn) / (1000 * 60)); // minutes
      } else {
        sessionStatus = '❌ NO SESSION (not checked in)';
        sessionDuration = 0;
      }
      
      console.log(`   Status: ${sessionStatus}`);
      console.log(`   Duration: ${Math.floor(sessionDuration / 60)}h ${sessionDuration % 60}m`);
      
      if (isToday) {
        console.log('\n   🎯 DASHBOARD LOGIC FOR THIS RECORD:');
        
        if (hasCheckedIn && !hasCheckedOut) {
          console.log(`   ✅ Current Session: ${Math.floor(sessionDuration / 60)}h ${sessionDuration % 60}m (ACTIVE - still working)`);
          console.log(`   ✅ Total Today: ${Math.floor(sessionDuration / 60)}h ${sessionDuration % 60}m (same as current)`);
        } else if (hasCheckedIn && hasCheckedOut) {
          console.log(`   ❌ Current Session: 0h 0m (LOGGED OUT - work finished)`);
          console.log(`   ✅ Total Today: ${Math.floor(sessionDuration / 60)}h ${sessionDuration % 60}m (completed work)`);
        } else {
          console.log(`   ❌ Current Session: 0h 0m (NEVER LOGGED IN)`);
          console.log(`   ❌ Total Today: 0h 0m (no work done)`);
        }
        
        console.log('\n   📱 ATTENDANCE HISTORY LOGIC FOR THIS RECORD:');
        if (hasCheckedIn) {
          console.log(`   ✅ Shows as 1 session (because there was a check-in)`);
          console.log(`   ✅ Duration: ${Math.floor(sessionDuration / 60)}h ${sessionDuration % 60}m`);
        } else {
          console.log(`   ❌ Shows as 0 sessions (no check-in)`);
        }
      }
    }

    console.log('\n🔍 SUMMARY - Why Dashboard Shows "Current Session: 0h 0m":');
    console.log('');
    console.log('📊 ATTENDANCE HISTORY:');
    console.log('   - Shows ALL work sessions (completed or ongoing)');
    console.log('   - If you checked in today = 1 session');
    console.log('   - Shows total duration of each session');
    console.log('');
    console.log('📱 DASHBOARD "Current Session":');
    console.log('   - Shows ONLY the duration of ACTIVE/ONGOING work');
    console.log('   - If you are LOGGED IN = shows time since check-in');
    console.log('   - If you are LOGGED OUT = shows 0h 0m (no active work)');
    console.log('');
    console.log('📱 DASHBOARD "Total Today":');
    console.log('   - Shows total work time for today');
    console.log('   - If LOGGED OUT = shows completed work duration');
    console.log('   - If LOGGED IN = shows time worked so far');

    console.log('\n💡 YOUR SITUATION:');
    console.log('   - History shows "1 session" = You worked today (checked in)');
    console.log('   - Dashboard shows "Current Session: 0h 0m" = You are logged out (work finished)');
    console.log('   - Dashboard should show "Total Today: 9h 47m" = Your completed work time');

  } catch (error) {
    console.error('❌ Explanation failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

explainCurrentSessionVsHistory();