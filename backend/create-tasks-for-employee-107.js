// Create tasks for employee 107 (worker@gmail.com)
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function createTasksForEmployee107() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const tasksCollection = db.collection('workertaskassignments');
    const employeesCollection = db.collection('employees');
    const projectsCollection = db.collection('projects');

    // Verify employee 107 exists
    const employee = await employeesCollection.findOne({ id: 107 });
    if (!employee) {
      console.log('❌ Employee 107 not found');
      return;
    }

    console.log(`✅ Employee: ${employee.fullName} (ID: ${employee.id})\n`);

    // Verify project 1003 exists
    const project = await projectsCollection.findOne({ id: 1003 });
    if (!project) {
      console.log('❌ Project 1003 not found');
      return;
    }

    console.log(`✅ Project: ${project.projectName} (ID: ${project.id})\n`);

    // Get next assignment ID
    const lastTask = await tasksCollection.find().sort({ id: -1 }).limit(1).toArray();
    let nextId = lastTask.length > 0 ? lastTask[0].id + 1 : 7034;

    console.log(`📝 Creating tasks starting from ID: ${nextId}\n`);

    // Create 3 tasks
    const tasks = [
      {
        id: nextId,
        employeeId: 107,
        projectId: 1003,
        supervisorId: 4,
        taskName: "Bricklaying",
        description: "Build brick walls",
        status: "completed",
        priority: "medium",
        estimatedHours: 8,
        sequence: 1,
        floor: "Ground Floor",
        workArea: "Main Construction Area",
        natureOfWork: "General Construction",
        supervisorInstructions: "Build brick walls",
        startedAt: new Date("2026-02-14T06:31:58.880Z"),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date("2026-02-14T06:35:17.463Z"),
        instructionAttachments: [],
        instructionsLastUpdated: new Date("2026-02-14T05:49:09.530Z"),
        dependencies: [],
        requiredTools: ["Trowel", "Level", "Hammer"],
        requiredMaterials: ["Bricks", "Cement", "Sand"],
        dailyTarget: {
          unit: "sq ft",
          quantity: 100
        },
        timeEstimate: {
          hours: 8,
          minutes: 0
        },
        progress: {
          percentage: 100,
          lastUpdated: new Date("2026-02-14T06:35:17.463Z")
        },
        location: {
          latitude: project.location?.coordinates?.[1] || 1.3521,
          longitude: project.location?.coordinates?.[0] || 103.8198
        },
        projectGeofence: project.geofence || {
          radius: 100,
          center: {
            latitude: 1.3521,
            longitude: 103.8198
          }
        }
      },
      {
        id: nextId + 1,
        employeeId: 107,
        projectId: 1003,
        supervisorId: 4,
        taskName: "Install Classroom Lighting Fixtures",
        description: "Install LED lighting fixtures in classrooms on the second floor",
        status: "in_progress",
        priority: "high",
        estimatedHours: 8,
        sequence: 0,
        natureOfWork: "General Construction",
        supervisorInstructions: "Install LED lighting fixtures in classrooms on the second floor",
        startedAt: new Date("2026-02-14T07:17:03.027Z"),
        createdAt: new Date(),
        updatedAt: new Date("2026-02-14T09:12:06.310Z"),
        instructionAttachments: [],
        instructionsLastUpdated: new Date("2026-02-14T06:54:07.695Z"),
        dependencies: [],
        requiredTools: ["Screwdriver", "Wire Stripper", "Ladder"],
        requiredMaterials: ["LED Fixtures", "Wiring", "Mounting Brackets"],
        dailyTarget: {
          unit: "fixtures",
          quantity: 12
        },
        timeEstimate: {
          hours: 8,
          minutes: 0
        },
        progress: {
          percentage: 45,
          lastUpdated: new Date("2026-02-14T09:12:06.310Z")
        },
        location: {
          latitude: project.location?.coordinates?.[1] || 1.3521,
          longitude: project.location?.coordinates?.[0] || 103.8198
        },
        projectGeofence: project.geofence || {
          radius: 100,
          center: {
            latitude: 1.3521,
            longitude: 103.8198
          }
        }
      },
      {
        id: nextId + 2,
        employeeId: 107,
        projectId: 1003,
        supervisorId: 4,
        taskName: "Paint Corridor Walls",
        description: "Apply fresh coat of paint to main corridor walls",
        status: "in_progress",
        priority: "medium",
        estimatedHours: 8,
        sequence: 0,
        natureOfWork: "General Construction",
        supervisorInstructions: "Apply fresh coat of paint to main corridor walls",
        startedAt: new Date("2026-02-14T08:28:41.123Z"),
        createdAt: new Date(),
        updatedAt: new Date(),
        instructionAttachments: [],
        instructionsLastUpdated: new Date("2026-02-14T06:54:07.696Z"),
        dependencies: [],
        requiredTools: ["Paint Roller", "Brush", "Tray"],
        requiredMaterials: ["Paint", "Primer", "Drop Cloth"],
        dailyTarget: {
          unit: "sq ft",
          quantity: 200
        },
        timeEstimate: {
          hours: 8,
          minutes: 0
        },
        progress: {
          percentage: 30,
          lastUpdated: new Date()
        },
        location: {
          latitude: project.location?.coordinates?.[1] || 1.3521,
          longitude: project.location?.coordinates?.[0] || 103.8198
        },
        projectGeofence: project.geofence || {
          radius: 100,
          center: {
            latitude: 1.3521,
            longitude: 103.8198
          }
        }
      }
    ];

    // Insert tasks
    console.log('🔄 Creating tasks...\n');
    const result = await tasksCollection.insertMany(tasks);
    console.log(`✅ Created ${result.insertedCount} tasks\n`);

    // Display created tasks
    console.log('=== CREATED TASKS ===\n');
    tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.taskName}`);
      console.log(`   Assignment ID: ${task.id}`);
      console.log(`   Employee ID: ${task.employeeId}`);
      console.log(`   Project ID: ${task.projectId}`);
      console.log(`   Supervisor ID: ${task.supervisorId} ✅`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Priority: ${task.priority}`);
      console.log('');
    });

    // Verify supervisor exists
    const supervisor = await employeesCollection.findOne({ id: 4 });
    if (supervisor) {
      console.log('=== SUPERVISOR INFO ===');
      console.log(`✅ Supervisor: ${supervisor.fullName}`);
      console.log(`   Employee ID: ${supervisor.id}`);
      console.log(`   Phone: ${supervisor.phone || 'N/A'}`);
      console.log(`   Email: ${supervisor.email || 'N/A'}\n`);
    }

    console.log('=== SUCCESS ===');
    console.log('✅ All tasks created with supervisor assigned');
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Restart your backend server (Ctrl+C and npm start)');
    console.log('2. Login to mobile app as worker@gmail.com');
    console.log('3. Go to Today\'s Tasks screen');
    console.log('4. Expand any task to see supervisor information');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createTasksForEmployee107();
