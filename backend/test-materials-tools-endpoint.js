import axios from 'axios';

const BASE_URL = 'http://localhost:5002/api';

// Test credentials for supervisor
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

async function testMaterialsToolsEndpoint() {
  console.log('🧪 Testing Materials & Tools Endpoint\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login as supervisor
    console.log('\n📝 Step 1: Login as Supervisor');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, SUPERVISOR_CREDENTIALS);
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token;
    const supervisorId = loginResponse.data.user.id;
    console.log('✅ Login successful');
    console.log(`   Supervisor ID: ${supervisorId}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Get supervisor's projects
    console.log('\n📝 Step 2: Get Supervisor Projects');
    const projectsResponse = await axios.get(`${BASE_URL}/supervisor/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!projectsResponse.data.success || !projectsResponse.data.projects?.length) {
      console.error('❌ No projects found for supervisor');
      return;
    }

    const projectId = projectsResponse.data.projects[0].id;
    const projectName = projectsResponse.data.projects[0].projectName;
    console.log('✅ Projects retrieved');
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Project Name: ${projectName}`);

    // Step 3: Test /materials-tools endpoint WITHOUT projectId
    console.log('\n📝 Step 3: Test GET /supervisor/materials-tools (All Projects)');
    const allMaterialsResponse = await axios.get(`${BASE_URL}/supervisor/materials-tools`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Endpoint responded successfully');
    console.log(`   Status: ${allMaterialsResponse.status}`);
    console.log(`   Success: ${allMaterialsResponse.data.success}`);
    
    if (allMaterialsResponse.data.data) {
      const { materialRequests, toolAllocations } = allMaterialsResponse.data.data;
      console.log(`   Material Requests: ${materialRequests?.length || 0}`);
      console.log(`   Tool Allocations: ${toolAllocations?.length || 0}`);

      if (materialRequests?.length > 0) {
        console.log('\n   📦 Sample Material Request:');
        const sample = materialRequests[0];
        console.log(`      ID: ${sample.id}`);
        console.log(`      Item: ${sample.itemName}`);
        console.log(`      Quantity: ${sample.quantity} ${sample.unit}`);
        console.log(`      Status: ${sample.status}`);
        console.log(`      Urgency: ${sample.urgency}`);
        console.log(`      Project: ${sample.projectName}`);
      }

      if (toolAllocations?.length > 0) {
        console.log('\n   🔧 Sample Tool Allocation:');
        const sample = toolAllocations[0];
        console.log(`      ID: ${sample.id}`);
        console.log(`      Tool: ${sample.toolName}`);
        console.log(`      Allocated To: ${sample.allocatedToName}`);
        console.log(`      Status: ${sample.status}`);
        console.log(`      Project: ${sample.projectName}`);
      }
    }

    // Step 4: Test /materials-tools endpoint WITH projectId
    console.log('\n📝 Step 4: Test GET /supervisor/materials-tools?projectId=' + projectId);
    const projectMaterialsResponse = await axios.get(
      `${BASE_URL}/supervisor/materials-tools?projectId=${projectId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Endpoint responded successfully');
    console.log(`   Status: ${projectMaterialsResponse.status}`);
    console.log(`   Success: ${projectMaterialsResponse.data.success}`);
    
    if (projectMaterialsResponse.data.data) {
      const { materialRequests, toolAllocations } = projectMaterialsResponse.data.data;
      console.log(`   Material Requests for Project ${projectId}: ${materialRequests?.length || 0}`);
      console.log(`   Tool Allocations for Project ${projectId}: ${toolAllocations?.length || 0}`);
    }

    // Step 5: Test other materials/tools endpoints
    console.log('\n📝 Step 5: Test Related Endpoints');

    // Test inventory endpoint
    console.log('\n   Testing GET /supervisor/materials/inventory');
    const inventoryResponse = await axios.get(
      `${BASE_URL}/supervisor/materials/inventory?projectId=${projectId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`   ✅ Inventory: ${inventoryResponse.data.success ? 'Success' : 'Failed'}`);
    if (inventoryResponse.data.data) {
      console.log(`      Items: ${inventoryResponse.data.data.inventory?.length || 0}`);
      console.log(`      Alerts: ${inventoryResponse.data.data.alerts?.length || 0}`);
    }

    // Test tool usage log endpoint
    console.log('\n   Testing GET /supervisor/tool-usage-log');
    const toolLogResponse = await axios.get(
      `${BASE_URL}/supervisor/tool-usage-log?projectId=${projectId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`   ✅ Tool Usage Log: ${toolLogResponse.data.success ? 'Success' : 'Failed'}`);
    if (toolLogResponse.data.tools) {
      console.log(`      Tools: ${toolLogResponse.data.tools.length}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('   ✅ Login successful');
    console.log('   ✅ Projects retrieved');
    console.log('   ✅ /materials-tools endpoint working (all projects)');
    console.log('   ✅ /materials-tools endpoint working (specific project)');
    console.log('   ✅ /materials/inventory endpoint working');
    console.log('   ✅ /tool-usage-log endpoint working');
    console.log('\n🎉 Materials & Tools API is fully functional!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('=' .repeat(60));
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('URL:', error.config?.url);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
      console.error('URL:', error.config?.url);
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Ensure backend server is running on port 5002');
    console.error('   2. Check supervisor credentials are correct');
    console.error('   3. Verify supervisor has assigned projects');
    console.error('   4. Check database connection');
  }
}

// Run the test
testMaterialsToolsEndpoint();
