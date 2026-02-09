/**
 * Insert Driver Data Script
 * Inserts complete data for driverId: 50, employeeId: 50
 * Email: driver1@gmail.com, Password: Anbu24@
 * 
 * Covers all driver screens:
 * 1. Dashboard
 * 2. Transport Tasks
 * 3. Attendance
 * 4. Trip Updates
 * 5. Vehicle Info
 * 6. Profile
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection string - use same as backend
const MONGODB_URI = process.env.MONGODB_URI;

// Driver credentials
const DRIVER_EMAIL = 'driver1@gmail.com';
const DRIVER_PASSWORD = 'Anbu24@';
const DRIVER_ID = 50;
const EMPLOYEE_ID = 50;

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('\n⚠️  Please ensure MongoDB is running:');
    console.error('   Windows: net start MongoDB');
    console.error('   macOS: brew services start mongodb-community');
    console.error('   Linux: sudo systemctl start mongod');
    console.error('\n   Or check if MongoDB is installed and the connection string is correct.');
    process.exit(1);
  }
}

// Define Schemas
const userSchema = new mongoose.Schema({
  id: Number,
  name: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  employeeId: String,
  companyId: Number,
  companyName: String,
  employmentStatus: String,
  profileImage: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const vehicleSchema = new mongoose.Schema({
  id: Number,
  companyId: Number,
  vehicleCode: String,
  registrationNo: String,
  vehicleType: String,
  capacity: Number,
  status: String,
  insuranceExpiry: Date,
  lastServiceDate: Date,
  odometer: Number,
  fuelType: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const fleetTaskSchema = new mongoose.Schema({
  id: Number,
  companyId: Number,
  projectId: Number,
  driverId: Number,
  vehicleId: Number,
  taskDate: Date,
  plannedPickupTime: Date,
  plannedDropTime: Date,
  pickupLocation: String,
  pickupAddress: String,
  dropLocation: String,
  dropAddress: String,
  expectedPassengers: Number,
  actualStartTime: Date,
  actualEndTime: Date,
  routeLog: Array,
  status: String,
  notes: String,
  createdBy: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const attendanceSchema = new mongoose.Schema({
  id: Number,
  employeeId: Number,
  date: Date,
  checkInTime: Date,
  checkOutTime: Date,
  totalHours: Number,
  status: String,
  vehicleId: Number,
  location: {
    latitude: Number,
    longitude: Number,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const tripRecordSchema = new mongoose.Schema({
  tripId: Number,
  taskId: Number,
  driverId: Number,
  vehicleId: Number,
  vehicleNumber: String,
  date: Date,
  startTime: Date,
  endTime: Date,
  totalDistance: Number,
  totalHours: Number,
  fuelUsed: Number,
  workersTransported: Number,
  status: String,
  delays: [{
    reason: String,
    duration: Number,
    location: String,
  }],
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const maintenanceAlertSchema = new mongoose.Schema({
  alertId: Number,
  vehicleId: Number,
  vehiclePlateNumber: String,
  alertType: String,
  severity: String,
  description: String,
  dueDate: Date,
  status: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const driverLicenseSchema = new mongoose.Schema({
  driverId: Number,
  licenseNumber: String,
  licenseClass: String,
  licenseIssueDate: Date,
  licenseExpiry: Date,
  licenseIssuingAuthority: String,
  licensePhotoUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create Models
const User = mongoose.model('User', userSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema, 'fleetVehicles');
const FleetTask = mongoose.model('FleetTask', fleetTaskSchema, 'fleetTasks');
const Attendance = mongoose.model('Attendance', attendanceSchema);
const TripRecord = mongoose.model('TripRecord', tripRecordSchema);
const MaintenanceAlert = mongoose.model('MaintenanceAlert', maintenanceAlertSchema);
const DriverLicense = mongoose.model('DriverLicense', driverLicenseSchema);

// Insert Data Functions
async function insertDriverUser() {
  console.log('\n📝 Inserting Driver User...');
  
  const hashedPassword = await bcrypt.hash(DRIVER_PASSWORD, 10);
  
  const driverUser = {
    id: DRIVER_ID,
    name: 'John Driver',
    email: DRIVER_EMAIL,
    password: hashedPassword,
    role: 'DRIVER',
    phone: '+1234567890',
    employeeId: `EMP${EMPLOYEE_ID}`,
    companyId: 1,
    companyName: 'ABC Construction Ltd',
    employmentStatus: 'Active',
    profileImage: null,
  };

  await User.findOneAndUpdate(
    { id: DRIVER_ID },
    driverUser,
    { upsert: true, new: true }
  );

  console.log('✅ Driver user inserted:', driverUser.email);
}

async function insertVehicle() {
  console.log('\n🚗 Inserting Vehicle...');
  
  const vehicle = {
    id: 101,
    companyId: 1,
    vehicleCode: 'VEH-101',
    registrationNo: 'ABC-1234',
    vehicleType: 'Van',
    capacity: 12,
    status: 'AVAILABLE',
    insuranceExpiry: new Date('2024-12-31'),
    lastServiceDate: new Date('2024-01-15'),
    odometer: 45000,
    fuelType: 'Diesel',
  };

  await Vehicle.findOneAndUpdate(
    { id: 101 },
    vehicle,
    { upsert: true, new: true }
  );

  console.log('✅ Vehicle inserted:', vehicle.registrationNo);
}

async function insertTransportTasks() {
  console.log('\n🚛 Inserting Transport Tasks...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks = [
    {
      id: 10001,
      companyId: 1,
      projectId: 201,
      driverId: DRIVER_ID,
      vehicleId: 101,
      taskDate: today,
      plannedPickupTime: new Date(today.getTime() + 7 * 60 * 60 * 1000), // 7:00 AM
      plannedDropTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
      pickupLocation: 'Worker Dormitory A',
      pickupAddress: '123 Main St, City',
      dropLocation: 'Construction Site Alpha',
      dropAddress: '456 Project Rd, City',
      expectedPassengers: 10,
      status: 'PLANNED',
      notes: 'Morning pickup - Site Alpha Development',
      createdBy: 1,
    },
    {
      id: 10002,
      companyId: 1,
      projectId: 201,
      driverId: DRIVER_ID,
      vehicleId: 101,
      taskDate: today,
      plannedPickupTime: new Date(today.getTime() + 7.5 * 60 * 60 * 1000), // 7:30 AM
      plannedDropTime: new Date(today.getTime() + 8.5 * 60 * 60 * 1000), // 8:30 AM
      pickupLocation: 'Worker Dormitory B',
      pickupAddress: '789 Second Ave, City',
      dropLocation: 'Construction Site Alpha',
      dropAddress: '456 Project Rd, City',
      expectedPassengers: 8,
      status: 'PLANNED',
      notes: 'Morning pickup - Site Alpha Development',
      createdBy: 1,
    },
    {
      id: 10003,
      companyId: 1,
      projectId: 201,
      driverId: DRIVER_ID,
      vehicleId: 101,
      taskDate: today,
      plannedPickupTime: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5:00 PM
      plannedDropTime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6:00 PM
      pickupLocation: 'Construction Site Alpha',
      pickupAddress: '456 Project Rd, City',
      dropLocation: 'Worker Dormitory A',
      dropAddress: '123 Main St, City',
      expectedPassengers: 10,
      status: 'PLANNED',
      notes: 'Evening drop - Return to dormitory',
      createdBy: 1,
    },
  ];

  for (const task of tasks) {
    await FleetTask.findOneAndUpdate(
      { id: task.id },
      task,
      { upsert: true, new: true }
    );
    console.log(`✅ Transport task inserted: ${task.pickupLocation} → ${task.dropLocation}`);
  }
}

async function insertAttendanceRecords() {
  console.log('\n⏰ Inserting Attendance Records...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Today's attendance (checked in, not checked out yet)
  const todayAttendance = {
    id: 5001,
    employeeId: EMPLOYEE_ID,
    date: today,
    checkInTime: new Date(today.getTime() + 7 * 60 * 60 * 1000), // 7:00 AM
    checkOutTime: null,
    totalHours: 0,
    status: 'CHECKED_IN',
    vehicleId: 101,
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
    },
  };

  await Attendance.findOneAndUpdate(
    { id: 5001 },
    todayAttendance,
    { upsert: true, new: true }
  );
  console.log('✅ Today\'s attendance inserted');

  // Past 7 days attendance history
  for (let i = 1; i <= 7; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - i);

    const attendance = {
      id: 5000 + i + 1,
      employeeId: EMPLOYEE_ID,
      date: pastDate,
      checkInTime: new Date(pastDate.getTime() + 7 * 60 * 60 * 1000), // 7:00 AM
      checkOutTime: new Date(pastDate.getTime() + 17 * 60 * 60 * 1000), // 5:00 PM
      totalHours: 10,
      status: 'COMPLETED',
      vehicleId: 101,
      location: {
        latitude: 12.9716,
        longitude: 77.5946,
      },
    };

    await Attendance.findOneAndUpdate(
      { id: attendance.id },
      attendance,
      { upsert: true, new: true }
    );
  }
  console.log('✅ Past 7 days attendance inserted');
}

async function insertTripRecords() {
  console.log('\n🗺️ Inserting Trip Records...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Past 10 days trip history
  for (let i = 1; i <= 10; i++) {
    const tripDate = new Date(today);
    tripDate.setDate(tripDate.getDate() - i);

    const trip = {
      tripId: 6000 + i,
      taskId: 1000 + i,
      driverId: DRIVER_ID,
      vehicleId: 101,
      vehicleNumber: 'ABC-1234',
      date: tripDate,
      startTime: new Date(tripDate.getTime() + 7 * 60 * 60 * 1000),
      endTime: new Date(tripDate.getTime() + 18 * 60 * 60 * 1000),
      totalDistance: 45.5 + (i * 2),
      totalHours: 11,
      fuelUsed: 8.5 + (i * 0.5),
      workersTransported: 18,
      status: 'COMPLETED',
      delays: i % 3 === 0 ? [{
        reason: 'Traffic jam',
        duration: 15,
        location: 'Highway Junction',
      }] : [],
      notes: `Trip completed successfully on ${tripDate.toDateString()}`,
    };

    await TripRecord.findOneAndUpdate(
      { tripId: trip.tripId },
      trip,
      { upsert: true, new: true }
    );
  }
  console.log('✅ Past 10 days trip records inserted');
}

async function insertMaintenanceAlerts() {
  console.log('\n🔧 Inserting Maintenance Alerts...');
  
  const alerts = [
    {
      alertId: 7001,
      vehicleId: 101,
      vehiclePlateNumber: 'ABC-1234',
      alertType: 'Scheduled Service',
      severity: 'MEDIUM',
      description: 'Regular maintenance service due in 15 days',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    },
    {
      alertId: 7002,
      vehicleId: 101,
      vehiclePlateNumber: 'ABC-1234',
      alertType: 'Insurance Renewal',
      severity: 'HIGH',
      description: 'Vehicle insurance expires in 30 days',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    },
    {
      alertId: 7003,
      vehicleId: 101,
      vehiclePlateNumber: 'ABC-1234',
      alertType: 'Tire Replacement',
      severity: 'LOW',
      description: 'Front tires showing wear, replacement recommended',
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    },
  ];

  for (const alert of alerts) {
    await MaintenanceAlert.findOneAndUpdate(
      { alertId: alert.alertId },
      alert,
      { upsert: true, new: true }
    );
    console.log(`✅ Maintenance alert inserted: ${alert.alertType}`);
  }
}

async function insertDriverLicense() {
  console.log('\n📄 Inserting Driver License...');
  
  const license = {
    driverId: DRIVER_ID,
    licenseNumber: 'DL-2024-123456',
    licenseClass: 'Commercial',
    licenseIssueDate: new Date('2020-01-15'),
    licenseExpiry: new Date('2025-01-15'),
    licenseIssuingAuthority: 'State Transport Authority',
    licensePhotoUrl: null,
  };

  await DriverLicense.findOneAndUpdate(
    { driverId: DRIVER_ID },
    license,
    { upsert: true, new: true }
  );

  console.log('✅ Driver license inserted:', license.licenseNumber);
}

// Main execution function
async function main() {
  console.log('🚀 Starting Driver Data Insertion Script...');
  console.log(`📧 Driver Email: ${DRIVER_EMAIL}`);
  console.log(`🔑 Driver ID: ${DRIVER_ID}`);
  console.log(`👤 Employee ID: ${EMPLOYEE_ID}`);
  console.log('─'.repeat(60));

  try {
    await connectDB();

    // Insert all data
    await insertDriverUser();
    await insertVehicle();
    await insertTransportTasks();
    await insertAttendanceRecords();
    await insertTripRecords();
    await insertMaintenanceAlerts();
    await insertDriverLicense();

    console.log('\n' + '─'.repeat(60));
    console.log('✅ All driver data inserted successfully!');
    console.log('\n📊 Summary:');
    console.log('  • Driver User: 1');
    console.log('  • Vehicle: 1');
    console.log('  • Transport Tasks: 3 (today)');
    console.log('  • Attendance Records: 8 (today + 7 days history)');
    console.log('  • Trip Records: 10 (past 10 days)');
    console.log('  • Maintenance Alerts: 3');
    console.log('  • Driver License: 1');
    console.log('\n🎉 You can now login with:');
    console.log(`   Email: ${DRIVER_EMAIL}`);
    console.log(`   Password: ${DRIVER_PASSWORD}`);
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('\n❌ Error inserting data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run the script
main();
