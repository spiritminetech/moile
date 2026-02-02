/**
 * Create sample notifications for testing
 * Run this after starting the backend server
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import Notification from './src/modules/notification/models/Notification.js';
import User from './src/modules/user/User.js';

async function createSampleNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system');
    console.log('✅ Connected to MongoDB');

    // Find a test user (or create one)
    let testUser = await User.findOne({ email: 'worker@test.com' });
    if (!testUser) {
      console.log('ℹ️  No test user found. Creating sample notifications for any existing user...');
      testUser = await User.findOne();
      if (!testUser) {
        console.log('❌ No users found in database. Please create a user first.');
        process.exit(1);
      }
    }

    console.log(`📝 Creating notifications for user: ${testUser.email}`);

    // Sample notifications with different priorities and types
    const sampleNotifications = [
      {
        type: 'SAFETY_ALERT',
        priority: 'CRITICAL',
        title: 'Safety Alert: Hard Hat Required',
        message: 'All workers must wear hard hats in the construction zone. This is mandatory for your safety.',
        recipients: [testUser._id],
        requiresAcknowledgment: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        language: 'en',
        actionData: {
          type: 'safety_compliance',
          location: 'Construction Zone A'
        }
      },
      {
        type: 'TASK_ASSIGNMENT',
        priority: 'HIGH',
        title: 'New Task Assigned',
        message: 'You have been assigned to concrete pouring at Site B. Please check your task details.',
        recipients: [testUser._id],
        requiresAcknowledgment: false,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        language: 'en',
        actionData: {
          type: 'task_assignment',
          taskId: 'TASK-001',
          projectId: 'PROJ-001'
        }
      },
      {
        type: 'SYSTEM_NOTIFICATION',
        priority: 'MEDIUM',
        title: 'Weather Update',
        message: 'Rain expected this afternoon. Outdoor work may be delayed. Stay updated.',
        recipients: [testUser._id],
        requiresAcknowledgment: false,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
        language: 'en',
        actionData: {
          type: 'weather_alert',
          severity: 'moderate'
        }
      },
      {
        type: 'SUPERVISOR_MESSAGE',
        priority: 'MEDIUM',
        title: 'Team Meeting Tomorrow',
        message: 'Team meeting scheduled for tomorrow at 9 AM in the site office. Please attend.',
        recipients: [testUser._id],
        requiresAcknowledgment: true,
        expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000), // 36 hours
        language: 'en',
        actionData: {
          type: 'meeting_notice',
          meetingTime: '2024-02-01T09:00:00Z',
          location: 'Site Office'
        }
      },
      {
        type: 'ATTENDANCE_REMINDER',
        priority: 'LOW',
        title: 'Clock-in Reminder',
        message: 'Don\'t forget to clock in when you arrive at the site. Use the mobile app.',
        recipients: [testUser._id],
        requiresAcknowledgment: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        language: 'en',
        actionData: {
          type: 'attendance_reminder'
        }
      }
    ];

    // Create notifications
    const createdNotifications = [];
    for (const notificationData of sampleNotifications) {
      const notification = new Notification(notificationData);
      await notification.save();
      createdNotifications.push(notification);
      console.log(`✅ Created ${notification.priority} notification: ${notification.title}`);
    }

    console.log(`\n🎉 Successfully created ${createdNotifications.length} sample notifications!`);
    console.log('\n📱 You can now view these notifications at:');
    console.log('   - Worker Dashboard: http://localhost:3000/worker/dashboard');
    console.log('   - Supervisor Management: http://localhost:3000/supervisor/notifications');
    
    console.log('\n🔌 API endpoints to test:');
    console.log(`   - GET /api/notifications (with user token)`);
    console.log(`   - GET /api/notifications/stats`);
    console.log(`   - PUT /api/notifications/${createdNotifications[0]._id}/read`);
    console.log(`   - PUT /api/notifications/${createdNotifications[0]._id}/acknowledge`);

    // Create some multilingual notifications
    const multilingualNotifications = [
      {
        type: 'SAFETY_ALERT',
        priority: 'HIGH',
        title: '安全提醒：佩戴安全帽',
        message: '所有工人在施工区域必须佩戴安全帽。这是强制性的安全要求。',
        recipients: [testUser._id],
        requiresAcknowledgment: true,
        language: 'zh'
      },
      {
        type: 'TASK_ASSIGNMENT',
        priority: 'MEDIUM',
        title: 'Tugasan Baru Diberikan',
        message: 'Anda telah ditugaskan untuk kerja konkrit di Tapak B. Sila semak butiran tugasan anda.',
        recipients: [testUser._id],
        requiresAcknowledgment: false,
        language: 'ms'
      }
    ];

    for (const notificationData of multilingualNotifications) {
      const notification = new Notification(notificationData);
      await notification.save();
      console.log(`✅ Created multilingual notification: ${notification.title} (${notification.language})`);
    }

    console.log('\n🌐 Multilingual notifications created for testing language support!');

  } catch (error) {
    console.error('❌ Error creating sample notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the script
createSampleNotifications();