// Debug attendance date matching
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function debugAttendance() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    
    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('📅 Today range:');
    console.log('   Start:', today.toISOString());
    console.log('   End:', tomorrow.toISOString());
    console.log('');
    
    // Get ALL attendance records
    const allAttendance = await attendanceCol.find({}).sort({ date: -1 }).limit(10).toArray();
    
    console.log('📋 Recent attendance records:\n');
    allAttendance.forEach((att, idx) => {
      console.log(`${idx + 1}. Employee ${att.employeeId}`);
      console.log(`   date: ${att.date}`);
      console.log(`   checkIn: ${att.checkIn}`);
      console.log(`   checkOut: ${att.checkOut}`);
      
      // Check if date matches today
      const attDate = new Date(att.date);
      const isToday = attDate >= today && attDate < tomorrow;
      console.log(`   Is today? ${isToday}`);
      
      // Check if checkIn is not null
      const hasCheckIn = att.checkIn !== null && att.checkIn !== undefined;
      console.log(`   Has checkIn? ${hasCheckIn}`);
      console.log('');
    });
    
    // Try different queries
    console.log('\n🔍 Testing different queries:\n');
    
    // Query 1: Date range with checkIn not null
    const query1 = await attendanceCol.find({
      date: { $gte: today, $lt: tomorrow },
      checkIn: { $ne: null }
    }).toArray();
    console.log(`Query 1 (date range + checkIn != null): ${query1.length} records`);
    
    // Query 2: Just date range
    const query2 = await attendanceCol.find({
      date: { $gte: today, $lt: tomorrow }
    }).toArray();
    console.log(`Query 2 (just date range): ${query2.length} records`);
    
    // Query 3: Just checkIn not null
    const query3 = await attendanceCol.find({
      checkIn: { $ne: null }
    }).toArray();
    console.log(`Query 3 (just checkIn != null): ${query3.length} records`);
    
    // Query 4: Specific date string
    const dateStr = '2026-02-09T00:00:00.000Z';
    const query4 = await attendanceCol.find({
      date: new Date(dateStr)
    }).toArray();
    console.log(`Query 4 (exact date match): ${query4.length} records`);
    
    // Show results from query 2
    if (query2.length > 0) {
      console.log('\n📊 Records from today (Query 2):');
      query2.forEach(att => {
        console.log(`   Employee ${att.employeeId}: checkIn=${att.checkIn !== null ? 'YES' : 'NO'}`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugAttendance();
