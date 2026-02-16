import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

const WorkerTaskAssignment = mongoose.model('WorkerTaskAssignment', new mongoose.Schema({}, { strict: false, collection: 'workertaskassignments' }));

async function cleanAndRecreateTasks() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Delete ALL tasks for Employee ID 2 (including old ones)
    console.log('\n🗑️ Deleting ALL tasks for Employee ID 2...');
    const deleteResult = await WorkerTaskAssignment.deleteMany({ 
      employeeId: 2
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} tasks`);

    // Create fresh 5 tasks
    console.log('\n📝 Creating 5 new tasks for Employee ID 2...');

    const tasks = [
      {
        taskId: 7033,
        employeeId: 2,
        projectId: 1003,
        assignedDate: today,
        status: 'completed',
        priority: 'high',
        taskName: 'Install Plumbing Fixtures',
        description: 'Install sinks and faucets in restrooms',
        location: 'Building A - Restrooms',
        estimatedHours: 5,
        actualHours: 5,
        startTime: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 13 * 60 * 60 * 1000),
        notes: 'Completed successfully',
        supervisorId: 4,
        supervisorName: 'Kawaja',
        supervisorEmail: 'kawaja@construction.com',
        supervisorPhone: '+9876543210',
        supervisorInstructions: 'Ensure all connections are leak-proof. Test water pressure.',
        sequence: 1,
        dependencies: [],
        toolsRequired: ['Pipe Wrench', 'Pliers', 'Teflon Tape', 'Level'],
        materialsRequired: ['Sinks', 'Faucets', 'P-Traps', 'Supply Lines'],
        safetyRequirements: ['Safety Glasses', 'Gloves'],
        dailyTarget: {
          targetQuantity: 6,
          targetUnit: 'fixtures',
          targetDescription: 'Install 6 plumbing fixtures',
          completedQuantity: 6,
          progressPercentage: 100
        }
      },
      {
        taskId: 7034,
        employeeId: 2,
        projectId: 1003,
        assignedDate: today,
        status: 'completed',
        priority: 'high',
        taskName: 'Repair Ceiling Tiles',
        description: 'Replace damaged ceiling tiles in corridors',
        location: 'Building A - Corridors',
        estimatedHours: 3,
        actualHours: 3,
        startTime: new Date(today.getTime() + 13 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 16 * 60 * 60 * 1000),
        notes: 'All tiles replaced',
        supervisorId: 4,
        supervisorName: 'Kawaja',
        supervisorEmail: 'kawaja@construction.com',
        supervisorPhone: '+9876543210',
        supervisorInstructions: 'Match existing tile pattern. Dispose of old tiles properly.',
        sequence: 2,
        dependencies: [7033],
        toolsRequired: ['Ladder', 'Utility Knife', 'Measuring Tape'],
        materialsRequired: ['Ceiling Tiles', 'Grid Clips', 'Adhesive'],
        safetyRequirements: ['Hard Hat', 'Safety Glasses'],
        dailyTarget: {
          targetQuantity: 20,
          targetUnit: 'tiles',
          targetDescription: 'Replace 20 ceiling tiles',
          completedQuantity: 20,
          progressPercentage: 100
        }
      },
      {
        taskId: 7035,
        employeeId: 2,
        projectId: 1003,
        assignedDate: today,
        status: 'in_progress',
        priority: 'high',
        taskName: 'Install LED Lighting',
        description: 'Install energy-efficient LED lights in classrooms',
        location: 'Building A - Classrooms',
        estimatedHours: 4,
        actualHours: 2,
        startTime: new Date(today.getTime() + 16 * 60 * 60 * 1000),
        endTime: null,
        notes: 'In progress',
        supervisorId: 4,
        supervisorName: 'Kawaja',
        supervisorEmail: 'kawaja@construction.com',
        supervisorPhone: '+9876543210',
        supervisorInstructions: 'Follow electrical safety protocols. Test each light after installation.',
        sequence: 3,
        dependencies: [7034],
        toolsRequired: ['Screwdriver', 'Wire Stripper', 'Voltage Tester', 'Ladder'],
        materialsRequired: ['LED Panels', 'Mounting Hardware', 'Wire Connectors'],
        safetyRequirements: ['Electrical Safety Gloves', 'Safety Glasses'],
        dailyTarget: {
          targetQuantity: 10,
          targetUnit: 'lights',
          targetDescription: 'Install 10 LED light panels',
          completedQuantity: 5,
          progressPercentage: 50
        }
      },
      {
        taskId: 7036,
        employeeId: 2,
        projectId: 1003,
        assignedDate: today,
        status: 'queued',
        priority: 'medium',
        taskName: 'Install Electrical Fixtures',
        description: 'Install light fixtures and electrical outlets in classrooms',
        location: 'Building A - Classrooms',
        estimatedHours: 4,
        actualHours: 0,
        startTime: null,
        endTime: null,
        notes: '',
        supervisorId: 4,
        supervisorName: 'Kawaja',
        supervisorEmail: 'kawaja@construction.com',
        supervisorPhone: '+9876543210',
        supervisorInstructions: 'Follow electrical safety protocols. Test all connections before final installation.',
        sequence: 4,
        dependencies: [7035],
        toolsRequired: ['Screwdriver Set', 'Wire Stripper', 'Voltage Tester', 'Drill'],
        materialsRequired: ['Light Fixtures', 'Electrical Outlets', 'Wire Connectors', 'Mounting Brackets'],
        safetyRequirements: ['Electrical Safety Gloves', 'Safety Glasses', 'Insulated Tools'],
        dailyTarget: {
          targetQuantity: 12,
          targetUnit: 'fixtures',
          targetDescription: 'Install 12 light fixtures and outlets',
          completedQuantity: 0,
          progressPercentage: 0
        }
      },
      {
        taskId: 7037,
        employeeId: 2,
        projectId: 1003,
        assignedDate: today,
        status: 'queued',
        priority: 'low',
        taskName: 'Paint Interior Walls',
        description: 'Apply primer and paint to classroom walls',
        location: 'Building A - Classrooms',
        estimatedHours: 6,
        actualHours: 0,
        startTime: null,
        endTime: null,
        notes: '',
        supervisorId: 4,
        supervisorName: 'Kawaja',
        supervisorEmail: 'kawaja@construction.com',
        supervisorPhone: '+9876543210',
        supervisorInstructions: 'Apply one coat of primer, then two coats of paint. Allow proper drying time between coats.',
        sequence: 5,
        dependencies: [7036],
        toolsRequired: ['Paint Roller', 'Paint Brushes', 'Paint Tray', 'Drop Cloth', 'Ladder'],
        materialsRequired: ['Primer', 'Interior Paint', 'Painter\'s Tape', 'Sandpaper'],
        safetyRequirements: ['Dust Mask', 'Safety Glasses', 'Gloves'],
        dailyTarget: {
          targetQuantity: 200,
          targetUnit: 'sq ft',
          targetDescription: 'Paint 200 square feet of wall area',
          completedQuantity: 0,
          progressPercentage: 0
        }
      }
    ];

    await WorkerTaskAssignment.insertMany(tasks);
    console.log(`✅ Created ${tasks.length} tasks`);

    // Verify
    const allTasks = await WorkerTaskAssignment.find({ 
      employeeId: 2
    }).sort({ sequence: 1 });

    console.log(`\n📊 Total tasks for Employee ID 2: ${allTasks.length}`);
    console.log('\n' + '='.repeat(80));
    
    allTasks.forEach((task, index) => {
      console.log(`\n${index + 1}. ${task.taskName} (ID: ${task.taskId})`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Priority: ${task.priority}`);
      console.log(`   Assigned Date: ${task.assignedDate}`);
      console.log(`   Daily Target: ${task.dailyTarget?.targetQuantity || 0} ${task.dailyTarget?.targetUnit || ''}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ All done! Refresh the mobile app to see 5 tasks.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

cleanAndRecreateTasks();
