import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Test script for unified worker request APIs
 */

async function testWorkerRequestAPIs() {
    console.log('🧪 Testing Unified Worker Request APIs...\n');

    try {
        // Step 1: Login to get auth token
        console.log('1️⃣ Logging in to get auth token...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'worker@example.com',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful\n');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Step 2: Test Leave Request Submission
        console.log('2️⃣ Testing leave request submission...');
        const leaveRequestData = {
            leaveType: 'SICK',
            fromDate: '2024-02-15',
            toDate: '2024-02-17',
            reason: 'Medical appointment and recovery'
        };

        const leaveResponse = await axios.post(
            `${API_BASE_URL}/worker/requests/leave`,
            leaveRequestData,
            { headers }
        );

        console.log('✅ Leave request submitted:', leaveResponse.data);
        const leaveRequestId = leaveResponse.data.requestId;

        // Step 3: Test Material Request Submission
        console.log('\n3️⃣ Testing material request submission...');
        const materialRequestData = {
            projectId: 1,
            itemName: 'Steel bars',
            itemCategory: 'construction',
            quantity: 50,
            unit: 'pieces',
            urgency: 'HIGH',
            requiredDate: '2024-02-20',
            purpose: 'Foundation work',
            justification: 'Required for Phase 2 construction',
            specifications: 'Grade 60 steel, 12mm diameter',
            estimatedCost: 5000
        };

        const materialResponse = await axios.post(
            `${API_BASE_URL}/worker/requests/material`,
            materialRequestData,
            { headers }
        );

        console.log('✅ Material request submitted:', materialResponse.data);
        const materialRequestId = materialResponse.data.requestId;

        // Step 4: Test Tool Request Submission
        console.log('\n4️⃣ Testing tool request submission...');
        const toolRequestData = {
            projectId: 1,
            itemName: 'Power drill',
            itemCategory: 'tool',
            quantity: 2,
            unit: 'pieces',
            urgency: 'NORMAL',
            requiredDate: '2024-02-18',
            purpose: 'Drilling holes for electrical installation',
            justification: 'Current drill is broken',
            specifications: 'Cordless, 18V, with drill bits set'
        };

        const toolResponse = await axios.post(
            `${API_BASE_URL}/worker/requests/tool`,
            toolRequestData,
            { headers }
        );

        console.log('✅ Tool request submitted:', toolResponse.data);
        const toolRequestId = toolResponse.data.requestId;

        // Step 5: Test Reimbursement Request Submission
        console.log('\n5️⃣ Testing reimbursement request submission...');
        const reimbursementRequestData = {
            amount: 150.75,
            currency: 'USD',
            description: 'Travel expenses for client meeting',
            category: 'TRAVEL',
            urgency: 'NORMAL',
            requiredDate: '2024-02-25',
            justification: 'Required for project coordination meeting'
        };

        const reimbursementResponse = await axios.post(
            `${API_BASE_URL}/worker/requests/reimbursement`,
            reimbursementRequestData,
            { headers }
        );

        console.log('✅ Reimbursement request submitted:', reimbursementResponse.data);
        const reimbursementRequestId = reimbursementResponse.data.requestId;

        // Step 6: Test Advance Payment Request Submission
        console.log('\n6️⃣ Testing advance payment request submission...');
        const advancePaymentRequestData = {
            amount: 1000.00,
            currency: 'USD',
            description: 'Advance payment for equipment purchase',
            category: 'ADVANCE',
            urgency: 'HIGH',
            requiredDate: '2024-02-22',
            justification: 'Need to purchase equipment before supplier price increase'
        };

        const advancePaymentResponse = await axios.post(
            `${API_BASE_URL}/worker/requests/advance-payment`,
            advancePaymentRequestData,
            { headers }
        );

        console.log('✅ Advance payment request submitted:', advancePaymentResponse.data);
        const advancePaymentRequestId = advancePaymentResponse.data.requestId;

        // Step 7: Test File Upload to Request
        console.log('\n7️⃣ Testing file upload to request...');
        
        // Create a test file
        const testFilePath = path.join(__dirname, 'test-attachment.txt');
        fs.writeFileSync(testFilePath, 'This is a test attachment for the request.');

        const formData = new FormData();
        formData.append('requestType', 'reimbursement');
        formData.append('attachments', fs.createReadStream(testFilePath));

        const uploadResponse = await axios.post(
            `${API_BASE_URL}/worker/requests/${reimbursementRequestId}/attachments`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...formData.getHeaders()
                }
            }
        );

        console.log('✅ File uploaded to request:', uploadResponse.data);

        // Clean up test file
        fs.unlinkSync(testFilePath);

        // Step 8: Test Get All Requests
        console.log('\n8️⃣ Testing get all requests...');
        const allRequestsResponse = await axios.get(
            `${API_BASE_URL}/worker/requests`,
            { headers }
        );

        console.log('✅ All requests retrieved:', {
            total: allRequestsResponse.data.total,
            count: allRequestsResponse.data.requests.length,
            types: allRequestsResponse.data.requests.map(r => r.requestType)
        });

        // Step 9: Test Get Requests with Filtering
        console.log('\n9️⃣ Testing get requests with filtering...');
        const filteredRequestsResponse = await axios.get(
            `${API_BASE_URL}/worker/requests?type=leave&status=pending&limit=10`,
            { headers }
        );

        console.log('✅ Filtered requests retrieved:', {
            total: filteredRequestsResponse.data.total,
            count: filteredRequestsResponse.data.requests.length
        });

        // Step 10: Test Get Specific Request
        console.log('\n🔟 Testing get specific request...');
        const specificRequestResponse = await axios.get(
            `${API_BASE_URL}/worker/requests/${materialRequestId}`,
            { headers }
        );

        console.log('✅ Specific request retrieved:', {
            id: specificRequestResponse.data.id,
            requestType: specificRequestResponse.data.requestType,
            status: specificRequestResponse.data.status
        });

        // Step 11: Test Cancel Request
        console.log('\n1️⃣1️⃣ Testing cancel request...');
        const cancelResponse = await axios.post(
            `${API_BASE_URL}/worker/requests/${toolRequestId}/cancel`,
            { reason: 'No longer needed' },
            { headers }
        );

        console.log('✅ Request cancelled:', cancelResponse.data);

        // Step 12: Verify Cancelled Request
        console.log('\n1️⃣2️⃣ Verifying cancelled request...');
        const cancelledRequestResponse = await axios.get(
            `${API_BASE_URL}/worker/requests/${toolRequestId}`,
            { headers }
        );

        console.log('✅ Cancelled request verified:', {
            id: cancelledRequestResponse.data.id,
            status: cancelledRequestResponse.data.status,
            cancelReason: cancelledRequestResponse.data.cancelReason
        });

        console.log('\n🎉 All unified worker request API tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
        }
    }
}

// Run the test
testWorkerRequestAPIs();