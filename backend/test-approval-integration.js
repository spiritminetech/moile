import mongoose from 'mongoose';
import appConfig from './src/config/app.config.js';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';
import LeaveApproval from './src/modules/leaveRequest/models/LeaveApproval.js';
import Employee from './src/modules/employee/Employee.js';
import { approveLeaveRequest, rejectLeaveRequest } from './src/modules/leaveRequest/leaveRequestController.js';

/**
 * Integration test for approval status notifications with leave request workflow
 */

async function testLeaveRequestIntegration() {
  try {
    console.log('🧪 Testing Leave Request Integration with Approval Notifications...\n');

    // Connect to database
    await mongoose.connect(appConfig.database.uri, { 
      dbName: appConfig.database.name,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Test data
    const testWorkerId = 10;
    const testSupervisorId = 11;
    const testLeaveRequestId = Date.now();

    // Ensure test employees exist
    await ensureTestEmployees(testWorkerId, testSupervisorId);

    // Create test leave request
    const leaveRequest = await LeaveRequest.create({
      id: testLeaveRequestId,
      companyId: 1,
      employeeId: testWorkerId,
      leaveType: 'ANNUAL',
      fromDate: new Date('2024-03-15'),
      toDate: new Date('2024-03-17'),
      reason: 'Family vacation',
      status: 'PENDING',
      createdBy: testWorkerId
    });

    // Create leave approval record
    await LeaveApproval.create({
      leaveRequestId: testLeaveRequestId,
      approverRole: 'SUPERVISOR',
      action: 'PENDING'
    });

    console.log(`📝 Created test leave request (ID: ${testLeaveRequestId})`);

    // Test approval workflow
    console.log('\n🟢 Testing leave request approval workflow...');
    
    // Mock request and response objects
    const mockReq = {
      params: { id: testLeaveRequestId.toString() },
      user: { id: testSupervisorId }
    };

    const mockRes = {
      json: (data) => {
        console.log('  📤 Response:', data);
        return mockRes;
      },
      status: (code) => {
        console.log('  📊 Status Code:', code);
        return mockRes;
      }
    };

    try {
      await approveLeaveRequest(mockReq, mockRes);
      console.log('  ✅ Leave request approval completed successfully');
    } catch (error) {
      console.error('  ❌ Leave request approval failed:', error.message);
    }

    // Verify the leave request was updated
    const updatedLeaveRequest = await LeaveRequest.findOne({ id: testLeaveRequestId });
    console.log(`  📋 Leave request status: ${updatedLeaveRequest.status}`);

    // Test rejection workflow with a new leave request
    const testLeaveRequestId2 = Date.now() + 1;
    
    const leaveRequest2 = await LeaveRequest.create({
      id: testLeaveRequestId2,
      companyId: 1,
      employeeId: testWorkerId,
      leaveType: 'MEDICAL',
      fromDate: new Date('2024-03-20'),
      toDate: new Date('2024-03-22'),
      reason: 'Medical treatment',
      status: 'PENDING',
      createdBy: testWorkerId
    });

    await LeaveApproval.create({
      leaveRequestId: testLeaveRequestId2,
      approverRole: 'SUPERVISOR',
      action: 'PENDING'
    });

    console.log('\n🔴 Testing leave request rejection workflow...');
    
    const mockReq2 = {
      params: { id: testLeaveRequestId2.toString() },
      body: { remarks: 'Insufficient medical documentation' },
      user: { id: testSupervisorId }
    };

    try {
      await rejectLeaveRequest(mockReq2, mockRes);
      console.log('  ✅ Leave request rejection completed successfully');
    } catch (error) {
      console.error('  ❌ Leave request rejection failed:', error.message);
    }

    // Verify the leave request was updated
    const updatedLeaveRequest2 = await LeaveRequest.findOne({ id: testLeaveRequestId2 });
    console.log(`  📋 Leave request status: ${updatedLeaveRequest2.status}`);

    // Clean up
    await LeaveRequest.deleteMany({ id: { $in: [testLeaveRequestId, testLeaveRequestId2] } });
    await LeaveApproval.deleteMany({ leaveRequestId: { $in: [testLeaveRequestId, testLeaveRequestId2] } });

    console.log('\n✅ Leave request integration test completed successfully!');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
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
      fullName: 'Integration Test Worker',
      email: 'integration.worker@test.com',
      phone: '+65 9111 1111',
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
      fullName: 'Integration Test Supervisor',
      email: 'integration.supervisor@test.com',
      phone: '+65 9222 2222',
      role: 'SUPERVISOR'
    });
    console.log(`👨‍💼 Created test supervisor (ID: ${supervisorId})`);
  }
}

// Run the integration test
testLeaveRequestIntegration();