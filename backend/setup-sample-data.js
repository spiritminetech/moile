// Combined script to populate both clients and quotations
// Run with: node setup-sample-data.js

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_db');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Client Schema
const clientSchema = new mongoose.Schema({
  clientId: { type: Number, unique: true, required: true },
  clientName: { type: String, required: true },
  contactPerson: String,
  email: String,
  phone: String,
  address: String,
  companyId: { type: Number, required: true },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

// Quotation Schema
const quotationSchema = new mongoose.Schema({
  quotationCode: { type: String, unique: true, index: true },
  companyId: { type: Number, index: true, required: true },
  clientId: { type: Number, index: true, required: true },
  projectName: { type: String, required: true },
  description: String,
  version: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Converted'],
    default: 'Draft',
    index: true
  },
  totalManpowerCost: { type: Number, default: 0 },
  totalMaterialCost: { type: Number, default: 0 },
  totalToolCost: { type: Number, default: 0 },
  totalTransportCost: { type: Number, default: 0 },
  totalWarrantyCost: { type: Number, default: 0 },
  totalCertificationCost: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  validUntil: Date,
  createdBy: { type: Number, index: true },
  approvedBy: Number,
  approvedAt: Date,
  remarks: String
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);
const Quotation = mongoose.model('Quotation', quotationSchema);

// Sample data
const clients = [
  {
    clientId: 1,
    clientName: 'ABC Pte Ltd',
    contactPerson: 'John Smith',
    email: 'john@abc.com.sg',
    phone: '+65 6123 4567',
    address: '123 Business Park, Singapore 123456',
    companyId: 1,
    status: 'Active'
  },
  {
    clientId: 2,
    clientName: 'XYZ Construction',
    contactPerson: 'Mary Johnson',
    email: 'mary@xyz.com.sg',
    phone: '+65 6234 5678',
    address: '456 Industrial Road, Singapore 234567',
    companyId: 1,
    status: 'Active'
  },
  {
    clientId: 3,
    clientName: 'DEF Properties',
    contactPerson: 'Robert Lee',
    email: 'robert@def.com.sg',
    phone: '+65 6345 6789',
    address: '789 Orchard Road, Singapore 345678',
    companyId: 1,
    status: 'Active'
  },
  {
    clientId: 4,
    clientName: 'GHI Development',
    contactPerson: 'Sarah Tan',
    email: 'sarah@ghi.com.sg',
    phone: '+65 6456 7890',
    address: '321 Marina Bay, Singapore 456789',
    companyId: 1,
    status: 'Active'
  }
];

const quotations = [
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
  }
];

// Insert data
async function insertData() {
  try {
    console.log('🚀 Starting data insertion...\n');
    
    // Insert clients first
    console.log('👥 Inserting clients...');
    await Client.deleteMany({});
    const clientResult = await Client.insertMany(clients);
    console.log(`✅ Inserted ${clientResult.length} clients:`);
    clientResult.forEach(c => {
      console.log(`   - ${c.clientName} (ID: ${c.clientId})`);
    });
    
    console.log('\n💼 Inserting quotations...');
    await Quotation.deleteMany({});
    const quotationResult = await Quotation.insertMany(quotations);
    console.log(`✅ Inserted ${quotationResult.length} quotations:`);
    quotationResult.forEach(q => {
      console.log(`   - ${q.quotationCode}: ${q.projectName} (${q.status}) - $${q.grandTotal.toLocaleString()}`);
    });
    
    // Show summary
    console.log('\n📊 Database Summary:');
    const clientCount = await Client.countDocuments();
    const quotationCount = await Quotation.countDocuments();
    console.log(`   - Clients: ${clientCount}`);
    console.log(`   - Quotations: ${quotationCount}`);
    
    // Show status breakdown
    const statusBreakdown = await Quotation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$grandTotal' }
        }
      }
    ]);
    
    console.log('\n📈 Quotation Status Breakdown:');
    statusBreakdown.forEach(item => {
      console.log(`   - ${item._id}: ${item.count} quotations ($${item.totalValue.toLocaleString()})`);
    });
    
  } catch (error) {
    console.error('❌ Error inserting data:', error);
  }
}

// Main function
async function main() {
  await connectDB();
  await insertData();
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  console.log('🎉 Sample data setup completed!');
  console.log('\n📝 You can now:');
  console.log('   1. Start your backend server');
  console.log('   2. Navigate to /quotations in your frontend');
  console.log('   3. View the sample quotations');
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});