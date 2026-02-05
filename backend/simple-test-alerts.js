// Simple test to verify certification alerts work
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models and controller
import Employee from './src/modules/employee/Employee.js';
import EmployeeCertifications from './src/modules/employee/EmployeeCertifications.js';
import { getWorkerCertificationAlerts } from './src/modules/worker/workerController.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function testCertificationAlerts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find employee 107
    const employee = await Employee.findOne({ id: 107 });
    if (!employee) {
      console.log('❌ Employee 107 not found');
      return;
    }

    console.log('✅ Employee found:', employee.fullName);

    // Check certifications
    const certifications = await EmployeeCertifications.find({ employeeId: 107 });
    console.log(`📜 Found ${certifications.length} certifications for employee 107:`);
    
    const now = new Date();
    certifications.forEach((cert, index) => {
      const daysUntilExpiry = cert.expiryDate 
        ? Math.ceil((new Date(cert.expiryDate) - now) / (1000 * 60 * 60 * 24))
        : null;
      
      let alertLevel = 'none';
      if (daysUntilExpiry !== null) {
        if (daysUntilExpiry < 0) alertLevel = 'expired';
        else if (daysUntilExpiry <= 7) alertLevel = 'urgent';
        else if (daysUntilExpiry <= 30) alertLevel = 'warning';
      }

      console.log(`   ${index + 1}. ${cert.name}`);
      console.log(`      Expiry: ${cert.expiryDate ? cert.expiryDate.toDateString() : 'No expiry'}`);
      console.log(`      Days until expiry: ${daysUntilExpiry}`);
      console.log(`      Alert level: ${alertLevel}`);
    });

    // Mock request object for testing the controller
    const mockReq = {
      user: {
        userId: employee.userId,
        companyId: employee.companyId
      }
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`\n📊 Controller Response (${code}):`, JSON.stringify(data, null, 2));
          return data;
        }
      }),
      json: (data) => {
        console.log('\n📊 Controller Response (200):', JSON.stringify(data, null, 2));
        return data;
      }
    };

    console.log('\n🧪 Testing controller function...');
    await getWorkerCertificationAlerts(mockReq, mockRes);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testCertificationAlerts();