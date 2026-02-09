// Fix attendance records by employee ID and date
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function fixByEmployeeAndDate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');

    // The problematic date from your records: "2026-02-09T18:30:00.000Z"
    const problemDate = new Date('2026-02-09T18:30:00.000Z');
    
    console.log('🔍 Looking for attendance records with problematic date...');
    console.log(`   Problem date: ${problemDate.toISOString()}`);
    console.log(`   Problem date (local): ${problemDate.toString()}\n`);

    // Find records for employees 2, 104, 107 with that specific date
    const records = await attendanceCol.find({
      employeeId: { $in: [2, 104, 107] },
      date: problemDate
    }).toArray();

    console.log(`Found ${records.length} records with the problem date:`);
    records.forEach(rec => {
      console.log(`   Employee ${rec.employeeId}:`);
      console.log(`      _id: ${rec._id}`);
      console.log(`      date: ${new Date(rec.date).toISOString()}`);
      console.log(`      checkIn: ${rec.checkIn}`);
      console.log('');
    });

    if (records.length === 0) {
      // Try to find ANY records for these employees
      console.log('❌ No records found with that exact date');
      console.log('\n🔍 Searching for ANY records for employees 2, 104, 107...\n');
      
      const anyRecords = await attendanceCol.find({
        employeeId: { $in: [2, 104, 107] }
      }).sort({ date: -1 }).limit(10).toArray();
      
      console.log(`Found ${anyRecords.length} total records:`);
      anyRecords.forEach(rec => {
        const recDate = new Date(rec.date);
        console.log(`   Employee ${rec.employeeId}: ${recDate.toISOString()} (${recDate.toLocaleDateString()})`);
      });
      
      await mongoose.disconnect();
      return;
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('📅 Updating dates to today:', today.toISOString());
    console.log('   Local time:', today.toString());
    console.log('');

    // Update the records
    const updateResult = await attendanceCol.updateMany(
      {
        employeeId: { $in: [2, 104, 107] },
        date: problemDate
      },
      {
        $set: {
          date: today,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} records\n`);

    // Verify the fix
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const verifyRecords = await attendanceCol.find({
      employeeId: { $in: [2, 104, 107] },
      date: { $gte: today, $lt: tomorrow },
      checkIn: { $ne: null }
    }).toArray();

    console.log('🎯 Verification:');
    console.log(`   Found ${verifyRecords.length} records for today with checkIn\n`);

    verifyRecords.forEach(rec => {
      console.log(`   ✅ Employee ${rec.employeeId}: checkIn = ${rec.checkIn}`);
    });

    console.log(`\n🚀 Dashboard should now show: "${verifyRecords.length} of 19 Checked In Today"`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixByEmployeeAndDate();