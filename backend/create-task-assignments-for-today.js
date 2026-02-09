import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function createTaskAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));
    const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false, collection: 'tasks' }));

    // Get employees
    const employees = await Employee.find().limit(10);
    console.log(`📊 Found ${employees.length} employees\n`);

    // Get or create a task
    let task = await Task.findOne({ projectId: 1 });
    if (!task) {
      task = await Task.findOne();
    }
    
    if (!task) {
      console.log('Creating a sample task...');
      task = await Task.create({
        taskName: 'General Construction Work',
        projectId: 1,
        status: 'active',
        createdAt: new Date()
      });
    }
    
    console.log(`✅ Using task: ${task.taskName} (ID: ${task._id})\n`);

    // Use actual today (2026-02-08)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];
    
    console.log(`🗓️  Today is: ${todayString}`);

    console.log(`📅 Creating assignments for: ${todayString}\n`);

    // Create assignments
    let created = 0;
    for (let i = 0; i < employees.length; i++) {
      try {
        await WorkerTaskAssignment.create({
          employeeId: employees[i]._id,
          projectId: 1,
          taskId: task._id,
          date: todayString,
          status: 'queued',
          sequence: i + 1,
          createdAt: new Date()
        });
        created++;
        console.log(`✅ Created assignment for employee ${i + 1}`);
      } catch (err) {
        console.log(`⚠️  Assignment already exists for employee ${i + 1}`);
      }
    }

    console.log(`\n✅ Created ${created} new task assignments`);
    console.log('\n🔄 Now run: node fix-attendance-data-for-api.js');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Done');
  }
}

createTaskAssignments();
