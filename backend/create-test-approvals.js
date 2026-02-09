import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';
import MaterialRequest from './src/modules/project/models/MaterialRequest.js';
import PaymentRequest from './src/modules/leaveRequest/models/PaymentRequest.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function createTestApprovals() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find supervisor 4 and their projects
    const supervisor = await Employee.findOne({ id: 4 });
    if (!supervisor) {
      console.log('❌ Supervisor with id 4 not found');
      return;
    }

    console.log('✅ Found supervisor:', {
      id: supervisor.id,
      name: supervisor.name,
      userId: supervisor.userId
    });

    // Get supervisor's projects
    const projects = await Project.find({ supervisorId: supervisor.id });
    console.log(`✅ Found ${projects.length} projects for supervisor`);

    if (projects.length === 0) {
      console.log('❌ No projects found for supervisor');
      return;
    }

    const projectIds = projects.map(p => p.id);

    // Get employees assigned to supervisor's projects
    const employees = await Employee.find({ 
      currentProjectId: { $in: projectIds } 
    });
    
    console.log(`✅ Found ${employees.length} employees in supervisor's projects`);

    if (employees.length === 0) {
      console.log('❌ No employees found in supervisor\'s projects');
      return;
    }

    // Clear existing pending requests for testing
    console.log('🧹 Clearing existing pending requests...');
    await Promise.all([
      LeaveRequest.deleteMany({ 
        employeeId: { $in: employees.map(e => e.id) },
        status: 'PENDING' 
      }),
      PaymentRequest.deleteMany({ 
        employeeId: { $in: employees.map(e => e.id) },
        status: 'PENDING' 
      }),
      MaterialRequest.deleteMany({ 
        projectId: { $in: projectIds },
        status: 'PENDING' 
      })
    ]);

    console.log('✅ Cleared existing pending requests');

    // Create test leave requests
    console.log('📝 Creating leave requests...');
    const leaveRequests = [];
    
    for (let i = 0; i < Math.min(3, employees.length); i++) {
      const employee = employees[i];
      const leaveTypes = ['SICK', 'ANNUAL', 'EMERGENCY'];
      const leaveType = leaveTypes[i % leaveTypes.length];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + i + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2);

      const leaveRequest = await LeaveRequest.create({
        id: Date.now() + i,
        companyId: employee.companyId,
        employeeId: employee.id,
        leaveType: leaveType,
        startDate: startDate,
        endDate: endDate,
        reason: `${leaveType} leave request for testing - Employee ${employee.name}`,
        status: 'PENDING',
        requestedAt: new Date(Date.now() - (i * 3600000)), // Stagger request times
        createdAt: new Date(Date.now() - (i * 3600000))
      });

      leaveRequests.push(leaveRequest);
      console.log(`  ✅ Created ${leaveType} leave request for ${employee.name}`);
    }

    // Create test advance payment requests
    console.log('📝 Creating advance payment requests...');
    const advanceRequests = [];
    
    for (let i = 0; i < Math.min(2, employees.length); i++) {
      const employee = employees[i];
      const amounts = [5000, 10000, 7500];
      const reasons = ['Medical emergency', 'Family event', 'Personal expense'];

      const advanceRequest = await PaymentRequest.create({
        id: Date.now() + 1000 + i,
        companyId: employee.companyId,
        employeeId: employee.id,
        requestType: 'ADVANCE',
        amount: amounts[i % amounts.length],
        reason: reasons[i % reasons.length],
        status: 'PENDING',
        createdAt: new Date(Date.now() - (i * 7200000)) // Stagger request times
      });

      advanceRequests.push(advanceRequest);
      console.log(`  ✅ Created advance payment request for ${employee.name} - Amount: ${advanceRequest.amount}`);
    }

    // Create test material requests
    console.log('📝 Creating material requests...');
    const materialRequests = [];
    
    for (let i = 0; i < Math.min(2, projects.length); i++) {
      const project = projects[i];
      const employee = employees[i % employees.length];
      const materials = [
        { name: 'Cement Bags', quantity: 50, unit: 'bags' },
        { name: 'Steel Rods', quantity: 100, unit: 'pieces' },
        { name: 'Sand', quantity: 5, unit: 'tons' }
      ];
      const material = materials[i % materials.length];

      const materialRequest = await MaterialRequest.create({
        id: Date.now() + 2000 + i,
        companyId: project.companyId,
        projectId: project.id,
        employeeId: employee.id,
        requestType: 'MATERIAL',
        itemName: material.name,
        itemCategory: 'Construction Materials',
        quantity: material.quantity,
        unit: material.unit,
        urgency: i === 0 ? 'URGENT' : 'NORMAL',
        requiredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        purpose: `Required for ${project.name} construction work`,
        justification: 'Current stock is running low',
        status: 'PENDING',
        createdAt: new Date(Date.now() - (i * 10800000)) // Stagger request times
      });

      materialRequests.push(materialRequest);
      console.log(`  ✅ Created material request for ${project.name} - ${material.name}`);
    }

    // Create test tool requests
    console.log('📝 Creating tool requests...');
    const toolRequests = [];
    
    for (let i = 0; i < Math.min(2, projects.length); i++) {
      const project = projects[i];
      const employee = employees[i % employees.length];
      const tools = [
        { name: 'Power Drill', quantity: 2, unit: 'pieces' },
        { name: 'Welding Machine', quantity: 1, unit: 'piece' },
        { name: 'Measuring Tape', quantity: 5, unit: 'pieces' }
      ];
      const tool = tools[i % tools.length];

      const toolRequest = await MaterialRequest.create({
        id: Date.now() + 3000 + i,
        companyId: project.companyId,
        projectId: project.id,
        employeeId: employee.id,
        requestType: 'TOOL',
        itemName: tool.name,
        itemCategory: 'Construction Tools',
        quantity: tool.quantity,
        unit: tool.unit,
        urgency: 'NORMAL',
        requiredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        purpose: `Required for ${project.name} work`,
        justification: 'Additional tools needed for new phase',
        status: 'PENDING',
        createdAt: new Date(Date.now() - (i * 14400000)) // Stagger request times
      });

      toolRequests.push(toolRequest);
      console.log(`  ✅ Created tool request for ${project.name} - ${tool.name}`);
    }

    // Summary
    console.log('\n📊 Test Approvals Created Successfully:');
    console.log(`  ✅ Leave Requests: ${leaveRequests.length}`);
    console.log(`  ✅ Advance Payment Requests: ${advanceRequests.length}`);
    console.log(`  ✅ Material Requests: ${materialRequests.length}`);
    console.log(`  ✅ Tool Requests: ${toolRequests.length}`);
    console.log(`  📈 Total Pending Approvals: ${leaveRequests.length + advanceRequests.length + materialRequests.length + toolRequests.length}`);

    console.log('\n🎯 Next Steps:');
    console.log('  1. Login to the mobile app as supervisor');
    console.log('  2. Navigate to Approvals screen');
    console.log('  3. You should see all pending approvals');

  } catch (error) {
    console.error('❌ Error creating test approvals:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

createTestApprovals();
