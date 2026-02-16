// Fix employee ID field to match backend expectations
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function fixEmployeeIdField() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the employee record for employeeId 107
    const employee = await Employee.findOne({ employeeId: 107 });
    
    if (!employee) {
      console.log('❌ Employee not found');
      
      // Check what employee records exist
      const employees = await Employee.find({ id: { $exists: true } }).limit(5);
      console.log('\n📊 Sample employees:');
      employees.forEach(emp => {
        console.log(`  - ID: ${emp.id}, EmployeeId: ${emp.employeeId}, Name: ${emp.fullName}`);
      });
      
      process.exit(1);
    }

    console.log('✅ Found employee:', {
      id: employee.id,
      employeeId: employee.employeeId,
      fullName: employee.fullName
    });

    // Update tasks 7001 and 7002 to use the correct employee.id field
    const result = await WorkerTaskAssignment.updateMany(
      { assignmentId: { $in: [7001, 7002] } },
      { 
        $set: { 
          employeeId: employee.id  // Use the MongoDB id field
        } 
      }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} tasks`);

    // Verify the update
    const tasks = await WorkerTaskAssignment.find({ assignmentId: { $in: [7001, 7002] } });
    console.log('\n📊 Verified tasks:');
    tasks.forEach(task => {
      console.log(`\n${task.taskName}`);
      console.log(`  Assignment ID: ${task.assignmentId}`);
      console.log(`  employeeId: ${task.employeeId}`);
      console.log(`  date: ${task.date}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

fixEmployeeIdField();
