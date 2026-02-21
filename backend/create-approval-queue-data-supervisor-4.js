/**
 * Create approval queue data for supervisorId 4
 * Creates: Leave Requests, Payment Requests, Material Requests, Tool Requests
 * Run: node create-approval-queue-data-supervisor-4.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';
import PaymentRequest from './src/modules/leaveRequest/models/PaymentRequest.js';
import MaterialRequest from './src/modules/project/models/MaterialRequest.js';

async function createApprovalQueueData() {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: process.env.DB_NAME || 'erp'
    });
    console.log('✅ Connected to MongoDB\n');

    const supervisorId = 4;
    console.log(`🎯 Creating approval queue data for Supervisor ID: ${supervisorId}\n`);

    // ========================================
    // STEP 1: Find supervisor's projects and workers
    // ========================================
    console.log('📋 STEP 1: Finding supervisor\'s projects and workers...');
    
    // Find projects supervised by this supervisor
    const projects = await Project.find({ supervisorId: supervisorId });
    console.log(`✅ Found ${projects.length} projects supervised by supervisor ${supervisorId}`);
    
    if (projects.length === 0) {
      console.log('❌ No projects found for this supervisor. Creating some projects first...');
      return;
    }

    const projectIds = projects.map(p => p.id);
    console.log(`📊 Project IDs: ${projectIds.join(', ')}`);

    // Find workers in these projects (from task assignments)
    const WorkerTaskAssignment = (await import('./src/modules/worker/models/WorkerTaskAssignment.js')).default;
    
    // Get unique employee IDs from task assignments for supervisor's projects
    const assignments = await WorkerTaskAssignment.find({ 
      projectId: { $in: projectIds }
    }).distinct('employeeId');
    
    console.log(`📋 Found ${assignments.length} unique employee IDs from assignments: ${assignments.join(', ')}`);
    
    // Find workers based on these employee IDs
    const workers = await Employee.find({ 
      id: { $in: assignments },
      status: 'ACTIVE'
    }).limit(10);
    
    console.log(`✅ Found ${workers.length} active workers`);
    workers.forEach((worker, index) => {
      console.log(`  ${index + 1}. ID: ${worker.id}, Name: ${worker.fullName}`);
    });

    if (workers.length === 0) {
      console.log('❌ No workers found. Cannot create approval requests.');
      return;
    }

    // ========================================
    // STEP 2: Create Leave Requests
    // ========================================
    console.log('\n📋 STEP 2: Creating Leave Requests...');
    
    const leaveRequestsData = [
      {
        employeeId: workers[0].id,
        employeeName: workers[0].fullName,
        leaveType: 'ANNUAL',
        fromDate: new Date('2026-02-15'),
        toDate: new Date('2026-02-17'),
        totalDays: 3,
        reason: 'Family vacation planned for long time',
        urgency: 'NORMAL'
      },
      {
        employeeId: workers[1]?.id || workers[0].id,
        employeeName: workers[1]?.fullName || workers[0].fullName,
        leaveType: 'MEDICAL',
        fromDate: new Date('2026-02-12'),
        toDate: new Date('2026-02-12'),
        totalDays: 1,
        reason: 'Doctor appointment for regular checkup',
        urgency: 'HIGH'
      },
      {
        employeeId: workers[2]?.id || workers[0].id,
        employeeName: workers[2]?.fullName || workers[0].fullName,
        leaveType: 'EMERGENCY',
        fromDate: new Date('2026-02-11'),
        toDate: new Date('2026-02-11'),
        totalDays: 1,
        reason: 'Family emergency - need to attend to sick relative',
        urgency: 'URGENT'
      }
    ];

    const createdLeaveRequests = [];
    for (const [index, leaveData] of leaveRequestsData.entries()) {
      const lastLeaveRequest = await LeaveRequest.findOne().sort({ id: -1 });
      const nextLeaveId = lastLeaveRequest ? lastLeaveRequest.id + 1 : 1;
      
      const leaveRequest = await LeaveRequest.create({
        id: nextLeaveId,
        companyId: 1,
        employeeId: leaveData.employeeId,
        requestType: 'LEAVE',
        leaveType: leaveData.leaveType,
        fromDate: leaveData.fromDate,
        toDate: leaveData.toDate,
        totalDays: leaveData.totalDays,
        reason: leaveData.reason,
        status: 'PENDING',
        currentApproverId: supervisorId,
        requestedAt: new Date(),
        createdBy: leaveData.employeeId
      });
      
      createdLeaveRequests.push(leaveRequest);
      console.log(`✅ Created Leave Request ID: ${leaveRequest.id} for ${leaveData.employeeName} (${leaveData.leaveType})`);
    }

    // ========================================
    // STEP 3: Create Payment Requests
    // ========================================
    console.log('\n📋 STEP 3: Creating Payment Requests...');
    
    const paymentRequestsData = [
      {
        employeeId: workers[0].id,
        employeeName: workers[0].fullName,
        requestType: 'ADVANCE_PAYMENT',
        amount: 500,
        reason: 'Advance salary for family medical expenses',
        description: 'Need advance payment to cover medical bills for family member',
        urgency: 'HIGH'
      },
      {
        employeeId: workers[1]?.id || workers[0].id,
        employeeName: workers[1]?.fullName || workers[0].fullName,
        requestType: 'EXPENSE_REIMBURSEMENT',
        amount: 150,
        reason: 'Transportation expenses for project work',
        description: 'Reimbursement for taxi fare to remote project site',
        urgency: 'NORMAL'
      },
      {
        employeeId: workers[2]?.id || workers[0].id,
        employeeName: workers[2]?.fullName || workers[0].fullName,
        requestType: 'OVERTIME_PAYMENT',
        amount: 300,
        reason: 'Overtime work for urgent project deadline',
        description: 'Worked extra 20 hours last week to meet project milestone',
        urgency: 'NORMAL'
      }
    ];

    const createdPaymentRequests = [];
    for (const [index, paymentData] of paymentRequestsData.entries()) {
      const lastPaymentRequest = await PaymentRequest.findOne().sort({ id: -1 });
      const nextPaymentId = lastPaymentRequest ? lastPaymentRequest.id + 1 : 1;
      
      const paymentRequest = await PaymentRequest.create({
        id: nextPaymentId,
        companyId: 1,
        employeeId: paymentData.employeeId,
        requestType: paymentData.requestType,
        amount: paymentData.amount,
        currency: 'SGD',
        reason: paymentData.reason,
        description: paymentData.description,
        urgency: paymentData.urgency,
        status: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        bankDetails: {
          accountNumber: '1234567890',
          bankName: 'DBS Bank',
          accountHolderName: paymentData.employeeName
        },
        createdBy: paymentData.employeeId
      });
      
      createdPaymentRequests.push(paymentRequest);
      console.log(`✅ Created Payment Request ID: ${paymentRequest.id} for ${paymentData.employeeName} (${paymentData.requestType})`);
    }

    // ========================================
    // STEP 4: Create Material Requests
    // ========================================
    console.log('\n📋 STEP 4: Creating Material Requests...');
    
    const materialRequestsData = [
      {
        projectId: projectIds[0],
        projectName: projects[0].projectName || projects[0].name,
        employeeId: workers[0].id,
        employeeName: workers[0].fullName,
        requestType: 'MATERIAL',
        itemName: 'Portland Cement',
        itemCategory: 'concrete',
        quantity: 50,
        unit: 'bags',
        purpose: 'Foundation work for building construction',
        urgency: 'HIGH',
        estimatedCost: 2500
      },
      {
        projectId: projectIds[0],
        projectName: projects[0].projectName || projects[0].name,
        employeeId: workers[1]?.id || workers[0].id,
        employeeName: workers[1]?.fullName || workers[0].fullName,
        requestType: 'MATERIAL',
        itemName: 'Steel Reinforcement Bars',
        itemCategory: 'steel',
        quantity: 100,
        unit: 'pieces',
        purpose: 'Reinforcement for concrete structure',
        urgency: 'NORMAL',
        estimatedCost: 5000
      },
      {
        projectId: projectIds[1] || projectIds[0],
        projectName: projects[1]?.projectName || projects[1]?.name || projects[0].projectName,
        employeeId: workers[2]?.id || workers[0].id,
        employeeName: workers[2]?.fullName || workers[0].fullName,
        requestType: 'MATERIAL',
        itemName: 'Electrical Cables',
        itemCategory: 'electrical',
        quantity: 200,
        unit: 'meters',
        purpose: 'Electrical wiring installation',
        urgency: 'URGENT',
        estimatedCost: 1200
      }
    ];

    const createdMaterialRequests = [];
    for (const [index, materialData] of materialRequestsData.entries()) {
      const lastMaterialRequest = await MaterialRequest.findOne().sort({ id: -1 });
      const nextMaterialId = lastMaterialRequest ? lastMaterialRequest.id + 1 : 1;
      
      const materialRequest = await MaterialRequest.create({
        id: nextMaterialId,
        companyId: 1,
        projectId: materialData.projectId,
        employeeId: materialData.employeeId,
        requestType: materialData.requestType,
        itemName: materialData.itemName,
        itemCategory: materialData.itemCategory,
        quantity: materialData.quantity,
        unit: materialData.unit,
        urgency: materialData.urgency,
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        purpose: materialData.purpose,
        justification: `Required for ${materialData.projectName} project work`,
        specifications: `Standard quality ${materialData.itemName} as per project requirements`,
        estimatedCost: materialData.estimatedCost,
        status: 'PENDING',
        createdBy: materialData.employeeId
      });
      
      createdMaterialRequests.push(materialRequest);
      console.log(`✅ Created Material Request ID: ${materialRequest.id} for ${materialData.itemName} (Project: ${materialData.projectName})`);
    }

    // ========================================
    // STEP 5: Create Tool Requests
    // ========================================
    console.log('\n📋 STEP 5: Creating Tool Requests...');
    
    const toolRequestsData = [
      {
        projectId: projectIds[0],
        projectName: projects[0].projectName || projects[0].name,
        employeeId: workers[0].id,
        employeeName: workers[0].fullName,
        requestType: 'TOOL',
        itemName: 'Power Drill Set',
        itemCategory: 'power_tools',
        quantity: 2,
        unit: 'sets',
        purpose: 'Drilling holes for electrical installation',
        urgency: 'NORMAL',
        estimatedCost: 800
      },
      {
        projectId: projectIds[0],
        projectName: projects[0].projectName || projects[0].name,
        employeeId: workers[1]?.id || workers[0].id,
        employeeName: workers[1]?.fullName || workers[0].fullName,
        requestType: 'TOOL',
        itemName: 'Safety Helmets',
        itemCategory: 'safety_equipment',
        quantity: 10,
        unit: 'pieces',
        purpose: 'Safety equipment for new workers',
        urgency: 'HIGH',
        estimatedCost: 300
      },
      {
        projectId: projectIds[1] || projectIds[0],
        projectName: projects[1]?.projectName || projects[1]?.name || projects[0].projectName,
        employeeId: workers[2]?.id || workers[0].id,
        employeeName: workers[2]?.fullName || workers[0].fullName,
        requestType: 'TOOL',
        itemName: 'Measuring Tape',
        itemCategory: 'measuring_tools',
        quantity: 5,
        unit: 'pieces',
        purpose: 'Accurate measurements for construction work',
        urgency: 'NORMAL',
        estimatedCost: 150
      }
    ];

    const createdToolRequests = [];
    for (const [index, toolData] of toolRequestsData.entries()) {
      const lastToolRequest = await MaterialRequest.findOne().sort({ id: -1 });
      const nextToolId = lastToolRequest ? lastToolRequest.id + 1 : 1;
      
      const toolRequest = await MaterialRequest.create({
        id: nextToolId,
        companyId: 1,
        projectId: toolData.projectId,
        employeeId: toolData.employeeId,
        requestType: toolData.requestType,
        itemName: toolData.itemName,
        itemCategory: toolData.itemCategory,
        quantity: toolData.quantity,
        unit: toolData.unit,
        urgency: toolData.urgency,
        requiredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        purpose: toolData.purpose,
        justification: `Required for ${toolData.projectName} project work`,
        specifications: `Standard quality ${toolData.itemName} as per project requirements`,
        estimatedCost: toolData.estimatedCost,
        status: 'PENDING',
        createdBy: toolData.employeeId
      });
      
      createdToolRequests.push(toolRequest);
      console.log(`✅ Created Tool Request ID: ${toolRequest.id} for ${toolData.itemName} (Project: ${toolData.projectName})`);
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ APPROVAL QUEUE DATA CREATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary for Supervisor ID ${supervisorId}:`);
    console.log(`   - Leave Requests: ${createdLeaveRequests.length}`);
    console.log(`   - Payment Requests: ${createdPaymentRequests.length}`);
    console.log(`   - Material Requests: ${createdMaterialRequests.length}`);
    console.log(`   - Tool Requests: ${createdToolRequests.length}`);
    console.log(`   - Total Pending Approvals: ${createdLeaveRequests.length + createdPaymentRequests.length + createdMaterialRequests.length + createdToolRequests.length}`);
    
    console.log(`\n🎯 Test URLs for Postman:\n`);
    
    console.log(`1️⃣  Get Pending Approvals Summary:`);
    console.log(`   GET http://192.168.1.6:5002/api/supervisor/pending-approvals`);
    console.log(`   Headers: Authorization: Bearer <token>`);
    console.log(`   Expected: Summary of all pending approvals\n`);
    
    console.log(`2️⃣  Get Dashboard Data (includes approvals):`);
    console.log(`   GET http://192.168.1.6:5002/api/supervisor/dashboard`);
    console.log(`   Headers: Authorization: Bearer <token>`);
    console.log(`   Expected: Dashboard with pendingApprovals section\n`);
    
    console.log(`3️⃣  Get Pending Leave Requests:`);
    console.log(`   GET http://192.168.1.6:5002/api/supervisor/pending-leave-requests`);
    console.log(`   Headers: Authorization: Bearer <token>`);
    console.log(`   Expected: ${createdLeaveRequests.length} leave requests\n`);
    
    console.log(`4️⃣  Get Pending Payment Requests:`);
    console.log(`   GET http://192.168.1.6:5002/api/supervisor/pending-advance-requests`);
    console.log(`   Headers: Authorization: Bearer <token>`);
    console.log(`   Expected: ${createdPaymentRequests.length} payment requests\n`);
    
    console.log(`5️⃣  Get Pending Material Requests:`);
    console.log(`   GET http://192.168.1.6:5002/api/supervisor/pending-material-requests`);
    console.log(`   Headers: Authorization: Bearer <token>`);
    console.log(`   Expected: ${createdMaterialRequests.length} material requests\n`);
    
    console.log(`6️⃣  Get Pending Tool Requests:`);
    console.log(`   GET http://192.168.1.6:5002/api/supervisor/pending-tool-requests`);
    console.log(`   Headers: Authorization: Bearer <token>`);
    console.log(`   Expected: ${createdToolRequests.length} tool requests\n`);

    console.log(`\n📝 Login Credentials:`);
    console.log(`   Email: supervisor@gmail.com`);
    console.log(`   Password: password123`);
    console.log(`   POST http://192.168.1.6:5002/api/auth/login\n`);

    console.log(`\n📱 Mobile App Testing:`);
    console.log(`   1. Login as supervisor@gmail.com`);
    console.log(`   2. Navigate to Dashboard - check pending approvals count`);
    console.log(`   3. Go to Approvals section - review all pending requests`);
    console.log(`   4. Test approve/reject functionality for each request type`);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

createApprovalQueueData();