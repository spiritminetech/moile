/**
 * Find login credentials for employeeId=2
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

const employeeSchema = new mongoose.Schema({
  id: Number,
  fullName: String,
  email: String,
  phone: String,
  jobTitle: String,
  status: String,
  companyId: Number
}, { collection: 'employees' });

const userSchema = new mongoose.Schema({
  id: Number,
  email: String,
  employeeId: Number,
  role: String,
  companyId: Number,
  status: String
}, { collection: 'users' });

const Employee = mongoose.model('Employee', employeeSchema);
const User = mongoose.model('User', userSchema);

async function findEmployee2Credentials() {
  try {
    console.log('🔍 Finding Login Credentials for employeeId=2\n');
    console.log('=' .repeat(70));

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find employee
    console.log('1️⃣ Finding Employee Record...');
    const employee = await Employee.findOne({ id: 2 });
    
    if (!employee) {
      console.log('❌ Employee with id=2 not found!');
      return;
    }

    console.log('✅ Employee Found:');
    console.log('   ID:', employee.id);
    console.log('   Name:', employee.fullName);
    console.log('   Email:', employee.email || 'NOT SET');
    console.log('   Phone:', employee.phone || 'NOT SET');
    console.log('   Job Title:', employee.jobTitle);
    console.log('   Status:', employee.status);
    console.log('   Company ID:', employee.companyId);

    // Find user account
    console.log('\n2️⃣ Finding User Account...');
    const user = await User.findOne({ employeeId: 2 });

    if (!user) {
      console.log('❌ No user account found for employeeId=2');
      console.log('\n💡 Need to create a user account for this employee');
      console.log('   Options:');
      console.log('   1. Create user with employee email');
      console.log('   2. Link existing user to this employee');
      
      // Check if there's a user with the employee's email
      if (employee.email) {
        const userByEmail = await User.findOne({ email: employee.email });
        if (userByEmail) {
          console.log('\n   Found user with same email:');
          console.log('   User ID:', userByEmail.id);
          console.log('   Email:', userByEmail.email);
          console.log('   EmployeeId:', userByEmail.employeeId || 'NOT SET');
          console.log('   Role:', userByEmail.role);
          
          if (!userByEmail.employeeId) {
            console.log('\n   💡 This user can be linked to employeeId=2');
          }
        }
      }
      
      return;
    }

    console.log('✅ User Account Found:');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Employee ID:', user.employeeId);
    console.log('   Role:', user.role);
    console.log('   Company ID:', user.companyId);
    console.log('   Status:', user.status);

    // Summary
    console.log('\n' + '=' .repeat(70));
    console.log('📊 LOGIN CREDENTIALS');
    console.log('=' .repeat(70));
    console.log('   Email:', user.email);
    console.log('   Password: password123 (default)');
    console.log('   Employee ID:', user.employeeId);
    console.log('   Name:', employee.fullName);
    console.log('\n🧪 Test Login:');
    console.log('   node test-employee2-api.js');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

findEmployee2Credentials();
