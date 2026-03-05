// Quick MongoDB insertion script
// Run this with: node quick-insert-quotations.js

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'erp_db';

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
    remarks: 'Approved with standard terms',
    createdAt: new Date(),
    updatedAt: new Date()
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
    createdBy: 2,
    createdAt: new Date(),
    updatedAt: new Date()
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
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date()
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
    remarks: 'Budget constraints - please revise pricing',
    createdAt: new Date(),
    updatedAt: new Date()
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
    remarks: 'Converted to Project PJ-001',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function insertQuotations() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('quotations');
    
    // Insert the documents
    const result = await collection.insertMany(sampleQuotations);
    console.log(`✅ Inserted ${result.insertedCount} quotations`);
    
    // Show what was inserted
    sampleQuotations.forEach(q => {
      console.log(`   - ${q.quotationCode}: ${q.projectName} (${q.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

insertQuotations();