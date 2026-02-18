// Fix worker@gmail.com account by adding role, company, and employee record
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import Company from './src/modules/company/Company.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function fixWorkerGmailAccount() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the user
    const user = await User.findOne({ email: 'worker@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ Found user:', user.email, '(ID:', user.id, ')');

    // Get first company
    const company = await Company.findOne({});
    if (!company) {
      console.log('❌ No company found in database');
      return;
    }

    console.log('✅ Using company:', company.name, '(ID:', company.id, ')');

    // Update user with role and companyId
    console.log('\n🔧 Updating user record...');
    await User.updateOne(
      { id: user.id },
      { 
        $set: { 
          role: 'worker',
          companyId: company.id,
          updatedAt: new Date()
        } 
      }
    );
    console.log('✅ User updated with role and companyId');

    // Check if employee record exists
    let employee = await Employee.findOne({ userId: user.id });
    
    if (!employee) {
      console.log('\n🔧 Creating employee record...');
      
      // Get next employee ID
      const maxEmployee = await Employee.findOne({}).sort({ id: -1 });
      const nextEmployeeId = (maxEmployee?.id || 0) + 1;

      employee = new Employee({
        id: nextEmployeeId,
        userId: user.id,
        companyId: company.id,
        fullName: 'Worker User',
        employeeCode: `WRK${nextEmployeeId.toString().padStart(3, '0')}`,
        phone: '+65-8888-8888',
        nationality: 'Singapore',
        jobTitle: 'Construction Worker',
        department: 'Construction',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await employee.save();
      console.log('✅ Employee created:', employee.fullName, '(ID:', employee.id, ')');
    } else {
      console.log('✅ Employee already exists:', employee.fullName, '(ID:', employee.id, ')');
      
      // Make sure employee is active and has correct companyId
      await Employee.updateOne(
        { id: employee.id },
        { 
          $set: { 
            status: 'ACTIVE',
            companyId: company.id,
            updatedAt: new Date()
          } 
        }
      );
      console.log('✅ Employee updated');
    }

    // Get a project
    const project = await Project.findOne({});
    if (!project) {
      console.log('❌ No project found');
      return;
    }

    console.log('✅ Using project:', project.projectName, '(ID:', project.id, ')');

    // Get or create a task
    let task = await Task.findOne({ projectId: project.id });
    if (!task) {
      const maxTask = await Task.findOne({}).sort({ id: -1 });
      const nextTaskId = (maxTask?.id || 0) + 1;

      task = new Task({
        id: nextTaskId,
        taskName: 'Daily Construction Work',
        taskType: 'WORK',
        description: 'Complete assigned construction tasks for the day',
        projectId: project.id,
        status: 'active',
        priority: 'medium',
        estimatedHours: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await task.save();
      console.log('✅ Task created:', task.taskName, '(ID:', task.id, ')');
    } else {
      console.log('✅ Using task:', task.taskName, '(ID:', task.id, ')');
    }

    // Create task assignment for today
    const today = new Date().toISOString().split('T')[0];
    
    // Check if assignment already exists
    const existingAssignment = await WorkerTaskAssignment.findOne({
      employeeId: employee.id,
      date: today
    });

    if (existingAssignment) {
      console.log('✅ Task assignment already exists for today');
    } else {
      console.log('\n🔧 Creating task assignment for today...');
      
      const maxAssignment = await WorkerTaskAssignment.findOne({}).sort({ id: -1 });
      const nextAssignmentId = (maxAssignment?.id || 0) + 1;

      const assignment = new WorkerTaskAssignment({
        id: nextAssignmentId,
        employeeId: employee.id,
        projectId: project.id,
        taskId: task.id,
        date: today,
        sequence: 1,
        status: 'queued',
        priority: 'medium',
        workArea: 'Main Construction Area',
        floor: 'Ground Floor',
        zone: 'Zone A',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await assignment.save();
      console.log('✅ Task assignment created for', today);
    }

    console.log('\n✅ Worker account is now fully set up!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: worker@gmail.com');
    console.log('   Password: password123');
    console.log('\n🎯 Account details:');
    console.log('   User ID:', user.id);
    console.log('   Employee ID:', employee.id);
    console.log('   Company:', company.name);
    console.log('   Project:', project.projectName);
    console.log('   Has task for today:', today);
    console.log('\n✅ Dashboard should now work properly!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixWorkerGmailAccount();
