/**
 * Test script to login and then test notification API endpoint
 */

async function testLoginAndNotifications() {
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
    
    // Now test the notification history endpoint
    console.log('🔍 Testing notification API endpoint...');
    
    const response = await fetch('http://localhost:5002/api/notifications/history?limit=5', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data && data.notifications) {
      console.log(`✅ API returned ${data.notifications.length} notifications`);
      
      data.notifications.forEach((notification, index) => {
        console.log(`\n📝 Notification ${index + 1}:`);
        console.log('  - ID:', notification.id);
        console.log('  - Title:', notification.title);
        console.log('  - Message:', notification.message.substring(0, 100) + (notification.message.length > 100 ? '...' : ''));
        console.log('  - Status:', notification.status);
        console.log('  - Is Read:', notification.isRead);
        console.log('  - Created At:', notification.createdAt);
        
        // Check if content is still encrypted
        if (notification.title === '[ENCRYPTED]' || notification.message === '[ENCRYPTED]') {
          console.log('  ❌ Content is still encrypted!');
        } else {
          console.log('  ✅ Content is properly decrypted');
        }
      });
    } else {
      console.log('❌ No notifications returned from API');
      console.log('API response:', data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testLoginAndNotifications();