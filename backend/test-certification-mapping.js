// Test script to verify certification data mapping

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import models
import Employee from './src/modules/employee/Employee.js';
import EmployeeCertifications from './src/modules/employee/EmployeeCertifications.js';
import User from './src/modules/user/User.js';
import Company from './src/modules/company/Company.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp';

async function testCertificationMapping() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test with userId 64 (your current user)
    const userId = 64;
    const companyId = 1;

    // Get user, employee, company, and certifications
    const [user, employee, company, certifications] = await Promise.all([
      User.findOne({ id: userId }),
      Employee.findOne({ userId: userId, companyId: companyId }),
      Company.findOne({ id: companyId }),
      EmployeeCertifications.find({ employeeId: 107 }) // Using 107 since that's where sample data exists
    ]);

    console.log('\n📋 Raw Data:');
    console.log('User:', user ? { id: user.id, name: user.name } : 'Not found');
    console.log('Employee:', employee ? { id: employee.id, fullName: employee.fullName } : 'Not found');
    console.log('Company:', company ? { id: company.id, name: company.name } : 'Not found');
    console.log('Certifications count:', certifications.length);

    if (certifications.length > 0) {
      console.log('\n📜 Sample Raw Certification:');
      const sampleCert = certifications[0];
      console.log(JSON.stringify(sampleCert, null, 2));

      console.log('\n🔄 Testing Mapping Logic:');
      
      // Test the mapping logic
      const mappedCert = {
        id: sampleCert.id || sampleCert._id?.toString() || Math.random().toString(),
        name: sampleCert.name || 'Unknown Certification',
        issuer: sampleCert.ownership === 'company' ? (company?.name || 'Company') : 'External Provider',
        issueDate: sampleCert.issueDate ? sampleCert.issueDate.toISOString() : new Date().toISOString(),
        expiryDate: sampleCert.expiryDate ? sampleCert.expiryDate.toISOString() : null,
        certificateNumber: sampleCert.documentPath ? 
          path.basename(sampleCert.documentPath, path.extname(sampleCert.documentPath)).replace(/^(cert_|certificate_|doc_)/, '').toUpperCase() : 
          'N/A',
        status: sampleCert.expiryDate ? (
          new Date(sampleCert.expiryDate) < new Date() ? 'expired' :
          new Date(sampleCert.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'expiring_soon' :
          'active'
        ) : 'active'
      };

      console.log('\n✅ Mapped Certification:');
      console.log(JSON.stringify(mappedCert, null, 2));

      console.log('\n🔍 Field Analysis:');
      console.log('Original ownership:', sampleCert.ownership);
      console.log('Mapped issuer:', mappedCert.issuer);
      console.log('Original documentPath:', sampleCert.documentPath);
      console.log('Mapped certificateNumber:', mappedCert.certificateNumber);
      console.log('Original expiryDate:', sampleCert.expiryDate);
      console.log('Mapped status:', mappedCert.status);

      // Test all certifications
      console.log('\n📋 All Mapped Certifications:');
      const allMapped = certifications.map(cert => {
        let status = 'active';
        if (cert.expiryDate) {
          const now = new Date();
          const expiryDate = new Date(cert.expiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            status = 'expired';
          } else if (daysUntilExpiry <= 30) {
            status = 'expiring_soon';
          } else {
            status = 'active';
          }
        }

        let certificateNumber = 'N/A';
        if (cert.documentPath) {
          const filename = path.basename(cert.documentPath, path.extname(cert.documentPath));
          certificateNumber = filename.replace(/^(cert_|certificate_|doc_)/, '').toUpperCase();
        }

        let issuer = 'N/A';
        if (cert.ownership === 'company') {
          issuer = company?.name || 'Company';
        } else if (cert.ownership === 'employee') {
          issuer = 'External Provider';
        }

        return {
          id: cert.id || cert._id?.toString() || Math.random().toString(),
          name: cert.name || 'Unknown Certification',
          issuer: issuer,
          issueDate: cert.issueDate ? cert.issueDate.toISOString() : new Date().toISOString(),
          expiryDate: cert.expiryDate ? cert.expiryDate.toISOString() : null,
          certificateNumber: certificateNumber,
          status: status
        };
      });

      allMapped.forEach((cert, index) => {
        console.log(`${index + 1}. ${cert.name}`);
        console.log(`   Issuer: ${cert.issuer}`);
        console.log(`   Certificate #: ${cert.certificateNumber}`);
        console.log(`   Status: ${cert.status}`);
        console.log(`   Expiry: ${cert.expiryDate || 'No expiry'}`);
        console.log('');
      });

    } else {
      console.log('⚠️ No certifications found. Run create-sample-certifications-64.js first.');
    }

  } catch (error) {
    console.error('❌ Error testing certification mapping:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testCertificationMapping();