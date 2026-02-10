/**
 * Migration: Add Profile Enhancement Fields
 * Adds nationality, department fields to Employee collection
 * Updates work pass and certification structures
 */

import mongoose from 'mongoose';
import Employee from '../src/modules/employee/Employee.js';
import EmployeeWorkPass from '../src/modules/employee/EmployeeWorkPass.js';
import EmployeeCertifications from '../src/modules/employee/EmployeeCertifications.js';

const addProfileEnhancementFields = async () => {
  try {
    console.log('🚀 Starting Profile Enhancement Fields Migration...');

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    }

    // 1. Update Employee collection - add nationality and department to existing records
    console.log('📝 Updating Employee records...');
    const employeeUpdateResult = await Employee.updateMany(
      { 
        $or: [
          { nationality: { $exists: false } },
          { department: { $exists: false } }
        ]
      },
      { 
        $set: { 
          nationality: 'Singapore', // Default nationality
          department: 'Construction' // Default department
        }
      }
    );
    console.log(`✅ Updated ${employeeUpdateResult.modifiedCount} employee records`);

    // 2. Update EmployeeWorkPass collection - add workPassType to existing records
    console.log('📝 Updating Work Pass records...');
    const workPassUpdateResult = await EmployeeWorkPass.updateMany(
      { workPassType: { $exists: false } },
      { 
        $set: { 
          workPassType: 'WORK_PERMIT' // Default work pass type
        }
      }
    );
    console.log(`✅ Updated ${workPassUpdateResult.modifiedCount} work pass records`);

    // 3. Update EmployeeCertifications collection - add certificationType to existing records
    console.log('📝 Updating Certification records...');
    const certificationUpdateResult = await EmployeeCertifications.updateMany(
      { certificationType: { $exists: false } },
      { 
        $set: { 
          certificationType: 'NEW' // Default certification type
        }
      }
    );
    console.log(`✅ Updated ${certificationUpdateResult.modifiedCount} certification records`);

    // 4. Ensure ownership field exists in certifications
    const ownershipUpdateResult = await EmployeeCertifications.updateMany(
      { ownership: { $exists: false } },
      { 
        $set: { 
          ownership: 'company' // Default ownership
        }
      }
    );
    console.log(`✅ Updated ${ownershipUpdateResult.modifiedCount} certification ownership records`);

    console.log('🎉 Profile Enhancement Fields Migration completed successfully!');
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`- Employee records updated: ${employeeUpdateResult.modifiedCount}`);
    console.log(`- Work Pass records updated: ${workPassUpdateResult.modifiedCount}`);
    console.log(`- Certification records updated: ${certificationUpdateResult.modifiedCount}`);
    console.log(`- Certification ownership updated: ${ownershipUpdateResult.modifiedCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addProfileEnhancementFields()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export default addProfileEnhancementFields;