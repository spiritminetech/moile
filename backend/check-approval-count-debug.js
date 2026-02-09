import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';
import PaymentRequest from './src/modules/leaveRequest/models/PaymentRequest.js';
import MaterialRequest from './src/modules/project/models/MaterialRequest.js';

dotenv.config();

async function checkApprovalCountDebug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find supervisor (assuming supervisor with userId exists)
    // First, let's find any employee with role supervisor
    let supervisor = await Employee.findOne({ 
      role: 'supervisor'
    }).lean();
    
    // If not found by role, try finding by checking if they have projects assigned
    if (!supervisor) {
      const projectWithSupervisor = await Project.findOne({ 
        supervisorId: { $exists: true, $ne: null } 
      }).lean();
      
      if (projectWithSupervisor) {
        supervisor = await Employee.findOne({ 
          id: projectWithSupervisor.supervisorId 
        }).lean();
      }
    }
    
    if (!supervisor) {
      console.log('❌ No supervisor found');
      console.log('Let me check all employees...');
      const allEmployees = await Employee.find().limit(5).lean();
      console.log('Sample employees:', allEmployees.map(e => ({
        id: e.id,
        name: e.fullName,
        role: e.role,
        userId: e.userId
      })));
      return;
    }

    console.log('\n📋 Supervisor Info:');
    console.log('  ID:', supervisor.id);
    console.log('  Name:', supervisor.fullName);
    console.log('  User ID:', supervisor.userId);

    // Get supervisor's projects
    const projects = await Project.find({ 
      supervisorId: supervisor.id 
    }).lean();
    
    console.log('\n📁 Projects:');
    console.log('  Count:', projects.length);
    projects.forEach(p => {
      console.log(`  - ${p.name || p.projectName} (ID: ${p.id})`);
    });

    const projectIds = projects.map(p => p.id);

    // Check employees with BOTH query patterns
    console.log('\n👥 Employee Query Comparison:');
    
    // Pattern 1: currentProject.id (nested object)
    const employeesPattern1 = await Employee.find({
      'currentProject.id': { $in: projectIds }
    }).lean();
    console.log('  Pattern 1 (currentProject.id):', employeesPattern1.length, 'employees');
    if (employeesPattern1.length > 0) {
      console.log('    Sample:', employeesPattern1.slice(0, 3).map(e => ({
        id: e.id,
        name: e.fullName,
        currentProject: e.currentProject
      })));
    }

    // Pattern 2: currentProjectId (direct field)
    const employeesPattern2 = await Employee.find({
      currentProjectId: { $in: projectIds }
    }).lean();
    console.log('  Pattern 2 (currentProjectId):', employeesPattern2.length, 'employees');
    if (employeesPattern2.length > 0) {
      console.log('    Sample:', employeesPattern2.slice(0, 3).map(e => ({
        id: e.id,
        name: e.fullName,
        currentProjectId: e.currentProjectId
      })));
    }

    // Pattern 3: Combined with $or (what dashboard uses)
    const employeesPattern3 = await Employee.find({
      $or: [
        { 'currentProject.id': { $in: projectIds } },
        { currentProjectId: { $in: projectIds } }
      ]
    }).lean();
    console.log('  Pattern 3 ($or combined):', employeesPattern3.length, 'employees');

    // Get all employee IDs from pattern 3
    const allEmployeeIds = employeesPattern3.map(e => e.id);

    // Check actual employee structure
    console.log('\n🔍 Employee Structure Analysis:');
    const sampleEmployee = await Employee.findOne().lean();
    if (sampleEmployee) {
      console.log('  Sample employee fields:');
      console.log('    - id:', sampleEmployee.id);
      console.log('    - currentProject:', sampleEmployee.currentProject);
      console.log('    - currentProjectId:', sampleEmployee.currentProjectId);
    }

    // Count approvals using Pattern 1 (what approvals screen uses)
    console.log('\n📊 Approval Counts (Pattern 1 - Approvals Screen):');
    const employeeIdsPattern1 = employeesPattern1.map(e => e.id);
    
    const [leave1, advance1, material1, tool1] = await Promise.all([
      LeaveRequest.countDocuments({ 
        employeeId: { $in: employeeIdsPattern1 },
        status: 'PENDING' 
      }),
      PaymentRequest.countDocuments({ 
        employeeId: { $in: employeeIdsPattern1 },
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

    console.log('  Leave:', leave1);
    console.log('  Advance:', advance1);
    console.log('  Material:', material1);
    console.log('  Tool:', tool1);
    console.log('  Total:', leave1 + advance1 + material1 + tool1);

    // Count approvals using Pattern 3 (what dashboard uses)
    console.log('\n📊 Approval Counts (Pattern 3 - Dashboard):');
    
    const [leave3, advance3, material3, tool3] = await Promise.all([
      LeaveRequest.countDocuments({ 
        employeeId: { $in: allEmployeeIds },
        status: 'PENDING' 
      }),
      PaymentRequest.countDocuments({ 
        employeeId: { $in: allEmployeeIds },
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

    console.log('  Leave:', leave3);
    console.log('  Advance:', advance3);
    console.log('  Material:', material3);
    console.log('  Tool:', tool3);
    console.log('  Total:', leave3 + advance3 + material3 + tool3);

    // Show actual pending requests
    console.log('\n📝 Actual Pending Requests:');
    const allLeave = await LeaveRequest.find({ status: 'PENDING' }).lean();
    const allAdvance = await PaymentRequest.find({ status: 'PENDING' }).lean();
    const allMaterial = await MaterialRequest.find({ 
      requestType: 'MATERIAL',
      status: 'PENDING' 
    }).lean();
    const allTool = await MaterialRequest.find({ 
      requestType: 'TOOL',
      status: 'PENDING' 
    }).lean();

    console.log('  All Leave Requests:', allLeave.length);
    allLeave.forEach(req => {
      const inPattern1 = employeeIdsPattern1.includes(req.employeeId);
      const inPattern3 = allEmployeeIds.includes(req.employeeId);
      console.log(`    - Employee ${req.employeeId}: Pattern1=${inPattern1}, Pattern3=${inPattern3}`);
    });

    console.log('  All Advance Requests:', allAdvance.length);
    allAdvance.forEach(req => {
      const inPattern1 = employeeIdsPattern1.includes(req.employeeId);
      const inPattern3 = allEmployeeIds.includes(req.employeeId);
      console.log(`    - Employee ${req.employeeId}: Pattern1=${inPattern1}, Pattern3=${inPattern3}`);
    });

    console.log('  All Material Requests:', allMaterial.length);
    allMaterial.forEach(req => {
      const inProjects = projectIds.includes(req.projectId);
      console.log(`    - Project ${req.projectId}: InSupervisorProjects=${inProjects}`);
    });

    console.log('  All Tool Requests:', allTool.length);
    allTool.forEach(req => {
      const inProjects = projectIds.includes(req.projectId);
      console.log(`    - Project ${req.projectId}: InSupervisorProjects=${inProjects}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkApprovalCountDebug();
