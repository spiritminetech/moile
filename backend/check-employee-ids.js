import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');

async function checkEmployeeIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const employees = await Employee.find({}).sort({ id: -1 }).limit(10);
    
    console.log('📋 Last 10 employees by id field:');
    console.log('='.repeat(60));
    for (const emp of employees) {
      console.log(`ID: ${emp.id}, EmployeeID: ${emp.employeeId}, Name: ${emp.name}, Role: ${emp.role}`);
    }

    const employeesByEmpId = await Employee.find({}).sort({ employeeId: -1 }).limit(10);
    
    console.log('\n📋 Last 10 employees by employeeId field:');
    console.log('='.repeat(60));
    for (const emp of employeesByEmpId) {
      console.log(`ID: ${emp.id}, EmployeeID: ${emp.employeeId}, Name: ${emp.name}, Role: ${emp.role}`);
    }

    const maxId = await Employee.findOne({ id: { $type: 'number' } }).sort({ id: -1 });
    const maxEmpId = await Employee.findOne({ employeeId: { $type: 'number' } }).sort({ employeeId: -1 });
    
    console.log('\n📊 Max values:');
    console.log(`   Max id: ${maxId?.id || 'N/A'}`);
    console.log(`   Max employeeId: ${maxEmpId?.employeeId || 'N/A'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkEmployeeIds();
