import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models
const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' });
const WorkerTaskProgressSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskprogresses' });
const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const TaskSchema = new mongoose.Schema({}, { strict: false, collection: 'tasks' });

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);
const WorkerTaskProgress = mongoose.model('WorkerTaskProgress', WorkerTaskProgressSchema);
const User = mongoose.model('User', UserSchema);
const Employee = mongoose.model('Employee', EmployeeSchema);
const Task = mongoose.model('Task', TaskSchema);

async function createSampleData() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 Creating Daily Progress Sample Data (Simple Approach)');
    console.log('='.repeat(70));

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Creating data for date: ${today}`);

    // Find existing supervisor
    console.log('\n📋 Step 1: Finding Supervisor...');
    const supervisor = await User.findOne({ role: 'supervisor' });
    if (!supervisor) {
      console.log('❌ No supervisor found. Please create a supervisor first.');
      return;
    }
    console.log(`✅ Found supervisor: ${supervisor.email} (ID: ${supervisor.id})`);

    // Find existing workers
    console.log('\n📋 Step 2: Finding Workers...');
    const workers = await User.find({ role: 'worker' }).limit(3);
    if (workers.length === 0) {
      console.log('❌ No workers found. Please create workers first.');
      return;
    }
    console.log(`✅ Found ${workers.length} workers`);

    // Get employees for these workers
    const workerIds = workers.map(w => w.id).filter(id => id != null);
    const employees = await Employee.find({ userId: { $in: workerIds } });
    console.log(`✅ Found ${employees.length} employee records`);

    if (employees.length === 0) {
      console.log('❌ No employee records found for workers.');
      return;
    }

    // Find existing tasks
    console.log('\n📋 Step 3: Finding Tasks...');
    const tasks = await Task.find({ projectId: 1 }).limit(3);
    if (tasks.length === 0) {
      console.log('❌ No tasks found for project 1.');
      return;
    }
    console.log(`✅ Found ${tasks.length} tasks`);

    // Clear existing data for today
    console.log('\n📋 Step 4: Clearing Existing Data for Today...');
    await WorkerTaskAssignment.deleteMany({ date: today, projectId: 1 });
    console.log('✅ Cleared existing assignments');

    // Create assignments for today
    console.log('\n📋 Step 5: Creating Task Assignments for Today...');
    const assignments = [];
    
    for (let i = 0; i < Math.min(employees.length, tasks.length); i++) {
      const allAssignments = await WorkerTaskAssignment.find({}).sort({ id: -1 }).limit(1);
      let nextId = 1000 + i;
      if (allAssignments.length > 0 && allAssignments[0].id) {
        nextId = allAssignments[0].id + 1 + i;
      }

      const assignment = await WorkerTaskAssignment.create({
        id: nextId,
        employeeId: employees[i].id,
        taskId: tasks[i].id,
        projectId: 1,
        date: today,
        status: 'assigned',
        assignedBy: supervisor.id,
        assignedAt: new Date()
      });

      assignments.push(assignment);
      console.log(`   ✅ Assignment ${i + 1}: Employee ${employees[i].id} → Task ${tasks[i].id}`);
    }

    // Create APPROVED progress records
    console.log('\n📋 Step 6: Creating APPROVED Progress Records...');
    const progressPercentages = [75, 80, 70];

    for (let i = 0; i < assignments.length; i++) {
      const allProgress = await WorkerTaskProgress.find({}).sort({ id: -1 }).limit(1);
      let nextId = 2000 + i;
      if (allProgress.length > 0 && allProgress[0].id) {
        nextId = allProgress[0].id + 1 + i;
      }

      const progress = await WorkerTaskProgress.create({
        id: nextId,
        workerTaskAssignmentId: assignments[i].id,
        employeeId: employees[i].id,
        taskId: tasks[i].id,
        projectId: 1,
        date: today,
        progressPercent: progressPercentages[i] || 75,
        description: `Completed ${progressPercentages[i] || 75}% of work`,
        status: 'APPROVED',
        submittedAt: new Date(),
        approvedAt: new Date(),
        approvedBy: supervisor.id,
        photos: [],
        remarks: 'Good progress'
      });

      console.log(`   ✅ Progress ${i + 1}: ${progressPercentages[i] || 75}% - Status: APPROVED`);
    }

    // Verification
    console.log('\n📋 Step 7: Verification...');
    const assignmentCount = await WorkerTaskAssignment.countDocuments({ date: today, projectId: 1 });
    const assignmentIds = assignments.map(a => a.id);
    const approvedCount = await WorkerTaskProgress.countDocuments({
      workerTaskAssignmentId: { $in: assignmentIds },
      status: 'APPROVED'
    });

    console.log(`   ✅ Assignments created: ${assignmentCount}`);
    console.log(`   ✅ Approved progress records: ${approvedCount}`);

    if (assignmentCount > 0 && approvedCount > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('🎉 SUCCESS! Sample data created!');
      console.log('='.repeat(70));
      console.log('\n✅ You can now test Daily Progress APIs in Postman');
      console.log('   The "No approved worker progress found" error is resolved!');
    } else {
      console.log('\n❌ WARNING: Data creation incomplete');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

createSampleData();
