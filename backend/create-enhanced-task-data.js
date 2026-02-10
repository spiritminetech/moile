import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Task from './src/modules/task/Task.js';
import Employee from './src/modules/employee/Employee.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createEnhancedTaskData = async () => {
  await connectDB();

  try {
    console.log('\n🔧 CREATING ENHANCED TASK DATA WITH ALL NEW FEATURES\n');

    // 1. Update project with client name
    const project = await Project.findOne({ id: 1 });
    if (project) {
      project.clientName = 'ABC Construction Ltd';
      await project.save();
      console.log('✅ Updated project with client name:', project.clientName);
    }

    // 2. Find a worker
    const worker = await Employee.findOne({ 
      id: 101
    });

    if (!worker) {
      console.log('❌ No worker found with ID 101. Please check available workers.');
      return;
    }

    console.log('👷 Found worker:', worker.fullName, '(ID:', worker.id, ')');

    // 3. Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Creating tasks for date:', today);

    // 4. Clear existing assignments for today
    await WorkerTaskAssignment.deleteMany({
      employeeId: worker.id,
      date: today
    });

    // 5. Create enhanced task assignments with all new features
    const enhancedTasks = [
      {
        taskName: 'Foundation Excavation',
        description: 'Excavate foundation area according to architectural drawings',
        priority: 'high',
        workArea: 'Zone A - Foundation',
        floor: 'Ground Level',
        zone: 'North Section',
        dailyTarget: {
          description: 'Excavate 50 cubic meters of soil',
          quantity: 50,
          unit: 'cubic meters',
          targetCompletion: 100
        },
        supervisorInstructions: {
          text: 'Follow safety protocols. Check for utilities before digging. Maintain proper slope angles.',
          attachments: [
            {
              type: 'drawing',
              filename: 'foundation-plan-rev3.pdf',
              url: 'https://example.com/drawings/foundation-plan-rev3.pdf',
              uploadedAt: new Date(),
              uploadedBy: 1,
              description: 'Updated foundation plan with utility locations',
              fileSize: 2048576,
              mimeType: 'application/pdf'
            },
            {
              type: 'photo',
              filename: 'site-reference-photo.jpg',
              url: 'https://example.com/photos/site-reference-photo.jpg',
              uploadedAt: new Date(),
              uploadedBy: 1,
              description: 'Reference photo showing excavation boundaries',
              fileSize: 1024000,
              mimeType: 'image/jpeg'
            }
          ],
          lastUpdated: new Date(),
          updatedBy: 1
        },
        timeEstimate: {
          estimated: 480, // 8 hours in minutes
          elapsed: 0,
          remaining: 480
        },
        sequence: 1,
        dependencies: []
      },
      {
        taskName: 'Reinforcement Installation',
        description: 'Install steel reinforcement bars as per structural drawings',
        priority: 'critical',
        workArea: 'Zone A - Foundation',
        floor: 'Ground Level',
        zone: 'North Section',
        dailyTarget: {
          description: 'Install 200 steel bars with proper spacing',
          quantity: 200,
          unit: 'steel bars',
          targetCompletion: 100
        },
        supervisorInstructions: {
          text: 'Ensure proper spacing and overlap. Check bar diameter and grade. Use tie wire for connections.',
          attachments: [
            {
              type: 'drawing',
              filename: 'reinforcement-details.pdf',
              url: 'https://example.com/drawings/reinforcement-details.pdf',
              uploadedAt: new Date(),
              uploadedBy: 1,
              description: 'Detailed reinforcement layout and specifications',
              fileSize: 3072000,
              mimeType: 'application/pdf'
            },
            {
              type: 'document',
              filename: 'steel-grade-certificate.pdf',
              url: 'https://example.com/docs/steel-grade-certificate.pdf',
              uploadedAt: new Date(),
              uploadedBy: 1,
              description: 'Steel grade certification from supplier',
              fileSize: 512000,
              mimeType: 'application/pdf'
            },
            {
              type: 'video',
              filename: 'rebar-installation-guide.mp4',
              url: 'https://example.com/videos/rebar-installation-guide.mp4',
              uploadedAt: new Date(),
              uploadedBy: 1,
              description: 'Video guide for proper rebar installation techniques',
              fileSize: 15728640,
              mimeType: 'video/mp4'
            }
          ],
          lastUpdated: new Date(),
          updatedBy: 1
        },
        timeEstimate: {
          estimated: 360, // 6 hours in minutes
          elapsed: 0,
          remaining: 360
        },
        sequence: 2,
        dependencies: [1] // Depends on first task
      },
      {
        taskName: 'Concrete Pouring',
        description: 'Pour concrete for foundation with proper compaction',
        priority: 'medium',
        workArea: 'Zone A - Foundation',
        floor: 'Ground Level',
        zone: 'North Section',
        dailyTarget: {
          description: 'Pour 25 cubic meters of concrete',
          quantity: 25,
          unit: 'cubic meters',
          targetCompletion: 100
        },
        supervisorInstructions: {
          text: 'Ensure continuous pour. Use vibrator for proper compaction. Check slump test results.',
          attachments: [
            {
              type: 'document',
              filename: 'concrete-mix-design.pdf',
              url: 'https://example.com/docs/concrete-mix-design.pdf',
              uploadedAt: new Date(),
              uploadedBy: 1,
              description: 'Approved concrete mix design and specifications',
              fileSize: 768000,
              mimeType: 'application/pdf'
            },
            {
              type: 'photo',
              filename: 'compaction-technique.jpg',
              url: 'https://example.com/photos/compaction-technique.jpg',
              uploadedAt: new Date(),
              uploadedBy: 1,
              description: 'Proper vibrator usage technique',
              fileSize: 896000,
              mimeType: 'image/jpeg'
            }
          ],
          lastUpdated: new Date(),
          updatedBy: 1
        },
        timeEstimate: {
          estimated: 240, // 4 hours in minutes
          elapsed: 0,
          remaining: 240
        },
        sequence: 3,
        dependencies: [1, 2] // Depends on both previous tasks
      }
    ];

    // 6. Create task assignments
    for (let i = 0; i < enhancedTasks.length; i++) {
      const taskData = enhancedTasks[i];
      
      // Get next assignment ID
      const lastAssignment = await WorkerTaskAssignment.findOne({}, {}, { sort: { id: -1 } });
      const nextId = lastAssignment ? lastAssignment.id + 1 : 1;

      const assignment = new WorkerTaskAssignment({
        id: nextId,
        employeeId: worker.id,
        projectId: 1,
        supervisorId: 1,
        taskId: i + 1,
        date: today,
        status: 'queued',
        companyId: worker.companyId,
        
        // Enhanced fields
        workArea: taskData.workArea,
        floor: taskData.floor,
        zone: taskData.zone,
        priority: taskData.priority,
        sequence: taskData.sequence,
        dependencies: taskData.dependencies,
        
        dailyTarget: taskData.dailyTarget,
        timeEstimate: taskData.timeEstimate,
        supervisorInstructions: taskData.supervisorInstructions,
        
        geofenceValidation: {
          required: true,
          lastValidated: null,
          validationLocation: null
        }
      });

      await assignment.save();
      console.log(`✅ Created enhanced assignment: ${assignment.id} - ${taskData.taskName}`);
      console.log(`   Priority: ${taskData.priority}, Work Area: ${taskData.workArea}`);
      console.log(`   Daily Target: ${taskData.dailyTarget.quantity} ${taskData.dailyTarget.unit}`);
      console.log(`   Attachments: ${taskData.supervisorInstructions.attachments.length}`);
      console.log(`   Dependencies: [${taskData.dependencies.join(', ')}]`);
    }

    console.log('\n🎉 ENHANCED TASK DATA CREATION COMPLETE!');
    console.log('\n📱 New features available in mobile app:');
    console.log('   ✅ Client name display');
    console.log('   ✅ Priority indicators with colors and icons');
    console.log('   ✅ Enhanced dependency visualization');
    console.log('   ✅ Supervisor instruction attachments');
    console.log('   ✅ Work area, floor, and zone information');
    console.log('   ✅ Daily targets with quantities and units');
    console.log('   ✅ Interactive map integration (react-native-maps)');
    
    console.log('\n🧪 Test the mobile app now to see all enhancements!');
    console.log(`   Login with: ${worker.email}`);
    console.log('   Navigate to Today\'s Tasks screen');

  } catch (error) {
    console.error('❌ Error creating enhanced task data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

createEnhancedTaskData();