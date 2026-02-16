import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDateFormatIssue() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workerTaskAssignment' }));

    // Check what the controller is querying
    const today = '2026-02-15';
    console.log('🔍 Query 1: Using string date "2026-02-15"...');
    const tasks1 = await WorkerTaskAssignment.find({ 
      employeeId: 2, 
      date: today 
    }).lean();
    console.log(`   Found ${tasks1.length} tasks\n`);
    tasks1.forEach(task => {
      console.log(`   - ${task.taskName || 'Unnamed'} (ID: ${task.id}, Date: ${task.date}, Type: ${typeof task.date})`);
    });

    // Check with Date object
    console.log('\n🔍 Query 2: Using Date object...');
    const dateObj = new Date('2026-02-15');
    const tasks2 = await WorkerTaskAssignment.find({ 
      employeeId: 2, 
      date: dateObj 
    }).lean();
    console.log(`   Found ${tasks2.length} tasks\n`);
    tasks2.forEach(task => {
      console.log(`   - ${task.taskName || 'Unnamed'} (ID: ${task.id})`);
    });

    // Check ALL tasks for employeeId 2 and see their date types
    console.log('\n🔍 Checking ALL tasks for employeeId: 2...');
    const allTasks = await WorkerTaskAssignment.find({ employeeId: 2 }).lean();
    console.log(`   Found ${allTasks.length} tasks total\n`);
    
    console.log('   Date field analysis:');
    const dateTypes = {};
    allTasks.forEach(task => {
      const dateType = typeof task.date;
      const dateValue = task.date instanceof Date ? task.date.toISOString() : task.date;
      if (!dateTypes[dateType]) {
        dateTypes[dateType] = [];
      }
      dateTypes[dateType].push({ id: task.id, date: dateValue, taskName: task.taskName });
    });
    
    Object.keys(dateTypes).forEach(type => {
      console.log(`\n   Type: ${type} (${dateTypes[type].length} tasks)`);
      dateTypes[type].slice(0, 3).forEach(task => {
        console.log(`     - ID: ${task.id}, Date: ${task.date}, Name: ${task.taskName || 'Unnamed'}`);
      });
    });

    // Now let's check if there are tasks with IDs 84394, 84395, 3 ANYWHERE
    console.log('\n\n🔍 Searching for tasks with IDs 84394, 84395, 3 in ANY collection...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const col of collections) {
      if (col.name.toLowerCase().includes('task') || col.name.toLowerCase().includes('assignment')) {
        const Model = mongoose.model(`Check_${col.name}`, new mongoose.Schema({}, { strict: false, collection: col.name }));
        const found = await Model.find({ id: { $in: [84394, 84395, 3] } }).lean();
        if (found.length > 0) {
          console.log(`\n   ✅ Found in "${col.name}":`);
          found.forEach(task => {
            console.log(`      - ${task.taskName || 'Unnamed'} (ID: ${task.id}, EmployeeID: ${task.employeeId})`);
          });
        }
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDateFormatIssue();
