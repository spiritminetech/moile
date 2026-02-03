#!/usr/bin/env node

/**
 * Debug the today's tasks API to see why new task isn't showing
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkerTaskAssignment from './src/modules/worker/models/WorkerTaskAssignment.js';
import Project from './src/modules/project/models/Project.js';

// Load environment variables
dotenv.config();

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function debugTodaysTasksAPI() {
  console.log('🔍 Debugging Today\'s Tasks API...\n');

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today\'s date:', today);

    // 1. Check all task assignments for employee 107 today
    console.log('\n1. All task assignments for employee 107 today:');
    const allAssignments = await WorkerTaskAssignment.find({
      employeeId: 107,
      date: today
    });

    console.log(`Found ${allAssignments.length} assignments:`);
    allAssignments.forEach(assignment => {
      console.log(`   - Assignment ${assignment.id}:`);
      console.log(`     Project ID: ${assignment.projectId}`);
      console.log(`     Status: ${assignment.status}`);
      console.log(`     Date: ${assignment.date}`);
      console.log(`     Work Area: ${assignment.workArea || 'N/A'}`);
      console.log(`     Daily Target: ${assignment.dailyTarget?.description || 'N/A'}`);
      console.log('');
    });

    // 2. Check project information
    console.log('2. Project information:');
    const projects = await Project.find({});
    console.log(`Found ${projects.length} projects:`);
    projects.forEach(project => {
      console.log(`   - Project ${project.id}: ${project.name || 'Unnamed'}`);
    });

    // 3. Simulate the API response structure
    console.log('\n3. Simulating API response structure:');
    
    // Get project info (assuming project 1016)
    const project = await Project.findOne({ id: 1016 });
    console.log('Project 1016 details:', {
      id: project?.id,
      name: project?.name,
      exists: !!project
    });

    // Create the expected API response structure
    const apiResponse = {
      success: true,
      data: {
        project: {
          id: project?.id || 1016,
          name: project?.name || 'Unknown Project',
          location: 'Test Location'
        },
        tasks: allAssignments.map(assignment => ({
          assignmentId: assignment.id,
          taskName: assignment.dailyTarget?.description || `Task ${assignment.id}`,
          description: assignment.dailyTarget?.description || 'No description',
          status: assignment.status,
          dependencies: assignment.dependencies || [],
          sequence: assignment.sequence || 0,
          timeEstimate: {
            estimated: assignment.timeEstimate?.estimated || 480,
            elapsed: assignment.timeEstimate?.elapsed || 0,
            remaining: assignment.timeEstimate?.remaining || 480
          },
          progress: {
            percentage: assignment.status === 'completed' ? 100 : 0,
            lastUpdated: assignment.updatedAt?.toISOString() || new Date().toISOString()
          }
        }))
      }
    };

    console.log('Expected API response:');
    console.log(JSON.stringify(apiResponse, null, 2));

    // 4. Check what the mobile app should receive
    console.log('\n4. What mobile app should receive:');
    apiResponse.data.tasks.forEach(task => {
      console.log(`   Task: ${task.taskName}`);
      console.log(`   Project: ${apiResponse.data.project.name} (ID: ${apiResponse.data.project.id})`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Assignment ID: ${task.assignmentId}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error debugging API:', error);
    throw error;
  }
}

async function main() {
  await connectToDatabase();
  
  try {
    await debugTodaysTasksAPI();
    console.log('\n✅ Debug completed!');
    console.log('\n🔧 Potential issues:');
    console.log('1. Check if backend API is returning all tasks');
    console.log('2. Verify project name is included in response');
    console.log('3. Ensure mobile app is mapping data correctly');
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

main().catch(console.error);