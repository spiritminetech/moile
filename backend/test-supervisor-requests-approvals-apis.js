import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// Test credentials
const SUPERVISOR_CREDENTIALS = {
    email: 'supervisor4@example.com',
    password: 'password123'
};

let supervisorToken = '';

/**
 * Test Script for Supervisor Requests & Approvals APIs
 * Tests all 9 new endpoints
 */

async function loginAsSupervisor() {
    try {
        console.log('\n🔐 Logging in as Supervisor...');
        const response = await axios.post(`${BASE_URL}/auth/login`, SUPERVISOR_CREDENTIALS);
        
        if (response.data.token) {
            supervisorToken = response.data.token;
            console.log('✅ Supervisor login successful');
            console.log(`   Token: ${supervisorToken.substring(0, 20)}...`);
            return true;
        }
    } catch (error) {
        console.error('❌ Supervisor login failed:', error.response?.data || error.message);
        return false;
    }
}

async function testGetPendingLeaveRequests() {
    try {
        console.log('\n📋 Testing GET /supervisor/pending-leave-requests...');
        const response = await axios.get(`${BASE_URL}/supervisor/pending-leave-requests`, {
            headers: { Authorization: `Bearer ${supervisorToken}` }
        });
        
        console.log('✅ Pending leave requests retrieved successfully');
        console.log(`   Count: ${response.data.count}`);
        console.log(`   Requests:`, JSON.stringify(response.data.requests?.slice(0, 2), null, 2));
        return response.data;
    } catch (error) {
        console.error('❌ Failed to get pending leave requests:', error.response?.data || error.message);
        return null;
    }
}

