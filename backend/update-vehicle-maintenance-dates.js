// Script to update vehicle maintenance dates in MongoDB
// Run this script to add lastServiceDate and nextServiceDate to vehicles

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/constructionERP';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Update vehicle maintenance dates
async function updateVehicleMaintenanceDates() {
  try {
    const db = mongoose.connection.db;
    
    // Try both possible collection names
    let vehiclesCollection = db.collection('fleetVehicles');
    let vehicle = await vehiclesCollection.findOne({ id: 1, companyId: 1 });
    
    if (!vehicle) {
      console.log('⚠️ Not found in fleetVehicles, trying fleetvehicles...');
      vehiclesCollection = db.collection('fleetvehicles');
      vehicle = await vehiclesCollection.findOne({ id: 1, companyId: 1 });
    }

    if (!vehicle) {
      console.log('❌ Vehicle with id: 1 not found in either collection');
      console.log('🔍 Searching for any vehicles...');
      
      // Try to find any vehicle
      const anyVehicle = await vehiclesCollection.findOne({});
      if (anyVehicle) {
        console.log('📋 Found a vehicle:', {
          id: anyVehicle.id,
          companyId: anyVehicle.companyId,
          vehicleCode: anyVehicle.vehicleCode,
          registrationNo: anyVehicle.registrationNo
        });
        console.log('💡 Update the script with the correct id and companyId');
      } else {
        console.log('❌ No vehicles found in database');
      }
      return;
    }

    console.log('📋 Current vehicle data:', {
      id: vehicle.id,
      vehicleCode: vehicle.vehicleCode,
      registrationNo: vehicle.registrationNo,
      lastServiceDate: vehicle.lastServiceDate,
      nextServiceDate: vehicle.nextServiceDate,
      odometer: vehicle.odometer
    });

    // Calculate dates
    const today = new Date();
    
    // Last service was 30 days ago
    const lastServiceDate = new Date(today);
    lastServiceDate.setDate(today.getDate() - 30);
    
    // Next service is in 60 days (90 days from last service)
    const nextServiceDate = new Date(today);
    nextServiceDate.setDate(today.getDate() + 60);

    // Update the vehicle
    const result = await vehiclesCollection.updateOne(
      { id: 1, companyId: 1 },
      {
        $set: {
          lastServiceDate: lastServiceDate,
          nextServiceDate: nextServiceDate,
          lastServiceMileage: vehicle.odometer - 5000, // Last service was 5000 km ago
          nextServiceMileage: vehicle.odometer + 5000, // Next service at +5000 km
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Vehicle maintenance dates updated successfully');
      
      // Fetch updated vehicle
      const updatedVehicle = await vehiclesCollection.findOne({ id: 1, companyId: 1 });
      console.log('\n📋 Updated vehicle data:', {
        id: updatedVehicle.id,
        vehicleCode: updatedVehicle.vehicleCode,
        registrationNo: updatedVehicle.registrationNo,
        lastServiceDate: updatedVehicle.lastServiceDate,
        nextServiceDate: updatedVehicle.nextServiceDate,
        lastServiceMileage: updatedVehicle.lastServiceMileage,
        nextServiceMileage: updatedVehicle.nextServiceMileage,
        currentOdometer: updatedVehicle.odometer
      });

      console.log('\n📅 Service Schedule:');
      console.log(`   Last Service: ${lastServiceDate.toLocaleDateString()} at ${updatedVehicle.lastServiceMileage?.toLocaleString()} km`);
      console.log(`   Next Service: ${nextServiceDate.toLocaleDateString()} at ${updatedVehicle.nextServiceMileage?.toLocaleString()} km`);
      console.log(`   Current Mileage: ${updatedVehicle.odometer?.toLocaleString()} km`);
      console.log(`   Days until next service: ${Math.ceil((nextServiceDate - today) / (1000 * 60 * 60 * 24))} days`);
      console.log(`   KM until next service: ${(updatedVehicle.nextServiceMileage - updatedVehicle.odometer)?.toLocaleString()} km`);
    } else {
      console.log('⚠️ No changes made to vehicle');
    }

  } catch (error) {
    console.error('❌ Error updating vehicle maintenance dates:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 Starting vehicle maintenance dates update...\n');
  
  await connectDB();
  await updateVehicleMaintenanceDates();
  
  console.log('\n✅ Script completed');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
