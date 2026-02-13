import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FleetTaskPassenger from './src/modules/fleetTask/submodules/fleetTaskPassenger/FleetTaskPassenger.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Fix duplicate passenger IDs and verify data integrity
 */
const fixDuplicatePassengerIds = async () => {
  try {
    console.log('🔍 Checking for duplicate passenger IDs...\n');
    
    // Find all passengers for task 10003
    const passengers = await FleetTaskPassenger.find({
      fleetTaskId: 10003
    }).sort({ _id: 1 });
    
    console.log(`📊 Found ${passengers.length} passengers for task 10003:\n`);
    
    // Check for duplicates
    const idCounts = {};
    passengers.forEach(p => {
      idCounts[p.id] = (idCounts[p.id] || 0) + 1;
    });
    
    const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log('❌ DUPLICATE IDs FOUND:');
      duplicates.forEach(([id, count]) => {
        console.log(`   ID ${id} appears ${count} times`);
      });
      console.log('');
      
      // Fix duplicates by assigning new unique IDs
      console.log('🔧 Fixing duplicate IDs...\n');
      
      // Get the highest existing ID
      const allPassengers = await FleetTaskPassenger.find({}).sort({ id: -1 }).limit(1);
      let nextId = allPassengers.length > 0 ? allPassengers[0].id + 1 : 9000;
      
      for (const [duplicateId, count] of duplicates) {
        const dupes = await FleetTaskPassenger.find({ id: Number(duplicateId) }).sort({ _id: 1 });
        
        // Keep the first one, update the rest
        for (let i = 1; i < dupes.length; i++) {
          const oldId = dupes[i].id;
          const newId = nextId++;
          
          console.log(`   Updating passenger:`);
          console.log(`      MongoDB _id: ${dupes[i]._id}`);
          console.log(`      Old id: ${oldId}`);
          console.log(`      New id: ${newId}`);
          console.log(`      Worker: ${dupes[i].workerEmployeeId}`);
          
          await FleetTaskPassenger.updateOne(
            { _id: dupes[i]._id },
            { $set: { id: newId } }
          );
        }
      }
      
      console.log('\n✅ Duplicate IDs fixed!\n');
    } else {
      console.log('✅ No duplicate IDs found\n');
    }
    
    // Display current state
    const updatedPassengers = await FleetTaskPassenger.find({
      fleetTaskId: 10003
    }).sort({ workerEmployeeId: 1 });
    
    console.log('📋 Current passenger records for task 10003:\n');
    updatedPassengers.forEach(p => {
      console.log(`   Passenger ID: ${p.id}`);
      console.log(`   Worker Employee ID: ${p.workerEmployeeId}`);
      console.log(`   Pickup Status: ${p.pickupStatus}`);
      console.log(`   Drop Status: ${p.dropStatus}`);
      console.log(`   Pickup Confirmed: ${p.pickupConfirmedAt || 'Not confirmed'}`);
      console.log(`   Drop Confirmed: ${p.dropConfirmedAt || 'Not confirmed'}`);
      console.log('');
    });
    
    // Check if statuses need to be updated
    const needsUpdate = updatedPassengers.some(p => 
      p.pickupConfirmedAt && p.pickupStatus !== 'confirmed' ||
      p.dropConfirmedAt && p.dropStatus !== 'confirmed'
    );
    
    if (needsUpdate) {
      console.log('⚠️  INCONSISTENCY DETECTED:');
      console.log('   Some passengers have confirmation timestamps but status is still "pending"');
      console.log('   This means the status update failed.\n');
      
      console.log('🔧 Fixing status inconsistencies...\n');
      
      for (const p of updatedPassengers) {
        const updates = {};
        
        if (p.pickupConfirmedAt && p.pickupStatus !== 'confirmed') {
          updates.pickupStatus = 'confirmed';
          console.log(`   Setting pickupStatus to "confirmed" for worker ${p.workerEmployeeId}`);
        }
        
        if (p.dropConfirmedAt && p.dropStatus !== 'confirmed') {
          updates.dropStatus = 'confirmed';
          console.log(`   Setting dropStatus to "confirmed" for worker ${p.workerEmployeeId}`);
        }
        
        if (Object.keys(updates).length > 0) {
          await FleetTaskPassenger.updateOne(
            { _id: p._id },
            { $set: updates }
          );
        }
      }
      
      console.log('\n✅ Status inconsistencies fixed!\n');
      
      // Display final state
      const finalPassengers = await FleetTaskPassenger.find({
        fleetTaskId: 10003
      }).sort({ workerEmployeeId: 1 });
      
      console.log('📋 FINAL passenger records for task 10003:\n');
      finalPassengers.forEach(p => {
        console.log(`   Worker ${p.workerEmployeeId}:`);
        console.log(`      Passenger ID: ${p.id}`);
        console.log(`      Pickup: ${p.pickupStatus} ${p.pickupConfirmedAt ? '✅' : '❌'}`);
        console.log(`      Drop: ${p.dropStatus} ${p.dropConfirmedAt ? '✅' : '❌'}`);
        console.log('');
      });
    } else {
      console.log('✅ All statuses are consistent with timestamps\n');
    }
    
  } catch (error) {
    console.error('❌ Error fixing passenger records:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await fixDuplicatePassengerIds();
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  process.exit(0);
};

main();
