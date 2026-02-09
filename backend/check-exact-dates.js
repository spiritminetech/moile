// Check exact date formats in attendance records
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkExactDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');

    // Get attendance records for employees 2, 104, 107
    const targetEmployees = [2, 104, 107];
    
    const records = await attendanceCol.find({
      employeeId: { $in: targetEmployees }
    }).sort({ date: -1 }).limit(10).toArray();

    console.log(`📋 Found ${records.length} attendance records:\n`);

    records.forEach((rec, idx) => {
      const date = new Date(rec.date);
      console.log(`${idx + 1}. Employee ${rec.employeeId}:`);
      console.log(`   _id: ${rec._id}`);
      console.log(`   date (raw): ${rec.date}`);
      console.log(`   date (parsed): ${date.toISOString()}`);
      console.log(`   date (local): ${date.toString()}`);
      console.log(`   checkIn: ${rec.checkIn || 'null'}`);
      console.log('');
    });

    // Get today's date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('📅 Date ranges:');
    console.log(`   Today start: ${today.toISOString()}`);
    console.log(`   Tomorrow start: ${tomorrow.toISOString()}`);
    console.log('');

    // Check which records fall in which range
    console.log('🔍 Date analysis:');
    records.forEach(rec => {
      const recDate = new Date(rec.date);
      const isToday = recDate >= today && recDate < tomorrow;
      const isTomorrow = recDate >= tomorrow;
      
      console.log(`   Employee ${rec.employeeId}: ${isToday ? 'TODAY' : isTomorrow ? 'TOMORROW' : 'OTHER'}`);
    });

    // Try to update records that are for tomorrow to today
    console.log('\n🔧 Attempting to fix dates...');
    
    // Find records with date >= tomorrow
    const tomorrowRecords = await attendanceCol.find({
      employeeId: { $in: targetEmployees },
      date: { $gte: tomorrow }
    }).toArray();

    console.log(`Found ${tomorrowRecords.length} records dated tomorrow or later`);

    if (tomorrowRecords.length > 0) {
      // Update them to today
      const updateResult = await attendanceCol.updateMany(
        {
          employeeId: { $in: targetEmployees },
          date: { $gte: tomorrow }
        },
        {
          $set: {
            date: today,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Updated ${updateResult.modifiedCount} records to today's date`);

      // Verify
      const todayRecords = await attendanceCol.find({
        employeeId: { $in: targetEmployees },
        date: { $gte: today, $lt: tomorrow },
        checkIn: { $ne: null }
      }).toArray();

      console.log(`\n🎯 Verification: ${todayRecords.length} records now have today's date with checkIn`);
      todayRecords.forEach(rec => {
        console.log(`   ✅ Employee ${rec.employeeId}`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkExactDates();