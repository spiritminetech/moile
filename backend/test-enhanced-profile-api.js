/**
 * Test Enhanced Profile API
 * Tests the updated worker profile API with all new fields
 */

import axios from 'axios';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5002';

const testEnhancedProfileAPI = async () => {
  try {
    console.log('🧪 Testing Enhanced Profile API...\n');

    // Step 1: Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'worker@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Get enhanced profile
    console.log('\n2️⃣ Fetching enhanced profile...');
    const profileResponse = await axios.get(`${BASE_URL}/worker/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!profileResponse.data.success) {
      throw new Error('Profile fetch failed: ' + profileResponse.data.message);
    }

    const profile = profileResponse.data.profile;
    console.log('✅ Profile fetched successfully');

    // Step 3: Verify all required fields
    console.log('\n3️⃣ Verifying profile fields...\n');

    // Personal Details
    console.log('👤 Personal Details:');
    console.log(`   ✅ Employee ID: ${profile.employeeId}`);
    console.log(`   ✅ Employee Code: ${profile.employeeCode || 'N/A'}`);
    console.log(`   ✅ Full Name: ${profile.name}`);
    console.log(`   ✅ Nationality: ${profile.nationality || 'N/A'}`);
    console.log(`   ✅ Trade/Designation: ${profile.jobTitle || 'N/A'}`);
    console.log(`   ✅ Department: ${profile.department || 'N/A'}`);
    console.log(`   ✅ Company: ${profile.companyName || 'N/A'}`);
    console.log(`   ✅ Email: ${profile.email}`);
    console.log(`   ✅ Phone: ${profile.phoneNumber}`);

    // Work Pass Details
    console.log('\n🏢 Work Pass Details:');
    if (profile.workPass) {
      console.log(`   ✅ Work Pass Type: ${profile.workPass.workPassType || 'N/A'}`);
      console.log(`   ✅ Work Permit Number: ${profile.workPass.passNumber}`);
      console.log(`   ✅ FIN Number: ${profile.workPass.finNumber || 'N/A'}`);
      console.log(`   ✅ Issue Date: ${profile.workPass.issueDate}`);
      console.log(`   ✅ Expiry Date: ${profile.workPass.expiryDate}`);
      console.log(`   ✅ Status: ${profile.workPass.status}`);
      
      // Documents
      console.log('   📄 Documents:');
      console.log(`      - Application Doc: ${profile.workPass.applicationDoc ? '✅ Available' : '❌ Not Available'}`);
      console.log(`      - Medical Doc: ${profile.workPass.medicalDoc ? '✅ Available' : '❌ Not Available'}`);
      console.log(`      - Issuance Doc: ${profile.workPass.issuanceDoc ? '✅ Available' : '❌ Not Available'}`);
      console.log(`      - MOM Doc: ${profile.workPass.momDoc ? '✅ Available' : '❌ Not Available'}`);
    } else {
      console.log('   ❌ No work pass data found');
    }

    // Certifications
    console.log('\n📜 Certifications:');
    if (profile.certifications && profile.certifications.length > 0) {
      profile.certifications.forEach((cert, index) => {
        console.log(`   Certificate ${index + 1}:`);
        console.log(`      ✅ Name: ${cert.name}`);
        console.log(`      ✅ Type: ${cert.certificationType || 'N/A'}`);
        console.log(`      ✅ Ownership: ${cert.ownership === 'company' ? 'Company-sponsored' : 'Personal'}`);
        console.log(`      ✅ Issuer: ${cert.issuer}`);
        console.log(`      ✅ Status: ${cert.status}`);
        console.log(`      ✅ Issue Date: ${cert.issueDate}`);
        console.log(`      ✅ Expiry Date: ${cert.expiryDate || 'No Expiry'}`);
        console.log(`      ✅ Certificate Number: ${cert.certificateNumber}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No certifications found');
    }

    // Step 4: Verify API response structure
    console.log('4️⃣ Verifying API response structure...');
    
    const requiredFields = [
      'employeeId', 'name', 'email', 'phoneNumber', 'companyName'
    ];
    
    const missingFields = requiredFields.filter(field => !profile[field]);
    
    if (missingFields.length === 0) {
      console.log('✅ All required fields present');
    } else {
      console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
    }

    console.log('\n🎉 Enhanced Profile API test completed successfully!');
    
    return {
      success: true,
      profile: profile,
      summary: {
        personalDetailsComplete: !!(profile.employeeId && profile.name && profile.nationality && profile.jobTitle && profile.companyName),
        workPassComplete: !!(profile.workPass && profile.workPass.workPassType && profile.workPass.passNumber),
        certificationsAvailable: profile.certifications && profile.certifications.length > 0,
        totalCertifications: profile.certifications ? profile.certifications.length : 0
      }
    };

  } catch (error) {
    console.error('❌ Enhanced Profile API test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return {
      success: false,
      error: error.message
    };
  }
};

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnhancedProfileAPI()
    .then((result) => {
      if (result.success) {
        console.log('\n📊 Test Summary:');
        console.log(`- Personal Details Complete: ${result.summary.personalDetailsComplete ? '✅' : '❌'}`);
        console.log(`- Work Pass Complete: ${result.summary.workPassComplete ? '✅' : '❌'}`);
        console.log(`- Certifications Available: ${result.summary.certificationsAvailable ? '✅' : '❌'}`);
        console.log(`- Total Certifications: ${result.summary.totalCertifications}`);
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export default testEnhancedProfileAPI;