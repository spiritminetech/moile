import mongoose from 'mongoose';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function debugAttendanceTaskAssignment() {
  console.log('🔍 Debugging Attendance Task Assignment Issue');
  console.log('==============================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today: ${today}`);

    // Get Employee 107
    const employee = await Employee.findOne({ id: 107 });
    console.log(`👤 Employee: ${employee.fullName} (ID: ${employee.id})`);

    // Check all assignments for today
    const assignments = await WorkerTaskAssignment.find({
      employeeId: 107,
      date: today
    });

    console.log(`\n📋 Task Assignments for Employee 107 today (${assignments.length} found):`);
    
    if (assignments.length === 0) {
      console.log('❌ NO ASSIGNMENTS FOUND FOR TODAY!');
      console.log('This explains the "No task assigned for this project today" error.');
      
      // Check recent assignments
      const recentAssignments = await WorkerTaskAssignment.find({
        employeeId: 107
      }).sort({ date: -1 }).limit(5);
      
      console.log(`\n🔍 Recent assignments (${recentAssignments.length} found):`);
      recentAssignments.forEach(a => {
        console.log(`   - Date: ${a.date}, Project: ${a.projectId}, Task: ${a.taskId}, Status: ${a.status}`);
      });
    } else {
      for (const assignment of assignments) {
        const project = await Project.findOne({ id: assignment.projectId });
        
        console.log(`\n   Assignment ${assignment.id}:`);
        console.log(`   - Project ID: ${assignment.projectId}`);
        console.log(`   - Project Name: ${project?.projectName || 'NOT FOUND'}`);
        console.log(`   - Task ID: ${assignment.taskId}`);
        console.log(`   - Status: ${assignment.status}`);
        console.log(`   - Work Area: ${assignment.workArea}`);
        console.log(`   - Date: ${assignment.date}`);
      }
    }

    // Check what project ID the mobile app might be using
    console.log('\n🏗️ Available Projects for Company:');
    const projects = await Project.find({ companyId: employee.companyId }).limit(5);
    projects.forEach(p => {
      console.log(`   - Project ${p.id}: ${p.projectName}`);
    });

    // Check if there's a default project assignment
    console.log('\n🔍 Checking for any project assignments without specific dates:');
    const anyAssignments = await WorkerTaskAssignment.find({
      employeeId: 107
    }).sort({ date: -1 }).limit(3);
    
    anyAssignments.forEach(a => {
      console.log(`   - Date: ${a.date}, Project: ${a.projectId}, Task: ${a.taskId}`);
    });

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugAttendanceTaskAssignment();