// Update employee name from Ravi Kumar to Ravi Smith

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function updateEmployeeNameToRaviSmith() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Update employee record
    const employee = await Employee.findOneAndUpdate(
      { employeeId: 107 },
      { $set: { name: 'Ravi Smith' } },
      { new: true }
    );

    if (employee) {
      console.log(`✅ Updated employee name to: ${employee.name}\n`);
    } else {
      console.log('❌ Employee 107 not found\n');
    }

    // Update all task assignments
    const result = await WorkerTaskAssignment.updateMany(
      { employeeId: 107 },
      { $set: { employeeName: 'Ravi Smith' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} task assignments\n`);
    console.log('✅ All done! Employee name is now "Ravi Smith"');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateEmployeeNameToRaviSmith();
