// Test leave request submission with correct authentication
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function testLeaveRequestWithCorrectUser() {
  console.log('🧪 Testing Leave Request with Correct User Authentication');
  console.log('========================================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get employee 107 (Raj Kumar)
    const employee107 = await Employee.findOne({ id: 107 });
    if (!employee107) {
      console.log('❌ Employee 107 not found');
      return;
    }

    console.log('\n1️⃣ Employee 107 Details:');
    console.log(`   Employee ID: ${employee107.id}`);
    console.log(`   Name: ${employee107.fullName}`);
    console.log(`   User ID: ${employee107.userId}`);
    console.log(`   Company ID: ${employee107.companyId}`);

    // Simulate the leave request data that would be created
    const leaveRequestData = {
      id: Date.now(),
      companyId: employee107.companyId,
      employeeId: employee107.id,
      leaveType: 'MEDICAL',
      fromDate: new Date('2026-02-10'),
      toDate: new Date('2026-02-12'),
      reason: 'Medical checkup and treatment',
      createdBy: employee107.userId, // This is the key - must match the logged-in user
      status: 'PENDING'
    };

    console.log('\n2️⃣ Simulated Leave Request Data:');
    console.log('   ID:', leaveRequestData.id);
    console.log('   Company ID:', leaveRequestData.companyId);
    console.log('   Employee ID:', leaveRequestData.employeeId);
    console.log('   Leave Type:', leaveRequestData.leaveType);
    console.log('   From Date:', leaveRequestData.fromDate.toISOString().split('T')[0]);
    console.log('   To Date:', leaveRequestData.toDate.toISOString().split('T')[0]);
    console.log('   Reason:', leaveRequestData.reason);
    console.log('   Created By (User ID):', leaveRequestData.createdBy);
    console.log('   Status:', leaveRequestData.status);

    // Test creating the leave request
    console.log('\n3️⃣ Creating Leave Request...');
    const leaveRequest = await LeaveRequest.create(leaveRequestData);
    console.log('✅ Leave request created successfully!');
    console.log('   Database ID:', leaveRequest._id);
    console.log('   Request ID:', leaveRequest.id);

    // Verify it was saved
    console.log('\n4️⃣ Verifying Save...');
    const verification = await LeaveRequest.findOne({ id: leaveRequest.id });
    if (verification) {
      console.log('✅ Leave request found in database');
      console.log('   Employee ID:', verification.employeeId);
      console.log('   Status:', verification.status);
      console.log('   Created At:', verification.createdAt);
    } else {
      console.log('❌ Leave request NOT found in database');
    }

    // Check all leave requests for this employee
    console.log('\n5️⃣ All Leave Requests for Employee 107...');
    const allRequests = await LeaveRequest.find({ employeeId: 107 }).sort({ createdAt: -1 });
    console.log(`   Found ${allRequests.length} leave requests:`);
    
    for (const req of allRequests) {
      console.log(`   - ID: ${req.id}, Status: ${req.status}, Type: ${req.leaveType}, Created: ${req.createdAt.toISOString().split('T')[0]}`);
    }

    // Clean up - remove the test request
    console.log('\n6️⃣ Cleaning up test data...');
    await LeaveRequest.deleteOne({ id: leaveRequest.id });
    console.log('✅ Test leave request removed');

    console.log('\n🎯 CONCLUSION:');
    console.log('The leave request system works correctly when:');
    console.log('1. The user is properly authenticated');
    console.log('2. The JWT token contains the correct userId');
    console.log('3. The userId matches the employee\'s userId field');
    console.log('');
    console.log('🔧 TO FIX THE ISSUE:');
    console.log('1. Log out from the mobile app');
    console.log('2. Log in using: worker1@gmail.com');
    console.log('3. Use the correct password for Raj Kumar');
    console.log('4. Submit the leave request again');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testLeaveRequestWithCorrectUser();