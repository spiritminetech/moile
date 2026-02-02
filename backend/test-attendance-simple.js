import mongoose from 'mongoose';
import appConfig from './src/config/app.config.js';
import AttendanceNotificationService from './src/modules/notification/services/AttendanceNotificationService.js';

async function testBasicFunctionality() {
  try {
    console.log('🧪 Testing basic attendance notification functionality...');
    
    // Connect to database
    await mongoose.connect(appConfig.database.uri, {
      dbName: appConfig.database.name,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Test missed login notification with mock data
    console.log('\n📱 Testing missed login notification...');
    const result = await AttendanceNotificationService.notifyMissedLogin(
      1, // Mock worker ID
      {
        scheduledStartTime: '8:00 AM',
        projectId: 1
      },
      2 // Mock supervisor ID
    );

    console.log('✅ Missed login notification result:', {
      success: result.success,
      message: result.message,
      notificationCount: result.notificationResult?.created || 0,
      skippedCount: result.notificationResult?.skipped || 0
    });

    // Test geofence violation notification
    console.log('\n🚨 Testing geofence violation notification...');
    const geofenceResult = await AttendanceNotificationService.notifyGeofenceViolation(
      1, // Mock worker ID
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
      2 // Mock supervisor ID
    );

    console.log('✅ Geofence violation notification result:', {
      success: geofenceResult.success,
      message: geofenceResult.message,
      workerNotificationCount: geofenceResult.workerNotification?.created || 0,
      supervisorNotificationCount: geofenceResult.supervisorNotification?.created || 0
    });

    console.log('\n✅ Basic functionality tests completed successfully');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testBasicFunctionality();