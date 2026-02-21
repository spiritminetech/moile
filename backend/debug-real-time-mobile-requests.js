import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/modules/user/User.js';
import CompanyUser from './src/modules/companyUser/CompanyUser.js';
import Employee from './src/modules/employee/Employee.js';
import Project from './src/modules/project/models/Project.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for debugging');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const debugRealTimeMobileRequests = async () => {
  await connectDB();

  console.log('\n🔍 REAL-TIME MOBILE APP REQUEST DEBUGGER\n');
  console.log('This will help us see exactly what the mobile app is sending...\n');

  // Create a simple express server to intercept and log requests
  const app = express();
  app.use(express.json());

  // Middleware to log all requests
  app.use((req, res, next) => {
    console.log(`\n📱 MOBILE APP REQUEST INTERCEPTED:`);
    console.log(`   Method: ${req.method}`);
    console.log(`   URL: ${req.url}`);
    console.log(`   Headers:`, {
      authorization: req.headers.authorization ? 'Bearer [TOKEN]' : 'None',
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    });
    console.log(`   Body:`, req.body);
    
    next();
  });

  // Intercept validate-location requests specifically
  app.post('/api/worker/attendance/validate-location', async (req, res) => {
    console.log('\n🎯 VALIDATE-LOCATION REQUEST ANALYSIS:');
    
    try {
      const { projectId, latitude, longitude, accuracy } = req.body;
      console.log(`   Project ID: ${projectId}`);
      console.log(`   Location: (${latitude}, ${longitude})`);
      console.log(`   Accuracy: ${accuracy}`);

      // Decode the JWT token to see user info
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log(`   User ID: ${decoded.userId}`);
          console.log(`   Company ID: ${decoded.companyId}`);
          console.log(`   Role: ${decoded.role}`);
          console.log(`   Email: ${decoded.email}`);

          // Check if this project exists for this company
          const project = await Project.findOne({ 
            id: projectId, 
            companyId: decoded.companyId 
          });

          if (project) {
            console.log(`   ✅ Project ${projectId} EXISTS for company ${decoded.companyId}`);
            console.log(`   Project: ${project.projectName}`);
          } else {
            console.log(`   ❌ Project ${projectId} NOT FOUND for company ${decoded.companyId}`);
            
            // Check if project exists for other companies
            const anyProject = await Project.findOne({ id: projectId });
            if (anyProject) {
              console.log(`   Project ${projectId} exists but belongs to company ${anyProject.companyId}`);
            } else {
              console.log(`   Project ${projectId} doesn't exist at all`);
            }

            // Show available projects for this company
            const availableProjects = await Project.find({ 
              companyId: decoded.companyId 
            }).select('id projectName');
            console.log(`   Available projects for company ${decoded.companyId}:`, 
              availableProjects.map(p => `${p.id}-${p.projectName}`));
          }

          // Check user's employee record
          const employee = await Employee.findOne({ userId: decoded.userId });
          if (employee) {
            console.log(`   Employee currentProject: ${employee.currentProject ? employee.currentProject.id + '-' + employee.currentProject.name : 'None'}`);
          } else {
            console.log(`   No employee record found`);
          }

        } catch (tokenError) {
          console.log(`   ❌ Token decode error: ${tokenError.message}`);
        }
      } else {
        console.log(`   ❌ No authorization token`);
      }

      // Forward the request to the actual backend
      console.log('\n   Forwarding to actual backend...');
      
      // Return the actual error to help debug
      res.status(404).json({ 
        message: "Project not found",
        debug: {
          projectId,
          timestamp: new Date().toISOString(),
          note: "This is the intercepted request - check logs above for details"
        }
      });

    } catch (error) {
      console.log(`   ❌ Debug error: ${error.message}`);
      res.status(500).json({ message: "Debug error", error: error.message });
    }
  });

  // Start the debug server
  const PORT = 5003; // Different port to avoid conflicts
  app.listen(PORT, () => {
    console.log(`🚀 Debug server running on port ${PORT}`);
    console.log(`\n📋 INSTRUCTIONS:`);
    console.log(`1. Update your mobile app's API base URL to: http://192.168.1.6:${PORT}`);
    console.log(`2. Try the attendance action that's failing`);
    console.log(`3. Watch the logs here to see exactly what's being sent`);
    console.log(`4. Press Ctrl+C to stop debugging\n`);
  });

  // Also run a quick check of current database state
  console.log('📊 CURRENT DATABASE STATE:');
  
  // Check all users with gmail
  const gmailUsers = await User.find({ email: { $regex: 'gmail' } });
  console.log('\nGmail users:');
  for (const user of gmailUsers) {
    const companyMapping = await CompanyUser.findOne({ userId: user.id, isActive: true });
    const employee = await Employee.findOne({ userId: user.id });
    
    console.log(`   ${user.email} (ID: ${user.id})`);
    console.log(`     Company: ${companyMapping?.companyId || 'None'}`);
    console.log(`     Current Project: ${employee?.currentProject?.id || 'None'}`);
  }

  // Check projects for each company
  const companies = await CompanyUser.distinct('companyId');
  console.log('\nProjects by company:');
  for (const companyId of companies) {
    const projects = await Project.find({ companyId }).select('id projectName');
    console.log(`   Company ${companyId}: ${projects.map(p => p.id).join(', ')}`);
  }
};

debugRealTimeMobileRequests().catch(console.error);