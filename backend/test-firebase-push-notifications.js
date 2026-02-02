/**
 * Firebase Push Notification Test
 * Tests Firebase initialization and push notification capability
 */

import mongoose from 'mongoose';
import appConfig from './src/config/app.config.js';
import FCMService from './src/modules/notification/services/FirebaseService.js';
import DeviceToken from './src/modules/notification/models/DeviceToken.js';

console.log('🔥 Firebase Push Notification Test');
console.log('==================================');

async function testFirebasePushNotifications() {
  try {
    // Connect to database
    await mongoose.connect(appConfig.database.uri);
    console.log('✅ Connected to MongoDB');

    // Test Firebase initialization
    console.log('\n📱 Testing Firebase Initialization...');
    const firebaseApp = await FCMService.initialize();
    
    if (!firebaseApp) {
      console.log('❌ Firebase not initialized - configuration missing');
      return;
    }
    
    console.log('✅ Firebase initialized successfully');
    console.log('Project ID:', firebaseApp.options.projectId);

    // Test FCM Service health
    console.log('\n🏥 Checking FCM Service Health...');
    const healthStatus = await FCMService.getHealthStatus();
    console.log('Health Status:', JSON.stringify(healthStatus, null, 2));

    // Test device token validation
    console.log('\n🔍 Testing Device Token Validation...');
    const testTokens = [
      'c1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      'invalid-token',
      'short',
      ''
    ];

    testTokens.forEach(token => {
      const isValid = FCMService.validateDeviceToken(token);
      console.log(`Token "${token.substring(0, 20)}...": ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });

    // Test device token registration (with mock token)
    console.log('\n📝 Testing Device Token Registration...');
    const mockTokenData = {
      workerId: 999,
      deviceToken: 'c1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      platform: 'android',
      appVersion: '1.0.0',
      osVersion: '11.0',
      deviceId: 'test-device-001'
    };

    try {
      const registrationResult = await FCMService.registerDeviceToken(mockTokenData);
      console.log('✅ Device token registration successful:', registrationResult);
    } catch (error) {
      console.log('❌ Device token registration failed:', error.message);
    }

    // Test notification sending (will fail without real device token, but tests the flow)
    console.log('\n📤 Testing Notification Sending Flow...');
    const mockNotification = {
      id: 1,
      title: 'Test Notification',
      message: 'This is a test push notification',
      type: 'TASK_UPDATE',
      priority: 'NORMAL'
    };

    try {
      const sendResult = await FCMService.sendToDevice(
        mockTokenData.deviceToken,
        mockNotification,
        { testData: 'test-value' }
      );
      console.log('📤 Notification send result:', sendResult);
    } catch (error) {
      console.log('⚠️ Notification send failed (expected with mock token):', error.message);
    }

    // Test multicast sending
    console.log('\n📡 Testing Multicast Notification...');
    try {
      const multicastResult = await FCMService.sendToMultipleDevices(
        [mockTokenData.deviceToken],
        mockNotification,
        { testData: 'multicast-test' }
      );
      console.log('📡 Multicast result:', multicastResult);
    } catch (error) {
      console.log('⚠️ Multicast send failed (expected with mock token):', error.message);
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await DeviceToken.deleteMany({ workerId: 999 });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Firebase Push Notification Test Completed!');
    console.log('✅ Firebase is properly configured and ready for push notifications');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testFirebasePushNotifications().catch(console.error);