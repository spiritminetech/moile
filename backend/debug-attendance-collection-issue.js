import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './src/modules/attendance/Attendance.js';

dotenv.config();

async function debugCollectionIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Check what collections exist
    console.log('🔍 Step 1: Check Available Collections');
    console.log('=' .repeat(70));
    const collections = await db.listCollections().toArray();
    const attendanceCollections = collections.filter(c => c.name.toLowerCase().includes('attend'));
    
    console.log('Attendance-related collections:');
    attendanceCollections.forEach(c => {
      console.log(`  - ${c.name}`);
    });

    // Check the model's collection name
    console.log('\n🔍 Step 2: Check Model Configuration');
    console.log('=' .repeat(70));
    console.log(`Model collection name: "${Attendance.collection.name}"`);

    // Check both collections
    console.log('\n🔍 Step 3: Check Records in Each Collection');
    console.log('=' .repeat(70));

    // Check 'attendance' (singular - what model uses)
    const attendanceCollection = db.collection('attendance');
    const recordsInAttendance = await attendanceCollection.find({ employeeId: 2 }).toArray();
    console.log(`\nRecords in "attendance" collection: ${recordsInAttendance.length}`);
    if (recordsInAttendance.length > 0) {
      recordsInAttendance.forEach(r => {
        console.log(`  - ID: ${r.id}, Date: ${r.date}, checkIn: ${r.checkIn ? 'YES' : 'NO'}`);
      });
    }

    // Check 'attendances' (plural - where we might have created it)
    const attendancesCollection = db.collection('attendances');
    const recordsInAttendances = await attendancesCollection.find({ employeeId: 2 }).toArray();
    console.log(`\nRecords in "attendances" collection: ${recordsInAttendances.length}`);
    if (recordsInAttendances.length > 0) {
      recordsInAttendances.forEach(r => {
        console.log(`  - ID: ${r.id}, Date: ${r.date}, checkIn: ${r.checkIn ? 'YES' : 'NO'}`);
      });
    }

    // Test using the Mongoose model
    console.log('\n🔍 Step 4: Query Using Mongoose Model');
    console.log('=' .repeat(70));
    
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const modelResult = await Attendance.findOne({
      employeeId: 2,
      checkIn: { $exists: true, $ne: null },
      date: { $gte: startOfToday, $lt: startOfTomorrow }
    });

    if (modelResult) {
      console.log('✅ Model query FOUND attendance');
      console.log(`   ID: ${modelResult.id}`);
      console.log(`   Date: ${modelResult.date}`);
      console.log(`   checkIn: ${modelResult.checkIn}`);
    } else {
      console.log('❌ Model query DID NOT FIND attendance');
      console.log('   This is why the API validation fails!');
    }

    // Solution
    console.log('\n💡 SOLUTION:');
    console.log('=' .repeat(70));
    if (recordsInAttendances.length > 0 && recordsInAttendance.length === 0) {
      console.log('The record is in "attendances" but the model looks in "attendance"');
      console.log('Need to move the record to the correct collection');
    } else if (recordsInAttendance.length > 0 && !modelResult) {
      console.log('Record exists in correct collection but query still fails');
      console.log('Need to check the date/checkIn field values');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

debugCollectionIssue();
