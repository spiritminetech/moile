// Assign three tasks and three projects for Employee 107 for today
import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import Task from './src/modules/task/Task.js';
import Project from './src/modules/project/models/Project.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';

const MONGODB_URI = 'mongodb+srv://anbarasus2410_db_user:f9YX0Aa0E4jdxAbn@erp.hlff2qz.mongodb.net/erp?appName=erp';

async function assignThreeTasksThreeProjectsForEmployee107() {
  console.log('📋 Assigning Three Tasks & Three Projects for Employee 107');
  console.log('==========================================================');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get Employee 107
    const employee = await Employee.findOne({ id: 107 });
    if (!employee) {
      console.log('❌ Employee 107 not found');
      return;
    }

    console.log('\n👤 Employee Details:');
    console.log(`   Employee ID: ${employee.id}`);
    console.log(`   Name: ${employee.fullName}`);
    console.log(`   Company ID: ${employee.companyId}`);

    // Get today's date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log(`\n📅 Today's Date: ${today}`);

    // Check existing assignments
    const existingAssignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    });

    console.log(`\n🔍 Existing assignments for today: ${existingAssignments.length}`);
    if (existingAssignments.length > 0) {
      console.log('   Existing assignments:');
      existingAssignments.forEach((assignment, index) => {
        console.log(`   ${index + 1}. Assignment ID: ${assignment.id}, Task ID: ${assignment.taskId}, Project: ${assignment.projectId}`);
      });
    }

    // STEP 1: Create/Find Three Projects
    console.log('\n🏗️ STEP 1: Creating/Finding Three Projects...');
    
    const projectsData = [
      {
        projectName: 'Downtown Office Complex',
        description: 'Construction of modern office complex in downtown area',
        jobNature: 'Commercial Construction',
        jobSubtype: 'Office Building',
        address: '123 Business District, Downtown',
        latitude: 12.9716,
        longitude: 77.5946,
        geofenceRadius: 100,
        status: 'Ongoing'
      },
      {
        projectName: 'Residential Apartment Block',
        description: 'Multi-story residential apartment construction',
        jobNature: 'Residential Construction',
        jobSubtype: 'Apartment Complex',
        address: '456 Housing Colony, Suburb',
        latitude: 12.9352,
        longitude: 77.6245,
        geofenceRadius: 150,
        status: 'Ongoing'
      },
      {
        projectName: 'Industrial Warehouse Facility',
        description: 'Large-scale warehouse and logistics facility',
        jobNature: 'Industrial Construction',
        jobSubtype: 'Warehouse',
        address: '789 Industrial Area, Outskirts',
        latitude: 12.8456,
        longitude: 77.6632,
        geofenceRadius: 200,
        status: 'Ongoing'
      }
    ];

    const projects = [];
    
    for (let i = 0; i < projectsData.length; i++) {
      const projectData = projectsData[i];
      
      // Check if project already exists
      let project = await Project.findOne({ 
        projectName: projectData.projectName,
        companyId: employee.companyId 
      });

      if (!project) {
        // Get next project ID
        const lastProject = await Project.findOne().sort({ id: -1 }).select("id");
        const nextProjectId = lastProject ? lastProject.id + 1 : 1000;

        // Create new project
        project = new Project({
          id: nextProjectId,
          companyId: employee.companyId,
          projectCode: `PROJ-${nextProjectId}`,
          projectName: projectData.projectName,
          description: projectData.description,
          jobNature: projectData.jobNature,
          jobSubtype: projectData.jobSubtype,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          status: projectData.status,
          address: projectData.address,
          latitude: projectData.latitude,
          longitude: projectData.longitude,
          geofenceRadius: projectData.geofenceRadius,
          geofence: {
            center: {
              latitude: projectData.latitude,
              longitude: projectData.longitude
            },
            radius: projectData.geofenceRadius,
            strictMode: true,
            allowedVariance: 10
          },
          budgetLabor: 500000,
          budgetMaterials: 1000000,
          budgetTools: 100000,
          budgetTransport: 50000,
          createdBy: 1,
          projectManagerId: 1,
          supervisorId: 1
        });

        await project.save();
        console.log(`   ✅ Created Project ${project.id}: ${project.projectName}`);
      } else {
        console.log(`   ✅ Found existing Project ${project.id}: ${project.projectName}`);
      }

      projects.push(project);
    }

    // STEP 2: Create/Find Three Tasks (one for each project)
    console.log('\n📝 STEP 2: Creating/Finding Three Tasks...');
    
    const tasksData = [
      {
        taskName: 'Foundation Work Inspection',
        taskType: 'Inspection',
        description: 'Inspect foundation work and structural integrity',
        workArea: 'Foundation Area',
        floor: 'Ground Level',
        zone: 'Zone A',
        priority: 'high',
        sequence: 1,
        timeEstimate: { estimated: 120, elapsed: 0, remaining: 120 },
        dailyTarget: { description: 'Complete foundation inspection', quantity: 1, unit: 'inspection', targetCompletion: 100 }
      },
      {
        taskName: 'Material Quality Check',
        taskType: 'Deliver Material',
        description: 'Check quality and quantity of delivered materials',
        workArea: 'Storage Area',
        floor: 'Ground Level',
        zone: 'Zone B',
        priority: 'medium',
        sequence: 2,
        timeEstimate: { estimated: 90, elapsed: 0, remaining: 90 },
        dailyTarget: { description: 'Quality check materials', quantity: 10, unit: 'batches', targetCompletion: 100 }
      },
      {
        taskName: 'Daily Progress Report',
        taskType: 'Work Progress',
        description: 'Document daily work progress and update status',
        workArea: 'Site Office',
        floor: 'Ground Level',
        zone: 'Zone C',
        priority: 'medium',
        sequence: 3,
        timeEstimate: { estimated: 60, elapsed: 0, remaining: 60 },
        dailyTarget: { description: 'Complete progress report', quantity: 1, unit: 'report', targetCompletion: 100 }
      }
    ];

    const tasks = [];
    
    for (let i = 0; i < tasksData.length; i++) {
      const taskData = tasksData[i];
      const project = projects[i]; // Assign each task to corresponding project
      
      // Check if task already exists
      let task = await Task.findOne({ 
        taskName: taskData.taskName,
        projectId: project.id,
        companyId: employee.companyId 
      });

      if (!task) {
        // Get next task ID
        const lastTask = await Task.findOne().sort({ id: -1 }).select("id");
        const nextTaskId = lastTask ? lastTask.id + 1 : 2000;

        // Create new task
        task = new Task({
          id: nextTaskId,
          companyId: employee.companyId,
          projectId: project.id,
          taskType: taskData.taskType,
          taskName: taskData.taskName,
          description: taskData.description,
          status: 'PLANNED',
          startDate: new Date(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          createdBy: 1,
          assignedBy: 1
        });

        await task.save();
        console.log(`   ✅ Created Task ${task.id}: ${task.taskName} (Project: ${project.projectName})`);
      } else {
        console.log(`   ✅ Found existing Task ${task.id}: ${task.taskName} (Project: ${project.projectName})`);
      }

      tasks.push({ task, taskData, project });
    }

    // STEP 3: Create Task Assignments
    console.log('\n🎯 STEP 3: Creating Task Assignments...');
    
    // Get next assignment ID
    const lastAssignment = await WorkerTaskAssignment.findOne().sort({ id: -1 }).select("id");
    let nextAssignmentId = lastAssignment ? lastAssignment.id + 1 : 3000;

    const assignments = [];

    for (let i = 0; i < tasks.length; i++) {
      const { task, taskData, project } = tasks[i];

      // Check if assignment already exists
      const existingAssignment = await WorkerTaskAssignment.findOne({
        employeeId: employee.id,
        taskId: task.id,
        projectId: project.id,
        date: today
      });

      if (existingAssignment) {
        console.log(`   ⚠️ Assignment already exists for Task ${task.id} in Project ${project.id}`);
        assignments.push(existingAssignment);
        continue;
      }

      // Create new assignment
      const assignment = new WorkerTaskAssignment({
        id: nextAssignmentId++,
        projectId: project.id,
        employeeId: employee.id,
        supervisorId: 1,
        taskId: task.id,
        date: today,
        status: 'queued',
        companyId: employee.companyId,
        dailyTarget: taskData.dailyTarget,
        workArea: taskData.workArea,
        floor: taskData.floor,
        zone: taskData.zone,
        timeEstimate: taskData.timeEstimate,
        priority: taskData.priority,
        sequence: taskData.sequence,
        dependencies: i > 0 ? [assignments[i-1].id] : [],
        geofenceValidation: {
          required: true,
          validationLocation: {
            latitude: project.latitude,
            longitude: project.longitude
          }
        }
      });

      await assignment.save();
      console.log(`   ✅ Created Assignment ${assignment.id}: ${task.taskName} → ${project.projectName}`);
      assignments.push(assignment);
    }

    // STEP 4: Summary Report
    console.log('\n📊 ASSIGNMENT SUMMARY REPORT');
    console.log('============================');
    console.log(`Employee: ${employee.fullName} (ID: ${employee.id})`);
    console.log(`Date: ${today}`);
    console.log(`Total Projects: ${projects.length}`);
    console.log(`Total Tasks: ${tasks.length}`);
    console.log(`Total Assignments: ${assignments.length}`);
    console.log('');

    console.log('🏗️ PROJECTS ASSIGNED:');
    projects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.projectName} (ID: ${project.id})`);
      console.log(`      Type: ${project.jobNature}`);
      console.log(`      Location: ${project.address}`);
      console.log(`      Coordinates: ${project.latitude}, ${project.longitude}`);
      console.log(`      Geofence Radius: ${project.geofenceRadius}m`);
      console.log('');
    });

    console.log('📋 TASKS & ASSIGNMENTS:');
    assignments.forEach((assignment, index) => {
      const { task, project } = tasks[index];
      console.log(`   ${index + 1}. ${task.taskName}`);
      console.log(`      Assignment ID: ${assignment.id}`);
      console.log(`      Task ID: ${task.id}`);
      console.log(`      Project: ${project.projectName} (ID: ${project.id})`);
      console.log(`      Priority: ${assignment.priority}`);
      console.log(`      Estimated Time: ${assignment.timeEstimate.estimated} minutes`);
      console.log(`      Work Area: ${assignment.workArea} - ${assignment.zone}`);
      console.log(`      Status: ${assignment.status}`);
      console.log(`      Daily Target: ${assignment.dailyTarget.description}`);
      console.log('');
    });

    console.log('✅ SUCCESS! Three tasks and three projects successfully assigned to Employee 107!');
    console.log('\n📱 Mobile App Features Available:');
    console.log('   ✓ Employee can see 3 different projects in dashboard');
    console.log('   ✓ Each project has 1 task assigned for today');
    console.log('   ✓ Tasks are sequenced and have dependencies');
    console.log('   ✓ Geofence validation enabled for each project location');
    console.log('   ✓ Time estimates and daily targets set for each task');
    console.log('   ✓ Work areas and zones defined for navigation');

  } catch (error) {
    console.error('❌ Assignment failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

assignThreeTasksThreeProjectsForEmployee107();