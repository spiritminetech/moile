import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:5002/api';
const SUPERVISOR_CREDENTIALS = {
  email: 'supervisor@gmail.com',
  password: 'password123'
};

/**
 * Test supervisor dashboard data for supervisor ID 4
 */
async function testSupervisor4Dashboard() {
  console.log('🔍 TESTING SUPERVISOR ID 4 DASHBOARD DATA');
  console.log('='.repeat(60));
  console.log(`📧 Email: ${SUPERVISOR_CREDENTIALS.email}`);
  console.log(`🔑 Password: ${SUPERVISOR_CREDENTIALS.password}`);
  console.log('='.repeat(60));

  let supervis