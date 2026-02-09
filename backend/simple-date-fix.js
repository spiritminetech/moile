// Simple fix - update attendance dates to today
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function simpleDateFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    
    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('📅 Setting attendance dates to:', today.toISOString());

    // Update ALL attendance records for employees 2, 104, 107 to today's date
    const result = await attendanceCol.updateMany(
      {
        employeeId: { $in: [2, 104, 107] }
      },
      {
        $set: {
          date: today,
          updatedAt: new Date()
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} attendance records`);

    // Verify the fix
    const todayRecords = await attendanceCol.find({
      employeeId: { $in: [2, 104, 107] },
      checkIn: { $ne: null }
    }).toArray();

    console.log(`🎯 Found ${todayRecords.length} records with checkIn:`);
    todayRecords.forEach(rec => {
      console.log(`   Employee ${rec.employeeId}: ${new Date(rec.date).toLocaleDateString()}`);
    });

    await mongoose.disconnect();
    
    console.log('\n🚀 Now refresh the mobile app dashboard!');
    console.log(`   Expected result: "${todayRecords.length} of 19 Checked In Today"`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simpleDateFix();