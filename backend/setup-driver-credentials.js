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

async function setupDriverCredentials() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check/Create driver role
    let driverRole = await Role.findOne({ name: 'driver' });
    if (!driverRole) {
      driverRole = await Role.create({
        name: 'driver',
        description: 'Driver role for transportation management',
        permissions: ['view_trips', 'update_trip_status', 'manage_passengers']
      });
      console.log('✅ Created driver role');
    } else {
      console.log('✅ Driver role exists');
    }

    // Setup driver1@gmail.com
    console.log('\n🚗 Setting up driver1@gmail.com...');
    console.log('='.repeat(70));
    
    let driver1 = await User.findOne({ email: 'driver1@gmail.com' });
    const hashedPassword = await bcrypt.hash('driver123', 10);
    
    if (driver1) {
      // Update existing user
      driver1.password = hashedPassword;
      driver1.role = driverRole._id;
      driver1.isActive = true;
      await driver1.save();
      console.log('✅ Updated driver1@gmail.com');
    } else {
      // Create new user
      driver1 = await User.create({
        email: 'driver1@gmail.com',
        password: hashedPassword,
        role: driverRole._id,
        isActive: true
      });
      console.log('✅ Created driver1@gmail.com');
    }

    console.log(`   Email: driver1@gmail.com`);
    console.log(`   Password: driver123`);
    console.log(`   User ID: ${driver1._id}`);
    console.log(`   Role: ${driverRole.name}`);

    // Check for employee link
    let employee1 = await Employee.findOne({ userId: driver1._id });
    if (!employee1) {
      // Check if there's an employee with driver role
      employee1 = await Employee.findOne({ 
        $or: [
          { email: 'driver1@gmail.com' },
          { role: /driver/i }
        ]
      });
      
      if (employee1 && !employee1.userId) {
        employee1.userId = driver1._id;
        await employee1.save();
        console.log(`   ✅ Linked to employee: ${employee1.name}`);
      } else {
        console.log('   ⚠️  No employee record linked (optional)');
      }
    } else {
      console.log(`   ✅ Linked to employee: ${employee1.name}`);
    }

    // Setup driver2@gmail.com
    console.log('\n🚗 Setting up driver2@gmail.com...');
    console.log('='.repeat(70));
    
    let driver2 = await User.findOne({ email: 'driver2@gmail.com' });
    
    if (driver2) {
      // Update existing user
      driver2.password = hashedPassword;
      driver2.role = driverRole._id;
      driver2.isActive = true;
      await driver2.save();
      console.log('✅ Updated driver2@gmail.com');
    } else {
      // Create new user
      driver2 = await User.create({
        email: 'driver2@gmail.com',
        password: hashedPassword,
        role: driverRole._id,
        isActive: true
      });
      console.log('✅ Created driver2@gmail.com');
    }

    console.log(`   Email: driver2@gmail.com`);
    console.log(`   Password: driver123`);
    console.log(`   User ID: ${driver2._id}`);
    console.log(`   Role: ${driverRole.name}`);

    // Verify login works
    console.log('\n\n🔐 Verifying Login...');
    console.log('='.repeat(70));
    
    const testUser = await User.findOne({ email: 'driver1@gmail.com' });
    const isPasswordCorrect = await bcrypt.compare('driver123', testUser.password);
    
    if (isPasswordCorrect) {
      console.log('✅ Login verification successful!');
      console.log('\n📱 You can now login with:');
      console.log('   Email: driver1@gmail.com');
      console.log('   Password: driver123');
      console.log('\n   OR');
      console.log('\n   Email: driver2@gmail.com');
      console.log('   Password: driver123');
    } else {
      console.log('❌ Login verification failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

setupDriverCredentials();
