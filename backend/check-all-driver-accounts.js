import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');

async function checkAllDriverAccounts() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find all users with 'driver' in email or role field
    const driverUsers = await User.find({
      $or: [
        { email: /driver/i },
        { role: 'DRIVER' },
        { role: 'driver' }
      ]
    }).select('email role isActive currentProjectId');

    console.log('🚗 All Driver Accounts Found:');
    console.log('='.repeat(70));

    if (driverUsers.length === 0) {
      console.log('❌ No driver accounts found');
    } else {
      for (const user of driverUsers) {
        console.log(`\n📧 Email: ${user.email}`);
        console.log(`   User ID: ${user._id}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
        console.log(`   Project ID: ${user.currentProjectId || 'N/A'}`);
        
        // Test common passwords
        const fullUser = await User.findById(user._id);
        const testPasswords = ['driver123', 'password', '123456', 'driver', 'Driver123'];
        
        console.log('   Testing passwords:');
        for (const pwd of testPasswords) {
          const isMatch = await bcrypt.compare(pwd, fullUser.password);
          if (isMatch) {
            console.log(`   ✅ Password is: "${pwd}"`);
            break;
          }
        }

        // Check for linked employee
        const employee = await Employee.findOne({ userId: user._id });
        if (employee) {
          console.log(`   Employee: ${employee.name} (ID: ${employee.employeeId})`);
          console.log(`   Employee Project: ${employee.currentProjectId || 'N/A'}`);
        } else {
          console.log(`   Employee: ❌ NOT LINKED`);
        }
      }
    }

    console.log('\n\n📋 Summary:');
    console.log('='.repeat(70));
    console.log(`Total driver accounts found: ${driverUsers.length}`);
    console.log('\nRecommended login credentials:');
    console.log('Email: driver1@gmail.com or driver2@gmail.com');
    console.log('Password: (check output above for working password)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllDriverAccounts();
