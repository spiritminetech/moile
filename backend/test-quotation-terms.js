// Test script for Quotation Terms API
// Run this after starting your server: node test-quotation-terms.js

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testQuotationId = 12345;
const testTerms = [
  {
    quotationId: testQuotationId,
    termType: 'Payment',
    title: 'Payment Terms',
    description: '30 days from invoice date',
    sortOrder: 1
  },
  {
    quotationId: testQuotationId,
    termType: 'Payment',
    title: 'Advance Payment',
    description: '20% advance required',
    sortOrder: 2
  },
  {
    quotationId: testQuotationId,
    termType: 'Warranty',
    title: 'Warranty Period',
    description: '12 months workmanship',
    sortOrder: 3
  },
  {
    quotationId: testQuotationId,
    termType: 'General',
    title: 'Validity',
    description: 'Quote valid for 30 days',
    sortOrder: 4
  }
];

async function testAPI() {
  console.log('🧪 Testing Quotation Terms API...\n');

  try {
    // Test 1: Create terms
    console.log('1️⃣ Creating test terms...');
    const createdTerms = [];
    
    for (const term of testTerms) {
      const response = await fetch(`${BASE_URL}/quotation-terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(term)
      });
      
      const result = await response.json();
      if (result.success) {
        createdTerms.push(result.data);
        console.log(`✅ Created: ${term.title}`);
      } else {
        console.log(`❌ Failed to create: ${term.title}`, result.message);
      }
    }

    // Test 2: Get all terms for quotation
    console.log('\n2️⃣ Fetching all terms for quotation...');
    const getResponse = await fetch(`${BASE_URL}/quotations/${testQuotationId}/terms`);
    const getResult = await getResponse.json();
    
    if (getResult.success) {
      console.log(`✅ Found ${getResult.data.length} terms`);
      getResult.data.forEach(term => {
        console.log(`   - ${term.termType}: ${term.title}`);
      });
    } else {
      console.log('❌ Failed to fetch terms:', getResult.message);
    }

    // Test 3: Update a term
    if (createdTerms.length > 0) {
      console.log('\n3️⃣ Updating first term...');
      const termToUpdate = createdTerms[0];
      const updateResponse = await fetch(`${BASE_URL}/quotation-terms/${termToUpdate._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: '20% advance, balance in 30 days'
        })
      });
      
      const updateResult = await updateResponse.json();
      if (updateResult.success) {
        console.log('✅ Term updated successfully');
        console.log(`   New description: ${updateResult.data.description}`);
      } else {
        console.log('❌ Failed to update term:', updateResult.message);
      }
    }

    // Test 4: Reorder terms
    if (createdTerms.length >= 2) {
      console.log('\n4️⃣ Testing reorder functionality...');
      const reorderData = {
        terms: [
          { id: createdTerms[1]._id, sortOrder: 1 },
          { id: createdTerms[0]._id, sortOrder: 2 }
        ]
      };
      
      const reorderResponse = await fetch(`${BASE_URL}/quotation-terms/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reorderData)
      });
      
      const reorderResult = await reorderResponse.json();
      if (reorderResult.success) {
        console.log('✅ Terms reordered successfully');
      } else {
        console.log('❌ Failed to reorder terms:', reorderResult.message);
      }
    }

    // Test 5: Delete terms (cleanup)
    console.log('\n5️⃣ Cleaning up test data...');
    for (const term of createdTerms) {
      const deleteResponse = await fetch(`${BASE_URL}/quotation-terms/${term._id}`, {
        method: 'DELETE'
      });
      
      const deleteResult = await deleteResponse.json();
      if (deleteResult.success) {
        console.log(`✅ Deleted: ${term.title}`);
      } else {
        console.log(`❌ Failed to delete: ${term.title}`, deleteResult.message);
      }
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your server is running on http://localhost:5000');
  }
}

// Run tests
testAPI();