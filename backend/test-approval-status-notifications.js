import mongoose from 'mongoose';
import appConfig from './src/config/app.config.js';
import ApprovalStatusNotificationService from './src/modules/notification/services/ApprovalStatusNotificationService.js';
import Employee from './src/modules/employee/Employee.js';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';

/**
 * Test script for Approval Status Notification Service
 * Tests all four approval types: leave requests, payment requests, medical claims, material requests
 */

async function testApprovalStatusNotifications() {
  try {
    console.log('🧪 Testing Approval Status Notification Service...\n');

    // Connect to database
    await mongoose.connect(appConfig.database.uri, { 
      dbName: appConfig.database.name,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Test data
    const testWorkerId = 1;
    const testSupervisorId = 2;
    const testLeaveRequestId = Date.now();
    const testPaymentRequestId = Date.now() + 1;
    const testMedicalClaimId = Date.now() + 2;
    const testMaterialRequestId = Date.now() + 3;

    // Ensure test employees exist
    await ensureTestEmployees(testWorkerId, testSupervisorId);

    console.log('📋 Testing Leave Request Notifications...');
    await testLeaveRequestNotifications(testLeaveRequestId, testWorkerId, testSupervisorId);

    console.log('\n💰 Testing Payment Request Notifications...');
    await testPaymentRequestNotifications(testPaymentRequestId, testWorkerId, testSupervisorId);

    console.log('\n🏥 Testing Medical Claim Notifications...');
    await testMedicalClaimNotifications(testMedicalClaimId, testWorkerId, testSupervisorId);

    console.log('\n🔧 Testing Material Request Notifications...');
    await testMaterialRequestNotifications(testMaterialRequestId, testWorkerId, testSupervisorId);

    console.log('\n✅ All approval status notification tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

async function ensureTestEmployees(workerId, supervisorId) {
  // Create test worker if doesn't exist
  const existingWorker = await Employee.findOne({ id: workerId });
  if (!existingWorker) {
    await Employee.create({
      id: workerId,
      userId: workerId,
      companyId: 1,
      fullName: 'Test Worker',
      email: 'worker@test.com',
      phone: '+65 9123 4567',
      role: 'WORKER'
    });
    console.log(`👷 Created test worker (ID: ${workerId})`);
  }

  // Create test supervisor if doesn't exist
  const existingSupervisor = await Employee.findOne({ id: supervisorId });
  if (!existingSupervisor) {
    await Employee.create({
      id: supervisorId,
      userId: supervisorId,
      companyId: 1,
      fullName: 'Test Supervisor',
      email: 'supervisor@test.com',
      phone: '+65 9876 5432',
      role: 'SUPERVISOR'
    });
    console.log(`👨‍💼 Created test supervisor (ID: ${supervisorId})`);
  }
}

async function testLeaveRequestNotifications(leaveRequestId, workerId, supervisorId) {
  try {
    // Create test leave request
    const leaveRequest = await LeaveRequest.create({
      id: leaveRequestId,
      companyId: 1,
      employeeId: workerId,
      leaveType: 'ANNUAL',
      fromDate: new Date('2024-02-15'),
      toDate: new Date('2024-02-17'),
      reason: 'Family vacation',
      status: 'PENDING',
      createdBy: workerId
    });

    // Test approval notification
    console.log('  📝 Testing leave request approval notification...');
    const approvalResult = await ApprovalStatusNotificationService.notifyLeaveRequestStatus(
      leaveRequestId,
      'APPROVED',
      supervisorId
    );
    console.log('  ✅ Leave approval notification:', approvalResult.success ? 'SUCCESS' : 'FAILED');

    // Test rejection notification
    console.log('  📝 Testing leave request rejection notification...');
    const rejectionResult = await ApprovalStatusNotificationService.notifyLeaveRequestStatus(
      leaveRequestId,
      'REJECTED',
      supervisorId,
      'Insufficient leave balance'
    );
    console.log('  ✅ Leave rejection notification:', rejectionResult.success ? 'SUCCESS' : 'FAILED');

    // Clean up
    await LeaveRequest.deleteOne({ id: leaveRequestId });

  } catch (error) {
    console.error('  ❌ Leave request notification test failed:', error.message);
  }
}

async function testPaymentRequestNotifications(paymentRequestId, workerId, supervisorId) {
  try {
    const paymentDetails = {
      employeeId: workerId,
      amount: 500,
      currency: 'SGD',
      requestType: 'ADVANCE_PAYMENT'
    };

    // Test approval notification
    console.log('  📝 Testing payment request approval notification...');
    const approvalResult = await ApprovalStatusNotificationService.notifyPaymentRequestStatus(
      paymentRequestId,
      'APPROVED',
      supervisorId,
      paymentDetails
    );
    console.log('  ✅ Payment approval notification:', approvalResult.success ? 'SUCCESS' : 'FAILED');

    // Test rejection notification
    console.log('  📝 Testing payment request rejection notification...');
    const rejectionResult = await ApprovalStatusNotificationService.notifyPaymentRequestStatus(
      paymentRequestId,
      'REJECTED',
      supervisorId,
      paymentDetails,
      'Exceeds monthly advance limit'
    );
    console.log('  ✅ Payment rejection notification:', rejectionResult.success ? 'SUCCESS' : 'FAILED');

  } catch (error) {
    console.error('  ❌ Payment request notification test failed:', error.message);
  }
}

async function testMedicalClaimNotifications(claimId, workerId, supervisorId) {
  try {
    const claimDetails = {
      employeeId: workerId,
      claimAmount: 150,
      currency: 'SGD',
      claimType: 'MEDICAL_REIMBURSEMENT',
      treatmentDate: new Date('2024-02-10')
    };

    // Test approval notification
    console.log('  📝 Testing medical claim approval notification...');
    const approvalResult = await ApprovalStatusNotificationService.notifyMedicalClaimStatus(
      claimId,
      'APPROVED',
      supervisorId,
      claimDetails
    );
    console.log('  ✅ Medical claim approval notification:', approvalResult.success ? 'SUCCESS' : 'FAILED');

    // Test rejection notification
    console.log('  📝 Testing medical claim rejection notification...');
    const rejectionResult = await ApprovalStatusNotificationService.notifyMedicalClaimStatus(
      claimId,
      'REJECTED',
      supervisorId,
      claimDetails,
      'Missing original receipts'
    );
    console.log('  ✅ Medical claim rejection notification:', rejectionResult.success ? 'SUCCESS' : 'FAILED');

  } catch (error) {
    console.error('  ❌ Medical claim notification test failed:', error.message);
  }
}

async function testMaterialRequestNotifications(requestId, workerId, supervisorId) {
  try {
    const requestDetails = {
      employeeId: workerId,
      requestType: 'MATERIAL',
      itemName: 'Steel Rebar 12mm',
      quantity: 50,
      unit: 'pieces',
      projectId: 1,
      pickupLocation: 'Site Storage Area A',
      pickupInstructions: 'Contact John at ext. 123'
    };

    // Test approval notification
    console.log('  📝 Testing material request approval notification...');
    const approvalResult = await ApprovalStatusNotificationService.notifyMaterialRequestStatus(
      requestId,
      'APPROVED',
      supervisorId,
      requestDetails
    );
    console.log('  ✅ Material request approval notification:', approvalResult.success ? 'SUCCESS' : 'FAILED');

    // Test rejection notification
    console.log('  📝 Testing material request rejection notification...');
    const rejectionResult = await ApprovalStatusNotificationService.notifyMaterialRequestStatus(
      requestId,
      'REJECTED',
      supervisorId,
      requestDetails,
      'Item not available in current inventory'
    );
    console.log('  ✅ Material request rejection notification:', rejectionResult.success ? 'SUCCESS' : 'FAILED');

    // Test tool request
    const toolRequestDetails = {
      ...requestDetails,
      requestType: 'TOOL',
      itemName: 'Power Drill',
      quantity: 2
    };

    console.log('  📝 Testing tool request approval notification...');
    const toolApprovalResult = await ApprovalStatusNotificationService.notifyMaterialRequestStatus(
      requestId + 1,
      'APPROVED',
      supervisorId,
      toolRequestDetails
    );
    console.log('  ✅ Tool request approval notification:', toolApprovalResult.success ? 'SUCCESS' : 'FAILED');

  } catch (error) {
    console.error('  ❌ Material request notification test failed:', error.message);
  }
}

async function testBatchNotifications() {
  try {
    console.log('\n📦 Testing batch approval notifications...');

    const batchNotifications = [
      {
        approvalType: 'LEAVE_REQUEST',
        requestId: Date.now() + 10,
        status: 'APPROVED',
        approverId: 2
      },
      {
        approvalType: 'PAYMENT_REQUEST',
        requestId: Date.now() + 11,
        status: 'REJECTED',
        approverId: 2,
        paymentDetails: {
          employeeId: 1,
          amount: 1000,
          currency: 'SGD',
          requestType: 'ADVANCE_PAYMENT'
        },
        remarks: 'Amount too high'
      }
    ];

    const batchResult = await ApprovalStatusNotificationService.batchNotifyApprovalStatus(batchNotifications);
    console.log('  ✅ Batch notifications processed:', batchResult.length);
    
    const successCount = batchResult.filter(r => r.success).length;
    console.log(`  📊 Success rate: ${successCount}/${batchResult.length}`);

  } catch (error) {
    console.error('  ❌ Batch notification test failed:', error.message);
  }
}

// Run the tests
testApprovalStatusNotifications();