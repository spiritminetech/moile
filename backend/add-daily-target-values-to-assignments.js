import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

dotenv.config();

const addDailyTargetValues = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Adding daily target values for date:', today);

    // Get all assignments for today
    const assignments = await WorkerTaskAssignment.find({
      date: today
    });

    console.log(`\n📋 Found ${assignments.length} assignments to update\n`);

    if (assignments.length === 0) {
      console.log('❌ No assignments found for today');
      console.log('   Run: node create-todays-assignments-for-worker.js first');
      process.exit(0);
    }

    // Define daily target templates based on task type
    const targetTemplates = {
      'Install Plumbing Fixtures': {
        description: 'Install bathroom fixtures including sinks, toilets, and faucets',
        quantity: 8,
        unit: 'fixtures',
        targetCompletion: 100,
        targetType: 'quantity',
        areaLevel: 'Floor 2 - Bathrooms',
        startTime: '08:00',
        expectedFinish: '16:00',
        progressToday: { completed: 0, percentage: 0 }
      },
      'Repair Ceiling Tiles': {
        description: 'Replace damaged ceiling tiles in classrooms',
        quantity: 50,
        unit: 'tiles',
        targetCompletion: 100,
        targetType: 'quantity',
        areaLevel: 'Floor 1 - Classrooms',
        startTime: '08:00',
        expectedFinish: '15:00',
        progressToday: { completed: 0, percentage: 0 }
      },
      'Install LED Lighting': {
        description: 'Install LED light fixtures in corridors and classrooms',
        quantity: 25,
        unit: 'fixtures',
        targetCompletion: 100,
        targetType: 'quantity',
        areaLevel: 'Floor 1 & 2 - All Areas',
        startTime: '08:00',
        expectedFinish: '16:00',
        progressToday: { completed: 0, percentage: 0 }
      },
      'Install Electrical Fixtures': {
        description: 'Install electrical outlets, switches, and panels',
        quantity: 30,
        unit: 'points',
        targetCompletion: 100,
        targetType: 'quantity',
        areaLevel: 'Floor 2 - All Rooms',
        startTime: '08:00',
        expectedFinish: '16:00',
        progressToday: { completed: 0, percentage: 0 }
      },
      'Paint Interior Walls': {
        description: 'Apply two coats of paint to interior walls',
        quantity: 200,
        unit: 'sqm',
        targetCompletion: 100,
        targetType: 'area',
        areaLevel: 'Floor 1 - Classrooms',
        startTime: '08:00',
        expectedFinish: '17:00',
        progressToday: { completed: 0, percentage: 0 }
      }
    };

    // Default template for unknown tasks
    const defaultTemplate = {
      description: 'Complete assigned construction work',
      quantity: 1,
      unit: 'task',
      targetCompletion: 100,
      targetType: 'completion',
      areaLevel: 'As per site plan',
      startTime: '08:00',
      expectedFinish: '16:00',
      progressToday: { completed: 0, percentage: 0 }
    };

    let updatedCount = 0;

    for (const assignment of assignments) {
      // Get the task name from the assignment
      const taskName = assignment.taskName || 'Unknown Task';
      
      // Find matching template or use default
      let targetData = defaultTemplate;
      for (const [key, template] of Object.entries(targetTemplates)) {
        if (taskName.includes(key)) {
          targetData = template;
          break;
        }
      }

      // Update the assignment with daily target data
      await WorkerTaskAssignment.updateOne(
        { id: assignment.id },
        {
          $set: {
            dailyTarget: targetData,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Updated Assignment ${assignment.id}:`);
      console.log(`   Task: ${taskName}`);
      console.log(`   Target: ${targetData.quantity} ${targetData.unit}`);
      console.log(`   Area: ${targetData.areaLevel}`);
      console.log('');

      updatedCount++;
    }

    console.log(`\n✅ Successfully updated ${updatedCount} assignments with daily target values`);
    console.log('\n📱 Mobile app will now display:');
    console.log('   - Target quantity and unit');
    console.log('   - Target description');
    console.log('   - Area/level information');
    console.log('   - Expected start and finish times');
    console.log('   - Progress tracking');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

addDailyTargetValues();
