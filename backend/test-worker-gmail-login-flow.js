import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testWorkerGmailLoginFlow = async () => {
  try {
    console.log('\n🧪 TESTING WORKER@GMAIL.COM LOGIN FLOW\n');

    const baseURL = 'http://localhost:5002/api';

    // 1. Test login
    console.log('1. Testing login for worker@gmail.com...');
    
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'worker@gmail.com',
        password: 'password123' // Assuming this is the password
      });

      console.log('✅ Login successful!');
      console.log('Login response structure:', {
        success: loginResponse.data.success,
        autoSelected: loginResponse.data.autoSelected,
        hasToken: !!loginResponse.data.token,
        hasUser: !!loginResponse.data.user,
        hasCompany: !!loginResponse.data.company,
        hasEmployee: !!loginResponse.data.employee
      });

      // Check if user has currentProject
      if (loginResponse.data.user?.currentProject) {
        console.log('✅ User has currentProject:', loginResponse.data.user.currentProject);
      } else {
        console.log('❌ User has no currentProject in login response');
      }

      // Check company info
      if (loginResponse.data.company) {
        console.log('Company info:', {
          id: loginResponse.data.company.id,
          name: loginResponse.data.company.name
        });
      }

      // Check employee info
      if (loginResponse.data.employee) {
        console.log('Employee info:', {
          id: loginResponse.data.employee.id,
          currentProject: loginResponse.data.employee.currentProject
        });
      }

      const token = loginResponse.data.token;

      // 2. Test what project ID the mobile app would use
      console.log('\n2. Simulating mobile app project ID selection logic:');
      
      const user = loginResponse.data.user;
      const company = loginResponse.data.company;
      
      let projectId = null;
      
      if (user?.currentProject?.id) {
        projectId = user.currentProject.id.toString();
        console.log('📍 Would use project ID from user.currentProject:', projectId);
      } else if (company?.id) {
        projectId = company.id.toString();
        console.log('📍 Would use project ID from company (WRONG):', projectId);
      } else {
        projectId = '1';
        console.log('📍 Would use default project ID:', projectId);
      }

      // 3. Test validate-location with the project ID the mobile app would use
      console.log('\n3. Testing validate-location with project ID:', projectId);
      
      const testData = {
        projectId: parseInt(projectId),
        latitude: 1.3521,
        longitude: 103.8198,
        accuracy: 10
      };

      try {
        const validateResponse = await axios.post(
          `${baseURL}/worker/attendance/validate-location`,
          testData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('✅ Validate-location successful with project ID', projectId);
        console.log('Response:', {
          valid: validateResponse.data.valid,
          distance: validateResponse.data.distance,
          message: validateResponse.data.message
        });

      } catch (validateError) {
        if (validateError.response) {
          console.log(`❌ Validate-location failed with project ID ${projectId}:`);
          console.log('Status:', validateError.response.status);
          console.log('Message:', validateError.response.data.message);
          
          // This is the error we're trying to fix!
          if (validateError.response.status === 404) {
            console.log('\n🔧 This is the "Project not found" error we need to fix!');
            
            // Try with the correct project IDs for this user
            console.log('\n4. Testing with correct project IDs for worker@gmail.com:');
            
            const correctProjectIds = [2, 1003, 1001]; // From our previous analysis
            
            for (const correctProjectId of correctProjectIds) {
              console.log(`\n   Testing project ID: ${correctProjectId}`);
              
              try {
                const correctResponse = await axios.post(
                  `${baseURL}/worker/attendance/validate-location`,
                  { ...testData, projectId: correctProjectId },
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );

                console.log(`   ✅ Project ${correctProjectId}: Success`);
                console.log(`   Valid: ${correctResponse.data.valid}, Distance: ${correctResponse.data.distance}m`);

              } catch (error) {
                if (error.response) {
                  console.log(`   ❌ Project ${correctProjectId}: ${error.response.status} - ${error.response.data.message}`);
                } else {
                  console.log(`   ❌ Project ${correctProjectId}: Request failed`);
                }
              }
            }
          }
        } else {
          console.log('❌ Validate-location request failed:', validateError.message);
        }
      }

    } catch (loginError) {
      if (loginError.response) {
        console.log('❌ Login failed:');
        console.log('Status:', loginError.response.status);
        console.log('Message:', loginError.response.data.message);
      } else {
        console.log('❌ Login request failed:', loginError.message);
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
    return false;
  }
};

const runTest = async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testWorkerGmailLoginFlow();
  }
};

runTest();