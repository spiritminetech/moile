import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { 
  collection: 'workertaskassignments',
  strict: false 
});
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

const EmployeeSchema = new mongoose.Schema({}, { 
  collection: 'employees',
  strict: false 
});
const Employee = mongoose.model('Employee', EmployeeSchema);

async function checkEmployee107() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if employee 107 exists
    const employee = await Employee.findOne({ id: 107 });
    console.log('👤 Employee 107:', employee ? {
      id: employee.id,
      name: employee.name,
      email: employee.email
    } : 'NOT FOUND');

    // Check all assignments for employee 107
    console.log('\n📋 All Task Assignments for Employee 107:');
    const allAssignments = await WorkerTaskAssignment.find({ employeeId: 107 });
    
    if (allAssignments.length === 0) {
      console.log('❌ No assignments found for employee 107');
    } else {
      allAssignments.forEach((assignment, index) => {
        console.log(`\n${index + 1}. Assignment:`);
        console.log('   Project ID:', assignment.projectId);
        console.log('   Date:', assignment.date);
        console.log('   Task:', assignment.taskName);
      });
    }

    // Check assignments for today (2026-02-06)
    console.log('\n📅 Assignments for 2026-02-06:');
    const todayAssignments = await WorkerTaskAssignment.find({ 
      employeeId: 107,
      date: '2026-02-06'
    });
    
    if (todayAssignments.length === 0) {
      console.log('❌ No assignments for 2026-02-06');
    } else {
      todayAssignments.forEach((assignment, index) => {
        console.log(`\n${index + 1}. Project ID: ${assignment.projectId}`);
        console.log('   Task:', assignment.taskName);
      });
    }

    // Check what employees ARE assigned to project 1 on 2026-02-06
    console.log('\n\n👥 Employees assigned to Project 1 on 2026-02-06:');
    const project1Assignments = await WorkerTaskAssignment.find({
      projectId: 1,
      date: '2026-02-06'
    });

    if (project1Assignments.length === 0) {
      console.log('❌ No employees assigned to project 1 on 2026-02-06');
    } else {
      for (const assignment of project1Assignments) {
        const emp = await Employee.findOne({ id: assignment.employeeId });
        console.log(`   Employee ${assignment.employeeId}: ${emp?.name || 'Unknown'}`);
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEmployee107();
