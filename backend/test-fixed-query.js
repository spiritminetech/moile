import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

async function testFixedQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const projectId = 1;
    
    console.log('=== TESTING FIXED QUERY ===\n');
    
    // Get today's date in YYYY-MM-DD format (the fix)
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    console.log(`Today's date string: ${todayString}`);
    console.log(`Query: projectId=${projectId}, date >= "${todayString}", status in ['queued', 'in_progress']\n`);

    // Find active task assignments using string comparison
    const activeAssignments = await WorkerTaskAssignment.find({
      projectId: Number(projectId),
      date: { $gte: todayString },
      status: { $in: ['queued', 'in_progress'] }
    }).sort({ sequence: 1 });

    console.log(`✅ Found ${activeAssignments.length} active assignments\n`);

    if (activeAssignments.length === 0) {
      console.log('❌ Still no results! Let me check what dates exist...\n');
      
      const allProject1 = await WorkerTaskAssignment.find({ projectId: 1 });
      console.log('All project 1 assignments:');
      allProject1.forEach(a => {
        console.log(`  - ID: ${a.id}, Date: "${a.date}", Status: ${a.status}, Date >= today? ${a.date >= todayString}`);
      });
      
      await mongoose.disconnect();
      return;
    }

    // Get task and employee details
    const taskIds = [...new Set(activeAssignments.map(a => a.taskId))];
    const employeeIds = [...new Set(activeAssignments.map(a => a.employeeId))];

    const [tasks, employees] = await Promise.all([
      Task.find({ id: { $in: taskIds } }).lean(),
      Employee.find({ id: { $in: employeeIds } }).lean()
    ]);

    console.log(`Tasks found: ${tasks.length}`);
    console.log(`Employees found: ${employees.length}\n`);

    // Create lookup maps
    const taskMap = tasks.reduce((map, task) => {
      map[task.id] = task;
      return map;
    }, {});

    const employeeMap = employees.reduce((map, emp) => {
      map[emp.id] = emp;
      return map;
    }, {});

    // Build response
    const activeTasks = activeAssignments.map(assignment => {
      const task = taskMap[assignment.taskId];
      const employee = employeeMap[assignment.employeeId];

      return {
        assignmentId: assignment.id,
        taskId: assignment.taskId,
        taskName: task?.taskName || 'Unknown Task',
        employeeId: assignment.employeeId,
        workerName: employee?.fullName || 'Unknown Worker',
        status: assignment.status,
        sequence: assignment.sequence,
        dailyTarget: assignment.dailyTarget
      };
    });

    console.log('=== RESULT ===\n');
    console.log(JSON.stringify({
      activeTasks,
      summary: {
        totalActive: activeTasks.length,
        queued: activeTasks.filter(t => t.status === 'queued').length,
        inProgress: activeTasks.filter(t => t.status === 'in_progress').length
      }
    }, null, 2));

    console.log('\n✅ Fix is working! The API should return this data after server restart.');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testFixedQuery();
