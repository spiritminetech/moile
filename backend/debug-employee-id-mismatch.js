import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const Employee = mongoose.model('Employee', EmployeeSchema);

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' });
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

async function debugIdMismatch() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = '2026-02-08';
    const projectId = 1;

    // Get task assignments
    const assignments = await WorkerTaskAssignment.find({
      projectId: projectId,
      date: today
    }).limit(3);

    console.log('📋 Task Assignments (first 3):');
    assignments.forEach((a, idx) => {
      console.log(`\n${idx + 1}. Assignment:`);
      console.log(`   _id: ${a._id}`);
      console.log(`   employeeId: ${a.employeeId} (type: ${typeof a.employeeId})`);
      console.log(`   projectId: ${a.projectId}`);
      console.log(`   date: ${a.date}`);
    });

    // Get employees
    const employees = await Employee.find({ projectId: 1 }).limit(3);
    
    console.log('\n\n👷 Employees (first 3):');
    employees.forEach((e, idx) => {
      console.log(`\n${idx + 1}. Employee:`);
      console.log(`   _id: ${e._id} (MongoDB ObjectId)`);
      console.log(`   id: ${e.id} (numeric field, if exists)`);
      console.log(`   name: ${e.name || 'No name'}`);
      console.log(`   projectId: ${e.projectId}`);
    });

    // Check what the API is trying to match
    console.log('\n\n🔍 API Matching Logic:');
    console.log('The API does:');
    console.log('1. Get assignments with employeeId (currently MongoDB _id)');
    console.log('2. Look up employees where id (numeric) is in employeeIds array');
    console.log('\n❌ MISMATCH: employeeId in assignments is ObjectId, but API looks for numeric id');

    // Check if employees have numeric id field
    const employeeWithId = await Employee.findOne({ id: { $exists: true } });
    console.log(`\n📊 Do employees have numeric 'id' field? ${employeeWithId ? 'YES' : 'NO'}`);

    if (!employeeWithId) {
      console.log('\n⚠️  PROBLEM IDENTIFIED:');
      console.log('   - Employees don\'t have numeric id field');
      console.log('   - Task assignments use MongoDB _id');
      console.log('   - API expects numeric id');
      console.log('\n💡 SOLUTION: Add numeric id field to employees OR update assignments to use numeric id');
    }

    await mongoose.disconnect();
    console.log('\n👋 Done\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

debugIdMismatch();
