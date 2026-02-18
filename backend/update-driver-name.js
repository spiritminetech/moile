import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');

async function updateDriverName() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the driver employee
    const driver = await Employee.findOne({ 
      email: 'driver1@gmail.com',
      employeeId: 50
    });

    if (!driver) {
      console.log('❌ Driver employee not found');
      return;
    }

    console.log('👤 Current driver data:');
    console.log(`   name: ${driver.name}`);
    console.log(`   fullName: ${driver.fullName}`);
    console.log(`   employeeId: ${driver.employeeId}\n`);

    // Update the driver name
    await Employee.updateOne(
      { _id: driver._id },
      { 
        $set: { 
          name: 'Rajesh Kumar',
          fullName: 'Rajesh Kumar',
          employeeId: 50,
          email: 'driver1@gmail.com',
          role: 'driver',
          isActive: true
        } 
      }
    );

    console.log('✅ Updated driver name to: Rajesh Kumar\n');

    // Verify
    const updatedDriver = await Employee.findOne({ _id: driver._id });
    console.log('📊 Verification:');
    console.log(`   name: ${updatedDriver.name}`);
    console.log(`   fullName: ${updatedDriver.fullName}`);
    console.log(`   employeeId: ${updatedDriver.employeeId}`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Driver name updated');
    console.log('='.repeat(60));
    console.log(`\n📱 Login: driver1@gmail.com / Password123@`);
    console.log(`\n✅ Restart the mobile app to see "Rajesh Kumar" instead of "John Driver"`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

updateDriverName();
