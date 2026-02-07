import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TaskSchema = new mongoose.Schema({
  id: Number,
  name: String,
  projectId: Number,
  description: String,
  estimatedHours: Number,
  status: String,
  priority: String,
}, { collection: 'tasks' });

const Task = mongoose.model('Task', TaskSchema);

const ProjectSchema = new mongoose.Schema({
  id: Number,
  name: String,
  location: String,
}, { collection: 'projects' });

const Project = mongoose.model('Project', ProjectSchema);

async function debugTaskProjectAssignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check the tasks you're trying to assign
    const taskIds = [5, 6];
    const projectId = 2;

    console.log('🔍 Checking tasks:', taskIds);
    console.log('🔍 For project ID:', projectId);
    console.log('─'.repeat(60));

    // Find the tasks
    const tasks = await Task.find({ id: { $in: taskIds } });
    
    console.log('\n📋 Tasks found:');
    tasks.forEach(task => {
      console.log(`\nTask ID: ${task.id}`);
      console.log(`  Name: ${task.name}`);
      console.log(`  Project ID: ${task.projectId}`);
      console.log(`  Status: ${task.status}`);
      console.log(`  ✅ Belongs to project ${projectId}:`, task.projectId === projectId);
    });

    // Check if all tasks exist
    if (tasks.length !== taskIds.length) {
      console.log('\n⚠️  WARNING: Not all tasks were found!');
      console.log(`Expected ${taskIds.length} tasks, found ${tasks.length}`);
      const foundIds = tasks.map(t => t.id);
      const missingIds = taskIds.filter(id => !foundIds.includes(id));
      console.log('Missing task IDs:', missingIds);
    }

    // Check which tasks belong to the project
    const validTasks = tasks.filter(task => task.projectId === projectId);
    console.log(`\n✅ Valid tasks for project ${projectId}: ${validTasks.length}/${tasks.length}`);

    if (validTasks.length !== taskIds.length) {
      console.log('\n❌ ERROR: Not all tasks belong to this project!');
      const invalidTasks = tasks.filter(task => task.projectId !== projectId);
      console.log('\nInvalid tasks:');
      invalidTasks.forEach(task => {
        console.log(`  - Task ${task.id} (${task.name}) belongs to project ${task.projectId}, not ${projectId}`);
      });
    }

    // Show all tasks for project 2
    console.log('\n─'.repeat(60));
    console.log(`\n📋 All tasks available for Project ${projectId}:`);
    const allProjectTasks = await Task.find({ projectId: projectId });
    
    if (allProjectTasks.length === 0) {
      console.log('  ⚠️  No tasks found for this project!');
    } else {
      allProjectTasks.forEach(task => {
        console.log(`  - Task ${task.id}: ${task.name} (${task.status})`);
      });
    }

    // Show project details
    console.log('\n─'.repeat(60));
    const project = await Project.findOne({ id: projectId });
    if (project) {
      console.log(`\n🏗️  Project ${projectId} Details:`);
      console.log(`  Name: ${project.name}`);
      console.log(`  Location: ${project.location}`);
    } else {
      console.log(`\n⚠️  Project ${projectId} not found!`);
    }

    // Show all projects
    console.log('\n─'.repeat(60));
    console.log('\n🏗️  All Projects:');
    const allProjects = await Project.find({});
    allProjects.forEach(proj => {
      console.log(`  - Project ${proj.id}: ${proj.name}`);
    });

    // Show all tasks grouped by project
    console.log('\n─'.repeat(60));
    console.log('\n📋 All Tasks (grouped by project):');
    const allTasks = await Task.find({}).sort({ projectId: 1, id: 1 });
    let currentProjectId = null;
    
    allTasks.forEach(task => {
      if (task.projectId !== currentProjectId) {
        currentProjectId = task.projectId;
        console.log(`\n  Project ${task.projectId}:`);
      }
      console.log(`    - Task ${task.id}: ${task.name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
  }
}

debugTaskProjectAssignment();
