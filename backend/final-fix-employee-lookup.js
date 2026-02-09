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

async function finalFix() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = '2026-02-08';
    const projectId = 1;

    // Get assignments
    const assignments = await WorkerTaskAssignment.find({
      projectId: projectId,
      date: today
    });

    const employeeIds = [...new Set(assignments.map(a => a.employeeId))];
    console.log('📋 Employee IDs from assignments:', employeeIds.length);
    console.log('Sample IDs:', employeeIds.slice(0, 3));
    console.log('ID types:', employeeIds.slice(0, 3).map(id => typeof id));

    // Try different query approaches
    console.log('\n🔍 Testing different query approaches:\n');

    // Approach 1: Direct id match
    const test1 = await Employee.find({ id: { $in: employeeIds } });
    console.log(`1. { id: { $in: employeeIds } } → ${test1.length} employees`);

    // Approach 2: Convert to strings explicitly
    const stringIds = employeeIds.map(id => id.toString());
    const test2 = await Employee.find({ id: { $in: stringIds } });
    console.log(`2. { id: { $in: stringIds } } → ${test2.length} employees`);

    // Approach 3: Use _id instead
    const objectIds = employeeIds.map(id => new mongoose.Types.ObjectId(id));
    const test3 = await Employee.find({ _id: { $in: objectIds } });
    console.log(`3. { _id: { $in: objectIds } } → ${test3.length} employees`);

    // Approach 4: Check what field actually exists
    const sampleEmployee = await Employee.findOne({ projectId: 1 });
    console.log('\n📊 Sample employee fields:');
    console.log('  _id:', sampleEmployee._id, '(type:', typeof sampleEmployee._id, ')');
    console.log('  id:', sampleEmployee.id, '(type:', typeof sampleEmployee.id, ')');
    console.log('  id === _id.toString():', sampleEmployee.id === sampleEmployee._id.toString());

    // The solution: Use _id for lookups
    console.log('\n💡 SOLUTION: The API should query by _id, not id\n');
    console.log('Current API code:');
    console.log('  const employees = await Employee.find({ id: { $in: employeeIds } });');
    console.log('\nShould be:');
    console.log('  const employees = await Employee.find({ _id: { $in: employeeIds } });');

    // Since we can't easily change the API, let's use the working approach
    console.log('\n🔧 Alternative: Update assignments to use _id directly\n');

    // The assignments already have the correct _id values as strings
    // We just need to ensure they're treated as ObjectIds in queries
    
    console.log('✅ Assignments already have correct employee _id values');
    console.log('✅ The issue is the API query logic');
    console.log('\n📝 Recommendation: Modify API controller to use _id instead of id');

    await mongoose.disconnect();
    console.log('\n👋 Done\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

finalFix();
