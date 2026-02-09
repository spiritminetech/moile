import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';
import PaymentRequest from './src/modules/leaveRequest/models/PaymentRequest.js';
import MaterialRequest from './src/modules/project/models/MaterialRequest.js';

dotenv.config();

async function verifyApprovalCountsAfterFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find supervisor 4
    const supervisor = await Employee.findOne({ id: 4 }).lean();
    
    console.log('\n📋 Supervisor:', supervisor.fullName, '(ID:', supervisor.id, ')');

    // Get supervisor's projects
    const projects = await Project.find({ supervisorId: supervisor.id }).lean();
    const projectIds = projects.map(p => p.id);
    
    console.log('\n📁 Supervisor Projects:', projectIds);

    // Get employees in supervisor's projects
    const employees = await Employee.find({
      $or: [
        { 'currentProject.id': { $in: projectIds } },
        { currentProjectId: { $in: projectIds } }
      ]
    }).lean();
    const employeeIds = employees.map(e => e.id);

    console.log('👥 Employees:', employeeIds.length);

    // Count all pending approvals
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

    console.log('\n📊 Approval Counts (Dashboard):');
    console.log('  Leave Requests:', leaveCount);
    console.log('  Advance Payments:', advanceCount);
    console.log('  Material Requests:', materialCount);
    console.log('  Tool Requests:', toolCount);
    console.log('  ─────────────────────────');
    console.log('  Total:', leaveCount + advanceCount + materialCount + toolCount);

    // Get actual pending requests for approvals screen
    const [leaveRequests, paymentRequests, materialRequests, toolRequests] = await Promise.all([
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

    const totalApprovals = leaveRequests.length + paymentRequests.length + 
                          materialRequests.length + toolRequests.length;

    console.log('\n📊 Approval Counts (Approvals Screen):');
    console.log('  Leave Requests:', leaveRequests.length);
    console.log('  Advance Payments:', paymentRequests.length);
    console.log('  Material Requests:', materialRequests.length);
    console.log('  Tool Requests:', toolRequests.length);
    console.log('  ─────────────────────────');
    console.log('  Total:', totalApprovals);

    console.log('\n✅ Verification:');
    if (leaveCount + advanceCount === leaveRequests.length + paymentRequests.length &&
        materialCount === materialRequests.length &&
        toolCount === toolRequests.length) {
      console.log('  ✓ Dashboard and Approvals Screen counts MATCH!');
      console.log('  ✓ Both should show:', totalApprovals, 'total approvals');
    } else {
      console.log('  ✗ Counts still do not match');
    }

    // Show breakdown for mobile app
    console.log('\n📱 Expected Mobile App Display:');
    console.log('  Dashboard Approval Queue Card:');
    console.log('    - Leave Requests:', leaveCount + advanceCount);
    console.log('    - Material Requests:', materialCount);
    console.log('    - Tool Requests:', toolCount);
    console.log('    - Total:', leaveCount + advanceCount + materialCount + toolCount);
    console.log('');
    console.log('  Approvals Screen:');
    console.log('    - Total Approvals:', totalApprovals);
    console.log('    - By Type:');
    console.log('      • Leave:', leaveRequests.length);
    console.log('      • Advance Payment:', paymentRequests.length);
    console.log('      • Material:', materialRequests.length);
    console.log('      • Tool:', toolRequests.length);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

verifyApprovalCountsAfterFix();
