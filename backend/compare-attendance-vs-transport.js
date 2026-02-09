// Compare attendance vs transport check-ins
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function compareData() {
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
    
    // 1. Check ATTENDANCE collection (project site check-in)
    console.log('\n📋 ATTENDANCE COLLECTION (Project Site Clock-In)');
    console.log('─'.repeat(70));
    
    const todayAttendance = await attendanceCol.find({
      date: { $gte: today, $lt: tomorrow }
    }).toArray();
    
    console.log(`Total attendance records today: ${todayAttendance.length}`);
    
    if (todayAttendance.length > 0) {
      console.log('\nAttendance details:');
      todayAttendance.forEach((att, idx) => {
        console.log(`${idx + 1}. Employee ${att.employeeId} | Project ${att.projectId}`);
        console.log(`   Check-in: ${att.checkIn ? new Date(att.checkIn).toLocaleString() : 'Not checked in'}`);
        console.log(`   Check-out: ${att.checkOut ? new Date(att.checkOut).toLocaleString() : 'Not checked out'}`);
      });
    }
    
    // 2. Check FLEET TASK PASSENGERS (transport check-in)
    console.log('\n\n🚛 FLEET TASK PASSENGERS (Transport Vehicle Check-In)');
    console.log('─'.repeat(70));
    
    const todayTasks = await fleetTasksCol.find({
      $or: [
        { taskDate: { $gte: today, $lt: tomorrow } },
        { createdAt: { $gte: today, $lt: tomorrow } }
      ]
    }).toArray();
    
    console.log(`Total transport tasks today: ${todayTasks.length}`);
    
    let totalPassengers = 0;
    let totalTransportCheckedIn = 0;
    
    for (const task of todayTasks) {
      const passengers = await passengersCol.find({ fleetTaskId: task.id }).toArray();
      const checkedIn = passengers.filter(p => p.pickupStatus === 'confirmed');
      
      totalPassengers += passengers.length;
      totalTransportCheckedIn += checkedIn.length;
      
      if (passengers.length > 0) {
        console.log(`\nTask ${task.id}:`);
        console.log(`  Passengers: ${passengers.length} | Checked in to vehicle: ${checkedIn.length}`);
        
        passengers.forEach(p => {
          const status = p.pickupStatus === 'confirmed' ? '✅ Checked in' : '⏳ Pending';
          console.log(`    - Worker ${p.workerEmployeeId}: ${status}`);
        });
      }
    }
    
    // 3. COMPARISON
    console.log('\n\n📊 COMPARISON SUMMARY');
    console.log('═'.repeat(70));
    console.log(`Attendance (Project Site):     ${todayAttendance.length} workers clocked in`);
    console.log(`Transport Check-In (Vehicle):  ${totalTransportCheckedIn} of ${totalPassengers} workers boarded`);
    console.log('═'.repeat(70));
    
    console.log('\n💡 EXPLANATION:');
    console.log('   - Attendance = Workers who clocked in at the PROJECT SITE');
    console.log('   - Transport Check-In = Workers who BOARDED THE VEHICLE');
    console.log('   - Dashboard "Checked In Today" shows TRANSPORT check-ins (boarding)');
    console.log('   - These are TWO DIFFERENT systems!');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

compareData();
