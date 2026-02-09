// Fix the specific attendance records you showed me
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function fixSpecificRecords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');

    // The specific ObjectIds from your data
    const recordIds = [
      "69899ccac409d66d00a43de5", // Employee 104
      "6989c8cfc409d66d00a43e0a", // Employee 107  
      "6989c8ebc409d66d00a43e0b"  // Employee 2
    ];

    console.log('🔍 Looking for specific attendance records...\n');

    // Find these specific records
    const records = await attendanceCol.find({
      _id: { $in: recordIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).toArray();

    console.log(`Found ${records.length} records:`);
    records.forEach(rec => {
      const currentDate = new Date(rec.date);
      console.log(`   Employee ${rec.employeeId}: date=${currentDate.toISOString()}`);
      console.log(`   checkIn: ${rec.checkIn}`);
      console.log(`   Current date (local): ${currentDate.toString()}`);
      console.log('');
    });

    if (records.length === 0) {
      console.log('❌ No records found with those IDs');
      await mongoose.disconnect();
      return;
    }

    // Get today's date (start of day in local timezone)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('📅 Updating dates to today:', today.toISOString());
    console.log('   Local time:', today.toString());
    console.log('');

    // Update the specific records
    const updateResult = await attendanceCol.updateMany(
      {
        _id: { $in: recordIds.map(id => new mongoose.Types.ObjectId(id)) }
      },
      {
        $set: {
          date: today,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} records\n`);

    // Verify the fix by running the same query as the backend
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const verifyRecords = await attendanceCol.find({
      employeeId: { $in: [2, 104, 107] },
      date: { $gte: today, $lt: tomorrow },
      checkIn: { $ne: null }
    }).toArray();

    console.log('🎯 Verification (same query as backend):');
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
    console.error('Stack:', error.stack);
  }
}

fixSpecificRecords();