async function testApproveLeaveRequest(requestId) {
    try {
        console.log(`\n✅ Testing POST /supervisor/approve-leave/${requestId}...`);
        const response = await axios.post(
            `${BASE_URL}/supervisor/approve-leave/${requestId}`,
            {
                action: 'approve',
                remarks: 'Approved via API test'
            },
            {
                headers: { Authorization: `Bearer ${supervisorToken}` }
            }
        );
        
        console.log('✅ Leave request approved successfully');
        console.log(`   Response:`, response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to approve leave request:', error.response?.data || error.message);
        return null;
    }
}

async function testGetPendingAdvanceRequests() {
    try {
        console.log('\n💰 Testing GET /supervisor/pending-advance-requests...');
        const response = await axios.get(`${BASE_URL}/supervisor/pending-advance-requests`, {
            headers: { Authorization: `Bearer ${supervisorToken}` }
        });
        
        console.log('✅ Pending advance requests retrieved successfully');
        console.log(`   Count: ${response.data.count}`);
        console.log(`   Requests:`, JSON.stringify(response.data.requests?.slice(0, 2), null, 2));
        return response.data;
    } catch (error) {
        console.error('❌ Failed to get pending advance requests:', error.response?.data || error.message);
        return null;
    }
}

async function testApproveAdvanceRequest(requestId) {
    try {
        console.log(`\n✅ Testing POST /supervisor/approve-advance/${requestId}...`);
        const response = await axios.post(
            `${BASE_URL}/supervisor/approve-advance/${requestId}`,
            {
                action: 'approve',
                approvedAmount: 500,
                remarks: 'Approved via API test'
            },
            {
                headers: { Authorization: `Bearer ${supervisorToken}` }
            }
        );
        
        console.log('✅ Advance request approved successfully');
        console.log(`   Response:`, response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to approve advance request:', error.response?.data || error.message);
        return null;
    }
}

async function testGetPendingMaterialRequests() {
    try {
        console.log('\n🧱 Testing GET /supervisor/pending-material-requests...');
        const response = await axios.get(`${BASE_URL}/supervisor/pending-material-requests`, {
            headers: { Authorization: `Bearer ${supervisorToken}` }
        });
        
        console.log('✅ Pending material requests retrieved successfully');
        console.log(`   Count: ${response.data.count}`);
        console.log(`   Requests:`, JSON.stringify(response.data.requests?.slice(0, 2), null, 2));
        return response.data;
    } catch (error) {
        console.error('❌ Failed to get pending material requests:', error.response?.data || error.message);
        return null;
    }
}

async function testApproveMaterialRequest(requestId) {
    try {
        console.log(`\n✅ Testing POST /supervisor/approve-material/${requestId}...`);
        const response = await axios.post(
            `${BASE_URL}/supervisor/approve-material/${requestId}`,
            {
                action: 'approve',
                approvedQuantity: 100,
                pickupLocation: 'Site storage area',
                pickupInstructions: 'Contact site supervisor',
                remarks: 'Approved via API test'
            },
            {
                headers: { Authorization: `Bearer ${supervisorToken}` }
            }
        );
        
        console.log('✅ Material request approved successfully');
        console.log(`   Response:`, response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to approve material request:', error.response?.data || error.message);
        return null;
    }
}

async function testGetPendingToolRequests() {
    try {
        console.log('\n🔧 Testing GET /supervisor/pending-tool-requests...');
        const response = await axios.get(`${BASE_URL}/supervisor/pending-tool-requests`, {
            headers: { Authorization: `Bearer ${supervisorToken}` }
        });
        
        console.log('✅ Pending tool requests retrieved successfully');
        console.log(`   Count: ${response.data.count}`);
        console.log(`   Requests:`, JSON.stringify(response.data.requests?.slice(0, 2), null, 2));
        return response.data;
    } catch (error) {
        console.error('❌ Failed to get pending tool requests:', error.response?.data || error.message);
        return null;
    }
}

async function testApproveToolRequest(requestId) {
    try {
        console.log(`\n✅ Testing POST /supervisor/approve-tool/${requestId}...`);
        const response = await axios.post(
            `${BASE_URL}/supervisor/approve-tool/${requestId}`,
            {
                action: 'approve',
                approvedQuantity: 5,
                pickupLocation: 'Tool storage area',
                pickupInstructions: 'Contact site supervisor for tool collection',
                remarks: 'Approved via API test'
            },
            {
                headers: { Authorization: `Bearer ${supervisorToken}` }
            }
        );
        
        console.log('✅ Tool request approved successfully');
        console.log(`   Response:`, response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to approve tool request:', error.response?.data || error.message);
        return null;
    }
}

async function testEscalateIssue(issueId) {
    try {
        console.log(`\n📢 Testing POST /supervisor/escalate-issue/${issueId}...`);
        const response = await axios.post(
            `${BASE_URL}/supervisor/escalate-issue/${issueId}`,
            {
                escalationReason: 'Critical safety concern requiring immediate management attention',
                urgency: 'critical',
                additionalNotes: 'This issue needs urgent resolution from management'
            },
            {
                headers: { Authorization: `Bearer ${supervisorToken}` }
            }
        );
        
        console.log('✅ Issue escalated successfully');
        console.log(`   Response:`, response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to escalate issue:', error.response?.data || error.message);
        return null;
    }
}

async function runAllTests() {
    console.log('========================================');
    console.log('🧪 SUPERVISOR REQUESTS & APPROVALS API TESTS');
    console.log('========================================');

    // Step 1: Login
    const loginSuccess = await loginAsSupervisor();
    if (!loginSuccess) {
        console.log('\n❌ Cannot proceed without authentication');
        return;
    }

    // Step 2: Test Leave Requests
    const leaveRequests = await testGetPendingLeaveRequests();
    if (leaveRequests && leaveRequests.requests && leaveRequests.requests.length > 0) {
        await testApproveLeaveRequest(leaveRequests.requests[0].id);
    } else {
        console.log('⚠️  No pending leave requests to test approval');
    }

    // Step 3: Test Advance Requests
    const advanceRequests = await testGetPendingAdvanceRequests();
    if (advanceRequests && advanceRequests.requests && advanceRequests.requests.length > 0) {
        await testApproveAdvanceRequest(advanceRequests.requests[0].id);
    } else {
        console.log('⚠️  No pending advance requests to test approval');
    }

    // Step 4: Test Material Requests
    const materialRequests = await testGetPendingMaterialRequests();
    if (materialRequests && materialRequests.requests && materialRequests.requests.length > 0) {
        await testApproveMaterialRequest(materialRequests.requests[0].id);
    } else {
        console.log('⚠️  No pending material requests to test approval');
    }

    // Step 5: Test Tool Requests
    const toolRequests = await testGetPendingToolRequests();
    if (toolRequests && toolRequests.requests && toolRequests.requests.length > 0) {
        await testApproveToolRequest(toolRequests.requests[0].id);
    } else {
        console.log('⚠️  No pending tool requests to test approval');
    }

    // Step 6: Test Issue Escalation (using a sample issue ID)
    // Note: You'll need to have a valid daily progress ID with issues
    await testEscalateIssue(1); // Replace with actual daily progress ID

    console.log('\n========================================');
    console.log('✅ ALL TESTS COMPLETED');
    console.log('========================================');
}

// Run the tests
runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});
