import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

async function debugAPIDetailed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const projectId = 1;
    
    // Simulate what the API does
    console.log('=== SIMULATING API LOGIC ===\n');
    
    // Step 1: Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('Step 1: Today date:', today.toISOString());

    // Step 2: Find active task assignments
    console.log('\nStep 2: Finding active task assignments...');
    const activeAssignments = await WorkerTaskAssignment.find({
      projectId: Number(projectId),
      date: { $gte: today },
      status: { $in: ['queued', 'in_progress'] }
    }).sort({ sequence: 1 });

    console.log(`Found ${activeAssignments.length} active assignments`);
    
    if (activeAssignments.length === 0) {
      console.log('❌ No assignments found - API would return empty array here');
      
      // Debug why
      console.log('\n=== DEBUGGING WHY NO ASSIGNMENTS ===\n');
      
      const allAssignments = await WorkerTaskAssignment.find({});
      console.log(`Total assignments in database: ${allAssignments.length}`);
      
      const project1Assignments = await WorkerTaskAssignment.find({ projectId: Number(projectId) });
      console.log(`Assignments for project ${projectId}: ${project1Assignments.length}`);
      
      if (project1Assignments.length > 0) {
        console.log('\nProject 1 assignments:');
        project1Assignments.forEach(a => {
          console.log(`  - ID: ${a.id}, Employee: ${a.employeeId}, Task: ${a.taskId}, Status: ${a.status}, Date: ${a.date}`);
        });
      }
      
      await mongoose.disconnect();
      return;
    }

    console.log('\nAssignments found:');
    activeAssignments.forEach(a => {
      console.log(`  - Assignment ${a.id}: Employee ${a.employeeId}, Task ${a.taskId}, Status: ${a.status}`);
    });

    // Step 3: Get unique task and employee IDs
    console.log('\nStep 3: Extracting unique IDs...');
    const taskIds = [...new Set(activeAssignments.map(a => a.taskId))];
    const employeeIds = [...new Set(activeAssignments.map(a => a.employeeId))];
    
    console.log(`Task IDs: [${taskIds.join(', ')}]`);
    console.log(`Employee IDs: [${employeeIds.join(', ')}]`);

    // Step 4: Fetch tasks and employees
    console.log('\nStep 4: Fetching tasks and employees...');
    
    const tasks = await Task.find({ id: { $in: taskIds } }).lean();
    console.log(`Tasks found: ${tasks.length}`);
    tasks.forEach(t => {
      console.log(`  - Task ${t.id}: ${t.taskName}`);
    });

    const employees = await Employee.find({ id: { $in: employeeIds } }).lean();
    console.log(`\nEmployees found: ${employees.length}`);
    employees.forEach(e => {
      console.log(`  - Employee ${e.id}: ${e.fullName}`);
    });

    // Step 5: Create lookup maps
    console.log('\nStep 5: Creating lookup maps...');
    const taskMap = tasks.reduce((map, task) => {
      map[task.id] = task;
      return map;
    }, {});

    const employeeMap = employees.reduce((map, emp) => {
      map[emp.id] = emp;
      return map;
    }, {});

    console.log('Task map keys:', Object.keys(taskMap));
    console.log('Employee map keys:', Object.keys(employeeMap));

    // Step 6: Build response
    console.log('\nStep 6: Building response...');
    const activeTasks = activeAssignments.map(assignment => {
      const task = taskMap[assignment.taskId];
      const employee = employeeMap[assignment.employeeId];

      console.log(`\n  Processing assignment ${assignment.id}:`);
      console.log(`    Task ${assignment.taskId}: ${task ? 'FOUND ✅' : 'NOT FOUND ❌'}`);
      console.log(`    Employee ${assignment.employeeId}: ${employee ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

      return {
        assignmentId: assignment.id,
        taskId: assignment.taskId,
        taskName: task?.taskName || 'Unknown Task',
        taskDescription: task?.description || '',
        employeeId: assignment.employeeId,
        workerName: employee?.fullName || 'Unknown Worker',
        status: assignment.status,
        sequence: assignment.sequence,
        startTime: assignment.startTime,
        endTime: assignment.endTime,
        workArea: assignment.workArea,
        floor: assignment.floor,
        zone: assignment.zone,
        priority: assignment.priority || 'MEDIUM',
        timeEstimate: assignment.timeEstimate,
        dailyTarget: assignment.dailyTarget,
        createdAt: assignment.createdAt
      };
    });

    console.log('\n=== FINAL RESULT ===\n');
    console.log(JSON.stringify({
      activeTasks,
      summary: {
        totalActive: activeTasks.length,
        queued: activeTasks.filter(t => t.status === 'queued').length,
        inProgress: activeTasks.filter(t => t.status === 'in_progress').length
      }
    }, null, 2));

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

debugAPIDetailed();
