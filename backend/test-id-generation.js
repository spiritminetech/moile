// Test ID generation
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import QuotationTerm from './src/modules/quotation/models/QuotationTermModel.js';

dotenv.config();

const testIdGeneration = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('Connected to MongoDB');

    // Test 1: Check existing records
    const allTerms = await QuotationTerm.find().sort({ id: 1 });
    console.log('Existing terms:', allTerms.map(t => ({ id: t.id, quotationId: t.quotationId, termType: t.termType })));

    // Test 2: Find last record
    const last = await QuotationTerm.findOne().sort({ id: -1 });
    console.log('Last term:', last);

    // Test 3: Generate next ID
    let nextId;
    if (last && typeof last.id === 'number' && !isNaN(last.id)) {
      nextId = last.id + 1;
    } else {
      nextId = 1;
    }
    console.log('Next ID would be:', nextId);

    // Test 4: Try creating a test record
    const testTerm = new QuotationTerm({
      id: nextId,
      quotationId: 12345,
      termType: 'General',
      title: 'Test Term',
      description: 'This is a test term',
      sortOrder: 1
    });

    console.log('Test term before save:', testTerm.toObject());
    
    const saved = await testTerm.save();
    console.log('Test term saved successfully:', saved.toObject());

    // Clean up - delete the test record
    await QuotationTerm.findOneAndDelete({ id: nextId });
    console.log('Test record cleaned up');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testIdGeneration();