/**
 * Simple structure test for Worker Request APIs
 * Tests that the routes and controllers are properly structured
 */

import express from 'express';
import workerRequestRoutes from './src/modules/worker/workerRequestRoutes.js';

console.log('🧪 Testing Worker Request API Structure...\n');

try {
    // Test 1: Routes can be imported
    console.log('1️⃣ Testing route imports...');
    console.log('✅ Worker request routes imported successfully');

    // Test 2: Routes can be mounted
    console.log('\n2️⃣ Testing route mounting...');
    const app = express();
    app.use('/api/worker/requests', workerRequestRoutes);
    console.log('✅ Routes mounted successfully');

    // Test 3: Check route structure
    console.log('\n3️⃣ Testing route structure...');
    const routeStack = workerRequestRoutes.stack;
    const routes = routeStack.map(layer => ({
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
        path: layer.route.path
    }));

    console.log('📋 Available routes:');
    routes.forEach(route => {
        console.log(`   ${route.method} /api/worker/requests${route.path}`);
    });

    // Test 4: Verify expected routes exist
    console.log('\n4️⃣ Verifying expected routes...');
    const expectedRoutes = [
        { method: 'POST', path: '/leave' },
        { method: 'POST', path: '/material' },
        { method: 'POST', path: '/tool' },
        { method: 'POST', path: '/reimbursement' },
        { method: 'POST', path: '/advance-payment' },
        { method: 'POST', path: '/:requestId/attachments' },
        { method: 'GET', path: '/' },
        { method: 'GET', path: '/:requestId' },
        { method: 'POST', path: '/:requestId/cancel' }
    ];

    let allRoutesFound = true;
    expectedRoutes.forEach(expected => {
        const found = routes.find(r => 
            r.method === expected.method && r.path === expected.path
        );
        if (found) {
            console.log(`   ✅ ${expected.method} ${expected.path}`);
        } else {
            console.log(`   ❌ ${expected.method} ${expected.path} - NOT FOUND`);
            allRoutesFound = false;
        }
    });

    if (allRoutesFound) {
        console.log('\n🎉 All expected routes are properly configured!');
        console.log('\n📝 API Summary:');
        console.log('   • POST /api/worker/requests/leave - Submit leave request');
        console.log('   • POST /api/worker/requests/material - Submit material request');
        console.log('   • POST /api/worker/requests/tool - Submit tool request');
        console.log('   • POST /api/worker/requests/reimbursement - Submit reimbursement request');
        console.log('   • POST /api/worker/requests/advance-payment - Submit advance payment request');
        console.log('   • POST /api/worker/requests/{requestId}/attachments - Upload request attachments');
        console.log('   • GET /api/worker/requests - Get requests with filtering');
        console.log('   • GET /api/worker/requests/{requestId} - Get specific request');
        console.log('   • POST /api/worker/requests/{requestId}/cancel - Cancel request');
        console.log('\n✅ Worker Request API implementation is complete and ready for testing!');
    } else {
        console.log('\n❌ Some expected routes are missing. Please check the implementation.');
    }

} catch (error) {
    console.error('❌ Structure test failed:', error.message);
    process.exit(1);
}