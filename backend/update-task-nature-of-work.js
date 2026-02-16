import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './src/modules/task/Task.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

async function updateNatureOfWork() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Sample data for the LED lighting task (ID 84394)
    console.log('\n📝 Updating Task 84394 (Install Classroom Lighting Fixtures)...');
    
    const ledTask = await Task.findOne({ id: 84394 });
    if (ledTask) {
      ledTask.trade = 'Electrical Works';
      ledTask.activity = 'Installation';
      ledTask.workType = 'LED Lighting Installation – Level 2';
      await ledTask.save();
      console.log('✅ Updated LED lighting task');
    } else {
      console.log('⚠️ Task 84394 not found');
    }

    // Update assignment 7035 with detailed nature of work
    console.log('\n📝 Updating Assignment 7035...');
    const assignment7035 = await WorkerTaskAssignment.findOne({ id: 7035 });
    if (assignment7035) {
      assignment7035.trade = 'Electrical Works';
      assignment7035.activity = 'Installation';
      assignment7035.workType = 'LED Lighting Installation – Level 2';
      await assignment7035.save();
      console.log('✅ Updated assignment 7035');
    }

    // Sample data for painting task (ID 84395)
    console.log('\n📝 Updating Task 84395 (Paint Corridor Walls)...');
    const paintTask = await Task.findOne({ id: 84395 });
    if (paintTask) {
      paintTask.trade = 'Painting & Finishing';
      paintTask.activity = 'Surface Preparation & Coating';
      paintTask.workType = 'Interior Wall Painting';
      await paintTask.save();
      console.log('✅ Updated painting task');
    } else {
      console.log('⚠️ Task 84395 not found');
    }

    // Update assignment 7036
    console.log('\n📝 Updating Assignment 7036...');
    const assignment7036 = await WorkerTaskAssignment.findOne({ id: 7036 });
    if (assignment7036) {
      assignment7036.trade = 'Painting & Finishing';
      assignment7036.activity = 'Surface Preparation & Coating';
      assignment7036.workType = 'Interior Wall Painting';
      await assignment7036.save();
      console.log('✅ Updated assignment 7036');
    }

    // Sample data for bricklaying task (ID 84393)
    console.log('\n📝 Updating Task 84393 (Bricklaying)...');
    const brickTask = await Task.findOne({ id: 84393 });
    if (brickTask) {
      brickTask.trade = 'Masonry Works';
      brickTask.activity = 'Structural Construction';
      brickTask.workType = 'Brick Wall Construction – Ground Floor';
      await brickTask.save();
      console.log('✅ Updated bricklaying task');
    } else {
      console.log('⚠️ Task 84393 not found');
    }

    // Update assignment 7034
    console.log('\n📝 Updating Assignment 7034...');
    const assignment7034 = await WorkerTaskAssignment.findOne({ id: 7034 });
    if (assignment7034) {
      assignment7034.trade = 'Masonry Works';
      assignment7034.activity = 'Structural Construction';
      assignment7034.workType = 'Brick Wall Construction – Ground Floor';
      await assignment7034.save();
      console.log('✅ Updated assignment 7034');
    }

    // Verify updates
    console.log('\n✅ Verification:');
    const assignments = await WorkerTaskAssignment.find({
      id: { $in: [7034, 7035, 7036] }
    }).lean();

    for (const assignment of assignments) {
      const task = await Task.findOne({ id: assignment.taskId }).lean();
      console.log(`\nAssignment ${assignment.id} (${task?.taskName}):`);
      console.log(`  Trade: ${assignment.trade || task?.trade || 'NOT SET'}`);
      console.log(`  Activity: ${assignment.activity || task?.activity || 'NOT SET'}`);
      console.log(`  Work Type: ${assignment.workType || task?.workType || 'NOT SET'}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

updateNatureOfWork();
