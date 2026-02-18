// Find correct employee for worker@gmail.com
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

async function findCorrectEmployee() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get user
    const user = await User.findOne({ email: 'worker@gmail.com' });
    console.log('User:', {
      id: user.id,
      userId: user.userId,
      employeeId: user.employeeId
    });

    // Find employee by userId
    const employee = await Employee.findOne({ userId: user.id });
    console.log('\nEmployee by userId:', employee ? {
      id: employee.id,
      fullName: employee.fullName,
      userId: employee.userId
    } : 'NOT FOUND');

    // Check what employeeId the old tasks use
    const oldTasks = await WorkerTaskAssignment.find({ assignmentId: { $in: [7034, 7035, 7036] } });
    console.log('\n📊 Old tasks employee IDs:');
    oldTasks.forEach(t => {
      console.log(`  - ${t.taskName}: employeeId = ${t.employeeId}`);
    });

    // Now update new tasks to use the same employeeId
    if (oldTasks.length > 0) {
      const correctEmployeeId = oldTasks[0].employeeId;
      console.log(`\n✅ Correct employeeId to use: ${correctEmployeeId}`);
      
      const result = await WorkerTaskAssignment.updateMany(
        { assignmentId: { $in: [7001, 7002] } },
        { $set: { employeeId: correctEmployeeId } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} tasks`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

findCorrectEmployee();
