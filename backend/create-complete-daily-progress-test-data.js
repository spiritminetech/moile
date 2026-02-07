import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models
const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const ProjectSchema = new mongoose.Schema({}, { strict: false, collection: 'projects' });
const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' });
const WorkerTaskProgressSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskprogresses' });
const TaskSchema = new mongoose.Schema({}, { strict: false, collection: 'tasks' });

const User = mongoose.model('User', UserSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);
const Project = mongoose.model('Project', ProjectSchema);
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);
const WorkerTaskProgress = mongoose.model('WorkerTaskProgress', WorkerTaskProgressSchema);
const Task = mongoose.model('Task', TaskSchema);

async function createCompleteTestData() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 Creating Complete Daily Progress Test Data');
    console.log('='.repeat(70));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Creating data for date: ${today}`);

    // Step 1: Ensure supervisor exists
    console.log('\n📋 Step 1: Checking Supervisor...');
    let supervisor = await User.findOne({ email: 'supervisor4@example.com' });
    
    if (!supervisor) {
      console.log('   Creating supervisor user...');
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const lastUser = await User.findOne().sort({ id: -1 });
      const nextUserId = lastUser && typeof lastUser.id === 'number' ? lastUser.id + 1 : 4;
      
      supervisor = await User.create({
        id: nextUserId,
        email: 'supervisor4@example.com',
        password: hashedPassword,
        role: 'supervisor',
        name: 'Test Supervisor',
        createdAt: new Date()
      });
      console.log(`   ✅ Supervisor created with ID: ${supervisor.id}`);
    } else {
      console.log(`   ✅ Supervisor exists with ID: ${supervisor.id}`);
    }

    // Step 2: Ensure project exists with supervisor assigned
    console.log('\n📋 Step 2: Checking Project...');
    let project = await Project.findOne({ id: 1 });
    
    if (!project) {
      console.log('   Creating project...');
      project = await Project.create({
        id: 1,
        name: 'Downtown Construction Project',
        location: 'Downtown Area',
        supervisorId: supervisor.id,
        companyId: 1,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'active',
        geofence: {
          latitude: 12.9716,
          longitude: 77.5946,
          radius: 500
        }
      });
      console.log(`   ✅ Project created with ID: ${project.id}`);
    } else {
      // Update project to ensure supervisor is assigned
      project.supervisorId = supervisor.id;
      await project.save();
      console.log(`   ✅ Project exists with ID: ${project.id}, supervisor assigned`);
    }

    // Step 3: Create worker employees
    console.log('\n📋 Step 3: Creating Worker Employees...');
    const workerEmails = [
      'worker1@example.com',
      'worker2@example.com',
      'worker3@example.com'
    ];

    const workers = [];
    const bcrypt = await import('bcrypt');
    
    for (let i = 0; i < workerEmails.length; i++) {
      let user = await User.findOne({ email: workerEmails[i] });
      
      if (!user) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // Get all users and find max ID
        const allUsers = await User.find({}).sort({ id: -1 }).limit(1);
        let nextUserId = 100 + i;
        if (allUsers.length > 0 && allUsers[0].id) {
          nextUserId = Math.max(allUsers[0].id + 1, 100 + i);
        }
        
        user = await User.create({
          id: nextUserId,
          email: workerEmails[i],
          password: hashedPassword,
          role: 'worker',
          name: `Worker ${i + 1}`,
          createdAt: new Date()
        });
      }

      let employee = await Employee.findOne({ userId: user.id });
      
      if (!employee) {
        // Get all employees and find max ID
        const allEmployees = await Employee.find({}).sort({ id: -1 }).limit(1);
        let nextEmployeeId = 100 + i;
        if (allEmployees.length > 0 && allEmployees[0].id) {
          nextEmployeeId = Math.max(allEmployees[0].id + 1, 100 + i);
        }
        
        employee = await Employee.create({
          id: nextEmployeeId,
          userId: user.id,
          name: `Worker ${i + 1}`,
          email: workerEmails[i],
          phone: `+1234567${i}`,
          position: 'Construction Worker',
          department: 'Construction',
          companyId: 1,
          currentProjectId: 1,
          hireDate: new Date('2025-01-01'),
          status: 'active'
        });
      }

      workers.push({ user, employee });
      console.log(`   ✅ Worker ${i + 1} ready - User ID: ${user.id}, Employee ID: ${employee.id}`);
    }

    // Step 4: Create tasks
    console.log('\n📋 Step 4: Creating Tasks...');
    const taskNames = [
      'Foundation Work',
      'Brickwork',
      'Electrical Installation'
    ];

    const tasks = [];
    for (let i = 0; i < taskNames.length; i++) {
      let task = await Task.findOne({ name: taskNames[i], projectId: 1 });
      
      if (!task) {
        // Get all tasks and find max ID
        const allTasks = await Task.find({}).sort({ id: -1 }).limit(1);
        let nextTaskId = 1 + i;
        if (allTasks.length > 0 && allTasks[0].id) {
          nextTaskId = Math.max(allTasks[0].id + 1, 1 + i);
        }
        
        task = await Task.create({
          id: nextTaskId,
          name: taskNames[i],
          description: `${taskNames[i]} for the project`,
          projectId: 1,
          status: 'in_progress',
          priority: 'high',
          estimatedHours: 40,
          createdAt: new Date()
        });
      }

      tasks.push(task);
      console.log(`   ✅ Task ${i + 1} ready - ID: ${task.id}, Name: ${task.name}`);
    }

    // Step 5: Create worker task assignments for TODAY
    console.log('\n📋 Step 5: Creating Worker Task Assignments for TODAY...');
    
    // Clear existing assignments for today
    await WorkerTaskAssignment.deleteMany({ date: today, projectId: 1 });
    console.log('   🗑️  Cleared existing assignments for today');

    const assignments = [];
    for (let i = 0; i < workers.length; i++) {
      // Get all assignments and find max ID
      const allAssignments = await WorkerTaskAssignment.find({}).sort({ id: -1 }).limit(1);
      let nextAssignmentId = 1000 + i;
      if (allAssignments.length > 0 && allAssignments[0].id) {
        nextAssignmentId = Math.max(allAssignments[0].id + 1, 1000 + i);
      }
      
      const assignment = await WorkerTaskAssignment.create({
        id: nextAssignmentId,
        employeeId: workers[i].employee.id,
        taskId: tasks[i].id,
        projectId: 1,
        date: today,
        status: 'assigned',
        assignedBy: supervisor.id,
        assignedAt: new Date(),
        startTime: null,
        endTime: null
      });

      assignments.push(assignment);
      console.log(`   ✅ Assignment ${i + 1} created - ID: ${assignment.id}, Employee: ${workers[i].employee.name}, Task: ${tasks[i].name}`);
    }

    // Step 6: Create APPROVED worker task progress for TODAY
    console.log('\n📋 Step 6: Creating APPROVED Worker Task Progress for TODAY...');
    
    // Clear existing progress for today
    await WorkerTaskProgress.deleteMany({
      workerTaskAssignmentId: { $in: assignments.map(a => a.id) }
    });
    console.log('   🗑️  Cleared existing progress for today');

    const progressRecords = [];
    const progressPercentages = [75, 80, 70]; // Different progress for each worker

    for (let i = 0; i < assignments.length; i++) {
      // Get all progress records and find max ID
      const allProgress = await WorkerTaskProgress.find({}).sort({ id: -1 }).limit(1);
      let nextProgressId = 2000 + i;
      if (allProgress.length > 0 && allProgress[0].id) {
        nextProgressId = Math.max(allProgress[0].id + 1, 2000 + i);
      }
      
      const progress = await WorkerTaskProgress.create({
        id: nextProgressId,
        workerTaskAssignmentId: assignments[i].id,
        employeeId: workers[i].employee.id,
        taskId: tasks[i].id,
        projectId: 1,
        date: today,
        progressPercent: progressPercentages[i],
        description: `Completed ${progressPercentages[i]}% of ${tasks[i].name}`,
        status: 'APPROVED', // CRITICAL: Must be APPROVED
        submittedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: supervisor.id,
        photos: [],
        remarks: 'Good progress, quality work'
      });

      progressRecords.push(progress);
      console.log(`   ✅ Progress ${i + 1} created - ID: ${progress.id}, Status: APPROVED, Progress: ${progressPercentages[i]}%`);
    }

    // Step 7: Verification
    console.log('\n📋 Step 7: Verification...');
    
    const assignmentCount = await WorkerTaskAssignment.countDocuments({ date: today, projectId: 1 });
    const approvedProgressCount = await WorkerTaskProgress.countDocuments({
      workerTaskAssignmentId: { $in: assignments.map(a => a.id) },
      status: 'APPROVED'
    });

    console.log(`   ✅ Worker Task Assignments for today: ${assignmentCount}`);
    console.log(`   ✅ Approved Progress Records: ${approvedProgressCount}`);

    if (assignmentCount > 0 && approvedProgressCount > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('🎉 SUCCESS! Test data created successfully!');
      console.log('='.repeat(70));
      console.log('\n📝 Summary:');
      console.log(`   - Supervisor: ${supervisor.email} (ID: ${supervisor.id})`);
      console.log(`   - Project: ${project.name} (ID: ${project.id})`);
      console.log(`   - Workers: ${workers.length}`);
      console.log(`   - Tasks: ${tasks.length}`);
      console.log(`   - Assignments for ${today}: ${assignmentCount}`);
      console.log(`   - Approved Progress Records: ${approvedProgressCount}`);
      console.log(`   - Average Progress: ${Math.round(progressPercentages.reduce((a, b) => a + b, 0) / progressPercentages.length)}%`);
      console.log('\n✅ You can now test the Daily Progress APIs in Postman!');
      console.log('   The "No approved worker progress found" error should be resolved.');
    } else {
      console.log('\n❌ WARNING: Data creation incomplete!');
      console.log(`   Assignments: ${assignmentCount}, Approved Progress: ${approvedProgressCount}`);
    }

  } catch (error) {
    console.error('\n❌ Error creating test data:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the script
createCompleteTestData();
