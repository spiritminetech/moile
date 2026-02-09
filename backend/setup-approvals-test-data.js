import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';
import MaterialRequest from './src/modules/project/models/MaterialRequest.js';
import PaymentRequest from './src/modules/leaveRequest/models/PaymentRequest.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function setupApprovalsTestData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find supervisor 4
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

    const firstProject = projects[0];
    console.log('📍 Using project:', {
      id: firstProject.id,
      name: firstProject.name,
      companyId: firstProject.companyId
    });

    // Find or create test employees
    console.log('👷 Setting up test employees...');
    
    // Get existing employees
    let employees = await Employee.find({ 
      companyId: firstProject.companyId
    }).limit(5);

    console.log(`✅ Found ${employees.length} existing employees`);

    // If we have employees, assign them to the project
    if (employees.length > 0) {
      for (const employee of employees) {
        await Employee.findOneAndUpdate(
          { id: employee.id },
          { 
            currentProject: {
              id: firstProject.id,
              name: firstProject.name,
              code: firstProject.projectCode || 'PROJ-' + firstProject.id
            }
          }
        );
        console.log(`  ✅ Assigned ${employee.fullName || 'Employee ' + employee.id} to project ${firstProject.name}`);
      }
    } else {
      // Create test employees if none exist
      console.log('📝 Creating test employees...');
      const testEmployees = [];
      
      for (let i = 0; i < 3; i++) {
        const empId = 200 + i;
        const employee = await Employee.create({
          id: empId,
          companyId: firstProject.companyId,
          fullName: `Test Worker ${i + 1}`,
          phone: `555000${i + 1}`,
          jobTitle: 'Construction Worker',
          currentProject: {
            id: firstProject.id,
            name: firstProject.name,
            code: firstProject.projectCode || 'PROJ-' + firstProject.id
          },
          status: 'ACTIVE'
        });
        testEmployees.push(employee);
        console.log(`  ✅ Created ${employee.fullName}`);
      }
      employees = testEmployees;
    }

    // Refresh employees list
    employees = await Employee.find({ 
      'currentProject.id': firstProject.id 
    });

    console.log(`✅ Total employees in project: ${employees.length}`);

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
        projectId: firstProject.id,
        status: 'PENDING' 
      })
    ]);

    console.log('✅ Cleared existing pending requests');

    // Create test leave requests
    console.log('\n📝 Creating leave requests...');
    const leaveRequests = [];
    
    for (let i = 0; i < Math.min(3, employees.length); i++) {
      const employee = employees[i];
      const leaveTypes = ['MEDICAL', 'ANNUAL', 'EMERGENCY'];
      const leaveType = leaveTypes[i % leaveTypes.length];
      
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() + i + 1);
      const toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 2);
      const totalDays = 3;

      const leaveRequest = await LeaveRequest.create({
        id: Date.now() + i,
        companyId: employee.companyId,
        employeeId: employee.id,
        requestType: 'LEAVE',
        leaveType: leaveType,
        fromDate: fromDate,
        toDate: toDate,
        totalDays: totalDays,
        reason: `${leaveType} leave request - ${employee.fullName || 'Employee ' + employee.id}`,
        status: 'PENDING',
        requestedAt: new Date(Date.now() - (i * 3600000)),
        createdAt: new Date(Date.now() - (i * 3600000))
      });

      leaveRequests.push(leaveRequest);
      console.log(`  ✅ Created ${leaveType} leave request for ${employee.fullName || 'Employee ' + employee.id}`);
    }

    // Create test advance payment requests
    console.log('\n📝 Creating advance payment requests...');
    const advanceRequests = [];
    
    for (let i = 0; i < Math.min(2, employees.length); i++) {
      const employee = employees[i];
      const amounts = [5000, 10000];
      const reasons = ['Medical emergency', 'Family event'];

      const advanceRequest = await PaymentRequest.create({
        id: Date.now() + 1000 + i,
        companyId: employee.companyId,
        employeeId: employee.id,
        requestType: 'ADVANCE_PAYMENT',
        amount: amounts[i % amounts.length],
        reason: reasons[i % reasons.length],
        urgency: i === 0 ? 'URGENT' : 'NORMAL',
        status: 'PENDING',
        createdBy: employee.id,
        createdAt: new Date(Date.now() - (i * 7200000))
      });

      advanceRequests.push(advanceRequest);
      console.log(`  ✅ Created advance payment request for ${employee.fullName || 'Employee ' + employee.id} - ₹${advanceRequest.amount}`);
    }

    // Create test material requests
    console.log('\n📝 Creating material requests...');
    const materialRequests = [];
    
    const materials = [
      { name: 'Cement Bags', quantity: 50, unit: 'bags', urgency: 'URGENT', category: 'concrete' },
      { name: 'Steel Rods', quantity: 100, unit: 'pieces', urgency: 'NORMAL', category: 'steel' }
    ];

    for (let i = 0; i < materials.length; i++) {
      const employee = employees[i % employees.length];
      const material = materials[i];

      const materialRequest = await MaterialRequest.create({
        id: Date.now() + 2000 + i,
        companyId: firstProject.companyId,
        projectId: firstProject.id,
        employeeId: employee.id,
        requestType: 'MATERIAL',
        itemName: material.name,
        itemCategory: material.category,
        quantity: material.quantity,
        unit: material.unit,
        urgency: material.urgency,
        requiredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        purpose: `Required for ${firstProject.name} construction work`,
        justification: 'Current stock is running low',
        status: 'PENDING',
        createdBy: employee.id,
        createdAt: new Date(Date.now() - (i * 10800000))
      });

      materialRequests.push(materialRequest);
      console.log(`  ✅ Created material request - ${material.name} (${material.urgency})`);
    }

    // Create test tool requests
    console.log('\n📝 Creating tool requests...');
    const toolRequests = [];
    
    const tools = [
      { name: 'Power Drill', quantity: 2, unit: 'pieces', category: 'power_tools' },
      { name: 'Welding Machine', quantity: 1, unit: 'piece', category: 'power_tools' }
    ];

    for (let i = 0; i < tools.length; i++) {
      const employee = employees[i % employees.length];
      const tool = tools[i];

      const toolRequest = await MaterialRequest.create({
        id: Date.now() + 3000 + i,
        companyId: firstProject.companyId,
        projectId: firstProject.id,
        employeeId: employee.id,
        requestType: 'TOOL',
        itemName: tool.name,
        itemCategory: tool.category,
        quantity: tool.quantity,
        unit: tool.unit,
        urgency: 'NORMAL',
        requiredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        purpose: `Required for ${firstProject.name} work`,
        justification: 'Additional tools needed for new phase',
        status: 'PENDING',
        createdBy: employee.id,
        createdAt: new Date(Date.now() - (i * 14400000))
      });

      toolRequests.push(toolRequest);
      console.log(`  ✅ Created tool request - ${tool.name}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST APPROVALS CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`  👷 Employees in project: ${employees.length}`);
    console.log(`  📋 Leave Requests: ${leaveRequests.length}`);
    console.log(`  💰 Advance Payment Requests: ${advanceRequests.length}`);
    console.log(`  🧱 Material Requests: ${materialRequests.length}`);
    console.log(`  🔧 Tool Requests: ${toolRequests.length}`);
    console.log(`  📈 Total Pending Approvals: ${leaveRequests.length + advanceRequests.length + materialRequests.length + toolRequests.length}`);
    console.log('='.repeat(60));

    console.log('\n🎯 NEXT STEPS:');
    console.log('  1. Login to mobile app as supervisor (supervisor4@example.com)');
    console.log('  2. Navigate to Approvals screen');
    console.log('  3. You should see all pending approvals');
    console.log('  4. Test approve/reject functionality');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

setupApprovalsTestData();
