// Create the attendance records based on the data you provided
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function createAttendanceRecords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('📅 Creating attendance records for today:', today.toISOString());
    console.log('   Local time:', today.toString());
    console.log('');

    // Create the attendance records based on your data
    const attendanceRecords = [
      {
        id: 1769696435728,
        employeeId: 104,
        projectId: 201,
        date: today, // Set to today instead of tomorrow
        checkIn: new Date('2026-02-09T02:30:00.000Z'),
        checkOut: new Date('2026-02-09T02:30:00.000Z'),
        lunchStartTime: null,
        lunchEndTime: null,
        overtimeStartTime: null,
        pendingCheckout: false,
        insideGeofenceAtCheckin: true,
        insideGeofenceAtCheckout: false,
        createdAt: new Date('2026-02-06T07:40:23.896Z'),
        manualOverrides: [],
        updatedAt: new Date(),
        __v: 0
      },
      {
        id: 1769696435729,
        employeeId: 107,
        projectId: 201,
        date: today, // Set to today instead of tomorrow
        checkIn: new Date('2026-02-09T02:30:00.000Z'),
        checkOut: new Date('2026-02-09T02:30:00.000Z'),
        lunchStartTime: null,
        lunchEndTime: null,
        overtimeStartTime: null,
        pendingCheckout: false,
        insideGeofenceAtCheckin: true,
        insideGeofenceAtCheckout: false,
        createdAt: new Date('2026-02-06T07:40:23.896Z'),
        manualOverrides: [],
        updatedAt: new Date(),
        __v: 0
      },
      {
        id: 1769696435730,
        employeeId: 2,
        projectId: 201,
        date: today, // Set to today instead of tomorrow
        checkIn: new Date('2026-02-09T02:30:00.000Z'),
        checkOut: new Date('2026-02-09T02:30:00.000Z'),
        lunchStartTime: null,
        lunchEndTime: null,
        overtimeStartTime: null,
        pendingCheckout: false,
        insideGeofenceAtCheckin: true,
        insideGeofenceAtCheckout: false,
        createdAt: new Date('2026-02-06T07:40:23.896Z'),
        manualOverrides: [],
        updatedAt: new Date(),
        __v: 0
      }
    ];

    console.log('📝 Creating attendance records:');
    attendanceRecords.forEach(rec => {
      console.log(`   Employee ${rec.employeeId}: checkIn = ${rec.checkIn}`);
    });
    console.log('');

    // Insert the records
    const insertResult = await attendanceCol.insertMany(attendanceRecords);
    console.log(`✅ Inserted ${insertResult.insertedCount} attendance records\n`);

    // Verify the records were created correctly
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const verifyRecords = await attendanceCol.find({
      employeeId: { $in: [2, 104, 107] },
      date: { $gte: today, $lt: tomorrow },
      checkIn: { $ne: null }
    }).toArray();

    console.log('🎯 Verification (backend query):');
    console.log(`   Date range: ${today.toISOString()} to ${tomorrow.toISOString()}`);
    console.log(`   Found ${verifyRecords.length} records with checkIn != null\n`);

    verifyRecords.forEach(rec => {
      console.log(`   ✅ Employee ${rec.employeeId}:`);
      console.log(`      date: ${new Date(rec.date).toISOString()}`);
      console.log(`      checkIn: ${rec.checkIn}`);
    });

    console.log(`\n🚀 Dashboard should now show: "${verifyRecords.length} of 19 Checked In Today"`);
    console.log('\n📱 Refresh the mobile app dashboard to see the change!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('💡 Duplicate key error - records might already exist');
    }
  }
}

createAttendanceRecords();