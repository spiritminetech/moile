// Test inserting attendance record for today
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function testAttendance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    
    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');
    
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('📅 Today (start of day):', today.toISOString());
    console.log('📅 Today (local):', today.toString());
    console.log('');
    
    // Create test attendance record for employee 104 (from fleet passengers)
    const testRecord = {
      id: Date.now(),
      employeeId: 104,
      projectId: 201,
      date: today,  // Today's date at 00:00:00
      checkIn: new Date(),  // Current time as check-in
      checkOut: null,
      lunchStartTime: null,
      lunchEndTime: null,
      overtimeStartTime: null,
      pendingCheckout: true,
      insideGeofenceAtCheckin: true,
      insideGeofenceAtCheckout: false,
      createdAt: new Date(),
      manualOverrides: [],
      updatedAt: new Date(),
      __v: 0
    };
    
    console.log('📝 Test attendance record:');
    console.log('   employeeId:', testRecord.employeeId);
    console.log('   date:', testRecord.date.toISOString());
    console.log('   checkIn:', testRecord.checkIn.toISOString());
    console.log('');
    
    // Insert the test record
    const result = await attendanceCol.insertOne(testRecord);
    console.log('✅ Inserted test record with ID:', result.insertedId);
    
    // Now test the query
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const queryResult = await attendanceCol.find({
      employeeId: 104,
      date: { $gte: today, $lt: tomorrow },
      checkIn: { $ne: null }
    }).toArray();
    
    console.log(`\n🔍 Query result: Found ${queryResult.length} records`);
    if (queryResult.length > 0) {
      queryResult.forEach(rec => {
        console.log(`   Employee ${rec.employeeId}: checkIn = ${rec.checkIn}`);
      });
    }
    
    // Clean up - remove the test record
    await attendanceCol.deleteOne({ _id: result.insertedId });
    console.log('\n🗑️  Cleaned up test record');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAttendance();