// Fix the attendance records timezone issue
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function fixTimezone() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');

    // The backend query uses this logic for "today"
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('📅 Backend "today" range:');
    console.log(`   From: ${today.toISOString()}`);
    console.log(`   To: ${tomorrow.toISOString()}`);
    console.log('');

    // Find the records I created (they should have today's date but might be wrong timezone)
    const myRecords = await attendanceCol.find({
      employeeId: { $in: [2, 104, 107] },
      id: { $in: [1769696435728, 1769696435729, 1769696435730] }
    }).toArray();

    console.log(`🔍 Found ${myRecords.length} records I created:`);
    myRecords.forEach(rec => {
      const recDate = new Date(rec.date);
      const isInRange = recDate >= today && recDate < tomorrow;
      console.log(`   Employee ${rec.employeeId}:`);
      console.log(`      date: ${recDate.toISOString()}`);
      console.log(`      local: ${recDate.toString()}`);
      console.log(`      in today range? ${isInRange}`);
    });

    if (myRecords.length === 0) {
      console.log('❌ No records found to fix');
      await mongoose.disconnect();
      return;
    }

    // Update them to have the exact date that will match the backend query
    console.log('\n🔧 Updating records to match backend query range...');
    
    const updateResult = await attendanceCol.updateMany(
      {
        employeeId: { $in: [2, 104, 107] },
        id: { $in: [1769696435728, 1769696435729, 1769696435730] }
      },
      {
        $set: {
          date: today, // This should match the backend query
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} records\n`);

    // Test the exact backend query
    const backendQuery = await attendanceCol.find({
      employeeId: { $in: [2, 104, 107] },
      date: { $gte: today, $lt: tomorrow },
      checkIn: { $ne: null }
    }).toArray();

    console.log('🎯 Backend query result:');
    console.log(`   Query: employeeId in [2,104,107] AND date >= ${today.toISOString()} AND date < ${tomorrow.toISOString()} AND checkIn != null`);
    console.log(`   Found: ${backendQuery.length} records\n`);

    backendQuery.forEach(rec => {
      console.log(`   ✅ Employee ${rec.employeeId}: checkIn = ${rec.checkIn}`);
    });

    console.log(`\n🚀 Dashboard should now show: "${backendQuery.length} of 19 Checked In Today"`);
    console.log('\n📱 Refresh the mobile app dashboard!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixTimezone();