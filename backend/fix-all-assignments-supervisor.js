import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function fixAllAssignmentsSupervisor() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const WorkerTaskAssignment = mongoose.connection.collection('workertaskassignments');

    // Update all assignments for project 1003 to have supervisorId 4
    const result = await WorkerTaskAssignment.updateMany(
      { 
        projectId: 1003,
        $or: [
          { supervisorId: { $exists: false } },
          { supervisorId: null }
        ]
      },
      { 
        $set: { 
          supervisorId: 4,
          updatedAt: new Date()
        } 
      }
    );

    console.log('\n📊 Updated assignments without supervisor:');
    console.log({
      matched: result.matchedCount,
      modified: result.modifiedCount
    });

    // Also ensure all existing assignments have supervisorId 4
    const result2 = await WorkerTaskAssignment.updateMany(
      { projectId: 1003 },
      { 
        $set: { 
          supervisorId: 4,
          updatedAt: new Date()
        } 
      }
    );

    console.log('\n📊 Ensured all project 1003 assignments have supervisor:');
    console.log({
      matched: result2.matchedCount,
      modified: result2.modifiedCount
    });

    // Verify the updates
    const assignments = await WorkerTaskAssignment.find({ 
      projectId: 1003 
    }).limit(10).toArray();

    console.log('\n✅ Sample assignments after update:');
    assignments.forEach(a => {
      console.log({
        id: a.id,
        employeeId: a.employeeId,
        projectId: a.projectId,
        supervisorId: a.supervisorId,
        status: a.status
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixAllAssignmentsSupervisor();
