// Check worker@gmail.com account and create task assignments
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/modules/user/User.js';
import Employee from './src/modules/employee/Employee.js';
import Company from './src/modules/company/Company.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function checkWorkerGmailAccount() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the worker@gmail.com user
    console.log('🔍 Looking for worker@gmail.com...');
    const user = await User.findOne({ email: 'worker@gmail.com' });

    if (!user) {
      console.log('❌ User worker@gmail.com not found');
      console.log('\n📋 Available worker users:');
      const workers = await User.find({ role: 'worker' });
      workers.forEach(w => {
        console.log(`   - ${w.email} (ID: ${w.id})`);
      });
      return;
    }

    console.log('✅ User found:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    });

    // Verify password
    const passwordMatch = await bcrypt.compare('password123', user.passwordHash);
    console.log(`🔐 Password verification: ${passwordMatch ? '✅ Correct' : '❌ Incorrect'}`);

    // Find employee record
    console.log('\n📋 Looking for employee record...');
    const employee = await Employee.findOne({ 
      userId: user.id,
      companyId: user.companyId 
    });

    if (!employee) {
      console.log('❌ No employee record found');
      return;
    }

    console.log('✅ Employee found:', {
      employeeId: employee.id,
      fullName: employee.fullName,
      status: employee.status,
      companyId: employee.companyId
    });

    // Check company
    const company = await Company.findOne({ id: user.companyId });
    if (company) {
      console.log('✅ Company:', company.name);
    }

    // Check task assignments
    console.log('\n📋 Checking task assignments...');
    const today = new Date().toISOString().split('T')[0];
    console.log('Today:', today);

    const allAssignments = await WorkerTaskAssignment.find({ 
      employeeId: employee.id 
    }).sort({ date: -1 }).limit(10);

    console.log(`Total assignments: ${allAssignments.length}`);

    if (allAssignments.length > 0) {
      console.log('\nRecent assignments:');
      allAssignments.forEach((a, i) => {
        console.log(`  ${i + 1}. Date: ${a.date}, Project: ${a.projectId}, Task: ${a.taskId}, Status: ${a.status}`);
      });
    }

    const todayAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    });

    console.log(`\n📅 Assignments for today (${today}): ${todayAssignments.length}`);

    if (todayAssignments.length === 0) {
      console.log('⚠️ No assignments for today - this is why dashboard shows error!\n');
      console.log('💡 Creating task assignment for today...\n');

      // Get a project
      const project = await Project.findOne({});
      if (!project) {
        console.log('❌ No project found. Cannot create assignment.');
        return;
      }

      console.log('✅ Using project:', project.projectName, '(ID:', project.id, ')');

      // Get or create a task
      let task = await Task.findOne({ projectId: project.id });
      if (!task) {
        // Create a sample task
        const maxTask = await Task.findOne({}).sort({ id: -1 });
        const nextTaskId = (maxTask?.id || 0) + 1;

        task = new Task({
          id: nextTaskId,
          taskName: 'Foundation Work',
          taskType: 'WORK',
          description: 'Complete foundation concrete pouring and reinforcement',
          projectId: project.id,
          status: 'active',
          priority: 'high',
          estimatedHours: 8,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await task.save();
        console.log('✅ Created task:', task.taskName, '(ID:', task.id, ')');
      } else {
        console.log('✅ Using task:', task.taskName, '(ID:', task.id, ')');
      }

      // Create assignment
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
        priority: 'high',
        workArea: 'Foundation Area',
        floor: 'Ground Floor',
        zone: 'Zone A',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await assignment.save();

      console.log('✅ Task assignment created!');
      console.log('\n📝 Assignment details:');
      console.log('   Assignment ID:', assignment.id);
      console.log('   Employee:', employee.fullName);
      console.log('   Project:', project.projectName);
      console.log('   Task:', task.taskName);
      console.log('   Date:', today);
      console.log('   Status:', assignment.status);

      console.log('\n✅ Dashboard should now work! Try logging in again.');

    } else {
      console.log('✅ Has assignments for today:');
      for (const assignment of todayAssignments) {
        const project = await Project.findOne({ id: assignment.projectId });
        const task = await Task.findOne({ id: assignment.taskId });
        
        console.log(`\n  Assignment ${assignment.id}:`);
        console.log(`    Project: ${project?.projectName || 'Unknown'} (ID: ${assignment.projectId})`);
        console.log(`    Task: ${task?.taskName || 'Unknown'} (ID: ${assignment.taskId})`);
        console.log(`    Status: ${assignment.status}`);
        console.log(`    Work Area: ${assignment.workArea || 'N/A'}`);
      }

      console.log('\n✅ Worker account is properly set up!');
    }

    console.log('\n📝 Login credentials:');
    console.log('   Email: worker@gmail.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkWorkerGmailAccount();
