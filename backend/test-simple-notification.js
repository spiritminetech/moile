import mongoose from 'mongoose';
import appConfig from './src/config/app.config.js';
import WorkerNotification from './src/modules/notification/models/Notification.js';

/**
 * Simple test to create a notification directly using the model
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

async function testDirectNotificationCreation() {
  console.log('\n📝 Testing Direct Notification Creation...');
  
  try {
    // Clean up any existing test notifications
    await WorkerNotification.deleteMany({ recipientId: 999 });
    console.log('🧹 Cleaned up existing test notifications');

    // Create a notification directly
    const notification = new WorkerNotification({
      type: 'TASK_UPDATE',
      priority: 'NORMAL',
      title: 'Test Notification',
      message: 'This is a test notification for direct creation',
      senderId: 1,
      recipientId: 999,
      actionData: {
        taskId: 'test-task-123',
        projectId: 'test-project',
        supervisorContact: 'test-supervisor'
      },
      language: 'en'
    });

    console.log('💾 Saving notification...');
    const savedNotification = await notification.save();
    
    console.log('✅ Notification created successfully:', {
      id: savedNotification.id,
      type: savedNotification.type,
      priority: savedNotification.priority,
      title: savedNotification.title,
      recipientId: savedNotification.recipientId,
      contentHash: savedNotification.contentHash,
      createdAt: savedNotification.createdAt
    });

    // Test daily count
    const dailyCount = await WorkerNotification.countDailyNotifications(999);
    console.log('📊 Daily count for worker 999:', dailyCount);

    // Test availability check
    const availability = {
      canReceive: dailyCount < appConfig.notification.dailyLimit,
      todayCount: dailyCount,
      dailyLimit: appConfig.notification.dailyLimit,
      remainingToday: Math.max(0, appConfig.notification.dailyLimit - dailyCount)
    };
    console.log('📊 Availability check:', availability);

  } catch (error) {
    console.error('❌ Error creating notification:', error);
  }
}

async function runTest() {
  console.log('🧪 Starting Simple Notification Test');
  console.log('====================================');

  try {
    await connectToDatabase();
    await testDirectNotificationCreation();
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
    process.exit(0);
  }
}

// Run the test
runTest().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});