import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import Project from './src/modules/project/models/Project.js';
import LeaveRequest from './src/modules/leaveRequest/models/LeaveRequest.js';

dotenv.config();

async function checkLeaveRequestIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the users
    const users = await User.find({
      email: { $in: ['worker@gmail.com', 'worker2@gmail.com', 'supervisor@gmail.com', 'supervisor1@gmail.com'] }
    }).lean();

    console.log('👥 Users found:');
    users.forEach(u => console.log(`   ${u.email} - User ID: ${u.id}, Role: ${u.role}`));

    // Find the employees
    const userIds = users.map(u => u.id);
    const employees = await Employee.find({ userId: { $in: userIds } }).lean();

    console.log('\n👷 Employees found:');
    employees.forEach(e => {
      const user = users.find(u => u.id === e.userId);
      console.log(`   ${e.fullName} (ID: ${e.id}) - User: ${user?.email}, Current Project: ${JSON.stringify(e.currentProject)}`);
    });

    // Find supervisors
    const supervisorUsers = users.filter(u => u.role === 'supervisor');
    const supervisorEmployees = employees.filter(e => supervisorUsers.some(u => u.id === e.userId));

    console.log('\n👔 Supervisors:');
    for (const sup of supervisorEmployees) {
      const user = users.find(u => u.id === sup.userId);
      console.log(`   ${sup.fullName} (ID: ${sup.id}) - Email: ${user?.email}`);
      
      // Find projects assigned to this supervisor
      const projects = await Project.find({ supervisorId: sup.id }).lean();
      console.log(`   Projects assigned: ${projects.length}`);
      projects.forEach(p => console.log(`      - Project ${p.id}: ${p.projectName}`));

      // Find employees in those projects
      const projectIds = projects.map(p => p.id);
      const projectEmployees = await Employee.find({
        'currentProject.id': { $in: projectIds }
      }).lean();
      
      console.log(`   Employees in supervisor's projects: ${projectEmployees.length}`);
      projectEmployees.forEach(e => {
        const empUser = users.find(u => u.id === e.userId);
        console.log(`      - ${e.fullName} (ID: ${e.id}) - Email: ${empUser?.email}`);
      });
    }

    // Check leave requests
    console.log('\n📝 Leave Requests:');
    const leaveRequests = await LeaveRequest.find({ status: 'PENDING' }).lean();
    console.log(`   Total pending: ${leaveRequests.length}`);
    
    for (const req of leaveRequests) {
      const employee = employees.find(e => e.id === req.employeeId);
      const user = users.find(u => u.id === employee?.userId);
      console.log(`   - Request ${req.id}: Employee ${req.employeeId} (${employee?.fullName || 'NOT FOUND'}) - ${user?.email || 'NO EMAIL'}`);
      console.log(`     Leave Type: ${req.leaveType}, From: ${req.fromDate}, To: ${req.toDate}`);
    }

    // Check which supervisor should see which requests
    console.log('\n🔍 Analysis:');
    for (const sup of supervisorEmployees) {
      const user = users.find(u => u.id === sup.userId);
      console.log(`\n   Supervisor: ${sup.fullName} (${user?.email})`);
      
      const projects = await Project.find({ supervisorId: sup.id }).lean();
      const projectIds = projects.map(p => p.id);
      
      const projectEmployees = await Employee.find({
        'currentProject.id': { $in: projectIds }
      }).lean();
      const employeeIds = projectEmployees.map(e => e.id);
      
      const supervisorLeaveRequests = leaveRequests.filter(r => employeeIds.includes(r.employeeId));
      
      console.log(`   Should see ${supervisorLeaveRequests.length} leave requests:`);
      supervisorLeaveRequests.forEach(req => {
        const employee = employees.find(e => e.id === req.employeeId);
        const empUser = users.find(u => u.id === employee?.userId);
        console.log(`      - From ${employee?.fullName} (${empUser?.email})`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkLeaveRequestIssue();
