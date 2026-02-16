// Fix worker@gmail.com employee linkage
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixWorkerEmployeeLink() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const employeesCollection = db.collection('employees');
    const tasksCollection = db.collection('workertaskassignments');

    // Step 1: Find worker@gmail.com user
    console.log('=== STEP 1: FIND USER ===');
    const user = await usersCollection.findOne({ email: 'worker@gmail.com' });
    
    if (!user) {
      console.log('❌ worker@gmail.com not found');
      return;
    }

    console.log(`✅ User found: ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Employee ID: ${user.employeeId || 'NOT SET ❌'}`);
    console.log(`   Role: ${user.role}\n`);

    // Step 2: Find employee with ID 107 (from your task data)
    console.log('=== STEP 2: FIND EMPLOYEE ===');
    const employee = await employeesCollection.findOne({ id: 107 });
    
    if (!employee) {
      console.log('❌ Employee ID 107 not found');
      console.log('Looking for any employee with email worker@gmail.com...\n');
      
      const employeeByEmail = await employeesCollection.findOne({ 
        email: 'worker@gmail.com' 
      });
      
      if (employeeByEmail) {
        console.log(`✅ Found employee by email: ${employeeByEmail.fullName}`);
        console.log(`   Employee ID: ${employeeByEmail.id}\n`);
        await linkUserToEmployee(usersCollection, user.id, employeeByEmail.id);
      } else {
        console.log('❌ No employee found with email worker@gmail.com');
      }
      return;
    }

    console.log(`✅ Employee found: ${employee.fullName}`);
    console.log(`   Employee ID: ${employee.id}`);
    console.log(`   Email: ${employee.email || 'N/A'}`);
    console.log(`   Status: ${employee.status}\n`);

    // Step 3: Link user to employee
    if (user.employeeId !== employee.id) {
      console.log('=== STEP 3: LINKING USER TO EMPLOYEE ===');
      await linkUserToEmployee(usersCollection, user.id, employee.id);
    } else {
      console.log('✅ User already linked to employee\n');
    }

    // Step 4: Check tasks for this employee
    console.log('=== STEP 4: CHECK TASKS ===');
    const tasks = await tasksCollection.find({ 
      employeeId: employee.id 
    }).toArray();

    console.log(`Found ${tasks.length} tasks for employee ${employee.id}\n`);

    if (tasks.length > 0) {
      tasks.forEach((task, index) => {
        console.log(`${index + 1}. ${task.taskName || 'Unnamed Task'}`);
        console.log(`   Assignment ID: ${task.id}`);
        console.log(`   Project ID: ${task.projectId}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Supervisor ID: ${task.supervisorId || 'NOT SET ❌'}`);
        console.log('');
      });

      // Update tasks without supervisor
      const tasksWithoutSupervisor = tasks.filter(t => !t.supervisorId);
      
      if (tasksWithoutSupervisor.length > 0) {
        console.log(`\n⚠️  ${tasksWithoutSupervisor.length} tasks missing supervisor`);
        console.log('🔄 Adding supervisor ID 4 to these tasks...\n');
        
        const taskIds = tasksWithoutSupervisor.map(t => t.id);
        
        const result = await tasksCollection.updateMany(
          { id: { $in: taskIds } },
          { 
            $set: { 
              supervisorId: 4,
              updatedAt: new Date()
            } 
          }
        );

        console.log(`✅ Updated ${result.modifiedCount} tasks\n`);
      } else {
        console.log('✅ All tasks already have supervisor\n');
      }
    }

    console.log('=== SUCCESS ===');
    console.log('✅ User-Employee linkage verified');
    console.log('✅ Tasks have supervisor assigned');
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Restart your backend server (Ctrl+C and npm start)');
    console.log('2. Refresh the mobile app (pull down to refresh)');
    console.log('3. Expand a task to see supervisor information');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

async function linkUserToEmployee(usersCollection, userId, employeeId) {
  console.log(`🔄 Linking user ${userId} to employee ${employeeId}...`);
  
  const result = await usersCollection.updateOne(
    { id: userId },
    { 
      $set: { 
        employeeId: employeeId,
        updatedAt: new Date()
      } 
    }
  );

  if (result.modifiedCount > 0) {
    console.log('✅ User linked to employee successfully\n');
  } else {
    console.log('⚠️  User update did not modify any documents\n');
  }
}

fixWorkerEmployeeLink();
