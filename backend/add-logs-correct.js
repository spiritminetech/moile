import fs from 'fs';

const file = './src/modules/worker/workerController.js';
let content = fs.readFileSync(file, 'utf8');

// Step 1: Add logging at function start
const search1 = `export const getWorkerTasksToday = async (req, res) => {
  try {
    // Rate limiting check (basic implementation)
    const clientIP = req.ip || req.connection.remoteAddress;`;

const replace1 = `export const getWorkerTasksToday = async (req, res) => {
  try {
    console.log('\\n' + '='.repeat(80));
    console.log('📋 GET /worker/tasks/today');
    console.log('   Time:', new Date().toLocaleTimeString());
    console.log('='.repeat(80));
    
    // Rate limiting check (basic implementation)
    const clientIP = req.ip || req.connection.remoteAddress;`;

content = content.replace(search1, replace1);
console.log('✅ Added request start logging');

// Step 2: Add logging after employee resolution
const search2 = `    // Resolve employee with additional validation
    const employee = await resolveEmployee(req);
    if (!employee) {`;

const replace2 = `    // Resolve employee with additional validation
    const employee = await resolveEmployee(req);
    
    console.log('\\n👤 Employee resolved:');
    console.log('   ID:', employee?.id);
    console.log('   Name:', employee?.fullName);
    
    if (!employee) {`;

content = content.replace(search2, replace2);
console.log('✅ Added employee logging');

// Step 3: Add logging before query
const search3 = `    const today = targetDate;

    // Get all task assignments for today with error handling
    let assignments;
    try {
      assignments = await WorkerTaskAssignment.find({
        employeeId: employee.id,
        date: today
      }).sort({ sequence: 1 });`;

const replace3 = `    const today = targetDate;

    // Get all task assignments for today with error handling
    console.log('\\n🔍 Querying tasks:');
    console.log('   employeeId:', employee.id);
    console.log('   date:', today);
    
    let assignments;
    try {
      assignments = await WorkerTaskAssignment.find({
        employeeId: employee.id,
        date: today
      }).sort({ sequence: 1 });
      
      console.log('\\n✅ Query result:', assignments.length, 'tasks found');
      if (assignments.length > 0) {
        assignments.forEach((t, i) => {
          console.log(\`   \${i+1}. \${t.taskName || 'Unnamed'} (Status: \${t.status}, ID: \${t.taskId})\`);
        });
      }`;

content = content.replace(search3, replace3);
console.log('✅ Added query logging');

// Write file
fs.writeFileSync(file, content, 'utf8');

console.log('\\n🎉 All logging added successfully!');
console.log('\\n📝 Restart the backend server to see the logs.');
console.log('   The logs will show:');
console.log('   - Request timestamp');
console.log('   - Employee ID and name');
console.log('   - Query parameters');
console.log('   - Number of tasks found');
console.log('   - Task details');
