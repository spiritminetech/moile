import axios from 'axios';
import mongoose from 'mongoose';
import Project from './src/modules/project/models/Project.js';
import Employee from './src/modules/employee/Employee.js';
import User from './src/modules/user/User.js';
import { validateGeofence } from './utils/geofenceUtil.js';

const API_BASE = 'http://192.168.1.6:5002/api';

async function debugYourGeofenceIssue() {
  try {
    console.log('🔍 Debugging your specific geofence issue...');
    console.log('==============================================');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/smt_erp');
    console.log('✅ Connected to database');
    
    // Your exact coordinates
    const userLocation = {
      latitude: 12.865132531605989,
      longitude: 77.64679714223945,
      accuracy: 7.072961373614264
    };
    
    const projectId = 1;
    
    console.log('\n📍 Your location:', userLocation);
    console.log('🏗️ Project ID:', projectId);
    
    // Step 1: Check if project exists and get its data
    console.log('\n🔍 Step 1: Checking project data in database...');
    const project = await Project.findOne({ id: projectId, companyId: 1 });
    
    if (!project) {
      console.log('❌ Project not found in database!');
      
      // List available projects
      const availableProjects = await Project.find({ companyId: 1 }).select('id projectName latitude longitude geofenceRadius geofence');
      console.log('📋 Available projects for company 1:');
      availableProjects.forEach(p => {
        console.log(`   - ID: ${p.id}, Name: ${p.projectName}`);
        console.log(`     Location: ${p.latitude}, ${p.longitude}`);
        console.log(`     Geofence: radius=${p.geofenceRadius}, structure=${JSON.stringify(p.geofence)}`);
      });
      
      return;
    }
    
    console.log('✅ Project found:', {
      id: project.id,
      name: project.projectName,
      latitude: project.latitude,
      longitude: project.longitude,
      geofenceRadius: project.geofenceRadius,
      geofence: project.geofence
    });
    
    // Step 2: Test geofence validation with project data
    console.log('\n🔍 Step 2: Testing geofence validation with project data...');
    
    const centerLat = project.geofence?.center?.latitude || project.latitude || 0;
    const centerLng = project.geofence?.center?.longitude || project.longitude || 0;
    const radius = project.geofence?.radius || project.geofenceRadius || 100;
    
    const projectGeofence = {
      center: {
        latitude: centerLat,
        longitude: centerLng
      },
      radius: radius,
      strictMode: project.geofence?.strictMode !== false,
      allowedVariance: project.geofence?.allowedVariance || 10
    };
    
    console.log('🎯 Project geofence configuration:', projectGeofence);
    
    const directValidation = validateGeofence(userLocation, projectGeofence);
    console.log('✅ Direct validation result:', directValidation);
    
    // Step 3: Check user authentication
    console.log('\n🔍 Step 3: Checking user authentication...');
    const user = await User.findOne({ username: 'worker@gmail.com' });
    if (!user) {
      console.log('❌ User worker@gmail.com not found!');
      return;
    }
    
    const employee = await Employee.findOne({ userId: user.id, companyId: 1 });
    if (!employee) {
      console.log('❌ Employee record not found for user!');
      return;
    }
    
    console.log('✅ User found:', {
      userId: user.id,
      username: user.username,
      employeeId: employee.id,
      companyId: employee.companyId
    });
    
    // Step 4: Test the actual API endpoint
    console.log('\n🔍 Step 4: Testing the actual API endpoint...');
    
    // Generate a test token (you'll need to replace this with a real token)
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImNvbXBhbnlJZCI6MSwidXNlcm5hbWUiOiJ3b3JrZXJAZ21haWwuY29tIiwiaWF0IjoxNzM4NTEzNzE5LCJleHAiOjE3Mzg1MTczMTl9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
    
    try {
      const apiResponse = await axios.post(`${API_BASE}/attendance/validate-geofence`, {
        projectId: projectId,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        accuracy: userLocation.accuracy
      }, {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ API Response:', apiResponse.data);
      
      // Compare API response with direct validation
      console.log('\n📊 Comparison:');
      console.log('Direct validation:', directValidation);
      console.log('API response:', apiResponse.data);
      
    } catch (apiError) {
      console.log('❌ API Error:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        message: apiError.message
      });
      
      if (apiError.response?.status === 401) {
        console.log('🔑 Authentication issue - you need a valid JWT token');
      } else if (apiError.response?.status === 404) {
        console.log('🔍 Project not found via API - check project ID and company association');
      }
    }
    
    // Step 5: Test with different scenarios
    console.log('\n🔍 Step 5: Testing edge cases...');
    
    const testCases = [
      {
        name: 'Missing project geofence data',
        geofence: null
      },
      {
        name: 'Invalid coordinates in project',
        geofence: {
          center: { latitude: 0, longitude: 0 },
          radius: 100
        }
      },
      {
        name: 'Very small geofence radius',
        geofence: {
          center: { latitude: centerLat, longitude: centerLng },
          radius: 1
        }
      }
    ];
    
    testCases.forEach((testCase, index) => {
      console.log(`\n${index + 1}. ${testCase.name}:`);
      try {
        const result = validateGeofence(userLocation, testCase.geofence);
        console.log('   Result:', result);
      } catch (error) {
        console.log('   Error:', error.message);
      }
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

debugYourGeofenceIssue();