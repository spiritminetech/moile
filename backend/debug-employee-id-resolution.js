// Debug employee ID resolution
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function debugEmployeeId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get user
    const user = await User.findOne({ email: 'worker@gmail.com' });
    console.log('User:', {
      id: user.id,
      userId: user.userId,
      employeeId: user.employeeId,
      _id: user._id
    });

    // Try to find employee by different ID fields
    console.log('\n🔍 Searching for employee...');
    
    const empById = await Employee.findOne({ id: user.employeeId });
    console.log('Employee by id field:', empById ? empById.id : 'NOT FOUND');
    
    const empByEmployeeId = await Employee.findOne({ employeeId: user.employeeId });
    console.log('Employee by employeeId field:', empByEmployeeId ? empByEmployeeId.employeeId : 'NOT FOUND');

    // Check what tasks exist for different employee ID values
    console.log('\n📊 Tasks by different employee ID fields:');
    
    const tasksByEmployeeId = await WorkerTaskAssignment.find({ employeeId: 107 });
    console.log(`Tasks with employeeId=107: ${tasksByEmployeeId.length}`);
    tasksByEmployeeId.forEach(t => console.log(`  - ${t.taskName} (${t.assignmentId})`));
    
    const tasksByIdField = await WorkerTaskAssignment.find({ id: 107 });
    console.log(`\nTasks with id=107: ${tasksByIdField.length}`);

    // Check today's date format
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📅 Today's date: ${today}`);
    
    const todayTasks = await WorkerTaskAssignment.find({ 
      employeeId: 107,
      date: today 
    });
    console.log(`Tasks for employee 107 on ${today}: ${todayTasks.length}`);
    todayTasks.forEach(t => console.log(`  - ${t.taskName} (${t.assignmentId})`));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

debugEmployeeId();
