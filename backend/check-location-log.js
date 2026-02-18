// Check LocationLog for Employee 2
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LocationLog from './src/modules/attendance/LocationLog.js';

dotenv.config();

async function checkLocationLog() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Employee 2's location logs
    const locations = await LocationLog.find({ employeeId: 2 }).sort({ createdAt: -1 }).limit(5);
    
    console.log(`Found ${locations.length} location logs for Employee 2\n`);
    
    if (locations.length === 0) {
      console.log('❌ No location logs found for Employee 2');
      console.log('   This is why the app shows "Outside Geofence"');
      console.log('   The worker needs to submit their location first!');
    } else {
      locations.forEach((loc, index) => {
        console.log(`Location ${index + 1}:`);
        console.log('  Employee ID:', loc.employeeId);
        console.log('  Project ID:', loc.projectId);
        console.log('  Latitude:', loc.latitude);
        console.log('  Longitude:', loc.longitude);
        console.log('  Accuracy:', loc.accuracy);
        console.log('  Inside Geofence:', loc.insideGeofence);
        console.log('  Timestamp:', loc.createdAt);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkLocationLog();
