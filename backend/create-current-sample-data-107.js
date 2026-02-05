// Create sample data with current dates for employeeId 107
// This script creates realistic certification expiry dates for testing

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import EmployeeWorkPass from './src/modules/employee/EmployeeWorkPass.js';
import EmployeeCertifications from './src/modules/employee/EmployeeCertifications.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function createCurrentSampleData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const employeeId = 107;
    const now = new Date();

    // Create sample work pass data
    console.log(`\n📋 Creating sample work pass for employeeId: ${employeeId}`);
    
    // Clear existing work pass
    await EmployeeWorkPass.deleteMany({ employeeId });

    const workPassData = {
      employeeId: employeeId,
      status: 'ACTIVE',
      workPermitNo: 'WP2024001107',
      finNumber: 'G1234567X',
      applicationDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      issuanceDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      medicalDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      applicationDoc: '/docs/workpass/application_107.pdf',
      medicalDoc: '/docs/workpass/medical_107.pdf',
      issuanceDoc: '/docs/workpass/issuance_107.pdf',
      momDoc: '/docs/workpass/mom_107.pdf'
    };

    const workPass = new EmployeeWorkPass(workPassData);
    await workPass.save();
    console.log('✅ Work pass created successfully:', {
      employeeId: workPass.employeeId,
      workPermitNo: workPass.workPermitNo,
      finNumber: workPass.finNumber,
      status: workPass.status,
      expiryDate: workPass.expiryDate
    });

    // Create sample certifications data with realistic dates
    console.log(`\n📜 Creating sample certifications for employeeId: ${employeeId}`);
    
    // Clear existing certifications
    await EmployeeCertifications.deleteMany({ employeeId });

    const certificationsData = [
      {
        employeeId: employeeId,
        name: 'Safety Induction Training',
        type: 'training',
        ownership: 'company',
        issueDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        expiryDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000), // 25 days from now (warning)
        documentPath: '/docs/certs/safety_induction_107.pdf'
      },
      {
        employeeId: employeeId,
        name: 'First Aid Certification',
        type: 'professional cert',
        ownership: 'employee',
        issueDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        expiryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now (urgent)
        documentPath: '/docs/certs/first_aid_107.pdf'
      },
      {
        employeeId: employeeId,
        name: 'Crane Operation License',
        type: 'professional cert',
        ownership: 'employee',
        issueDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
        expiryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now (urgent)
        documentPath: '/docs/certs/crane_license_107.pdf'
      },
      {
        employeeId: employeeId,
        name: 'Height Work Training',
        type: 'training',
        ownership: 'company',
        issueDate: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
        expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now (warning)
        documentPath: '/docs/certs/height_work_107.pdf'
      },
      {
        employeeId: employeeId,
        name: 'Electrical Safety Course',
        type: 'training',
        ownership: 'company',
        issueDate: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000), // 400 days ago
        expiryDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (expired)
        documentPath: '/docs/certs/electrical_safety_107.pdf'
      },
      {
        employeeId: employeeId,
        name: 'Construction Skills Certification',
        type: 'professional cert',
        ownership: 'employee',
        issueDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        expiryDate: null, // No expiry date (permanent)
        documentPath: '/docs/certs/construction_skills_107.pdf'
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

    console.log('\n🎉 Sample data creation completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Employee ID: ${employeeId}`);
    console.log(`   Work Pass: ${workPassData.workPermitNo} (${workPassData.status})`);
    console.log(`   Certifications: ${certifications.length} created`);
    
    const activeCount = certifications.filter(c => c.expiryDate && new Date(c.expiryDate) > new Date()).length;
    const expiredCount = certifications.filter(c => c.expiryDate && new Date(c.expiryDate) < new Date()).length;
    const permanentCount = certifications.filter(c => !c.expiryDate).length;
    
    console.log(`   - Active: ${activeCount}`);
    console.log(`   - Expired: ${expiredCount}`);
    console.log(`   - Permanent: ${permanentCount}`);

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

    console.log('\n🚀 You can now test the worker profile improvements!');
    console.log('   1. Login with employeeId 107');
    console.log('   2. Check profile page for work pass data');
    console.log('   3. Check certification alerts on dashboard and profile');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createCurrentSampleData();