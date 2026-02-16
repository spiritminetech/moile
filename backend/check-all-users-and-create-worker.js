// Check all users and create a worker account if needed
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

async function checkAndCreateWorker() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check all users
    console.log('📋 Checking all users in database...');
    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} total users\n`);

    if (allUsers.length > 0) {
      console.log('User breakdown by role:');
      const roleCount = {};
      allUsers.forEach(user => {
        roleCount[user.role] = (roleCount[user.role] || 0) + 1;
      });
      Object.entries(roleCount).forEach(([role, count]) => {
        console.log(`  ${role}: ${count}`);
      });

      console.log('\nSample users:');
      allUsers.slice(0, 5).forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - ID: ${user.id}`);
      });
    }

    // Check for worker users specifically
    const workerUsers = await User.find({ role: 'worker' });
    console.log(`\n🔍 Worker users found: ${workerUsers.length}`);

    if (workerUsers.length === 0) {
      console.log('\n⚠️ No worker users found! Creating a test worker account...\n');

      // Get first company
      const company = await Company.findOne({});
      if (!company) {
        console.log('❌ No company found. Please create a company first.');
        return;
      }

      console.log('✅ Using company:', company.name, '(ID:', company.id, ')');

      // Get first project
      const project = await Project.findOne({});
      if (!project) {
        console.log('❌ No project found. Please create a project first.');
        return;
      }

      console.log('✅ Using project:', project.projectName, '(ID:', project.id, ')');

      // Get next user ID
      const maxUser = await User.findOne({}).sort({ id: -1 });
      const nextUserId = (maxUser?.id || 0) + 1;

      // Get next employee ID
      const maxEmployee = await Employee.findOne({}).sort({ id: -1 });
      const nextEmployeeId = (maxEmployee?.id || 0) + 1;

      // Create user
      const hashedPassword = await bcrypt.hash('worker123', 10);
      const newUser = new User({
        id: nextUserId,
        email: 'worker@test.com',
        passwordHash: hashedPassword,
        role: 'worker',
        companyId: company.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newUser.save();
      console.log('✅ Created user:', newUser.email);

      // Create employee
      const newEmployee = new Employee({
        id: nextEmployeeId,
        userId: nextUserId,
        companyId: company.id,
        fullName: 'Test Worker',
        employeeCode: `EMP${nextEmployeeId.toString().padStart(3, '0')}`,
        phone: '+65-9999-9999',
        nationality: 'Singapore',
        jobTitle: 'Construction Worker',
        department: 'Construction',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newEmployee.save();
      console.log('✅ Created employee:', newEmployee.fullName, '(ID:', newEmployee.id, ')');

      // Create a sample task if none exist
      let task = await Task.findOne({});
      if (!task) {
        const maxTask = await Task.findOne({}).sort({ id: -1 });
        const nextTaskId = (maxTask?.id || 0) + 1;

        task = new Task({
          id: nextTaskId,
          taskName: 'Sample Construction Task',
          taskType: 'WORK',
          description: 'Complete concrete pouring for foundation',
          projectId: project.id,
          status: 'active',
          priority: 'medium',
          estimatedHours: 8,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await task.save();
        console.log('✅ Created sample task:', task.taskName, '(ID:', task.id, ')');
      } else {
        console.log('✅ Using existing task:', task.taskName, '(ID:', task.id, ')');
      }

      // Create task assignment for today
      const today = new Date().toISOString().split('T')[0];
      const maxAssignment = await WorkerTaskAssignment.findOne({}).sort({ id: -1 });
      const nextAssignmentId = (maxAssignment?.id || 0) + 1;

      const assignment = new WorkerTaskAssignment({
        id: nextAssignmentId,
        employeeId: newEmployee.id,
        projectId: project.id,
        taskId: task.id,
        date: today,
        sequence: 1,
        status: 'queued',
        priority: 'medium',
        workArea: 'Foundation Area',
        floor: 'Ground Floor',
        zone: 'Zone A',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await assignment.save();
      console.log('✅ Created task assignment for today:', today);

      console.log('\n✅ Test worker account created successfully!');
      console.log('\n📝 Login credentials:');
      console.log('   Email: worker@test.com');
      console.log('   Password: worker123');
      console.log('\n🎯 This worker has:');
      console.log(`   - Employee ID: ${newEmployee.id}`);
      console.log(`   - Company: ${company.name}`);
      console.log(`   - Project: ${project.projectName}`);
      console.log(`   - Task assignment for today: ${task.taskName}`);

    } else {
      console.log('\n✅ Worker users exist. Checking their data...\n');

      for (const user of workerUsers) {
        console.log(`\n👤 Worker: ${user.email} (User ID: ${user.id})`);
        
        const employee = await Employee.findOne({ userId: user.id, status: 'ACTIVE' });
        if (!employee) {
          console.log('   ❌ No active employee record found');
          continue;
        }

        console.log(`   ✅ Employee: ${employee.fullName} (ID: ${employee.id})`);

        const today = new Date().toISOString().split('T')[0];
        const todayAssignments = await WorkerTaskAssignment.find({
          employeeId: employee.id,
          date: today
        });

        console.log(`   📅 Task assignments for today: ${todayAssignments.length}`);

        if (todayAssignments.length === 0) {
          console.log('   ⚠️ No tasks assigned for today - dashboard will show error');
          
          // Offer to create a task assignment
          const project = await Project.findOne({});
          const task = await Task.findOne({});
          
          if (project && task) {
            console.log('   💡 Creating task assignment for today...');
            
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
              workArea: 'Construction Area',
              floor: 'Ground Floor',
              zone: 'Zone A',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            await assignment.save();
            console.log('   ✅ Task assignment created!');
          }
        } else {
          console.log('   ✅ Has tasks for today');
          todayAssignments.forEach((a, i) => {
            console.log(`      ${i + 1}. Task ${a.taskId} - ${a.status}`);
          });
        }
      }
    }

    console.log('\n✅ Check complete');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAndCreateWorker();
