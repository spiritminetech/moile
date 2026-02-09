import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';
import PaymentRequest from './src/modules/leaveRequest/models/PaymentRequest.js';
import MaterialRequest from './src/modules/project/models/MaterialRequest.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkApprovalData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get employee IDs that should have requests
    const employees = await Employee.find({ 
      'currentProject.id': 1003 
    });
    const employeeIds = employees.map(e => e.id);
    
    console.log('Employees in project 1003:', employeeIds);
    console.log('Employee names:', employees.map(e => e.fullName));

    // Check leave requests
    console.log('\n' + '='.repeat(60));
    console.log('LEAVE REQUESTS');
    console.log('='.repeat(60));
    const leaveRequests = await LeaveRequest.find({ status: 'PENDING' });
    console.log(`Total pending: ${leaveRequests.length}`);
    leaveRequests.forEach(req => {
      const employee = employees.find(e => e.id === req.employeeId);
      console.log(`  - ID: ${req.id}, Employee: ${req.employeeId} (${employee?.fullName || 'NOT FOUND'})`);
      console.log(`    Type: ${req.leaveType}, From: ${req.fromDate}, To: ${req.toDate}`);
      console.log(`    In our employee list: ${employeeIds.includes(req.employeeId)}`);
    });

    // Check payment requests
    console.log('\n' + '='.repeat(60));
    console.log('PAYMENT REQUESTS');
    console.log('='.repeat(60));
    const paymentRequests = await PaymentRequest.find({ status: 'PENDING' });
    console.log(`Total pending: ${paymentRequests.length}`);
    paymentRequests.forEach(req => {
      const employee = employees.find(e => e.id === req.employeeId);
      console.log(`  - ID: ${req.id}, Employee: ${req.employeeId} (${employee?.fullName || 'NOT FOUND'})`);
      console.log(`    Type: ${req.requestType}, Amount: ${req.amount}`);
      console.log(`    In our employee list: ${employeeIds.includes(req.employeeId)}`);
    });

    // Check material requests
    console.log('\n' + '='.repeat(60));
    console.log('MATERIAL REQUESTS');
    console.log('='.repeat(60));
    const materialRequests = await MaterialRequest.find({ 
      projectId: 1003,
      requestType: 'MATERIAL',
      status: 'PENDING' 
    });
    console.log(`Total pending: ${materialRequests.length}`);
    materialRequests.forEach(req => {
      const employee = employees.find(e => e.id === req.employeeId);
      console.log(`  - ID: ${req.id}, Item: ${req.itemName}`);
      console.log(`    Employee: ${req.employeeId} (${employee?.fullName || 'NOT FOUND'})`);
      console.log(`    Quantity: ${req.quantity} ${req.unit}`);
    });

    // Check tool requests
    console.log('\n' + '='.repeat(60));
    console.log('TOOL REQUESTS');
    console.log('='.repeat(60));
    const toolRequests = await MaterialRequest.find({ 
      projectId: 1003,
      requestType: 'TOOL',
      status: 'PENDING' 
    });
    console.log(`Total pending: ${toolRequests.length}`);
    toolRequests.forEach(req => {
      const employee = employees.find(e => e.id === req.employeeId);
      console.log(`  - ID: ${req.id}, Item: ${req.itemName}`);
      console.log(`    Employee: ${req.employeeId} (${employee?.fullName || 'NOT FOUND'})`);
      console.log(`    Quantity: ${req.quantity} ${req.unit}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

checkApprovalData();
