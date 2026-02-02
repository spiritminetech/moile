/**
 * Simple test to verify notification mark-as-read API endpoint
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5002';

// Test token (replace with actual valid token)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJXT1JLRVIiLCJjb21wYW55SWQiOjEsImlhdCI6MTczODI0NzIwMCwiZXhwIjoxNzM4Mjc2MDAwfQ.test';

async function testMarkAsReadAPI() {
  console.log('🧪 Testing Notification Mark-as-Read API');
  console.log('=' .repeat(50));

  try {
    // Test 1: Get notifications first
    console.log('\n📋 Step 1: Getting notifications...');
    const notificationsResponse = await fetch(`${API_BASE}/api/notifications/history`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!notificationsResponse.ok) {
      console.log('❌ Failed to get notifications');
      console.log(`Status: ${notificationsResponse.status}`);
      const errorText = await notificationsResponse.text();
      console.log(`Error: ${errorText}`);
      return;
    }

    const notificationsData = await notificationsResponse.json();
    console.log(`✅ Retrieved ${notificationsData.notifications?.length || 0} notifications`);

    if (!notificationsData.notifications || notificationsData.notifications.length === 0) {
      console.log('⚠️  No notifications found to test with');
      return;
    }

    // Find an unread notification
    const unreadNotification = notificationsData.notifications.find(n => !n.readAt);
    const testNotificationId = unreadNotification?.id || notificationsData.notifications[0].id;

    console.log(`📝 Using notification ID: ${testNotificationId}`);
    console.log(`   Title: ${unreadNotification?.title || notificationsData.notifications[0].title}`);
    console.log(`   Current status: ${unreadNotification?.status || notificationsData.notifications[0].status}`);

    // Test 2: Mark notification as read
    console.log('\n✅ Step 2: Marking notification as read...');
    const markReadResponse = await fetch(`${API_BASE}/api/notifications/${testNotificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Response status: ${markReadResponse.status} ${markReadResponse.statusText}`);

    if (markReadResponse.ok) {
      const result = await markReadResponse.json();
      console.log('✅ Mark-as-read successful!');
      console.log('📄 Response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await markReadResponse.text();
      console.log('❌ Mark-as-read failed');
      console.log(`Error: ${errorText}`);
    }

    // Test 3: Verify the notification was marked as read
    console.log('\n🔍 Step 3: Verifying notification was marked as read...');
    const verifyResponse = await fetch(`${API_BASE}/api/notifications/history`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      const updatedNotification = verifyData.notifications?.find(n => n.id == testNotificationId);
      
      if (updatedNotification) {
        console.log('✅ Notification found after update');
        console.log(`   Status: ${updatedNotification.status}`);
        console.log(`   Read at: ${updatedNotification.readAt || 'Not set'}`);
        
        if (updatedNotification.readAt) {
          console.log('🎉 SUCCESS: Notification was successfully marked as read!');
        } else {
          console.log('⚠️  WARNING: Notification was not marked as read');
        }
      } else {
        console.log('❌ Could not find notification after update');
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n🏁 Test completed');
}

// Run the test
testMarkAsReadAPI();