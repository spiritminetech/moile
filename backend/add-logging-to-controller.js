import fs from 'fs';
import path from 'path';

const controllerPath = './src/modules/worker/workerController.js';

// Read the file
let content = fs.readFileSync(controllerPath, 'utf8');

// Find the getWorkerTasksToday function and add logging
const searchString = 'export const getWorkerTasksToday = async (req, res) => {\n  try {';

const replacementString = `export const getWorkerTasksToday = async (req, res) => {
  try {
    console.log('\\n' + '='.repeat(80));
    console.log('📋 GET /worker/tasks/today - Request received');
    console.log('   Time:', new Date().toISOString());
    console.log('='.repeat(80));`;

if (content.includes(searchString)) {
  content = content.replace(searchString, replacementString);
  
  // Add logging after employee resolution
  const employeeResolveString = '    const employee = await resolveEmployee(req);';
  const employeeResolveReplacement = `    const employee = await resolveEmployee(req);
    console.log('\\n👤 Employee resolved:');
    console.log('   Employee ID:', employee?.id);
    console.log('   Name:', employee?.fullName);
    console.log('   Status:', employee?.status);`;
  
  content = content.replace(employeeResolveString, employeeResolveReplacement);
  
  // Add logging before database query
  const queryString = '    let assignments;\n    try {\n      assignments = await WorkerTaskAssignment.find({';
  const queryReplacement = `    let assignments;
    
    console.log('\\n🔍 Querying WorkerTaskAssignment with:');
    console.log('   employeeId:', employee.id);
    console.log('   date:', today);
    
    try {
      assignments = await WorkerTaskAssignment.find({`;
  
  content = content.replace(queryString, queryReplacement);
  
  // Add logging after query
  const afterQueryString = '      }).sort({ sequence: 1 });';
  const afterQueryReplacement = `      }).sort({ sequence: 1 });
      
      console.log('\\n✅ Database query completed');
      console.log('   Tasks found:', assignments.length);
      
      if (assignments.length > 0) {
        console.log('\\n📝 Task details:');
        assignments.forEach((task, index) => {
          console.log(\`   \${index + 1}. \${task.taskName || 'Unnamed'}\`);
          console.log(\`      - Task ID: \${task.taskId}\`);
          console.log(\`      - Status: \${task.status}\`);
          console.log(\`      - Sequence: \${task.sequence}\`);
          console.log(\`      - Date: \${task.date}\`);
        });
      }`;
  
  content = content.replace(afterQueryString, afterQueryReplacement);
  
  // Write back
  fs.writeFileSync(controllerPath, content, 'utf8');
  
  console.log('✅ Logging added to workerController.js');
  console.log('📝 Added logging at:');
  console.log('   - Request start');
  console.log('   - Employee resolution');
  console.log('   - Database query');
  console.log('   - Query results');
  console.log('\\n🔄 Restart the backend to see logs!');
} else {
  console.log('❌ Could not find the function to modify');
  console.log('The function signature may have changed');
}
