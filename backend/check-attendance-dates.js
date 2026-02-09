// Check attendance dates in detail
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    
    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');
    
    console.log('🕐 Current server time:', new Date().toISOString());
    console.log('🕐 Current local time:', new Date().toString());
    console.log('');
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('📅 Today range (for query):');
    console.log('   Start:', today.toISOString());
    console.log('   End:', tomorrow.toISOString());
    console.log('');
    
    // Find employees 2, 104, 107
    const targetEmployees = [2, 104, 107];
    
    console.log('📋 Checking attendance for employees 2, 104, 107:\n');
    
    for (const empId of targetEmployees) {
      const allRecords = await attendanceCol.find({ employeeId: empId }).sort({ date: -1 }).limit(3).toArray();
      
      console.log(`Employee ${empId}:`);
      if (allRecords.length === 0) {
        console.log('   ❌ No attendance records found\n');
        continue;
      }
      
      allRecords.forEach((rec, idx) => {
        const recDate = new Date(rec.date);
        const isToday = recDate >= today && recDate < tomorrow;
        
        console.log(`   Record ${idx + 1}:`);
        console.log(`      date: ${rec.date} (${recDate.toLocaleDateString()})`);
        console.log(`      checkIn: ${rec.checkIn}`);
        console.log(`      Is today? ${isToday}`);
        console.log(`      Has checkIn? ${rec.checkIn != null}`);
      });
      console.log('');
    }
    
    // Try query with date range
    console.log('🔍 Query: date >= today AND date < tomorrow AND checkIn != null\n');
    
    const results = await attendanceCol.find({
      employeeId: { $in: targetEmployees },
      date: { $gte: today, $lt: tomorrow },
      checkIn: { $ne: null }
    }).toArray();
    
    console.log(`Found ${results.length} records`);
    results.forEach(rec => {
      console.log(`   Employee ${rec.employeeId}: checkIn = ${rec.checkIn}`);
    });
    
    // Try without date filter
    console.log('\n🔍 Query: checkIn != null (no date filter)\n');
    
    const results2 = await attendanceCol.find({
      employeeId: { $in: targetEmployees },
      checkIn: { $ne: null }
    }).toArray();
    
    console.log(`Found ${results2.length} records`);
    results2.forEach(rec => {
      const recDate = new Date(rec.date);
      console.log(`   Employee ${rec.employeeId}: date=${recDate.toLocaleDateString()}, checkIn=${rec.checkIn}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDates();
