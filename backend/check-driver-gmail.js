import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const Driver = mongoose.model('Driver', new mongoose.Schema({}, { strict: false, collection: 'drivers' }));

async function checkDriverAccount() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check User collection
    console.log('🔍 Checking User collection for driver@gmail.com...');
    const user = await User.findOne({ email: 'driver@gmail.com' });
    
    if (user) {
      console.log('✅ User found:');
      console.log('   - ID:', user._id);
      console.log('   - Email:', user.email);
      console.log('   - Role:', user.role);
      console.log('   - Name:', user.name);
      console.log('   - Has Password:', !!user.password);
      console.log('   - Employee ID:', user.employeeId);
      console.log('   - Current Project:', user.currentProject);
    } else {
      console.log('❌ User NOT found in users collection');
    }

    // Check Employee collection
    console.log('\n🔍 Checking Employee collection...');
    const employee = await Employee.findOne({ email: 'driver@gmail.com' });
    
    if (employee) {
      console.log('✅ Employee found:');
      console.log('   - ID:', employee._id);
      console.log('   - Email:', employee.email);
      console.log('   - Name:', employee.name);
      console.log('   - Role:', employee.role);
      console.log('   - Company:', employee.company);
      console.log('   - Projects:', employee.projects);
    } else {
      console.log('❌ Employee NOT found in employees collection');
    }

    // Check Driver collection
    console.log('\n🔍 Checking Driver collection...');
    const driver = await Driver.findOne({ email: 'driver@gmail.com' });
    
    if (driver) {
      console.log('✅ Driver found:');
      console.log('   - ID:', driver._id);
      console.log('   - Email:', driver.email);
      console.log('   - Name:', driver.name);
      console.log('   - License Number:', driver.licenseNumber);
      console.log('   - Vehicle Assigned:', driver.vehicleAssigned);
    } else {
      console.log('❌ Driver NOT found in drivers collection');
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('   User exists:', !!user ? '✅ YES' : '❌ NO');
    console.log('   Employee exists:', !!employee ? '✅ YES' : '❌ NO');
    console.log('   Driver exists:', !!driver ? '✅ YES' : '❌ NO');
    
    if (user || employee || driver) {
      console.log('\n✅ driver@gmail.com account is AVAILABLE in the system');
    } else {
      console.log('\n❌ driver@gmail.com account is NOT AVAILABLE - needs to be created');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkDriverAccount();
