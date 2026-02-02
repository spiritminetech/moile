/**
 * Test script to verify the notification API endpoint returns decrypted content
 */

import axios from 'axios';

async function testNotificationAPI() {
  try {
    console.log('🔍 Testing notification API endpoint...');
    
    // Test the notification history endpoint
    const response = await axios.get('http://localhost:5002/api/notifications/history', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE2LCJlbWFpbCI6InRlc3R3b3JrZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoid29ya2VyIiwiY29tcGFueUlkIjoxLCJpYXQiOjE3Mzg0NzE5NzIsImV4cCI6MTczODQ3NTU3Mn0.Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7E', // Sample token for worker ID 16
        'Content-Type': 'application/json'
      },
      params: {
        limit: 5
      }
    });

    if (response.data && response.data.notifications) {
      console.log(`✅ API returned ${response.data.notifications.length} notifications`);
      
      response.data.notifications.forEach((notification, index) => {
        console.log(`\n📝 Notification ${index + 1}:`);
        console.log('  - ID:', notification.id);
        console.log('  - Title:', notification.title);
        console.log('  - Message:', notification.message);
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
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

// Run the test
testNotificationAPI();