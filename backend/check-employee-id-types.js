import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas without strict validation to see actual data
const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const Employee = mongoose.model('Employee', EmployeeSchema);

async function checkEmployeeIdTypes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check for employees with numeric IDs
    const numericIdEmployees = await Employee.find({
      id: { $type: "number" }
    }).limit(10);

    console.log(`📊 Found ${numericIdEmployees.length} employees with numeric ID:`);
    numericIdEmployees.forEach((emp, idx) => {
      console.log(`\n${idx + 1}. Employee:`);
      console.log(`   _id: ${emp._id}`);
      console.log(`   id: ${emp.id} (type: ${typeof emp.id})`);
      console.log(`   fullName: ${emp.fullName}`);
    });

    // Check for employees with string IDs
    const stringIdEmployees = await Employee.find({
      id: { $type: "string" }
    }).limit(10);

    console.log(`\n📊 Found ${stringIdEmployees.length} employees with string ID:`);
    stringIdEmployees.forEach((emp, idx) => {
      console.log(`\n${idx + 1}. Employee:`);
      console.log(`   _id: ${emp._id}`);
      console.log(`   id: ${emp.id} (type: ${typeof emp.id})`);
      console.log(`   fullName: ${emp.fullName}`);
    });

    // Check specific employee IDs from leave requests
    const leaveRequestEmployeeIds = [27, 63, 64, 1, 25, 22, 32, 4];
    console.log('\n🔍 Checking if employees exist with leave request employeeIds:');
    
    for (const empId of leaveRequestEmployeeIds) {
      const employee = await Employee.findOne({ id: empId });
      console.log(`   Employee ID ${empId}: ${employee ? '✅ EXISTS' : '❌ NOT FOUND'} ${employee ? `(${employee.fullName})` : ''}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Analysis complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkEmployeeIdTypes();