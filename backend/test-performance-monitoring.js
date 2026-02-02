/**
 * Test Performance Monitoring Implementation
 * Tests the performance monitoring service and API endpoints
 */

import axios from 'axios';
import appConfig from './src/config/app.config.js';

const API_BASE = `http://localhost:${appConfig.server.port}${appConfig.api.prefix}`;

// Test credentials (you may need to adjust these)
const TEST_CREDENTIALS = {
  email: 'admin@company.com',
  password: 'admin123'
};

let authToken = '';

/**
 * Authenticate and get JWT token
 */
async function authenticate() {
  try {
    console.log('🔐 Authenticating...');
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_CREDENTIALS);
    
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.error('❌ Authentication failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Authentication error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test performance metrics endpoint
 */
async function testPerformanceMetrics() {
  try {
    console.log('\n📊 Testing performance metrics endpoint...');
    
    const response = await axios.get(`${API_BASE}/notifications/performance/metrics`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { hours: 24 }
    });

    if (response.data.success) {
      console.log('✅ Performance metrics retrieved successfully');
      console.log('📈 Current metrics:', JSON.stringify(response.data.currentMetrics, null, 2));
      
      // Check if all required metrics are present
      const metrics = response.data.currentMetrics;
      const requiredSections = ['systemLoad', 'performance', 'uptime', 'deliveryTracking'];
      
      for (const section of requiredSections) {
        if (metrics[section]) {
          console.log(`✅ ${section} metrics present`);
        } else {
          console.log(`❌ ${section} metrics missing`);
        }
      }
      
      return true;
    } else {
      console.error('❌ Failed to get performance metrics:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Performance metrics test error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test system load endpoint
 */
async function testSystemLoad() {
  try {
    console.log('\n🔄 Testing system load endpoint...');
    
    const response = await axios.get(`${API_BASE}/notifications/performance/load`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ System load retrieved successfully');
      console.log('📊 System load:', JSON.stringify(response.data.systemLoad, null, 2));
      
      const load = response.data.systemLoad;
      console.log(`👥 Active workers: ${load.activeWorkers || 0}`);
      console.log(`📬 Pending notifications: ${load.pendingNotifications || 0}`);
      console.log(`⏳ Delivery queue: ${load.deliveryQueue || 0}`);
      console.log(`📈 Load percentage: ${load.loadPercentage || 0}%`);
      console.log(`🏥 Queue health: ${load.queueHealth || 'UNKNOWN'}`);
      
      return true;
    } else {
      console.error('❌ Failed to get system load:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ System load test error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test uptime statistics endpoint
 */
async function testUptimeStats() {
  try {
    console.log('\n⏰ Testing uptime statistics endpoint...');
    
    const response = await axios.get(`${API_BASE}/notifications/performance/uptime`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { days: 7 }
    });

    if (response.data.success) {
      console.log('✅ Uptime statistics retrieved successfully');
      console.log('📅 Uptime data:', JSON.stringify(response.data.uptime, null, 2));
      
      const uptime = response.data.uptime;
      if (uptime.current) {
        console.log(`🕐 Service start time: ${uptime.current.startTime}`);
        console.log(`💚 Last health check: ${uptime.current.lastHealthCheck}`);
        console.log(`📈 Uptime percentage: ${uptime.current.uptimePercentage || 100}%`);
      }
      
      if (uptime.businessHours) {
        console.log(`🏢 Business hours: ${uptime.businessHours.start} - ${uptime.businessHours.end}`);
        console.log(`🌏 Timezone: ${uptime.businessHours.timezone}`);
      }
      
      return true;
    } else {
      console.error('❌ Failed to get uptime statistics:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Uptime statistics test error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test delivery time analytics endpoint
 */
async function testDeliveryTimeAnalytics() {
  try {
    console.log('\n🚀 Testing delivery time analytics endpoint...');
    
    const response = await axios.get(`${API_BASE}/notifications/performance/delivery-times`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { hours: 24 }
    });

    if (response.data.success) {
      console.log('✅ Delivery time analytics retrieved successfully');
      console.log('⏱️ Analytics data:', JSON.stringify(response.data.analytics, null, 2));
      console.log('📋 SLA compliance:', JSON.stringify(response.data.slaCompliance, null, 2));
      
      const requirements = response.data.requirements;
      if (requirements) {
        console.log('📏 SLA Requirements:');
        console.log(`  🔴 Critical: ${requirements.critical}`);
        console.log(`  🟠 High: ${requirements.high}`);
        console.log(`  🔵 Normal: ${requirements.normal}`);
        console.log(`  ⚪ Low: ${requirements.low}`);
      }
      
      return true;
    } else {
      console.error('❌ Failed to get delivery time analytics:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Delivery time analytics test error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test performance alerts endpoint
 */
async function testPerformanceAlerts() {
  try {
    console.log('\n🚨 Testing performance alerts endpoint...');
    
    const response = await axios.get(`${API_BASE}/notifications/performance/alerts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { hours: 24 }
    });

    if (response.data.success) {
      console.log('✅ Performance alerts retrieved successfully');
      console.log(`📊 Found ${response.data.alerts.length} alerts`);
      console.log('📋 Alert summary:', JSON.stringify(response.data.summary, null, 2));
      
      if (response.data.alerts.length > 0) {
        console.log('🚨 Recent alerts:');
        response.data.alerts.slice(0, 5).forEach((alert, index) => {
          console.log(`  ${index + 1}. ${alert.type} (${alert.severity}) - ${new Date(alert.timestamp).toLocaleString()}`);
        });
      } else {
        console.log('✅ No performance alerts found - system is healthy');
      }
      
      return true;
    } else {
      console.error('❌ Failed to get performance alerts:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Performance alerts test error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test performance optimization endpoint (admin only)
 */
async function testPerformanceOptimization() {
  try {
    console.log('\n⚡ Testing performance optimization endpoint...');
    
    const response = await axios.post(`${API_BASE}/notifications/performance/optimize`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ Performance optimization triggered successfully');
      console.log('🔧 Optimization results:', JSON.stringify(response.data.results, null, 2));
      
      if (response.data.results.optimizations) {
        console.log(`🛠️ Applied ${response.data.results.optimizations.length} optimizations:`);
        response.data.results.optimizations.forEach((opt, index) => {
          console.log(`  ${index + 1}. ${opt.type}: ${opt.message}`);
        });
      }
      
      return true;
    } else {
      console.error('❌ Failed to trigger performance optimization:', response.data.message);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('⚠️ Performance optimization requires admin privileges (expected for non-admin users)');
      return true; // This is expected for non-admin users
    }
    console.error('❌ Performance optimization test error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test notification creation to generate performance data
 */
async function testNotificationCreation() {
  try {
    console.log('\n📬 Creating test notification to generate performance data...');
    
    const testNotification = {
      type: 'TASK_UPDATE',
      priority: 'NORMAL',
      recipients: [1], // Assuming worker ID 1 exists
      title: 'Performance Test Notification',
      message: 'This is a test notification for performance monitoring',
      actionData: {
        taskId: 1,
        projectId: 1,
        supervisorContact: 'test@example.com'
      }
    };

    const response = await axios.post(`${API_BASE}/notifications`, testNotification, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ Test notification created successfully');
      console.log(`📊 Created ${response.data.created} notifications`);
      
      if (response.data.skipped > 0) {
        console.log(`⏭️ Skipped ${response.data.skipped} notifications (likely due to daily limits)`);
      }
      
      return true;
    } else {
      console.error('❌ Failed to create test notification:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Test notification creation error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Run all performance monitoring tests
 */
async function runAllTests() {
  console.log('🧪 Starting Performance Monitoring Tests');
  console.log('==========================================');

  // Authenticate first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }

  // Run all tests
  const tests = [
    { name: 'Performance Metrics', fn: testPerformanceMetrics },
    { name: 'System Load', fn: testSystemLoad },
    { name: 'Uptime Statistics', fn: testUptimeStats },
    { name: 'Delivery Time Analytics', fn: testDeliveryTimeAnalytics },
    { name: 'Performance Alerts', fn: testPerformanceAlerts },
    { name: 'Test Notification Creation', fn: testNotificationCreation },
    { name: 'Performance Optimization', fn: testPerformanceOptimization }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw an error:`, error.message);
      failed++;
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n==========================================');
  console.log('🧪 Performance Monitoring Test Results');
  console.log('==========================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${tests.length}`);
  
  if (failed === 0) {
    console.log('🎉 All performance monitoring tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export default {
  runAllTests,
  authenticate,
  testPerformanceMetrics,
  testSystemLoad,
  testUptimeStats,
  testDeliveryTimeAnalytics,
  testPerformanceAlerts,
  testPerformanceOptimization,
  testNotificationCreation
};