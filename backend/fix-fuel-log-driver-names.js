/**
 * Script to fix driver names in existing fuel log entries
 * This script updates all fuel log entries that have "Unknown Driver" 
 * by looking up the correct name from the employees collection
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/constructionERP';

// Define schemas
const driverSchema = new mongoose.Schema({}, { strict: false, collection: 'drivers' });
const employeeSchema = new mongoose.Schema({}, { strict: false, collection: 'employees' });
const fuelLogSchema = new mongoose.Schema({}, { strict: false, collection: 'fuelLogs' });

const Driver = mongoose.model('Driver', driverSchema);
const Employee = mongoose.model('Employee', employeeSchema);
const FuelLog = mongoose.model('FuelLog', fuelLogSchema);

async function fixFuelLogDriverNames() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all fuel logs with "Unknown Driver"
    const fuelLogs = await FuelLog.find({
      $or: [
        { driverName: 'Unknown Driver' },
        { driverName: { $exists: false } },
        { driverName: null }
      ]
    });

    console.log(`\n📋 Found ${fuelLogs.length} fuel log entries to fix\n`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const fuelLog of fuelLogs) {
      try {
        console.log(`\n🔍 Processing fuel log ID: ${fuelLog.id || fuelLog._id}`);
        console.log(`   Driver ID: ${fuelLog.driverId}`);
        console.log(`   Current name: "${fuelLog.driverName}"`);

        // Find driver record
        const driver = await Driver.findOne({ id: fuelLog.driverId });
        
        if (!driver) {
          console.log(`   ❌ Driver not found for ID: ${fuelLog.driverId}`);
          failedCount++;
          continue;
        }

        console.log(`   ✅ Found driver record`);
        console.log(`   Employee ID: ${driver.employeeId}`);

        let driverName = 'Unknown Driver';

        // Get driver name from employees collection
        if (driver.employeeId) {
          const employee = await Employee.findOne({ id: driver.employeeId });
          
          if (employee) {
            driverName = employee.name || employee.fullName || 'Unknown Driver';
            console.log(`   ✅ Found employee: ${driverName}`);
          } else {
            console.log(`   ⚠️ Employee not found for ID: ${driver.employeeId}`);
            // Fallback to driver record
            driverName = driver.name || driver.username || 'Unknown Driver';
            console.log(`   📝 Using driver record name: ${driverName}`);
          }
        } else {
          console.log(`   ⚠️ Driver has no employeeId`);
          // Fallback to driver record
          driverName = driver.name || driver.username || 'Unknown Driver';
          console.log(`   📝 Using driver record name: ${driverName}`);
        }

        // Update fuel log
        if (driverName !== 'Unknown Driver') {
          await FuelLog.updateOne(
            { _id: fuelLog._id },
            { 
              $set: { 
                driverName: driverName,
                updatedAt: new Date()
              } 
            }
          );
          console.log(`   ✅ Updated to: "${driverName}"`);
          updatedCount++;
        } else {
          console.log(`   ⚠️ Could not find valid driver name`);
          failedCount++;
        }

      } catch (error) {
        console.error(`   ❌ Error processing fuel log:`, error.message);
        failedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total fuel logs processed: ${fuelLogs.length}`);
    console.log(`   ✅ Successfully updated: ${updatedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log('='.repeat(60) + '\n');

    // Show updated fuel logs
    console.log('📋 Updated fuel logs:');
    const updatedLogs = await FuelLog.find({
      driverName: { $ne: 'Unknown Driver' }
    }).limit(10);

    updatedLogs.forEach(log => {
      console.log(`   - ID: ${log.id}, Driver: ${log.driverName}, Date: ${log.date?.toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixFuelLogDriverNames();
