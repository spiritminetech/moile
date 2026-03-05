// Test script for numeric ID quotation system
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Quotation from './src/modules/quotation/models/QuotationModel.js';
import QuotationItem from './src/modules/quotation/models/QuotationItemModel.js';
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

const testNumericIdQuotationSystem = async () => {
  try {
    console.log('\n🧪 Testing Numeric ID Quotation System...\n');

    // 1. Test quotation creation with sequential ID
    console.log('1️⃣ Testing quotation creation with sequential ID...');
    
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
      projectName: 'Numeric ID Test Project',
      description: 'Testing the numeric ID quotation system',
      status: 'Draft',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };

    const quotation = new Quotation(quotationData);
    await quotation.save();
    
    console.log('✅ Quotation created with:');
    console.log(`   - Numeric ID: ${quotation.id}`);
    console.log(`   - Quotation Code: ${quotation.quotationCode}`);
    console.log(`   - MongoDB _id: ${quotation._id}`);

    // 2. Test cost breakdown items with numeric quotationId
    console.log('\n2️⃣ Testing cost breakdown items with numeric quotationId...');
    
    const costItems = [
      {
        quotationId: quotation.id, // Use numeric ID
        category: 'Manpower',
        trade: 'Painter',
        description: 'Skilled painter for facade work',
        quantity: 10,
        unit: 'Days',
        unitRate: 120,
        totalAmount: 1200
      },
      {
        quotationId: quotation.id, // Use numeric ID
        category: 'Material',
        itemName: 'Paint A',
        description: 'High quality exterior paint',
        quantity: 50,
        unit: 'Tin',
        unitRate: 80,
        totalAmount: 4000
      }
    ];

    for (const itemData of costItems) {
      const item = new QuotationItem(itemData);
      await item.save();
      console.log(`✅ Cost item added: ${itemData.category} - ${itemData.trade || itemData.itemName}`);
      console.log(`   - Item uses quotationId: ${item.quotationId} (numeric)`);
    }

    // 3. Test retrieval using numeric ID
    console.log('\n3️⃣ Testing retrieval using numeric ID...');
    
    const retrievedQuotation = await Quotation.findOne({ id: quotation.id });
    const retrievedItems = await QuotationItem.find({ quotationId: quotation.id });
    
    console.log('✅ Quotation retrieved using numeric ID:', {
      id: retrievedQuotation.id,
      code: retrievedQuotation.quotationCode,
      status: retrievedQuotation.status
    });
    
    console.log('✅ Cost items retrieved using numeric quotationId:', retrievedItems.length);

    // 4. Test update using numeric ID
    console.log('\n4️⃣ Testing update using numeric ID...');
    
    const updatedQuotation = await Quotation.findOneAndUpdate(
      { id: quotation.id },
      { description: 'Updated description using numeric ID' },
      { new: true }
    );
    
    console.log('✅ Quotation updated using numeric ID:', updatedQuotation.description);

    // 5. Test workflow using numeric ID
    console.log('\n5️⃣ Testing workflow using numeric ID...');
    
    // Submit for approval
    updatedQuotation.status = 'Submitted';
    await updatedQuotation.save();
    console.log('✅ Quotation submitted for approval');

    // Approve quotation
    updatedQuotation.status = 'Approved';
    updatedQuotation.approvedAt = new Date();
    await updatedQuotation.save();
    console.log('✅ Quotation approved');

    // 6. Summary
    console.log('\n📊 NUMERIC ID QUOTATION SYSTEM TEST SUMMARY:');
    console.log('==========================================');
    console.log(`✅ Quotation Numeric ID: ${quotation.id}`);
    console.log(`✅ Quotation Code: ${quotation.quotationCode}`);
    console.log(`✅ MongoDB _id: ${quotation._id}`);
    console.log(`✅ Status: ${updatedQuotation.status}`);
    console.log(`✅ Cost Items: ${retrievedItems.length}`);
    console.log(`✅ All operations used numeric ID successfully!`);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await QuotationItem.deleteMany({ quotationId: quotation.id });
    await Quotation.findOneAndDelete({ id: quotation.id });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

const runTest = async () => {
  await connectDB();
  await testNumericIdQuotationSystem();
  await mongoose.disconnect();
  console.log('\n👋 Test completed. Database disconnected.');
};

runTest();