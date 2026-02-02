import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const testValidateLocationFix = async () => {
  try {
    console.log('\n🧪 TESTING VALIDATE LOCATION FIX\n');

    // 1. Create a test JWT token (simulating a logged-in user)
    const tokenPayload = {
      userId: 23,
      companyId: 2,
      roleId: 2,
      role: 'ADMIN',
      email: 'admin1@gmail.com',
      permissions: []
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '8h' });
    console.log('1. Created test token for user with company ID 2');

    // 2. Test the validate-location endpoint
    const baseURL = 'http://localhost:5002/api';
    
    const testData = {
      projectId: 1, // This should now exist for company 2
      latitude: 1.3521, // Singapore coordinates (matching our test project)
      longitude: 103.8198,
      accuracy: 10
    };

    console.log('2. Testing validate-location endpoint with data:', testData);

    try {
      const response = await axios.post(
        `${baseURL}/worker/attendance/validate-location`,
        testData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ API call successful!');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
      if (error.response) {
        console.log('❌ API call failed with response:');
        console.log('Status:', error.response.status);
        console.log('Status Text:', error.response.statusText);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.log('❌ API call failed - no response received');
        console.log('Request error:', error.message);
      } else {
        console.log('❌ API call failed - request setup error');
        console.log('Error:', error.message);
      }
    }

    // 3. Test with different project IDs
    console.log('\n3. Testing with different project IDs:');
    
    const testProjectIds = [1, 2, 1004];
    
    for (const projectId of testProjectIds) {
      console.log(`\n   Testing project ID: ${projectId}`);
      
      try {
        const response = await axios.post(
          `${baseURL}/worker/attendance/validate-location`,
          { ...testData, projectId },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`   ✅ Project ${projectId}: Success`);
        console.log(`   Valid: ${response.data.valid}, Distance: ${response.data.distance}m`);

      } catch (error) {
        if (error.response) {
          console.log(`   ❌ Project ${projectId}: ${error.response.status} - ${error.response.data.message}`);
        } else {
          console.log(`   ❌ Project ${projectId}: Request failed - ${error.message}`);
        }
      }
    }

    // 4. Test with coordinates outside geofence
    console.log('\n4. Testing with coordinates outside geofence:');
    
    const outsideData = {
      projectId: 1,
      latitude: 1.4000, // Different coordinates (should be outside geofence)
      longitude: 103.9000,
      accuracy: 10
    };

    try {
      const response = await axios.post(
        `${baseURL}/worker/attendance/validate-location`,
        outsideData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('   ✅ Outside geofence test successful');
      console.log(`   Valid: ${response.data.valid}, Distance: ${response.data.distance}m`);
      console.log(`   Message: ${response.data.message}`);

    } catch (error) {
      if (error.response) {
        console.log(`   ❌ Outside geofence test failed: ${error.response.status} - ${error.response.data.message}`);
      } else {
        console.log(`   ❌ Outside geofence test failed: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Check if server is running first
const checkServer = async () => {
  try {
    const response = await axios.get('http://localhost:5002/api/health', { timeout: 5000 });
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the backend server first.');
    console.log('Run: npm start or node index.js in the backend directory');
    return false;
  }
};

const runTest = async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testValidateLocationFix();
  }
};

runTest();