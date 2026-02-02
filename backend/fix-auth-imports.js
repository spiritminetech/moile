import fs from 'fs';
import path from 'path';

const filesToFix = [
  'src/modules/project/materialRequestRoutes.js',
  'src/modules/project/projectToolsRoutes.js',
  'src/modules/leaveRequest/leaveRequestRoutes.js',
  'src/modules/attendance/attendanceRoutes.js',
  'src/modules/supervisor/supervisorRoutes.js',
  'src/modules/worker/workerRoutes.js'
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix import statements
    content = content.replace(
      /import\s*{\s*authMiddleware\s*}\s*from\s*['"].*authMiddleware\.js['"];?/g,
      "import { verifyToken } from '../../middleware/authMiddleware.js';"
    );
    
    content = content.replace(
      /import\s+authMiddleware\s+from\s*['"].*authMiddleware\.js['"];?/g,
      "import { verifyToken } from '../../middleware/authMiddleware.js';"
    );
    
    // Fix usage in routes
    content = content.replace(/authMiddleware/g, 'verifyToken');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing authMiddleware imports...');

filesToFix.forEach(file => {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  } else {
    console.log(`⚠️  File not found: ${fullPath}`);
  }
});

console.log('✅ All files processed!');