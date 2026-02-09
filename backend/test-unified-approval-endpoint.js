import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5002';

/**
 * Test the unified approval processing endpoint
 */
async function testUnifiedApprovalEndpoint() {
    console.log('🧪 Testing Unified Approval Processing Endpoint\n');
    console.log('='.repeat(60));

    try {
        // Step 1: Login as supervisor
        console.log('\n📝 Step 1: Login as Supervisor');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'supervisor4@example.com',
            password: 'password123'
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const token = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log(`   Token: ${token.substring(0, 20)}...`);

        // Step 2: Get pending approvals
        console.log('\n📝 Step 2: Get Pending Approvals');
        const approvalsResponse = await axios.get(
            `${BASE_URL}/api/supervisor/approvals/pending`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (!approvalsResponse.data.success) {
            console.error('❌ Failed to get approvals:', approvalsResponse.data.message);
            return;
        }

        const approvals = approvalsResponse.data.data?.approvals || [];
        console.log(`✅ Found ${approvals.length} pending approvals`);

        if (approvals.length === 0) {
            console.log('\n⚠️  No pending approvals to test with');
            console.log('   Run setup-approvals-test-data.js first to create test data');
            return;
        }

        // Display first approval
        const firstApproval = approvals[0];
        console.log('\n📋 First Approval:');
        console.log(`   ID: ${firstApproval.id}`);
        console.log(`   Type: ${firstApproval.requestType}`);
        console.log(`   Requester: ${firstApproval.requesterName}`);
        console.log(`   Urgency: ${firstApproval.urgency || 'normal'}`);

        // Step 3: Get approval details
        console.log('\n📝 Step 3: Get Approval Details');
        const detailsResponse = await axios.get(
            `${BASE_URL}/api/supervisor/approvals/${firstApproval.id}/details`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (detailsResponse.data.success) {
            console.log('✅ Approval details retrieved');
            console.log(`   Request Type: ${detailsResponse.data.data.requestType}`);
            console.log(`   Status: ${detailsResponse.data.data.status}`);
            console.log(`   Requester: ${detailsResponse.data.data.requesterInfo.name}`);
        }

        // Step 4: Process approval (approve)
        console.log('\n📝 Step 4: Process Approval (Approve)');
        const processResponse = await axios.post(
            `${BASE_URL}/api/supervisor/approvals/${firstApproval.id}/process`,
            {
                action: 'approve',
                notes: 'Approved via unified endpoint test'
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (processResponse.data.success) {
            console.log('✅ Approval processed successfully');
            console.log(`   Approval ID: ${processResponse.data.data.approvalId}`);
            console.log(`   Status: ${processResponse.data.data.status}`);
            console.log(`   Message: ${processResponse.data.data.message}`);
            console.log(`   Next Steps: ${processResponse.data.data.nextSteps}`);
        } else {
            console.error('❌ Failed to process approval:', processResponse.data.message);
        }

        // Step 5: Test batch processing (if more approvals exist)
        if (approvals.length > 1) {
            console.log('\n📝 Step 5: Test Batch Processing');
            const batchDecisions = approvals.slice(1, 3).map(approval => ({
                approvalId: approval.id,
                action: 'approve',
                notes: 'Batch approved via test'
            }));

            const batchResponse = await axios.post(
                `${BASE_URL}/api/supervisor/approvals/batch-process`,
                { decisions: batchDecisions },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (batchResponse.data.success) {
                console.log('✅ Batch processing successful');
                console.log(`   Processed: ${batchResponse.data.data.processed}`);
                console.log(`   Successful: ${batchResponse.data.data.successful}`);
                console.log(`   Failed: ${batchResponse.data.data.failed}`);
            }
        }

        // Step 6: Get approval history
        console.log('\n📝 Step 6: Get Approval History');
        const historyResponse = await axios.get(
            `${BASE_URL}/api/supervisor/approvals/history?limit=5`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (historyResponse.data.success) {
            const history = historyResponse.data.data.approvals;
            console.log(`✅ Retrieved ${history.length} historical approvals`);
            if (history.length > 0) {
                console.log('\n   Recent approvals:');
                history.slice(0, 3).forEach(item => {
                    console.log(`   - ${item.requestType}: ${item.requesterName} (${item.status})`);
                });
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests completed successfully!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Test failed with error:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
            console.error(`   Data:`, error.response.data);
        } else {
            console.error(`   ${error.message}`);
        }
    }
}

// Run the test
testUnifiedApprovalEndpoint();
