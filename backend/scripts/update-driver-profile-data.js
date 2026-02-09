/**
 * Update Driver Profile Data
 * Adds/updates Employee and Company data for driver profile
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DRIVER_ID = 50;
const COMPANY_ID = 1;

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Define schemas
const employeeSchema = new mongoose.Schema({
  id: Number,
  companyId: Number,
  fullName: String,
  employeeCode: String,
  phone: String,
  email: String,
  status: String,
  drivingLicenseNumber: String,
  licenseNumber: String,
  licenseClass: String,
  licenseType: String,
  licenseIssueDate: Date,
  licenseExpiry: Date,
  licenseIssuingAuthority: String,
  licensePhotoUrl: String,
  yearsOfExperience: Number,
  specializations: Array,
  photoUrl: String,
  photo_url: String,
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
  },
  certifications: Array,
  safetyScore: Number,
  customerRating: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const companySchema = new mongoose.Schema({
  id: Number,
  name: String,
  code: String,
  address: String,
  phone: String,
  email: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Employee = mongoose.model('Employee', employeeSchema);
const Company = mongoose.model('Company', companySchema);

async function updateDriverEmployee() {
  console.log('\n👤 Updating Driver Employee Data...');
  
  const employeeData = {
    id: DRIVER_ID,
    companyId: COMPANY_ID,
    fullName: 'John Driver',
    employeeCode: `EMP${DRIVER_ID}`,
    phone: '+1234567890',
    email: 'driver1@gmail.com',
    status: 'ACTIVE',
    drivingLicenseNumber: 'DL-2024-123456',
    licenseNumber: 'DL-2024-123456',
    licenseClass: 'Commercial',
    licenseType: 'Commercial',
    licenseIssueDate: new Date('2020-01-15'),
    licenseExpiry: new Date('2025-01-15'),
    licenseIssuingAuthority: 'State Transport Authority',
    licensePhotoUrl: null,
    yearsOfExperience: 5,
    specializations: ['Van', 'Bus', 'Heavy Vehicle'],
    photoUrl: null,
    photo_url: null,
    emergencyContact: {
      name: 'Jane Driver',
      relationship: 'Spouse',
      phone: '+1234567891',
    },
    certifications: [
      {
        id: 1,
        name: 'Defensive Driving',
        issuer: 'Safety Institute',
        issueDate: new Date('2023-01-01'),
        expiryDate: new Date('2025-01-01'),
        status: 'active'
      },
      {
        id: 2,
        name: 'First Aid',
        issuer: 'Red Cross',
        issueDate: new Date('2023-06-01'),
        expiryDate: new Date('2025-06-01'),
        status: 'active'
      }
    ],
    safetyScore: 95,
    customerRating: 4.5,
    updatedAt: new Date(),
  };

  const result = await Employee.findOneAndUpdate(
    { id: DRIVER_ID },
    employeeData,
    { upsert: true, new: true }
  );

  console.log('✅ Driver employee data updated');
  console.log(`   Name: ${result.fullName}`);
  console.log(`   Employee Code: ${result.employeeCode}`);
  console.log(`   License: ${result.licenseNumber}`);
  console.log(`   License Class: ${result.licenseClass}`);
  console.log(`   License Expiry: ${result.licenseExpiry?.toDateString()}`);
}

async function updateCompany() {
  console.log('\n🏢 Updating Company Data...');
  
  const companyData = {
    id: COMPANY_ID,
    name: 'ABC Construction Ltd',
    code: 'ABC001',
    address: '123 Business Park, City',
    phone: '+1234567800',
    email: 'info@abcconstruction.com',
    status: 'ACTIVE',
    updatedAt: new Date(),
  };

  const result = await Company.findOneAndUpdate(
    { id: COMPANY_ID },
    companyData,
    { upsert: true, new: true }
  );

  console.log('✅ Company data updated');
  console.log(`   Name: ${result.name}`);
  console.log(`   Code: ${result.code}`);
}

async function verifyData() {
  console.log('\n🔍 Verifying Profile Data...');
  
  const employee = await Employee.findOne({ id: DRIVER_ID });
  const company = await Company.findOne({ id: COMPANY_ID });
  
  console.log('\n📊 Employee Data:');
  console.log(`   ✅ Full Name: ${employee?.fullName || 'NOT FOUND'}`);
  console.log(`   ✅ Employee Code: ${employee?.employeeCode || 'NOT FOUND'}`);
  console.log(`   ✅ License Number: ${employee?.licenseNumber || 'NOT FOUND'}`);
  console.log(`   ✅ License Class: ${employee?.licenseClass || 'NOT FOUND'}`);
  console.log(`   ✅ License Expiry: ${employee?.licenseExpiry?.toDateString() || 'NOT FOUND'}`);
  console.log(`   ✅ Emergency Contact: ${employee?.emergencyContact?.name || 'NOT FOUND'}`);
  console.log(`   ✅ Certifications: ${employee?.certifications?.length || 0}`);
  
  console.log('\n📊 Company Data:');
  console.log(`   ✅ Company Name: ${company?.name || 'NOT FOUND'}`);
  console.log(`   ✅ Company Code: ${company?.code || 'NOT FOUND'}`);
  
  if (!employee) {
    console.log('\n⚠️  WARNING: Employee data not found!');
  }
  
  if (!company) {
    console.log('\n⚠️  WARNING: Company data not found!');
  }
}

async function main() {
  console.log('🚀 Starting Driver Profile Data Update...');
  console.log(`🔑 Driver ID: ${DRIVER_ID}`);
  console.log(`🏢 Company ID: ${COMPANY_ID}`);
  console.log('─'.repeat(60));

  try {
    await connectDB();
    await updateDriverEmployee();
    await updateCompany();
    await verifyData();

    console.log('\n' + '─'.repeat(60));
    console.log('✅ Profile data update completed successfully!');
    console.log('\n📱 Refresh your mobile app to see updated profile data:');
    console.log('   • Company Name: ABC Construction Ltd');
    console.log('   • License Number: DL-2024-123456');
    console.log('   • License Class: Commercial');
    console.log('   • License Expiry: Jan 15, 2025');
    console.log('   • Emergency Contact: Jane Driver (Spouse)');
    console.log('   • Certifications: 2');
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

main();
