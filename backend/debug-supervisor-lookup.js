import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas without strict validation to see actual data
const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', UserSchema);

const EmployeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const Employee = mongoose.model('Employee', EmployeeSchema);

async function debugSupervisorLookup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Simulate the login process
    const user = await User.findOne({ email: 'supervisor@gmail.com' });
    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      idType: typeof user.id
    });

    // Simulate the supervisor lookup in getPendingApprovalsSummary
    console.log('\n🔍 Looking for supervisor employee with userId:', user.id);
    
    // Try different query approaches
    const supervisor1 = await Employee.findOne({ userId: user.id }).lean();
    console.log('Query 1 - { userId: user.id }:', supervisor1 ? 'FOUND' : 'NOT FOUND');
    
    const supervisor2 = await Employee.findOne({ userId: user.id.toString() }).lean();
    console.log('Query 2 - { userId: user.id.toString() }:', supervisor2 ? 'FOUND' : 'NOT FOUND');
    
    // Check what userId values exist in employees
    const employeesWithUserId = await Employee.find({ 
      userId: { $exists: true, $ne: null } 
    }).limit(5);
    
    console.log('\n👷 Employees with userId (first 5):');
    employeesWithUserId.forEach((emp, idx) => {
      console.log(`${idx + 1}. ${emp.fullName}: userId=${emp.userId} (type: ${typeof emp.userId})`);
    });

    // Check if our specific employee exists
    const ourEmployee = await Employee.findOne({ 
      fullName: "Supervisor Gmail" 
    });
    
    if (ourEmployee) {
      console.log('\n🎯 Our "Supervisor Gmail" employee:');
      console.log(`   ID: ${ourEmployee.id}`);
      console.log(`   Name: ${ourEmployee.fullName}`);
      console.log(`   UserId: ${ourEmployee.userId} (type: ${typeof ourEmployee.userId})`);
      console.log(`   Expected UserId: ${user.id} (type: ${typeof user.id})`);
      console.log(`   Match: ${ourEmployee.userId === user.id ? 'YES' : 'NO'}`);
      console.log(`   String Match: ${ourEmployee.userId.toString() === user.id.toString() ? 'YES' : 'NO'}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Debug complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

debugSupervisorLookup();