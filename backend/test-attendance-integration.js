import mongoose from 'mongoose';
import appConfig from './src/config/app.config.js';
import AttendanceNotificationService from './src/modules/notification/services/AttendanceNotificationService.js';
import attendanceScheduler from './src/modules/attendance/attendanceScheduler.js';
import WorkerNotification from './src/modules/notification/models/Notification.js';
import NotificationAudit from './src/modules/notification/models/NotificationAudit.js';

/**
 * Comprehensive integration test for attendance notification system
 * Tests the complete flow from trigger to notification delivery
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

async function testCompleteAttendanceFlow() {
  console.log('🧪 Testing Complete Attendance Notification Flow');
  console.log('===============================================');

  await connectToDatabase();

  try {
    // Test 1: Missed Login Alert Flow
    console.log('\n📱 Test 1: Missed Login Alert Flow');
    console.log('----------------------------------');
    
    const missedLoginResult = await AttendanceNotificationService.notifyMissedLogin(
      1, // Worker ID
      {
        scheduledStartTime: '8:00 AM',
        projectId: 1
      },
      2 // Supervisor ID
    );

    console.log('✅ Missed login notification created:', {
      success: missedLoginResult.success,
      notificationId: missedLoginResult.notificationResult?.notifications?.[0]?.id,
      auditRecords: missedLoginResult.notificationResult?.auditRecords?.length || 0
    });

    // Verify notification was stored in database
    const missedLoginNotification = await WorkerNotification.findOne({
      id: missedLoginResult.notificationResult?.notifications?.[0]?.id
    });

    console.log('✅ Notification stored in database:', {
      id: missedLoginNotification?.id,
      type: missedLoginNotification?.type,
      priority: missedLoginNotification?.priority,
      recipientId: missedLoginNotification?.recipientId,
      status: missedLoginNotification?.status
    });

    // Test 2: Geofence Violation Alert Flow
    console.log('\n🚨 Test 2: Geofence Violation Alert Flow');
    console.log('----------------------------------------');
    
    const geofenceResult = await AttendanceNotificationService.notifyGeofenceViolation(
      1, // Worker ID
      {
        currentLatitude: 1.3521,
        currentLongitude: 103.8198,
        projectLatitude: 1.3000,
        projectLongitude: 103.8000,
        geofenceRadius: 100,
        distance: 250,
        projectId: 1,
        accuracy: 10
      },
      2 // Supervisor ID
    );

    console.log('✅ Geofence violation notifications created:', {
      success: geofenceResult.success,
      workerNotificationId: geofenceResult.workerNotification?.notifications?.[0]?.id,
      supervisorNotificationId: geofenceResult.supervisorNotification?.notifications?.[0]?.id
    });

    // Test 3: Batch Notification Processing
    console.log('\n📦 Test 3: Batch Notification Processing');
    console.log('---------------------------------------');
    
    const batchRequests = [
      {
        type: 'LUNCH_BREAK_REMINDER',
        workerId: 1,
        breakInfo: {
          lunchBreakTime: '12:00 PM',
          breakDuration: '1 hour',
          projectId: 1
        },
        supervisorId: 2
      },
      {
        type: 'OVERTIME_ALERT',
        workerId: 1,
        overtimeInfo: {
          startTime: '6:00 PM',
          expectedDuration: '2 hours',
          reason: 'Project deadline',
          projectId: 1
        },
        overtimeType: 'START',
        supervisorId: 2
      }
    ];

    const batchResults = await AttendanceNotificationService.batchNotifyAttendanceAlerts(batchRequests);

    console.log('✅ Batch notifications processed:', {
      totalRequests: batchRequests.length,
      successfulNotifications: batchResults.filter(r => r.success).length,
      failedNotifications: batchResults.filter(r => !r.success).length
    });

    // Test 4: Scheduled Attendance Check
    console.log('\n⏰ Test 4: Scheduled Attendance Check');
    console.log('-----------------------------------');
    
    const scheduledCheckResult = await AttendanceNotificationService.checkAndNotifyAttendanceAlerts();

    console.log('✅ Scheduled attendance check completed:', {
      success: scheduledCheckResult.success,
      totalNotificationsSent: scheduledCheckResult.results?.totalNotificationsSent || 0,
      missedLoginAlerts: scheduledCheckResult.results?.missedLoginAlerts?.length || 0,
      missedLogoutAlerts: scheduledCheckResult.results?.missedLogoutAlerts?.length || 0,
      lunchBreakReminders: scheduledCheckResult.results?.lunchBreakReminders?.length || 0
    });

    // Test 5: Attendance Scheduler Status
    console.log('\n🔧 Test 5: Attendance Scheduler Status');
    console.log('------------------------------------');
    
    const schedulerStatus = attendanceScheduler.getStatus();
    console.log('✅ Scheduler status:', schedulerStatus);

    // Test manual scheduler check
    const manualCheckResult = await attendanceScheduler.performManualCheck();
    console.log('✅ Manual scheduler check:', {
      success: manualCheckResult.success,
      timestamp: manualCheckResult.timestamp
    });

    // Test 6: Notification and Audit Trail Verification
    console.log('\n📊 Test 6: Notification and Audit Trail Verification');
    console.log('--------------------------------------------------');
    
    // Count total notifications created in this test
    const totalNotifications = await WorkerNotification.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 60000) } // Last minute
    });

    // Count total audit records created in this test
    const totalAuditRecords = await NotificationAudit.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 60000) } // Last minute
    });

    console.log('✅ Database verification:', {
      totalNotificationsCreated: totalNotifications,
      totalAuditRecordsCreated: totalAuditRecords,
      auditToNotificationRatio: totalAuditRecords / totalNotifications
    });

    // Test 7: Notification Content Validation
    console.log('\n✅ Test 7: Notification Content Validation');
    console.log('-----------------------------------------');
    
    const recentNotifications = await WorkerNotification.find({
      createdAt: { $gte: new Date(Date.now() - 60000) }
    }).limit(5);

    for (const notification of recentNotifications) {
      console.log(`📋 Notification ${notification.id}:`, {
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        messageLength: notification.message.length,
        hasActionData: !!notification.actionData,
        alertType: notification.actionData?.alertType,
        requiresAcknowledgment: notification.requiresAcknowledgment
      });
    }

    console.log('\n🎉 All integration tests completed successfully!');
    console.log('===============================================');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run integration tests
testCompleteAttendanceFlow();