/**
 * Test script to verify the mark-as-read API endpoint works correctly
 */

async function testMarkAsRead() {
  try {
    console.log('🔐 Testing login...');
    
    // First, login to get a valid token
    const loginResponse = await fetch('http://localhost:5002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'worker@gmail.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();

    if (!loginData || !loginData.token) {
      console.log('❌ Login failed or no token returned');
      console.log('Login response:', loginData);
      return;
    }

    const token = loginData.token;
    const userId = loginData.user.id;
    console.log('✅ Login successful for user ID:', userId);
    
    // Get notifications first
    console.log('📋 Getting notifications...');
    const notificationsResponse = await fetch('http://localhost:5002/api/notifications/history?limit=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const notificationsData = await notificationsResponse.json();

    if (!notificationsData || !notificationsData.notifications || notificationsData.notifications.length === 0) {
      console.log('❌ No notifications found');
      return;
    }

    const notification = notificationsData.notifications[0];
    console.log('📝 Found notification:', notification.id, '-', notification.title);
    console.log('   Status before:', notification.status);
    console.log('   Is Read before:', notification.isRead);

    // Now test marking as read
    console.log('🔄 Testing mark as read...');
    
    const markReadResponse = await fetch(`http://localhost:5002/api/notifications/${notification.id}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const markReadData = await markReadResponse.json();

    if (markReadResponse.ok) {
      console.log('✅ Mark as read successful!');
      console.log('Response:', markReadData);
      
      // Verify the change by getting notifications again
      console.log('🔍 Verifying the change...');
      const verifyResponse = await fetch(`http://localhost:5002/api/notifications/history?limit=5`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const verifyData = await verifyResponse.json();
      const updatedNotification = verifyData.notifications.find(n => n.id === notification.id);
      
      if (updatedNotification) {
        console.log('📝 Updated notification status:', updatedNotification.status);
        console.log('   Is Read after:', updatedNotification.isRead);
        console.log('   Read At:', updatedNotification.readAt);
      }
    } else {
      console.log('❌ Mark as read failed!');
      console.log('Status:', markReadResponse.status);
      console.log('Response:', markReadData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testMarkAsRead();