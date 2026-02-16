import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function checkinWorkerAndStartTask() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const attendancesCollection = db.collection('attendances');
    const assignmentsCollection = db.collection('workerTaskAssignment');
    const tasksCollection = db.collection('tasks');
    const projectsCollection = db.collection('projects');

    const employeeId = 2; // Ravi Smith
    const today = '2026-02-15';
    const now = new Date();

    // Step 1: Check if already checked in
    console.log('📋 Step 1: Checking attendance status...\n');
    
    const existingAttendance = await attendancesCollection.findOne({
      employeeId: employeeId,
      date: today
    });

    if (existingAttendance) {
      console.log('   ℹ️  Already checked in today');
      console.log(`   Check-in time: ${existingAttendance.checkInTime}`);
      console.log(`   Status: ${existingAttendance.status}\n`);
    } else {
      // Create check-in record
      console.log('   ⏰ Creating check-in record...\n');
      
      // Get project details
      const project = await projectsCollection.findOne({ id: 1003 });
      
      // Get highest attendance ID
      const maxAttendance = await attendancesCollection.findOne({}, { sort: { id: -1 } });
      const newAttendanceId = (maxAttendance?.id || 1000) + 1;

      const attendanceRecord = {
        id: newAttendanceId,
        employeeId: employeeId,
        projectId: 1003,
        date: today,
        checkInTime: now,
        checkInLocation: {
          latitude: project?.geofence?.center?.latitude || 1.3521,
          longitude: project?.geofence?.center?.longitude || 103.8198
        },
        status: 'checked_in',
        isLate: false,
        workHours: 0,
        overtimeHours: 0,
        createdAt: now,
        updatedAt: now
      };

      await attendancesCollection.insertOne(attendanceRecord);
      
      console.log('   ✅ Check-in successful!');
      console.log(`   Attendance ID: ${newAttendanceId}`);
      console.log(`   Check-in time: ${now.toLocaleString()}`);
      console.log(`   Location: ${attendanceRecord.checkInLocation.latitude}, ${attendanceRecord.checkInLocation.longitude}\n`);
    }

    // Step 2: Start first task
    console.log('📋 Step 2: Starting first task...\n');
    
    const firstQueuedTask = await assignmentsCollection.findOne({
      employeeId: employeeId,
      date: today,
      status: 'queued'
    }, { sort: { id: 1 } });

    if (!firstQueuedTask) {
      console.log('   ⚠️  No queued tasks found\n');
    } else {
      const task = await tasksCollection.findOne({ id: firstQueuedTask.taskId });
      
      console.log('   📝 Task to start:');
      console.log(`   Name: ${task?.taskName || 'Unnamed'}`);
      console.log(`   Assignment ID: ${firstQueuedTask.id}`);
      console.log(`   Task ID: ${firstQueuedTask.taskId}\n`);

      // Update task status
      await assignmentsCollection.updateOne(
        { id: firstQueuedTask.id },
        {
          $set: {
            status: 'in_progress',
            startTime: now,
            updatedAt: now
          }
        }
      );

      console.log('   ✅ Task started successfully!\n');
    }

    // Step 3: Show summary
    console.log('='.repeat(60));
    console.log('📊 Summary:\n');

    // Attendance status
    const currentAttendance = await attendancesCollection.findOne({
      employeeId: employeeId,
      date: today
    });
    
    console.log('👤 Attendance:');
    console.log(`   Status: ${currentAttendance?.status || 'Not checked in'}`);
    if (currentAttendance?.checkInTime) {
      console.log(`   Check-in: ${new Date(currentAttendance.checkInTime).toLocaleString()}`);
    }
    console.log('');

    // Tasks status
    console.log('📋 Tasks:');
    const allTasks = await assignmentsCollection.find({
      employeeId: employeeId,
      date: today
    }).sort({ id: 1 }).toArray();

    for (const assignment of allTasks) {
      const taskDoc = await tasksCollection.findOne({ id: assignment.taskId });
      const statusIcon = assignment.status === 'in_progress' ? '▶️' : 
                        assignment.status === 'completed' ? '✅' : '⏸️';
      console.log(`   ${statusIcon} ${taskDoc?.taskName || 'Unnamed'} (${assignment.status})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 Done! Restart backend and login to mobile app.');
    console.log('   Email: worker@gmail.com');
    console.log('   Password: password123\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkinWorkerAndStartTask();
