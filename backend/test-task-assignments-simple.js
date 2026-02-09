import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testTaskAssignments = async () => {
  try {
    console.log('\n📋 Testing Task Assignment Data Population...\n');

    // Get a sample of assignments
    const assignments = await WorkerTaskAssignment.find()
      .limit(10)
      .lean();

    console.log(`Found ${assignments.length} assignments\n`);

    // Get unique task IDs and employee IDs
    const taskIds = [...new Set(assignments.map(a => a.taskId).filter(Boolean))];
    const employeeIds = [...new Set(assignments.map(a => a.employeeId).filter(Boolean))];

    console.log(`Unique task IDs: ${taskIds.length}`);
    console.log(`Unique employee IDs: ${employeeIds.length}\n`);

    // Fetch tasks and employees
    const [tasks, employees] = await Promise.all([
      Task.find({ id: { $in: taskIds } }).lean(),
      Employee.find({ id: { $in: employeeIds } }).lean()
    ]);

    console.log(`Tasks found in database: ${tasks.length}`);
    console.log(`Employees found in database: ${employees.length}\n`);

    // Create lookup maps
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    // Test the transformation
    console.log('📝 Sample Assignments with Populated Data:\n');
    
    let unknownTaskCount = 0;
    let unknownWorkerCount = 0;

    assignments.forEach((assignment, index) => {
      const task = taskMap.get(assignment.taskId);
      const employee = employeeMap.get(assignment.employeeId);

      const taskName = task?.taskName || 'Unknown Task';
      const workerName = employee?.fullName || 'Unknown Worker';

      if (taskName === 'Unknown Task') unknownTaskCount++;
      if (workerName === 'Unknown Worker') unknownWorkerCount++;

      if (index < 5) {
        console.log(`Assignment ${index + 1}:`);
        console.log(`  Task ID: ${assignment.taskId} → ${taskName}`);
        console.log(`  Worker ID: ${assignment.employeeId} → ${workerName}`);
        console.log(`  Status: ${assignment.status}`);
        console.log(`  Date: ${assignment.date}`);
        console.log('');
      }
    });

    console.log('📊 Summary:');
    console.log(`  Total assignments checked: ${assignments.length}`);
    console.log(`  Unknown tasks: ${unknownTaskCount}`);
    console.log(`  Unknown workers: ${unknownWorkerCount}`);
    console.log(`  Properly populated: ${assignments.length - Math.max(unknownTaskCount, unknownWorkerCount)}`);

    if (unknownTaskCount > 0) {
      console.log('\n⚠️  Some tasks are missing from the Task collection');
      console.log('   Missing task IDs:', 
        assignments
          .filter(a => !taskMap.has(a.taskId))
          .map(a => a.taskId)
          .slice(0, 10)
      );
    }

    if (unknownWorkerCount > 0) {
      console.log('\n⚠️  Some employees are missing from the Employee collection');
      console.log('   Missing employee IDs:', 
        assignments
          .filter(a => !employeeMap.has(a.employeeId))
          .map(a => a.employeeId)
          .slice(0, 10)
      );
    }

    if (unknownTaskCount === 0 && unknownWorkerCount === 0) {
      console.log('\n✅ All assignments have proper task and worker data!');
    }

  } catch (error) {
    console.error('❌ Error testing task assignments:', error);
  }
};

const main = async () => {
  await connectDB();
  await testTaskAssignments();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});
