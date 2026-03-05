import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Quotation from './src/modules/quotation/models/QuotationModel.js';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_db');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample quotation data
const sampleQuotations = [
  {
    quotationCode: 'QT-001',
    companyId: 1,
    clientId: 1,
    projectName: 'Facade Renovation Work',
    description: 'Complete facade renovation including cleaning, painting, and minor repairs',
    version: 1,
    status: 'Approved',
    totalManpowerCost: 45000,
    totalMaterialCost: 35000,
    totalToolCost: 8000,
    totalTransportCost: 5000,
    totalWarrantyCost: 2000,
    totalCertificationCost: 1000,
    grandTotal: 96000,
    validUntil: new Date('2026-04-30'),
    createdBy: 1,
    approvedBy: 1,
    approvedAt: new Date('2026-01-15'),
    remarks: 'Approved with standard terms'
  },
  {
    quotationCode: 'QT-002',
    companyId: 1,
    clientId: 2,
    projectName: 'External Painting Works',
    description: 'External painting for Tower A and Tower B',
    version: 2,
    status: 'Submitted',
    totalManpowerCost: 25000,
    totalMaterialCost: 18000,
    totalToolCost: 4000,
    totalTransportCost: 3000,
    totalWarrantyCost: 1500,
    totalCertificationCost: 500,
    grandTotal: 52000,
    validUntil: new Date('2026-03-31'),
    createdBy: 2
  },
  {
    quotationCode: 'QT-003',
    companyId: 1,
    clientId: 3,
    projectName: 'Plumbing System Upgrade',
    description: 'Complete plumbing system upgrade for residential complex',
    version: 1,
    status: 'Draft',
    totalManpowerCost: 35000,
    totalMaterialCost: 28000,
    totalToolCost: 6000,
    totalTransportCost: 4000,
    totalWarrantyCost: 2500,
    totalCertificationCost: 1500,
    grandTotal: 77000,
    validUntil: new Date('2026-05-15'),
    createdBy: 1
  },
  {
    quotationCode: 'QT-004',
    companyId: 1,
    clientId: 1,
    projectName: 'Electrical Installation',
    description: 'New electrical installation and wiring for commercial building',
    version: 1,
    status: 'Rejected',
    totalManpowerCost: 40000,
    totalMaterialCost: 32000,
    totalToolCost: 7000,
    totalTransportCost: 4500,
    totalWarrantyCost: 3000,
    totalCertificationCost: 2000,
    grandTotal: 88500,
    validUntil: new Date('2026-02-28'),
    createdBy: 2,
    approvedBy: 1,
    approvedAt: new Date('2026-01-20'),
    remarks: 'Budget constraints - please revise pricing'
  },
  {
    quotationCode: 'QT-005',
    companyId: 1,
    clientId: 4,
    projectName: 'HVAC System Installation',
    description: 'Complete HVAC system installation for office complex',
    version: 1,
    status: 'Converted',
    totalManpowerCost: 55000,
    totalMaterialCost: 45000,
    totalToolCost: 10000,
    totalTransportCost: 6000,
    totalWarrantyCost: 4000,
    totalCertificationCost: 3000,
    grandTotal: 123000,
    validUntil: new Date('2026-06-30'),
    createdBy: 1,
    approvedBy: 1,
    approvedAt: new Date('2026-01-25'),
    remarks: 'Converted to Project PJ-001'
  },
  {
    quotationCode: 'QT-006',
    companyId: 1,
    clientId: 2,
    projectName: 'Waterproofing Works',
    description: 'Waterproofing for basement and roof areas',
    version: 1,
    status: 'Draft',
    totalManpowerCost: 20000,
    totalMaterialCost: 15000,
    totalToolCost: 3000,
    totalTransportCost: 2000,
    totalWarrantyCost: 1000,
    totalCertificationCost: 500,
    grandTotal: 41500,
    validUntil: new Date('2026-04-15'),
    createdBy: 2
  }
];

// Insert sample data
const insertSampleData = async () => {
  try {
    // Clear existing data (optional)
    console.log('🗑️  Clearing existing quotations...');
    await Quotation.deleteMany({});
    
    // Insert sample data
    console.log('📝 Inserting sample quotations...');
    const insertedQuotations = await Quotation.insertMany(sampleQuotations);
    
    console.log(`✅ Successfully inserted ${insertedQuotations.length} quotations:`);
    insertedQuotations.forEach(quotation => {
      console.log(`   - ${quotation.quotationCode}: ${quotation.projectName} (${quotation.status})`);
    });
    
    // Display summary
    console.log('\n📊 Summary:');
    const statusCounts = await Quotation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$grandTotal' }
        }
      }
    ]);
    
    statusCounts.forEach(item => {
      console.log(`   ${item._id}: ${item.count} quotations, Total: $${item.totalAmount.toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await insertSampleData();
  
  console.log('\n🎉 Sample data insertion completed!');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script execution failed:', error);
  process.exit(1);
});