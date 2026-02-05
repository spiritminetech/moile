// Create sample certifications for employeeId 64 (your current user)

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import Employee from './src/modules/employee/Employee.js';
import EmployeeCertifications from './src/modules/employee/EmployeeCertifications.js';
import User from './src/modules/user/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function createSampleCertifications() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the employee with userId 64
    const user = await User.findOne({ id: 64 });
    if (!user) {
      console.error('❌ User with ID 64 not found');
      return;
    }

    const employee = await Employee.findOne({ userId: 64 });
    if (!employee) {
      console.error('❌ Employee with userId 64 not found');
      return;
    }

    const employeeId = employee.id;
    console.log(`📋 Found employee: ${employee.fullName} (ID: ${employeeId})`);

    const now = new Date();

    // Clear existing certifications
    await EmployeeCertifications.deleteMany({ employeeId });
    console.log('🗑️ Cleared existing certifications');

    const certificationsData = [
      {
        employeeId: employeeId,
        name: 'Safety Induction Training',
        type: 'training',
        ownership: 'company',
        issueDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        expiryDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000), // 25 days from now (warning)
        documentPath: '/docs/certs/safety_induction_64.pdf'
      },
      {
        employeeId: employeeId,
        name: 'First Aid Certification',
        type: 'professional cert',
        ownership: 'employee',
        issueDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        expiryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now (urgent)
        documentPath: '/docs/certs/first_aid_64.pdf'
      },
      {
        employeeId: employeeId,
        name: 'Construction Skills Certification',
        type: 'professional cert',
        ownership: 'employee',
        issueDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
        expiryDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), // 180 days from now (active)
        documentPath: '/docs/certs/construction_skills_64.pdf'
      },
      {
        employeeId: employeeId,
        name: 'Height Work Training',
        type: 'training',
        ownership: 'company',
        issueDate: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
        expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now (warning)
        documentPath: '/docs/certs/height_work_64.pdf'
      },
      {
        employeeId: employeeId,
        name: 'Electrical Safety Course',
        type: 'training',
        ownership: 'company',
        issueDate: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000), // 400 days ago
        expiryDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (expired)
        documentPath: '/docs/certs/electrical_safety_64.pdf'
      }
    ];

    const certifications = await EmployeeCertifications.insertMany(certificationsData);
    console.log(`✅ ${certifications.length} certifications created successfully:`);
    
    certifications.forEach((cert, index) => {
      const daysUntilExpiry = cert.expiryDate 
        ? Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
        : null;
      
      let status = 'active';
      if (daysUntilExpiry === null) {
        status = 'permanent';
      } else if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 7) {
        status = 'urgent';
      } else if (daysUntilExpiry <= 30) {
        status = 'warning';
      }

      console.log(`   ${index + 1}. ${cert.name}`);
      console.log(`      Type: ${cert.type}, Ownership: ${cert.ownership}`);
      console.log(`      Expiry: ${cert.expiryDate ? cert.expiryDate.toDateString() : 'No expiry'}`);
      console.log(`      Status: ${status} ${daysUntilExpiry !== null ? `(${daysUntilExpiry} days)` : ''}`);
    });

    console.log('\n🎉 Sample certifications created successfully!');
    console.log(`\n📋 Summary for Employee ID ${employeeId}:`);
    console.log(`   Employee: ${employee.fullName}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Certifications: ${certifications.length} created`);
    
    const activeCount = certifications.filter(c => c.expiryDate && new Date(c.expiryDate) > new Date()).length;
    const expiredCount = certifications.filter(c => c.expiryDate && new Date(c.expiryDate) < new Date()).length;
    
    console.log(`   - Active: ${activeCount}`);
    console.log(`   - Expired: ${expiredCount}`);

    // Calculate alerts
    const urgentCount = certifications.filter(c => {
      if (!c.expiryDate) return false;
      const days = Math.ceil((new Date(c.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      return days > 0 && days <= 7;
    }).length;
    
    const warningCount = certifications.filter(c => {
      if (!c.expiryDate) return false;
      const days = Math.ceil((new Date(c.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      return days > 7 && days <= 30;
    }).length;

    console.log(`\n🚨 Expected Alerts:`);
    console.log(`   - Expired: ${expiredCount}`);
    console.log(`   - Urgent (≤7 days): ${urgentCount}`);
    console.log(`   - Warning (8-30 days): ${warningCount}`);
    console.log(`   - Total alerts: ${expiredCount + urgentCount + warningCount}`);

    console.log('\n🚀 Now refresh your profile page to see the certifications!');

  } catch (error) {
    console.error('❌ Error creating sample certifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createSampleCertifications();