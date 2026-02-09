// Fix attendance dates to be today instead of tomorrow
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function fixAttendanceDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get tomorrow's date (what the records currently have)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('📅 Date correction:');
    console.log(`   Current records have: ${tomorrow.toLocaleDateString()} (tomorrow)`);
    console.log(`   Should be: ${today.toLocaleDateString()} (today)`);
    console.log('');

    // Find attendance records for employees 2, 104, 107 that are dated tomorrow
    const targetEmployees = [2, 104, 107];
    
    const recordsToFix = await attendanceCol.find({
      employeeId: { $in: targetEmployees },
      date: {
        $gte: tomorrow,
        $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) // tomorrow + 1 day
      }
    }).toArray();

    console.log(`🔍 Found ${recordsToFix.length} attendance records to fix:`);
    recordsToFix.forEach(rec => {
      console.log(`   - Employee ${rec.employeeId}: ${new Date(rec.date).toLocaleDateString()}`);
    });

    if (recordsToFix.length === 0) {
      console.log('❌ No records found to fix');
      await mongoose.disconnect();
      return;
    }

    // Ask for confirmation
    console.log(`\n⚠️  This will update ${recordsToFix.length} attendance records`);
    console.log('   Change date from tomorrow to today');
    console.log('   Continue? (This script will proceed automatically)\n');

    // Update the records
    const updateResult = await attendanceCol.updateMany(
      {
        employeeId: { $in: targetEmployees },
        date: {
          $gte: tomorrow,
          $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      {
        $set: {
          date: today,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} attendance records`);

    // Verify the fix
    const verifyRecords = await attendanceCol.find({
      employeeId: { $in: targetEmployees },
      date: {
        $gte: today,
        $lt: tomorrow
      },
      checkIn: { $ne: null }
    }).toArray();

    console.log(`\n🎯 Verification: Found ${verifyRecords.length} records for today with checkIn:`);
    verifyRecords.forEach(rec => {
      console.log(`   ✅ Employee ${rec.employeeId}: checkIn = ${rec.checkIn}`);
    });

    console.log(`\n📊 Dashboard should now show: "${verifyRecords.length} of 19 Checked In Today"`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAttendanceDates();