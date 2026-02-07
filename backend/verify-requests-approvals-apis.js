import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================');
console.log('🔍 REQUESTS & APPROVALS API VERIFICATION');
console.log('========================================\n');

// Define all required APIs
const requiredAPIs = [
    {
        method: 'GET',
        endpoint: '/supervisor/pending-leave-requests',
        description: 'Get pending leave requests'
    },
    {
        method: 'POST',
        endpoint: '/supervisor/approve-leave/:requestId',
        description: 'Approve/reject leave'
    },
    {
        method: 'GET',
        endpoint: '/supervisor/pending-advance-requests',
        description: 'Get pending advance requests'
    },
    {
        method: 'POST',
        endpoint: '/supervisor/approve-advance/:requestId',
        description: 'Approve/reject advance'
    },
    {
        method: 'GET',
        endpoint: '/supervisor/pending-material-requests',
        description: 'Get pending material requests'
    },
    {
        method: 'POST',
        endpoint: '/supervisor/approve-material/:requestId',
        description: 'Approve/reject material requests'
    },
    {
        method: 'GET',
        endpoint: '/supervisor/pending-tool-requests',
        description: 'Get pending tool requests'
    },
    {
        method: 'POST',
        endpoint: '/supervisor/approve-tool/:requestId',
        description: 'Approve/reject tool requests'
    },
    {
        method: 'POST',
        endpoint: '/supervisor/escalate-issue/:issueId',
        description: 'Escalate issues to manager'
    }
];

// Check if files exist
const routesFile = path.join(__dirname, 'src/modules/supervisor/supervisorRoutes.js');
const controllerFile = path.join(__dirname, 'src/modules/supervisor/supervisorRequestController.js');

console.log('📁 Checking file existence...\n');

const filesExist = {
    routes: fs.existsSync(routesFile),
    controller: fs.existsSync(controllerFile)
};

console.log(`   Routes file: ${filesExist.routes ? '✅' : '❌'} ${routesFile}`);
console.log(`   Controller file: ${filesExist.controller ? '✅' : '❌'} ${controllerFile}\n`);

if (!filesExist.routes || !filesExist.controller) {
    console.log('❌ Required files not found!');
    process.exit(1);
}

// Read and check routes file
console.log('🔍 Checking routes implementation...\n');
const routesContent = fs.readFileSync(routesFile, 'utf-8');

const routeChecks = [
    { pattern: /router\.get\(['"]\/pending-leave-requests['"]/, name: 'GET /pending-leave-requests' },
    { pattern: /router\.post\(['"]\/approve-leave\/:requestId['"]/, name: 'POST /approve-leave/:requestId' },
    { pattern: /router\.get\(['"]\/pending-advance-requests['"]/, name: 'GET /pending-advance-requests' },
    { pattern: /router\.post\(['"]\/approve-advance\/:requestId['"]/, name: 'POST /approve-advance/:requestId' },
    { pattern: /router\.get\(['"]\/pending-material-requests['"]/, name: 'GET /pending-material-requests' },
    { pattern: /router\.post\(['"]\/approve-material\/:requestId['"]/, name: 'POST /approve-material/:requestId' },
    { pattern: /router\.get\(['"]\/pending-tool-requests['"]/, name: 'GET /pending-tool-requests' },
    { pattern: /router\.post\(['"]\/approve-tool\/:requestId['"]/, name: 'POST /approve-tool/:requestId' },
    { pattern: /router\.post\(['"]\/escalate-issue\/:issueId['"]/, name: 'POST /escalate-issue/:issueId' }
];

let allRoutesFound = true;
routeChecks.forEach(check => {
    const found = check.pattern.test(routesContent);
    console.log(`   ${found ? '✅' : '❌'} ${check.name}`);
    if (!found) allRoutesFound = false;
});

// Read and check controller file
console.log('\n🔍 Checking controller implementation...\n');
const controllerContent = fs.readFileSync(controllerFile, 'utf-8');

const controllerChecks = [
    { pattern: /export\s+const\s+getPendingLeaveRequests/, name: 'getPendingLeaveRequests' },
    { pattern: /export\s+const\s+approveLeaveRequest/, name: 'approveLeaveRequest' },
    { pattern: /export\s+const\s+getPendingAdvanceRequests/, name: 'getPendingAdvanceRequests' },
    { pattern: /export\s+const\s+approveAdvanceRequest/, name: 'approveAdvanceRequest' },
    { pattern: /export\s+const\s+getPendingMaterialRequests/, name: 'getPendingMaterialRequests' },
    { pattern: /export\s+const\s+approveMaterialRequest/, name: 'approveMaterialRequest' },
    { pattern: /export\s+const\s+getPendingToolRequests/, name: 'getPendingToolRequests' },
    { pattern: /export\s+const\s+approveToolRequest/, name: 'approveToolRequest' },
    { pattern: /export\s+const\s+escalateIssue/, name: 'escalateIssue' }
];

let allControllersFound = true;
controllerChecks.forEach(check => {
    const found = check.pattern.test(controllerContent);
    console.log(`   ${found ? '✅' : '❌'} ${check.name}`);
    if (!found) allControllersFound = false;
});

// Check imports in routes file
console.log('\n🔍 Checking controller imports in routes...\n');
const importPattern = /import\s*\{[^}]*getPendingLeaveRequests[^}]*\}\s*from\s*['"]\.\/supervisorRequestController\.js['"]/;
const importsCorrect = importPattern.test(routesContent);
console.log(`   ${importsCorrect ? '✅' : '❌'} Controller functions imported correctly`);

// Final summary
console.log('\n========================================');
console.log('📊 VERIFICATION SUMMARY');
console.log('========================================\n');

const allImplemented = allRoutesFound && allControllersFound && importsCorrect;

console.log(`Routes Implementation: ${allRoutesFound ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
console.log(`Controller Implementation: ${allControllersFound ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
console.log(`Imports Configuration: ${importsCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);

console.log('\n========================================');
if (allImplemented) {
    console.log('✅ ALL REQUESTS & APPROVALS APIs ARE IMPLEMENTED!');
    console.log('========================================\n');
    
    console.log('📋 Implemented APIs:\n');
    requiredAPIs.forEach((api, index) => {
        console.log(`${index + 1}. ${api.method} ${api.endpoint}`);
        console.log(`   ${api.description}\n`);
    });
    
    console.log('🎉 Status: READY FOR TESTING');
    console.log('\nTo test these APIs:');
    console.log('1. Ensure backend server is running: npm start');
    console.log('2. Run: node test-supervisor-requests-approvals-apis.js');
    console.log('3. Or use Postman with the endpoints listed above');
} else {
    console.log('❌ SOME APIs ARE MISSING OR INCOMPLETE');
    console.log('========================================');
}

console.log('');
