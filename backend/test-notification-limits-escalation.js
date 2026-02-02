import mongoose from 'mongoose';
import appConfig from './src/config/app.config.js';
import NotificationService from './src/modules/notification/services/NotificationService.js';
import NotificationEscalationService from './src/modules/notification/services/NotificationEscalationService.js';
import WorkerNotification from './src/modules/notification/models/Notification.js';

/**
 * Test script for notification limits and escalation functionality
 * Tests Requirements 5.5 (daily notification limits) and 6.2 (critical notification escalation)
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

async function testDailyNotificationLimits() {
  console.log('\n🔢 Testing Daily Notification Limits...');
  
  const testWorkerId = 999; // Test worker ID
  const testSenderId = 1;   // Test sender ID
  
  try {
    // Clean up any existing test notifications
    await WorkerNotification.deleteMany({ recipientId: testWorkerId });
    console.log('🧹 Cleaned up existing test notifications');

    // Check initial availability
    const initialAvailability = await NotificationService.checkNotificationAvailability(testWorkerId);
    console.log('📊 Initial availability:', initialAvailability);

    // Create notifications up to the daily limit
    const dailyLimit = appConfig.notification.dailyLimit;
    console.log(`📝 Creating ${dailyLimit} notifications to test daily limit...`);

    for (let i = 1; i <= dailyLimit; i++) {
      const result = await NotificationService.createNotification({
        type: 'TASK_UPDATE',
        title: `Test Notification ${i}`,
        message: `This is test notification number ${i} for daily limit testing`,
        senderId: testSenderId,
        recipients: [testWorkerId],
        actionData: {
          taskId: `test-task-${i}`,
          projectId: 'test-project',
          supervisorContact: 'test-supervisor'
        }
      });

      if (result.success) {
        console.log(`✅ Created notification ${i}/${dailyLimit}`);
      } else {
        console.log(`❌ Failed to create notification ${i}:`, result);
      }
    }

    // Check availability after reaching limit
    const limitReachedAvailability = await NotificationService.checkNotificationAvailability(testWorkerId);
    console.log('📊 Availability after reaching limit:', limitReachedAvailability);

    // Try to create one more notification (should be blocked)
    console.log('🚫 Attempting to create notification beyond daily limit...');
    const overLimitResult = await NotificationService.createNotification({
      type: 'TASK_UPDATE',
      title: 'Over Limit Test',
      message: 'This notification should be blocked by daily limit',
      senderId: testSenderId,
      recipients: [testWorkerId],
      actionData: {
        taskId: 'over-limit-task',
        projectId: 'test-project',
        supervisorContact: 'test-supervisor'
      }
    });

    console.log('📊 Over-limit result:', {
      created: overLimitResult.created,
      skipped: overLimitResult.skipped,
      skippedRecipients: overLimitResult.skippedRecipients
    });

    // Try to create a CRITICAL notification (should bypass limit)
    console.log('🚨 Creating CRITICAL notification (should bypass limit)...');
    const criticalResult = await NotificationService.createNotification({
      type: 'SITE_CHANGE',
      priority: 'CRITICAL',
      title: 'Critical Site Change',
      message: 'Emergency site change - report to new location immediately',
      senderId: testSenderId,
      recipients: [testWorkerId],
      actionData: {
        newLocation: 'Emergency Site B',
        coordinates: { latitude: 1.3521, longitude: 103.8198 },
        supervisorContact: 'emergency-supervisor'
      },
      requiresAcknowledgment: true
    });

    console.log('📊 Critical notification result:', {
      created: criticalResult.created,
      skipped: criticalResult.skipped
    });

    // Get daily limit statistics
    const limitStats = await NotificationService.getDailyLimitStats([testWorkerId]);
    console.log('📈 Daily limit statistics:', JSON.stringify(limitStats, null, 2));

    // Test daily limit enforcement check
    console.log('🔍 Testing daily limit enforcement check...');
    const enforcementCheck = await NotificationService.checkDailyLimitEnforcement(testWorkerId);
    console.log('📊 Daily limit enforcement check:', enforcementCheck);

  } catch (error) {
    console.error('❌ Error testing daily notification limits:', error);
  }
}

async function testNotificationEscalation() {
  console.log('\n⏰ Testing Notification Escalation...');
  
  const testWorkerId = 998; // Different test worker ID
  const testSenderId = 1;
  
  try {
    // Clean up any existing test notifications
    await WorkerNotification.deleteMany({ recipientId: testWorkerId });
    console.log('🧹 Cleaned up existing test notifications');

    // Create a critical notification that should be escalated
    console.log('🚨 Creating critical notification for escalation test...');
    const criticalResult = await NotificationService.createNotification({
      type: 'SITE_CHANGE',
      priority: 'CRITICAL',
      title: 'Critical Safety Alert',
      message: 'Immediate evacuation required - proceed to assembly point',
      senderId: testSenderId,
      recipients: [testWorkerId],
      actionData: {
        newLocation: 'Assembly Point A',
        coordinates: { latitude: 1.3521, longitude: 103.8198 },
        supervisorContact: 'safety-supervisor'
      },
      requiresAcknowledgment: true
    });

    if (criticalResult.success && criticalResult.created > 0) {
      const notificationId = criticalResult.notifications[0].id;
      console.log(`✅ Created critical notification ${notificationId}`);

      // Manually set the creation time to 3 hours ago to simulate timeout
      const notification = await WorkerNotification.findOne({ id: notificationId });
      if (notification) {
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
        notification.createdAt = threeHoursAgo;
        await notification.save();
        console.log('⏰ Set notification creation time to 3 hours ago');

        // Force escalation of this specific notification
        console.log('🔄 Force escalating notification...');
        const forceEscalationResult = await NotificationEscalationService.forceEscalateNotification(notificationId);
        console.log('📊 Force escalation result:', forceEscalationResult);

        // Check if notification was marked as escalated
        const updatedNotification = await WorkerNotification.findOne({ id: notificationId });
        console.log('📋 Updated notification status:', {
          id: updatedNotification.id,
          escalated: updatedNotification.escalated,
          escalatedAt: updatedNotification.escalatedAt,
          escalationStatus: updatedNotification.escalationStatus,
          escalationReason: updatedNotification.escalationReason
        });

        // Also test the regular escalation check
        console.log('🔄 Testing regular escalation check...');
        const escalationResults = await NotificationEscalationService.triggerEscalationCheck();
        console.log('📊 Regular escalation results:', escalationResults);

        // Get escalation statistics
        const escalationStats = await NotificationEscalationService.getEscalationStats(1);
        console.log('📈 Escalation statistics:', JSON.stringify(escalationStats, null, 2));
      }
    } else {
      console.log('❌ Failed to create critical notification for escalation test');
    }

  } catch (error) {
    console.error('❌ Error testing notification escalation:', error);
  }
}

async function testEscalationServiceStatus() {
  console.log('\n🔧 Testing Escalation Service Status...');
  
  try {
    const isRunning = NotificationEscalationService.isServiceRunning();
    const config = NotificationEscalationService.getConfiguration();
    
    console.log('📊 Escalation Service Status:', {
      isRunning,
      configuration: config
    });

    if (!isRunning) {
      console.log('🚀 Starting escalation service...');
      NotificationEscalationService.start();
      
      // Check status again
      const newStatus = NotificationEscalationService.isServiceRunning();
      console.log('📊 Service status after start:', newStatus);
    }

  } catch (error) {
    console.error('❌ Error testing escalation service status:', error);
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Clean up test notifications
    const deleteResult = await WorkerNotification.deleteMany({
      recipientId: { $in: [998, 999] }
    });
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} test notifications`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function runTests() {
  console.log('🧪 Starting Notification Limits and Escalation Tests');
  console.log('====================================================');

  try {
    await connectToDatabase();
    
    await testDailyNotificationLimits();
    await testNotificationEscalation();
    await testEscalationServiceStatus();
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await cleanup();
    
    // Stop escalation service if it was started during tests
    if (NotificationEscalationService.isServiceRunning()) {
      NotificationEscalationService.stop();
      console.log('⏹️ Stopped escalation service');
    }
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});