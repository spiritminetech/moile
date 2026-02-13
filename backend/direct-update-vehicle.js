// Direct MongoDB update - Simple version
// This will definitely work

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/constructionERP';

async function directUpdate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // List all collections to find the right one
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Available collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));

    // Try to find vehicle in any collection with "vehicle" in name
    for (const col of collections) {
      if (col.name.toLowerCase().includes('vehicle')) {
        console.log(`\n🔍 Checking collection: ${col.name}`);
        const collection = db.collection(col.name);
        
        const vehicle = await collection.findOne({ registrationNo: "ABC123" });
        if (vehicle) {
          console.log('✅ Found vehicle:', {
            id: vehicle.id,
            companyId: vehicle.companyId,
            vehicleCode: vehicle.vehicleCode,
            registrationNo: vehicle.registrationNo,
            odometer: vehicle.odometer
          });

          // Calculate dates
          const today = new Date();
          const lastServiceDate = new Date(today);
          lastServiceDate.setDate(today.getDate() - 30); // 30 days ago
          
          const nextServiceDate = new Date(today);
          nextServiceDate.setDate(today.getDate() + 60); // 60 days from now

          console.log('\n📅 Updating with:');
          console.log(`   Last Service: ${lastServiceDate.toISOString()}`);
          console.log(`   Next Service: ${nextServiceDate.toISOString()}`);
          console.log(`   Last Service Mileage: ${vehicle.odometer - 5000} km`);
          console.log(`   Next Service Mileage: ${vehicle.odometer + 5000} km`);

          // Update the vehicle
          const result = await collection.updateOne(
            { registrationNo: "ABC123" },
            {
              $set: {
                lastServiceDate: lastServiceDate,
                nextServiceDate: nextServiceDate,
                lastServiceMileage: vehicle.odometer - 5000,
                nextServiceMileage: vehicle.odometer + 5000,
                updatedAt: new Date()
              }
            }
          );

          console.log('\n✅ Update result:', {
            matched: result.matchedCount,
            modified: result.modifiedCount
          });

          if (result.modifiedCount > 0) {
            // Verify the update
            const updated = await collection.findOne({ registrationNo: "ABC123" });
            console.log('\n✅ Verified updated vehicle:');
            console.log(JSON.stringify({
              id: updated.id,
              registrationNo: updated.registrationNo,
              odometer: updated.odometer,
              lastServiceDate: updated.lastServiceDate,
              nextServiceDate: updated.nextServiceDate,
              lastServiceMileage: updated.lastServiceMileage,
              nextServiceMileage: updated.nextServiceMileage
            }, null, 2));
          }

          break;
        }
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

directUpdate();
