import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';
import PaymentRequest from './src/modules/leaveRequest/models/PaymentRequest.js';
import MaterialRequest from './src/modules/project/models/MaterialRequest.js';

dotenv.config();

async function debugApprovalCountMismatch() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const supervisorUserId = 4; // supervisor4@example.com

        // Find supervisor
        const supervisor = await Employee.findOne({ userId: supervisorUserId });
        console.log('📋 Supervisor:', {
            id: supervisor?.id,
            name: supervisor?.fullName,
            userId: supervisor?.userId
        });

        // Method 1: Dashboard approach (by supervisorId field)
        console.log('\n🔍 Method 1: Dashboard Approach (by supervisorId field)');
        const leaveBySupId = await LeaveRequest.countDocuments({
            status: 'PENDING',
            supervisorId: supervisorUserId
        });
        console.log(`   Leave requests with supervisorId=${supervisorUserId}: ${leaveBySupId}`);

        const paymentBySupId = await PaymentRequest.countDocuments({
            status: 'PENDING',
            supervisorId: supervisorUserId
        });
        console.log(`   Payment requests with supervisorId=${supervisorUserId}: ${paymentBySupId}`);

        // Method 2: Approvals screen approach (by employees under supervisor's projects)
        console.log('\n🔍 Method 2: Approvals Screen Approach (by employees under projects)');
        
        // Get supervisor's projects
        const projects = await Project.find({ supervisorId: supervisor.id }).lean();
        console.log(`   Supervisor's projects: ${projects.length}`);
        projects.forEach(p => console.log(`     - ${p.projectName || p.name} (ID: ${p.id})`));

        const projectIds = projects.map(p => p.id);

        // Get employees assigned to these projects
        const employees = await Employee.find({ 
            'currentProject.id': { $in: projectIds } 
        }).lean();
        console.log(`   Employees in supervisor's projects: ${employees.length}`);
        
        const employeeIds = employees.map(e => e.id);
        console.log(`   Employee IDs: ${employeeIds.join(', ')}`);

        // Count leave requests for these employees
        const leaveByEmployees = await LeaveRequest.countDocuments({
            employeeId: { $in: employeeIds },
            status: 'PENDING'
        });
        console.log(`   Leave requests from these employees: ${leaveByEmployees}`);

        // Count payment requests for these employees
        const paymentByEmployees = await PaymentRequest.countDocuments({
            employeeId: { $in: employeeIds },
            status: 'PENDING'
        });
        console.log(`   Payment requests from these employees: ${paymentByEmployees}`);

        // Count material requests for these projects
        const materialByProjects = await MaterialRequest.countDocuments({
            projectId: { $in: projectIds },
            requestType: 'MATERIAL',
            status: 'PENDING'
        });
        console.log(`   Material requests for these projects: ${materialByProjects}`);

        // Count tool requests for these projects
        const toolByProjects = await MaterialRequest.countDocuments({
            projectId: { $in: projectIds },
            requestType: 'TOOL',
            status: 'PENDING'
        });
        console.log(`   Tool requests for these projects: ${toolByProjects}`);

        // Show actual pending requests
        console.log('\n📊 Actual Pending Requests:');
        
        const allLeaveRequests = await LeaveRequest.find({ status: 'PENDING' }).lean();
        console.log(`\n   All pending leave requests (${allLeaveRequests.length}):`);
        allLeaveRequests.forEach(req => {
            console.log(`     - ID: ${req.id}, Employee: ${req.employeeId}, SupervisorId: ${req.supervisorId || 'N/A'}`);
        });

        const allPaymentRequests = await PaymentRequest.find({ status: 'PENDING' }).lean();
        console.log(`\n   All pending payment requests (${allPaymentRequests.length}):`);
        allPaymentRequests.forEach(req => {
            console.log(`     - ID: ${req.id}, Employee: ${req.employeeId}, SupervisorId: ${req.supervisorId || 'N/A'}`);
        });

        const allMaterialRequests = await MaterialRequest.find({ status: 'PENDING' }).lean();
        console.log(`\n   All pending material/tool requests (${allMaterialRequests.length}):`);
        allMaterialRequests.forEach(req => {
            console.log(`     - ID: ${req.id}, Type: ${req.requestType}, Project: ${req.projectId}, Employee: ${req.employeeId}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('Summary:');
        console.log('='.repeat(60));
        console.log(`Dashboard shows: ${leaveBySupId + paymentBySupId} approvals`);
        console.log(`Approvals screen shows: ${leaveByEmployees + paymentByEmployees + materialByProjects + toolByProjects} approvals`);
        console.log('\nThe mismatch is because:');
        console.log('- Dashboard queries by supervisorId field (which may not be set)');
        console.log('- Approvals screen queries by employees under supervisor\'s projects');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

debugApprovalCountMismatch();
