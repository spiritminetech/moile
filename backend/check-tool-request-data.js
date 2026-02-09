import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MaterialRequest from './src/modules/project/models/MaterialRequest.js';

dotenv.config();

async function checkToolRequestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the specific tool request
    const toolRequest = await MaterialRequest.findOne({ 
      id: 1770044161085 
    }).lean();

    console.log('\n🔧 Tool Request Details:');
    console.log(JSON.stringify(toolRequest, null, 2));

    console.log('\n📊 Field Types:');
    console.log('  projectId type:', typeof toolRequest.projectId);
    console.log('  projectId value:', toolRequest.projectId);
    console.log('  requestType:', toolRequest.requestType);
    console.log('  status:', toolRequest.status);

    // Check if projectId is a number or string
    console.log('\n🔍 Comparison Tests:');
    console.log('  projectId === 1:', toolRequest.projectId === 1);
    console.log('  projectId === "1":', toolRequest.projectId === "1");
    console.log('  projectId == 1:', toolRequest.projectId == 1);
    console.log('  projectId == "1":', toolRequest.projectId == "1");

    // Test the query with different project ID arrays
    const testProjectIds1 = [1003, 1002, 1001, 1014, 101]; // Numbers
    const testProjectIds2 = ['1003', '1002', '1001', '1014', '101']; // Strings

    console.log('\n🧪 Query Tests:');
    
    const count1 = await MaterialRequest.countDocuments({ 
      projectId: { $in: testProjectIds1 },
      requestType: 'TOOL',
      status: 'PENDING' 
    });
    console.log('  Count with number array:', count1);

    const count2 = await MaterialRequest.countDocuments({ 
      projectId: { $in: testProjectIds2 },
      requestType: 'TOOL',
      status: 'PENDING' 
    });
    console.log('  Count with string array:', count2);

    // Get all tool requests to see what we have
    const allToolRequests = await MaterialRequest.find({ 
      requestType: 'TOOL',
      status: 'PENDING' 
    }).lean();

    console.log('\n📋 All Pending Tool Requests:');
    allToolRequests.forEach(req => {
      console.log(`  - ID: ${req.id}, Project: ${req.projectId} (${typeof req.projectId}), Item: ${req.itemName}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkToolRequestData();
