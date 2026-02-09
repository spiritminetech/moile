// Find ANY attendance with checkIn
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function findAnyCheckIn() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    
    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');
    
    console.log('🔍 Searching for ANY attendance records with checkIn...\n');
    
    // Find any record with checkIn field
    const withCheckIn = await attendanceCol.find({
      checkIn: { $exists: true, $ne: null }
    }).limit(10).toArray();
    
    console.log(`Found ${withCheckIn.length} records with checkIn field\n`);
    
    if (withCheckIn.length > 0) {
      withCheckIn.forEach((rec, idx) => {
        console.log(`${idx + 1}. Employee ${rec.employeeId}`);
        console.log(`   date: ${rec.date}`);
        console.log(`   checkIn: ${rec.checkIn}`);
        console.log(`   checkOut: ${rec.checkOut}`);
        console.log('');
      });
    }
    
    // Check total count
    const total = await attendanceCol.countDocuments();
    console.log(`\nTotal attendance records: ${total}`);
    
    // Sample a few records to see structure
    console.log('\n📋 Sample attendance records:\n');
    const samples = await attendanceCol.find({}).limit(5).toArray();
    samples.forEach((rec, idx) => {
      console.log(`${idx + 1}. Employee ${rec.employeeId}`);
      console.log(`   Fields:`, Object.keys(rec));
      console.log(`   Has checkIn field?`, 'checkIn' in rec);
      console.log(`   Has checkInTime field?`, 'checkInTime' in rec);
      console.log('');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findAnyCheckIn();
