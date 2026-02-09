// Quick check of passenger status based on today's date
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function quickCheck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    
    const db = mongoose.connection.db;
    const fleetTasksCol = db.collection('fleetTasks');
    const passengersCol = db.collection('fleetTaskPassengers');
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log('📅 Date:', today.toLocaleDateString());
    console.log('📊 Quick Check - Today\'s Passengers\n');
    
    // Find all tasks for today based on taskDate or createdAt
    const todayTasks = await fleetTasksCol.find({
      $or: [
        { taskDate: { $gte: today, $lt: tomorrow } },
        { createdAt: { $gte: today, $lt: tomorrow } }
      ]
    }).toArray();
    
    console.log(`Found ${todayTasks.length} tasks for today\n`);
    
    if (todayTasks.length === 0) {
      console.log('⚠️  No tasks found for today');
      await mongoose.disconnect();
      return;
    }
    
    const todayTaskIds = todayTasks.map(t => t.id);
    
    let totalPassengers = 0;
    let totalConfirmed = 0;
    
    for (const task of todayTasks) {
      const passengers = await passengersCol.find({ fleetTaskId: task.id }).toArray();
      const confirmed = passengers.filter(p => p.pickupStatus === 'confirmed');
      
      totalPassengers += passengers.length;
      totalConfirmed += confirmed.length;
      
      console.log(`🚛 Task ${task.id} (${task.status}):`);
      console.log(`   ${confirmed.length}/${passengers.length} checked in`);
      
      if (confirmed.length > 0) {
        console.log('   ✅ Confirmed workers:');
        confirmed.forEach(p => {
          console.log(`      - Worker ${p.workerEmployeeId} at ${p.pickupConfirmedAt}`);
        });
      }
      
      if (passengers.length > 0 && confirmed.length === 0) {
        console.log('   ⏳ All workers pending check-in');
      }
    }
    
    console.log('\n' + '═'.repeat(50));
    console.log(`✅ TOTAL: ${totalConfirmed} of ${totalPassengers} checked in today`);
    console.log('═'.repeat(50));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickCheck();
