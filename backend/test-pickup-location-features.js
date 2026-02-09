/**
 * Test Script for Pickup Time & Location Features
 * Tests the three new features:
 * 1. GPS Navigation Links
 * 2. Route Deviation Monitoring
 * 3. Transport Delay & Attendance Impact
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/driver';

// Test credentials - update with actual driver credentials
const DRIVER_CREDENTIALS = {
  email: 'driver@example.com',
  password: 'password123'
};

let authToken = '';
let testTaskId = 1; // Update with actual task ID

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  
  return {
    status: response.status,
    data
  };
}

// Test 1: GPS Navigation Links
async function testNavigationLinks() {
  console.log('\n📍 TEST 1: GPS Navigation Links');
  console.log('='.repeat(50));

  try {
    const result = await apiCall(`/transport-tasks/${testTaskId}/navigation-links`);
    
    if (result.status === 200 && result.data.success) {
      console.log('✅ Navigation links retrieved successfully');
      console.log('📱 Google Maps:', result.data.data.googleMaps);
      console.log('📱 Waze:', result.data.data.waze);
      console.log('📱 Apple Maps:', result.data.data.appleMaps);
      console.log('📍 Location:', result.data.data.location.name);
      return true;
    } else {
      console.log('❌ Failed to get navigation links');
      console.log('Response:', result.data);
      return false;
    }
  } catch (error) {
   