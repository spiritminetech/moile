import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002/api';

// Test configuration
const TEST_CONFIG = {
  supervisorToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwNywiZW1haWwiOiJzdXBlcnZpc29yQGdtYWlsLmNvbSIsInJvbGUiOiJzdXBlcnZpc29yIiwiaWF0IjoxNzM4NzQ5NzI5LCJleHAiOjE3Mzg4MzYxMjl9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
  projectId: 1,
  testDate: '2025-02-05'
};

/**
 * Test all supervisor dashboard APIs
 */
async function testSupervisorDashboardAPIs() {
  console.log('🧪 Testing Supervisor Dashboard APIs Integration...\n');

  const results = {
    passed: 0,
    failed: 0,
    endpoints: []
  };