/**
 * Setup Enhanced Profile Test Data
 * Creates sample data with all the new profile fields for testing
 */

import mongoose from 'mongoose';
import Employee from './src/modules/employee/Employee.js';
import EmployeeWorkPass from './src/modules/employee/EmployeeWorkPass.js';
import EmployeeCertifications from './src/modules/employee/EmployeeCertifications.js';
import User from './src/modules/user/User.js';
import Company from './src/modules/company/Company.js';

const setupEnhancedProfileTestData = async () => {
  try {
    console.log('🚀 Setting up Enhanced Profile Test Data...');

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    }

    // Find existing worker user (worker@gmail.com)
    const workerUser = await User.findOne({ email: 'worker@gmail.com' });
    if (!workerUser) {
      console.log('❌ Worker user not found. Please ensure worker@gmail.com exists.');
      return;
    }

    console.log(`✅ Found worker user: ${workerUser.email} (ID: ${workerUser.id})`);

    // Find or create company
    let company = await Company.findOne({ id: 1 });
    if (!company) {
      company = await Company.create({
        id: 1,
        name: 'CGR Construction Pte Ltd',
        address: '123 Construction Ave, Singapore 123456',
        phone: '+65 6123 4567',
        email: 'info@cgr.com.sg'
      });
      console.log('✅ Created company: CGR Construction Pte Ltd');
    } else {
      console.log(`✅ Found company: ${company.name}`);
    }

    // Update or create employee with enhanced fields
    let employee = await Employee.findOne({ userId: workerUser.id, companyId: company.id });
    
    if (employee) {
      // Update existing employee with new fields
      await Employee.updateOne(
        { _id: employee._id },
        {
          $set: {
            nationality: 'Malaysian',
            jobTitle: 'Senior Construction Worker',
            department: 'Site Operations',
            employeeCode: 'CGR-W-001',
            phone: '+65 9876 5432'
          }
        }
      );
      console.log('✅ Updated existing employee with enhanced fields');
    } else {
      // Create new employee
      employee = await Employee.create({
        id: 107,
        companyId: company.id,
        userId: workerUser.id,
        employeeCode: 'CGR-W-001',
        fullName: 'Ahmad Rahman',
        phone: '+65 9876 5432',
        nationality: 'Malaysian',
        jobTitle: 'Senior Construction Worker',
        department: 'Site Operations',
        status: 'ACTIVE'
      });
      console.log('✅ Created new employee with enhanced fields');
    }

    // Create or update work pass with enhanced fields
    let workPass = await EmployeeWorkPass.findOne({ employeeId: employee.id });
    
    if (workPass) {
      await EmployeeWorkPass.updateOne(
        { _id: workPass._id },
        {
          $set: {
            workPassType: 'WORK_PERMIT',
            status: 'ACTIVE',
            workPermitNo: 'WP2024001234',
            finNumber: 'G1234567X',
            applicationDoc: '/uploads/workpass/application_WP2024001234.pdf',
            issuanceDoc: '/uploads/workpass/issuance_WP2024001234.pdf',
            momDoc: '/uploads/workpass/mom_reference_WP2024001234.pdf',
            medicalDoc: '/uploads/workpass/medical_WP2024001234.pdf',
            issuanceDate: new Date('2024-01-15'),
            expiryDate: new Date('2026-01-14'),
            applicationDate: new Date('2023-12-01'),
            medicalDate: new Date('2023-12-10')
          }
        }
      );
      console.log('✅ Updated existing work pass with enhanced fields');
    } else {
      workPass = await EmployeeWorkPass.create({
        employeeId: employee.id,
        workPassType: 'WORK_PERMIT',
        status: 'ACTIVE',
        workPermitNo: 'WP2024001234',
        finNumber: 'G1234567X',
        applicationDoc: '/uploads/workpass/application_WP2024001234.pdf',
        issuanceDoc: '/uploads/workpass/issuance_WP2024001234.pdf',
        momDoc: '/uploads/workpass/mom_reference_WP2024001234.pdf',
        medicalDoc: '/uploads/workpass/medical_WP2024001234.pdf',
        issuanceDate: new Date('2024-01-15'),
        expiryDate: new Date('2026-01-14'),
        applicationDate: new Date('2023-12-01'),
        medicalDate: new Date('2023-12-10')
      });
      console.log('✅ Created new work pass with enhanced fields');
    }

    // Create sample certifications with enhanced fields
    const existingCerts = await EmployeeCertifications.find({ employeeId: employee.id });
    
    if (existingCerts.length === 0) {
      const certifications = [
        {
          employeeId: employee.id,
          name: 'Safety Orientation Course',
          type: 'training',
          certificationType: 'NEW',
          ownership: 'company',
          issueDate: new Date('2024-01-10'),
          expiryDate: new Date('2027-01-09'),
          documentPath: '/uploads/certifications/safety_orientation_001.pdf'
        },
        {
          employeeId: employee.id,
          name: 'Confined Space Entry',
          type: 'professional cert',
          certificationType: 'RENEWAL',
          ownership: 'company',
          issueDate: new Date('2023-06-15'),
          expiryDate: new Date('2025-06-14'),
          documentPath: '/uploads/certifications/confined_space_002.pdf'
        },
        {
          employeeId: employee.id,
          name: 'First Aid Certification',
          type: 'professional cert',
          certificationType: 'NEW',
          ownership: 'employee',
          issueDate: new Date('2024-02-01'),
          expiryDate: new Date('2026-01-31'),
          documentPath: '/uploads/certifications/first_aid_003.pdf'
        }
      ];

      await EmployeeCertifications.insertMany(certifications);
      console.log('✅ Created 3 sample certifications with enhanced fields');
    } else {
      // Update existing certifications
      await EmployeeCertifications.updateMany(
        { employeeId: employee.id },
        {
          $set: {
            certificationType: 'NEW',
            ownership: 'company'
          }
        }
      );
      console.log(`✅ Updated ${existingCerts.length} existing certifications with enhanced fields`);
    }

    console.log('\n🎉 Enhanced Profile Test Data setup completed successfully!');
    
    console.log('\n📊 Summary:');
    console.log(`- Employee: ${employee.fullName} (${employee.employeeCode})`);
    console.log(`- Nationality: ${employee.nationality}`);
    console.log(`- Job Title: ${employee.jobTitle}`);
    console.log(`- Department: ${employee.department}`);
    console.log(`- Company: ${company.name}`);
    console.log(`- Work Pass: ${workPass.workPassType} (${workPass.workPermitNo})`);
    console.log(`- FIN Number: ${workPass.finNumber}`);
    console.log(`- Certifications: ${existingCerts.length > 0 ? existingCerts.length : 3} records`);

    console.log('\n🧪 Ready for testing! Run: node test-enhanced-profile-api.js');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
};

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupEnhancedProfileTestData()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export default setupEnhancedProfileTestData;