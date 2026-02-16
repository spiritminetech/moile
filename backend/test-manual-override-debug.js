import axios from 'axios';

const BASE_URL = 'http://192.168.1.6:5002/api';

async function testManualOverride() {
  try {
    console.log('🔐 Step 1: Login...\n');
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 50) + '...\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('📝 Step 2: Testing Manual Attendance Override...\n');

    // Test with different date formats
    const testCases = [
      {
        name: 'Test 1: Time only (HH:MM)',
        body: {
          employeeId: 107,
          projectId: 1,
          date: '2026-02-06',
          checkInTime: '08:00',
          checkOutTime: '17:00',
          reason: 'Network issue prevented automatic check-in',
          overrideType: 'FULL_DAY'
        }
      },
      {
        name: 'Test 2: Full ISO datetime',
        body: {
          employeeId: 107,
          projectId: 1,
          date: '2026-02-06',
          checkInTime: '2026-02-06T08:00:00.000Z',
          checkOutTime: '2026-02-06T17:00:00.000Z',
          reason: 'Network issue prevented automatic check-in',
          overrideType: 'FULL_DAY'
        }
      },
      {
        name: 'Test 3: Date + Time combined',
        body: {
          employeeId: 107,
          projectId: 1,
          date: '2026-02-06',
          checkInTime: '2026-02-06 08:00:00',
          checkOutTime: '2026-02-06 17:00:00',
          reason: 'Network issue prevented automatic check-in',
          overrideType: 'FULL_DAY'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n${testCase.name}`);
      console.log('Request Body:', JSON.stringify(testCase.body, null, 2));
      
      try {
        const response = await axios.post(
          `${BASE_URL}/supervisor/manual-attendance-override`,
          testCase.body,
          { headers }
        );

        console.log('✅ SUCCESS!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        break; // Stop after first success
      } catch (error) {
        console.log('❌ FAILED');
        if (error.response) {
          console.log('Status:', error.response.status);
          console.log('Error:', error.response.data);
        } else {
          console.log('Error:', error.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testManualOverride();
