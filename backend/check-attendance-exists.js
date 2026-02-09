// Check if attendance records still exist
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkAttendanceExists() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    
    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');

    console.log('🔍 Checking if attendance records exist...\n');

    // Check for employees 2, 104, 107
    const records = await attendanceCol.find({
      employeeId: { $in: [2, 104, 107] }
    }).toArray();

    console.log(`Found ${records.length} attendance records:`);
    records.forEach(rec => {
      const date = new Date(rec.date);
      console.log(`   Employee ${rec.employeeId}:`);
      console.log(`      date: ${date.toISOString()}`);
      console.log(`      date (local): ${date.toString()}`);
      console.log(`      checkIn: ${rec.checkIn || 'null'}`);
      console.log(`      id: ${rec.id}`);
      console.log('');
    });

    if (records.length === 0) {
      console.log('❌ No attendance records found! Creating new ones...\n');
      
      // Create new attendance records
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newRecords = [
        {
          id: Date.now() + 1,
          employeeId: 104,
          projectId: 201,
          date: today,
          checkIn: new Date(),
          checkOut: null,
          pendingCheckout: true,
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
          pendingCheckout: true,
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
          pendingCheckout: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const insertResult = await attendanceCol.insertMany(newRecords);
      console.log(`✅ Created ${insertResult.insertedCount} new attendance records`);
    }

    // Test the exact query from backend
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('\n🔍 Testing backend query:');
    console.log(`   Date range: ${today.toISOString()} to ${tomorrow.toISOString()}`);

    const queryResult = await attendanceCol.find({
      employeeId: { $in: [2, 104, 107] },
      date: { $gte: today, $lt: tomorrow },
      checkIn: { $ne: null }
    }).toArray();

    console.log(`   Result: ${queryResult.length} records`);
    queryResult.forEach(rec => {
      console.log(`      Employee ${rec.employeeId}: checkIn = ${rec.checkIn}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAttendanceExists();