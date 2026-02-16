// Check Available Workers
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

async function checkWorkers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all employees
    const employees = await Employee.find({ role: 'worker' }).limit(10);
    console.log(`📊 Found ${employees.length} workers:\n`);
    
    for (const emp of employees) {
      console.log(`Employee ID: ${emp.employeeId}`);
      console.log(`Name: ${emp.name}`);
      console.log(`Email: ${emp.email || 'N/A'}`);
      console.log(`Role: ${emp.role}`);
      console.log('---');
    }

    // Find users with worker role
    console.log('\n👤 Users with worker role:');
    const users = await User.find({ role: 'worker' }).limit(10);
    for (const user of users) {
      console.log(`User ID: ${user.userId}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Employee ID: ${user.employeeId || 'N/A'}`);
      console.log('---');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkWorkers();
