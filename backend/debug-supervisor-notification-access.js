import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002';

/**
 * Debug script to test supervisor notification access
 * This will help identify why the ACCESS_DENIED error is occurring
 */

async function debugSupervisorNotificationAccess() {
  console.log('🔍 Debugging Supervisor Notification Access...\n');

  try {
    // Step 1: Test login to get a token
    console.log('Step 1: Testing login...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'supervisor@company.com', // Adjust this email as needed
        password: 'password123' // Adjust this password as needed
      })
    });

    const loginData = await loginResponse.json();

    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    const token = loginData.token;
    const user = loginData.user;
    
    console.log('✅ Login successful');
    console.log('User info:', {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    });
    console.log('Token received:', token ? 'Yes' : 'No');
    console.log('');

    // Step 2: Test token verification by calling a simple endpoint first
    console.log('Step 2: Testing token verification...');
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Try a simple authenticated endpoint first
      const testResponse = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });
      const testData = await testResponse.json();
      
      if (testResponse.ok) {
        console.log('✅ Token verification successful');
        console.log('User from token:', testData.user);
        console.log('');
      } else {
        console.error('❌ Token verification failed:', testData);
        return;
      }
    } catch (tokenError) {
      console.error('❌ Token verification failed:', tokenError.message);
      return;
    }

    // Step 3: Test the supervisor notification overview endpoint
    console.log('Step 3: Testing supervisor notification overview...');
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const overviewResponse = await fetch(`${API_BASE_URL}/api/supervisor/notifications/overview`, { headers });
      const overviewData = await overviewResponse.json();
      
      if (overviewResponse.ok) {
        console.log('✅ Supervisor notification overview successful');
        console.log('Response:', overviewData);
      } else {
        console.error('❌ Supervisor notification overview failed');
        console.error('Status:', overviewResponse.status);
        console.error('Error:', overviewData);
        
        // Let's analyze the error
        if (overviewResponse.status === 403) {
          console.log('\n🔍 Analyzing ACCESS_DENIED error...');
          console.log('This suggests the user role or permissions are insufficient.');
          console.log('Expected roles: supervisor, admin, company_admin');
          console.log('User role from login:', user.role);
          
          if (!['supervisor', 'admin', 'company_admin'].includes(user.role)) {
            console.log('❌ User role is not authorized for supervisor endpoints');
            console.log('💡 Solution: Update user role to supervisor, admin, or company_admin');
          }
        }
      }
    } catch (overviewError) {
      console.error('❌ Supervisor notification overview failed:', overviewError.message);
    }

    // Step 4: Check user's company association
    console.log('\nStep 4: Checking user company association...');
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // This endpoint might not exist, but let's try to get user details
      const userDetailsResponse = await fetch(`${API_BASE_URL}/api/users/profile`, { headers });
      
      if (userDetailsResponse.ok) {
        const userDetailsData = await userDetailsResponse.json();
        console.log('✅ User profile retrieved');
        console.log('Profile:', userDetailsData);
      } else {
        console.log('ℹ️ Could not retrieve user profile (endpoint might not exist)');
      }
    } catch (profileError) {
      console.log('ℹ️ Could not retrieve user profile (endpoint might not exist)');
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
  }
}

// Alternative login credentials to try
const alternativeCredentials = [
  { email: 'admin@company.com', password: 'password123' },
  { email: 'supervisor@test.com', password: 'password123' },
  { email: 'test@supervisor.com', password: 'password123' }
];

async function tryAlternativeLogins() {
  console.log('\n🔄 Trying alternative login credentials...\n');
  
  for (const creds of alternativeCredentials) {
    try {
      console.log(`Trying: ${creds.email}`);
      const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(creds)
      });
      
      const loginData = await loginResponse.json();
      
      if (loginData.success) {
        console.log('✅ Login successful with:', creds.email);
        console.log('User role:', loginData.user.role);
        console.log('Company ID:', loginData.user.companyId);
        
        // Test the supervisor endpoint with this user
        const token = loginData.token;
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        try {
          const overviewResponse = await fetch(`${API_BASE_URL}/api/supervisor/notifications/overview`, { headers });
          const overviewData = await overviewResponse.json();
          
          if (overviewResponse.ok) {
            console.log('✅ Supervisor endpoint works with this user!');
            return; // Success, exit the function
          } else {
            console.log('❌ Supervisor endpoint still fails with this user');
            console.log('Error:', overviewData?.message);
          }
        } catch (endpointError) {
          console.log('❌ Supervisor endpoint still fails with this user');
          console.log('Error:', endpointError.message);
        }
      }
    } catch (loginError) {
      console.log('❌ Login failed for:', creds.email);
    }
    console.log('');
  }
}

// Run the debug script
debugSupervisorNotificationAccess()
  .then(() => tryAlternativeLogins())
  .then(() => {
    console.log('\n🏁 Debug script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug script crashed:', error);
    process.exit(1);
  });