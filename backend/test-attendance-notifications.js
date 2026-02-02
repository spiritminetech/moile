import mongoose from 'mongoose';
import appConfig from './src/config/app.config.js';
import AttendanceNotificationService from './src/modules/notification/services/AttendanceNotificationService.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

/**
 * Test script for attendance notification functionality
 * Tests all attendance alert notification types
 */

async function connectToDatabase() {
  try {
    await mongoose.connect(appConfig.database.uri, {
      dbName: appConfig.database.name,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function testMissedLoginNotification() {
  console.log('\n🔍 Testing missed login notification...');
  
  try {
    // Find a test worker
    const worker = await Employee.findOne({ status: 'active' });
    if (!worker) {
      console.log('⚠️ No active workers found for testing');
      return;
    }

    // Find a supervisor
    const supervisor = await Employee.findOne({ 
      status: 'active',
      id: { $ne: worker.id }
    });

    const result = await AttendanceNotificationService.notifyMissedLogin(
      worker.id,
      {
        scheduledStartTime: '8:00 AM',
        projectId: 1
      },
      supervisor?.id || 0
    );

    console.log('✅ Missed login notification result:', {
      success: result.success,
      workerId: worker.id,
      workerName: worker.fullName,
      notificationId: result.notificationResult?.notifications?.[0]?.id
    });

  } catch (error) {
    console.error('❌ Missed login notification test failed:', error.message);
  }
}

async function testMissedLogoutNotification() {
  console.log('\n🔍 Testing missed logout notification...');
  
  try {
    // Find a test worker
    const worker = await Employee.findOne({ status: 'active' });
    if (!worker) {
      console.log('⚠️ No active workers found for testing');
      return;
    }

    // Find a supervisor
    const supervisor = await Employee.findOne({ 
      status: 'active',
      id: { $ne: worker.id }
    });

    const result = await AttendanceNotificationService.notifyMissedLogout(
      worker.id,
      {
        scheduledEndTime: '5:00 PM',
        projectId: 1
      },
      supervisor?.id || 0
    );

    console.log('✅ Missed logout notification result:', {
      success: result.success,
      workerId: worker.id,
      workerName: worker.fullName,
      notificationId: result.notificationResult?.notifications?.[0]?.id
    });

  } catch (error) {
    console.error('❌ Missed logout notification test failed:', error.message);
  }
}

async function testLunchBreakReminder() {
  console.log('\n🔍 Testing lunch break reminder...');
  
  try {
    // Find a test worker
    const worker = await Employee.findOne({ status: 'active' });
    if (!worker) {
      console.log('⚠️ No active workers found for testing');
      return;
    }

    // Find a supervisor
    const supervisor = await Employee.findOne({ 
      status: 'active',
      id: { $ne: worker.id }
    });

    const result = await AttendanceNotificationService.notifyLunchBreakReminder(
      worker.id,
      {
        lunchBreakTime: '12:00 PM',
        breakDuration: '1 hour',
        projectId: 1
      },
      supervisor?.id || 0
    );

    console.log('✅ Lunch break reminder result:', {
      success: result.success,
      workerId: worker.id,
      workerName: worker.fullName,
      notificationId: result.notificationResult?.notifications?.[0]?.id
    });

  } catch (error) {
    console.error('❌ Lunch break reminder test failed:', error.message);
  }
}

async function testOvertimeAlert() {
  console.log('\n🔍 Testing overtime alert...');
  
  try {
    // Find a test worker
    const worker = await Employee.findOne({ status: 'active' });
    if (!worker) {
      console.log('⚠️ No active workers found for testing');
      return;
    }

    // Find a supervisor
    const supervisor = await Employee.findOne({ 
      status: 'active',
      id: { $ne: worker.id }
    });

    // Test overtime start notification
    const startResult = await AttendanceNotificationService.notifyOvertimeAlert(
      worker.id,
      {
        startTime: '6:00 PM',
        expectedDuration: '2 hours',
        reason: 'Project deadline',
        projectId: 1
      },
      'START',
      supervisor?.id || 0
    );

    console.log('✅ Overtime start alert result:', {
      success: startResult.success,
      workerId: worker.id,
      workerName: worker.fullName,
      notificationId: startResult.notificationResult?.notifications?.[0]?.id
    });

    // Test overtime end notification
    const endResult = await AttendanceNotificationService.notifyOvertimeAlert(
      worker.id,
      {
        startTime: '6:00 PM',
        endTime: '8:00 PM',
        projectId: 1
      },
      'END',
      supervisor?.id || 0
    );

    console.log('✅ Overtime end alert result:', {
      success: endResult.success,
      workerId: worker.id,
      workerName: worker.fullName,
      notificationId: endResult.notificationResult?.notifications?.[0]?.id
    });

  } catch (error) {
    console.error('❌ Overtime alert test failed:', error.message);
  }
}

async function testGeofenceViolationNotification() {
  console.log('\n🔍 Testing geofence violation notification...');
  
  try {
    // Find a test worker
    const worker = await Employee.findOne({ status: 'active' });
    if (!worker) {
      console.log('⚠️ No active workers found for testing');
      return;
    }

    // Find a supervisor
    const supervisor = await Employee.findOne({ 
      status: 'active',
      id: { $ne: worker.id }
    });

    // Find a project for testing
    const project = await Project.findOne();
    if (!project) {
      console.log('⚠️ No projects found for testing');
      return;
    }

    const result = await AttendanceNotificationService.notifyGeofenceViolation(
      worker.id,
      {
        currentLatitude: 1.3521, // Singapore coordinates (outside project)
        currentLongitude: 103.8198,
        projectLatitude: project.latitude || 1.3000,
        projectLongitude: project.longitude || 103.8000,
        geofenceRadius: project.geofenceRadius || 100,
        distance: 250, // 250 meters outside
        projectId: project.id,
        accuracy: 10
      },
      supervisor?.id || 0
    );

    console.log('✅ Geofence violation notification result:', {
      success: result.success,
      workerId: worker.id,
      workerName: worker.fullName,
      workerNotificationId: result.workerNotification?.notifications?.[0]?.id,
      supervisorNotificationId: result.supervisorNotification?.notifications?.[0]?.id
    });

  } catch (error) {
    console.error('❌ Geofence violation notification test failed:', error.message);
  }
}

async function testBatchAttendanceAlerts() {
  console.log('\n🔍 Testing batch attendance alerts...');
  
  try {
    // Find test workers
    const workers = await Employee.find({ status: 'active' }).limit(2);
    if (workers.length < 2) {
      console.log('⚠️ Need at least 2 active workers for batch testing');
      return;
    }

    // Find a supervisor
    const supervisor = await Employee.findOne({ 
      status: 'active',
      id: { $nin: workers.map(w => w.id) }
    });

    const batchNotifications = [
      {
        type: 'MISSED_LOGIN',
        workerId: workers[0].id,
        scheduleInfo: {
          scheduledStartTime: '8:00 AM',
          projectId: 1
        },
        supervisorId: supervisor?.id || 0
      },
      {
        type: 'LUNCH_BREAK_REMINDER',
        workerId: workers[1].id,
        breakInfo: {
          lunchBreakTime: '12:00 PM',
          breakDuration: '1 hour',
          projectId: 1
        },
        supervisorId: supervisor?.id || 0
      }
    ];

    const results = await AttendanceNotificationService.batchNotifyAttendanceAlerts(batchNotifications);

    console.log('✅ Batch attendance alerts result:', {
      totalRequests: batchNotifications.length,
      successfulNotifications: results.filter(r => r.success).length,
      failedNotifications: results.filter(r => !r.success).length,
      results: results.map(r => ({
        type: r.type,
        workerId: r.workerId,
        success: r.success,
        notificationId: r.result?.notificationResult?.notifications?.[0]?.id
      }))
    });

  } catch (error) {
    console.error('❌ Batch attendance alerts test failed:', error.message);
  }
}

async function testScheduledAttendanceCheck() {
  console.log('\n🔍 Testing scheduled attendance check...');
  
  try {
    const result = await AttendanceNotificationService.checkAndNotifyAttendanceAlerts();

    console.log('✅ Scheduled attendance check result:', {
      success: result.success,
      totalNotificationsSent: result.results?.totalNotificationsSent || 0,
      missedLoginAlerts: result.results?.missedLoginAlerts?.length || 0,
      missedLogoutAlerts: result.results?.missedLogoutAlerts?.length || 0,
      lunchBreakReminders: result.results?.lunchBreakReminders?.length || 0,
      overtimeAlerts: result.results?.overtimeAlerts?.length || 0
    });

  } catch (error) {
    console.error('❌ Scheduled attendance check test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Starting Attendance Notification Tests');
  console.log('==========================================');

  await connectToDatabase();

  // Test individual notification types
  await testMissedLoginNotification();
  await testMissedLogoutNotification();
  await testLunchBreakReminder();
  await testOvertimeAlert();
  await testGeofenceViolationNotification();

  // Test batch processing
  await testBatchAttendanceAlerts();

  // Test scheduled check
  await testScheduledAttendanceCheck();

  console.log('\n✅ All attendance notification tests completed');
  console.log('==========================================');

  // Close database connection
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export default {
  testMissedLoginNotification,
  testMissedLogoutNotification,
  testLunchBreakReminder,
  testOvertimeAlert,
  testGeofenceViolationNotification,
  testBatchAttendanceAlerts,
  testScheduledAttendanceCheck,
  runAllTests
};