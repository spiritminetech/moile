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

async function findSupervisorEmployee() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Look for employees with supervisor-like names
    const supervisorEmployees = await Employee.find({
      $or: [
        { fullName: { $regex: 'supervisor', $options: 'i' } },
        { jobTitle: { $regex: 'supervisor', $options: 'i' } },
        { fullName: { $regex: 'manager', $options: 'i' } }
      ]
    });

    console.log(`📊 Found ${supervisorEmployees.length} supervisor-like employees:`);
    supervisorEmployees.forEach((emp, idx) => {
      console.log(`\n${idx + 1}. Employee:`);
      console.log(`   ID: ${emp.id} (type: ${typeof emp.id})`);
      console.log(`   Name: ${emp.fullName}`);
      console.log(`   Job Title: ${emp.jobTitle}`);
      console.log(`   User ID: ${emp.userId}`);
      console.log(`   Company: ${emp.companyId}`);
    });

    // Also check employees without userId (might need linking)
    const employeesWithoutUser = await Employee.find({
      userId: { $exists: false }
    }).limit(5);

    console.log(`\n📊 Found ${employeesWithoutUser.length} employees without userId (first 5):`);
    employeesWithoutUser.forEach((emp, idx) => {
      console.log(`\n${idx + 1}. Employee:`);
      console.log(`   ID: ${emp.id} (type: ${typeof emp.id})`);
      console.log(`   Name: ${emp.fullName}`);
      console.log(`   Job Title: ${emp.jobTitle}`);
      console.log(`   Company: ${emp.companyId}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

findSupervisorEmployee();