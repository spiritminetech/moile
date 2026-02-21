import axios from 'axios';

const BASE_URL = 'http://192.168.1.6:5002/api';

// Test driver credentials (driver1@gmail.com)
const TEST_DRIVER = {
  email: 'driver1@gmail.com',
  password: 'driver123'
};

let authToken = '';

// Test 1: Login
const testLogin = async () => {
  try {
    console.log('\n🔐 Testing Driver Login...');
    console.log('=' .repeat(50));
    
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_DRIVER);
    
    if (response.data.success && response.data.token) {
     