// Create attendance records in the correct 'attendance' collection
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function createAttendanceInCorrectCollection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    
    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendance'); // Correct collection name
    
    console.log('📝 Creating attendance records in "attendance" collection...\n');
    
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if records already exist
    const existingRecords = await attendanceCol.find({
      employeeId: { $in: [2, 104, 107] },
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    }).toArray();
    
    if (existingRecords.length > 0) {
      console.log(`✅ Found ${existingRecords.length} existing records for today:`);
      existingRecords.forEach(rec => {
        console.log(`   Employee ${rec.employeeId}: checkIn = ${rec.checkIn || 'null'}`);
      });
    } else {
      console.log('📝 No existing records found, creating new ones...');
      
      // Create new attendance records
      const newRecords = [
        {
          id: Date.now() + 1,
          employeeId: 104,
          projectId: 201,
          date: today,
          checkIn: new Date(),
          checkOut: null,
          lunchStartTime: null,
          lunchEndTime: null,
          overtimeStartTime: null,
          overtimeHours: 0,
          regularHours: 0,
          pendingCheckout: true,
          absenceReason: 'PRESENT',
          absenceNotes: '',
          absenceMarkedBy: null,
          absenceMarkedAt: null,
          insideGeofenceAtCheckin: true,
          insideGeofenceAtCheckout: false,
          manualOverrides: [],
          linkedToTransportDelay: false,
          linkedDelayId: null,
          delayReason: '',
          lateMinutes: 0,
          status: 'present',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: Date.now() + 2,
          employeeId: 107,
          projectId: 201,
          date: today,
          checkIn: new Date(),
          checkOut: null,
          lunchStartTime: null,
          lunchEndTime: null,
          overtimeStartTime: null,
          overtimeHours: 0,
          regularHours: 0,
          pendingCheckout: true,
          absenceReason: 'PRESENT',
          absenceNotes: '',
          absenceMarkedBy: null,
          absenceMarkedAt: null,
          insideGeofenceAtCheckin: true,
          insideGeofenceAtCheckout: false,
          manualOverrides: [],
          linkedToTransportDelay: false,
          linkedDelayId: null,
          delayReason: '',
          lateMinutes: 0,
          status: 'present',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: Date.now() + 3,
          employeeId: 2,
          projectId: 201,
          date: today,
          checkIn: new Date(),
          checkOut: null,
          lunchStartTime: null,
          lunchEndTime: null,
          overtimeStartTime: null,
          overtimeHours: 0,
          regularHours: 0,
          pendingCheckout: true,
          absenceReason: 'PRESENT',
          absenceNotes: '',
          absenceMarkedBy: null,
          absenceMarkedAt: null,
          insideGeofenceAtCheckin: true,
          insideGeofenceAtCheckout: false,
          manualOverrides: [],
          linkedToTransportDelay: false,
          linkedDelayId: null,
          delayReason: '',
          lateMinutes: 0,
          status: 'present',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const insertResult = await attendanceCol.insertMany(newRecords);
      console.log(`✅ Created ${insertResult.insertedCount} attendance records`);
    }
    
    // Test the exact query the backend will use
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const queryResult = await attendanceCol.find({
      employeeId: { $in: [2, 104, 107] },
      date: { $gte: today, $lt: tomorrow },
      checkIn: { $ne: null }
    }).toArray();
    
    console.log(`\n🎯 Backend query test:`);
    console.log(`   Date range: ${today.toISOString()} to ${tomorrow.toISOString()}`);
    console.log(`   Found ${queryResult.length} records with checkIn != null`);
    
    queryResult.forEach(rec => {
      console.log(`   ✅ Employee ${rec.employeeId}: checkIn = ${rec.checkIn}`);
    });
    
    console.log(`\n🚀 Backend should now show: "${queryResult.length} of 19 Checked In Today"`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('💡 Duplicate key error - records might already exist');
    }
  }
}

createAttendanceInCorrectCollection();