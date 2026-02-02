import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Project from './src/modules/project/models/Project.js';
import appConfig from './src/config/app.config.js';

async function checkWorkerAssignment() {
  try {
    // Connect to MongoDB
    await mongoose.connect(appConfig.database.uri, { 
      dbName: appConfig.database.name,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find worker@gmail.com employee
    const employee = await Employee.findOne({ 
      userId: 2,  // From login test
      companyId: 1 
    });
    
    if (!employee) {
      console.log('❌ Employee not found for worker@gmail.com');
      return;
    }
    
    console.log(`\n👤 Worker Details:`);
    console.log(`Employee ID: ${employee.id}`);
    console.log(`Name: ${employee.fullName}`);
    console.log(`Email: ${employee.email}`);
    console.log(`Company ID: ${employee.companyId}`);
    console.log(`Status: ${employee.status}`);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📅 Checking assignments for today: ${today}`);

    // Find today's task assignments
    const assignments = await WorkerTaskAssignment.find({
      employeeId: employee.id,
      date: today
    });

    console.log(`\n📋 Found ${assignments.length} task assignments for today:`);
    
    for (const assignment of assignments) {
      console.log(`\n--- Assignment ---`);
      console.log(`Task ID: ${assignment.taskId}`);
      console.log(`Project ID: ${assignment.projectId}`);
      console.log(`Status: ${assignment.status}`);
      console.log(`Start Time: ${assignment.startTime}`);
      console.log(`End Time: ${assignment.endTime}`);
      
      // Get project details
      const project = await Project.findOne({ id: assignment.projectId });
      if (project) {
        console.log(`\n📍 Project: ${project.projectName}`);
        console.log(`Location: ${project.latitude}, ${project.longitude}`);
        console.log(`Geofence Radius: ${project.geofenceRadius}m`);
        
        if (project.geofence) {
          console.log(`Enhanced Geofence:`);
          console.log(`  Center: ${project.geofence.center?.latitude}, ${project.geofence.center?.longitude}`);
          console.log(`  Radius: ${project.geofence.radius}m`);
          console.log(`  Strict Mode: ${project.geofence.strictMode}`);
          console.log(`  Allowed Variance: ${project.geofence.allowedVariance}m`);
        }
      }
    }

    // If no assignments today, check recent assignments
    if (assignments.length === 0) {
      console.log('\n🔍 No assignments today, checking recent assignments...');
      const recentAssignments = await WorkerTaskAssignment.find({
        employeeId: employee.id
      }).sort({ date: -1 }).limit(5);
      
      console.log(`Found ${recentAssignments.length} recent assignments:`);
      recentAssignments.forEach(assignment => {
        console.log(`  Date: ${assignment.date}, Project: ${assignment.projectId}, Status: ${assignment.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkWorkerAssignment();