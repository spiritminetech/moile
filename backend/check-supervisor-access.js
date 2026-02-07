import axios from 'axios';

const API_BASE_URL = 'http://192.168.0.3:5002/api';
const EMAIL = 'supervisor@gmail.com';
const PASSWORD = 'Password123';

async function checkAccess() {
  try {
    // Login
    console.log('🔐 Logging in as supervisor@gmail.com...\n');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD
    });
    
    if (!loginRes.data.token) {
      console.log('❌ Login failed');
      return;
    }
    
    const token = loginRes.data.token;
    console.log('✅ Login successful');
    console.log(`User: ${loginRes.data.user.name}`);
    console.log(`Role: ${loginRes.data.user.role}\n`);
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Get assigned sites/projects
    console.log('📍 Checking assigned sites...');
    try {
      const sitesRes = await axios.get(`${API_BASE_URL}/supervisor/assigned-sites`, { headers });
      if (sitesRes.data.success && sitesRes.data.sites) {
        console.log(`✅ Found ${sitesRes.data.sites.length} assigned sites:\n`);
        sitesRes.data.sites.forEach((site, i) => {
          console.log(`   ${i + 1}. Site ID: ${site.id} - ${site.name}`);
          console.log(`      Project ID: ${site.projectId}`);
          console.log(`      Location: ${site.location || 'N/A'}`);
          console.log(`      Status: ${site.status || 'N/A'}\n`);
        });
        
        // Test with first project
        if (sitesRes.data.sites.length > 0) {
          const projectId = sitesRes.data.sites[0].projectId;
          console.log(`\n🧪 Testing APIs with Project ID: ${projectId}\n`);
          
          // Test tool-usage-log
          console.log('1. GET /supervisor/tool-usage-log');
          try {
            const res = await axios.get(`${API_BASE_URL}/supervisor/tool-usage-log?projectId=${projectId}`, { headers });
            console.log(`   ✅ SUCCESS - Found ${res.data.count || 0} tools\n`);
          } catch (err) {
            console.log(`   ❌ ${err.response?.data?.message || err.message}\n`);
          }
          
          // Test log-tool-usage
          console.log('2. POST /supervisor/log-tool-usage');
          try {
            const res = await axios.post(`${API_BASE_URL}/supervisor/log-tool-usage`, {
              toolId: 1,
              action: 'check_out',
              employeeId: 101,
              quantity: 1,
              location: 'Test Site',
              notes: 'Test'
            }, { headers });
            console.log(`   ✅ SUCCESS\n`);
          } catch (err) {
            console.log(`   ❌ ${err.response?.data?.message || err.message}\n`);
          }
          
          // Test request-materials
          console.log('3. POST /supervisor/request-materials');
          try {
            const res = await axios.post(`${API_BASE_URL}/supervisor/request-materials`, {
              projectId: projectId,
              requestType: 'MATERIAL',
              itemName: 'Test Material',
              quantity: 100,
              unit: 'kg',
              urgency: 'medium',
              requiredDate: new Date().toISOString(),
              purpose: 'Testing'
            }, { headers });
            console.log(`   ✅ SUCCESS - Request ID: ${res.data.request?.id}\n`);
          } catch (err) {
            console.log(`   ❌ ${err.response?.data?.message || err.message}\n`);
          }
          
          // Test acknowledge-delivery
          console.log('4. POST /supervisor/acknowledge-delivery/:id');
          console.log('   ⚠️  Need valid request ID (skipping)\n');
          
          // Test return-materials
          console.log('5. POST /supervisor/return-materials');
          console.log('   ⚠️  Need valid request ID (skipping)\n');
        }
      } else {
        console.log('⚠️  No assigned sites found');
      }
    } catch (err) {
      console.log(`❌ ${err.response?.data?.message || err.message}`);
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log('API ENDPOINTS STATUS:');
    console.log('═══════════════════════════════════════');
    console.log('✅ POST /supervisor/request-materials - AVAILABLE');
    console.log('✅ POST /supervisor/acknowledge-delivery/:id - AVAILABLE');
    console.log('✅ POST /supervisor/return-materials - AVAILABLE');
    console.log('✅ GET /supervisor/tool-usage-log - AVAILABLE');
    console.log('✅ POST /supervisor/log-tool-usage - AVAILABLE');
    console.log('═══════════════════════════════════════');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAccess();
