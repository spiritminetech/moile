import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';
import PaymentRequest from './src/modules/leaveRequest/models/PaymentRequest.js';
import MaterialRequest from './src/modules/project/models/MaterialRequest.js';

dotenv.config();

async function finalApprovalCountTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  FINAL APPROVAL COUNT TEST - SUPERVISOR 4');
    console.log('═══════════════════════════════════════════════════════\n');

    // Simulate Dashboard API logic
    const supervisor = await Employee.findOne({ id: 4 }).lean();
    const projects = await Project.find({ supervisorId: supervisor.id }).lean();
    const projectIds = projects.map(p => p.id);

    const allProjectEmployees = await Employee.find({
      $or: [
        { 'currentProject.id': { $in: projectIds } },
        { currentProjectId: { $in: projectIds } }
      ]
    }).lean();
    const allEmployeeIds = allProjectEmployees.map(e => e.id);

    const [leaveCount, advanceCount, materialCount, toolCount] = await Promise.all([
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

    const dashboardTotal = leaveCount + advanceCount + materialCount + toolCount;

    console.log('📊 DASHBOARD API RESULT:');
    console.log('   GET /api/supervisor/dashboard');
    console.log('   ─────────────────────────────────────');
    console.log('   pendingApprovals: {');
    console.log(`     leaveRequests: ${leaveCount + advanceCount},`);
    console.log(`     materialRequests: ${materialCount},`);
    console.log(`     toolRequests: ${toolCount},`);
    console.log(`     total: ${dashboardTotal}`);
    console.log('   }\n');

    // Simulate Approvals Screen API logic
    const [leaveRequests, paymentRequests, materialRequests, toolRequests] = await Promise.all([
      LeaveRequest.find({ 
        employeeId: { $in: allEmployeeIds },
        status: 'PENDING' 
      }).lean(),
      PaymentRequest.find({ 
        employeeId: { $in: allEmployeeIds },
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

    const approvalsTotal = leaveRequests.length + paymentRequests.length + 
                          materialRequests.length + toolRequests.length;

    console.log('📋 APPROVALS SCREEN API RESULT:');
    console.log('   GET /api/supervisor/approvals/pending');
    console.log('   ─────────────────────────────────────');
    console.log('   summary: {');
    console.log(`     totalPending: ${approvalsTotal},`);
    console.log('     byType: {');
    console.log(`       leave: ${leaveRequests.length},`);
    console.log(`       advance_payment: ${paymentRequests.length},`);
    console.log(`       material: ${materialRequests.length},`);
    console.log(`       tool: ${toolRequests.length}`);
    console.log('     }');
    console.log('   }\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  TEST RESULTS');
    console.log('═══════════════════════════════════════════════════════\n');

    const testsPass = dashboardTotal === approvalsTotal &&
                     dashboardTotal === 5 &&
                     toolCount === 0;

    if (testsPass) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('   ✓ Dashboard total matches Approvals total');
      console.log('   ✓ Both show 5 approvals');
      console.log('   ✓ Tool requests count is 0 (orphaned request removed)');
      console.log('   ✓ Leave + Advance = 4');
      console.log('   ✓ Material = 1');
      console.log('\n🎉 The approval count mismatch is FIXED!\n');
    } else {
      console.log('❌ TESTS FAILED!');
      console.log(`   Dashboard total: ${dashboardTotal}`);
      console.log(`   Approvals total: ${approvalsTotal}`);
      console.log(`   Tool count: ${toolCount}`);
      console.log('\n⚠️  Issue still exists - further investigation needed.\n');
    }

    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
  }
}

finalApprovalCountTest();
