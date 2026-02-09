import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';
import PaymentRequest from './src/modules/leaveRequest/models/PaymentRequest.js';
import MaterialRequest from './src/modules/project/models/MaterialRequest.js';

dotenv.config();

async function checkBothSupervisorsApprovals() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  APPROVAL COUNTS FOR ALL SUPERVISORS');
    console.log('═══════════════════════════════════════════════════════\n');

    // Check Supervisor 1
    await checkSupervisor(1);
    
    console.log('\n───────────────────────────────────────────────────────\n');
    
    // Check Supervisor 4
    await checkSupervisor(4);

    console.log('\n═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

async function checkSupervisor(supervisorId) {
  const supervisor = await Employee.findOne({ id: supervisorId }).lean();
  
  if (!supervisor) {
    console.log(`❌ Supervisor ${supervisorId} not found`);
    return;
  }

  console.log(`📋 SUPERVISOR ${supervisorId}: ${supervisor.fullName || 'Unknown'}`);
  console.log(`   User ID: ${supervisor.userId}`);

  // Get supervisor's projects
  const projects = await Project.find({ supervisorId: supervisor.id }).lean();
  const projectIds = projects.map(p => p.id);
  
  console.log(`   Projects: ${projectIds.join(', ')}`);

  // Get employees
  const employees = await Employee.find({
    $or: [
      { 'currentProject.id': { $in: projectIds } },
      { currentProjectId: { $in: projectIds } }
    ]
  }).lean();
  const employeeIds = employees.map(e => e.id);

  console.log(`   Employees: ${employeeIds.length} workers`);

  // Count approvals
  const [leaveCount, advanceCount, materialCount, toolCount] = await Promise.all([
    LeaveRequest.countDocuments({ 
      employeeId: { $in: employeeIds },
      status: 'PENDING' 
    }),
    PaymentRequest.countDocuments({ 
      employeeId: { $in: employeeIds },
      status: 'PENDING' 
    }),
    MaterialRequest.countDocuments({ 
      projectId: { $in: projectIds },
      requestType: 'MATERIAL',
      status: 'PENDING' 
    }),
    MaterialRequest.countDocuments({ 
      projectId: { $in: projectIds },
      requestType: 'TOOL',
      status: 'PENDING' 
    })
  ]);

  const total = leaveCount + advanceCount + materialCount + toolCount;

  console.log('\n   📊 Approval Counts:');
  console.log(`      Leave: ${leaveCount}`);
  console.log(`      Advance: ${advanceCount}`);
  console.log(`      Material: ${materialCount}`);
  console.log(`      Tool: ${toolCount}`);
  console.log(`      ─────────────────`);
  console.log(`      Total: ${total}`);

  if (total > 0) {
    // Show details of pending approvals
    const [leaves, advances, materials, tools] = await Promise.all([
      LeaveRequest.find({ 
        employeeId: { $in: employeeIds },
        status: 'PENDING' 
      }).lean(),
      PaymentRequest.find({ 
        employeeId: { $in: employeeIds },
        status: 'PENDING' 
      }).lean(),
      MaterialRequest.find({ 
        projectId: { $in: projectIds },
        requestType: 'MATERIAL',
        status: 'PENDING' 
      }).lean(),
      MaterialRequest.find({ 
        projectId: { $in: projectIds },
        requestType: 'TOOL',
        status: 'PENDING' 
      }).lean()
    ]);

    console.log('\n   📝 Pending Approval Details:');
    
    if (leaves.length > 0) {
      console.log(`      Leave Requests (${leaves.length}):`);
      leaves.forEach(req => {
        console.log(`        - Employee ${req.employeeId}: ${req.leaveType}`);
      });
    }
    
    if (advances.length > 0) {
      console.log(`      Advance Payments (${advances.length}):`);
      advances.forEach(req => {
        console.log(`        - Employee ${req.employeeId}: $${req.amount}`);
      });
    }
    
    if (materials.length > 0) {
      console.log(`      Material Requests (${materials.length}):`);
      materials.forEach(req => {
        console.log(`        - Project ${req.projectId}: ${req.itemName}`);
      });
    }
    
    if (tools.length > 0) {
      console.log(`      Tool Requests (${tools.length}):`);
      tools.forEach(req => {
        console.log(`        - Project ${req.projectId}: ${req.itemName}`);
      });
    }
  }
}

checkBothSupervisorsApprovals();
