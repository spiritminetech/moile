/**
 * Create user account for employeeId=2 (Ravi Smith)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
  password: String,
  employeeId: Number,
  role: String,
  companyId: Number,
  status: String,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'users' });

const Employee = mongoose.model('Employee', employeeSchema);
const User = mongoose.model('User', userSchema);

async function createUserForEmployee2() {
  try {
    console.log('🔧 Creating User Account for employeeId=2\n');
    console.log('=' .repeat(70));

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find employee
    console.log('1️⃣ Finding Employee...');
    const employee = await Employee.findOne({ id: 2 });
    
    if (!employee) {
      console.log('❌ Employee with id=2 not found!');
      return;
    }

    console.log('✅ Employee Found:');
    console.log('   ID:', employee.id);
    console.log('   Name:', employee.fullName);
    console.log('   Company ID:', employee.companyId);

    // Check if user already exists
    console.log('\n2️⃣ Checking for Existing User...');
    const existingUser = await User.findOne({ employeeId: 2 });
    
    if (existingUser) {
      console.log('⚠️  User already exists for employeeId=2');
      console.log('   Email:', existingUser.email);
      return;
    }

    // Get next user ID
    console.log('\n3️⃣ Creating User Account...');
    const lastUser = await User.findOne().sort({ id: -1 });
    const nextUserId = lastUser ? lastUser.id + 1 : 1;

    // Create email for the user
    const email = 'ravi.smith@gmail.com';
    
    // Check if email is already used
    const emailExists = await User.findOne({ email: email });
    if (emailExists) {
      console.log('⚠️  Email already in use:', email);
      console.log('   Using alternative email...');
      const altEmail = `ravi.smith${employee.id}@gmail.com`;
      console.log('   New email:', altEmail);
    }

    const finalEmail = emailExists ? `ravi.smith${employee.id}@gmail.com` : email;

    // Hash password
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      id: nextUserId,
      email: finalEmail,
      password: hashedPassword,
      employeeId: employee.id,
      role: 'WORKER',
      companyId: employee.companyId,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ User Created Successfully:');
    console.log('   User ID:', newUser.id);
    console.log('   Email:', newUser.email);
    console.log('   Password:', password);
    console.log('   Employee ID:', newUser.employeeId);
    console.log('   Role:', newUser.role);
    console.log('   Status:', newUser.status);

    // Update employee with email
    console.log('\n4️⃣ Updating Employee Record...');
    await Employee.updateOne(
      { id: employee.id },
      { $set: { email: finalEmail } }
    );
    console.log('✅ Employee email updated');

    // Summary
    console.log('\n' + '=' .repeat(70));
    console.log('📊 LOGIN CREDENTIALS');
    console.log('=' .repeat(70));
    console.log('   Email:', finalEmail);
    console.log('   Password:', password);
    console.log('   Employee ID:', employee.id);
    console.log('   Name:', employee.fullName);
    console.log('\n🧪 Test Login:');
    console.log('   1. node test-employee2-api.js');
    console.log('   2. Login in mobile app with above credentials');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createUserForEmployee2();
