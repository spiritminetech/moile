// Test script for Request Management APIs
// Tests all 9 request API endpoints according to specification

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'test-jwt-token'; // Replace with actual token

// Test data
const testData = {
  projectId: 123,
  employeeId: 456,
  companyId: 1
};

// Helper function to make authenticated requests
const apiRequest = async (method, endpoint, data = null, isFormData = false) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...(isFormData ? {} : { 'Content-Type': 'application/json' })
      }
    };

    if (data) {
      if (isFormData) {
        config.data = data;
        config.headers = { ...config.headers, ...data.getHeaders() };
      } else {
        config.data = data;
      }
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Create a test file for attachments
const createTestFile = () => {
  const testContent = 'This is a test file for request attachments';
  const fileName = 'test-attachment.txt';
  fs.writeFileSync(fileName, testContent);
  return fileName;
};

// Test functions
const testLeaveRequest = async () => {
  console.log('\n=== Testing Leave Request API ===');
  
  const formData = new FormData();
  formData.append('leaveType', 'ANNUAL');
  formData.append('fromDate', '2024-02-01T00:00:00.000Z');
  formData.append('toDate', '2024-02-05T00:00:00.000Z');
  formData.append('reason', 'Personal vacation');
  
  // Add test attachment
  const testFile = createTestFile();
  formData.append('attachments', fs.createReadStream(testFile));
  
  const result = await apiRequest('POST', '/worker/requests/leave', formData, true);
  
  console.log('Leave Request Result:', JSON.stringify(result, null, 2));
  
  // Cleanup
  fs.unlinkSync(testFile);
  
  return result.success ? result.data.requestId : null;
};

const testMaterialRequest = async () => {
  console.log('\n=== Testing Material Request API ===');
  
  const formData = new FormData();
  formData.append('projectId', testData.projectId.toString());
  formData.append('itemName', 'Portland Cement');
  formData.append('itemCategory', 'concrete');
  formData.append('quantity', '50');
  formData.append('unit', 'bags');
  formData.append('urgency', 'NORMAL');
  formData.append('requiredDate', '2024-02-10T00:00:00.000Z');
  formData.append('purpose', 'Foundation work for Building A');
  formData.append('justification', 'Required for scheduled concrete pour');
  formData.append('specifications', 'Grade 42.5 Portland cement');
  formData.append('estimatedCost', '2500.00');
  
  const result = await apiRequest('POST', '/worker/requests/material', formData, true);
  
  console.log('Material Request Result:', JSON.stringify(result, null, 2));
  
  return result.success ? result.data.requestId : null;
};

const testToolRequest = async () => {
  console.log('\n=== Testing Tool Request API ===');
  
  const formData = new FormData();
  formData.append('projectId', testData.projectId.toString());
  formData.append('itemName', 'Concrete Mixer');
  formData.append('itemCategory', 'power_tools');
  formData.append('quantity', '2');
  formData.append('unit', 'pieces');
  formData.append('urgency', 'HIGH');
  formData.append('requiredDate', '2024-02-08T00:00:00.000Z');
  formData.append('purpose', 'Concrete mixing for foundation');
  formData.append('justification', 'Current mixer is under maintenance');
  formData.append('specifications', '350L capacity, electric motor');
  formData.append('estimatedCost', '800.00');
  
  const result = await apiRequest('POST', '/worker/requests/tool', formData, true);
  
  console.log('Tool Request Result:', JSON.stringify(result, null, 2));
  
  return result.success ? result.data.requestId : null;
};

const testReimbursementRequest = async () => {
  console.log('\n=== Testing Reimbursement Request API ===');
  
  const formData = new FormData();
  formData.append('amount', '150.75');
  formData.append('currency', 'USD');
  formData.append('description', 'Transportation expenses for site visit');
  formData.append('category', 'TRANSPORT');
  formData.append('urgency', 'NORMAL');
  formData.append('requiredDate', '2024-02-15T00:00:00.000Z');
  formData.append('justification', 'Taxi fare for emergency site inspection');
  
  // Add receipt attachment
  const testFile = createTestFile();
  formData.append('attachments', fs.createReadStream(testFile));
  
  const result = await apiRequest('POST', '/worker/requests/reimbursement', formData, true);
  
  console.log('Reimbursement Request Result:', JSON.stringify(result, null, 2));
  
  // Cleanup
  fs.unlinkSync(testFile);
  
  return result.success ? result.data.requestId : null;
};

const testAdvancePaymentRequest = async () => {
  console.log('\n=== Testing Advance Payment Request API ===');
  
  const formData = new FormData();
  formData.append('amount', '1000.00');
  formData.append('currency', 'USD');
  formData.append('description', 'Advance payment for project materials');
  formData.append('category', 'ADVANCE');
  formData.append('urgency', 'HIGH');
  formData.append('requiredDate', '2024-02-12T00:00:00.000Z');
  formData.append('justification', 'Need advance to purchase materials before supplier delivery');
  
  const result = await apiRequest('POST', '/worker/requests/advance-payment', formData, true);
  
  console.log('Advance Payment Request Result:', JSON.stringify(result, null, 2));
  
  return result.success ? result.data.requestId : null;
};

const testUploadAttachments = async (requestId, requestType) => {
  if (!requestId) {
    console.log('\n=== Skipping Upload Attachments Test (no requestId) ===');
    return;
  }
  
  console.log('\n=== Testing Upload Request Attachments API ===');
  
  const formData = new FormData();
  formData.append('requestType', requestType);
  
  // Add multiple test files
  const testFile1 = createTestFile();
  const testFile2 = 'test-attachment-2.txt';
  fs.writeFileSync(testFile2, 'Second test attachment file');
  
  formData.append('attachments', fs.createReadStream(testFile1));
  formData.append('attachments', fs.createReadStream(testFile2));
  
  const result = await apiRequest('POST', `/worker/requests/${requestId}/attachments`, formData, true);
  
  console.log('Upload Attachments Result:', JSON.stringify(result, null, 2));
  
  // Cleanup
  fs.unlinkSync(testFile1);
  fs.unlinkSync(testFile2);
  
  return result.success;
};

const testGetRequests = async () => {
  console.log('\n=== Testing Get Requests API ===');
  
  // Test with no filters
  let result = await apiRequest('GET', '/worker/requests');
  console.log('Get All Requests Result:', JSON.stringify(result, null, 2));
  
  // Test with filters
  const params = new URLSearchParams({
    type: 'leave',
    status: 'PENDING',
    limit: '10',
    offset: '0'
  });
  
  result = await apiRequest('GET', `/worker/requests?${params}`);
  console.log('Get Filtered Requests Result:', JSON.stringify(result, null, 2));
  
  return result.success;
};

const testGetSpecificRequest = async (requestId) => {
  if (!requestId) {
    console.log('\n=== Skipping Get Specific Request Test (no requestId) ===');
    return;
  }
  
  console.log('\n=== Testing Get Specific Request API ===');
  
  const result = await apiRequest('GET', `/worker/requests/${requestId}`);
  
  console.log('Get Specific Request Result:', JSON.stringify(result, null, 2));
  
  return result.success;
};

const testCancelRequest = async (requestId) => {
  if (!requestId) {
    console.log('\n=== Skipping Cancel Request Test (no requestId) ===');
    return;
  }
  
  console.log('\n=== Testing Cancel Request API ===');
  
  const result = await apiRequest('POST', `/worker/requests/${requestId}/cancel`, {
    reason: 'No longer needed'
  });
  
  console.log('Cancel Request Result:', JSON.stringify(result, null, 2));
  
  return result.success;
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Request Management API Tests');
  console.log('Base URL:', BASE_URL);
  console.log('Test Token:', TEST_TOKEN);
  
  const results = {
    leaveRequest: false,
    materialRequest: false,
    toolRequest: false,
    reimbursementRequest: false,
    advancePaymentRequest: false,
    uploadAttachments: false,
    getRequests: false,
    getSpecificRequest: false,
    cancelRequest: false
  };
  
  let testRequestId = null;
  
  try {
    // Test all submission endpoints
    testRequestId = await testLeaveRequest();
    results.leaveRequest = !!testRequestId;
    
    const materialRequestId = await testMaterialRequest();
    results.materialRequest = !!materialRequestId;
    
    const toolRequestId = await testToolRequest();
    results.toolRequest = !!toolRequestId;
    
    const reimbursementRequestId = await testReimbursementRequest();
    results.reimbursementRequest = !!reimbursementRequestId;
    
    const advancePaymentRequestId = await testAdvancePaymentRequest();
    results.advancePaymentRequest = !!advancePaymentRequestId;
    
    // Test attachment upload (use first successful request)
    const requestIdForAttachment = testRequestId || materialRequestId || toolRequestId;
    if (requestIdForAttachment) {
      results.uploadAttachments = await testUploadAttachments(requestIdForAttachment, 'leave');
    }
    
    // Test retrieval endpoints
    results.getRequests = await testGetRequests();
    results.getSpecificRequest = await testGetSpecificRequest(testRequestId);
    
    // Test cancel endpoint (use a different request to avoid conflicts)
    results.cancelRequest = await testCancelRequest(materialRequestId);
    
  } catch (error) {
    console.error('Test execution error:', error);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${test.padEnd(25)} ${status}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log('='.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log('='.repeat(50));
  
  if (passedTests === totalTests) {
    console.log('🎉 All Request Management APIs are working correctly!');
  } else {
    console.log('⚠️  Some APIs need attention. Check the logs above for details.');
  }
};

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testLeaveRequest,
  testMaterialRequest,
  testToolRequest,
  testReimbursementRequest,
  testAdvancePaymentRequest,
  testUploadAttachments,
  testGetRequests,
  testGetSpecificRequest,
  testCancelRequest
};