// Create sample employeeWorkPass data for employeeId 107
// This script inserts test data for the worker profile improvements

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import EmployeeWorkPass from './src/modules/employee/EmployeeWorkPass.js';
import EmployeeCertifications from './src/modules/employee/EmployeeCertifications.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function createSampleData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const employeeId = 107;

    // Create sample work pass data
    console.log(`\n📋 Creating sample work pass for employeeId: ${employeeId}`);
    
    // Check if work pass already exists
    const existingWorkPass = await EmployeeWorkPass.findOne({ employeeId });
    if (existingWorkPass) {
      console.log('⚠️ Work pass already exists, updating...');
      await EmployeeWorkPass.deleteOne({ employeeId });
    }

    const workPassData = {
      employeeId: employeeId,
      status: 'ACTIVE',
      workPermitNo: 'WP2024001107',
      finNumber: 'G1234567X',
      applicationDate: new Date('2024-01-15'),
      issuanceDate: new Date('2024-02-01'),
      expiryDate: new Date('2026-02-01'), // 2 years validity
      medicalDate: new Date('2024-01-20'),
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

    // Create sample certifications data
    console.log(`\n📜 Creating sample certifications for employeeId: ${employeeId}`);
    
    // Clear existing certifications
    await EmployeeCertifications.deleteMany({ employeeId });

    const certificationsData = [
      {
        employeeId: employeeId,
        name: 'Safety Induction Training',
        type: 'training',
        ownership: 'company',
        issueDate: new Date('2024-01-10'),
        expiryDate: new Date('2025-03-15'), // Expires in ~1 month (warning)
        documentPath: '/docs/certs/safety_induction_107.pdf'
      },
      {
        employeeId: employeeId,
        name: 'First Aid Certification',
        type: 'professional cert',
        ownership: 'employee',
        issueDate: new Date('2023-06-15'),
        expiryDate: new Date('2025-02-20'), // Expires in ~2 weeks (urgent)
        documentPath: '/docs/certs/first_aid_107.pdf'
      },
      {
        employeeId: employeeId,
        name: 'Crane Operation License',
        type: 'professional cert',
        ownership: 'employee',
        issueDate: new Date('2023-03-01'),
        expiryDate: new Date('2025-02-10'), // Expires in ~5 days (urgent)
        documentPath: '/docs/certs/crane_license_107.pdf'
      },
      {
        employeeId: employeeId,
        name: 'Height Work Training',
        type: 'training',
        ownership: 'company',
        issueDate: new Date('2024-01-05'),
        expiryDate: new Date('2025-02-08'), // Expires in ~3 days (urgent)
        documentPath: '/docs/certs/height_work_107.pdf'
      },
      {
        employeeId: employeeId,
        name: 'Electrical Safety Course',
        type: 'training',
        ownership: 'company',
        issueDate: new Date('2023-01-01'),
        expiryDate: new Date('2024-12-01'), // Already expired
        documentPath: '/docs/certs/electrical_safety_107.pdf'
      },
      {
        employeeId: employeeId,
        name: 'Construction Skills Certification',
        type: 'professional cert',
        ownership: 'employee',
        issueDate: new Date('2022-08-15'),
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
    console.log(`   - Active: ${certifications.filter(c => c.expiryDate && new Date(c.expiryDate) > new Date()).length}`);
    console.log(`   - Expired: ${certifications.filter(c => c.expiryDate && new Date(c.expiryDate) < new Date()).length}`);
    console.log(`   - Permanent: ${certifications.filter(c => !c.expiryDate).length}`);

    console.log('\n🚀 You can now test the worker profile improvements!');
    console.log('   1. Login with employeeId 107');
    console.log('   2. Check profile page for work pass data');
    console.log('   3. Check certification alerts');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createSampleData();