// Seed Driver Data Script
// Inserts test data for driver1@gmail.com with all required relationships

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

// Driver credentials
const DRIVER_CREDENTIALS = {
  email: 'driver1@gmail.com',
  password: 'Anbu24@',
  name: 'John Driver',
  phone: '+1234567890',
};

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Define Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  role: String,
  employeeId: String,
  companyId: mongoose.Schema.Types.ObjectId,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const companySchema = new mongoose.Schema({
  name: String,
  role: String,
  isActive: { type: Boolean, default: true },
});

const driverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employeeId: String,
  licenseNumber: String,
  licenseClass: String,
  licenseIssueDate: Date,
  licenseExpiry: Date,
  licenseIssuingAuthority: String,
  yearsOfExperience: Number,
  specializations: [String],
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const vehicleSchema = new mongoose.Schema({
  registrationNo: { type: String, unique: true },
  vehicleType: String,
  model: String,
  capacity: Number,
  fuelType: String,
  currentDriverId: mongoose.Schema.Types.ObjectId,
  status: { type: String, default: 'active' },
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  mileage: Number,
  isActive: { type: Boolean, default: true },
});

const projectSchema = new mongoose.Schema({
  name: String,
  code: String,
  location: String,
  address: String,
  coordinates: {
    latitude: Number,
    longitude: Number,
  },
  status: { type: String, default: 'active' },
  startDate: Date,
  endDate: Date,
  companyId: mongoose.Schema.Types.ObjectId,
});

