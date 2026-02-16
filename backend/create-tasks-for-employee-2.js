import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const WorkerTaskAssignmentSchema = new mongoose.Schema({}, { 
  strict: false, 
  collection: 'workertaskassignments' 
});
const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', WorkerTaskAssignmentSchema);

const TaskSchema = new mongoose.Schema({}, { 
  strict: false, 
  collection: 'tasks' 
});
const Task = mongoose.model('Task', TaskSchema);

async function createTasksForEmployee2() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'construction_erp'
    });

    console.log('✅ Connected to MongoDB\n');
    console.log('='.repeat(80));
    console.log('🔧 CREATING TASKS FOR EMPLOYEE ID 2 (RAVI SMITH)');
    console.log('='.repeat(80));

    // First, clear any existing assignments for Employee 2
    const deleteResult = await WorkerTaskAssignment.deleteMany({ employeeId: 2 });
    console.log(`\n🗑️  Deleted ${deleteResult.deletedCount} old assignments for Employee 2`);

    // Get the next available assignment ID
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 });
    let nextId = (lastAssignment?.id || 7000) + 1;

    console.log(`\n📝 Starting assignment ID: ${nextId}`);

    // Create tasks in the tasks collection first
    const tasksToCreate = [
      {
        id: 2001,
        taskName: 'Concrete Pouring - Foundation',
        taskType: 'WORK',
        description: 'Pour concrete for building foundation',
        projectId: 1003,
        status: 'active'
      },
      {
        id: 2002,
        taskName: 'Steel Reinforcement - Columns',
        taskType: 'WORK',
        description: 'Install steel reinforcement for columns',
        projectId: 1003,
        status: 'active'
      },
      {
        id: 2003,
        taskName: 'Brickwork - External Walls',
        taskType: 'WORK',
        description: 'Construct external walls with bricks',
        projectId: 1003,
        status: 'active'
      }
    ];

    console.log('\n📋 Creating tasks in tasks collection...');
    for (const taskData of tasksToCreate) {
      await Task.findOneAndUpdate(
        { id: taskData.id },
        taskData,
        { upsert: true, new: true }
      );
      console.log(`   ✅ Task ${taskData.id}: ${taskData.taskName}`);
    }

    // Create task assignments for Employee 2
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignments = [
      {
        id: nextId++,
        taskId: 2001,
        taskName: 'Concrete Pouring - Foundation',
        employeeId: 2,
        projectId: 1003,
        status: 'pending',
        date: today,
        sequence: 1,
        workArea: 'Foundation Area',
        floor: 'Ground',
        zone: 'Zone A',
        priority: 'high',
        progressPercent: 0,
        dailyTarget: {
          description: 'Pour 50 cubic meters of concrete',
          quantity: 50,
          unit: 'cubic meters',
          targetCompletion: 100,
          targetType: 'Quantity',
          areaLevel: 'Foundation',
          startTime: '08:00',
          expectedFinish: '16:00',
          progressToday: 0
        },
        supervisorInstructions: {
          text: 'Ensure proper vibration and curing. Check concrete mix quality before pouring.',
          attachments: [],
          lastUpdated: new Date()
        },
        timeEstimate: {
          estimated: 480,
          elapsed: 0,
          remaining: 480
        },
        dependencies: [],
        requiredTools: ['Concrete Mixer', 'Vibrator', 'Trowels'],
        requiredMaterials: ['Cement', 'Sand', 'Aggregate', 'Water'],
        trade: 'Concrete Work',
        activity: 'Pouring',
        workType: 'Foundation'
      },
      {
        id: nextId++,
        taskId: 2002,
        taskName: 'Steel Reinforcement - Columns',
        employeeId: 2,
        projectId: 1003,
        status: 'pending',
        date: today,
        sequence: 2,
        workArea: 'Column Area',
        floor: 'Ground',
        zone: 'Zone B',
        priority: 'medium',
        progressPercent: 0,
        dailyTarget: {
          description: 'Install reinforcement for 10 columns',
          quantity: 10,
          unit: 'columns',
          targetCompletion: 100,
          targetType: 'Quantity',
          areaLevel: 'Ground Floor',
          startTime: '08:00',
          expectedFinish: '17:00',
          progressToday: 0
        },
        supervisorInstructions: {
          text: 'Follow structural drawings. Ensure proper spacing and cover.',
          attachments: [],
          lastUpdated: new Date()
        },
        timeEstimate: {
          estimated: 540,
          elapsed: 0,
          remaining: 540
        },
        dependencies: [2001],
        requiredTools: ['Cutting Machine', 'Bending Machine', 'Tie Wire'],
        requiredMaterials: ['Steel Bars', 'Binding Wire', 'Spacers'],
        trade: 'Steel Fixing',
        activity: 'Installation',
        workType: 'Structural'
      },
      {
        id: nextId++,
        taskId: 2003,
        taskName: 'Brickwork - External Walls',
        employeeId: 2,
        projectId: 1003,
        status: 'pending',
        date: today,
        sequence: 3,
        workArea: 'External Perimeter',
        floor: 'Ground',
        zone: 'Zone C',
        priority: 'medium',
        progressPercent: 0,
        dailyTarget: {
          description: 'Complete 100 square meters of brickwork',
          quantity: 100,
          unit: 'square meters',
          targetCompletion: 100,
          targetType: 'Area',
          areaLevel: 'Ground Floor',
          startTime: '08:00',
          expectedFinish: '17:00',
          progressToday: 0
        },
        supervisorInstructions: {
          text: 'Maintain proper alignment and mortar joints. Check plumb regularly.',
          attachments: [],
          lastUpdated: new Date()
        },
        timeEstimate: {
          estimated: 540,
          elapsed: 0,
          remaining: 540
        },
        dependencies: [2002],
        requiredTools: ['Trowel', 'Spirit Level', 'Plumb Bob', 'Measuring Tape'],
        requiredMaterials: ['Bricks', 'Cement', 'Sand', 'Water'],
        trade: 'Masonry',
        activity: 'Brickwork',
        workType: 'Walls'
      }
    ];

    console.log('\n📋 Creating task assignments...');
    for (const assignment of assignments) {
      const created = await WorkerTaskAssignment.create(assignment);
      console.log(`   ✅ Assignment ${created.id}: ${created.taskName} (Status: ${created.status})`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ SUCCESS - Tasks Created for Employee 2');
    console.log('='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   Employee: Ravi Smith (ID: 2)`);
    console.log(`   Tasks Created: ${assignments.length}`);
    console.log(`   All Status: pending`);
    console.log(`   Date: ${today.toDateString()}`);
    console.log(`   Project: 1003 (School Campus Construction)`);
    
    console.log('\n🔄 Next Steps:');
    console.log('   1. Mobile app: Pull to refresh on Today\'s Tasks screen');
    console.log('   2. You should now see 3 tasks for Ravi Smith');
    console.log('   3. All tasks should have status "pending"');
    console.log('   4. No "Continue Working" buttons should appear');
    
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

createTasksForEmployee2();
