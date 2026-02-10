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
const Role = mongoose.model('Role', new mongoose.Schema({}, { strict: false }), 'roles');

async function checkDriverCredentials() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check for driver role
    const driverRole = await Role.findOne({ name: 'driver' });
    console.log('🎭 Driver Role:', driverRole ? `Found (ID: ${driverRole._id})` : '❌ NOT FOUND');

    // Check for driver users
    console.log('\n👤 Checking Driver Users:');
    console.log('='.repeat(60));

    const driverUsers = await User.find({ 
      role: driverRole?._id 
    }).select('email username isActive currentProjectId');

    if (driverUsers.length === 0) {
      console.log('❌ No driver users found in database');
    } else {
      for (const user of driverUsers) {
        console.log(`\n📧 Email: ${user.email}`);
        console.log(`   Username: ${user.username || 'N/A'}`);
        console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
        console.log(`   Project ID: ${user.currentProjectId || 'N/A'}`);
        
        // Check if password matches 'driver123'
        const fullUser = await User.findById(user._id);
        if (fullUser.password) {
          const isMatch = await bcrypt.compare('driver123', fullUser.password);
          console.log(`   Password 'driver123': ${isMatch ? '✅ MATCHES' : '❌ DOES NOT MATCH'}`);
        }

        // Check for linked employee
        const employee = await Employee.findOne({ userId: user._id });
        if (employee) {
          console.log(`   Employee: ${employee.name} (ID: ${employee.employeeId})`);
        } else {
          console.log(`   Employee: ❌ NOT LINKED`);
        }
      }
    }

    // Specifically check for driver1@gmail.com
    console.log('\n\n🔍 Checking Specific Driver (driver1@gmail.com):');
    console.log('='.repeat(60));
    
    const driver1 = await User.findOne({ email: 'driver1@gmail.com' });
    if (driver1) {
      console.log('✅ Found driver1@gmail.com');
      console.log(`   User ID: ${driver1._id}`);
      console.log(`   Active: ${driver1.isActive ? '✅' : '❌'}`);
      console.log(`   Role ID: ${driver1.role}`);
      
      const isMatch = await bcrypt.compare('driver123', driver1.password);
      console.log(`   Password 'driver123': ${isMatch ? '✅ MATCHES' : '❌ DOES NOT MATCH'}`);
      
      const employee = await Employee.findOne({ userId: driver1._id });
      if (employee) {
        console.log(`   Employee: ${employee.name} (ID: ${employee.employeeId})`);
        console.log(`   Project: ${employee.currentProjectId || 'N/A'}`);
      }
    } else {
      console.log('❌ driver1@gmail.com NOT FOUND in database');
      console.log('\n💡 You need to create this driver user first!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDriverCredentials();
