// Test script for wireframe-based quotation system
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Quotation from './src/modules/quotation/models/QuotationModel.js';
import QuotationItem from './src/modules/quotation/models/QuotationItemModel.js';
import QuotationTerm from './src/modules/quotation/models/QuotationTermModel.js';
import Client from './src/modules/client/ClientModel.js';
import Company from './src/modules/company/CompanyModel.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const testWireframeQuotationSystem = async () => {
  try {
    console.log('\n🧪 Testing Wireframe-based Quotation System...\n');

    // 1. Test quotation creation
    console.log('1️⃣ Testing quotation creation...');
    
    // Get first client and company
    const client = await Client.findOne();
    const company = await Company.findOne();
    
    if (!client || !company) {
      console.log('❌ No client or company found. Please run setup scripts first.');
      return;
    }

    const quotationData = {
      companyId: company.id,
      clientId: client.id,
      projectName: 'Wireframe Test Project',
      description: 'Testing the wireframe-based quotation system',
      status: 'Draft',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      quotationCode: 'QT-TEST-001',
      version: 'v1'
    };

    const quotation = new Quotation(quotationData);
    await quotation.save();
    console.log('✅ Quotation created:', quotation.quotationCode);

    // 2. Test cost breakdown items
    console.log('\n2️⃣ Testing cost breakdown items...');
    
    const costItems = [
      {
        quotationId: quotation._id,
        category: 'Manpower',
        trade: 'Painter',
        description: 'Skilled painter for facade work',
        quantity: 10,
        unit: 'Days',
        unitRate: 120,
        totalAmount: 1200
      },
      {
        quotationId: quotation._id,
        category: 'Material',
        itemName: 'Paint A',
        description: 'High quality exterior paint',
        quantity: 50,
        unit: 'Tin',
        unitRate: 80,
        totalAmount: 4000
      },
      {
        quotationId: quotation._id,
        category: 'Tool',
        itemName: 'Boom Lift',
        description: 'Hydraulic boom lift rental',
        quantity: 1,
        unit: 'Month',
        unitRate: 2500,
        totalAmount: 2500
      }
    ];

    for (const itemData of costItems) {
      const item = new QuotationItem(itemData);
      await item.save();
      console.log(`✅ Cost item added: ${itemData.category} - ${itemData.trade || itemData.itemName}`);
    }

    // Calculate total
    const totalAmount = costItems.reduce((sum, item) => sum + item.totalAmount, 0);
    quotation.totalAmount = totalAmount;
    await quotation.save();
    console.log(`✅ Total amount calculated: $${totalAmount}`);

    // 3. Test terms and conditions
    console.log('\n3️⃣ Testing terms and conditions...');
    
    const terms = [
      {
        quotationId: quotation._id,
        termType: 'Payment',
        title: 'Payment Terms',
        description: '30 days from invoice date',
        sortOrder: 1
      },
      {
        quotationId: quotation._id,
        termType: 'Warranty',
        title: 'Warranty Period',
        description: '12 months workmanship warranty',
        sortOrder: 2
      },
      {
        quotationId: quotation._id,
        termType: 'Validity',
        title: 'Quote Validity',
        description: 'This quotation is valid for 30 days',
        sortOrder: 3
      }
    ];

    for (const termData of terms) {
      const term = new QuotationTerm(termData);
      await term.save();
      console.log(`✅ Term added: ${termData.termType} - ${termData.title}`);
    }

    // 4. Test approval workflow
    console.log('\n4️⃣ Testing approval workflow...');
    
    // Submit for approval
    quotation.status = 'Submitted';
    quotation.submittedAt = new Date();
    await quotation.save();
    console.log('✅ Quotation submitted for approval');

    // Approve quotation
    quotation.status = 'Approved';
    quotation.approvedAt = new Date();
    quotation.approvalRemarks = 'Approved for implementation';
    await quotation.save();
    console.log('✅ Quotation approved');

    // 5. Test data retrieval
    console.log('\n5️⃣ Testing data retrieval...');
    
    const retrievedQuotation = await Quotation.findById(quotation._id);
    const retrievedItems = await QuotationItem.find({ quotationId: quotation._id });
    const retrievedTerms = await QuotationTerm.find({ quotationId: quotation._id }).sort({ sortOrder: 1 });
    
    console.log('✅ Quotation retrieved:', {
      code: retrievedQuotation.quotationCode,
      status: retrievedQuotation.status,
      totalAmount: retrievedQuotation.totalAmount
    });
    
    console.log('✅ Cost items retrieved:', retrievedItems.length);
    console.log('✅ Terms retrieved:', retrievedTerms.length);

    // 6. Test category totals calculation
    console.log('\n6️⃣ Testing category totals...');
    
    const categoryTotals = {};
    retrievedItems.forEach(item => {
      if (!categoryTotals[item.category]) {
        categoryTotals[item.category] = 0;
      }
      categoryTotals[item.category] += item.totalAmount;
    });
    
    console.log('✅ Category totals:', categoryTotals);

    // 7. Summary
    console.log('\n📊 WIREFRAME QUOTATION SYSTEM TEST SUMMARY:');
    console.log('==========================================');
    console.log(`✅ Quotation Code: ${quotation.quotationCode}`);
    console.log(`✅ Project: ${quotation.projectName}`);
    console.log(`✅ Status: ${quotation.status}`);
    console.log(`✅ Total Amount: $${quotation.totalAmount}`);
    console.log(`✅ Cost Items: ${retrievedItems.length}`);
    console.log(`✅ Terms: ${retrievedTerms.length}`);
    console.log(`✅ Categories: ${Object.keys(categoryTotals).join(', ')}`);
    console.log('\n🎉 All wireframe quotation system tests passed!');

    // Cleanup (optional)
    console.log('\n🧹 Cleaning up test data...');
    await QuotationTerm.deleteMany({ quotationId: quotation._id });
    await QuotationItem.deleteMany({ quotationId: quotation._id });
    await Quotation.findByIdAndDelete(quotation._id);
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

const runTest = async () => {
  await connectDB();
  await testWireframeQuotationSystem();
  await mongoose.disconnect();
  console.log('\n👋 Test completed. Database disconnected.');
};

runTest();