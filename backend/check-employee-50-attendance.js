// Check employee 50 attendance in detail
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkEmployee50() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    
    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('📅 Checking employee 50 attendance for today\n');
    
    // Find employee 50 attendance
    const att50 = await attendanceCol.findOne({
      employeeId: 50,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (att50) {
      console.log('✅ Found attendance record for employee 50:');
      console.log(JSON.stringify(att50, null, 2));
      
      console.log('\n🔍 Field analysis:');
      console.log('   checkIn field exists?', 'checkIn' in att50);
      console.log('   checkIn value:', att50.checkIn);
      console.log('   checkIn type:', typeof att50.checkIn);
      console.log('   checkIn === null?', att50.checkIn === null);
      console.log('   checkIn === undefined?', att50.checkIn === undefined);
      console.log('   checkIn != null?', att50.checkIn != null);
      console.log('   checkIn !== null?', att50.checkIn !== null);
    } else {
      console.log('❌ No attendance record found for employee 50 today');
    }
    
    // Now check employees 2, 104, 107 (from fleet passengers)
    console.log('\n\n📋 Checking fleet passenger employees:\n');
    
    const passengerEmployeeIds = [2, 104, 107];
    
    for (const empId of passengerEmployeeIds) {
      const att = await attendanceCol.findOne({
        employeeId: empId,
        date: { $gte: today, $lt: tomorrow }
      });
      
      if (att) {
        console.log(`✅ Employee ${empId}:`);
        console.log(`   checkIn: ${att.checkIn}`);
        console.log(`   Has checkIn? ${att.checkIn != null}`);
      } else {
        console.log(`❌ Employee ${empId}: No attendance record`);
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkEmployee50();
