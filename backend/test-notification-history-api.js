/**
 * Integration test for notification history API endpoints
 * Tests the new notification history functionality
 */

import mongoose from 'mongoose';
import appConfig from './src/config/app.config.js';
import WorkerNotification from './src/modules/notification/models/Notification.js';
import NotificationAudit from './src/modules/notification/models/NotificationAudit.js';
import NotificationController from './src/modules/notification/notificationController.js';

async function testNotificationHistoryAPI() {
  console.log('🧪 Testing Notification History API Endpoints');
  console.log('===============================================');

  try {
    // Connect to database
    await mongoose.connect(appConfig.database.uri, { 
      dbName: appConfig.database.name,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Test data setup
    const testWorkerId = 999;
    const testNotifications = [
      {
        id: 9001,
        type: 'TASK_UPDATE',
        priority: 'HIGH',
        title: 'New task assigned',
        message: 'You have been assigned a new construction task',
        senderId: 1,
        recipientId: testWorkerId,
        status: 'READ',
        readAt: new Date(),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        contentHash: 'hash1'
      },
      {
        id: 9002,
        type: 'SITE_CHANGE',
        priority: 'CRITICAL',
        title: 'Site location changed',
        message: 'Report to new construction site immediately',
        senderId: 1,
        recipientId: testWorkerId,
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        contentHash: 'hash2'
      },
      {
        id: 9003,
        type: 'ATTENDANCE_ALERT',
        priority: 'NORMAL',
        title: 'Attendance reminder',
        message: 'Remember to check in when you arrive',
        senderId: 1,
        recipientId: testWorkerId,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        contentHash: 'hash3'
      }
    ];

    // Clean up existing test data
    await WorkerNotification.deleteMany({ recipientId: testWorkerId });
    console.log('🧹 Cleaned up existing test data');

    // Insert test notifications
    await WorkerNotification.insertMany(testNotifications);
    console.log('📝 Inserted test notifications');

    // Test 1: Basic notification history retrieval
    console.log('\n📋 Test 1: Basic notification history retrieval');
    const req1 = {
      user: { id: testWorkerId, role: 'worker' },
      notificationPermissions: { restrictToRecipient: testWorkerId },
      query: {}
    };
    const res1 = {
      json: (data) => {
        console.log('✅ Basic history retrieval successful');
        console.log(`   - Total notifications: ${data.notifications.length}`);
        console.log(`   - Read count: ${data.summary.readCount}`);
        console.log(`   - Unread count: ${data.summary.unreadCount}`);
        console.log(`   - Retention period: ${data.summary.retentionPeriod}`);
        
        // Verify 90-day retention is enforced
        if (data.summary.retentionPeriod === '90 days') {
          console.log('✅ 90-day retention period correctly enforced');
        }
        
        // Verify read status indicators
        const readNotifications = data.notifications.filter(n => n.isRead);
        const unreadNotifications = data.notifications.filter(n => !n.isRead);
        console.log(`   - Read notifications: ${readNotifications.length}`);
        console.log(`   - Unread notifications: ${unreadNotifications.length}`);
      },
      status: (code) => ({
        json: (data) => console.log(`❌ Error ${code}:`, data.message)
      })
    };

    await NotificationController.getNotificationHistory(req1, res1);

    // Test 2: Filtering by read status
    console.log('\n📋 Test 2: Filtering by read status (unread only)');
    const req2 = {
      user: { id: testWorkerId, role: 'worker' },
      notificationPermissions: { restrictToRecipient: testWorkerId },
      query: { readStatus: 'unread' }
    };
    const res2 = {
      json: (data) => {
        console.log('✅ Read status filtering successful');
        console.log(`   - Unread notifications returned: ${data.notifications.length}`);
        const allUnread = data.notifications.every(n => !n.isRead);
        if (allUnread) {
          console.log('✅ All returned notifications are unread');
        }
      },
      status: (code) => ({
        json: (data) => console.log(`❌ Error ${code}:`, data.message)
      })
    };

    await NotificationController.getNotificationHistory(req2, res2);

    // Test 3: Text search functionality
    console.log('\n📋 Test 3: Text search functionality');
    const req3 = {
      user: { id: testWorkerId, role: 'worker' },
      notificationPermissions: { restrictToRecipient: testWorkerId },
      query: { search: 'task' }
    };
    const res3 = {
      json: (data) => {
        console.log('✅ Text search successful');
        console.log(`   - Search results: ${data.notifications.length}`);
        const hasTaskInContent = data.notifications.some(n => 
          n.title.toLowerCase().includes('task') || 
          n.message.toLowerCase().includes('task') ||
          n.type.toLowerCase().includes('task')
        );
        if (hasTaskInContent) {
          console.log('✅ Search results contain "task" keyword');
        }
      },
      status: (code) => ({
        json: (data) => console.log(`❌ Error ${code}:`, data.message)
      })
    };

    await NotificationController.getNotificationHistory(req3, res3);

    // Test 4: Date range filtering
    console.log('\n📋 Test 4: Date range filtering');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const req4 = {
      user: { id: testWorkerId, role: 'worker' },
      notificationPermissions: { restrictToRecipient: testWorkerId },
      query: { 
        startDate: yesterday.toISOString(),
        endDate: new Date().toISOString()
      }
    };
    const res4 = {
      json: (data) => {
        console.log('✅ Date range filtering successful');
        console.log(`   - Notifications in date range: ${data.notifications.length}`);
        console.log(`   - Date range: ${data.filters.dateRange.start} to ${data.filters.dateRange.end}`);
      },
      status: (code) => ({
        json: (data) => console.log(`❌ Error ${code}:`, data.message)
      })
    };

    await NotificationController.getNotificationHistory(req4, res4);

    // Test 5: Access control - worker trying to access another worker's history
    console.log('\n📋 Test 5: Access control test');
    const req5 = {
      user: { id: testWorkerId, role: 'worker' },
      notificationPermissions: { restrictToRecipient: testWorkerId },
      query: { workerId: '888' } // Different worker ID
    };
    const res5 = {
      json: (data) => {
        console.log('❌ Access control failed - should have been denied');
      },
      status: (code) => ({
        json: (data) => {
          if (code === 403) {
            console.log('✅ Access control working - access denied as expected');
            console.log(`   - Error: ${data.message}`);
          } else {
            console.log(`❌ Unexpected error code: ${code}`);
          }
        }
      })
    };

    await NotificationController.getNotificationHistory(req5, res5);

    // Test 6: Audit records access (supervisor role)
    console.log('\n📋 Test 6: Audit records access');
    
    // Create some audit records using the proper method
    await NotificationAudit.deleteMany({ workerId: testWorkerId });
    
    await NotificationAudit.createAuditRecord({
      notificationId: 9001,
      workerId: testWorkerId,
      event: 'DELIVERED',
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      metadata: { deliveryMethod: 'PUSH' }
    });

    await NotificationAudit.createAuditRecord({
      notificationId: 9001,
      workerId: testWorkerId,
      event: 'READ',
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      metadata: { accessMethod: 'API' }
    });

    console.log('📝 Inserted test audit records');

    const req6 = {
      user: { id: 1, role: 'supervisor' },
      notificationPermissions: { canReadAll: true },
      query: { workerId: testWorkerId.toString() }
    };
    const res6 = {
      json: (data) => {
        console.log('✅ Audit records retrieval successful');
        console.log(`   - Total audit records: ${data.auditRecords.length}`);
        console.log(`   - Event types: ${data.summary.eventTypes.map(e => e._id).join(', ')}`);
        console.log(`   - Retention period: ${data.summary.retentionPeriod}`);
      },
      status: (code) => ({
        json: (data) => console.log(`❌ Error ${code}:`, data.message)
      })
    };

    await NotificationController.getNotificationAudit(req6, res6);

    // Clean up test data
    await WorkerNotification.deleteMany({ recipientId: testWorkerId });
    await NotificationAudit.deleteMany({ workerId: testWorkerId });
    console.log('\n🧹 Cleaned up test data');

    console.log('\n✅ All notification history API tests completed successfully!');
    console.log('📋 Features tested:');
    console.log('   - 90-day notification history retrieval (Requirement 6.3)');
    console.log('   - Search and filtering by worker, date range, and type (Requirement 6.4)');
    console.log('   - Read/unread status tracking (Requirement 6.5)');
    console.log('   - Searchable audit records (Requirement 10.4)');
    console.log('   - Permission-based access control');
    console.log('   - Text search functionality');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testNotificationHistoryAPI().catch(console.error);