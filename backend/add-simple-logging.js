import fs from 'fs';

const controllerPath = './src/modules/worker/workerController.js';

// Read the file
let content = fs.readFileSync(controllerPath, 'utf8');

// Find and replace - add logging right after "try {"
const oldCode = `export const getWorkerTasksToday = async (req, res) => {
  try {
    // Rate limiting check (basic implementation)`;

const newCode = `export const getWorkerTasksToday = async (req, res) => {
  try {
    console.log('\\n' + '='.repeat(80));
    console.log('📋 /worker/tasks/today - Request at', new Date().toLocaleTimeString());
    console.log('='.repeat(80));
    
    // Rate limiting check (basic implementation)`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(controllerPath, content, 'utf8');
  console.log('✅ Step 1: Added request logging');
} else {
  console.log('❌ Could not find code to replace');
  process.exit(1);
}

// Add logging after employee resolution
const oldCode2 = `    const employee = await resolveEmployee(req);
    if (!employee) {`;

const newCode2 = `    const employee = await resolveEmployee(req);
    
    console.log('👤 Employee:', employee?.id, '-', employee?.fullName);
    
    if (!employee) {`;

content = fs.readFileSync(controllerPath, 'utf8');
if (content.includes(oldCode2)) {
  content = content.replace(oldCode2, newCode2);
  fs.writeFileSync(controllerPath, content, 'utf8');
  console.log('✅ Step 2: Added employee logging');
}

// Add logging before query
const oldCode3 = `    let assignments;
    try {
      assignments = await WorkerTaskAssignment.find({
        employeeId: employee.id,
        date: today
      }).sort({ sequence: 1 });`;

const newCode3 = `    let assignments;
    
    console.log('🔍 Query:', { employeeId: employee.id, date: today });
    
    try {
      assignments = await WorkerTaskAssignment.find({
        employeeId: employee.id,
        date: today
      }).sort({ sequence: 1 });
      
      console.log('✅ Found', assignments.length, 'tasks');
      assignments.forEach((t, i) => console.log(\`   \${i+1}. \${t.taskName} (\${t.status})\`));`;

content = fs.readFileSync(controllerPath, 'utf8');
if (content.includes(oldCode3)) {
  content = content.replace(oldCode3, newCode3);
  fs.writeFileSync(controllerPath, 'utf8');
  console.log('✅ Step 3: Added query logging');
}

console.log('\\n🎉 Logging added! Restart backend to see logs.');
