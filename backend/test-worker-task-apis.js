#!/usr/bin/env node

/**
 * Test script for Worker Task APIs
 * Tests all the new and updated endpoints
 */

import axios from 'axios';
import { config } from 'dotenv';

// Load environment variables
config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'worker@test.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

let authToken = '';
let testTaskId = null;

// Helper function to make authenticated requests
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`${error.response.status}: ${error.response.data.message || error.response.statusText}`);
    }
    throw error;
  }
};

// Test authentication
const testAuthentication = async () => {
  console.log('\n🔐 Testing Authentication');
  console.log('=' .repeat(50));
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Authentication successful');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Authentication failed: No token received');
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    return false;
  }
};

// Test GET /worker/tasks/today
const testGetTodaysTasks = async () => {
  console.log('\n📋 Testing GET /worker/tasks/today');
  console.log('=' .repeat(50));
  
  try {
    const response = await apiRequest('GET', '/api/worker/tasks/today');
    
    if (response.success) {
      console.log('✅ Today\'s tasks retrieved successfully');
      console.log(`   Project: ${response.data.project.name}`);
      console.log(`   Tasks: ${response.data.tasks.length}`);
      console.log(`   Overall Progress: ${response.data.dailySummary.overallProgress}%`);
      
      // Store first task ID for other tests
      if (response.data.tasks.length > 0) {
        testTaskId = response.data.tasks[0].assignmentId;
        console.log(`   Using task ID ${testTaskId} for subsequent tests`);
      }
      
      return true;
    } else {
      console.log('❌ Failed to get today\'s tasks:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error getting today\'s tasks:', error.message);
    return false;
  }
};

// Test GET /worker/tasks/{taskId}
const testGetTaskDetails = async () => {
  if (!testTaskId) {
    console.log('\n⚠️  Skipping task details test - no task ID available');
    return false;
  }

  console.log('\n🔍 Testing GET /worker/tasks/{taskId}');
  console.log('=' .repeat(50));
  
  try {
    const response = await apiRequest('GET', `/api/worker/tasks/${testTaskId}`);
    
    if (response.success) {
      console.log('✅ Task details retrieved successfully');
      console.log(`   Task: ${response.data.taskName}`);
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Progress: ${response.data.progress.percentage}%`);
      console.log(`   Can Start: ${response.data.canStart}`);
      console.log(`   Photos: ${response.data.photos.length}`);
      return true;
    } else {
      console.log('❌ Failed to get task details:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error getting task details:', error.message);
    return false;
  }
};

// Test POST /worker/tasks/{taskId}/start
const testStartTask = async () => {
  if (!testTaskId) {
    console.log('\n⚠️  Skipping start task test - no task ID available');
    return false;
  }

  console.log('\n🚀 Testing POST /worker/tasks/{taskId}/start');
  console.log('=' .repeat(50));
  
  try {
    const response = await apiRequest('POST', `/api/worker/tasks/${testTaskId}/start`, {
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 5.0,
        timestamp: new Date().toISOString()
      }
    });
    
    if (response.success) {
      console.log('✅ Task started successfully');
      console.log(`   Assignment ID: ${response.data.assignmentId}`);
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Start Time: ${response.data.startTime}`);
      console.log(`   Inside Geofence: ${response.data.geofenceValidation.insideGeofence}`);
      return true;
    } else {
      console.log('❌ Failed to start task:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error starting task:', error.message);
    // Task might already be started, which is okay for testing
    if (error.message.includes('already')) {
      console.log('ℹ️  Task already started - continuing with other tests');
      return true;
    }
    return false;
  }
};

// Test PUT /worker/tasks/{taskId}/progress
const testUpdateProgress = async () => {
  if (!testTaskId) {
    console.log('\n⚠️  Skipping progress update test - no task ID available');
    return false;
  }

  console.log('\n📈 Testing PUT /worker/tasks/{taskId}/progress');
  console.log('=' .repeat(50));
  
  try {
    const response = await apiRequest('PUT', `/api/worker/tasks/${testTaskId}/progress`, {
      progressPercent: 75,
      description: "Made good progress on the task",
      notes: "Everything going smoothly",
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date().toISOString()
      },
      completedQuantity: 15,
      issuesEncountered: []
    });
    
    if (response.success) {
      console.log('✅ Progress updated successfully');
      console.log(`   Progress ID: ${response.data.progressId}`);
      console.log(`   Progress: ${response.data.progressPercent}%`);
      console.log(`   Task Status: ${response.data.taskStatus}`);
      console.log(`   Next Action: ${response.data.nextAction}`);
      return true;
    } else {
      console.log('❌ Failed to update progress:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error updating progress:', error.message);
    return false;
  }
};

// Test POST /worker/tasks/{taskId}/complete
const testCompleteTask = async () => {
  if (!testTaskId) {
    console.log('\n⚠️  Skipping complete task test - no task ID available');
    return false;
  }

  console.log('\n✅ Testing POST /worker/tasks/{taskId}/complete');
  console.log('=' .repeat(50));
  
  try {
    const response = await apiRequest('POST', `/api/worker/tasks/${testTaskId}/complete`, {
      completionNotes: "Task completed successfully with all requirements met",
      finalPhotos: ["photo1.jpg", "photo2.jpg"],
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date().toISOString()
      },
      actualQuantityCompleted: 20,
      qualityCheck: {
        passed: true,
        notes: "All work meets quality standards"
      }
    });
    
    if (response.success) {
      console.log('✅ Task completed successfully');
      console.log(`   Assignment ID: ${response.data.assignmentId}`);
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Completed At: ${response.data.completedAt}`);
      console.log(`   Total Time: ${response.data.totalTimeSpent} minutes`);
      console.log(`   Next Task: ${response.data.nextTask ? response.data.nextTask.taskName : 'None'}`);
      return true;
    } else {
      console.log('❌ Failed to complete task:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error completing task:', error.message);
    // Task might already be completed, which is okay for testing
    if (error.message.includes('already completed')) {
      console.log('ℹ️  Task already completed - this is expected');
      return true;
    }
    return false;
  }
};

// Test GET /worker/tasks/history
const testGetTaskHistory = async () => {
  console.log('\n📚 Testing GET /worker/tasks/history');
  console.log('=' .repeat(50));
  
  try {
    const response = await apiRequest('GET', '/api/worker/tasks/history?page=1&limit=10');
    
    if (response.success) {
      console.log('✅ Task history retrieved successfully');
      console.log(`   Total Tasks: ${response.data.pagination.totalTasks}`);
      console.log(`   Current Page: ${response.data.pagination.currentPage}`);
      console.log(`   Tasks on Page: ${response.data.tasks.length}`);
      console.log(`   Total Completed: ${response.data.summary.totalCompleted}`);
      console.log(`   Total Hours Worked: ${response.data.summary.totalHoursWorked}`);
      console.log(`   Average Task Time: ${response.data.summary.averageTaskTime} hours`);
      
      if (response.data.tasks.length > 0) {
        console.log('\n   Recent Tasks:');
        response.data.tasks.slice(0, 3).forEach((task, index) => {
          console.log(`   ${index + 1}. ${task.taskName} - ${task.status} (${task.progressPercent}%)`);
        });
      }
      
      return true;
    } else {
      console.log('❌ Failed to get task history:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error getting task history:', error.message);
    return false;
  }
};

// Test with filters
const testGetTaskHistoryWithFilters = async () => {
  console.log('\n🔍 Testing GET /worker/tasks/history with filters');
  console.log('=' .repeat(50));
  
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    const response = await apiRequest('GET', `/api/worker/tasks/history?page=1&limit=5&startDate=${startDate.toISOString().split('T')[0]}&status=completed`);
    
    if (response.success) {
      console.log('✅ Filtered task history retrieved successfully');
      console.log(`   Completed Tasks (Last 30 days): ${response.data.tasks.length}`);
      console.log(`   Total Matching: ${response.data.pagination.totalTasks}`);
      return true;
    } else {
      console.log('❌ Failed to get filtered task history:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Error getting filtered task history:', error.message);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🧪 Worker Task APIs Test Suite');
  console.log('=' .repeat(50));
  console.log(`Testing against: ${API_BASE_URL}`);
  console.log(`Test user: ${TEST_EMAIL}`);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Get Today\'s Tasks', fn: testGetTodaysTasks },
    { name: 'Get Task Details', fn: testGetTaskDetails },
    { name: 'Start Task', fn: testStartTask },
    { name: 'Update Progress', fn: testUpdateProgress },
    { name: 'Complete Task', fn: testCompleteTask },
    { name: 'Get Task History', fn: testGetTaskHistory },
    { name: 'Get Filtered History', fn: testGetTaskHistoryWithFilters }
  ];

  for (const test of tests) {
    results.total++;
    try {
      const success = await test.fn();
      if (success) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ Test "${test.name}" threw an error:`, error.message);
      results.failed++;
    }
  }

  // Print summary
  console.log('\n📊 Test Summary');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
};

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});