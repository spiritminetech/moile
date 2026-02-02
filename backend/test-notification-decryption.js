/**
 * Test script to verify notification encryption/decryption functionality
 * This will help diagnose the [ENCRYPTED] issue in the worker dashboard
 */

import mongoose from 'mongoose';
import WorkerNotification from './src/modules/notification/models/Notification.js';
import appConfig from './src/config/app.config.js';

async function testNotificationDecryption() {
  try {
    console.log('🔍 Testing notification encryption/decryption...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp');
    console.log('✅ Connected to database');

    // Find a recent notification
    const notification = await WorkerNotification.findOne({
      isEncrypted: true
    }).sort({ createdAt: -1 });

    if (!notification) {
      console.log('❌ No encrypted notifications found');
      
      // Create a test notification to verify encryption works
      console.log('📝 Creating test notification...');
      const testNotification = new WorkerNotification({
        type: 'TASK_UPDATE',
        priority: 'HIGH',
        title: 'Test Urgent Notification',
        message: 'This is a test message to verify encryption/decryption works properly',
        senderId: 1,
        recipientId: 2,
        requiresAcknowledgment: true
      });

      await testNotification.save();
      console.log('✅ Test notification created with ID:', testNotification.id);
      
      // Fetch it back to test decryption
      const savedNotification = await WorkerNotification.findById(testNotification._id);
      console.log('📋 Raw notification data:');
      console.log('  - title:', savedNotification.title);
      console.log('  - message:', savedNotification.message);
      console.log('  - isEncrypted:', savedNotification.isEncrypted);
      console.log('  - encryptedTitle exists:', !!savedNotification.encryptedTitle);
      console.log('  - encryptedMessage exists:', !!savedNotification.encryptedMessage);

      // Test decryption
      console.log('🔓 Testing decryption...');
      const decrypted = savedNotification.getDecryptedContent();
      console.log('  - decrypted title:', decrypted.title);
      console.log('  - decrypted message:', decrypted.message);

      // Test toSecureJSON
      console.log('🔒 Testing toSecureJSON...');
      const secureJson = savedNotification.toSecureJSON();
      console.log('  - secure JSON title:', secureJson.title);
      console.log('  - secure JSON message:', secureJson.message);
      console.log('  - secure JSON has encryptedTitle:', 'encryptedTitle' in secureJson);
      console.log('  - secure JSON has encryptedMessage:', 'encryptedMessage' in secureJson);

      return;
    }

    console.log('📋 Found encrypted notification:');
    console.log('  - ID:', notification.id);
    console.log('  - Raw title:', notification.title);
    console.log('  - Raw message:', notification.message);
    console.log('  - isEncrypted:', notification.isEncrypted);
    console.log('  - encryptedTitle exists:', !!notification.encryptedTitle);
    console.log('  - encryptedMessage exists:', !!notification.encryptedMessage);

    // Test decryption
    console.log('🔓 Testing decryption...');
    const decrypted = notification.getDecryptedContent();
    console.log('  - decrypted title:', decrypted.title);
    console.log('  - decrypted message:', decrypted.message);

    // Test toSecureJSON
    console.log('🔒 Testing toSecureJSON...');
    const secureJson = notification.toSecureJSON();
    console.log('  - secure JSON title:', secureJson.title);
    console.log('  - secure JSON message:', secureJson.message);
    console.log('  - secure JSON has encryptedTitle:', 'encryptedTitle' in secureJson);
    console.log('  - secure JSON has encryptedMessage:', 'encryptedMessage' in secureJson);

    // Test API endpoint simulation
    console.log('🌐 Testing API endpoint simulation...');
    const notifications = await WorkerNotification.find({
      recipientId: notification.recipientId
    })
    .sort({ createdAt: -1 })
    .limit(5);

    console.log(`📊 Found ${notifications.length} notifications for recipient ${notification.recipientId}`);
    
    notifications.forEach((notif, index) => {
      console.log(`\n📝 Notification ${index + 1}:`);
      console.log('  - Raw title:', notif.title);
      console.log('  - Raw message:', notif.message);
      
      if (notif.isEncrypted) {
        const decryptedContent = notif.getDecryptedContent();
        console.log('  - Decrypted title:', decryptedContent.title);
        console.log('  - Decrypted message:', decryptedContent.message);
        
        const secureContent = notif.toSecureJSON();
        console.log('  - Secure JSON title:', secureContent.title);
        console.log('  - Secure JSON message:', secureContent.message);
      }
    });

  } catch (error) {
    console.error('❌ Error testing notification decryption:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testNotificationDecryption();