import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false, collection: 'employees' }));
const Driver = mongoose.model('Driver', new mongoose.Schema({}, { strict: false, collection: 'drivers' }));
const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false, collection: 'projects' }));
const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({}, { strict: false, collection: 'vehicles' }));

async function createDriverAccount() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Driver credentials
    const driverEmail = 'driver@construction.com';
    const driverPassword = 'Driver@123';
    const driverName = 'Rajesh Kumar';
    
    console.log('📋 Creating driver account with:');
    console.log('   Email:', driverEmail);
    console.log('   Password:', driverPassword);
    console.log('   Name:', driverName);
    console.log('');

    // Check if already exists
    const existingUser = await User.findOne({ email: driverEmail });
    if (existingUser) {
      console.log('⚠️  User already exists, deleting old records...');
      await User.deleteOne({ email: driverEmail });
      await Employee.deleteOne({ email: driverEmail });
      await Driver.deleteOne({ email: driverEmail });
    }

    // Get a project to assign
    const project = await Project.findOne();
    if (!project) {
      console.log('❌ No projects found. Please create a project first.');
      return;
    }
    console.log('✅ Found project:', project.name, '(ID:', project._id, ')');

    // Get or create a vehicle
    let vehicle = await Vehicle.findOne();
    if (!vehicle) {
      console.log('📦 Creating sample vehicle...');
      vehicle = await Vehicle.create({
        vehicleNumber: 'KA-01-AB-1234',
        vehicleType: 'Bus',
        capacity: 30,
        status: 'active',
        company: project.company
      });
      console.log('✅ Vehicle created:', vehicle.vehicleNumber);
    } else {
      console.log('✅ Found vehicle:', vehicle.vehicleNumber);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(driverPassword, 10);

    // Generate unique employee ID
    const maxEmployee = await Employee.findOne({ id: { $type: 'number' } }).sort({ id: -1 });
    const newEmployeeId = maxEmployee && maxEmployee.id ? maxEmployee.id + 1 : 210;

    // Create Employee record
    console.log('\n📝 Creating Employee record...');
    const employee = await Employee.create({
      id: newEmployeeId,
      name: driverName,
      email: driverEmail,
      phone: '+91-9876543210',
      role: 'driver',
      company: project.company,
      projects: [project._id],
      status: 'active',
      dateOfJoining: new Date(),
      address: 'Bangalore, Karnataka',
      emergencyContact: {
        name: 'Sunita Kumar',
        phone: '+91-9876543211',
        relationship: 'Spouse'
      }
    });
    console.log('✅ Employee created with ID:', employee._id);

    // Create User record
    console.log('\n👤 Creating User record...');
    const user = await User.create({
      email: driverEmail,
      password: hashedPassword,
      name: driverName,
      role: 'driver',
      employeeId: employee._id,
      currentProject: project._id,
      permissions: {
        canViewTrips: true,
        canManageTrips: true,
        canViewVehicles: true,
        canReportIncidents: true
      }
    });
    console.log('✅ User created with ID:', user._id);

    // Create Driver record
    console.log('\n🚗 Creating Driver record...');
    const driver = await Driver.create({
      employeeId: employee._id,
      userId: user._id,
      name: driverName,
      email: driverEmail,
      phone: '+91-9876543210',
      licenseNumber: 'KA-1234567890',
      licenseType: 'Commercial',
      licenseExpiry: new Date('2026-12-31'),
      vehicleAssigned: vehicle._id,
      vehicleNumber: vehicle.vehicleNumber,
      status: 'active',
      company: project.company,
      projects: [project._id],
      experience: 8,
      rating: 4.5,
      totalTrips: 0,
      address: 'Bangalore, Karnataka',
      emergencyContact: {
        name: 'Sunita Kumar',
        phone: '+91-9876543211',
        relationship: 'Spouse'
      }
    });
    console.log('✅ Driver created with ID:', driver._id);

    // Update vehicle with driver assignment
    await Vehicle.updateOne(
      { _id: vehicle._id },
      { 
        $set: { 
          assignedDriver: driver._id,
          driverName: driverName
        } 
      }
    );
    console.log('✅ Vehicle updated with driver assignment');

    // Verification
    console.log('\n🔍 VERIFICATION:');
    const verifyUser = await User.findOne({ email: driverEmail });
    const verifyEmployee = await Employee.findOne({ email: driverEmail });
    const verifyDriver = await Driver.findOne({ email: driverEmail });
    
    console.log('   User exists:', !!verifyUser ? '✅' : '❌');
    console.log('   Employee exists:', !!verifyEmployee ? '✅' : '❌');
    console.log('   Driver exists:', !!verifyDriver ? '✅' : '❌');

    console.log('\n✅ DRIVER ACCOUNT CREATED SUCCESSFULLY!');
    console.log('\n📱 LOGIN CREDENTIALS:');
    console.log('   Email:', driverEmail);
    console.log('   Password:', driverPassword);
    console.log('\n📊 ACCOUNT DETAILS:');
    console.log('   Name:', driverName);
    console.log('   Role: Driver');
    console.log('   License:', driver.licenseNumber);
    console.log('   Vehicle:', vehicle.vehicleNumber);
    console.log('   Project:', project.name);
    console.log('   Employee ID:', employee._id);
    console.log('   User ID:', user._id);
    console.log('   Driver ID:', driver._id);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

createDriverAccount();
