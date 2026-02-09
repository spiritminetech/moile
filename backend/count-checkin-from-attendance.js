// Count transport check-ins based on attendance records
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function countCheckIns() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    
    const db = mongoose.connection.db;
    const attendanceCol = db.collection('attendances');
    const fleetTasksCol = db.collection('fleetTasks');
    const passengersCol = db.collection('fleetTaskPassengers');
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('📅 Date:', today.toLocaleDateString());
    console.log('═'.repeat(70));
    
    // 1. Get all attendance records for today with checkIn
    const todayAttendance = await attendanceCol.find({
      date: { $gte: today, $lt: tomorrow },
      checkIn: { $ne: null }
    }).toArray();
    
    const checkedInEmployeeIds = new Set(todayAttendance.map(att => att.employeeId));
    
    console.log(`\n📋 Attendance records with check-in: ${todayAttendance.length}`);
    console.log('Checked-in employee IDs:', Array.from(checkedInEmployeeIds));
    
    // 2. Get all fleet tasks for today
    const todayTasks = await fleetTasksCol.find({
      $or: [
        { taskDate: { $gte: today, $lt: tomorrow } },
        { createdAt: { $gte: today, $lt: tomorrow } }
      ]
    }).toArray();
    
    console.log(`\n🚛 Transport tasks today: ${todayTasks.length}`);
    
    // 3. Get all passengers and check against attendance
    let totalPassengers = 0;
    let checkedInCount = 0;
    
    console.log('\n📊 Passenger Check-In Status:\n');
    
    for (const task of todayTasks) {
      const passengers = await passengersCol.find({ fleetTaskId: task.id }).toArray();
      
      if (passengers.length > 0) {
        console.log(`Task ${task.id}:`);
        
        passengers.forEach(p => {
          totalPassengers++;
          const isCheckedIn = checkedInEmployeeIds.has(p.workerEmployeeId);
          
          if (isCheckedIn) {
            checkedInCount++;
            console.log(`  ✅ Worker ${p.workerEmployeeId} - CHECKED IN (has attendance)`);
          } else {
            console.log(`  ⏳ Worker ${p.workerEmployeeId} - NOT CHECKED IN (no attendance)`);
          }
        });
        console.log('');
      }
    }
    
    // 4. Summary
    console.log('═'.repeat(70));
    console.log(`📊 FINAL COUNT: ${checkedInCount} of ${totalPassengers} checked in today`);
    console.log('═'.repeat(70));
    
    console.log('\n💡 Logic:');
    console.log('   - Worker is "checked in" if their workerEmployeeId exists in');
    console.log('     attendance collection with checkIn != null for today');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

countCheckIns();
