/**
 * Update Driver License Class
 * Adds licenseClass field to existing driver record
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DRIVER_ID = 50;

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

const driverSchema = new mongoose.Schema({
  id: Number,
  companyId: Number,
  employeeId: Number,
  employeeName: String,
  employeeCode: String,
  jobTitle: String,
  licenseNo: String,
  licenseClass: String,
  licenseIssueDate: Date,
  licenseExpiry: Date,
  licenseIssuingAuthority: String,
  licensePhotoUrl: String,
  vehicleId: Number,
  status: String,
  createdAt: Date,
  updatedAt: Date,
});

const Driver = mongoose.model('Driver', driverSchema);

async function updateDriverLicenseClass() {
  try {
    console.log('\n🔄 Updating driver license class...');
    
    const driver = await Driver.findOne({ id: DRIVER_ID });
    
    if (!driver) {
      console.log('⚠️  Driver not found with ID:', DRIVER_ID);
      return;
    }
    
    console.log('\n📊 Current Driver Data:');
    console.log(`   ID: ${driver.id}`);
    console.log(`   Name: ${driver.employeeName}`);
    console.log(`   License No: ${driver.licenseNo}`);
    console.log(`   License Class: ${driver.licenseClass || 'NOT SET'}`);
    console.log(`   License Expiry: ${driver.licenseExpiry?.toDateString() || 'NOT SET'}`);
    
    // Update driver with license class and other missing fields
    driver.licenseClass = 'Commercial';
    driver.licenseIssueDate = driver.licenseIssueDate || new Date('2020-01-15');
    driver.licenseIssuingAuthority = driver.licenseIssuingAuthority || 'State Transport Authority';
    driver.updatedAt = new Date();
    
    await driver.save();
    
    console.log('\n✅ Driver updated successfully!');
    console.log('\n📊 Updated Driver Data:');
    console.log(`   ID: ${driver.id}`);
    console.log(`   Name: ${driver.employeeName}`);
    console.log(`   License No: ${driver.licenseNo}`);
    console.log(`   License Class: ${driver.licenseClass}`);
    console.log(`   License Issue Date: ${driver.licenseIssueDate?.toDateString()}`);
    console.log(`   License Expiry: ${driver.licenseExpiry?.toDateString()}`);
    console.log(`   License Authority: ${driver.licenseIssuingAuthority}`);
    
  } catch (error) {
    console.error('❌ Error updating driver:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Driver License Class Update...');
  console.log(`🔑 Driver ID: ${DRIVER_ID}`);
  console.log('─'.repeat(60));

  try {
    await connectDB();
    await updateDriverLicenseClass();

    console.log('\n' + '─'.repeat(60));
    console.log('✅ Update completed successfully!');
    console.log('\n📱 Restart your backend and refresh mobile app to see:');
    console.log('   • License Class: Commercial');
    console.log('   • License Issue Date: Jan 15, 2020');
    console.log('   • License Authority: State Transport Authority');
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
