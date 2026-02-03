// Debug current JWT token being used by mobile app
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Replace this with the actual token from mobile app
const TOKEN_FROM_MOBILE_APP = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjY0LCJjb21wYW55SWQiOjEsInJvbGVJZCI6NCwicm9sZSI6IldPUktFUiIsImVtYWlsIjoid29ya2VyMUBnbWFpbC5jb20iLCJwZXJtaXNzaW9ucyI6WyJBVFRFTkRBTkNFX1ZJRVciLCJDT01NT05fQVRURU5EQU5DRV9WSUVXIiwiUFJPRklMRV9WSUVXIiwiV09SS0VSX1RBU0tfVklFVyIsIldPUktFUl9UUklQX1ZJRVciLCJMRUFWRV9SRVFVRVNUX1ZJRVciLCJXT1JLRVJfVEFTS19VUERBVEUiLCJXT1JLRVJfQVRURU5EQU5DRV9WSUVXIiwiV09SS0VSX0FUVEVOREFOQ0VfVVBEQVRFIiwiV09SS0VSX0RBU0hCT0FSRF9WSUVXIiwiV09SS0VSX1BST0ZJTEVfVklFVyJdLCJpYXQiOjE3NzAwMzQzNTMsImV4cCI6MTc3MDA2MzE1M30.7lC22eiic6Nz4svnHzRPE0fyq3aw4e87cwtsAhqQvkc";

function debugCurrentToken() {
  try {
    console.log('🔍 Debugging current JWT token...');
    
    if (TOKEN_FROM_MOBILE_APP === "PASTE_TOKEN_HERE") {
      console.log('❌ Please replace TOKEN_FROM_MOBILE_APP with actual token from mobile app');
      return;
    }
    
    // Decode without verification to see contents
    const decoded = jwt.decode(TOKEN_FROM_MOBILE_APP);
    console.log('📊 Token contents:');
    console.log(JSON.stringify(decoded, null, 2));
    
    // Check if token has companyId
    if (decoded && decoded.companyId) {
      console.log(`✅ Token has companyId: ${decoded.companyId}`);
      console.log('✅ This token should work for project lookup');
    } else {
      console.log('❌ Token missing companyId - this is the problem!');
      console.log('❌ User needs to log out and log back in');
    }
    
  } catch (error) {
    console.error('❌ Error decoding token:', error.message);
  }
}

debugCurrentToken();