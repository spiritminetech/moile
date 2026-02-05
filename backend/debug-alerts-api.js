// Debug certification alerts API directly
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import Employee from './src/modules/employee/Employee.js';
import EmployeeCertifications from './src/modules/employee/EmployeeCertifications.js';
import User from './src/modules/user/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function debugAlertsAPI() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check user with email worker1@gmail.com
    console.log('\n🔍 Looking for user with email worker1@gmail.com...');
    const user = await User.findOne({ email: 'worker1@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found with email worker1@gmail.com');
      
      // Show all users
      const allUsers = await User.find({}).select('id email role companyId');
      console.log('\n📋 Available users:');
      allUsers.forEach(u => {
        console.log(`   ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, CompanyID: ${u.companyId}`);
      });
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    });

    // Find associated employee
    console.log('\n🔍 Looking for employee with userId:', user.id);
    const employee = await Employee.findOne({ userId: user.id });
    
    if (!employee) {
      console.log('❌ Employee not found for userId:', user.id);
      
      // Show all employees
      const allEmployees = await Employee.find({}).select('id fullName userId companyId');
      console.log('\n📋 Available employees:');
      allEmployees.forEach(emp => {
        console.log(`   ID: ${emp.id}, Name: ${emp.fullName}, UserID: ${emp.userId}, CompanyID: ${emp.companyId}`);
      });
      return;
    }

    console.log('✅ Employee found:', {
      id: employee.id,
      fullName: employee.fullName,
      userId: employee.userId,
      companyId: employee.companyId
    });

    // Check certifications for this employee
    console.log('\n🔍 Looking for certifications for employeeId:', employee.id);
    const certifications = await EmployeeCertifications.find({ employeeId: employee.id });
    
    console.log(`📜 Found ${certifications.length} certifications:`);
    
    if (certifications.length === 0) {
      console.log('❌ No certifications found for employeeId:', employee.id);
      
      // Check if there are any certifications in the database
      const allCerts = await EmployeeCertifications.find({}).select('employeeId name expiryDate');
      console.log(`\n📋 Total certifications in database: ${allCerts.length}`);
      allCerts.forEach(cert => {
        console.log(`   EmployeeID: ${cert.employeeId}, Name: ${cert.name}, Expiry: ${cert.expiryDate}`);
      });
      return;
    }

    // Analyze certifications for alerts
    const now = new Date();
    const alerts = [];
    
    certifications.forEach((cert, index) => {
      const daysUntilExpiry = cert.expiryDate 
        ? Math.ceil((new Date(cert.expiryDate) - now) / (1000 * 60 * 60 * 24))
        : null;
      
      let alertLevel = null;
      if (daysUntilExpiry !== null) {
        if (daysUntilExpiry < 0) alertLevel = 'expired';
        else if (daysUntilExpiry <= 7) alertLevel = 'urgent';
        else if (daysUntilExpiry <= 30) alertLevel = 'warning';
      }

      console.log(`   ${index + 1}. ${cert.name}`);
      console.log(`      Expiry: ${cert.expiryDate ? cert.expiryDate.toDateString() : 'No expiry'}`);
      console.log(`      Days until expiry: ${daysUntilExpiry}`);
      console.log(`      Alert level: ${alertLevel || 'none'}`);

      if (alertLevel) {
        alerts.push({
          certificationId: cert.id || cert._id,
          name: cert.name,
          expiryDate: cert.expiryDate,
          daysUntilExpiry: daysUntilExpiry,
          alertLevel: alertLevel
        });
      }
    });

    console.log(`\n🚨 Generated ${alerts.length} alerts:`);
    alerts.forEach((alert, index) => {
      console.log(`   ${index + 1}. ${alert.name} - ${alert.alertLevel} (${alert.daysUntilExpiry} days)`);
    });

    console.log('\n✅ Debug completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   User: ${user.email} (ID: ${user.id})`);
    console.log(`   Employee: ${employee.fullName} (ID: ${employee.id})`);
    console.log(`   Certifications: ${certifications.length}`);
    console.log(`   Alerts: ${alerts.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the debug
debugAlertsAPI();