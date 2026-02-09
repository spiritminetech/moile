import axios from 'axios';

const BASE_URL = 'http://localhost:5002/api';

async function test() {
  console.log('🧪 Testing Materials & Tools Endpoint - FINAL\n');
  console.log('='.repeat(60));

  try {
    // Login
    console.log('\n📝 Step 1: Login as Supervisor');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'supervisor@gmail.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get projects
    console.log('\n📝 Step 2: Get Projects');
    const projectsResponse = await axios.get(`${BASE_URL}/supervisor/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const projects = projectsResponse.data.data || projectsResponse.data.projects || [];
    if (projects.length === 0) {
      console.error('❌ No projects found');
      return;
    }

    const projectId = projects[0].id;
    console.log(`✅ Found ${projects.length} project(s)`);
    console.log(`   Using Project ID: ${projectId} - ${projects[0].projectName}`);

    // Test materials-tools endpoint
    console.log('\n📝 Step 3: Test GET /supervisor/materials-tools');
    const response = await axios.get(
      `${BASE_URL}/supervisor/materials-tools?projectId=${projectId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Endpoint responded successfully!');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.data.success}`);

    if (response.data.data) {
      const { materialRequests, toolAllocations } = response.data.data;
      console.log(`\n📊 Data Summary:`);
      console.log(`   Material Requests: ${materialRequests?.length || 0}`);
      console.log(`   Tool Allocations: ${toolAllocations?.length || 0}`);

      if (materialRequests?.length > 0) {
        console.log(`\n   📦 Sample Material Request:`);
        const sample = materialRequests[0];
        console.log(`      ID: ${sample.id}`);
        console.log(`      Item: ${sample.itemName}`);
        console.log(`      Quantity: ${sample.quantity} ${sample.unit}`);
        console.log(`      Status: ${sample.status}`);
        console.log(`      Project: ${sample.projectName}`);
      } else {
        console.log(`\n   ℹ️  No material requests found (this is OK - endpoint works)`);
      }

      if (toolAllocations?.length > 0) {
        console.log(`\n   🔧 Sample Tool Allocation:`);
        const sample = toolAllocations[0];
        console.log(`      ID: ${sample.id}`);
        console.log(`      Tool: ${sample.toolName}`);
        console.log(`      Allocated To: ${sample.allocatedToName}`);
        console.log(`      Status: ${sample.status}`);
      } else {
        console.log(`\n   ℹ️  No tool allocations found (this is OK - endpoint works)`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS - Endpoint is working correctly!');
    console.log('='.repeat(60));
    console.log('\n🎉 The /api/supervisor/materials-tools endpoint is functional!');
    console.log('📱 Mobile app should now load without 404 errors.\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('='.repeat(60));
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`URL: ${error.config?.url}`);
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

test();
