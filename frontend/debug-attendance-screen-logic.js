// Debug script to test AttendanceScreen data conversion logic
// This simulates the exact logic used in AttendanceScreen.tsx

const mockApiResponse = {
  success: true,
  data: {
    session: "CHECKED_OUT",
    checkInTime: "2026-02-02T10:47:00.872Z",
    checkOutTime: "2026-02-02T10:48:07.455Z",
    lunchStartTime: null,
    lunchEndTime: null,
    overtimeStartTime: null,
    date: "2026-02-02T00:00:00.000Z",
    projectId: 1,
    workDuration: 1,
    lunchDuration: 0,
    isOnLunchBreak: false
  }
};

const mockAuthState = {
  user: {
    id: 64
  }
};

console.log('🧪 Testing AttendanceScreen data conversion logic');
console.log('='.repeat(50));

console.log('📥 Mock API Response:', JSON.stringify(mockApiResponse, null, 2));

if (mockApiResponse.success) {
  const data = mockApiResponse.data;
  console.log('\n🔍 Processing data:');
  console.log('  data.session:', data.session);
  console.log('  data.session === "CHECKED_IN":', data.session === 'CHECKED_IN');
  console.log('  data.checkInTime:', data.checkInTime);
  console.log('  data.projectId:', data.projectId);
  
  // Convert the new API response to the expected format
  // Create currentSession only if actively checked in
  const currentSession = data.session === 'CHECKED_IN' ? {
    id: 1,
    workerId: mockAuthState.user.id,
    projectId: parseInt(data.projectId || '0'),
    loginTime: data.checkInTime || '',
    logoutTime: data.checkOutTime || undefined,
    location: { latitude: 0, longitude: 0, accuracy: 0, timestamp: new Date() },
    sessionType: 'regular',
  } : null;
  
  // Create todaysAttendance record if there's any attendance data for today
  let todaysAttendance = [];
  if (data.checkInTime) {
    // There's attendance data for today, create a record
    todaysAttendance = [{
      id: 1,
      workerId: mockAuthState.user.id,
      projectId: parseInt(data.projectId || '0'),
      loginTime: data.checkInTime,
      logoutTime: data.checkOutTime || undefined,
      location: { latitude: 0, longitude: 0, accuracy: 0, timestamp: new Date() },
      sessionType: 'regular',
    }];
  }
  
  console.log('\n📊 Created currentSession:', JSON.stringify(currentSession, null, 2));
  console.log('\n📋 Created todaysAttendance:', JSON.stringify(todaysAttendance, null, 2));
  
  const attendanceStatus = {
    currentSession,
    todaysAttendance,
    canClockIn: data.session === 'NOT_LOGGED_IN' || data.session === 'CHECKED_OUT',
    canClockOut: data.session === 'CHECKED_IN',
  };
  
  console.log('\n✅ Final attendanceStatus:');
  console.log('  currentSession exists:', !!attendanceStatus.currentSession);
  console.log('  todaysAttendance length:', attendanceStatus.todaysAttendance.length);
  console.log('  canClockIn:', attendanceStatus.canClockIn);
  console.log('  canClockOut:', attendanceStatus.canClockOut);
  
  console.log('\n📋 todaysAttendance array:', JSON.stringify(attendanceStatus.todaysAttendance, null, 2));
  
  // Test the Today's Summary rendering logic
  console.log('\n🎯 Today\'s Summary rendering test:');
  if (attendanceStatus.todaysAttendance.length > 0) {
    console.log('✅ Today\'s Summary SHOULD be displayed');
    attendanceStatus.todaysAttendance.forEach((record, index) => {
      const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
      };
      
      const formatDuration = (startTime, endTime) => {
        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : new Date();
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
      };
      
      console.log(`  Record ${index + 1}:`);
      console.log(`    Time: ${formatTime(record.loginTime)} - ${record.logoutTime ? formatTime(record.logoutTime) : 'Active'}`);
      console.log(`    Type: ${record.sessionType} • Duration: ${formatDuration(record.loginTime, record.logoutTime)}`);
    });
  } else {
    console.log('❌ Today\'s Summary will show "No attendance records for today"');
  }
}

console.log('\n🎯 Conclusion:');
console.log('The logic appears correct. If Today\'s Summary is not showing,');
console.log('the issue might be in the mobile app\'s React state management');
console.log('or component rendering, not in the data conversion logic.');