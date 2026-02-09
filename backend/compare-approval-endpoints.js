import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5002';

async function compareApprovalEndpoints() {
    console.log('🔍 Comparing Approval Endpoints\n');
    console.log('='.repeat(70));

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

        // Step 2: Get dashboard data
        console.log('\n📝 Step 2: Get Dashboard Data');
        const dashboardResponse = await axios.get(
            `${BASE_URL}/api/supervisor/dashboard`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (!dashboardResponse.data.success) {
            console.error('❌ Dashboard failed:', dashboardResponse.data.message);
            return;
        }

        const dashboardApprovals = dashboardResponse.data.data.pendingApprovals;
        console.log('✅ Dashboard approvals:', JSON.stringify(dashboardApprovals, null, 2));

        // Step 3: Get pending approvals (detailed)
        console.log('\n📝 Step 3: Get Pending Approvals (Detailed)');
        const approvalsResponse = await axios.get(
            `${BASE_URL}/api/supervisor/approvals/pending`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (!approvalsResponse.data.success) {
            console.error('❌ Approvals failed:', approvalsResponse.data.message);
            return;
        }

        const approvalsData = approvalsResponse.data.data;
        console.log('✅ Approvals screen data:');
        console.log('   Summary:', JSON.stringify(approvalsData.summary, null, 2));
        console.log('   Total approvals in list:', approvalsData.approvals.length);

        // Step 4: Compare the results
        console.log('\n' + '='.repeat(70));
        console.log('📊 COMPARISON');
        console.log('='.repeat(70));

        console.log('\nDashboard Approval Queue:');
        console.log(`  Leave Requests:     ${dashboardApprovals.leaveRequests}`);
        console.log(`  Material Requests:  ${dashboardApprovals.materialRequests}`);
        console.log(`  Tool Requests:      ${dashboardApprovals.toolRequests}`);
        console.log(`  Urgent:             ${dashboardApprovals.urgent}`);
        console.log(`  TOTAL:              ${dashboardApprovals.total}`);

        console.log('\nApprovals Screen:');
        console.log(`  Leave:              ${approvalsData.summary.byType.leave}`);
        console.log(`  Advance Payment:    ${approvalsData.summary.byType.advance_payment}`);
        console.log(`  Material:           ${approvalsData.summary.byType.material}`);
        console.log(`  Tool:               ${approvalsData.summary.byType.tool}`);
        console.log(`  Reimbursement:      ${approvalsData.summary.byType.reimbursement}`);
        console.log(`  Urgent:             ${approvalsData.summary.urgentCount}`);
        console.log(`  TOTAL:              ${approvalsData.summary.totalPending}`);

        console.log('\n' + '='.repeat(70));
        console.log('DIFFERENCES:');
        console.log('='.repeat(70));

        const dashTotal = dashboardApprovals.total;
        const approvalsTotal = approvalsData.summary.totalPending;

        if (dashTotal === approvalsTotal) {
            console.log('✅ Totals MATCH!');
        } else {
            console.log(`❌ Totals DO NOT MATCH!`);
            console.log(`   Dashboard: ${dashTotal}`);
            console.log(`   Approvals: ${approvalsTotal}`);
            console.log(`   Difference: ${Math.abs(dashTotal - approvalsTotal)}`);
        }

        // Check individual categories
        console.log('\nCategory Breakdown:');
        
        const dashLeave = dashboardApprovals.leaveRequests;
        const approvalsLeave = approvalsData.summary.byType.leave + approvalsData.summary.byType.advance_payment;
        console.log(`  Leave + Advance: Dashboard=${dashLeave}, Approvals=${approvalsLeave} ${dashLeave === approvalsLeave ? '✅' : '❌'}`);
        
        const dashMaterial = dashboardApprovals.materialRequests;
        const approvalsMaterial = approvalsData.summary.byType.material;
        console.log(`  Material: Dashboard=${dashMaterial}, Approvals=${approvalsMaterial} ${dashMaterial === approvalsMaterial ? '✅' : '❌'}`);
        
        const dashTool = dashboardApprovals.toolRequests;
        const approvalsTool = approvalsData.summary.byType.tool;
        console.log(`  Tool: Dashboard=${dashTool}, Approvals=${approvalsTool} ${dashTool === approvalsTool ? '✅' : '❌'}`);

        // Show actual approval items
        if (approvalsData.approvals.length > 0) {
            console.log('\n' + '='.repeat(70));
            console.log('ACTUAL APPROVALS IN LIST:');
            console.log('='.repeat(70));
            approvalsData.approvals.forEach((approval, index) => {
                console.log(`\n${index + 1}. ${approval.requestType.toUpperCase()}`);
                console.log(`   ID: ${approval.id}`);
                console.log(`   Requester: ${approval.requesterName}`);
                console.log(`   Urgency: ${approval.urgency}`);
                console.log(`   Date: ${approval.requestDate}`);
            });
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

compareApprovalEndpoints();
