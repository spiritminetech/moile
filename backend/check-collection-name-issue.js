import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function checkCollectionNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('📋 All collections in database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    // Check for fleet task collections specifically
    const fleetCollections = collections.filter(col => 
      col.name.toLowerCase().includes('fleet')
    );

    console.log('\n🚗 Fleet-related collections:');
    if (fleetCollections.length === 0) {
      console.log('   ⚠️  No fleet collections found!');
    } else {
      fleetCollections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }

    // Try to count documents in both possible collection names
    console.log('\n📊 Document counts:');
    
    try {
      const FleetTaskLower = mongoose.model('FleetTaskLower', new mongoose.Schema({}, { strict: false }), 'fleettasks');
      const countLower = await FleetTaskLower.countDocuments();
      console.log(`   fleettasks (lowercase): ${countLower} documents`);
    } catch (err) {
      console.log(`   fleettasks (lowercase): Error - ${err.message}`);
    }

    try {
      const FleetTaskCamel = mongoose.model('FleetTaskCamel', new mongoose.Schema({}, { strict: false }), 'fleetTasks');
      const countCamel = await FleetTaskCamel.countDocuments();
      console.log(`   fleetTasks (camelCase): ${countCamel} documents`);
    } catch (err) {
      console.log(`   fleetTasks (camelCase): Error - ${err.message}`);
    }

    // Check what the actual FleetTask model from the app uses
    console.log('\n🔍 Checking actual FleetTask model collection name...');
    const { default: FleetTask } = await import('./src/modules/fleetTask/models/FleetTask.js');
    console.log(`   Model collection name: ${FleetTask.collection.name}`);
    const actualCount = await FleetTask.countDocuments();
    console.log(`   Document count: ${actualCount}`);

    // If there are documents in the wrong collection, show them
    if (actualCount === 0) {
      console.log('\n⚠️  FleetTask model finds 0 documents!');
      console.log('   Checking fleettasks (lowercase) collection...');
      
      const FleetTaskLower = mongoose.model('FleetTaskCheck', new mongoose.Schema({}, { strict: false }), 'fleettasks');
      const tasksInLowercase = await FleetTaskLower.find({}).limit(5).lean();
      
      if (tasksInLowercase.length > 0) {
        console.log(`\n   ✅ Found ${tasksInLowercase.length} tasks in 'fleettasks' collection:`);
        tasksInLowercase.forEach(task => {
          console.log(`      Task ${task.id}: driverId=${task.driverId}, status=${task.status}`);
        });
        console.log('\n   🔧 SOLUTION: Tasks are in "fleettasks" but model uses "fleetTasks"');
        console.log('      Need to either:');
        console.log('      1. Rename collection from "fleettasks" to "fleetTasks"');
        console.log('      2. Change model to use "fleettasks" collection name');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkCollectionNames();