const transportTaskSchema = new mongoose.Schema({
  taskCode: String,
  driverId: mongoose.Schema.Types.ObjectId,
  vehicleId: mongoose.Schema.Types.ObjectId,
  projectId: mongoose.Schema.Types.ObjectId,
  taskDate: Date,
  pickupLocation: String,
  dropLocation: String,
  startTime: String,
  endTime: String,
  passengers: Number,
  status: { type: String, default: 'PLANNED' },
  actualStartTime: String,
  actualEndTime: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

// Models
const User = mongoose.model('User', userSchema);
const Company = mongoose.model('Company', companySchema);
const Driver = mongoose.model('Driver', driverSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const Project = mongoose.model('Project', projectSchema);
const TransportTask = mongoose.model('TransportTask', transportTaskSchema);

// Seed Data Functions
async function seedCompany() {
  console.log('\n📦 Seeding Company...');
  
  let company = await Company.findOne({ name: 'ABC Construction Ltd' });
  
  if (!company) {
    company = await Company.create({
      name: 'ABC Construction Ltd',
      role: 'DRIVER',
      isActive: true,
    });
    console.log('✅ Company created:', company.name);
  } else {
    console.log('ℹ️  Company already exists:', company.name);
  }
  
  return company;
}

async function seedUser(companyId) {
  console.log('\n👤 Seeding User...');
  
  let user = await User.findOne({ email: DRIVER_CREDENTIALS.email });
  
  if (!user) {
    const hashedPassword = await bcrypt.hash(DRIVER_CREDENTIALS.password, 10);
    
    user = await User.create({
      name: DRIVER_CREDENTIALS.name,
      email: DRIVER_CREDENTIALS.email,
      password: hashedPassword,
      phone: DRIVER_CREDENTIALS.phone,
      role: 'DRIVER',
      employeeId: 'EMP-DRV-001',
      companyId: companyId,
      isActive: true,
    });
    console.log('✅ User created:', user.email);
  } else {
    console.log('ℹ️  User already exists:', user.email);
  }
  
  return user;
}

async function seedDriver(userId) {
  console.log('\n🚗 Seeding Driver Profile...');
  
  let driver = await Driver.findOne({ userId: userId });
  
  if (!driver) {
    driver = await Driver.create({
      userId: userId,
      employeeId: 'EMP-DRV-001',
      licenseNumber: 'DL-2024-123456',
      licenseClass: 'Commercial',
      licenseIssueDate: new Date('2020-01-15'),
      licenseExpiry: new Date('2030-01-15'),
      licenseIssuingAuthority: 'State Transport Authority',
      yearsOfExperience: 5,
      specializations: ['Heavy Vehicle', 'Long Distance'],
      emergencyContact: {
        name: 'Jane Driver',
        relationship: 'Spouse',
        phone: '+1234567891',
      },
      isActive: true,
    });
    console.log('✅ Driver profile created');
  } else {
    console.log('ℹ️  Driver profile already exists');
  }
  
  return driver;
}

async function seedVehicle(driverId) {
  console.log('\n🚛 Seeding Vehicle...');
  
  let vehicle = await Vehicle.findOne({ registrationNo: 'ABC-1234' });
  
  if (!vehicle) {
    vehicle = await Vehicle.create({
      registrationNo: 'ABC-1234',
      vehicleType: 'Bus',
      model: 'Tata LP 1512',
      capacity: 40,
      fuelType: 'Diesel',
      currentDriverId: driverId,
      status: 'active',
      lastMaintenanceDate: new Date('2024-01-15'),
      nextMaintenanceDate: new Date('2024-04-15'),
      mileage: 45000,
      isActive: true,
    });
    console.log('✅ Vehicle created:', vehicle.registrationNo);
  } else {
    console.log('ℹ️  Vehicle already exists:', vehicle.registrationNo);
    // Update driver assignment
    vehicle.currentDriverId = driverId;
    await vehicle.save();
  }
  
  return vehicle;
}

async function seedProjects(companyId) {
  console.log('\n🏗️  Seeding Projects...');
  
  const projects = [
    {
      name: 'Downtown Office Complex',
      code: 'PROJ-001',
      location: 'Downtown',
      address: '123 Main Street, Downtown',
      coordinates: { latitude: 12.9716, longitude: 77.5946 },
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      companyId: companyId,
    },
    {
      name: 'Residential Tower A',
      code: 'PROJ-002',
      location: 'North District',
      address: '456 North Avenue, North District',
      coordinates: { latitude: 12.9816, longitude: 77.6046 },
      status: 'active',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2025-01-31'),
      companyId: companyId,
    },
    {
      name: 'Shopping Mall Expansion',
      code: 'PROJ-003',
      location: 'East Side',
      address: '789 East Boulevard, East Side',
      coordinates: { latitude: 12.9616, longitude: 77.6146 },
      status: 'active',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-11-30'),
      companyId: companyId,
    },
  ];
  
  const createdProjects = [];
  
  for (const projectData of projects) {
    let project = await Project.findOne({ code: projectData.code });
    
    if (!project) {
      project = await Project.create(projectData);
      console.log('✅ Project created:', project.name);
    } else {
      console.log('ℹ️  Project already exists:', project.name);
    }
    
    createdProjects.push(project);
  }
  
  return createdProjects;
}

async function seedTransportTasks(driverId, vehicleId, projects) {
  console.log('\n🚛 Seeding Transport Tasks...');
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const tasks = [
    {
      taskCode: `TASK-${Date.now()}-001`,
      driverId: driverId,
      vehicleId: vehicleId,
      projectId: projects[0]._id,
      taskDate: today,
      pickupLocation: 'Worker Dormitory A',
      dropLocation: projects[0].name,
      startTime: '07:00',
      endTime: '08:00',
      passengers: 25,
      status: 'PLANNED',
      notes: 'Morning shift pickup',
    },
    {
      taskCode: `TASK-${Date.now()}-002`,
      driverId: driverId,
      vehicleId: vehicleId,
      projectId: projects[1]._id,
      taskDate: today,
      pickupLocation: 'Worker Dormitory B',
      dropLocation: projects[1].name,
      startTime: '07:30',
      endTime: '08:30',
      passengers: 30,
      status: 'PLANNED',
      notes: 'Morning shift pickup - North site',
    },
    {
      taskCode: `TASK-${Date.now()}-003`,
      driverId: driverId,
      vehicleId: vehicleId,
      projectId: projects[0]._id,
      taskDate: today,
      pickupLocation: projects[0].name,
      dropLocation: 'Worker Dormitory A',
      startTime: '17:00',
      endTime: '18:00',
      passengers: 25,
      status: 'PLANNED',
      notes: 'Evening shift drop-off',
    },
    {
      taskCode: `TASK-${Date.now()}-004`,
      driverId: driverId,
      vehicleId: vehicleId,
      projectId: projects[2]._id,
      taskDate: tomorrow,
      pickupLocation: 'Worker Dormitory C',
      dropLocation: projects[2].name,
      startTime: '06:30',
      endTime: '07:30',
      passengers: 20,
      status: 'PLANNED',
      notes: 'Early morning shift - Mall expansion',
    },
  ];
  
  let createdCount = 0;
  
  for (const taskData of tasks) {
    const existingTask = await TransportTask.findOne({ taskCode: taskData.taskCode });
    
    if (!existingTask) {
      await TransportTask.create(taskData);
      createdCount++;
    }
  }
  
  console.log(`✅ Created ${createdCount} transport tasks`);
  
  // Show summary
  const totalTasks = await TransportTask.countDocuments({ driverId: driverId });
  console.log(`📊 Total transport tasks for driver: ${totalTasks}`);
}

// Main Seed Function
async function seedAll() {
  console.log('🌱 Starting data seeding for driver1@gmail.com...\n');
  console.log('=' .repeat(60));
  
  try {
    await connectDB();
    
    // Seed in order
    const company = await seedCompany();
    const user = await seedUser(company._id);
    const driver = await seedDriver(user._id);
    const vehicle = await seedVehicle(driver._id);
    const projects = await seedProjects(company._id);
    await seedTransportTasks(driver._id, vehicle._id, projects);
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Data seeding completed successfully!\n');
    
    console.log('📋 Summary:');
    console.log(`   Driver Email: ${DRIVER_CREDENTIALS.email}`);
    console.log(`   Driver Password: ${DRIVER_CREDENTIALS.password}`);
    console.log(`   Driver ID: ${driver._id}`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Employee ID: ${user.employeeId}`);
    console.log(`   Vehicle: ${vehicle.registrationNo}`);
    console.log(`   Projects: ${projects.length}`);
    console.log('\n🚀 You can now login with the driver credentials!');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run seeding
seedAll();
